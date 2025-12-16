/** @odoo-module */

import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class Composer extends Component {
    setup() {
        this.chatService = useService("whatsapp_connector.chat_service");
        this.state = useState({ text: "" });
    }

    async sendMessage() {
        if (!this.state.text.trim()) return;
        
        const text = this.state.text;
        this.state.text = ""; // Clear immediately
        
        try {
            await this.chatService.sendMessage(this.props.conversationId, text);
        } catch (error) {
            this.state.text = text; // Restore on error
            // TODO: Show notification
        }
    }

    onKeydown(ev) {
        if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            this.sendMessage();
        }
    }
}

Composer.template = "whatsapp_connector.Composer";
Composer.props = ["conversationId"];
