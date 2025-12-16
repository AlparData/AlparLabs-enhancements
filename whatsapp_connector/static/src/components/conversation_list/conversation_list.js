/** @odoo-module */

import { Component, useState } from "@odoo/owl";
import { chatStore } from "../../core/chat_store";
import { useService } from "@web/core/utils/hooks";

export class ConversationList extends Component {
    setup() {
        this.store = useState(chatStore.state);
        this.chatService = useService("whatsapp_connector.chat_service");
    }

    selectConversation(conversationId) {
        chatStore.selectConversation(conversationId);
        this.chatService.loadMessages(conversationId);
    }
}

ConversationList.template = "whatsapp_connector.ConversationList";
