# -*- coding: utf-8 -*-
from odoo import models, fields, api
import logging
_logger = logging.getLogger(__name__)


class AcruxChatConversation(models.Model):
    _inherit = 'acrux.chat.conversation'

    bot_id = fields.Many2one('acrux.chat.bot', 'Bot', domain=[('is_ai', '=', True)],
                             group_expand='_read_group_bot_ids')
    ai_bot_served_by = fields.Selection([('ai', 'AI'),
                                         ('human', 'Human')], string='Served By')

    @api.model
    def get_fields_to_read(self):
        out = super(AcruxChatConversation, self).get_fields_to_read()
        out.extend(['bot_id'])
        return out

    @api.model
    def get_domain_filtering_js(self, search, filters, alias=None):
        js_domain = super().get_domain_filtering_js(search, filters, alias=alias)
        if filters.get('filterBots'):
            js_domain.append(('bot_id', 'in', filters.get('filterBots')))
        return js_domain

    @api.model
    def _read_group_bot_ids(self, bots, domain):
        return bots.search([('is_ai', '=', True)])

    def get_to_current(self):
        out = super(AcruxChatConversation, self).get_to_current()
        self.env['acrux.chat.bot'].bot_clean(self.id)
        out['ai_bot_served_by'] = 'human'
        return out

    def get_to_new(self):
        out = super(AcruxChatConversation, self).get_to_new()
        if self.status == 'current':
            # When delegating, it is handled by the AI
            out['ai_bot_served_by'] = False
        return out

    def get_to_done(self):
        out = super(AcruxChatConversation, self).get_to_done()
        out['ai_bot_served_by'] = False
        return out

    def search_partner_bot(self, domain=False):
        self.ensure_one()
        ResPartner = self.env['res.partner']
        if not domain:
            domain = [('company_id', 'in', [self.connector_id.company_id.id, False]),
                      ('conv_standard_numbers', 'like', self.number)]
        return ResPartner.search(domain)
