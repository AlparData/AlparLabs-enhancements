/** @odoo-module */

import { reactive } from "@odoo/owl";
import { user } from "@web/core/user";

export class ChatStore {
    constructor() {
        this.state = reactive({
            conversations: [],
            messages: {}, // Map conversation_id -> [messages]
            selectedConversationId: null,
            isLoading: false,
            activeTab: 'mine', // 'mine', 'unassigned', 'all'
            searchQuery: '',
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

    get filteredConversations() {
        let filtered = this.state.conversations;

        // Filter by Tab
        if (this.state.activeTab === 'mine') {
            filtered = filtered.filter(c => c.agent_id && c.agent_id[0] === user.userId && c.status !== 'done');
        } else if (this.state.activeTab === 'unassigned') {
            filtered = filtered.filter(c => c.status === 'new');
        } else if (this.state.activeTab === 'all') {
            // No filter (or maybe exclude done? usually 'all' implies everything)
        }

        // Filter by Search
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(c => 
                (c.name && c.name.toLowerCase().includes(query)) || 
                (c.number && c.number.includes(query))
            );
        }

        // Sort by last activity desc
        return filtered.sort((a, b) => {
            const dateA = a.last_activity ? new Date(a.last_activity) : new Date(0);
            const dateB = b.last_activity ? new Date(b.last_activity) : new Date(0);
            return dateB - dateA;
        });
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

    setTab(tab) {
        this.state.activeTab = tab;
    }

    setSearchQuery(query) {
        this.state.searchQuery = query;
    }
}

export const chatStore = new ChatStore();
