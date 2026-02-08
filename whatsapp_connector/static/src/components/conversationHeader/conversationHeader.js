/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useBus } from "@web/core/utils/hooks";
import { ConversationModel } from "../../models/conversation_model";
import { ConversationName } from "../conversationName/conversationName";

export class ConversationHeader extends Component {
    setup() {
        super.setup();
        useBus(this.env.chatBus, 'updateConversation', ({ detail: { conv } }) => {
            if (conv.id === this.props.selectedConversation?.id) {
                this.render();
            }
        });
    }
}

ConversationHeader.template = 'chatroom.ConversationHeader';
ConversationHeader.props = {
    selectedConversation: ConversationModel,
};
ConversationHeader.components = { ConversationName };
