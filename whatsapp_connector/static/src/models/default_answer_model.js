/** @odoo-module **/

import { MessageBaseModel } from "@whatsapp_connector/models/message_base_model";

export class DefaultAnswerModel extends MessageBaseModel {
    constructor(comp) {
        super(comp);
        this.name = '';
        this.sequence = 0;
    }

    async updateFromJson(base) {
        if ('name' in base) { this.name = base.name; }
        if ('sequence' in base) { this.sequence = base.sequence; }
        await super.updateFromJson(base);
    }
}
