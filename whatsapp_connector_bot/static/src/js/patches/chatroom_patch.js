/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Chatroom } from "@whatsapp_connector/components/chatroom/chatroom";

patch(Chatroom.prototype, {
    getInitState() {
        return {
            ...super.getInitState(),
            bots: [],
            bots_map: {}
        };
    },

    async willStart() {
        return Promise.all([
            super.willStart(),
            this.env.services.orm.searchRead('acrux.chat.bot', [['is_ai', '=', true]], ['name', 'color_text', 'ai_bot_type', 'seq'], {
                context: this.env.context
            }).then(data => {
                this.state.bots = data.map(d => ({ value: d.id, label: d.name }));
                this.state.bots_map = data.reduce((acc, obj) => {
                    acc[obj.id] = obj;
                    return acc;
                }, {});
            })
        ]);
    }
});
