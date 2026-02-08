/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { browser } from "@web/core/browser/browser";
import { registry } from "@web/core/registry";
import { session } from "@web/session";
import { Component, useState, useSubEnv, onWillStart, onWillDestroy, useRef } from "@odoo/owl";
import { EventBus } from "@odoo/owl";
import { useBus } from "@web/core/utils/hooks";
import { ConversationThread } from "@whatsapp_connector/components/conversationThread/conversationThread";
import { ConversationHeader } from "@whatsapp_connector/components/conversationHeader/conversationHeader";
import { ConversationList } from "@whatsapp_connector/components/conversationList/conversationList";
import { Toolbox } from "@whatsapp_connector/components/toolbox/toolbox";
import { TabsContainer } from "@whatsapp_connector/components/chatroom/tabs_container";
import { LoadingIndicator } from "@whatsapp_connector/components/chatroom/loading_indicator";
import { ChatroomHeader } from "@whatsapp_connector/components/chatroomHeader/chatroomHeader";
import { ConversationModel } from "@whatsapp_connector/models/conversation_model";
import { UserModel } from "@whatsapp_connector/models/user_model";
import { DefaultAnswerModel } from "@whatsapp_connector/models/default_answer_model";

export class Chatroom extends Component {
    setup() {
        super.setup();
        this.chatroom = this.env.services.chatroom;
        this.state = useState(this.chatroom.state);
        
        const chatBus = this.chatroom.chatBus;
        useSubEnv({
            chatBus,
            chatModel: 'acrux.chat.conversation',
            isAdmin: () => session.is_admin,
            canTranslate: () => session.chatroom_ai_config_id,
            canTranscribe: () => session.chatroom_ai_config_id,
            getCurrentLang: () => session.chatroom_lang_id,
            getCurrency: () => session.chatroom_currency_id,
            conversationBuildDict: this.conversationBuildDict.bind(this),
            messageBuildDict: this.messageBuildDict.bind(this),
        });
        
        this.mainRef = useRef('mainRef');
        
        useBus(this.env.chatBus, 'selectConversation', ({ detail: { conv } }) => this.chatroom.selectConversation(conv));
        useBus(this.env.chatBus, 'deleteConversation', ({ detail: conv }) => this.chatroom.deleteConversation(conv));
        useBus(this.env.chatBus, 'selectTab', (tab) => { this.state.tabSelected = tab; });
        useBus(this.env.chatBus, 'mobileNavigate', (side) => { this.state.mobileSide = side; });
        useBus(this.env.chatBus, 'initAndNotifyConversation', ({ detail: { id } }) => this.chatroom.initAndNotify(id));
        
        onWillStart(() => this.chatroom.fetchData());
    }

    async conversationBuildDict(id, limit) {
        const { orm } = this.env.services;
        return await orm.call('acrux.chat.conversation', 'conversation_build_dict', [[id], limit], { context: this.env.context });
    }

    async messageBuildDict(id, limit, offset, withPriority) {
        const { orm } = this.env.services;
        return await orm.call('acrux.chat.conversation', 'message_build_dict', [[id], limit, offset, withPriority], { context: this.env.context });
    }
}

Chatroom.template = 'chatroom.Chatroom';
Chatroom.components = { ConversationThread, ConversationHeader, ConversationList, Toolbox, TabsContainer, LoadingIndicator, ChatroomHeader };
