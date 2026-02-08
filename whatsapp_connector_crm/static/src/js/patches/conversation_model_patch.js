/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ConversationModel } from "@whatsapp_connector/models/conversation_model";

patch(ConversationModel.prototype, {
    updateFromJson(base) {
        super.updateFromJson(base);
        if (!this.lead) {
            this.lead = { id: 0, name: '' };
        }
        if ('crm_lead_id' in base) {
            this.lead = this.convertRecordField(base.crm_lead_id);
        }
    }
});
