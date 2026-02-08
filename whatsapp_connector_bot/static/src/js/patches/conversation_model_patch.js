/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ConversationModel } from "@whatsapp_connector/models/conversation_model";

patch(ConversationModel.prototype, {
    constructor() {
        super.constructor(...arguments);
        this.bot = { id: false, name: '' };
    },

    async updateFromJson(base) {
        await super.updateFromJson(base);
        if ('bot_id' in base) {
            this.bot = this.convertRecordField(base.bot_id);
        }
    }
});
