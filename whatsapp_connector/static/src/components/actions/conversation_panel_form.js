/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ChatroomActionTab } from "@whatsapp_connector/components/actions/chatroom_action_tab";

export class ConversationPanelForm extends ChatroomActionTab {
    setup() {
        super.setup();
    }
}

ConversationPanelForm.props = { ...ChatroomActionTab.props };
ConversationPanelForm.defaultProps = { ...ChatroomActionTab.defaultProps };

patch(ConversationPanelForm.props, {
    viewModel: { type: String, optional: true },
    viewType: { type: String, optional: true },
    viewKey: { type: String, optional: true },
});

patch(ConversationPanelForm.defaultProps, {
    viewModel: 'acrux.chat.panel',
    viewType: 'form',
    viewKey: 'conv_panel_form',
});
