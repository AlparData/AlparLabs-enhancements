/** @odoo-module **/

import { Component, useRef } from "@odoo/owl";

export class ChatSearch extends Component {
    setup() {
        super.setup();
        this.inputSearch = useRef('inputSearch');
    }

    onKeypress(event) {
        if (event.which === 13) {
            this.env.chatBus.trigger(this.props.searchEvent, { search: this.inputSearch.el.value });
        }
    }

    onSearch() {
        this.env.chatBus.trigger(this.props.searchEvent, { search: this.inputSearch.el.value });
    }

    onClean() {
        this.inputSearch.el.value = '';
        this.env.chatBus.trigger(this.props.cleanEvent || this.props.searchEvent, { search: '' });
    }
}

ChatSearch.template = 'chatroom.ChatSearch';
ChatSearch.props = {
    placeHolder: { type: String, optional: true },
    cleanEvent: { type: String, optional: true },
    searchEvent: String,
    slots: { type: Object, optional: true },
};
ChatSearch.defaultProps = {
    placeHolder: '',
};
