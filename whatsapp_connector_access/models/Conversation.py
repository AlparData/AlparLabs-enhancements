# -*- coding: utf-8 -*-
from odoo import models, api, _
from odoo.osv import expression
from odoo.exceptions import UserError


class Conversation(models.Model):
    _inherit = 'acrux.chat.conversation'

    @api.model
    def _search(self, domain, offset=0, limit=None, order=None):
        ctx = self.env.context
        if not (ctx.get('acrux_from_chatter') or ctx.get('acrux_from_message_wizard') or self.env.user._is_system()):
            access_domain = self.get_access_domain(domain)
            if access_domain:
                domain = expression.AND([access_domain, domain]) if domain else access_domain
        return super(Conversation, self)._search(domain, offset=offset, limit=limit, order=order)

    @api.model
    def get_access_domain(self, domain):
        return []

    def delegate_conversation(self):
        ''' is ensure_one '''
        if self.tmp_agent_id:
            domain = [('number', '=', self.number), ('connector_id', '=', self.connector_id.id)]
            env = self.with_user(self.tmp_agent_id).with_context(acrux_delegate_action=True)
            if not env.search(domain, limit=1).ids:
                raise UserError(_('The user has no access to this conversation.'))
        return super(Conversation, self).delegate_conversation()
