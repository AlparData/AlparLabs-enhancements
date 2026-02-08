/** @odoo-module **/

import { Attachment } from "@whatsapp_connector/models/attachment";
import { AttachmentList as AttachmentListBase } from "@mail/core/common/attachment_list";

export class AttachmentList extends AttachmentListBase {
    onClickUnlink(attachment) {
        let out;
        if (attachment && attachment.isAcrux) {
            out = this.props.unlinkAttachment(attachment);
        } else {
            out = super.onClickUnlink(attachment);
        }
        return out;
    }
}
