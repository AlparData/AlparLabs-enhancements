/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { KanbanRenderer } from "@web/views/kanban/kanban_renderer";

patch(KanbanRenderer.prototype, {
    async sortRecordDrop(dataRecordId, dataGroupId, { element, parent, previous }) {
        let record = null;
        if (this.env.chatBus) {
            const targetGroupId = parent && parent.dataset.id;
            const sourceGroup = this.props.list.groups.find((g) => g.id === dataGroupId);
            const targetGroup = this.props.list.groups.find((g) => g.id === targetGroupId);
            if (sourceGroup && targetGroup) {
                record = sourceGroup.list.records.find((r) => r.id === dataRecordId);
            }
        }
        await super.sortRecordDrop(dataRecordId, dataGroupId, { element, parent, previous });
        if (this.env.chatBus && record) {
            await this.env.services.orm.call(this.env.chatModel, 'update_conversation_bus', [[record.resId]], { context: this.env.context });
        }
    }
});
