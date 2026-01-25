from odoo import models, api


class IrModuleModule(models.Model):
    _inherit = 'ir.module.module'

    @api.model
    def write(self, vals):
        result = super(IrModuleModule, self).write(vals)
        if 'state' in vals:
            self.env['acrux.chat.bot.model.info'].sudo().search([])._compute_available()
        return result
