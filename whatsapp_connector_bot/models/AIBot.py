# -*- coding: utf-8 -*-
import datetime
import logging
from random import randint
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from . import tools

_logger = logging.getLogger(__name__)


FIELDS_AFFECTS_RELATED_BOTS = []
FIELDS_TO_WATCH = FIELDS_AFFECTS_RELATED_BOTS + ['ai_agent_name', 'ai_company_prompt', 'ai_service_prompt',
                                                 'ai_style_prompt', 'ai_objective_prompt', 'ai_products_prompt',
                                                 'action_ids', 'ai_predefined_ids', 'ai_steps_to_follow_prompt',
                                                 'model_info_ids']


class AcruxChatBot(models.Model):
    _inherit = 'acrux.chat.bot'

    def _get_use_ai(self):
        if 'default_is_ai' in self.env.context:
            is_ai = self.env.context.get('default_is_ai')
        else:
            is_ai = bool(self.env['ir.config_parameter'].sudo().get_param('chatroom.bot.use_ai', 'False') == 'True')
        return is_ai

    def _get_default_color(self):
        return randint(1, 11)

    is_ai = fields.Boolean('Use AI', default=_get_use_ai)
    ai_send_contact = fields.Boolean('Send Contact Information to AI',
                                     help='Activate only if the information needs to be analyzed by AI.')
    fold = fields.Boolean('Folded in Pipeline')
    ai_bot_type = fields.Selection([('bot', 'Bot'),
                                    ('state', 'State')],
                                   string='Bot Type', required=True, default='bot')
    ai_connector_id = fields.Many2one('acrux.chat.bot.ai.connector', 'AI Connector', ondelete='restrict')
    contact_ids = fields.One2many('acrux.chat.conversation', 'bot_id', string='Chat')
    external_id = fields.Integer('External ID')
    external_status = fields.Selection([('updated', 'Updated'),
                                        ('to_update', 'Outdated'),
                                        ('to_update_related', 'Outdated')],
                                       string='External Status', required=True, default='to_update', copy=False)
    test_contact_id = fields.Many2one('acrux.chat.conversation', string='Test Chat', copy=False)
    color = fields.Integer('Color', default=_get_default_color, required=True)
    color_text = fields.Char('Icon Color', size=7, compute='_compute_color_text')

    # --- company ---
    ai_agent_name = fields.Char('Agent Name')
    ai_company_name = fields.Char('Company Name')
    ai_company_info = fields.Text('Company Info', help='Company Info')
    ai_company_prompt = fields.Text('Company Result', help='Final text that will be sent to the AI.')
    # --- What You Offer ---
    ai_service_info = fields.Text('What You Offer', help='No Product details. Description of what you offer, '
                                                         'type of Products or Services.')
    ai_service_prompt = fields.Text('Service Result', help='Final text that will be sent to the AI.')
    # --- Steps to Follow (Pasos a seguir en Vambe) ---
    ai_steps_to_follow_prompt = fields.Text('List of Steps to Follow')
    # --- Formato y Estilo de respuesta:
    ai_style_info = fields.Text('Format and Style of Response', help='Info')
    ai_style_prompt = fields.Text('Format and Style of Response Result', help='Final text that will be sent to the AI.')
    # --- Objetivo del Asistente:
    ai_objective_info = fields.Text('Assistant Objective', help='Info')
    ai_objective_prompt = fields.Text('Assistant Objective Result', help='Final text that will be sent to the AI.')
    # --- Productos ---
    ai_products_info = fields.Text('Categories or Products', help='Info')
    ai_products_prompt = fields.Text('Categories or Products Result', help='Final text that will be sent to the AI.')
    # --- Casos posibles ---
    action_ids = fields.One2many('acrux.chat.bot.action', 'bot_id', string='Actions')

    ai_predefined_ids = fields.One2many('acrux.chat.bot.predefined.ai', 'bot_id', string='Predefined Messages')
    model_info_ids = fields.Many2many('acrux.chat.bot.model.info', string='Report documents to AI',
                                      domain=[('available', '=', True)],
                                      help='Information about these documents will be sent to the AI.')

    def write(self, vals):
        if 'external_status' not in vals:
            if any([key in vals for key in FIELDS_TO_WATCH]):
                vals['external_status'] = 'to_update'
            if any([key in vals for key in FIELDS_AFFECTS_RELATED_BOTS]):
                vals['external_status'] = 'to_update_related'
        return super(AcruxChatBot, self).write(vals)

    def unlink(self):
        for r in self:
            if r.external_id:
                raise ValidationError(_('First delete external config'))
        return super(AcruxChatBot, self).unlink()

    @api.depends('color')
    def _compute_color_text(self):
        # copiado de connector
        # buscar "$o-colors: " en .scss
        colors = ['#FFFFFF', '#F06050', '#F4A460', '#F7CD1F', '#6CC1ED', '#814968', '#EB7E7F',
                  '#2C8397', '#475577', '#D6145F', '#30C381', '#9365B8']
        for record in self:
            record.color_text = colors[record.color or 0]

    def optimize_ai(self):
        return tools.optimize_ai(self)

    def prompt_save(self):
        return tools.prompt_save(self)

    def prompt_delete(self):
        return tools.prompt_delete(self)
        # self.ensure_one()
        # if self.external_id:
        #   self.ai_connector_id.make_request(f'prompts/{self.external_id}', method='delete', ignore_error_status=[404])
        #     self.external_id = False

    @api.model
    def bot_get_ai(self, bot_id, conv_id, mess_id=None):
        return tools.bot_get_ai(self, bot_id, conv_id, mess_id)

    @api.model
    def bot_get_ai_id(self, bot, conv):
        bot_id = self.browse(bot)
        conv_id = self.env['acrux.chat.conversation'].browse(conv)
        _bot_id, msg, _actions = self.bot_get_ai(bot_id, conv_id)
        return msg.get('text', '')

    @api.model
    def add_log_ai(self, conv_id, ttype=False, log=[]):
        bot_log = '\n'.join(log) if type(log) is list else log
        if conv_id.connector_id.bot_log:
            self.env['acrux.chat.bot.log'].sudo().create({
                'conversation_id': conv_id.id,
                'text': ttype,
                'bot_log': bot_log,
            })
        else:
            _logger.info(f'\nChat: {conv_id.name}\nType: {ttype}\n{bot_log}')

    def copy_original_definition(self):
        return True

    @api.model
    def ai_get_partner_info(self, p_id):
        if p_id:
            login = False
            if p_id.partner_share:
                login = [x.login for x in p_id.user_ids if x.share]
            login = ', '.join(login) if login else (
                _('User is not registered, does not have a username to log in. No access to User Panel.'))
            return {
                'login_username': login,
                'name': p_id.name,
                'email': p_id.email,
                'phone': p_id.phone,
                'mobile': p_id.mobile,
                'vat': p_id.vat,
                'address': {
                    'street': p_id.street,
                    'city': p_id.city,
                    'state': p_id.state_id.name if p_id.state_id else '',
                    'zip': p_id.zip,
                    'country': p_id.country_id.name if p_id.country_id else ''
                }
            }
        else:
            return _('User has no contact information.')

    def ai_get_partner_docs(self, conv_id):
        self.ensure_one()
        res = {}
        model_info = [m.ttype for m in self.model_info_ids if m.available]
        p_id = conv_id.res_partner_id
        if p_id:
            for MODEL in model_info:
                model = MODEL.split(',')[1]
                if MODEL == 'crm,crm.lead':
                    # Oportunidad más reciente y abierta
                    docs = self.env[model].search([('partner_id', '=', p_id.id),
                                                   ('stage_id.is_won', '=', False)],
                                                  order='create_date desc', limit=1)
                    res['open_opportunities'] = [{'name': x.name,
                                                  'date': self.ai_tool_date_iso(x.create_date),
                                                  'internal': {'model': model, 'id': x.id}
                                                  } for x in docs]

                elif MODEL == 'account,account.move':
                    # Facturas con monto adeudado
                    docs = self.env[model].search([('partner_id', '=', p_id.id),
                                                   ('move_type', '=', 'out_invoice'),
                                                   ('amount_residual', '>', 0)])
                    res['unpaid_invoices'] = [{'number': x.name,
                                               'total': x.amount_total,
                                               'amount_unpaid': x.amount_residual,
                                               'date': self.ai_tool_date_iso(x.invoice_date),
                                               'internal': {'model': model, 'id': x.id}
                                               } for x in docs]

                elif MODEL == 'sale_subscription,sale.order':
                    # Suscripciones activas y para renovar
                    docs = self.env[model].search([('is_subscription', '=', True),
                                                   ('partner_id', '=', p_id.id),
                                                   ('state', '=', 'sale'),
                                                   ('subscription_state', '=', '3_progress'),
                                                   ('payment_exception', '=', True),
                                                   ('recurring_next_date', '!=', False)])
                    res['unpaid_subscriptions'] = [{'name': x.name,
                                                    'renewal_period': x.plan_id.name if x.plan_id else 'No renewal',
                                                    'internal': {'model': model, 'id': x.id}
                                                    } for x in docs]

                elif MODEL == 'sale,sale.order':
                    # Pedidos de venta sin pagar
                    docs = self.env[model].search([('partner_id', '=', p_id.id),
                                                   ('invoice_status', '!=', 'invoiced')])
                    res['unpaid_sales_orders'] = [{'name': x.name,
                                                   'total': x.amount_total,
                                                   'date': self.ai_tool_date_iso(x.date_order),
                                                   'internal': {'model': model, 'id': x.id}
                                                   } for x in docs]

                elif MODEL == 'helpdesk,helpdesk.ticket':
                    # Ticket de soporte más reciente y abierto
                    docs = self.env[model].search([('partner_id', '=', p_id.id),
                                                   ('stage_id.is_closed', '=', False)],
                                                  order='create_date desc')
                    res['open_support_ticket'] = [{'name': x.name,
                                                   'team': x.team_id.name,
                                                   'internal': {'model': model, 'id': x.id}
                                                   } for x in docs]

                elif MODEL == 'calendar,calendar.event':
                    # Evento de calendario más cercano
                    start_date = fields.Datetime.now().replace(hour=0, minute=0, second=0)
                    docs = self.env['calendar.event'].search([('start_date', '>=', start_date),
                                                              ('partner_ids', 'in', p_id.id)],
                                                             order='start_date desc')
                    res['next_calendar_events'] = [{'name': x.name,
                                                    'start_date': self.ai_tool_date_iso(x.start_date),  # todo: tz?
                                                    'internal': {'model': model, 'id': x.id}
                                                    } for x in docs]
        return res or _('There are no documents.')

    @api.model
    def ai_tool_date_iso(self, value):
        if not value:
            return False
        if not isinstance(value, (datetime.date, datetime.datetime)):
            value = fields.Datetime.to_datetime(value)
        return value.replace(microsecond=0).isoformat() + 'Z'

    def ai_test_clean(self):
        self.ensure_one()
        conv_id = self.test_contact_id
        conv_id.bot_id = self.id
        conv_id.ai_bot_served_by = False
        turns_to_del = self.env.context.get('turns_to_del')
        if turns_to_del:
            Message = self.env['acrux.chat.message'].with_context(active_test=False)
            messages = Message.search([('contact_id', '=', conv_id.id)], order='create_date desc', limit=50)
            to_del = Message
            turns = count = 0
            for mess_id in messages:
                count += 1
                to_del |= mess_id
                if not mess_id.from_me:
                    turns += 1
                if turns == turns_to_del:
                    to_del.unlink()
                    break
            _logger.info(f'________ | ai_test_clean: Deleting {count} messages, {turns} turns')

        if self.env.context.get('clean_partner'):
            conv_id.res_partner_id.unlink()

        if self.env.context.get('clean_docs'):
            _fields = conv_id._fields
            if 'crm_lead_id' in _fields:
                conv_id.crm_lead_id.unlink()
            if 'sale_order_id' in _fields:
                conv_id.sale_order_id.unlink()
            if 'ticket_id' in _fields:
                conv_id.ticket_id.unlink()


