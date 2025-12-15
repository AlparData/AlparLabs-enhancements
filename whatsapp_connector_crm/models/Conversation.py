# -*- coding: utf-8 -*-
from odoo import models, fields, api, _


class AcruxChatConversation(models.Model):
    _inherit = 'acrux.chat.conversation'

    crm_lead_id = fields.Many2one('crm.lead', 'Lead', ondelete='set null')

    @api.model
    def get_fields_to_read(self):
        out = super(AcruxChatConversation, self).get_fields_to_read()
        out.extend(['crm_lead_id'])
        return out

    @api.model_create_multi
    def create(self, vals_list):
        conversations = super(AcruxChatConversation, self).create(vals_list)
        for conv in conversations:
            if not conv.crm_lead_id and conv.conv_type == 'normal':
                lead_vals = {
                    'name': _('WhatsApp: %s') % (conv.name or conv.number),
                    'partner_id': conv.res_partner_id.id,
                    'phone': conv.number,
                    'mobile': conv.number,
                    'user_id': conv.agent_id.id or self.env.user.id,
                    'type': 'lead',
                }
                lead = self.env['crm.lead'].create(lead_vals)
                conv.crm_lead_id = lead.id
        return conversations

    def write(self, vals):
        res = super(AcruxChatConversation, self).write(vals)
        if 'res_partner_id' in vals:
            for conv in self:
                if conv.crm_lead_id and not conv.crm_lead_id.partner_id and vals['res_partner_id']:
                    conv.crm_lead_id.partner_id = vals['res_partner_id']
        return res
