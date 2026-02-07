# -*- coding: utf-8 -*-
from odoo import models, fields


class ResUsers(models.Model):
    _inherit = 'res.users'

    default_connector_id = fields.Many2one(
        'acrux.chat.connector',
        string='Default Connector',
        help='Connector used when delegating a conversation to this user. '
             'If set, delegated conversations from other connectors will be transferred to this one.'
    )
