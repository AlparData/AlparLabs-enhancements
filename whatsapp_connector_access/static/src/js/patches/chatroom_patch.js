/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Chatroom } from "@whatsapp_connector/components/chatroom/chatroom";

patch(Chatroom.prototype, {
    setup() {
        super.setup();
        this.accessCache = {};
    },

    async canHaveThisConversation(conversation) {
        let out = await super.canHaveThisConversation(conversation);
        if (out) {
            if (!(conversation.id in this.accessCache)) {
                const conv = await this.env.services.orm.searchRead(this.env.chatModel, [
                    ['number', '=', conversation.number],
                    ['connector_id', '=', conversation.connector.id]
                ], ['id', 'name'], {
                    context: this.env.context,
                    limit: 1
                });
                this.accessCache[conversation.id] = conv.length > 0;
            }
            out = this.accessCache[conversation.id];
        }
        return out;
    }
});
