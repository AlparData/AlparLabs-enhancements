/** @odoo-module **/

import { reactive, EventBus } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { session } from "@web/session";
import { ConversationModel } from "@whatsapp_connector/models/conversation_model";
import { UserModel } from "@whatsapp_connector/models/user_model";
import { DefaultAnswerModel } from "@whatsapp_connector/models/default_answer_model";

export class ChatroomService {
    constructor(env, services) {
        this.env = env;
        this.services = services;
        this.chatBus = new EventBus();
        this.state = reactive({
            conversations: [],
            selectedConversation: null,
            defaultAnswers: {},
            bots: [],
            bots_map: {},
            user: new UserModel({ env: this.getEnv() }),
            tabSelected: 'tab_default_answer',
            mobileSide: 'leftSide',
            isReady: false,
        });

        this.modelsUsedFields = {};
        this.readFromChatroom = {};
        this.batchSize = 64;

        this.setupBus();
    }

    getEnv() {
        return Object.assign(Object.create(this.env), {
            chatBus: this.chatBus,
            chatModel: 'acrux.chat.conversation',
            services: this.services,
            modelsUsedFields: this.modelsUsedFields,
            readFromChatroom: this.readFromChatroom,
            conversationBuildDict: this.buildModelBuildDict('acrux.chat.conversation', 'build_dict'),
            messageBuildDict: this.buildModelBuildDict('acrux.chat.message', 'search_read_from_chatroom', this._groupMessageResult.bind(this)),
            isAdmin: () => this.services.user.hasGroup('whatsapp_connector.group_chatroom_admin'),
        });
    }

    setupBus() {
        this.services.bus_service.addEventListener('notification', this.onNotification.bind(this));
    }

    async fetchData() {
        const { orm } = this.services;
        const data = await orm.call('acrux.chat.conversation', 'get_chatroom_data', [], { context: this.env.context });

        // Load model fields and Bots from consolidated data
        if (data.model_fields) {
            for (const [model, fields] of Object.entries(data.model_fields)) {
                this.modelsUsedFields[model] = fields;
                this.readFromChatroom[model] = this.buildBatchRequester(model);
            }
        }

        if (data.bots) {
            this.state.bots = data.bots.map(d => ({ value: d.id, label: d.name }));
            this.state.bots_map = data.bots.reduce((acc, obj) => {
                acc[obj.id] = obj;
                return acc;
            }, {});
        }
        
        if (data.user.chatroom_batch_process) {
            this.batchSize = parseInt(data.user.chatroom_batch_process);
        }

        this.state.user.updateFromJson(data.user);
        
        const env = this.getEnv();
        const convList = await Promise.all(data.conversations.map(async (convData) => {
            const conv = new ConversationModel({ env: env });
            await conv.updateFromJson(convData);
            return conv;
        }));
        this.state.conversations = convList;
        
        const answers = {};
        for (const [key, value] of Object.entries(data.default_answers)) {
            answers[key] = await Promise.all(value.map(async (ansData) => {
                const ans = new DefaultAnswerModel({ env: env });
                await ans.updateFromJson(ansData);
                return ans;
            }));
        }
        this.state.defaultAnswers = answers;
        
        if (convList.length) {
            const activeConvs = convList.filter(c => c.status === 'current').slice(0, 5);
            await Promise.all(activeConvs.map(c => c.syncMoreMessage({ forceSync: true })));
        }

        this.state.isReady = true;
    }

    _sendBatchResolver(batch, results) {
        for (const item of batch) {
            let found = false;
            for (const r of results) {
                if (item.resId === r.id) {
                    item.resolve([r]);
                    found = true;
                    break;
                }
            }
            if (!found) { item.resolve([]); }
        }
    }

    _groupMessageResult(results) {
        let convMap = {};
        for (const item of results) {
            if (!convMap[item.contact_id[0]]) { convMap[item.contact_id[0]] = []; }
            convMap[item.contact_id[0]].push(item);
        }
        return Object.keys(convMap).map(key => {
            return { id: parseInt(key), messages: convMap[key] };
        });
    }

