/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ActionDialog } from "@web/webclient/actions/action_dialog";
import { onWillDestroy, useEffect } from "@odoo/owl";

patch(ActionDialog.prototype, {
    setup() {
        super.setup();
        this.env.bus.trigger('last-dialog', this);
        onWillDestroy(() => this.env.bus.trigger('last-dialog', null));
        useEffect(() => {
            if (this.props?.actionProps?.context?.chatroom_wizard_search) {
                const defaultButton = this.modalRef.el.querySelector('.modal-footer button.o-default-button');
                if (defaultButton) {
                    defaultButton.classList.add('d-none');
                }
            }
        }, () => []);
    },
});
