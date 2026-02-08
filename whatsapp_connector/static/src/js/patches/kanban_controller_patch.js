/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { KanbanController } from "@web/views/kanban/kanban_controller";
import { useBus } from "@web/core/utils/hooks";

patch(KanbanController.prototype, {
    setup() {
        super.setup();
        if (this.props?.chatroomTab && this.env.chatBus) {
            useBus(this.env.chatBus, 'updateChatroomAction', async ({ detail: chatroomTab }) => {
                if (this.props.chatroomTab === chatroomTab) {
                    await this.model.root.load();
                    await this.onUpdatedPager();
                    this.render(true);
                }
            });
            useBus(this.env.chatBus, 'updateConversation', async () => {
                await this.model.load();
            });
        }
    },
    async openRecord(record, mode) {
        if (this.props?.chatroomTab && this.props?.chatroomOpenRecord) {
            await this.props?.chatroomOpenRecord(record, mode);
        } else {
            await super.openRecord(record, mode);
        }
    }
});

patch(KanbanController.props, {
    chatroomTab: { type: String, optional: true },
    chatroomOpenRecord: { type: Function, optional: true },
});
