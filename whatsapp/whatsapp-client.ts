import { Api, HttpClient } from './api/Api';

/**
 * WhatsApp Cloud API Client
 * 
 * A comprehensive TypeScript client for the WhatsApp Cloud API with organized endpoint classifications.
 */

// Configuration interface for the WhatsApp API client
interface WhatsAppConfig {
    accessToken?: string;
    baseUrl?: string;

    phoneNumberId?: string;
    wabaId?: string;
}

// Security data type for the API client
interface SecurityData {
    token: string;
}

/**
 * Webhook payload interfaces for type safety
 */
interface WebhookEntry {
    id: string;
    changes: Array<{
        value: {
            messaging_product: string;
            metadata: {
                display_phone_number: string;
                phone_number_id: string;
            };
            contacts?: Array<{
                profile: {
                    name: string;
                };
                wa_id: string;
            }>;
            messages?: Array<WebhookMessage>;
            statuses?: Array<WebhookMessageStatus>;
            errors?: Array<WebhookError>;
        };
        field: string;
    }>;
}

interface WebhookMessage {
    id: string;
    from: string;
    timestamp: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'button' | 'system' | 'unknown';
    context?: {
        forwarded?: boolean;
        frequently_forwarded?: boolean;
        from?: string;
        id?: string;
    };
    text?: {
        body: string;
    };
    image?: WebhookMediaObject;
    audio?: WebhookMediaObject;
    video?: WebhookMediaObject;
    document?: WebhookMediaObject;
    sticker?: WebhookMediaObject;
    location?: {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    };
    contacts?: Array<{
        name: {
            formatted_name: string;
            first_name?: string;
            last_name?: string;
        };
        phones?: Array<{
            phone: string;
            type?: string;
        }>;
        emails?: Array<{
            email: string;
            type?: string;
        }>;
    }>;
    interactive?: {
        type: 'button_reply' | 'list_reply';
        button_reply?: {
            id: string;
            title: string;
        };
        list_reply?: {
            id: string;
            title: string;
            description?: string;
        };
    };
    button?: {
        payload: string;
        text: string;
    };
    system?: {
        body: string;
        identity?: string;
        new_wa_id?: string;
        type: 'user_changed_number' | 'user_identity_changed';
        user?: string;
    };
    errors?: Array<WebhookError>;
}

interface WebhookMediaObject {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
    filename?: string;
}

interface WebhookMessageStatus {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
    conversation?: {
        id: string;
        expiration_timestamp?: string;
        origin: {
            type: 'business_initiated' | 'user_initiated';
        };
    };
    pricing?: {
        billable: boolean;
        pricing_model: string;
        category: string;
    };
    errors?: Array<WebhookError>;
}

interface WebhookError {
    code: number;
    title: string;
    message?: string;
    error_data?: {
        details: string;
    };
}

interface WebhookPayload {
    object: 'whatsapp_business_account';
    entry: Array<WebhookEntry>;
}

/**
 * Webhook endpoint classification
 */
class WebhookEndpoint {
    private version: string;
    constructor(
        private api: Api<SecurityData>,
        private wabaId: string
    ) {
        const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';
        this.version = apiVersion;
    }

    /**
     * Subscribe to webhooks for a WhatsApp Business Account
     */
    async subscribeToWaba(params: {
        wabaId: string;
        overrideCallbackUri?: string;
        verifyToken?: string;
    }) {
        const payload: any = {};

        if (params.overrideCallbackUri && params.verifyToken) {
            payload.override_callback_uri = params.overrideCallbackUri;
            payload.verify_token = params.verifyToken;
        }

        return this.api.wabaId.subscribedAppsCreate(
            this.version,
            params.wabaId,
            payload
        );
    }

    /**
     * Get all webhook subscriptions for a WABA
     */
    async getSubscriptions(params: {
        wabaId: string;
    }) {
        return this.api.wabaId.subscribedAppsList(
            this.version,
            params.wabaId
        );
    }

    /**
     * Unsubscribe from webhooks for a WABA
     */
    async unsubscribeFromWaba(params: {
        wabaId: string;
    }) {
        return this.api.wabaId.subscribedAppsDelete(
            this.version,
            params.wabaId
        );
    }

