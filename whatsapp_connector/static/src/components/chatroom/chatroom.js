/** @odoo-module */

import { Component, onWillStart, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { chatStore } from "../../core/chat_store";
import { ConversationList } from "../conversation_list/conversation_list";
import { Thread } from "../thread/thread";
import { TabsContainer } from "../tabs_container/tabs_container";

export class Chatroom extends Component {
    setup() {
        this.store = useState(chatStore.state);
        this.chatService = useService("whatsapp_connector.chat_service");

        onWillStart(async () => {
            await this.chatService.loadConversations();
        });
    }
}

Chatroom.template = "whatsapp_connector.Chatroom";
Chatroom.components = { ConversationList, Thread, TabsContainer };

registry.category("actions").add("acrux.chat.conversation_tag", Chatroom);
