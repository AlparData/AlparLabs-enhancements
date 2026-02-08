/** @odoo-module **/

import { ChatroomActionTab } from "@whatsapp_connector/components/actions/chatroom_action_tab";
import { user } from "@web/core/user";
import { ConversationModel } from "@whatsapp_connector/models/conversation_model";

export class CrmLeadForm extends ChatroomActionTab {
    setup() {
        super.setup();
    }

    getExtraContext(props) {
        const conv = props.selectedConversation || {};
        const connector = conv.connector || {};
        const connectorName = connector.name || '';
        const convName = conv.name || '';
        const partnerId = conv.partner ? conv.partner.id : false;
        
        const context = Object.assign(super.getExtraContext(props), {
            default_partner_id: partnerId,
            default_mobile: conv.numberFormat,
            default_phone: conv.numberFormat,
            default_name: `${connectorName}: ${convName}`,
            default_contact_name: convName,
            default_user_id: user.userId,
        });

        if (conv.team && conv.team.id) {
            context['default_team_id'] = conv.team.id;
        }
        return context;
    }

    async onSave(record) {
        await super.onSave(record);
        const conv = this.props.selectedConversation;
        if (conv && (!conv.lead || record.resId !== conv.lead.id)) {
            await this.env.services.orm.write(this.env.chatModel, [conv.id], {
                crm_lead_id: record.resId
            }, {
                context: this.env.context
            });
            conv.updateFromJson({
                crm_lead_id: [record.resId, record.data.display_name]
            });
            this.env.chatBus.trigger('updateConversation', conv);
        }
    }

    _getOnSearchChatroomDomain() {
        let domain = super._getOnSearchChatroomDomain();
        if (this.props.selectedConversation) {
            domain.push(['conversation_id', '=', this.props.selectedConversation.id]);
            if (this.props.selectedConversation.partner && this.props.selectedConversation.partner.id) {
                domain.unshift('|');
                domain.push(['partner_id', '=', this.props.selectedConversation.partner.id]);
            }
        }
        return domain;
    }
}

CrmLeadForm.props = Object.assign({}, CrmLeadForm.props, {
    selectedConversation: { type: ConversationModel.prototype },
    viewModel: { type: String, optional: true },
    viewType: { type: String, optional: true },
    viewKey: { type: String, optional: true },
});

CrmLeadForm.defaultProps = Object.assign({}, CrmLeadForm.defaultProps, {
    viewModel: 'crm.lead',
    viewType: 'form',
    viewKey: 'crm_form',
});
