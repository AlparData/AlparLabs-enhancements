# -*- coding: utf-8 -*-
# =====================================================================================
# License: OPL-1 (Odoo Proprietary License v1.0)
#
# By using or downloading this module, you agree not to make modifications that
# affect sending messages through Acruxlab or avoiding contract a Plan with Acruxlab.
# Support our work and allow us to keep improving this module and the service!
#
# Al utilizar o descargar este módulo, usted se compromete a no realizar modificaciones que
# afecten el envío de mensajes a través de Acruxlab o a evitar contratar un Plan con Acruxlab.
# Apoya nuestro trabajo y permite que sigamos mejorando este módulo y el servicio!
# =====================================================================================
{
    'name': 'ChatRoom AI ChatBot. ChatGPT, OpenAI, GEMINI. Whatsapp, Instagram DM, FaceBook Messenger.',
    'summary': 'Artificial Intelligence Chat AI Assistant. Automatic messages with AI. Templates and Python code. '
               'WhatsApp IA ChatBot integration. ChatBot WhatsApp bot apichat.io AI Chat IA. AI Bot IA. ChatRoom 2.0.',
    'description': 'BOT WhatsApp with Artificial Intelligence Chat AI Assistant. Templates and Python code. '
                   'WhatsApp ChatBot integration. ChatBot WhatsApp bot ChatRoom 2.0.',
    'version': '18.0.29.0',
    'author': 'AcruxLab',
    'live_test_url': 'https://acruxlab.com/plans',
    'support': 'info@acruxlab.com',
    'price': 149.0,
    'currency': 'USD',
    'images': ['static/description/Banner_bot_v11.png'],
    'website': 'https://acruxlab.com/whatsapp',
    'license': 'OPL-1',
    'application': True,
    'installable': True,
    'category': 'Discuss',
    'depends': [
        'whatsapp_connector',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/cron.xml',
        'data/data.xml',
        'wizard/product_import.xml',
        'views/bot_log_views.xml',
        'views/bot_views.xml',
        'views/connector_views.xml',
        'views/conversation_views.xml',
        'views/bot_ai_views.xml',
        'views/bot_ai_connector_views.xml',
        'views/bot_ai_message_views.xml',
        'views/menu.xml',
        'views/res_config_settings_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'whatsapp_connector_bot/static/src/css/chat_bot.css',
            'whatsapp_connector_bot/static/src/components/*/*.xml',
            'whatsapp_connector_bot/static/src/js/*.js',
            'whatsapp_connector_bot/static/src/js/patches/*.js',
        ],
    },
    'post_load': '',
    'external_dependencies': {},
    'pre_init_hook': '',
}
