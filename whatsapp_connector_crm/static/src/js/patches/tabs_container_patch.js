/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { TabsContainer } from "@whatsapp_connector/components/chatroom/tabs_container";
import { CrmLeadForm } from "../crm_lead_form";

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
        let out = {};
        try {
            out = super.titles || {};
        } catch (e) {
            console.error("Error getting super.titles in TabsContainer patch", e);
        }
        
        if (!out.tab_partner) {
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

Object.assign(TabsContainer.components, { CrmLeadForm });