class AcruxChatBotAction(models.Model):
    _name = 'acrux.chat.bot.action'
    _description = 'ChatBot AI Actions'
    _order = 'sequence, id'

    name = fields.Text('When Activate the Action?', required=True, copy=False)
    sequence = fields.Integer('Order', required=True, default=90)
    bot_id = fields.Many2one('acrux.chat.bot', 'Bot Action', required=True, ondelete='cascade')
    action_bot_id = fields.Many2one('acrux.chat.bot', 'Bot', ondelete='restrict',
                                    domain="[('is_ai', '=', True), ('id', '!=', bot_id)]")
    action_type_id = fields.Many2one('acrux.chat.bot.action.type', 'Action', required=True, ondelete='restrict')
    action_type_id_key = fields.Char('Key', related='action_type_id.key', store=False)
    template_id = fields.Many2one('mail.template', 'Template',
                                  domain="[('model', '=', model), ('name', 'ilike', 'ChatRoom')]")
    model = fields.Char('Related Model', compute='_compute_model', store=False)
    option = fields.Char('Options', compute='_compute_option', store=False)
    parameters = fields.Text('Parameters')

    _sql_constraints = [
        ('name_uniq', 'unique (name)', 'Name must be unique.')
    ]

    @api.constrains('name')
    def _check_constrains(self):
        for rec in self:
            if rec.name and len(rec.name) > 140:
                raise ValidationError(_('"%s" exceeds the allowed length of %s') % (_('When Activate the Action'), 120))

    @api.depends('action_type_id')
    def _compute_model(self):
        for rec in self:
            rec.model = 'res.partner'

    @api.depends('action_type_id', 'action_bot_id', 'template_id')
    def _compute_option(self):
        for rec in self:
            if rec.action_type_id_key == 'action_to_switch_bot':
                rec.option = '%s' % (rec.action_bot_id.name)
            else:
                rec.option = False


