/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ChatroomActionTab } from "@whatsapp_connector/components/actions/chatroom_action_tab";

export class ConversationForm extends ChatroomActionTab {
    async onSave(record) {
        await super.onSave(record);
        await this.env.services.orm.call(this.env.chatModel, 'update_conversation_bus', [record.resIds], { context: this.env.context });
    }
}

ConversationForm.props = { ...ChatroomActionTab.props };
ConversationForm.defaultProps = { ...ChatroomActionTab.defaultProps };

patch(ConversationForm.props, {
    viewResId: { type: Number },
    viewModel: { type: String, optional: true },
    viewType: { type: String, optional: true },
    viewKey: { type: String, optional: true },
});

patch(ConversationForm.defaultProps, {
    viewModel: 'acrux.chat.conversation',
    viewType: 'form',
    viewKey: 'conv_form',
});
