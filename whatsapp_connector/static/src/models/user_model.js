/** @odoo-module **/

import { ChatBaseModel } from "@whatsapp_connector/models/chat_base_model";

export class UserModel extends ChatBaseModel {
    constructor(comp) {
        super(comp);
        this.id = 0;
        this.status = false;
        this.signingActive = false;
        this.tabOrientation = 'vertical';
    }

    async updateFromJson(base) {
        if ('id' in base) { this.id = base.id; }
        if ('acrux_chat_active' in base) { this.status = base.acrux_chat_active; }
        if ('chatroom_signing_active' in base) { this.signingActive = base.chatroom_signing_active; }
        if ('chatroom_tab_orientation' in base) { this.tabOrientation = base.chatroom_tab_orientation; }
        await super.updateFromJson(base);
    }
}
