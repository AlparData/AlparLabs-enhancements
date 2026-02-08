/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { Dialog } from "@web/core/dialog/dialog";
import { Component } from "@odoo/owl";
import { MessageModel } from "../../models/message_model";

const { DateTime } = luxon;

export class MessageOptions extends Component {
    setup() {
        super.setup();
    }

    answerMessage() {
        this.props.env.chatBus.trigger('quoteMessage', this.props.message);
        this.props.close();
    }

    deleteMessageDialog() {
        const self = this;
        class DeleteDialog extends Component {
            deleteForMe() {
                this.props.deleteMessage(true);
                this.props.close();
            }
            deleteForAll() {
                this.props.deleteMessage(false);
                this.props.close();
            }
        }
        DeleteDialog.components = { Dialog };
        DeleteDialog.template = 'chatroom.DeleteMessage';
        
        this.props.close();
        const props = {
            allowDeleteAll: this.getAllowDeleteAll(),
            deleteMessage: this.deleteMessage.bind(this),
            title: _t('Confirmation'),
            close: () => {} // handled by registry usually
        };
        this.env.services.dialog.add(DeleteDialog, props);
    }

    getAllowDeleteAll() {
        let allowDeleteAll = true;
        if (this.props.message.fromMe) {
            const now = DateTime.now();
            const { days } = now.diff(this.props.message.dateMessage, 'days').toObject();
            const { minutes } = now.diff(this.props.message.dateMessage, 'minutes').toObject();
            if (Math.floor(days) > 0) {
                allowDeleteAll = false;
            } else if (Math.floor(minutes) > 59) {
                allowDeleteAll = false;
            }
        } else {
            allowDeleteAll = false;
        }
        return allowDeleteAll;
    }

    async deleteMessage(forMe) {
        const msgData = await this.env.services.orm.call(this.props.env.chatModel, 'delete_message', [[this.props.message.conversation.id], this.props.message.id, forMe], { context: this.props.env.context });
        this.props.message.conversation.appendMessages(msgData);
    }
}

MessageOptions.template = 'chatroom.MessageOptions';
MessageOptions.props = {
    message: MessageModel,
    close: Function,
    env: Object,
};
