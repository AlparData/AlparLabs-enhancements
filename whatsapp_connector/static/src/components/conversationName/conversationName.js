/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useBus } from "@web/core/utils/hooks";
import { ConversationModel } from "../../models/conversation_model";

export class ConversationName extends Component {
    setup() {
        super.setup();
        useBus(this.env.chatBus, 'updateConversation', ({ detail: { conv } }) => {
            if (conv.id === this.props.selectedConversation?.id) {
                this.render();
            }
        });
    }
}

ConversationName.template = 'chatroom.ConversationName';
ConversationName.props = {
    selectedConversation: ConversationModel,
};
