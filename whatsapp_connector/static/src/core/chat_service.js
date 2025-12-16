/** @odoo-module */

import { registry } from "@web/core/registry";
import { chatStore } from "./chat_store";

export const chatService = {
    dependencies: ["bus_service", "orm"],
    
    start(env, { bus_service, orm }) {
        let isInitialized = false;

        async function loadConversations() {
            chatStore.state.isLoading = true;
            try {
                // Using the existing backend method 'build_dict' via 'search_active_conversation' wrapper if available
                // Or directly calling search_read for now to be safe and standard
                const conversations = await orm.call("acrux.chat.conversation", "build_dict", [0], {
                    limit: 50,
                });
                chatStore.setConversations(conversations);
            } catch (error) {
                console.error("Error loading conversations:", error);
            } finally {
                chatStore.state.isLoading = false;
            }
        }

        async function loadMessages(conversationId) {
            if (!conversationId) return;
            try {
                // Using the existing backend method 'build_dict' for messages
                // The backend method 'build_dict' on conversation returns messages if limit > 0
                const result = await orm.call("acrux.chat.conversation", "build_dict", [22], {
                    domain: [["id", "=", conversationId]],
                });
                
                if (result && result.length > 0 && result[0].messages) {
                    chatStore.setMessages(conversationId, result[0].messages);
                }
            } catch (error) {
                console.error("Error loading messages:", error);
            }
        }

        async function sendMessage(conversationId, text) {
            try {
                const messageData = {
                    text: text,
                    ttype: "text",
                    from_me: true,
                };
                await orm.call("acrux.chat.conversation", "send_message", [[conversationId], messageData]);
                // The bus will handle the update, but we could optimistically add it here
            } catch (error) {
                console.error("Error sending message:", error);
                throw error;
            }
        }

        function _handleNotification(notifications) {
            for (const notification of notifications) {
                const { type, payload } = notification;
                if (type === "update_conversation") {
                    // Payload is a list of conversations
                    for (const conv of payload) {
                        // Update conversation in store
                        // TODO: Implement update logic in store
                        console.log("Update conversation:", conv);
                    }
                } else if (type === "new_messages") {
                     // Payload is a list of conversations with messages
                     for (const conv of payload) {
                        if (conv.messages) {
                            for (const msg of conv.messages) {
                                chatStore.addMessage(conv.id, msg);
                            }
                        }
                     }
                }
            }
        }

        if (!isInitialized) {
            bus_service.subscribe("acrux.chat.conversation", _handleNotification);
            bus_service.addEventListener("notification", ({ detail: notifications }) => {
                 _handleNotification(notifications);
            });
            isInitialized = true;
        }

        async function createConversation(partnerId) {
            try {
                // Assuming backend has a method to get/create conversation for a partner
                // If not, we might need to use 'create' on acrux.chat.conversation
                // Let's try to find an existing one first or create
                const conversationId = await orm.call("acrux.chat.conversation", "conversation_create", [partnerId], {});
                await loadConversations();
                chatStore.selectConversation(conversationId);
            } catch (error) {
                console.error("Error creating conversation:", error);
                throw error;
            }
        }

        return {
            loadConversations,
            loadMessages,
            sendMessage,
            createConversation,
        };
    },
};

registry.category("services").add("whatsapp_connector.chat_service", chatService);
