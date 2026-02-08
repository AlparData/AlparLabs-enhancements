/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { browser } from "@web/core/browser/browser";
import { registry } from "@web/core/registry";
import { session } from "@web/session";
import { Component, useState, useSubEnv, onWillStart, onWillDestroy, useRef } from "@odoo/owl";
import { EventBus } from "@odoo/owl";
import { useBus } from "@web/core/utils/hooks";
import { ConversationThread } from "./conversationThread/conversationThread";
import { ConversationHeader } from "./conversationHeader/conversationHeader";
import { ConversationList } from "./conversationList/conversationList";
import { Toolbox } from "./toolbox/toolbox";
import { TabsContainer } from "./chatroom/tabs_container";
import { LoadingIndicator } from "./chatroom/loading_indicator";
import { ConversationModel } from "../models/conversation_model";
import { UserModel } from "../models/user_model";
import { DefaultAnswerModel } from "../models/default_answer_model";

export class Chatroom extends Component {
    setup() {
        super.setup();
        this.env;
        const chatBus = new EventBus();
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
        
        this.state = useState({
            conversations: [],
            selectedConversation: null,
            defaultAnswers: {},
            user: new UserModel(this),
            tabSelected: 'tab_default_answer',
            mobileSide: 'leftSide',
        });
        
        this.mainRef = useRef('mainRef');
        
        useBus(this.env.chatBus, 'selectConversation', this.selectConversation.bind(this));
        useBus(this.env.chatBus, 'deleteConversation', this.deleteConversation.bind(this));
        useBus(this.env.chatBus, 'selectTab', (tab) => { this.state.tabSelected = tab; });
        useBus(this.env.chatBus, 'mobileNavigate', (side) => { this.state.mobileSide = side; });
        useBus(this.env.chatBus, 'initAndNotifyConversation', this.initAndNotify.bind(this));
        
        this.env.services.bus_service.addEventListener('notification', this.onNotification.bind(this));
        
        onWillStart(this.willStart.bind(this));
        onWillDestroy(() => {
            this.env.services.bus_service.removeEventListener('notification', this.onNotification.bind(this));
        });
    }

    async willStart() {
        const { orm } = this.env.services;
        const data = await orm.call(this.env.chatModel, 'get_chatroom_data', [], { context: this.env.context });
        this.state.user.updateFromJson(data.user);
        
        const convList = await Promise.all(data.conversations.map(async (convData) => {
            const conv = new ConversationModel(this);
            await conv.updateFromJson(convData);
            return conv;
        }));
        this.state.conversations = convList;
        
        const answers = {};
        for (const [key, value] of Object.entries(data.default_answers)) {
            answers[key] = await Promise.all(value.map(async (ansData) => {
                const ans = new DefaultAnswerModel(this);
                await ans.updateFromJson(ansData);
                return ans;
            }));
        }
        this.state.defaultAnswers = answers;
        
        if (data.conversations.length) {
            // Phase 4: Pre-load latest 12 messages for active conversations
            const activeConvs = convList.filter(c => c.status === 'current').slice(0, 5);
            await Promise.all(activeConvs.map(c => c.syncMoreMessage({ forceSync: true })));
        }
    }

    async onNotification({ detail: notifications }) {
        for (const { type, payload } of notifications) {
            if (type === 'new_messages') {
                await this.onNewMessage(payload);
            } else if (type === 'update_conversation') {
                await this.onUpdateConversation(payload);
            } else if (type === 'init_conversation') {
                await this.onInitConversation(payload);
            } else if (type === 'delete_conversation') {
                this.onDeleteConversation(payload);
            }
        }
    }

    async onNewMessage(payload) {
        for (const convData of payload) {
            let conv = this.state.conversations.find(c => c.id === convData.id);
            if (conv) {
                await conv.updateFromJson(convData);
                this.env.chatBus.trigger('updateConversation', { conv });
            } else {
                conv = new ConversationModel(this);
                await conv.updateFromJson(convData);
                this.state.conversations.push(conv);
            }
        }
    }

    async onUpdateConversation(payload) {
        for (const convData of payload) {
            const conv = this.state.conversations.find(c => c.id === convData.id);
            if (conv) {
                // Phase 3: Hot Update Logic
                await conv.updateFromJson(convData);
                this.env.chatBus.trigger('updateConversation', { conv });
            }
        }
    }

    async onInitConversation(payload) {
        for (const convData of payload) {
            let conv = this.state.conversations.find(c => c.id === convData.id);
            if (conv) {
                await conv.updateFromJson(convData);
            } else {
                conv = new ConversationModel(this);
                await conv.updateFromJson(convData);
                this.state.conversations.push(conv);
            }
            await this.selectConversation({ detail: { conv } });
        }
    }

    onDeleteConversation(payload) {
        for (const convData of payload) {
            const index = this.state.conversations.findIndex(c => c.id === convData.id);
            if (index !== -1) {
                const conv = this.state.conversations[index];
                if (this.state.selectedConversation?.id === conv.id) {
                    this.state.selectedConversation = null;
                }
                this.state.conversations.splice(index, 1);
            }
        }
    }

    async selectConversation({ detail: { conv } }) {
        if (this.state.selectedConversation?.id === conv.id) {
            return;
        }
        this.state.selectedConversation = conv;
        await conv.selected();
        this.state.mobileSide = 'middleSide';
    }

    deleteConversation({ detail: conv }) {
        const index = this.state.conversations.findIndex(c => c.id === conv.id);
        if (index !== -1) {
            this.state.conversations.splice(index, 1);
        }
        if (this.state.selectedConversation?.id === conv.id) {
            this.state.selectedConversation = null;
            this.state.mobileSide = 'leftSide';
        }
    }

    async initAndNotify({ detail: { id } }) {
        const data = await this.env.services.orm.call(this.env.chatModel, 'init_and_notify', [[id]], { context: this.env.context });
        if (data) {
            this.env.services.bus_service.trigger('notification', [{ type: 'init_conversation', payload: data }]);
        }
    }

    async conversationBuildDict(id, limit) {
        const { orm } = this.env.services;
        return await orm.call(this.env.chatModel, 'conversation_build_dict', [[id], limit], { context: this.env.context });
    }

    async messageBuildDict(id, limit, offset, withPriority) {
        const { orm } = this.env.services;
        return await orm.call(this.env.chatModel, 'message_build_dict', [[id], limit, offset, withPriority], { context: this.env.context });
    }
}

Chatroom.template = 'chatroom.Chatroom';
Chatroom.components = { ConversationThread, ConversationHeader, ConversationList, Toolbox, TabsContainer, LoadingIndicator };

registry.category('actions').add('acrux.chat.conversation_tag', Chatroom);
registry.category('actions').add('acrux.chat.null_action_tag', () => {});
