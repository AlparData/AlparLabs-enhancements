/** @odoo-module **/

import { session } from "@web/session";
import { Component } from "@odoo/owl";
import { RelativeTime } from "@mail/core/common/relative_time";
import { ConversationModel } from "@whatsapp_connector/models/conversation_model";

export class Conversation extends Component {
    setup() {
        super.setup();
    }

    onSelect() {
        this.env.chatBus.trigger(this.props.selectTrigger, { conv: this.props.conversation });
    }

    async onClose(event) {
        event.stopPropagation();
        if (session.chatroom_release_conv_on_close) {
            await this.props.conversation.close();
        }
        this.env.chatBus.trigger(this.props.deleteTrigger, this.props.conversation);
    }

    get isSelected() {
        const { selectedConversation, conversation } = this.props;
        return (conversation.id === selectedConversation?.id);
    }
}

Conversation.template = 'chatroom.Conversation';
Conversation.props = {
    conversation: Object,
    selectedConversation: { type: Object, optional: true },
    hideClose: { type: Boolean, optional: true },
    selectTrigger: { type: String, optional: true },
    deleteTrigger: { type: String, optional: true },
};
Conversation.defaultProps = {
    hideClose: false,
    selectTrigger: 'selectConversation',
    deleteTrigger: 'deleteConversation',
};
Conversation.components = { RelativeTime };
