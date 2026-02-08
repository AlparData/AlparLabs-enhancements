/** @odoo-module **/

import { humanNumber } from "@web/core/utils/numbers";
import { _t } from "@web/core/l10n/translation";
import { FileUploader as FileUploaderBase } from "@web/views/fields/file_handler";
import { getDataURLFromFile } from "@web/core/utils/urls";
import { session } from "@web/session";

const DEFAULT_MAX_FILE_SIZE = 2 * 1024 * 1024;

export function checkFileSize(fileSize, notificationService) {
    const maxUploadSize = session.chatroom_max_file_upload_size || DEFAULT_MAX_FILE_SIZE;
    if (fileSize > maxUploadSize) {
        notificationService.add(_t('The selected file (%sB) is over the maximum allowed file size (%sB).', humanNumber(fileSize), humanNumber(maxUploadSize)), {
            type: 'danger',
        });
        return false;
    }
    return true;
}

export class FileUploader extends FileUploaderBase {
    async onFileChange(ev) {
        if (!ev.target.files.length) { return; }
        const { target } = ev;
        for (const file of ev.target.files) {
            if (!checkFileSize(file.size, this.notification)) { return null; }
            this.state.isUploading = true;
            const data = await getDataURLFromFile(file);
            if (!file.size) {
                console.warn(`Error while uploading file : ${file.name}`);
                this.notification.add(_t('There was a problem while uploading your file.'), { type: 'danger' });
            }
            try {
                await this.props.onUploaded({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: data.split(',')[1],
                    objectUrl: file.type === 'application/pdf' ? URL.createObjectURL(file) : null,
                });
            } catch (e) {
                console.error(e);
            } finally {
                this.state.isUploading = false;
            }
        }
        target.value = null;
        if (this.props.multiUpload && this.props.onUploadComplete) {
            this.props.onUploadComplete({});
        }
    }
}
