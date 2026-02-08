/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { browser } from "@web/core/browser/browser";
import { registry } from "@web/core/registry";
import { session } from "@web/session";
import { Component, useState, useSubEnv, onWillStart, onWillDestroy, useRef } from "@odoo/owl";
import { EventBus } from "@odoo/owl";
import { useBus } from "@web/core/utils/hooks";
import { ConversationThread } from "../conversationThread/conversationThread";
import { ConversationHeader } from "../conversationHeader/conversationHeader";
import { ConversationList } from "../conversationList/conversationList";
import { Toolbox } from "../toolbox/toolbox";
import { TabsContainer } from "./tabs_container";
import { LoadingIndicator } from "./loading_indicator";
import { ConversationModel } from "../models/conversation_model";
import { UserModel } from "../models/user_model";
import { DefaultAnswerModel } from "../models/default_answer_model";

export class Chatroom extends Component {
    setup() {
        super.setup();
        this.chatroom = this.env.services.chatroom;
        
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
        useBus(this.env.chatBus, 'selectTab', (tab) => { this.chatroom.state.tabSelected = tab; });
        useBus(this.env.chatBus, 'mobileNavigate', (side) => { this.chatroom.state.mobileSide = side; });
        useBus(this.env.chatBus, 'initAndNotifyConversation', ({ detail: { id } }) => this.chatroom.initAndNotify(id));
        
        onWillStart(() => this.chatroom.fetchData());
    }

    get state() {
        return this.chatroom.state;
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
Chatroom.components = { ConversationThread, ConversationHeader, ConversationList, Toolbox, TabsContainer, LoadingIndicator };
