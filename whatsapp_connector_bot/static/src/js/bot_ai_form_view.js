/** @odoo-module **/

import { registry } from "@web/core/registry";
import { formView } from "@web/views/form/form_view";
import { BotAiFormController } from "./bot_ai_form_controller";

const BotAiFormView = {
    ...formView,
    Controller: BotAiFormController,
};

registry.category('views').add('bot_ai_form', BotAiFormView);
