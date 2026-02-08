/** @odoo-module **/

export class ChatBaseModel {
    constructor(comp) {
        this.env = comp.env;
    }

    async updateFromJson() {
        await this.buildExtraObj();
    }

    async buildExtraObj() {}

    convertRecordField(record, extraFields) {
        let out;
        if (record) {
            out = { id: record[0], name: record[1] };
            if (extraFields) {
                for (let i = 2, j = 0; i < record.length && j < extraFields.length; ++i, ++j) {
                    out[extraFields[j]] = record[i];
                }
            }
        } else {
            out = { id: false, name: '' };
            if (extraFields) {
                for (const extraField of extraFields) {
                    out[extraField] = '';
                }
            }
        }
        return out;
    }

    convertFieldRecord(record, extraFields) {
        let out = [false, ''];
        if (record) {
            out = [record.id, record.name];
            if (extraFields) {
                for (const extraField of extraFields) {
                    out.push(record[extraField]);
                }
            }
        } else if (extraFields) {
            extraFields.forEach(() => out.push(''));
        }
        return out;
    }
}
