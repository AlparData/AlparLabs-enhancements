# -*- coding: utf-8 -*-
{
    'name': 'Delegate to User Connector',
    'summary': 'Delegate conversation to the agent\'s default connector.',
    'description': 'Extends the delegation functionality to allow conversations to be delegated to different connectors based on the assigned agent\'s default connector.',
    'version': '18.0.1.0',
    'author': 'AlparData',
    'category': 'Discuss/Sales/CRM',
    'depends': [
        'whatsapp_connector',
        'whatsapp_connector_access',
    ],
    'data': [
        'views/res_users_views.xml',
        'views/conversation_views.xml',
    ],
    'license': 'OPL-1',
    'application': False,
    'installable': True,
}
