/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Conversation } from "@whatsapp_connector/components/conversation/conversation";

patch(Conversation.props, {
    bots: { type: Object, optional: true },
});
