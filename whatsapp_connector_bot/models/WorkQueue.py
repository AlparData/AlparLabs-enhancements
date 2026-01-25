# -*- coding: utf-8 -*-
import traceback
import logging
from odoo import models, api, fields, _
from odoo.addons.whatsapp_connector.tools import date2sure_write, printlog
from markupsafe import Markup
from . import tools

_logger = logging.getLogger(__name__)


class WorkQueue(models.Model):
    _inherit = 'acrux.chat.work.queue'

    def job_postcommit(self, message_id, parse_data):
        super().job_postcommit(message_id, parse_data)
        if not message_id or message_id.contact_id.status == 'current':
            return
        if message_id.connector_id.use_ai and message_id.contact_id.ai_bot_served_by != 'human':
            self.ai_run(message_id.contact_id, message_id)
        else:
            rollback = False
            try:
                messages = self.env['acrux.chat.bot']._bot_get(message_id)
                rollback = bool(messages)
                for mess in messages:
                    self.env.cr.commit()  # commit time, para rollback de send_message ?
                    message_id.contact_id.send_message(mess, check_access=False)
                if message_id.contact_id.status == 'done':
                    # When BOT change status to 'done'
                    if messages:  # commit de send_message ?
                        self.env.cr.commit()
                    message_id.contact_id.release_conversation()
                elif message_id.contact_id.status == 'current':
                    # When BOT change status to 'current'. Agent required !
                    if messages:  # commit de send_message ?
                        self.env.cr.commit()
                    if message_id.contact_id.agent_id:
                        message_id.contact_id.tmp_agent_id = message_id.contact_id.agent_id.id
                        message_id.contact_id.delegate_conversation()
            except Exception as e:
                msg = "BOT error: rollback=%s - %s - %s" % (rollback, message_id, message_id.contact_id)
                _logger.warning(msg)
                if rollback:
                    self.env.cr.rollback()
                _logger.exception(e)
                self.env['acrux.chat.bot.log'].sudo().create({
                    'conversation_id': message_id.contact_id.id,
                    'text': message_id.text,
                    'bot_log': '%s\n%s' % (msg, traceback.format_exc()),
                })

    @api.model
    def ai_run(self, conv_id, message_id=None, ai_repeat=0):
        return tools.ai_run(self, conv_id, message_id, ai_repeat)

    @api.model
    def ai_bot_actions(self, conv_id, bot_id, msg, actions):
        need_repeat = False
        messages = []
        if not bot_id:
            conv_id.bot_id = False
            conv_id.ai_bot_served_by = False
            return [msg], need_repeat

        def del_partner_info(conv_id):
            if conv_id.bot_id.ai_send_contact:
                mess_ids = conv_id.chat_message_ids[:20]
                mess_ids.filtered(lambda x: x.ttype == 'info_hidden' and x.ai_aux_key == 'partner_info').unlink()

        if conv_id.ai_bot_served_by != 'ai':
            conv_id.ai_bot_served_by = 'ai'
        if not conv_id.bot_id or conv_id.bot_id != bot_id:
            conv_id.bot_id = bot_id.id
            self.ai_tool_event(conv_id, conv_id.bot_id, 'bot_init')

        for action in actions:
            need_commit = False
            try:
                key = action.get('id', '')
                data = action.get('parameters', {})
                summary = action.get('summary', '')
                printlog('- action: %s\n- parameters: %s\nsummary: %s' % (key, data, summary))

                if key == 'action_to_human':
                    conv_id.bot_id = self.env.ref('whatsapp_connector_bot.acrux_bot_to_human').id
                    conv_id.ai_bot_served_by = 'human'
                    self.ai_tool_event(conv_id, conv_id.bot_id, 'human_init')
                    if summary:
                        self.ai_tool_info_message(conv_id, summary)
                elif key == 'action_close':
                    conv_id.status = 'done'
                    conv_id.ai_bot_served_by = False
                    msg = ''
                    if summary:
                        self.ai_tool_info_message(conv_id, summary)
                elif key == 'action_ask_docs':
                    del_partner_info(conv_id)
                    text = bot_id.ai_get_partner_docs(conv_id)
                    self.ai_tool_info_message(conv_id, text, ttype='info_hidden', key='ask_docs')
                    need_commit = True
                    need_repeat = True
                    msg = ''
                elif key.startswith('action_to_switch_bot__'):
                    new_bot_id = False
                    id = key.split('__')[1]
                    if id.isnumeric():
                        new_bot_id = self.env['acrux.chat.bot'].search([('id', '=', int(id))], limit=1)
                        if new_bot_id:
                            conv_id.bot_id = new_bot_id.id
                            self.ai_tool_event(conv_id, conv_id.bot_id, 'bot_init')
                            txt = _('Transferred to %s\n') % new_bot_id.name
                            if summary:
                                txt += summary
                            self.ai_tool_info_message(conv_id, txt)
                            need_commit = True
                            need_repeat = True
                            msg = ''
                    if not new_bot_id:
                        self.env['acrux.chat.bot'].add_log_ai(conv_id, 'Error', [
                            'The action did not find the BOT.',
                            f'ID: {id}',
                            f'BOT Origin: {bot_id.name}',
                        ])
                elif key == 'action_create_contact':
                    if conv_id.connector_id.is_facebook_or_instagram():
                        Partner = self.env['res.partner']
                    else:
                        Partner = self.env['res.partner'].with_context(default_mobile=conv_id.number)
                    partner_id = conv_id.res_partner_id

                    to_write, not_use = self.ai_tool_fields_to_write(Partner, data)
                    if 'name' not in to_write or not to_write['name']:
                        to_write['name'] = conv_id.name or _('Unnamed')
                    printlog('action_create_contact:\n- not_use: %s\n- to_write: %s\n- summary: %s' %
                             (not_use, to_write, summary))
                    if conv_id.res_partner_id:
                        conv_id.res_partner_id.write(to_write)
                        self.ai_tool_info_message(conv_id, _('Contact has been edited.'))
                    else:
                        partner_id = Partner.create(to_write)
                        conv_id.res_partner_id = partner_id.id
                        self.ai_tool_info_message(conv_id, _('Contact has been created.'))
                    del_partner_info(conv_id)
                    need_commit = True
                    need_repeat = True
                    msg = ''
                elif key == 'action_create_crm':
                    if 'crm.lead' in self.env and 'crm_lead_id' in self.env['acrux.chat.conversation']._fields:
                        if conv_id.connector_id.is_facebook_or_instagram():
                            Leads = self.env['crm.lead']
                        else:
                            Leads = self.env['crm.lead'].with_context(default_phone=conv_id.number,
                                                                      default_mobile=conv_id.number)
                        lead_id = conv_id.crm_lead_id
                        if not lead_id or not lead_id.active or lead_id.stage_id.is_won:
                            lead_id = Leads

                        to_write, not_use = self.ai_tool_fields_to_write(Leads, data)
                        if 'description' not in to_write:
                            to_write['description'] = summary
                        if 'name' not in to_write or not to_write['name']:
                            to_write['name'] = conv_id.name
                        if 'partner_id' not in to_write or not to_write['partner_id']:
                            if conv_id.res_partner_id:
                                to_write['partner_id'] = conv_id.res_partner_id.id
                        if lead_id:
                            lead_id.description = (_('%s\n\nNew information: %s') %
                                                   (lead_id.description, summary)).strip()
                            if not lead_id.partner_id and to_write.get('partner_id'):
                                lead_id.partner_id = to_write.get('partner_id')
                            body = '\n'.join(['%s: %s' % (x, data.get(x, ''))
                                              for x in data if x not in ['id'] and data[x]])
                            lead_id.message_post(
                                body=Markup(body),
                                author_id=self.env.user.partner_id.id,
                                message_type='comment',
                                subtype_xmlid='mail.mt_comment'
                            )
                            self.ai_tool_info_message(conv_id, _('CRM Lead has been edited.') + f'\n{body}')
                            printlog('action_create_crm YA EXISTE!!\nnot_use: %s\nto_write: %s\nsummary: %s' %
                                     (not_use, to_write, summary))
                        else:
                            seq = (Leads.sudo().search([], order='id desc', limit=1).id or 0) + 1
                            to_write['name'] = f'{to_write["name"]} [{seq}]'
                            printlog('action_create_crm\nnot_use: %s\nto_write: %s\nsummary: %s' %
                                     (not_use, to_write, summary))
                            lead_id = Leads.create(to_write)
                            conv_id.crm_lead_id = lead_id.id
                            self.ai_tool_info_message(conv_id, _('CRM Lead has been created.'))
                        if summary:
                            self.ai_tool_info_message(conv_id, summary)
                        need_commit = True
                        need_repeat = True
                        msg = ''
                elif key == 'action_add_note':
                    note = '%s\n%s' % (data.get('info', ''), conv_id.note)
                    conv_id.note = note.strip()
                    if summary:
                        self.ai_tool_info_message(conv_id, summary)
                    need_commit = True
                elif key == 'action_add_reminder':
                    short_summary = data.get('short_summary', '')
                    ttype = data.get('type', '')  # [to-do, chatroom]
                    type_id = False
                    if ttype == 'chatroom':
                        type_id = self.env.ref('whatsapp_connector.chatroom_activity_type', raise_if_not_found=False)
                    if ttype != 'chatroom' or not type_id:
                        type_id = self.env.ref('mail.mail_activity_data_todo')
                    printlog('action_add_reminder\n%s\n%s\n%s' % (type_id, summary, short_summary))
                    user_id = (conv_id.agent_id or conv_id.tmp_agent_id or
                               conv_id.res_partner_id.user_id or self.env.user)
                    actividad_vals = {
                        'activity_type_id': type_id.id,
                        'summary': short_summary,
                        'note': summary,  # Notas
                        'date_deadline': date2sure_write(data.get('date', fields.Date.today())),
                        'user_id': user_id.id,
                        'res_id': conv_id.id,
                        'res_model_id': self.env['ir.model']._get('acrux.chat.conversation').id,
                    }
                    self.env['mail.activity'].create(actividad_vals)
                    if summary:
                        self.ai_tool_info_message(conv_id, summary)
                    need_commit = True
            except Exception as e:
                self.env.cr.rollback()
                _logger.exception(e)
                self.env['acrux.chat.bot'].add_log_ai(conv_id, 'Error', [f'action: {action}', traceback.format_exc()])
            if need_commit:
                self.env.cr.commit()
        if msg:
            messages = [msg] + messages
        return messages, need_repeat

    @api.model
    def ai_bot_messages_and_status(self, conv_id, messages, process_status=True):
        for mess in messages:
            conv_id.send_message(mess, check_access=False)
        if process_status:
            if conv_id.status == 'done':
                conv_id.release_conversation()
            elif conv_id.status == 'current':
                if conv_id.agent_id:
                    conv_id.tmp_agent_id = conv_id.agent_id.id
                    conv_id.delegate_conversation()

    # --- TOOLS ---
    @api.model
    def ai_tool_fields_to_write(self, model_obj, input_vals):
        if not input_vals:
            return {}, {}

        result = {}
        not_use = {}
        protected_fields = ['id', 'create_date', 'write_date', 'create_uid', 'write_uid']

        # Obtener la información de todos los campos de entrada usando fields_get
        fields_info = model_obj.fields_get(allfields=list(input_vals.keys()),
                                           attributes=['readonly', 'compute', 'type', 'relation', 'store'])

        for field_name, field_value in input_vals.items():
            field_info = fields_info.get(field_name)
            if not field_info:
                not_use[field_name] = _('Not found.')
                continue

            # Si el campo es readonly, computado o está en la lista de protegidos, se ignora.
            if (field_info.get('readonly') or field_info.get('compute') or not field_info.get('store', True)
                    or field_name in protected_fields):
                not_use[field_name] = _('Not writable.')
                continue

            field_type = field_info.get('type')
            if field_type in ('many2one', 'many2many'):
                related_model = field_info.get('relation')
                if field_type == 'many2one':
                    # Si el valor es una cadena, se asume que es el 'name' del registro relacionado.
                    if isinstance(field_value, str):
                        rec = self.env[related_model].search([('name', '=', field_value)], limit=1)
                        if rec:
                            result[field_name] = rec.id
                        else:
                            not_use[field_name] = _('Name not found.')
                    elif isinstance(field_value, int) and field_value > 0:
                        result[field_name] = field_value
                elif field_type == 'many2many':
                    if isinstance(field_value, int) and field_value > 0:
                        # Caso: un único ID.
                        result[field_name] = [(4, field_value)]
                    elif isinstance(field_value, list):
                        # Si la lista contiene comandos, se usa tal cual.
                        if field_value and isinstance(field_value[0], (tuple, list)):
                            result[field_name] = field_value
                        else:
                            # La lista puede contener nombres o IDs.
                            ids = []
                            for item in field_value:
                                if isinstance(item, str) and item:
                                    rec = self.env[related_model].search([('name', '=', item)], limit=1)
                                    if rec:
                                        ids.append(rec.id)
                                    else:
                                        not_use[field_name] = _('Name not found.')
                                elif isinstance(item, int) and item > 0:
                                    ids.append(item)
                            if ids:
                                result[field_name] = [(6, 0, ids)]
                    else:
                        not_use[field_name] = _('Invalid value.')
            elif field_type == 'one2many':
                related_model = field_info.get('comodel_name')
                # Si el valor es una cadena, se asume que es el 'name' del registro relacionado.
                if isinstance(field_value, str):
                    rec = self.env[related_model].search([('name', '=', field_value)], limit=1)
                    if rec:
                        # Para vincular un registro existente a un one2many se usa (4, id)
                        result[field_name] = [(4, rec.id)]
                    else:
                        not_use[field_name] = _('Name not found.')
                elif isinstance(field_value, list):
                    # Si es una lista de diccionarios se asume que se quieren crear nuevos registros.
                    if field_value and isinstance(field_value[0], dict):
                        result[field_name] = [(0, 0, item) for item in field_value]
                    else:
                        # La lista puede contener nombres o IDs.
                        ids = []
                        for item in field_value:
                            if isinstance(item, str) and item:
                                rec = self.env[related_model].search([('name', '=', item)], limit=1)
                                if rec:
                                    ids.append(rec.id)
                                else:
                                    not_use[field_name] = _('Name not found.')
                            elif isinstance(item, int) and item > 0:
                                ids.append(item)
                        if ids:
                            # En one2many, para enlazar registros existentes se utiliza (4, id) para cada registro.
                            result[field_name] = [(4, rec_id) for rec_id in ids]
                        else:
                            if field_name not in not_use:
                                not_use[field_name] = _('Invalid value.')
                else:
                    result[field_name] = field_value
            elif field_type == 'boolean':
                # Si el campo es booleano, interpretar valores de texto.
                if isinstance(field_value, str):
                    valor = field_value.strip().lower()
                    if valor in ['true', '1', 'yes', 'si']:
                        result[field_name] = True
                    elif valor in ['false', '0', 'no']:
                        result[field_name] = False
                    else:
                        not_use[field_name] = _('Invalid boolean value.')
                else:
                    result[field_name] = bool(field_value)
            else:
                # Para otros tipos de campo se asigna el valor directamente.
                result[field_name] = field_value
        return result, not_use

    @api.model
    def ai_tool_info_message(self, conv_id, text, ttype='info_comment', user_id=False, key=False):
        user_id = user_id or self.env.user
        if ttype != 'info_hidden':
            text = '🤖 %s (%s)' % (text.strip(), user_id.name)
        data = {'ttype': ttype,
                'from_me': True,
                'ai_aux_key': key,
                'bot_id': conv_id.bot_id.id if conv_id.bot_id else False,
                'contact_id': conv_id.id,
                'user_id': user_id.id,
                'text': text}
        return self.env['acrux.chat.message'].create(data)

    @api.model
    def ai_tool_event(self, conv_id, bot_id, event):
        if self.env.context.get('not_log_event'):
            return False
        else:
            Message = self.env['acrux.chat.message']
            data = {'ttype': 'info_hidden',
                    'active': False,
                    'from_me': True,
                    'bot_id': bot_id.id,
                    'contact_id': conv_id.id,
                    'ai_event': event,
                    'user_id': self.env.user.id,
                    'text': dict(Message._fields['ai_event'].selection).get(event)
                    }
            return Message.create(data)
