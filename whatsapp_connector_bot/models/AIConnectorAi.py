# -*- coding: utf-8 -*-
from odoo import models, fields


class AcruxChatBotAiConnector(models.Model):
    _name = 'acrux.chat.bot.ai.connector'
    _description = 'ChatBot AI Connector'
    _order = 'sequence, id'

    name = fields.Char('Name', required=True, copy=False)
    sequence = fields.Integer('Order', required=True, default=1)
    endpoint = fields.Char('API Endpoint', required=True, default='https://api.acruxlab.net/prod/v2/odoo')
    token = fields.Char('Token', required=True, copy=False)
    uuid = fields.Char('Account ID', required=True, copy=False)
    chatroom_hide_branding = fields.Boolean('Hide Branding', compute='_compute_hide_branding', store=False)
    verify = fields.Boolean('Verify SSL', default=True, help='Set False if SSLError: bad handshake - ' +
                                                             'certificate verify failed.')

    _sql_constraints = [
        ('name_uniq', 'unique (name)', 'Name must be unique.'),
        ('uuid_uniq', 'unique (uuid)', 'Account ID must be unique.'),
    ]

    def _compute_hide_branding(self):
        hide = self.env['ir.config_parameter'].sudo().get_param('chatroom.hide.branding', 'False') == 'True'
        self.chatroom_hide_branding = hide

    def log_data(self, req_type, url, param, data, header):
        pass

    def log_result(self, req_type, url, result, param, data, req):
        pass
