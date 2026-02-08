/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { WarningDialog } from "@web/core/errors/error_dialogs";
import { Component, useState, onWillStart } from "@odoo/owl";
import { useBus } from "@web/core/utils/hooks";
import { ChatroomHeader } from "@whatsapp_connector/components/chatroomHeader/chatroomHeader";
import { ChatSearch } from "@whatsapp_connector/components/chatSearch/chatSearch";
import { Product } from "@whatsapp_connector/components/toolbox/product";
import { ConversationModel } from "@whatsapp_connector/models/conversation_model";
import { ProductModel } from "@whatsapp_connector/models/product_model";

export class ProductContainer extends Component {
    setup() {
        super.setup();
        this.state = useState({ products: [] });
        this.placeHolder = _t('Search');
        useBus(this.env.chatBus, 'productSearch', this.searchProduct.bind(this));
        useBus(this.env.chatBus, 'productOption', this.productOption.bind(this));
        onWillStart(async () => this.searchProduct({ detail: {} }));
    }

    async searchProduct({ detail: { search } }) {
        let val = search || '';
        const { orm } = this.env.services;
        const result = await orm.call(this.env.chatModel, 'search_product', [val.trim()], { context: this.env.context });
        this.state.products = await Promise.all(result.map(async product => {
            const p = new ProductModel(this);
            await p.updateFromJson(product);
            return p;
        }));
    }

    async productOption({ detail: { product, event } }) {
        if (this.props.selectedConversation) {
            if (this.props.selectedConversation.isCurrent()) {
                await this.doProductOption({ product, event });
            } else {
                this.env.services.dialog.add(WarningDialog, { message: _t('Yoy are not writing in this conversation.') });
            }
        } else {
            this.env.services.dialog.add(WarningDialog, { message: _t('You must select a conversation.') });
        }
    }

    async doProductOption({ product }) {
        await this.props.selectedConversation.sendProduct(product.id);
        this.env.chatBus.trigger('mobileNavigate', 'middleSide');
    }
}

ProductContainer.template = 'chatroom.ProductContainer';
ProductContainer.props = {
    selectedConversation: { optional: true },
    className: { type: String, optional: true }
};
ProductContainer.defaultProps = {
    className: ''
};
ProductContainer.components = { ChatroomHeader, Product, ChatSearch };
