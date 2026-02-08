/** @odoo-module **/

import { useBus, useService } from "@web/core/utils/hooks";
import { Transition } from "@web/core/transition";
import { Component, useState } from "@odoo/owl";

export class LoadingIndicator extends Component {
    setup() {
        this.uiService = useService('ui');
        this.state = useState({ show: false });
        let blockUITimer = null, shouldUnblock = false;
        
        useBus(this.env.chatBus, 'block_ui', ({ detail }) => {
            const { forceLock = false } = detail || {};
            let timeout = 3 * 1000;
            if (forceLock) {
                if (blockUITimer) {
                    if (!shouldUnblock) {
                        clearTimeout(blockUITimer);
                        blockUITimer = null;
                    }
                }
                timeout = 0;
            }
            if (!blockUITimer) {
                this.state.show = true;
                shouldUnblock = forceLock;
                clearTimeout(blockUITimer);
                blockUITimer = setTimeout(() => {
                    this.state.show = false;
                    this.uiService.block();
                    shouldUnblock = true;
                }, timeout);
            }
        });
        
        useBus(this.env.chatBus, 'unblock_ui', () => {
            clearTimeout(blockUITimer);
            blockUITimer = null;
            this.state.show = false;
            if (shouldUnblock) {
                this.uiService.unblock();
                shouldUnblock = false;
            }
        });
    }
}

LoadingIndicator.template = 'chatroom.LoadingIndicator';
LoadingIndicator.components = { Transition };
LoadingIndicator.props = {};
export default LoadingIndicator;
