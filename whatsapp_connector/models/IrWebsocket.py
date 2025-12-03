# -*- coding: utf-8 -*-
from odoo.http import request
from odoo.addons.bus.websocket import wsrequest
from odoo import models


class IrWebsocket(models.AbstractModel):
    _inherit = 'ir.websocket'

    def _build_bus_channel_list(self, channels):
        user_id = self.env.uid
        if user_id and self.env.user.has_group('whatsapp_connector.group_chat_basic'):
            req = request or wsrequest
            # Obtener cookie cids de forma segura
            cids_str = req.httprequest.cookies.get('cids') if req else None
            cids = []
            
            if cids_str:
                try:
                    # CORRECCIÓN: Soportar formato con guiones '1-2-3' y comas '1,2,3'
                    # El error ValueError venía porque cids era '1-13-11...' y split(',') no lo separaba
                    clean_cids = cids_str.replace('-', ',')
                    cids = [int(cid) for cid in clean_cids.split(',') if cid.strip().isdigit()]
                except Exception:
                    cids = []

            # Fallback: Si no pudimos leer la cookie, usamos la compañía actual del entorno
            if not cids:
                cids = [self.env.company.id]

            company_id = cids[0]
            
            channels = list(channels)
            # Regla security: company_id (= req.env.company) toma la definida en usuario.
            connector_ids = self.env['acrux.chat.connector'].with_company(company_id)
            connector_ids = connector_ids.search([('company_id', '=', company_id)]).ids
            for conn_id in connector_ids:
                channels.append((self.env.registry.db_name, 'acrux.chat.conversation', company_id, conn_id))
            channels.append((self.env.registry.db_name, 'acrux.chat.conversation', 'private', company_id, user_id))
        
        return super()._build_bus_channel_list(channels)