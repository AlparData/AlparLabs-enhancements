/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { SelectMenu } from "@web/core/select_menu/select_menu";
import { _t } from "@web/core/l10n/translation";
import { ConversationList } from "@whatsapp_connector/components/conversationList/conversationList";

patch(ConversationList.prototype, {
    getInitState() {
        return {
            ...super.getInitState(),
            selected_bots: [],
        };
    },

    getFilters() {
        return {
            ...super.getFilters(),
            filterBots: this.state.selected_bots,
        };
    },

    get botSelectProps() {
        return {
            choices: this.props.bots,
            required: false,
            searchable: false,
            multiSelect: true,
            onSelect: value => {
                this.state.selected_bots = value;
                this.doLocalFilter();
            },
            value: this.state.selected_bots,
            placeholder: _t('AI Bot'),
        };
    },

    evaluateFilter(conv) {
        return super.evaluateFilter(conv) && (this.state.selected_bots.length === 0 || (conv.bot.id && this.state.selected_bots.includes(conv.bot.id)));
    }
});

patch(ConversationList.props, {
    bots_map: { type: Object },
    bots: { type: Array, element: { type: Object } },
});

patch(ConversationList.components, { SelectMenu });
