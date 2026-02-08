/** @odoo-module **/

import { FileModelMixin } from "@web/core/file_viewer/file_model";

export class Attachment extends FileModelMixin(Object) {
    constructor() {
        super(...arguments);
        this.message = undefined;
    }
    get isDeletable() {
        return !this.message;
    }
}
