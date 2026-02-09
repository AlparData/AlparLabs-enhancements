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
            # Move current record
            self.write({


                'connector_id': target_connector.id,
                'number': target_number,
                'agent_id': self.tmp_agent_id.id,
                'status': 'current',
                'tmp_agent_id': False,
            })
            target_conv = self
        else:
            # Conflict exists: must switch to the other record
            self.set_to_done()
            target_conv.write({'agent_id': self.tmp_agent_id.id, 'status': 'current'})
            self.tmp_agent_id = False
            
        # Create info message in target_conv
        target_conv._send_transfer_notification(target_connector)

        # Notification to target agent
        if target_connector.notify_discuss:
            target_conv.notify_discuss_to_user(self.tmp_agent_id, 'I delegated a Chat to you.')
            

        # Send notifications to update UI
        self._send_delegation_notifications(target_conv)
        
        return True

    def _link_conversations(self, target_conv):
        # Deprecated: replaced by info message in _delegate_to_different_connector
        pass

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
             
        # FORCE update to specific agent channel to ensure it appears
        target_conv.with_user(self.tmp_agent_id).env.user
        notifications.append((target_conv.get_channel_to_one(), 'update_conversation', data_target))
        
        self._sendmany(notifications)

