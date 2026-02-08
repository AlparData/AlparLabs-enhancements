/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { WarningDialog } from "@web/core/errors/error_dialogs";
import { Component } from "@odoo/owl";
import { ConversationModel } from "@whatsapp_connector/models/conversation_model";
import { DefaultAnswerModel } from "@whatsapp_connector/models/default_answer_model";

export class DefaultAnswer extends Component {
    async sendAnswer(event) {
        let out = Promise.resolve();
        if (event) { event.target.disabled = true; }
        if (this.props.selectedConversation && this.props.selectedConversation.isCurrent()) {
            let text, ttype = this.props.defaultAnswer.ttype;
            if (ttype === 'code') {
                ttype = 'text';
                text = await this.env.services.orm.call('acrux.chat.default.answer', 'eval_answer', [[this.props.defaultAnswer.id], this.props.selectedConversation.id], { context: this.env.context });
            } else {
                if (this.props.defaultAnswer.text && '' !== this.props.defaultAnswer.text) {
                    text = this.props.defaultAnswer.text;
                } else {
                    text = this.props.defaultAnswer.name;
                }
            }
            const options = {
                from_me: true,
                text: text,
                ttype: ttype,
                res_model: this.props.defaultAnswer.resModel,
                res_id: this.props.defaultAnswer.resId,
                button_ids: this.props.defaultAnswer.buttons.map(btn => {
                    const btn2 = { ...btn };
                    delete btn2.id;
                    return btn2;
                }),
                chat_list_id: this.props.defaultAnswer.chatListRecord
            };
            if (ttype === 'text' && text) {
                this.env.chatBus.trigger('setInputText', text);
            } else {
                out = this.props.selectedConversation.createMessage(options);
                out.then(() => this.props.selectedConversation.sendMessages());
            }
        } else {
            this.env.services.dialog.add(WarningDialog, { message: _t('You must select a conversation.') });
        }
        return out.finally(() => {
            if (event) { event.target.disabled = false; }
        });
    }
}

DefaultAnswer.template = 'chatroom.DefaultAnswer';
DefaultAnswer.props = {
    selectedConversation: { optional: true },
    defaultAnswer: Object,
};