class AcruxChatBotActionType(models.Model):
    _name = 'acrux.chat.bot.action.type'
    _description = 'ChatBot AI Action Types'
    _order = 'sequence, id'

    name = fields.Char('Name', required=True, copy=False)
    key = fields.Char('Key', required=True, copy=False)
    sequence = fields.Integer('Order', required=True, default=1)

    _sql_constraints = [
        ('key_uniq', 'unique (key)', 'Key must be unique.')
    ]


class AcruxChatBotPredefined(models.Model):
    _name = 'acrux.chat.bot.predefined.ai'
    _description = 'ChatBot AI Predefined Messages'
    _order = 'sequence, id'

    name = fields.Char('Purpose', required=True)
    message = fields.Text('Message', required=True)
    sequence = fields.Integer('Order', required=True, default=1)
    bot_id = fields.Many2one('acrux.chat.bot', 'Bot Action', required=True, ondelete='cascade')

    _sql_constraints = [
        ('name_uniq', 'unique (name)', 'Name must be unique.')
    ]

    @api.constrains('name', 'message')
    def _check_constrains(self):
        for rec in self:
            if rec.name and len(rec.name) > 140:
                raise ValidationError(_('"%s" exceeds the allowed length of %s') % (_('Purpose'), 140))
            if rec.message and len(rec.message) > 250:
                raise ValidationError(_('"%s" exceeds the allowed length of %s') % (_('Example Message'), 250))


class AcruxChatBotModelInfo(models.Model):
    _name = 'acrux.chat.bot.model.info'
    _description = 'Information of models for AI'

    AVAILABLE_MODELS = [
        ('crm,crm.lead', 'CRM Leads'),
        ('sale,sale.order', 'Sale Orders'),
        ('sale_subscription,sale.order', 'Sale Subscriptions'),
        ('account,account.move', 'Invoices'),
        ('helpdesk,helpdesk.ticket', 'Helpdesk Tickets'),
        # ('calendar,calendar.event', 'Calendar Events'),  # todo: implementar
    ]

    @api.depends('ttype')
    def _compute_available(self):
        Module = self.env['ir.module.module'].sudo()
        for record in self:
            module, _model = record.ttype.split(',')
            module_obj = Module.search([('name', '=', module), ('state', '=', 'installed')], limit=1)
            # model_rec = self.env['ir.model'].sudo().search([('model', '=', model)], limit=1)
            record.available = bool(module_obj)

    ttype = fields.Selection(selection=AVAILABLE_MODELS, string='Type', required=True)
    name = fields.Char(string='Description', required=True)
    available = fields.Boolean(compute='_compute_available', string='Available', store=True)
