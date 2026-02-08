/** @odoo-module **/

import { Component } from "@odoo/owl";
import { formatMonetary } from "@web/views/fields/formatters";
import { ProductModel } from "@whatsapp_connector/models/product_model";

export class Product extends Component {
    setup() {
        super.setup();
    }

    formatPrice(price) {
        return formatMonetary(price, { currencyId: this.env.getCurrency() });
    }

    productOption(event) {
        this.env.chatBus.trigger('productOption', { product: this.props.product, event });
    }
}

Product.template = 'chatroom.Product';
Product.props = {
    product: ProductModel,
};
