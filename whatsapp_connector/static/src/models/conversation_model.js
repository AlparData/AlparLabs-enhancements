/** @odoo-module **/

import { deserializeDateTime } from "@web/core/l10n/dates";
import { Mutex } from "@web/core/utils/concurrency";
import { user } from "@web/core/user";
import { ChatBaseModel } from "./chat_base_model";
import { MessageModel } from "./message_model";

export class ConversationModel extends ChatBaseModel {
    constructor(comp) {
        super(comp);
        this.env = comp.env;
        this.id = false;
        this.name = '';
        this.number = '';
        this.numberFormat = '';
        this.status = 'new';
        this.borderColor = '#FFFFFF';
        this.imageUrl = '';
        this.team = { id: false, name: '' };
        this.partner = { id: false, name: '' };
        this.agent = { id: false, name: '' };
        this.connector = { id: false, name: '' };
        this.connectorType = '';
        this.showIcon = false;
        this.allowSigning = false;
        this.assigned = false;
        this.messages = [];
        this.messagesIds = new Set();
        this.countNewMsg = 0;
        this.lastActivity = luxon.DateTime.now();
        this.tagIds = [];
        this.note = '';
        this.allowedLangIds = [];
        this.convType = 'normal';
        this.oldesActivityDate = null;
        this.freeText = '';
        this.data = {};
        this.ready = false;
        this.msgCounter = -1;
        this.mutex = new Mutex();
        this.model = { load: this.load.bind(this) };
    }

    async updateFromJson(base) {
        if ('id' in base) {
            this.id = base.id;
            this.resId = base.id;
            this.resModel = 'acrux.chat.conversation';
        }
        if ('name' in base) { this.name = base.name; }
        if ('number' in base) { this.number = base.number; }
        if ('number_format' in base) { this.numberFormat = base.number_format; }
        if ('status' in base) { this.status = base.status; }
        if ('border_color' in base) { this.borderColor = base.border_color; }
        if ('image_url' in base) { this.imageUrl = base.image_url; }
        if ('team_id' in base) { this.team = this.convertRecordField(base.team_id); }
        if ('res_partner_id' in base) { this.partner = this.convertRecordField(base.res_partner_id); }
        if ('agent_id' in base) { this.agent = this.convertRecordField(base.agent_id); }
        if ('connector_id' in base) { this.connector = this.convertRecordField(base.connector_id); }
        if ('connector_type' in base) { this.connectorType = base.connector_type; }
        if ('show_icon' in base) { this.showIcon = base.show_icon; }
        if ('allow_signing' in base) { this.allowSigning = base.allow_signing; }
        if ('assigned' in base) { this.assigned = base.assigned; }
        if ('messages' in base) { await this.appendMessages(base.messages); }
        if ('last_activity' in base) { this.lastActivity = deserializeDateTime(base.last_activity); }
        if ('tag_ids' in base) { this.tagIds = base.tag_ids; }
        if ('note' in base) { this.note = base.note; }
        if ('allowed_lang_ids' in base) { this.allowedLangIds = base.allowed_lang_ids; }
        if ('conv_type' in base) { this.convType = base.conv_type; }
        if ('oldes_activity_date' in base) { this.oldesActivityDate = deserializeDateTime(base.oldes_activity_date); }
        if ('free_text' in base) { this.freeText = base.free_text; }
        this.data = Object.assign({}, this.data, base);
        if ('activity_ids' in this.data) {
            if (Array.isArray(this.data.activity_ids)) {
                this.data.activity_ids = { currentIds: this.data.activity_ids, records: [] };
            }
        }
        await super.updateFromJson(base);
        this.ready = true;
    }

    copyFromObj(conv) {
        Object.assign(this, conv);
        for (const msg of this.messages) { msg.conversation = this; }
    }

    async buildExtraObj() {
        await super.buildExtraObj();
        await Promise.all(this.messages.map(msg => msg.buildExtraObj()));
        this.ready = true;
    }

    async load() {
        const result = await this.env.conversationBuildDict(this.id, 22);
        this.env.services.bus_service.trigger('notification', [{ type: 'update_conversation', payload: result }]);
    }

    sortMessages() {
        this.messages.sort((a, b) => {
            let comp = a.dateMessage.toMillis() - b.dateMessage.toMillis();
            if (comp === 0) { comp = a.id - b.id; }
            return comp;
        });
    }

    async appendMessages(messages) {
        if (messages?.length > 0) {
            await this._appendMessages(messages.filter(m => !m.from_me));
            await this.mutex.exec(async () => await this._appendMessages(messages.filter(m => m.from_me)));
            this.sortMessages();
        }
        this.calculateMessageCount();
    }

