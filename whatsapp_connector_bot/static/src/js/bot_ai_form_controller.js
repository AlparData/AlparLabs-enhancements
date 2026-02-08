/** @odoo-module **/

import { FormController } from "@web/views/form/form_controller";
import { evaluateExpr } from "@web/core/py_js/py";
import { WarningDialog } from "@web/core/errors/error_dialogs";
import { _t } from "@web/core/l10n/translation";

export class BotAiFormController extends FormController {
    async beforeExecuteActionButton(clickParams) {
        const action = clickParams.name;
        if (action == 'copy_original_definition') {
            if (clickParams.context) {
                const context = evaluateExpr(clickParams.context);
                if (context?.ai_type) {
                    let changes = {};
                    const field_map = {
                        company: ['ai_company_prompt', 'ai_company_info'],
                        service: ['ai_service_prompt', 'ai_service_info'],
                        products: ['ai_products_prompt', 'ai_products_info'],
                        style: ['ai_style_prompt', 'ai_style_info'],
                        objective: ['ai_objective_prompt', 'ai_objective_info'],
                    };
                    if (field_map[context.ai_type]) {
                        changes[field_map[context.ai_type][0]] = this.model.root.data[field_map[context.ai_type][1]];
                    } else {
                        this.env.services.dialog.add(WarningDialog, {
                            message: _t('Wrong context ai_type key') + ' ' + context.ai_type,
                        });
                    }
                    if (Object.keys(changes).length > 0) {
                        this.model.root.update(changes);
                    }
                } else {
                    this.env.services.dialog.add(WarningDialog, {
                        message: _t('Context ai_type key is missing')
                    });
                }
            } else {
                this.env.services.dialog.add(WarningDialog, {
                    message: _t('Context is missing')
                });
            }
            return false;
        }
        return super.beforeExecuteActionButton(...arguments);
    }
}
