/** @odoo-module **/

import { Component } from "@odoo/owl";
import { ConversationModel } from "../../models/conversation_model";

export class ConversationCard extends Component {
    setup() {
        super.setup();
    }

    onClick() {
        this.env.chatBus.trigger(this.props.selectTrigger, this.props.conversation);
    }
}

ConversationCard.template = 'chatroom.ConversationCard';
ConversationCard.props = {
    conversation: ConversationModel,
    className: { type: String, optional: true },
    selectTrigger: { type: String, optional: true },
};
ConversationCard.defaultProps = {
    className: '',
    selectTrigger: 'initAndNotifyConversation',
};
ConversationCard.components = {};
