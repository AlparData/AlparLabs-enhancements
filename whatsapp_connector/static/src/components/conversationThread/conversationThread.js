/** @odoo-module **/

import { Component, useRef, onWillUpdateProps, onPatched, onMounted } from "@odoo/owl";
import { useBus } from "@web/core/utils/hooks";
import { LoadingIndicator } from "@whatsapp_connector/components/chatroom/loading_indicator";
import { Message } from "@whatsapp_connector/components/message/message";
import { ConversationModel } from "@whatsapp_connector/models/conversation_model";
import { MessageModel } from "@whatsapp_connector/models/message_model";

export class ConversationThread extends Component {
    setup() {
        super.setup();
        this.threadRef = useRef('threadRef');
        useBus(this.env.chatBus, 'productDragInit', this.productDragInit.bind(this));
        useBus(this.env.chatBus, 'productDragging', this.productDragging.bind(this));
        useBus(this.env.chatBus, 'productDragEnd', this.productDragEnd.bind(this));
        useBus(this.env.chatBus, 'productDrop', this.productDrop.bind(this));
        useBus(this.env.chatBus, 'scrollToMessage', this.setMessageToScroll.bind(this));
        useBus(this.env.chatBus, 'inmediateScrollToMessage', this.scrollToMessage.bind(this));
        
        this.firstScroll = true;
        this.loadMoreMessage = false;
        this.scrollToPrevMessage = null;
        this.messageToScroll = null;
        
        let checkScrollTimder = null;
        const checkScrollDelay = () => {
            clearTimeout(checkScrollTimder);
            checkScrollTimder = setTimeout(() => this.checkScroll(), 200);
        };
        
        onWillUpdateProps(this.willUpdateProps.bind(this));
        onMounted(checkScrollDelay);
        onPatched(checkScrollDelay);
    }

    async willUpdateProps() {
        this.loadMoreMessage = false;
        this.firstScroll = true;
        this.scrollToPrevMessage = null;
    }

    checkScroll() {
        if (this.props.selectedConversation) {
            if (this.messageToScroll) {
                this.scrollToMessage({ message: this.messageToScroll });
                this.messageToScroll = null;
            } else if (this.scrollToPrevMessage) {
                this.scrollToPrevMessage();
                this.scrollToPrevMessage = null;
            } else {
                if (this.needScroll() || this.firstScroll) {
                    this.scrollConversation();
                    this.firstScroll = false;
                }
            }
            this.loadMoreMessage = true;
        }
    }

    isInside(x, y) {
        const rect = this.threadRef.el.getBoundingClientRect();
        return rect.top <= y && y <= rect.bottom && rect.left <= x && x <= rect.right;
    }

    needScroll() {
        const scollPosition = this.calculateScrollPosition();
        return scollPosition >= 0.7;
    }

    calculateScrollPosition() {
        let scrollPosition = 0;
        if (this.threadRef.el) {
            const scrollTop = this.threadRef.el.scrollTop;
            const scrollHeight = this.threadRef.el.scrollHeight;
            const clientHeight = this.threadRef.el.clientHeight;
            scrollPosition = (scrollTop + clientHeight) / scrollHeight;
        }
        return scrollPosition;
    }

    scrollConversation() {
        if (this.threadRef.el) {
            const list = this.threadRef.el.querySelectorAll('.acrux_Message');
            if (list.length) {
                const lastMessage = list[list.length - 1];
                if (lastMessage) {
                    setTimeout(() => lastMessage.scrollIntoView({ block: 'nearest', inline: 'start' }), 30);
                }
            }
        }
    }

    scrollToMessage({ detail: { message, effect, className } }) {
        if (this.threadRef.el) {
            const element = document.querySelector(`.acrux_Message[data-id="${message.id}"]`);
            if (element) {
                element.scrollIntoView({ block: 'nearest', inline: 'start' });
                if (effect === 'blink' && className) {
                    setTimeout(() => element.classList.add('active_quote'), 400);
                    setTimeout(() => element.classList.remove('active_quote'), 800);
                    setTimeout(() => element.classList.add('active_quote'), 1200);
                    setTimeout(() => element.classList.remove('active_quote'), 1600);
                }
            }
        }
    }

    async syncMoreMessage() {
        if (this.props.selectedConversation && this.loadMoreMessage && this.threadRef.el && this.threadRef.el.scrollTop === 0) {
            this.loadMoreMessage = false;
            const message = this.threadRef.el.querySelector('.acrux_Message');
            const size = this.props.selectedConversation.messages.length;
            try {
                this.env.chatBus.trigger('block_ui', { forceLock: true });
                await this.props.selectedConversation.syncMoreMessage();
            } finally {
                this.env.chatBus.trigger('unblock_ui');
            }
            if (message && this.props.selectedConversation.messages.length > size) {
                this.scrollToPrevMessage = () => message.scrollIntoView();
            }
        }
    }

    productDragInit() {
        this.threadRef.el.classList.add('drop-active');
    }

    productDragging({ detail: { x, y } }) {
        if (this.isInside(x, y)) {
            this.threadRef.el.classList.add('drop-hover');
        } else {
            this.threadRef.el.classList.remove('drop-hover');
        }
    }

    productDragInit() {
        this.threadRef.el.classList.add('drop-active');
    }

    productDragEnd() {
        this.threadRef.el.classList.remove('drop-active');
        this.threadRef.el.classList.remove('drop-hover');
    }

    async productDrop({ detail: { x, y, product } }) {
        if (this.isInside(x, y) && this.props.selectedConversation?.isCurrent()) {
            await this.props.selectedConversation.sendProduct(product.id);
        }
    }

    setMessageToScroll({ detail: { message } }) {
        this.messageToScroll = message;
    }
}

ConversationThread.template = 'chatroom.ConversationThread';
ConversationThread.props = {
    selectedConversation: { optional: true },
};
ConversationThread.components = { Message };
