/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { TabsContainer } from "@af0df1a5affde864bfaca0edba19137ac4e7199f2cb7ae310c45d7b47aaac68b";
import { ChatroomActionTab } from "@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb";
import { ConversationModel } from "@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef";

// Define CrmLeadForm
export class CrmLeadForm extends ChatroomActionTab {
    setup() {
        super.setup();
        this.env;
        this.props;
    }

    getExtraContext(props) {
        // BLINDAJE: Verificamos cada nivel del objeto antes de leer
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
            default_user_id: this.env.services.user.userId,
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

CrmLeadForm.props = Object.assign({}, CrmLeadForm.props);
CrmLeadForm.defaultProps = Object.assign({}, CrmLeadForm.defaultProps);

patch(CrmLeadForm.props, {
    selectedConversation: { type: ConversationModel.prototype },
    viewModel: { type: String, optional: true },
    viewType: { type: String, optional: true },
    viewKey: { type: String, optional: true },
});

patch(CrmLeadForm.defaultProps, {
    viewModel: 'crm.lead',
    viewType: 'form',
    viewKey: 'crm_form',
});

// Patch TabsContainer
patch(TabsContainer.prototype, {
    get tabCrmLeadFormProps() {
        return {
            viewTitle: _t('CRM'),
            viewResId: this.props.selectedConversation && this.props.selectedConversation.lead ? this.props.selectedConversation.lead.id : undefined,
            selectedConversation: this.props.selectedConversation,
            searchButton: true,
        };
    },
    get titles() {
        // BLINDAJE: Si super.titles falla, reconstruimos los básicos para evitar crash en XML
        let out = {};
        try {
            out = super.titles || {};
        } catch (e) {
            console.error("Error getting super.titles in TabsContainer patch", e);
        }
        
        if (!out.tab_partner) {
            // Fallback de emergencia si super falló
            out = {
                tab_default_answer: _t('Default Answers'),
                tab_partner: _t('Partner'),
                tab_init_conversation: _t('Conversations'),
                tab_product_grid: _t('Products'),
                tab_conv_info: _t('Info'),
                tab_conv_kanban: _t('Chat Funnels'),
                tab_conv_panel: _t('Activities'),
                tab_ai_inteface: _t('AI Manual Queries')
            };
        }
        out.tab_crm_lead = _t('CRM');
        return out;
    }
});

// Register component
Object.assign(TabsContainer.components, { CrmLeadForm });

// Patch ConversationModel
patch(ConversationModel.prototype, {
    updateFromJson(base) {
        super.updateFromJson(base);
        // BLINDAJE: Asegurar que this.lead existe siempre
        if (!this.lead) {
            this.lead = { id: 0, name: '' };
        }
        if ('crm_lead_id' in base) {
            this.lead = this.convertRecordField(base.crm_lead_id);
        }
    }
});