/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { deserializeDateTime, formatDateTime, formatDate, serializeDateTime } from "@web/core/l10n/dates";
import { assignDefined } from "@mail/utils/common/misc";
import { MessageBaseModel } from "@whatsapp_connector/models/message_base_model";
import { Attachment } from "@whatsapp_connector/models/attachment";

const { DateTime } = luxon;

export class MessageModel extends MessageBaseModel {
    constructor(comp) {
        super(comp);
        this.env = undefined;
        this.conversation = comp;
        this.fromMe = false;
        this.errorMsg = '';
        this.showProductText = false;
        this.dateMessage = luxon.DateTime.now();
        this.sentDate = null;
        this.location = null;
        this.resModelObj = null;
        this.titleColor = '#000000';
        this.metadataType = null;
        this.metadataJson = null;
        this.createUid = { id: false, name: '' };
        this.transcription = null; // duplicated in original, keeping it once
        this.traduction = null;
        this.urlDue = false;
        this.customUrl = '';
        this.contactName = '';
        this.contactNumber = '';
        this.quote = null;
        this.dateDelete = null;
        this.status = 'new';
    }

    async updateFromJson(base) {
        if ('from_me' in base) { this.fromMe = base.from_me; }
        if ('error_msg' in base) { this.errorMsg = base.error_msg; }
        if ('show_product_text' in base) { this.showProductText = base.show_product_text; }
        if ('res_model_obj' in base) { this.resModelObj = base.res_model_obj; }
        if ('date_message' in base) {
            this.dateMessage = base.date_message;
            if (this.dateMessage) { this.convertDate('dateMessage'); }
        }
        if ('title_color' in base) {
            this.titleColor = base.title_color;
            this.titleColor = this.titleColor != '#FFFFFF' ? this.titleColor : '#000000';
        }
        if ('metadata_type' in base) { this.metadataType = base.metadata_type; }
        if ('metadata_json' in base) { this.metadataJson = base.metadata_json; }
        if ('create_uid' in base) { this.createUid = this.convertRecordField(base.create_uid); }
        if ('transcription' in base) { this.transcription = base.transcription; }
        if ('traduction' in base) { this.traduction = base.traduction; }
        if ('url_due' in base) { this.urlDue = base.url_due; }
        if ('custom_url' in base) { this.customUrl = base.custom_url; }
        if ('contact_name' in base) { this.contactName = base.contact_name; }
        if ('contact_number' in base) { this.contactNumber = base.contact_number; }
        if ('date_delete' in base) {
            this.dateDelete = base.date_delete;
            if (this.dateDelete) { this.convertDate('dateDelete'); }
        }
        if ('quote_id' in base) {
            if (base.quote_id) {
                if (base.quote_id instanceof MessageModel) {
                    this.quote = base.quote_id;
                } else {
                    const quote_id = { ...base.quote_id };
                    if (quote_id.metadata_type) { delete (quote_id.metadata_type); }
                    if (quote_id.button_ids) { delete (quote_id.button_ids); }
                    this.quote = new MessageModel(this.conversation);
                    await this.quote.updateFromJson(quote_id);
                }
            } else {
                this.quote = null;
            }
        }
        if ('sent_date' in base) {
            this.sentDate = base.sent_date;
            if (this.sentDate) { this.convertDate('sentDate'); }
        }
        await super.updateFromJson(base);
    }

    exportToJson() {
        const out = {};
        out.text = this.text;
        out.from_me = this.fromMe;
        out.ttype = this.ttype;
        out.res_model = this.resModel;
        out.res_id = this.resId;
        if (this.id) { out.id = this.id; }
        out.title_color = this.titleColor;
        if (this.dateMessage) { out.date_message = serializeDateTime(this.dateMessage); }
        if (this.metadataType) { out.metadata_type = this.metadataType; }
        if (this.metadataJson) { out.metadata_json = this.metadataJson; }
        if (this.buttons) { out.button_ids = this.buttons; }
        if (this.createUid.id) { out.create_uid = [this.createUid.id, this.createUid.name]; }
        if (this.chatList.id) { out.chat_list_id = this.chatListRecord; }
        if (this.transcription) { out.transcription = this.transcription; }
        if (this.traduction) { out.traduction = this.traduction; }
        if (this.quote) { out.quote_id = this.quote.exportToJson(); }
        if (this.dateDelete) { out.date_delete = serializeDateTime(this.dateDelete); }
        if (this.sentDate) { out.sent_date = serializeDateTime(this.sentDate); }
        return out;
    }

    exportToVals() {
        const out = this.exportToJson();
        delete out.title_color;
        if (out.button_ids) { out.button_ids = out.button_ids.map(btn => [0, 0, btn]); }
        if (out.create_uid) { delete out.create_uid; }
        if (out.chat_list_id && out.chat_list_id[0]) { out.chat_list_id = out.chat_list_id[0]; }
        if (out.quote_id) { out.quote_id = out.quote_id.id; }
        return out;
    }

