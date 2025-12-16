/** @odoo-module */

import { Component, useState } from "@odoo/owl";
import { chatroomSidebarRegistry } from "../../core/chatroom_registry";

export class TabsContainer extends Component {
    setup() {
        this.state = useState({
            activeTab: null,
        });
        this.tabs = chatroomSidebarRegistry.getEntries();
        if (this.tabs.length > 0) {
            this.state.activeTab = this.tabs[0][0];
        }
    }

    selectTab(tabId) {
        this.state.activeTab = tabId;
    }
}

TabsContainer.template = "whatsapp_connector.TabsContainer";
