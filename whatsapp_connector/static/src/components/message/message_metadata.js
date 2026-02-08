/** @odoo-module **/

import { Component, onWillUpdateProps, onWillStart } from "@odoo/owl";
import { AudioPlayer } from "../audioPlayer/audioPlayer";

export class MessageMetadata extends Component {
    setup() {
        super.setup();
        this.data = {};
        onWillStart(this.willStart.bind(this));
        onWillUpdateProps(this.willUpdateProps.bind(this));
    }

    async willStart() {
        this.computeProps(this.props);
    }

    async willUpdateProps(nextProps) {
        this.computeProps(nextProps);
    }

    computeProps(props) {
        try {
            const data = JSON.parse(props.metadataJson);
            data.title = data.title || '';
            data.body = data.body || '';
            this.data = data;
        } catch (e) {
            console.error("Error parsing metadata JSON", e);
            this.data = {};
        }
    }

    openExternalLink() {
        if (this.data.url) {
            window.open(this.data.url, '_blank');
        }
    }

    get audioObj() {
        return { src: this.data?.media?.url };
    }

    get urlPreview() {
        return this.data?.media?.url;
    }

    get extraClass() {
        return '';
    }
}

MessageMetadata.template = 'chatroom.MessageMetadata';
MessageMetadata.props = {
    type: String,
    metadataJson: String,
};
MessageMetadata.components = { AudioPlayer };
