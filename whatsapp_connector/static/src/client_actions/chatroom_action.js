/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Chatroom } from "@whatsapp_connector/components/chatroom/chatroom";

/**
 * Modern Action Loader for Odoo 18.
 * Decoupled from the component to ensure registration even if 
 * child components have loading issues (though dependencies must still be met).
 */
registry.category("actions").add("acrux.chat.conversation_tag", Chatroom);
