/** @odoo-module */

import { reactive } from "@odoo/owl";

export class ChatStore {
    constructor() {
        this.state = reactive({
            conversations: [],
            messages: {}, // Map conversation_id -> [messages]
            selectedConversationId: null,
            isLoading: false,
        });
    }

    get selectedConversation() {
        if (!this.state.selectedConversationId) {
            return null;
        }
        return this.state.conversations.find(
            (c) => c.id === this.state.selectedConversationId
        );
    }

    get currentMessages() {
        if (!this.state.selectedConversationId) {
            return [];
        }
        return this.state.messages[this.state.selectedConversationId] || [];
    }

    setConversations(conversations) {
        this.state.conversations = conversations;
    }

    addConversation(conversation) {
        if (!this.state.conversations.find((c) => c.id === conversation.id)) {
            this.state.conversations.push(conversation);
            this.state.conversations.sort((a, b) => b.last_activity - a.last_activity);
        }
    }

    selectConversation(conversationId) {
        this.state.selectedConversationId = conversationId;
    }

    setMessages(conversationId, messages) {
        this.state.messages[conversationId] = messages;
    }

    addMessage(conversationId, message) {
        if (!this.state.messages[conversationId]) {
            this.state.messages[conversationId] = [];
        }
        // Avoid duplicates
        const exists = this.state.messages[conversationId].find((m) => m.id === message.id);
        if (!exists) {
            this.state.messages[conversationId].push(message);
            // Sort by date/id
            this.state.messages[conversationId].sort((a, b) => a.id - b.id);
        }
    }
}

export const chatStore = new ChatStore();