    async buildExtraObj() {
        await super.buildExtraObj();
        if (this.fromMe) {
            if (this.ttype.startsWith('info')) {
                this.status = 'sent';
            } else if (this.sentDate) {
                this.status = 'sent';
            }
        } else {
            this.status = 'received';
        }
        if (this.ttype == 'location') { this.createLocationObj(); }
        if (this.ttype === 'url' && this.text) {
            const subTypes = { story_mention: _t('A story mention you.') };
            if (this.text in subTypes) { this.text = subTypes[this.text]; }
        }
        if (this.resModelObj) {
            this.buildResModelObj(this.resModelObj);
            this.resModelObj.message = this;
        } else {
            if (this.resModel) {
                let result = [];
                if (this.env.readFromChatroom[this.resModel]) {
                    result = await this.env.readFromChatroom[this.resModel](this.resId);
                } else {
                    result = await this.env.services.orm.call(this.resModel, 'read_from_chatroom', [[this.resId], this.env.modelsUsedFields[this.resModel]], { context: this.env.context });
                }
                this.resModelObj = {};
                if (result.length) {
                    result[0].displayName = result[0].display_name;
                    this.buildResModelObj(result[0]);
                    this.resModelObj.message = this;
                }
            }
            if (this.ttype === 'url') {
                this.resModelObj = {};
                if (!this.urlDue) {
                    const data = await this.env.services.orm.call('acrux.chat.message', 'check_url_due', [this.id], { context: this.env.context });
                    this.urlDue = data.url_due;
                    if (!this.urlDue) { this.resModelObj = data; }
                }
            }
        }
        if (this.quote) { await this.quote.buildExtraObj(); }
    }

    buildResModelObj(attachRes) {
        if (this.isProductType) {
            const attach = { ...attachRes };
            const { res_model, res_id, res_field } = attach;
            this.resModelObj = attach;
            this.resModelObj.url = `/web/image?model=${res_model}&id=${res_id}&field=${res_field}`;
        } else {
            this.resModelObj = this.createAttachObject(attachRes);
        }
    }

    deleteResModelObj() {
        if (this.resModelObj?.res_model === 'acrux.chat.message') {
            this.env.chatBus.trigger('deleteAttachment', { attachment: this.resModelObj, silent: true });
        }
    }

    get date() { return formatDate(this.dateMessage); }
    get dateFull() {
        let dateDay = this.dateMessage.toLocaleString(DateTime.DATE_FULL);
        if (dateDay === DateTime.now().toLocaleString(DateTime.DATE_FULL)) { dateDay = _t('Today'); }
        return dateDay;
    }
    get dateFullTime() { return this.dateMessage.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS); }
    get hour() { return formatDateTime(this.dateMessage, { format: 'HH:mm' }); }
    get isProductType() { return this.ttype === 'image' && this.isProduct; }
    get authorName() {
        let name = false;
        if (this.contactName && this.contactNumber) {
            name = `${this.contactName} (${this.contactNumber})`;
        } else {
            name = this.contactName || this.contactNumber;
        }
        return this.fromMe ? '' : name;
    }
    get isSent() { return this.status === 'sent'; }

    createLocationObj() {
        if (this.text) {
            try {
                let text = this.text.split('\n');
                let locObj = {};
                locObj.displayName = text[0].trim();
                locObj.address = text[1].trim();
                locObj.coordinate = text[2].trim();
                text = locObj.coordinate.replace('(', '').replace(')', '');
                text = text.split(',');
                locObj.coordinate = { x: text[0].trim(), y: text[1].trim() };
                const lang = navigator.language || navigator.userLanguage;
                const hl = lang.split('-')[0];
                if (!locObj.displayName || locObj.displayName.startsWith('Location:')) {
                    locObj.mapUrl = `https://maps.google.com/maps?q=${locObj.coordinate.x},${locObj.coordinate.y}&z=17&hl=${hl}`;
                } else {
                    locObj.mapUrl = 'https://maps.google.com/maps/search/';
                    locObj.mapUrl += `${locObj.displayName}/@${locObj.coordinate.x},${locObj.coordinate.y},17z?hl=${hl}`;
                }
                locObj.mapUrl = encodeURI(locObj.mapUrl);
                this.location = locObj;
            } catch (err) {
                console.log('error location');
                console.log(err);
            }
        }
    }

    convertDate(field) {
        if (this[field] && (this[field] instanceof String || typeof this[field] === 'string')) {
            this[field] = deserializeDateTime(this[field]);
        }
    }

    createAttachObject(attachmentData) {
        let attachment = null;
        if (attachmentData instanceof Attachment) {
            attachment = attachmentData;
        } else {
            attachment = new Attachment();
            attachmentData['message'] = this;
            attachmentData['uploading'] = false;
            assignDefined(attachment, attachmentData, ['id', 'checksum', 'filename', 'mimetype', 'name', 'type', 'url', 'uploading', 'extension', 'accessToken', 'tmpUrl', 'message', 'isAcrux', 'res_model', 'res_id']);
            if (!('extension' in attachmentData) && attachmentData['name']) {
                attachment.extension = attachment.name.split('.').pop();
            }
        }
        attachment.res_id = this.id;
        attachment.message = this;
        if (['audio', 'sticker'].includes(this.ttype)) {
            attachment.url = `/web/content/${attachment.id}`;
        }
        return attachment;
    }

    canBeAnswered() {
        return ((!this.fromMe || (this.fromMe && this.isSent)) && !this.dateDelete && (!this.conversation.isOwnerFacebook() || this.conversation.isWabaExtern()) && !this.conversation.isWechat());
    }

    canBeDeleted() {
        return (this.isSent && !this.dateDelete && !this.conversation.isOwnerFacebook() && !this.conversation.isWechat());
    }

    hasTitle() {
        return !this.fromMe && this.authorName;
    }
}
