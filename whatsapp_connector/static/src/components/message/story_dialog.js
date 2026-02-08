/** @odoo-module **/

import { Dialog } from "@web/core/dialog/dialog";
import { Component, xml } from "@odoo/owl";

export class StoryDialog extends Component {}

StoryDialog.template = xml`
<Dialog size="'lg'" fullscreen="true" bodyClass="'text-center'" title="props.title">
    <div href=""
        t-attf-style="background-image:url('{{props.url}}');width: auto;height: auto;"
        t-attf-data-mimetype="{{props.mime}}"
        class="o_Attachment_image o_image o-attachment-viewable o-details-overlay o-medium">
        <img t-attf-src="{{props.url}}" style="visibility: hidden;max-width: 100%; max-height: calc(100vh/1.5);" />
    </div>
</Dialog>`;
StoryDialog.components = { Dialog };
StoryDialog.props = {
    close: { type: Function, optional: true },
    mime: String,
    url: String,
    title: String,
};
