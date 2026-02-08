/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { Notebook } from "@web/core/notebook/notebook";
import { Component } from "@odoo/owl";
import { NotebookChat } from "@whatsapp_connector/components/chatroom/notebook_chat";
import { DefaultAnswer } from "@whatsapp_connector/components/toolbox/default_answer";
import { ConversationForm } from "@whatsapp_connector/components/actions/conversation_form";
import { ConversationKanban } from "@whatsapp_connector/components/actions/conversation_kanban";
import { ConversationPanelForm } from "@whatsapp_connector/components/actions/conversation_panel_form";
import { AiInterfaceForm } from "@whatsapp_connector/components/actions/ai_interface_form";
import { PartnerForm } from "@whatsapp_connector/components/actions/partner_form";
import { ConversationModel } from "@whatsapp_connector/models/conversation_model";
import { DefaultAnswerModel } from "@whatsapp_connector/models/default_answer_model";
import { ProductContainer } from "@whatsapp_connector/components/toolbox/product_container";
import { UserModel } from "@whatsapp_connector/models/user_model";

export class TabsContainer extends Component {
    setup() {
        super.setup();
    }

    get tabPartnerFormProps() {
        return {
            viewTitle: _t('Partner'),
            viewResId: this.props.selectedConversation?.partner?.id,
            searchButton: true,
            searchButtonString: _t('Search Existing'),
            selectedConversation: this.props.selectedConversation,
        };
    }

    get tabConversationFormProps() {
        return {
            viewId: this.props.conversationInfoForm,
            viewTitle: _t('Info'),
            viewResId: this.props.selectedConversation?.id,
            selectedConversation: this.props.selectedConversation,
        };
    }

    get tabConversationKanbanProps() {
        return {
            viewId: this.props.conversationKanban,
            viewTitle: _t('Status'),
            formViewId: this.props.conversationInfoForm,
            selectedConversation: this.props.selectedConversation,
        };
    }

    get tabConversationPanelFormProps() {
        return {
            viewId: this.props.conversationPanelForm,
            viewTitle: _t('Panel'),
        };
    }

    get tabAiInterfaceFormProps() {
        return {
            viewId: this.props.aiInterfaceForm,
            viewTitle: _t('AI'),
            selectedConversation: this.props.selectedConversation,
        };
    }

    get titles() {
        return {
            tab_default_answer: _t('Default Answers'),
            tab_partner: _t('Partner'),
            tab_init_conversation: _t('Conversations'),
            tab_product_grid: _t('Products'),
            tab_conv_info: _t('Info'),
            tab_conv_kanban: _t('Chat Funnels'),
            tab_conv_panel: _t('Activities'),
            tab_ai_interface: _t('AI Manual Queries'),
        };
    }

    get comp() { return this.constructor.components; }

    get defaultAnswers() {
        const connectorId = this.props.selectedConversation?.connector?.id || -1;
        return this.props.defaultAnswers[connectorId] || this.props.defaultAnswers[-1] || [];
    }
}

TabsContainer.template = 'chatroom.TabsContainer';
TabsContainer.props = {
    selectedConversation: { optional: true },
    defaultAnswers: {
        type: Object,
        values: { type: Array, element: Object },
    },
    conversationInfoForm: { type: Number, optional: true },
    conversationKanban: { type: Number, optional: true },
    conversationPanelForm: { type: Number, optional: true },
    aiInterfaceForm: { type: Number, optional: true },
    className: { type: String, optional: true },
    tabSelected: { type: String, optional: true },
    user: Object,
};
TabsContainer.defaultProps = {
    className: ''
};
TabsContainer.components = {
    Notebook, NotebookChat, DefaultAnswer, PartnerForm, ConversationForm,
    ConversationKanban, ConversationPanelForm, AiInterfaceForm, ProductContainer,
};
