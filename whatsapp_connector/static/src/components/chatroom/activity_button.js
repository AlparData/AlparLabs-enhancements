/** @odoo-module **/

import { ActivityButton as ActivityButtonBase } from "@mail/core/web/activity_button";

export class ActivityButton extends ActivityButtonBase {
    setup() {
        super.setup();
    }

    get buttonClass() {
        let classes = super.buttonClass.split(' ');
        classes = classes.filter(c => c !== this.props.record.data.activity_type_icon);
        classes = classes.filter(c => !['text-dark', 'btn-link'].includes(c));
        classes.push('fa-clock-o');
        return classes.join(' ');
    }
}
