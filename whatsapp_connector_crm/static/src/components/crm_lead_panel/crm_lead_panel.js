/** @odoo-module */

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { chatroomSidebarRegistry } from "@whatsapp_connector/core/chatroom_registry";

export class CrmLeadPanel extends Component {
    setup() {
        this.orm = useService("orm");
        this.state = useState({
            lead: null,
            isLoading: false,
        });

        onWillStart(async () => {
            await this.loadLead();
        });
    }

    async loadLead() {
        if (!this.props.selectedConversation) return;
        
        this.state.isLoading = true;
        try {
            // Logic to find lead associated with conversation
            // For now, just a placeholder
            const leads = await this.orm.searchRead("crm.lead", 
                [["partner_id", "=", this.props.selectedConversation.partner_id]], 
                ["name", "stage_id"], 
                { limit: 1 }
            );
            this.state.lead = leads.length > 0 ? leads[0] : null;
        } catch (error) {
            console.error("Error loading lead:", error);
        } finally {
            this.state.isLoading = false;
        }
    }
}

CrmLeadPanel.template = "whatsapp_connector_crm.CrmLeadPanel";

// Register the panel
chatroomSidebarRegistry.add("crm_lead", {
    title: "CRM",
    component: CrmLeadPanel,
});
