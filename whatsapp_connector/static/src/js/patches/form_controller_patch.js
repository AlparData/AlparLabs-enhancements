/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { FormController } from "@web/views/form/form_controller";
import { useSubEnv } from "@odoo/owl";
import { useBus } from "@web/core/utils/hooks";

patch(FormController.prototype, {
    setup() {
        super.setup();
        if (this.env.chatBus) {
            if (this.env.config) {
                const config = { ...this.env.config };
                config.historyBack = () => { };
                useSubEnv({ config });
            }
            useBus(this.env.chatBus, 'updateChatroomAction', async ({ detail: chatroomTab }) => {
                if (this.props.chatroomTab === chatroomTab) {
                    await this.model.load();
                }
            });
            useBus(this.env.chatBus, 'updateConversation', async () => {
                await this.model.load();
            });
        }
    },
    async discard() {
        await super.discard();
        if (this.env.chatBus) {
            if (this.model.root.isNew && this.props.resId) {
                await this.model.load({ resId: this.props.resId });
            }
        }
    }
});

patch(FormController.props, {
    chatroomTab: { type: String, optional: true },
    searchButton: { type: Boolean, optional: true },
    searchButtonString: { type: String, optional: true },
    searchAction: { type: Function, optional: true },
});
