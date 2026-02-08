/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ActionContainer } from "@web/webclient/actions/action_container";

patch(ActionContainer.prototype, {
    setup() {
        super.setup();
        this.env.bus.removeEventListener('ACTION_MANAGER:UPDATE', this.onActionManagerUpdate);
        const superOnActionManagerUpdate = this.onActionManagerUpdate;
        this.onActionManagerUpdate = ({ detail: info }) => {
            if (info?.componentProps?.chatroomTab) {
                // Skip update if chatroom tab is active
            } else {
                superOnActionManagerUpdate({ detail: info });
            }
        };
        this.env.bus.addEventListener('ACTION_MANAGER:UPDATE', this.onActionManagerUpdate);
    },
});
