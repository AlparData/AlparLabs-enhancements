/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { patch } from "@web/core/utils/patch";
import { ChatroomActionTab } from "./chatroom_action_tab";

export class ConversationKanban extends ChatroomActionTab {
    getActionProps(props) {
        const out = super.getActionProps(props);
        Object.assign(out, { chatroomOpenRecord: this.openRecord.bind(this) });
        return out;
    }

    getExtraContext(props) {
        return { chatroom_fold_null_group: true, ...super.getExtraContext(props) };
    }

    async openRecord(record, mode) {
        if (mode === 'edit') {
            const action = {
                type: 'ir.actions.act_window',
                name: _t('Edit'),
                view_type: 'form',
                view_mode: 'form',
                res_model: this.env.chatModel,
                views: [[this.props.formViewId, 'form']],
                target: 'new',
                res_id: record.resId,
                context: { ...this.env.context, only_edit: true },
            };
            const onSave = async () => {
                await this.env.services.orm.call(this.env.chatModel, 'update_conversation_bus', [[record.resId]], { context: this.env.context });
                await this.env.services.action.doAction({ type: 'ir.actions.act_window_close' });
            };
            await this.env.services.action.doAction(action, { props: { onSave } });
        } else {
            await this.env.services.orm.call(this.env.chatModel, 'init_and_notify', [[record.resId]], { context: this.env.context });
        }
    }

    async onSave(record) {
        await super.onSave(record);
    }
}

ConversationKanban.props = { ...ChatroomActionTab.props };
ConversationKanban.defaultProps = { ...ChatroomActionTab.defaultProps };

patch(ConversationKanban.props, {
    viewModel: { type: String, optional: true },
    viewType: { type: String, optional: true },
    viewKey: { type: String, optional: true },
    formViewId: { type: Number, optional: true },
});

patch(ConversationKanban.defaultProps, {
    viewModel: 'acrux.chat.conversation',
    viewType: 'kanban',
    viewKey: 'conv_kanban',
});
