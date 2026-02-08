/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ListController } from "@web/views/list/list_controller";
import { useBus } from "@web/core/utils/hooks";

patch(ListController.prototype, {
    setup() {
        super.setup();
        if (this.props?.chatroomTab) {
            this.archInfo.headerButtons = [];
            if (this.env.chatBus) {
                useBus(this.env.chatBus, 'updateChatroomAction', async ({ detail: chatroomTab }) => {
                    if (this.props.chatroomTab === chatroomTab) {
                        await this.model.load();
                    }
                });
                useBus(this.env.chatBus, 'updateConversation', async () => {
                    await this.model.load();
                });
            }
        }
    },
    async chatroomSelect() {
        const [selected] = await this.getSelectedResIds();
        if (this.model?.root?.records) {
            const record = this.model.root.records.find(record => record.resId === selected);
            if (record) {
                await this.props.chatroomSelect(record);
            }
        }
    }
});

patch(ListController.props, {
    showButtons: { type: Boolean, optional: true },
    chatroomTab: { type: String, optional: true },
    chatroomSelect: { type: Function, optional: true },
});