    async _appendMessages(messages) {
        const newMessages = [];
        let msg = null;
        for (const msgData of messages) {
            if (!msgData.js_id || !this.messages.find(item => item.id === msgData.js_id)) {
                if (this.messagesIds.has(msgData.id)) {
                    msg = this.messages.find(item => item.id === msgData.id);
                } else {
                    this.messagesIds.add(msgData.id);
                    msg = new MessageModel(this);
                    newMessages.push(msg);
                }
                await msg.updateFromJson(msgData);
            }
        }
        this.messages.push(...newMessages);
        const quoted = this.messages.filter(msg => msg.quote).map(msg => msg.quote);
        if (quoted.length) {
            for (const msgData of messages) {
                const msgFound = quoted.find(m => m.id === msgData.id);
                if (msgFound) {
                    let msgTmp = { ...msgData };
                    delete msgTmp.quote_id;
                    await msgFound.updateFromJson(msgTmp);
                }
            }
        }
    }

    calculateMessageCount() {
        if (['new', 'current'].includes(this.status)) {
            const messages = this.messages.filter(msg => !msg.ttype.startsWith('info'));
            let lastIndexOf;
            if (Array.prototype.findLastIndex) {
                lastIndexOf = messages.findLastIndex(msg => msg.fromMe);
            } else {
                lastIndexOf = messages.map(msg => msg.fromMe).lastIndexOf(true);
            }
            this.countNewMsg = messages.length - (lastIndexOf + 1);
        } else {
            this.countNewMsg = 0;
        }
    }

    async syncMoreMessage({ forceSync = false, withPriority = false } = {}) {
        if (this.messages.length > 0 || forceSync) {
            this.ready = false;
            const result = await this.env.messageBuildDict(this.id, 22, this.messages.length, withPriority);
            if (!this.ready && result.length > 0) { await this.appendMessages(result[0].messages); }
            this.ready = true;
        }
    }

    async createMessage(options) {
        const msg = new MessageModel(this);
        msg.id = --this.msgCounter;
        await msg.updateFromJson(options);
        this.messages.push(msg);
        this.lastActivity = luxon.DateTime.now();
        this.env.chatBus.trigger('mobileNavigate', 'middleSide');
        this.calculateMessageCount();
        return msg;
    }

    async sendMessages(message) {
        message = message && message.status === 'new' ? message : undefined;
        const msgs = this.messages.filter(m => m.status === 'new' && m.fromMe && (!message || m === message));
        msgs.forEach(msg => { msg.status = 'sending'; });
        await this.mutex.exec(async () => {
            for (const msg of msgs) {
                try {
                    const jsonData = msg.exportToVals();
                    const result = await this.env.services.orm.call(this.env.chatModel, 'send_message', [[this.id], jsonData], { context: this.env.context });
                    this.messagesIds.add(result[0].id);
                    await msg.updateFromJson(result[0]);
                    msg.status = 'sent';
                } catch (e) {
                    msg.status = 'new';
                    msg.errorMsg = e?.data?.message || e?.message || `${e}`;
                    console.error(e);
                }
            }
            this.sortMessages();
        });
        return msgs.filter(m => m.status === 'sent');
    }

    async sendProduct(productId) {
        await this.env.services.orm.silent.call(this.env.chatModel, 'send_message_product', [[this.id], parseInt(productId)], { context: this.env.context });
    }

    async deleteMessage(message) {
        if (message.status === 'new') {
            this.messages = this.messages.filter(m => m !== message);
            message.deleteResModelObj();
        }
    }

    async messageSeen() {
        try {
            await this.env.services.orm.silent.call(this.env.chatModel, 'conversation_send_read', [[this.id]], { context: this.env.context });
        } catch (e) {
            console.error(e);
        }
    }

    isMine() {
        return (this.status === 'current' && this.agent.id === user.userId);
    }

    isCurrent() {
        let out = this.status === 'current';
        if (!this.env.isAdmin()) {
            out = out && this.agent.id === user.userId;
        }
        return out;
    }

    getIconClass() {
        let out = 'acrux_whatsapp';
        if (this.connectorType === 'facebook') {
            out = 'acrux_messenger';
        } else if (this.connectorType === 'instagram') {
            out = 'acrux_instagram';
        } else if (this.isWechat()) {
            out = 'acrux_wechat';
        }
        return out;
    }

    async block() {
        const conv = await this.env.services.orm.call(this.env.chatModel, 'block_conversation', [this.id], { context: this.env.context });
        await this.updateFromJson(conv[0]);
        this.assigned = false;
    }

    async release() {
        await this.env.services.orm.call(this.env.chatModel, 'release_conversation', [this.id], { context: this.env.context });
    }

    get lastMessage() {
        let out = null;
        if (this.messages.length) {
            const messages = this.messages.filter(msg => msg.ttype !== 'info');
            if (messages.length) {
                out = messages[messages.length - 1];
            }
        }
        return out;
    }

    get isPrivate() { return this.convType === 'private'; }
    get isGroup() { return this.convType === 'group'; }

    async selected() {
        if (this.isCurrent()) { this.messageSeen(); }
        this.assigned = false;
    }

    async close() {
        try {
            await this.env.services.orm.silent.call(this.env.chatModel, 'close_from_ui', [[this.id]], { context: this.env.context });
        } catch (e) {
            console.error(e);
        }
    }

    isOwnerFacebook() {
        return ['facebook', 'instagram', 'waba_extern'].includes(this.connectorType);
    }

    isWabaExtern() { return this.connectorType === 'waba_extern'; }
    isWechat() { return this.connectorType === 'wechat'; }
}
