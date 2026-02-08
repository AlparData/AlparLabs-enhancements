/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { humanNumber } from "@web/core/utils/numbers";
import { session } from "@web/session";

const DEFAULT_MAX_FILE_SIZE = 2 * 1024 * 1024;
let nextId = -1;

export function checkFileSize(fileSize, notificationService) {
    const maxUploadSize = session.chatroom_max_file_upload_size || DEFAULT_MAX_FILE_SIZE;
    if (fileSize > maxUploadSize) {
        notificationService.add(_t('The selected file (%sB) is over the maximum allowed file size (%sB).', 
            humanNumber(fileSize), humanNumber(maxUploadSize)), { type: 'danger' });
        return false;
    }
    return true;
}

export function dataUrlToBlob(data, type) {
    const binData = window.atob(data);
    const uiArr = new Uint8Array(binData.length);
    uiArr.forEach((_, index) => (uiArr[index] = binData.charCodeAt(index)));
    return new Blob([uiArr], { type });
}

export function getNextId() {
    const tmpId = nextId--;
    return `chatroom${tmpId}`;
}
