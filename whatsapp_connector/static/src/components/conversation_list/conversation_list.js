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
        this.chatStore = chatStore; // Make store available to template
    }

    setTab(tab) {
        chatStore.setTab(tab);
    }

    onSearchInput(ev) {
        chatStore.setSearchQuery(ev.target.value);
    }

    formatDate(dateStr) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
