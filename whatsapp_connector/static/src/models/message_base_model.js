/** @odoo-module **/

import { ChatBaseModel } from "@whatsapp_connector/models/chat_base_model";

export class MessageBaseModel extends ChatBaseModel {
    constructor(comp) {
        super(comp);
        this.id = 0;
        this.ttype = 'text';
        this.text = '';
        this.isProduct = false;
        this.resModel = '';
        this.resId = 0;
        this.chatList = { id: false, name: '' };
        this.buttons = [];
    }

    async updateFromJson(base) {
        if ('id' in base) { this.id = base.id; }
        if ('ttype' in base) { this.ttype = base.ttype; }
        if ('text' in base) { this.text = base.text; }
        if ('is_product' in base) { this.isProduct = base.is_product; }
        if ('res_model' in base) { this.resModel = base.res_model; }
        if ('res_id' in base) { this.resId = base.res_id; }
        if ('chat_list_id' in base) { this.chatList = this.convertRecordField(base.chat_list_id); }
        if ('button_ids' in base) { this.buttons = base.button_ids; }
        await super.updateFromJson(base);
    }

    get chatListRecord() {
        return this.chatList.id ? [this.chatList.id, this.chatList.name] : false;
    }
}
