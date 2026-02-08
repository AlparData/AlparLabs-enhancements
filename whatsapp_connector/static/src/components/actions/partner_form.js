/** @odoo-module **/

import { user } from "@web/core/user";
import { patch } from "@web/core/utils/patch";
import { ChatroomActionTab } from "./chatroom_action_tab";
import { ConversationModel } from "../../models/conversation_model";

export class PartnerForm extends ChatroomActionTab {
    getExtraContext(props) {
        return Object.assign(super.getExtraContext(props), {
            default_mobile: props.selectedConversation.numberFormat,
            default_phone: props.selectedConversation.numberFormat,
            default_name: props.selectedConversation.name,
            default_user_id: user.userId,
        });
    }

    async onSave(record) {
        await super.onSave(record);
        if (record.resId !== this.props.selectedConversation.partner.id) {
            await this.savePartner([record.resId, record.data.display_name]);
        }
    }
}

PartnerForm.props = { ...ChatroomActionTab.props };
PartnerForm.defaultProps = { ...ChatroomActionTab.defaultProps };

patch(PartnerForm.props, {
    selectedConversation: { type: ConversationModel },
    viewModel: { type: String, optional: true },
    viewType: { type: String, optional: true },
    viewKey: { type: String, optional: true },
});

patch(PartnerForm.defaultProps, {
    viewModel: 'res.partner',
    viewType: 'form',
    viewKey: 'partner_form',
});
