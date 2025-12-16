/** @odoo-module */

import { Component, useState, useRef, useEffect } from "@odoo/owl";
import { chatStore } from "../../core/chat_store";
import { useService } from "@web/core/utils/hooks";
import { Composer } from "../composer/composer";

export class Thread extends Component {
    setup() {
        this.store = useState(chatStore.state);
        this.scrollRef = useRef("scrollable");
        
        useEffect(() => {
            // Scroll to bottom when messages change
            if (this.scrollRef.el) {
                this.scrollRef.el.scrollTop = this.scrollRef.el.scrollHeight;
            }
        }, () => [this.messages.length, this.props.conversationId]);
    }

    get messages() {
        return chatStore.currentMessages;
    }
}

Thread.template = "whatsapp_connector.Thread";
Thread.components = { Composer };
Thread.props = ["conversationId"];
