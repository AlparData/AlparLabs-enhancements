/** @odoo-module */

import { Component, useState } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";
import { useService } from "@web/core/utils/hooks";
import { Many2XAutocomplete } from "@web/views/fields/relational_utils";

export class NewConversationModal extends Component {
    setup() {
        this.orm = useService("orm");
        this.chatService = useService("whatsapp_connector.chat_service");
        this.state = useState({
            partnerId: false,
            partnerName: "",
        });
    }

    updatePartner(value) {
        this.state.partnerId = value[0] ? value[0].id : false;
        this.state.partnerName = value[0] ? value[0].display_name : "";
    }

    async createConversation() {
        if (!this.state.partnerId) return;

        try {
            await this.chatService.createConversation(this.state.partnerId);
            this.props.close();
        } catch (error) {
            console.error("Error creating conversation:", error);
            // TODO: Show error notification
        }
    }
}

NewConversationModal.template = "whatsapp_connector.NewConversationModal";
NewConversationModal.components = { Dialog, Many2XAutocomplete };
NewConversationModal.props = {
    close: Function,
};