    /**
     * Verify webhook signature (for webhook endpoint security)
     */
    verifyWebhookSignature(params: {
        payload: string;
        signature: string;
        appSecret: string;
    }): boolean {
        // Implementation for webhook signature verification
        // This would typically use HMAC-SHA256 to verify the signature
        const crypto = require('crypto');

        const expectedSignature = crypto
            .createHmac('sha256', params.appSecret)
            .update(params.payload)
            .digest('hex');

        const signatureHash = params.signature.replace('sha256=', '');

        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(signatureHash, 'hex')
        );
    }

    /**
     * Parse incoming webhook payload
     */
    parseWebhookPayload(payload: WebhookPayload): {
        messages: Array<WebhookMessage>;
        statuses: Array<WebhookMessageStatus>;
        errors: Array<WebhookError>;
        phoneNumberId?: string;
        displayPhoneNumber?: string;
    } {
        const messages: Array<WebhookMessage> = [];
        const statuses: Array<WebhookMessageStatus> = [];
        const errors: Array<WebhookError> = [];
        let phoneNumberId: string | undefined;
        let displayPhoneNumber: string | undefined;

        // Process each entry in the webhook payload
        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                if (change.field === 'messages') {
                    const value = change.value;

                    // Extract phone number information
                    phoneNumberId = value.metadata.phone_number_id;
                    displayPhoneNumber = value.metadata.display_phone_number;

                    // Extract messages
                    if (value.messages) {
                        messages.push(...value.messages);
                    }

                    // Extract statuses
                    if (value.statuses) {
                        statuses.push(...value.statuses);
                    }

                    // Extract errors
                    if (value.errors) {
                        errors.push(...value.errors);
                    }
                }
            }
        }

        return {
            messages,
            statuses,
            errors,
            phoneNumberId,
            displayPhoneNumber,
        };
    }

    /**
     * Check if webhook payload is valid
     */
    isValidWebhookPayload(payload: any): payload is WebhookPayload {
        return (
            payload &&
            typeof payload === 'object' &&
            payload.object === 'whatsapp_business_account' &&
            Array.isArray(payload.entry)
        );
    }

    /**
     * Extract text message from webhook
     */
    extractTextMessage(message: WebhookMessage): string | null {
        if (message.type === 'text' && message.text) {
            return message.text.body;
        }
        return null;
    }

    /**
     * Extract media information from webhook message
     */
    extractMediaInfo(message: WebhookMessage): WebhookMediaObject | null {
        switch (message.type) {
            case 'image':
                return message.image || null;
            case 'audio':
                return message.audio || null;
            case 'video':
                return message.video || null;
            case 'document':
                return message.document || null;
            case 'sticker':
                return message.sticker || null;
            default:
                return null;
        }
    }

    /**
     * Extract interactive response from webhook message
     */
    extractInteractiveResponse(message: WebhookMessage): {
        type: 'button' | 'list';
        id: string;
        title: string;
        description?: string;
    } | null {
        if (message.type === 'interactive' && message.interactive) {
            if (message.interactive.type === 'button_reply' && message.interactive.button_reply) {
                return {
                    type: 'button',
                    id: message.interactive.button_reply.id,
                    title: message.interactive.button_reply.title,
                };
            } else if (message.interactive.type === 'list_reply' && message.interactive.list_reply) {
                return {
                    type: 'list',
                    id: message.interactive.list_reply.id,
                    title: message.interactive.list_reply.title,
                    description: message.interactive.list_reply.description,
                };
            }
        }
        return null;
    }

    /**
     * Extract location information from webhook message
     */
    extractLocation(message: WebhookMessage): {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    } | null {
        if (message.type === 'location' && message.location) {
            return message.location;
        }
        return null;
    }

    /**
     * Extract contact information from webhook message
     */
    extractContacts(message: WebhookMessage): Array<{
        name: {
            formatted_name: string;
            first_name?: string;
            last_name?: string;
        };
        phones?: Array<{
            phone: string;
            type?: string;
        }>;
        emails?: Array<{
            email: string;
            type?: string;
        }>;
    }> | null {
        if (message.type === 'contacts' && message.contacts) {
            return message.contacts;
        }
        return null;
    }

    /**
     * Check if message is a reply to another message
     */
    isReplyMessage(message: WebhookMessage): boolean {
        return !!(message.context && message.context.id);
    }

    /**
     * Get the ID of the message being replied to
     */
    getReplyToMessageId(message: WebhookMessage): string | null {
        if (this.isReplyMessage(message) && message.context) {
            return message.context.id || null;
        }
        return null;
    }

    /**
     * Check if message was forwarded
     */
    isForwardedMessage(message: WebhookMessage): boolean {
        return !!(message.context && message.context.forwarded);
    }

    /**
     * Check if message was frequently forwarded
     */
    isFrequentlyForwardedMessage(message: WebhookMessage): boolean {
        return !!(message.context && message.context.frequently_forwarded);
    }

    /**
     * Get message status information
     */
    getMessageStatusInfo(status: WebhookMessageStatus): {
        messageId: string;
        status: string;
        timestamp: string;
        recipientId: string;
        conversationInfo?: {
            id: string;
            origin: string;
            expirationTimestamp?: string;
        };
        pricingInfo?: {
            billable: boolean;
            pricingModel: string;
            category: string;
        };
    } {
        return {
            messageId: status.id,
            status: status.status,
            timestamp: status.timestamp,
            recipientId: status.recipient_id,
            conversationInfo: status.conversation ? {
                id: status.conversation.id,
                origin: status.conversation.origin.type,
                expirationTimestamp: status.conversation.expiration_timestamp,
            } : undefined,
            pricingInfo: status.pricing ? {
                billable: status.pricing.billable,
                pricingModel: status.pricing.pricing_model,
                category: status.pricing.category,
            } : undefined,
        };
    }

    /**
     * Create a webhook verification response for Meta's webhook verification
     */
    createVerificationResponse(params: {
        mode: string;
        token: string;
        challenge: string;
        verifyToken: string;
    }): string | null {
        // Verify the mode and token
        if (params.mode === 'subscribe' && params.token === params.verifyToken) {
            return params.challenge;
        }
        return null;
    }

    /**
     * Helper method to create a standardized webhook handler
     */
    createWebhookHandler(params: {
        verifyToken: string;
        appSecret?: string;
        onMessage?: (message: WebhookMessage, phoneNumberId: string) => Promise<void>;
        onStatus?: (status: WebhookMessageStatus, phoneNumberId: string) => Promise<void>;
        onError?: (error: WebhookError, phoneNumberId: string) => Promise<void>;
    }) {
        return async (req: any, res: any) => {
            try {
                // Handle webhook verification
                if (req.method === 'GET') {
                    const mode = req.query['hub.mode'];
                    const token = req.query['hub.verify_token'];
                    const challenge = req.query['hub.challenge'];

                    const verificationResponse = this.createVerificationResponse({
                        mode,
                        token,
                        challenge,
                        verifyToken: params.verifyToken,
                    });

                    if (verificationResponse) {
                        res.status(200).send(verificationResponse);
                        return;
                    } else {
                        res.status(403).send('Forbidden');
                        return;
                    }
                }

                // Handle webhook notifications
                if (req.method === 'POST') {
                    const body = req.body;

                    // Verify signature if app secret is provided
                    if (params.appSecret) {
                        const signature = req.headers['x-hub-signature-256'];
                        const isValid = this.verifyWebhookSignature({
                            payload: JSON.stringify(body),
                            signature,
                            appSecret: params.appSecret,
                        });

                        if (!isValid) {
                            res.status(403).send('Invalid signature');
                            return;
                        }
                    }

                    // Validate and parse payload
                    if (!this.isValidWebhookPayload(body)) {
                        res.status(400).send('Invalid payload');
                        return;
                    }

                    const parsed = this.parseWebhookPayload(body);

                    // Process messages
                    if (params.onMessage && parsed.messages.length > 0) {
                        for (const message of parsed.messages) {
                            await params.onMessage(message, parsed.phoneNumberId!);
                        }
                    }

                    // Process statuses
                    if (params.onStatus && parsed.statuses.length > 0) {
                        for (const status of parsed.statuses) {
                            await params.onStatus(status, parsed.phoneNumberId!);
                        }
                    }

                    // Process errors
                    if (params.onError && parsed.errors.length > 0) {
                        for (const error of parsed.errors) {
                            await params.onError(error, parsed.phoneNumberId!);
                        }
                    }

                    res.status(200).send('OK');
                    return;
                }

                res.status(405).send('Method not allowed');
            } catch (error) {
                console.error('Webhook handler error:', error);
                res.status(500).send('Internal server error');
            }
        };
    }
}

