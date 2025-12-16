/** @odoo-module */

import { Component, useState } from "@odoo/owl";
import { chatStore } from "../../core/chat_store";
import { useService } from "@web/core/utils/hooks";
import { NewConversationModal } from "../new_conversation_modal/new_conversation_modal";

export class ConversationList extends Component {
    setup() {
        this.store = useState(chatStore.state);
        this.chatService = useService("whatsapp_connector.chat_service");
        this.dialog = useService("dialog");
    }

    selectConversation(conversationId) {
        chatStore.selectConversation(conversationId);
        this.chatService.loadMessages(conversationId);
    }

    openNewConversationModal() {
        this.dialog.add(NewConversationModal, {});
    }
}

ConversationList.template = "whatsapp_connector.ConversationList";
ConversationList.props = {};
