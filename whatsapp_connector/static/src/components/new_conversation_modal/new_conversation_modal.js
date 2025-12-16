/** @odoo-module */

import { Component, useState, onWillStart } from "@odoo/owl";
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
            number: "",
            connectorId: false,
            connectors: [],
        });

        onWillStart(async () => {
            this.state.connectors = await this.orm.searchRead("acrux.chat.connector", [], ["name", "connector_type"]);
            if (this.state.connectors.length > 0) {
                this.state.connectorId = this.state.connectors[0].id;
            }
        });
    }

    updatePartner(value) {
        this.state.partnerId = value[0] ? value[0].id : false;
        this.state.partnerName = value[0] ? value[0].display_name : "";
        if (value[0]) {
            // Auto-fill number from partner (mobile or phone)
            // We need to fetch it first as Many2XAutocomplete only gives basic info
            this.orm.read("res.partner", [value[0].id], ["mobile", "phone"]).then((data) => {
                if (data && data[0]) {
                    this.state.number = data[0].mobile || data[0].phone || "";
                }
            });
        }
    }

    async createConversation() {
        if (!this.state.number || !this.state.connectorId) return;

        try {
            await this.chatService.createConversation(
                this.state.partnerId, 
                this.state.connectorId, 
                this.state.number
            );
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
