/** @odoo-module **/

import { Component } from "@odoo/owl";

export class ChatroomHeader extends Component {
    setup() {
        super.setup();
    }
}

ChatroomHeader.template = 'chatroom.ChatroomHeader';
ChatroomHeader.props = {
    slots: Object,
    className: { type: String, optional: true }
};
ChatroomHeader.defaultProps = {
    className: ''
};
