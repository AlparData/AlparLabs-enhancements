# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError


class Conversation(models.Model):
    _inherit = 'acrux.chat.conversation'

    delegation_target_connector_id = fields.Many2one('acrux.chat.connector', compute='_compute_delegation_target',
                                                     string='Target Connector')

    @api.depends('tmp_agent_id')
    def _compute_delegation_target(self):
        for rec in self:
            target = False
            if rec.tmp_agent_id and rec.tmp_agent_id.default_connector_id:
                if rec.tmp_agent_id.default_connector_id != rec.connector_id:
                    target = rec.tmp_agent_id.default_connector_id
            rec.delegation_target_connector_id = target

    def transfer_conversation(self):
        self.ensure_one()
        target_agent = self.tmp_agent_id
        if not target_agent:
            raise ValidationError(_('Please select an agent to transfer the conversation.'))
            
        if target_agent.default_connector_id:
            if target_agent.default_connector_id != self.connector_id:
                return self._delegate_to_different_connector(target_agent.default_connector_id)
        
        # If no default connector or same connector, we could raise error or fall back to delegate
        # Raising error is safer to avoid confusion about what "Transfer" means vs "Delegate"
        if not target_agent.default_connector_id:
             raise ValidationError(_('The selected agent does not have a default connector set.'))
        else:
             raise ValidationError(_('The selected agent is on the same connector. Use Delegate instead.'))

    def _delegate_to_different_connector(self, target_connector):
        self.ensure_one()
        # Clean number for target connector
        target_number = target_connector.clean_id(self.number)
        
        # Check if conversation exists
        domain = [
            ('connector_id', '=', target_connector.id),
            ('number', '=', target_number),
            ('conv_type', '=', self.conv_type)
        ]
        target_conv = self.search(domain, limit=1)
        
        if not target_conv:
            # Create new conversation
            vals = {
                'name': self.name,
                'number': target_number,
                'connector_id': target_connector.id,
                'conv_type': self.conv_type,
                'res_partner_id': self.res_partner_id.id,
                'status': 'new',
                'team_id': self.team_id.id,
                'priority': self.priority,
            }
            # Copy other relevant fields if needed
            target_conv = self.create(vals)
        
        # Basic validation for access rights on target connector
        # We assume if the agent is assigned to this connector, they have access
        # But we can check if we want to be strict.
        
        # Link conversations (Option 1)
        self._link_conversations(target_conv)
        
        # Assign agent to target conversation and set to current
        target_conv.with_user(self.tmp_agent_id).set_to_current()
        
        # Notification to target agent
        if target_connector.notify_discuss:
            target_conv.notify_discuss_to_user(self.tmp_agent_id, 'I delegated a Chat to you (from %s).' % self.connector_id.name)
            
        # Update source conversation
        self.tmp_agent_id = False
        self.set_to_done()
        
        # Send notifications to update UI
        self._send_delegation_notifications(target_conv)
        
        return True

    def _link_conversations(self, target_conv):
        # Create info messages linking them
        Message = self.env['acrux.chat.message']
        
        # Message in Source
        Message.create({
            'contact_id': self.id,
            'ttype': 'info',
            'from_me': True,
            'text': _('Conversation delegated to %s on %s.') % (self.tmp_agent_id.name, target_conv.connector_id.name)
        })
        
        # Message in Target
        Message.create({
            'contact_id': target_conv.id,
            'ttype': 'info',
            'from_me': True,
            'text': _('Conversation delegated from %s (Agent: %s).') % (self.connector_id.name, self.agent_id.name or self.env.user.name)
        })

    def _send_delegation_notifications(self, target_conv):
        # Notify source changes
        notifications = []
        data_source = self.build_dict(22)
        notifications.append((self.get_channel_to_many(), 'update_conversation', data_source))
        
        # Notify target changes (to the new agent)
        # We need to make sure the new agent receives the new conversation
        data_target = target_conv.build_dict(22)
        target_channel = target_conv.get_channel_to_many()
        
        # If channels are different (likely different companies or just separate streams), send to both
        if target_channel != self.get_channel_to_many():
             notifications.append((target_channel, 'new_messages', data_target))
        else:
             notifications.append((self.get_channel_to_many(), 'new_messages', data_target))
             
        # Also notify specific agent channel if needed, as per original delegate_conversation
        # Original: notifications.append((self.get_channel_to_one(), 'update_conversation', data))
        
        self._sendmany(notifications)