/**
 * Messages endpoint classification
 */
class MessagesEndpoint {
    private version: string;
    constructor(
        private api: Api<SecurityData>,
        private phoneNumberId: string,
    ) {
        const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';
        this.version = apiVersion;
    }

    /**
     * Send a text message
     */
    async sendText(params: {
        to: string;
        text: string;
        previewUrl?: boolean;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'text',
                text: {
                    body: params.text,
                    preview_url: params.previewUrl || false,
                },
            }
        );
    }

    /**
     * Send an image message by URL or ID
     */
    async sendImage(params: {
        to: string;
        mediaId?: string;
        imageUrl?: string;
        caption?: string;
    }) {
        if (!params.mediaId && !params.imageUrl) {
            throw new Error("Either mediaId or imageUrl must be provided.");
        }

        if (params.mediaId) {
            return this.sendImageById({
                to: params.to,
                mediaId: params.mediaId,
                caption: params.caption,
            });
        }

        return this.sendImageByUrl({
            to: params.to,
            imageUrl: params.imageUrl!,
            caption: params.caption,
        });
    }

    /**
     * Send a reply to a text message
     */
    async sendReply(params: {
        to: string;
        text: string;
        replyToMessageId: string;
        previewUrl?: boolean;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'text',
                text: {
                    body: params.text,
                    preview_url: params.previewUrl || false,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send an image message by ID
     */
    async sendImageById(params: {

        to: string;
        mediaId: string;
        caption?: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'image',
                image: {
                    id: params.mediaId,
                    caption: params.caption,
                },
            }
        );
    }

    /**
     * Send an image message by URL
     */
    async sendImageByUrl(params: {

        to: string;
        imageUrl: string;
        caption?: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'image',
                image: {
                    link: params.imageUrl,
                    caption: params.caption,
                },
            }
        );
    }

    /**
     * Send an audio message by ID
     */
    async sendAudioById(params: {

        to: string;
        mediaId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'audio',
                audio: {
                    id: params.mediaId,
                },
            }
        );
    }

    /**
     * Send an audio message by URL
     */
    async sendAudioByUrl(params: {
        to: string;
        audioUrl: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'audio',
                audio: {
                    link: params.audioUrl,
                },
            }
        );
    }

    /**
     * Send a document message by ID
     */
    async sendDocumentById(params: {

        to: string;
        mediaId: string;
        filename?: string;
        caption?: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'document',
                document: {
                    id: params.mediaId,
                    filename: params.filename,
                    caption: params.caption,
                },
            }
        );
    }

    /**
     * Send a document message by URL
     */
    async sendDocumentByUrl(params: {

        to: string;
        documentUrl: string;
        filename?: string;
        caption?: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'document',
                document: {
                    link: params.documentUrl,
                    filename: params.filename,
                    caption: params.caption,
                },
            }
        );
    }

    /**
     * Send a sticker message by ID
     */
    async sendStickerById(params: {

        to: string;
        mediaId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'sticker',
                sticker: {
                    id: params.mediaId,
                },
            }
        );
    }

    /**
     * Send a sticker message by URL
     */
    async sendStickerByUrl(params: {

        to: string;
        stickerUrl: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'sticker',
                sticker: {
                    link: params.stickerUrl,
                },
            }
        );
    }

    /**
     * Send a template message
     */
    async sendTemplate(params: {

        to: string;
        templateName: string;
        languageCode: string;
        components?: Array<{
            type: string;
            parameters?: Array<{
                type: string;
                text?: string;
                image?: { link: string };
                document?: { link: string; filename?: string };
                video?: { link: string };
            }>;
            sub_type?: string;
            index?: number;
        }>;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'template',
                template: {
                    name: params.templateName,
                    language: {
                        code: params.languageCode,
                    },
                    components: params.components || [],
                },
            }
        );
    }

    /**
     * Send an interactive button message
     */
    async sendInteractiveButtons(params: {

        to: string;
        bodyText: string;
        buttons: Array<{
            id: string;
            title: string;
        }>;
        headerText?: string;
        footerText?: string;
    }) {
        const interactive: {
            type: string;
            body: { text: string };
            action: { buttons: Array<{ type: string; reply: { id: string; title: string } }> };
            header?: { type: string; text: string };
            footer?: { text: string };
        } = {
            type: 'button',
            body: {
                text: params.bodyText,
            },
            action: {
                buttons: params.buttons.map(button => ({
                    type: 'reply',
                    reply: {
                        id: button.id,
                        title: button.title,
                    },
                })),
            },
        };

        if (params.headerText) {
            interactive.header = {
                type: 'text',
                text: params.headerText,
            };
        }

        if (params.footerText) {
            interactive.footer = {
                text: params.footerText,
            };
        }

        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'interactive',
                interactive,
            }
        );
    }

    /**
     * Send an interactive list message
     */
    async sendInteractiveList(params: {

        to: string;
        bodyText: string;
        buttonText: string;
        sections: Array<{
            title: string;
            rows: Array<{
                id: string;
                title: string;
                description?: string;
            }>;
        }>;
        headerText?: string;
        footerText?: string;
    }) {
        const interactive: {
            type: string;
            body: { text: string };
            action: {
                button: string;
                sections: Array<{
                    title: string;
                    rows: Array<{
                        id: string;
                        title: string;
                        description?: string;
                    }>;
                }>;
            };
            header?: { type: string; text: string };
            footer?: { text: string };
        } = {
            type: 'list',
            body: {
                text: params.bodyText,
            },
            action: {
                button: params.buttonText,
                sections: params.sections,
            },
        };

        if (params.headerText) {
            interactive.header = {
                type: 'text',
                text: params.headerText,
            };
        }

        if (params.footerText) {
            interactive.footer = {
                text: params.footerText,
            };
        }

        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'interactive',
                interactive,
            }
        );
    }

    /**
     * Send a location message
     */
    async sendLocation(params: {

        to: string;
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'location',
                location: {
                    latitude: params.latitude,
                    longitude: params.longitude,
                    name: params.name,
                    address: params.address,
                },
            }
        );
    }

    /**
     * Send a contact message
     */
    async sendContact(params: {

        to: string;
        contacts: Array<{
            name: {
                formatted_name: string;
                first_name?: string;
                last_name?: string;
            };
            phones?: Array<{
                phone: string;
                type?: string;
            }>;
            emails?: Array<{
                email: string;
                type?: string;
            }>;
        }>;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'contacts',
                contacts: params.contacts,
            }
        );
    }

    /**
     * Mark a message as read
     */
    async markAsRead(params: {

        messageId: string;
    }) {
        return this.api.phoneNumberId.messagesUpdate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: params.messageId,
            }
        );
    }

    /**
     * Send a reaction to a message
     */
    async sendReaction(params: {

        to: string;
        messageId: string;
        emoji: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'reaction',
                reaction: {
                    message_id: params.messageId,
                    emoji: params.emoji,
                },
            }
        );
    }

    /**
     * Remove a reaction from a message
     */
    async removeReaction(params: {

        to: string;
        messageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'reaction',
                reaction: {
                    message_id: params.messageId,
                    emoji: '', // Empty emoji removes the reaction
                },
            }
        );
    }

    /**
     * Send a reply to an image message by ID
     */
    async sendReplyToImageById(params: {

        to: string;
        mediaId: string;
        caption?: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'image',
                image: {
                    id: params.mediaId,
                    caption: params.caption,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply to an image message by URL
     */
    async sendReplyToImageByUrl(params: {

        to: string;
        imageUrl: string;
        caption?: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'image',
                image: {
                    link: params.imageUrl,
                    caption: params.caption,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply to an audio message by ID
     */
    async sendReplyToAudioById(params: {

        to: string;
        mediaId: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'audio',
                audio: {
                    id: params.mediaId,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply to an audio message by URL
     */
    async sendReplyToAudioByUrl(params: {

        to: string;
        audioUrl: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'audio',
                audio: {
                    link: params.audioUrl,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply to a document message by ID
     */
    async sendReplyToDocumentById(params: {
        to: string;
        mediaId: string;
        filename?: string;
        caption?: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'document',
                document: {
                    id: params.mediaId,
                    filename: params.filename,
                    caption: params.caption,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply to a document message by URL
     */
    async sendReplyToDocumentByUrl(params: {
        to: string;
        documentUrl: string;
        filename?: string;
        caption?: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'document',
                document: {
                    link: params.documentUrl,
                    filename: params.filename,
                    caption: params.caption,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply to a sticker message by ID
     */
    async sendReplyToStickerById(params: {
        to: string;
        mediaId: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'sticker',
                sticker: {
                    id: params.mediaId,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply to a sticker message by URL
     */
    async sendReplyToStickerByUrl(params: {
        to: string;
        stickerUrl: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'sticker',
                sticker: {
                    link: params.stickerUrl,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a video message by ID
     */
    async sendVideoById(params: {
        to: string;
        mediaId: string;
        caption?: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'video',
                video: {
                    id: params.mediaId,
                    caption: params.caption,
                },
            }
        );
    }

    /**
     * Send a video message by URL
     */
    async sendVideoByUrl(params: {
        to: string;
        videoUrl: string;
        caption?: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'video',
                video: {
                    link: params.videoUrl,
                    caption: params.caption,
                },
            }
        );
    }

    /**
     * Send a reply to a video message by ID
     */
    async sendReplyToVideoById(params: {
        to: string;
        mediaId: string;
        caption?: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'video',
                video: {
                    id: params.mediaId,
                    caption: params.caption,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply to a video message by URL
     */
    async sendReplyToVideoByUrl(params: {
        to: string;
        videoUrl: string;
        caption?: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'video',
                video: {
                    link: params.videoUrl,
                    caption: params.caption,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply to a contact message
     */
    async sendReplyToContact(params: {
        to: string;
        contacts: Array<{
            name: {
                formatted_name: string;
                first_name?: string;
                last_name?: string;
            };
            phones?: Array<{
                phone: string;
                type?: string;
            }>;
            emails?: Array<{
                email: string;
                type?: string;
            }>;
        }>;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'contacts',
                contacts: params.contacts,
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply to a location message
     */
    async sendReplyToLocation(params: {
        to: string;
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
        replyToMessageId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'location',
                location: {
                    latitude: params.latitude,
                    longitude: params.longitude,
                    name: params.name,
                    address: params.address,
                },
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a text template message
     */
    async sendMessageTemplateText(params: {
        to: string;
        templateName: string;
        languageCode: string;
        bodyParameters?: Array<{
            type: 'text';
            text: string;
        }>;
        headerParameters?: Array<{
            type: 'text';
            text: string;
        }>;
    }) {
        const components: Array<{
            type: string;
            parameters?: Array<{
                type: string;
                text: string;
            }>;
        }> = [];

        if (params.headerParameters && params.headerParameters.length > 0) {
            components.push({
                type: 'header',
                parameters: params.headerParameters,
            });
        }

        if (params.bodyParameters && params.bodyParameters.length > 0) {
            components.push({
                type: 'body',
                parameters: params.bodyParameters,
            });
        }

        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'template',
                template: {
                    name: params.templateName,
                    language: {
                        code: params.languageCode,
                    },
                    components: components.length > 0 ? components : undefined,
                },
            }
        );
    }

    /**
     * Send a media template message
     */
    async sendMessageTemplateMedia(params: {
        to: string;
        templateName: string;
        languageCode: string;
        headerMediaType: 'image' | 'video' | 'document';
        headerMediaId?: string;
        headerMediaUrl?: string;
        bodyParameters?: Array<{
            type: 'text';
            text: string;
        }>;
    }) {
        const components: Array<{
            type: string;
            parameters?: Array<{
                type: string;
                text?: string;
                image?: { id?: string; link?: string };
                video?: { id?: string; link?: string };
                document?: { id?: string; link?: string };
            }>;
        }> = [];

        // Add header component with media
        const headerParameter: {
            type: string;
            image?: { id?: string; link?: string };
            video?: { id?: string; link?: string };
            document?: { id?: string; link?: string };
        } = {
            type: params.headerMediaType,
        };

        if (params.headerMediaId) {
            headerParameter[params.headerMediaType] = { id: params.headerMediaId };
        } else if (params.headerMediaUrl) {
            headerParameter[params.headerMediaType] = { link: params.headerMediaUrl };
        }

        components.push({
            type: 'header',
            parameters: [headerParameter],
        });

        if (params.bodyParameters && params.bodyParameters.length > 0) {
            components.push({
                type: 'body',
                parameters: params.bodyParameters,
            });
        }

        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'template',
                template: {
                    name: params.templateName,
                    language: {
                        code: params.languageCode,
                    },
                    components,
                },
            }
        );
    }

    /**
     * Send an interactive template message
     */
    async sendMessageTemplateInteractive(params: {
        to: string;
        templateName: string;
        languageCode: string;
        bodyParameters?: Array<{
            type: 'text';
            text: string;
        }>;
        buttonParameters?: Array<{
            type: 'payload';
            payload: string;
        }>;
    }) {
        const components: Array<{
            type: string;
            sub_type?: string;
            index?: number;
            parameters?: Array<{
                type: string;
                text?: string;
                payload?: string;
            }>;
        }> = [];

        if (params.bodyParameters && params.bodyParameters.length > 0) {
            components.push({
                type: 'body',
                parameters: params.bodyParameters,
            });
        }

        if (params.buttonParameters && params.buttonParameters.length > 0) {
            params.buttonParameters.forEach((buttonParam, index) => {
                components.push({
                    type: 'button',
                    sub_type: 'quick_reply',
                    index,
                    parameters: [buttonParam],
                });
            });
        }

        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'template',
                template: {
                    name: params.templateName,
                    language: {
                        code: params.languageCode,
                    },
                    components: components.length > 0 ? components : undefined,
                },
            }
        );
    }

    /**
     * Send a reply to a list message
     */
    async sendReplyToList(params: {
        to: string;
        bodyText: string;
        buttonText: string;
        sections: Array<{
            title: string;
            rows: Array<{
                id: string;
                title: string;
                description?: string;
            }>;
        }>;
        headerText?: string;
        footerText?: string;
        replyToMessageId: string;
    }) {
        const interactive: {
            type: string;
            body: { text: string };
            action: {
                button: string;
                sections: Array<{
                    title: string;
                    rows: Array<{
                        id: string;
                        title: string;
                        description?: string;
                    }>;
                }>;
            };
            header?: { type: string; text: string };
            footer?: { text: string };
        } = {
            type: 'list',
            body: {
                text: params.bodyText,
            },
            action: {
                button: params.buttonText,
                sections: params.sections,
            },
        };

        if (params.headerText) {
            interactive.header = {
                type: 'text',
                text: params.headerText,
            };
        }

        if (params.footerText) {
            interactive.footer = {
                text: params.footerText,
            };
        }

        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'interactive',
                interactive,
                context: {
                    message_id: params.replyToMessageId,
                },
            }
        );
    }

    /**
     * Send a reply button message
     */
    async sendReplyButton(params: {
        to: string;
        bodyText: string;
        buttons: Array<{
            id: string;
            title: string;
        }>;
        headerText?: string;
        footerText?: string;
        replyToMessageId?: string;
    }) {
        const interactive: {
            type: string;
            body: { text: string };
            action: { buttons: Array<{ type: string; reply: { id: string; title: string } }> };
            header?: { type: string; text: string };
            footer?: { text: string };
        } = {
            type: 'button',
            body: {
                text: params.bodyText,
            },
            action: {
                buttons: params.buttons.map(button => ({
                    type: 'reply',
                    reply: {
                        id: button.id,
                        title: button.title,
                    },
                })),
            },
        };

        if (params.headerText) {
            interactive.header = {
                type: 'text',
                text: params.headerText,
            };
        }

        if (params.footerText) {
            interactive.footer = {
                text: params.footerText,
            };
        }

        const messagePayload: {
            messaging_product: string;
            to: string;
            type: string;
            interactive: typeof interactive;
            context?: { message_id: string };
        } = {
            messaging_product: 'whatsapp',
            to: params.to,
            type: 'interactive',
            interactive,
        };

        if (params.replyToMessageId) {
            messagePayload.context = {
                message_id: params.replyToMessageId,
            };
        }

        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            messagePayload
        );
    }

    /**
     * Send a single product message
     */
    async sendSingleProductMessage(params: {

        to: string;
        bodyText?: string;
        footerText?: string;
        catalogId: string;
        productRetailerId: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'interactive',
                interactive: {
                    type: 'product',
                    body: params.bodyText ? {
                        text: params.bodyText,
                    } : undefined,
                    footer: params.footerText ? {
                        text: params.footerText,
                    } : undefined,
                    action: {
                        catalog_id: params.catalogId,
                        product_retailer_id: params.productRetailerId,
                    },
                },
            }
        );
    }

    /**
     * Send a multi-product message
     */
    async sendMultiProductMessage(params: {

        to: string;
        headerText: string;
        bodyText: string;
        footerText?: string;
        catalogId: string;
        sections: Array<{
            title?: string;
            product_items: Array<{
                product_retailer_id: string;
            }>;
        }>;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'interactive',
                interactive: {
                    type: 'product_list',
                    header: {
                        type: 'text',
                        text: params.headerText,
                    },
                    body: {
                        text: params.bodyText,
                    },
                    footer: params.footerText ? {
                        text: params.footerText,
                    } : undefined,
                    action: {
                        catalog_id: params.catalogId,
                        sections: params.sections,
                    },
                },
            }
        );
    }

    /**
     * Send a catalog message
     */
    async sendCatalogMessage(params: {

        to: string;
        bodyText: string;
        footerText?: string;
        catalogId: string;
        thumbnailProductRetailerId?: string;
    }) {
        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'interactive',
                interactive: {
                    type: 'catalog_message',
                    body: {
                        text: params.bodyText,
                    },
                    footer: params.footerText ? {
                        text: params.footerText,
                    } : undefined,
                    action: {
                        name: 'catalog_message',
                        parameters: {
                            thumbnail_product_retailer_id: params.thumbnailProductRetailerId,
                        },
                    },
                },
            }
        );
    }

    /**
     * Send a catalog template message
     */
    async sendCatalogTemplateMessage(params: {

        to: string;
        templateName: string;
        languageCode: string;
        bodyParameters?: Array<{
            type: 'text';
            text: string;
        }>;
        catalogId: string;
        thumbnailProductRetailerId?: string;
    }) {
        const components: Array<{
            type: string;
            parameters?: Array<{
                type: string;
                text?: string;
                action?: {
                    catalog_id: string;
                    thumbnail_product_retailer_id?: string;
                };
            }>;
        }> = [];

        if (params.bodyParameters && params.bodyParameters.length > 0) {
            components.push({
                type: 'body',
                parameters: params.bodyParameters,
            });
        }

        // Add catalog action component
        components.push({
            type: 'button',
            parameters: [
                {
                    type: 'action',
                    action: {
                        catalog_id: params.catalogId,
                        thumbnail_product_retailer_id: params.thumbnailProductRetailerId,
                    },
                },
            ],
        });

        return this.api.phoneNumberId.messagesCreate(
            this.version,
            this.phoneNumberId,
            {
                messaging_product: 'whatsapp',
                to: params.to,
                type: 'template',
                template: {
                    name: params.templateName,
                    language: {
                        code: params.languageCode,
                    },
                    components,
                },
            }
        );
    }
}

/**
 * Main WhatsApp Cloud API Client Class
 * 
 * A comprehensive client with organized endpoint classifications.
 */
export class WhatsAppCloudApiClient {
    private api: Api<SecurityData>;
    private config: Required<WhatsAppConfig>;
    private version: string;

    // Organized endpoint classifications
    public messages: MessagesEndpoint;
    public webhook: WebhookEndpoint;

    constructor(config: WhatsAppConfig = {}) {
        // Get access token from config or environment
        const accessToken = config.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

        if (!accessToken) {
            throw new Error('Missing required environment variable: WHATSAPP_ACCESS_TOKEN (WhatsApp Business API access token from Meta Business)');
        }

        const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

        if (!phoneNumberId) {
            throw new Error('Missing required environment variable: WHATSAPP_PHONE_NUMBER_ID (WhatsApp Business phone number ID from Meta Business)');
        }

        if (!wabaId) {
            throw new Error('Missing required environment variable: WHATSAPP_BUSINESS_ACCOUNT_ID (WhatsApp Business Account ID from Meta Business)');
        }

        this.version = apiVersion;

        this.config = {
            accessToken,
            baseUrl: config.baseUrl || 'https://graph.facebook.com',
            phoneNumberId: config.phoneNumberId || phoneNumberId,
            wabaId: config.wabaId || wabaId,
        };

        // Initialize the HTTP client with authentication
        const httpClient = new HttpClient<SecurityData>({
            baseUrl: this.config.baseUrl,
            securityWorker: (securityData) => {
                return {
                    headers: {
                        Authorization: `Bearer ${securityData?.token || this.config.accessToken}`,
                    },
                };
            },
        });

        // Set security data (access token)
        httpClient.setSecurityData({ token: this.config.accessToken });

        // Initialize the API client
        this.api = new Api<SecurityData>(httpClient);

        // Initialize endpoint classifications
        this.messages = new MessagesEndpoint(this.api, this.config.phoneNumberId);
        this.webhook = new WebhookEndpoint(this.api, this.config.wabaId);
    }

    /**
     * Get the current configuration
     */
    getConfig() {
        return {
            version: this.version,
            baseUrl: this.config.baseUrl,
            hasAccessToken: !!this.config.accessToken,
        };
    }

    /**
     * Update the access token
     */
    updateAccessToken(newToken: string) {
        this.config.accessToken = newToken;
        this.api.http.setSecurityData({ token: newToken });
    }

    /**
     * Get the raw API client for advanced usage
     */
    getRawApi() {
        return this.api;
    }
}

export default WhatsAppCloudApiClient;

// Export webhook interfaces for external use
export type {
    WebhookPayload,
    WebhookEntry,
    WebhookMessage,
    WebhookMediaObject,
    WebhookMessageStatus,
    WebhookError,
}; 