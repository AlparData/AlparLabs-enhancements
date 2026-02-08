/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { Many2OneAvatarField } from "@web/views/fields/many2one_avatar/many2one_avatar_field";
import { Component, xml, useRef } from "@odoo/owl";
import { AttachmentList } from "../attachmentList/attachmentList";
import { AudioPlayer } from "../audioPlayer/audioPlayer";
import { MessageModel } from "../../models/message_model";
import { MessageMetadata } from "./message_metadata";
import { MessageOptions } from "./message_options";
import { StoryDialog } from "./story_dialog";

export class Message extends Component {
    setup() {
        super.setup();
        this.optionsRef = useRef('optionsRef');
    }

    messageCssClass() {
        const list = this.messageCssClassList();
        if (this.props.message.dateDelete) {
            list.push('o_chat_msg_deleted');
        }
        return list.join(' ');
    }

    messageCssClassList() { return []; }

    async onTranscribe() {
        const { orm } = this.env.services;
        const data = await orm.call('acrux.chat.message', 'transcribe', [[this.props.message.id], this.env.canTranscribe()], { context: this.env.context });
        this.props.message.transcription = data;
    }

    async onTranslate() {
        const { orm } = this.env.services;
        const lang = this.env.getCurrentLang();
        const data = await orm.call('acrux.chat.message', 'translate', [[this.props.message.id], this.env.canTranslate(), lang], { context: this.env.context });
        this.props.message.traduction = data;
    }

    get canTranslate() {
        return this.env.canTranslate() && this.props.message.isSent && this.props.message.ttype !== 'sticker';
    }

    get canTranscribe() {
        return this.env.canTranscribe() && this.props.message.isSent && ['audio', 'video'].includes(this.props.message.ttype);
    }

    get avatarProps() {
        return {
            name: 'createUid',
            relation: 'res.users',
            string: _t('Agent'),
            readonly: true,
            record: { data: { createUid: [this.props.message.createUid.id, this.props.message.createUid.name] } }
        };
    }

    openStoryImage() {
        const { mime, data } = this.props.message.resModelObj;
        const url = `data:${mime};base64,${data}`;
        this.env.services.dialog.add(StoryDialog, { url, mime, title: _t('Story') });
    }

    async openOdooChat() {
        const threadService = this.env.services["mail.thread"];
        threadService.openChat({ userId: this.props.message.createUid.id });
    }

    showMessageOption() {
        if (this.optionsPopoverCloseFn) {
            this.optionsPopoverCloseFn();
            this.optionsPopoverCloseFn = null;
        } else {
            if (this.props.message.conversation?.isCurrent()) {
                this.optionsPopoverCloseFn = this.env.services.popover.add(this.optionsRef.el, MessageOptions, {
                    message: this.props.message,
                    env: this.env,
                    close: () => {
                        if (this.optionsPopoverCloseFn) {
                            this.optionsPopoverCloseFn();
                            this.optionsPopoverCloseFn = null;
                        }
                    },
                }, { position: 'bottom', onClose: () => this.optionsPopoverCloseFn = null });
            }
        }
    }

    clickQuoteMessage(ev) {
        ev.stopPropagation();
        const messages = this.props.message.conversation.messages;
        const quote = messages.find(msg => msg.id === this.props.message.quote.id);
        const data = { message: quote ? quote : messages[0] };
        if (quote) {
            data.effect = 'blink';
            data.className = 'active_quote';
        }
        this.env.chatBus.trigger('inmediateScrollToMessage', data);
    }

    async onDelete() {
        await this.props.message.conversation.deleteMessage(this.props.message);
    }

    async onSend() {
        await this.props.message.conversation.sendMessages(this.props.message);
    }
}

Message.template = 'chatroom.Message';
Message.props = {
    message: MessageModel,
    noAction: { type: Boolean, optional: true },
};
Message.defaultProps = {
    noAction: false,
};
Message.components = { AttachmentList, AudioPlayer, MessageMetadata, Many2OneAvatarField, MessageOptions, Message };
