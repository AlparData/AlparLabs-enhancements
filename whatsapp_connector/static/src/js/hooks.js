/** @odoo-module **/

import { useState } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";
import { Deferred } from "@web/core/utils/concurrency";
import { useBus, useService } from "@web/core/utils/hooks";
import { assignDefined } from "@mail/utils/common/misc";
import { rpc } from "@web/core/network/rpc";
import { Attachment } from "../models/attachment";
import { dataUrlToBlob, getNextId } from "./utils";

export function useAttachmentUploader({ onFileUploaded, buildFormData }) {
    const { bus, upload } = useService('file_upload');
    const notificationService = useService('notification');
    const ui = useService('ui');
    const abortByAttachmentId = new Map();
    const deferredByAttachmentId = new Map();
    const uploadingAttachmentIds = new Set();
    
    const state = useState({
        uploadData({ data, name, type }) {
            const file = new File([dataUrlToBlob(data, type)], name, { type });
            return this.uploadFile(file);
        },
        async uploadFile(file, { silent = false } = {}) {
            const tmpId = getNextId();
            uploadingAttachmentIds.add(tmpId);
            await upload('/web/binary/upload_attachment_chat', [file], {
                buildFormData(formData) {
                    buildFormData?.(formData);
                    formData.append('is_pending', false);
                    formData.append('temporary_id', tmpId);
                },
            }).catch((e) => {
                if (e.name !== 'AbortError') { throw e; }
            });
            const uploadDoneDeferred = new Deferred();
            deferredByAttachmentId.set(tmpId, uploadDoneDeferred);
            let out = uploadDoneDeferred;
            if (silent) {
                out = new Deferred();
                uploadDoneDeferred.then(attachment => out.resolve(attachment)).catch(() => out.resolve(null));
            }
            return out;
        },
        async unlink(attachment, { silent = false } = {}) {
            const abort = abortByAttachmentId.get(attachment.id);
            const def = deferredByAttachmentId.get(attachment.id);
            if (abort) {
                abort();
                def.resolve();
            }
            abortByAttachmentId.delete(attachment.id);
            deferredByAttachmentId.delete(attachment.id);
            try {
                await rpc('/mail/attachment/delete', assignDefined({ attachment_id: attachment.id }, { access_token: attachment.accessToken }));
            } catch (e) {
                if (!silent) { throw e; }
            }
        },
        clear() {
            abortByAttachmentId.clear();
            deferredByAttachmentId.clear();
            uploadingAttachmentIds.clear();
        },
    });

    useBus(bus, 'FILE_UPLOAD_LOADED', ({ detail: { upload } }) => {
        const tmpId = upload.data.get('temporary_id');
        if (uploadingAttachmentIds.has(tmpId)) {
            ui.unblock();
            const def = deferredByAttachmentId.get(tmpId);
            uploadingAttachmentIds.delete(tmpId);
            abortByAttachmentId.delete(tmpId);
            if (upload.xhr.status === 413) {
                notificationService.add(_t('File too large'), { type: 'danger' });
                return def.reject();
            }
            if (upload.xhr.status !== 200) {
                notificationService.add(_t('Server error'), { type: 'danger' });
                return def.reject();
            }
            const response = JSON.parse(upload.xhr.response);
            if (response.error) {
                notificationService.add(response.error, { type: 'danger' });
                return def.reject();
            }
            const attachmentData = { ...response, uploading: false, extension: upload.title.split('.').pop() };
            const attachment = new Attachment();
            assignDefined(attachment, attachmentData, ['id', 'checksum', 'filename', 'mimetype', 'name', 'type', 'url', 'uploading', 'extension', 'accessToken', 'tmpUrl', 'message', 'isAcrux', 'res_model', 'res_id']);
            if (def) {
                def.resolve(attachment);
                deferredByAttachmentId.delete(tmpId);
            }
            onFileUploaded?.(attachment);
        }
    });

    useBus(bus, 'FILE_UPLOAD_ERROR', ({ detail: { upload } }) => {
        const tmpId = upload.data.get('temporary_id');
        if (uploadingAttachmentIds.has(tmpId)) {
            ui.unblock();
            abortByAttachmentId.delete(tmpId);
            deferredByAttachmentId.delete(tmpId);
            uploadingAttachmentIds.delete(upload.data.get('temporary_id'));
        }
    });

    return state;
}