    buildBatchRequester(resModel, group, delay = 100) {
        let queue = [];
        let timer = null;
        const sendBatch = async () => {
            if (queue.length === 0) return;
            clearTimeout(timer);
            timer = null;
            const batch = [...queue];
            queue = [];
            try {
                const resIds = batch.map(item => item.resId);
                let results = await this.services.orm.call(resModel, 'read_from_chatroom', [resIds, this.modelsUsedFields[resModel]], { context: this.env.context });
                if (group) { results = group(results); }
                this._sendBatchResolver(batch, results);
            } catch (error) {
                batch.forEach(item => item.reject(error));
            }
        };
        return (resId, withPriority = false) => {
            return new Promise((resolve, reject) => {
                queue.push({ resId, resolve, reject });
                if (queue.length >= this.batchSize || withPriority) {
                    sendBatch();
                } else if (!timer) {
                    timer = setTimeout(sendBatch, delay);
                }
            });
        };
    }

    buildModelBuildDict(resModel, method, group, delay = 100) {
        let queues = {};
        const getKey = (limit, offset) => `${limit}_${offset}`;
        const sendBatch = async (limit, offset) => {
            const limit_offset = getKey(limit, offset);
            if (!queues[limit_offset] || queues[limit_offset].length === 0) return;
            clearTimeout(queues[limit_offset].timer);
            const batch = [...queues[limit_offset]];
            delete queues[limit_offset];
            try {
                const conversationIds = batch.map(item => item.resId);
                let results = await this.services.orm.call(resModel, method, [conversationIds, limit, offset, this.modelsUsedFields[resModel]], { context: this.env.context });
                if (group) { results = group(results); }
                this._sendBatchResolver(batch, results);
            } catch (error) {
                batch.forEach(item => item.reject(error));
            }
        };
        return (conversationId, limit = 22, offset = 0, withPriority = false) => {
            const limit_offset = getKey(limit, offset);
            if (!queues[limit_offset]) { queues[limit_offset] = []; }
            return new Promise((resolve, reject) => {
                queues[limit_offset].push({ resId: conversationId, resolve, reject });
                if (queues[limit_offset].length * Math.max(limit, 1) >= this.batchSize || withPriority) {
                    sendBatch(limit, offset);
                } else {
                    if (!queues[limit_offset].timer) {
                        queues[limit_offset].timer = setTimeout(() => { sendBatch(limit, offset); }, delay);
                    }
                }
            });
        };
    }

    async onNotification({ detail: notifications }) {
        for (const { type, payload } of notifications) {
            switch (type) {
                case 'new_messages':
                    await this.onNewMessage(payload);
                    break;
                case 'update_conversation':
                    await this.onUpdateConversation(payload);
                    break;
                case 'init_conversation':
                    await this.onInitConversation(payload);
                    break;
                case 'delete_conversation':
                    this.onDeleteConversation(payload);
                    break;
            }
        }
    }

    async onNewMessage(payload) {
        for (const convData of payload) {
            let conv = this.state.conversations.find(c => c.id === convData.id);
            if (conv) {
                await conv.updateFromJson(convData);
            } else {
                conv = new ConversationModel({ env: this.env });
                await conv.updateFromJson(convData);
                this.state.conversations.push(conv);
            }
        }
    }

    async onUpdateConversation(payload) {
        for (const convData of payload) {
            const conv = this.state.conversations.find(c => c.id === convData.id);
            if (conv) {
                await conv.updateFromJson(convData);
            }
        }
    }

    async onInitConversation(payload) {
        for (const convData of payload) {
            let conv = this.state.conversations.find(c => c.id === convData.id);
            if (conv) {
                await conv.updateFromJson(convData);
            } else {
                conv = new ConversationModel({ env: this.env });
                await conv.updateFromJson(convData);
                this.state.conversations.push(conv);
            }
            await this.selectConversation(conv);
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

    async selectConversation(conv) {
        if (this.state.selectedConversation?.id === conv.id) {
            return;
        }
        this.state.selectedConversation = conv;
        await conv.selected();
        this.state.mobileSide = 'middleSide';
    }

    deleteConversation(conv) {
        const index = this.state.conversations.findIndex(c => c.id === conv.id);
        if (index !== -1) {
            this.state.conversations.splice(index, 1);
        }
        if (this.state.selectedConversation?.id === conv.id) {
            this.state.selectedConversation = null;
            this.state.mobileSide = 'leftSide';
        }
    }

    async initAndNotify(id) {
        const data = await this.services.orm.call('acrux.chat.conversation', 'init_and_notify', [[id]], { context: this.env.context });
        if (data) {
            this.services.bus_service.trigger('notification', [{ type: 'init_conversation', payload: data }]);
        }
    }
}

export const chatroomService = {
    dependencies: ["orm", "bus_service", "action", "notification"],
    start(env, services) {
        const chatroom = new ChatroomService(env, services);
        return chatroom;
    },
};

registry.category("services").add("chatroom", chatroomService);
