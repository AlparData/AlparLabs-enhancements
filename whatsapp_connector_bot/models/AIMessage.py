# -*- coding: utf-8 -*-
from odoo import models, fields


class AcruxChatMessages(models.Model):
    _inherit = 'acrux.chat.message'

    bot_id = fields.Many2one('acrux.chat.bot', 'Bot', readonly=True, ondelete='set null', copy=False)
    ai_event = fields.Selection([('bot_init', 'Bot Init'),
                                 ('human_init', 'Human Init'),
                                 ],
                                string='AI Event', readonly=True, copy=False)
    ai_aux_key = fields.Selection([('partner_info', 'Partner Info'),
                                   ('ask_docs', 'Ask Docs'),
                                   ], string='AI Key', copy=False)
