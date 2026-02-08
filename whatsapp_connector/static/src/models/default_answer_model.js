/** @odoo-module **/

import { MessageBaseModel } from "./message_base_model";

export class DefaultAnswerModel extends MessageBaseModel {
    constructor(comp) {
        super(comp);
        this.env = undefined;
        this.name = '';
        this.sequence = 0;
        this.connector = { id: false, name: '' };
    }

    async updateFromJson(base) {
        if ('name' in base) { this.name = base.name; }
        if ('sequence' in base) { this.sequence = base.sequence; }
        if ('connector_id' in base) { this.connector = this.convertRecordField(base.connector_id); }
        await super.updateFromJson(base);
    }
}
