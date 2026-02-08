/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { Toolbox } from "@whatsapp_connector/components/toolbox/toolbox";

patch(Toolbox.prototype, {
    get botProps() {
        return Object.values(this.props.bots_map).filter(bot => bot.ai_bot_type === 'bot').sort((a, b) => {
            if (a.seq !== b.seq) {
                return a.seq.localeCompare(b.seq);
            }
            return a.id - b.id;
        });
    },

    async onBotGenerate(ev) {
        const text = await this.env.services.orm.call('acrux.chat.bot', 'bot_get_ai_id', [parseInt(ev.currentTarget.dataset.id), this.props.selectedConversation.id], {
            context: this.env.context
        });
        if (text) {
            this.env.chatBus.trigger('setInputText', text);
        }
    },
});

patch(Toolbox.props, {
    bots_map: { type: Object },
    bots: { type: Array, element: { type: Object } },
});
