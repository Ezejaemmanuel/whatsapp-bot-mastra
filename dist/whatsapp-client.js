"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppCloudApiClient = void 0;
var Api_1 = require("./api/Api");
/**
 * Webhook endpoint classification
 */
var WebhookEndpoint = /** @class */ (function () {
    function WebhookEndpoint(api, version) {
        this.api = api;
        this.version = version;
    }
    /**
     * Subscribe to webhooks for a WhatsApp Business Account
     */
    WebhookEndpoint.prototype.subscribeToWaba = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var payload;
            return __generator(this, function (_a) {
                payload = {};
                if (params.overrideCallbackUri && params.verifyToken) {
                    payload.override_callback_uri = params.overrideCallbackUri;
                    payload.verify_token = params.verifyToken;
                }
                return [2 /*return*/, this.api.wabaId.subscribedAppsCreate(this.version, params.wabaId, payload)];
            });
        });
    };
    /**
     * Get all webhook subscriptions for a WABA
     */
    WebhookEndpoint.prototype.getSubscriptions = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.wabaId.subscribedAppsList(this.version, params.wabaId)];
            });
        });
    };
    /**
     * Unsubscribe from webhooks for a WABA
     */
    WebhookEndpoint.prototype.unsubscribeFromWaba = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.wabaId.subscribedAppsDelete(this.version, params.wabaId)];
            });
        });
    };
    /**
     * Verify webhook signature (for webhook endpoint security)
     */
    WebhookEndpoint.prototype.verifyWebhookSignature = function (params) {
        // Implementation for webhook signature verification
        // This would typically use HMAC-SHA256 to verify the signature
        var crypto = require('crypto');
        var expectedSignature = crypto
            .createHmac('sha256', params.appSecret)
            .update(params.payload)
            .digest('hex');
        var signatureHash = params.signature.replace('sha256=', '');
        return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(signatureHash, 'hex'));
    };
    /**
     * Parse incoming webhook payload
     */
    WebhookEndpoint.prototype.parseWebhookPayload = function (payload) {
        var messages = [];
        var statuses = [];
        var errors = [];
        var phoneNumberId;
        var displayPhoneNumber;
        // Process each entry in the webhook payload
        for (var _i = 0, _a = payload.entry; _i < _a.length; _i++) {
            var entry = _a[_i];
            for (var _b = 0, _c = entry.changes; _b < _c.length; _b++) {
                var change = _c[_b];
                if (change.field === 'messages') {
                    var value = change.value;
                    // Extract phone number information
                    phoneNumberId = value.metadata.phone_number_id;
                    displayPhoneNumber = value.metadata.display_phone_number;
                    // Extract messages
                    if (value.messages) {
                        messages.push.apply(messages, value.messages);
                    }
                    // Extract statuses
                    if (value.statuses) {
                        statuses.push.apply(statuses, value.statuses);
                    }
                    // Extract errors
                    if (value.errors) {
                        errors.push.apply(errors, value.errors);
                    }
                }
            }
        }
        return {
            messages: messages,
            statuses: statuses,
            errors: errors,
            phoneNumberId: phoneNumberId,
            displayPhoneNumber: displayPhoneNumber,
        };
    };
    /**
     * Check if webhook payload is valid
     */
    WebhookEndpoint.prototype.isValidWebhookPayload = function (payload) {
        return (payload &&
            typeof payload === 'object' &&
            payload.object === 'whatsapp_business_account' &&
            Array.isArray(payload.entry));
    };
    /**
     * Extract text message from webhook
     */
    WebhookEndpoint.prototype.extractTextMessage = function (message) {
        if (message.type === 'text' && message.text) {
            return message.text.body;
        }
        return null;
    };
    /**
     * Extract media information from webhook message
     */
    WebhookEndpoint.prototype.extractMediaInfo = function (message) {
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
    };
    /**
     * Extract interactive response from webhook message
     */
    WebhookEndpoint.prototype.extractInteractiveResponse = function (message) {
        if (message.type === 'interactive' && message.interactive) {
            if (message.interactive.type === 'button_reply' && message.interactive.button_reply) {
                return {
                    type: 'button',
                    id: message.interactive.button_reply.id,
                    title: message.interactive.button_reply.title,
                };
            }
            else if (message.interactive.type === 'list_reply' && message.interactive.list_reply) {
                return {
                    type: 'list',
                    id: message.interactive.list_reply.id,
                    title: message.interactive.list_reply.title,
                    description: message.interactive.list_reply.description,
                };
            }
        }
        return null;
    };
    /**
     * Extract location information from webhook message
     */
    WebhookEndpoint.prototype.extractLocation = function (message) {
        if (message.type === 'location' && message.location) {
            return message.location;
        }
        return null;
    };
    /**
     * Extract contact information from webhook message
     */
    WebhookEndpoint.prototype.extractContacts = function (message) {
        if (message.type === 'contacts' && message.contacts) {
            return message.contacts;
        }
        return null;
    };
    /**
     * Check if message is a reply to another message
     */
    WebhookEndpoint.prototype.isReplyMessage = function (message) {
        return !!(message.context && message.context.id);
    };
    /**
     * Get the ID of the message being replied to
     */
    WebhookEndpoint.prototype.getReplyToMessageId = function (message) {
        if (this.isReplyMessage(message) && message.context) {
            return message.context.id || null;
        }
        return null;
    };
    /**
     * Check if message was forwarded
     */
    WebhookEndpoint.prototype.isForwardedMessage = function (message) {
        return !!(message.context && message.context.forwarded);
    };
    /**
     * Check if message was frequently forwarded
     */
    WebhookEndpoint.prototype.isFrequentlyForwardedMessage = function (message) {
        return !!(message.context && message.context.frequently_forwarded);
    };
    /**
     * Get message status information
     */
    WebhookEndpoint.prototype.getMessageStatusInfo = function (status) {
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
    };
    /**
     * Create a webhook verification response for Meta's webhook verification
     */
    WebhookEndpoint.prototype.createVerificationResponse = function (params) {
        // Verify the mode and token
        if (params.mode === 'subscribe' && params.token === params.verifyToken) {
            return params.challenge;
        }
        return null;
    };
    /**
     * Helper method to create a standardized webhook handler
     */
    WebhookEndpoint.prototype.createWebhookHandler = function (params) {
        var _this = this;
        return function (req, res) {
            return __awaiter(_this, void 0, void 0, function () {
                var mode, token, challenge, verificationResponse, body, signature, isValid, parsed, _i, _a, message, _b, _c, status_1, _d, _e, error, error_1;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            _f.trys.push([0, 14, , 15]);
                            // Handle webhook verification
                            if (req.method === 'GET') {
                                mode = req.query['hub.mode'];
                                token = req.query['hub.verify_token'];
                                challenge = req.query['hub.challenge'];
                                verificationResponse = this.createVerificationResponse({
                                    mode: mode,
                                    token: token,
                                    challenge: challenge,
                                    verifyToken: params.verifyToken,
                                });
                                if (verificationResponse) {
                                    res.status(200).send(verificationResponse);
                                    return [2 /*return*/];
                                }
                                else {
                                    res.status(403).send('Forbidden');
                                    return [2 /*return*/];
                                }
                            }
                            if (!(req.method === 'POST')) return [3 /*break*/, 13];
                            body = req.body;
                            // Verify signature if app secret is provided
                            if (params.appSecret) {
                                signature = req.headers['x-hub-signature-256'];
                                isValid = this.verifyWebhookSignature({
                                    payload: JSON.stringify(body),
                                    signature: signature,
                                    appSecret: params.appSecret,
                                });
                                if (!isValid) {
                                    res.status(403).send('Invalid signature');
                                    return [2 /*return*/];
                                }
                            }
                            // Validate and parse payload
                            if (!this.isValidWebhookPayload(body)) {
                                res.status(400).send('Invalid payload');
                                return [2 /*return*/];
                            }
                            parsed = this.parseWebhookPayload(body);
                            if (!(params.onMessage && parsed.messages.length > 0)) return [3 /*break*/, 4];
                            _i = 0, _a = parsed.messages;
                            _f.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                            message = _a[_i];
                            return [4 /*yield*/, params.onMessage(message, parsed.phoneNumberId)];
                        case 2:
                            _f.sent();
                            _f.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4:
                            if (!(params.onStatus && parsed.statuses.length > 0)) return [3 /*break*/, 8];
                            _b = 0, _c = parsed.statuses;
                            _f.label = 5;
                        case 5:
                            if (!(_b < _c.length)) return [3 /*break*/, 8];
                            status_1 = _c[_b];
                            return [4 /*yield*/, params.onStatus(status_1, parsed.phoneNumberId)];
                        case 6:
                            _f.sent();
                            _f.label = 7;
                        case 7:
                            _b++;
                            return [3 /*break*/, 5];
                        case 8:
                            if (!(params.onError && parsed.errors.length > 0)) return [3 /*break*/, 12];
                            _d = 0, _e = parsed.errors;
                            _f.label = 9;
                        case 9:
                            if (!(_d < _e.length)) return [3 /*break*/, 12];
                            error = _e[_d];
                            return [4 /*yield*/, params.onError(error, parsed.phoneNumberId)];
                        case 10:
                            _f.sent();
                            _f.label = 11;
                        case 11:
                            _d++;
                            return [3 /*break*/, 9];
                        case 12:
                            res.status(200).send('OK');
                            return [2 /*return*/];
                        case 13:
                            res.status(405).send('Method not allowed');
                            return [3 /*break*/, 15];
                        case 14:
                            error_1 = _f.sent();
                            console.error('Webhook handler error:', error_1);
                            res.status(500).send('Internal server error');
                            return [3 /*break*/, 15];
                        case 15: return [2 /*return*/];
                    }
                });
            });
        };
    };
    return WebhookEndpoint;
}());
/**
 * Messages endpoint classification
 */
var MessagesEndpoint = /** @class */ (function () {
    function MessagesEndpoint(api, version) {
        this.api = api;
        this.version = version;
    }
    /**
     * Send a text message
     */
    MessagesEndpoint.prototype.sendText = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'text',
                    text: {
                        body: params.text,
                        preview_url: params.previewUrl || false,
                    },
                })];
            });
        });
    };
    /**
     * Send a reply to a text message
     */
    MessagesEndpoint.prototype.sendReply = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send an image message by ID
     */
    MessagesEndpoint.prototype.sendImageById = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'image',
                    image: {
                        id: params.mediaId,
                        caption: params.caption,
                    },
                })];
            });
        });
    };
    /**
     * Send an image message by URL
     */
    MessagesEndpoint.prototype.sendImageByUrl = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'image',
                    image: {
                        link: params.imageUrl,
                        caption: params.caption,
                    },
                })];
            });
        });
    };
    /**
     * Send an audio message by ID
     */
    MessagesEndpoint.prototype.sendAudioById = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'audio',
                    audio: {
                        id: params.mediaId,
                    },
                })];
            });
        });
    };
    /**
     * Send an audio message by URL
     */
    MessagesEndpoint.prototype.sendAudioByUrl = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'audio',
                    audio: {
                        link: params.audioUrl,
                    },
                })];
            });
        });
    };
    /**
     * Send a document message by ID
     */
    MessagesEndpoint.prototype.sendDocumentById = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'document',
                    document: {
                        id: params.mediaId,
                        filename: params.filename,
                        caption: params.caption,
                    },
                })];
            });
        });
    };
    /**
     * Send a document message by URL
     */
    MessagesEndpoint.prototype.sendDocumentByUrl = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'document',
                    document: {
                        link: params.documentUrl,
                        filename: params.filename,
                        caption: params.caption,
                    },
                })];
            });
        });
    };
    /**
     * Send a sticker message by ID
     */
    MessagesEndpoint.prototype.sendStickerById = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'sticker',
                    sticker: {
                        id: params.mediaId,
                    },
                })];
            });
        });
    };
    /**
     * Send a sticker message by URL
     */
    MessagesEndpoint.prototype.sendStickerByUrl = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'sticker',
                    sticker: {
                        link: params.stickerUrl,
                    },
                })];
            });
        });
    };
    /**
     * Send a template message
     */
    MessagesEndpoint.prototype.sendTemplate = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send an interactive button message
     */
    MessagesEndpoint.prototype.sendInteractiveButtons = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var interactive;
            return __generator(this, function (_a) {
                interactive = {
                    type: 'button',
                    body: {
                        text: params.bodyText,
                    },
                    action: {
                        buttons: params.buttons.map(function (button) {
                            return ({
                                type: 'reply',
                                reply: {
                                    id: button.id,
                                    title: button.title,
                                },
                            });
                        }),
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
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'interactive',
                    interactive: interactive,
                })];
            });
        });
    };
    /**
     * Send an interactive list message
     */
    MessagesEndpoint.prototype.sendInteractiveList = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var interactive;
            return __generator(this, function (_a) {
                interactive = {
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
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'interactive',
                    interactive: interactive,
                })];
            });
        });
    };
    /**
     * Send a location message
     */
    MessagesEndpoint.prototype.sendLocation = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'location',
                    location: {
                        latitude: params.latitude,
                        longitude: params.longitude,
                        name: params.name,
                        address: params.address,
                    },
                })];
            });
        });
    };
    /**
     * Send a contact message
     */
    MessagesEndpoint.prototype.sendContact = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'contacts',
                    contacts: params.contacts,
                })];
            });
        });
    };
    /**
     * Mark a message as read
     */
    MessagesEndpoint.prototype.markAsRead = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesUpdate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    status: 'read',
                    message_id: params.messageId,
                })];
            });
        });
    };
    /**
     * Send a reaction to a message
     */
    MessagesEndpoint.prototype.sendReaction = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'reaction',
                    reaction: {
                        message_id: params.messageId,
                        emoji: params.emoji,
                    },
                })];
            });
        });
    };
    /**
     * Remove a reaction from a message
     */
    MessagesEndpoint.prototype.removeReaction = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'reaction',
                    reaction: {
                        message_id: params.messageId,
                        emoji: '', // Empty emoji removes the reaction
                    },
                })];
            });
        });
    };
    /**
     * Send a reply to an image message by ID
     */
    MessagesEndpoint.prototype.sendReplyToImageById = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a reply to an image message by URL
     */
    MessagesEndpoint.prototype.sendReplyToImageByUrl = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a reply to an audio message by ID
     */
    MessagesEndpoint.prototype.sendReplyToAudioById = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'audio',
                    audio: {
                        id: params.mediaId,
                    },
                    context: {
                        message_id: params.replyToMessageId,
                    },
                })];
            });
        });
    };
    /**
     * Send a reply to an audio message by URL
     */
    MessagesEndpoint.prototype.sendReplyToAudioByUrl = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'audio',
                    audio: {
                        link: params.audioUrl,
                    },
                    context: {
                        message_id: params.replyToMessageId,
                    },
                })];
            });
        });
    };
    /**
     * Send a reply to a document message by ID
     */
    MessagesEndpoint.prototype.sendReplyToDocumentById = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a reply to a document message by URL
     */
    MessagesEndpoint.prototype.sendReplyToDocumentByUrl = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a reply to a sticker message by ID
     */
    MessagesEndpoint.prototype.sendReplyToStickerById = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'sticker',
                    sticker: {
                        id: params.mediaId,
                    },
                    context: {
                        message_id: params.replyToMessageId,
                    },
                })];
            });
        });
    };
    /**
     * Send a reply to a sticker message by URL
     */
    MessagesEndpoint.prototype.sendReplyToStickerByUrl = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'sticker',
                    sticker: {
                        link: params.stickerUrl,
                    },
                    context: {
                        message_id: params.replyToMessageId,
                    },
                })];
            });
        });
    };
    /**
     * Send a video message by ID
     */
    MessagesEndpoint.prototype.sendVideoById = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'video',
                    video: {
                        id: params.mediaId,
                        caption: params.caption,
                    },
                })];
            });
        });
    };
    /**
     * Send a video message by URL
     */
    MessagesEndpoint.prototype.sendVideoByUrl = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'video',
                    video: {
                        link: params.videoUrl,
                        caption: params.caption,
                    },
                })];
            });
        });
    };
    /**
     * Send a reply to a video message by ID
     */
    MessagesEndpoint.prototype.sendReplyToVideoById = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a reply to a video message by URL
     */
    MessagesEndpoint.prototype.sendReplyToVideoByUrl = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a reply to a contact message
     */
    MessagesEndpoint.prototype.sendReplyToContact = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'contacts',
                    contacts: params.contacts,
                    context: {
                        message_id: params.replyToMessageId,
                    },
                })];
            });
        });
    };
    /**
     * Send a reply to a location message
     */
    MessagesEndpoint.prototype.sendReplyToLocation = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a text template message
     */
    MessagesEndpoint.prototype.sendMessageTemplateText = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var components;
            return __generator(this, function (_a) {
                components = [];
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
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a media template message
     */
    MessagesEndpoint.prototype.sendMessageTemplateMedia = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var components, headerParameter;
            return __generator(this, function (_a) {
                components = [];
                headerParameter = {
                    type: params.headerMediaType,
                };
                if (params.headerMediaId) {
                    headerParameter[params.headerMediaType] = { id: params.headerMediaId };
                }
                else if (params.headerMediaUrl) {
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
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'template',
                    template: {
                        name: params.templateName,
                        language: {
                            code: params.languageCode,
                        },
                        components: components,
                    },
                })];
            });
        });
    };
    /**
     * Send an interactive template message
     */
    MessagesEndpoint.prototype.sendMessageTemplateInteractive = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var components;
            return __generator(this, function (_a) {
                components = [];
                if (params.bodyParameters && params.bodyParameters.length > 0) {
                    components.push({
                        type: 'body',
                        parameters: params.bodyParameters,
                    });
                }
                if (params.buttonParameters && params.buttonParameters.length > 0) {
                    params.buttonParameters.forEach(function (buttonParam, index) {
                        components.push({
                            type: 'button',
                            sub_type: 'quick_reply',
                            index: index,
                            parameters: [buttonParam],
                        });
                    });
                }
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a reply to a list message
     */
    MessagesEndpoint.prototype.sendReplyToList = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var interactive;
            return __generator(this, function (_a) {
                interactive = {
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
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'interactive',
                    interactive: interactive,
                    context: {
                        message_id: params.replyToMessageId,
                    },
                })];
            });
        });
    };
    /**
     * Send a reply button message
     */
    MessagesEndpoint.prototype.sendReplyButton = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var interactive, messagePayload;
            return __generator(this, function (_a) {
                interactive = {
                    type: 'button',
                    body: {
                        text: params.bodyText,
                    },
                    action: {
                        buttons: params.buttons.map(function (button) {
                            return ({
                                type: 'reply',
                                reply: {
                                    id: button.id,
                                    title: button.title,
                                },
                            });
                        }),
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
                messagePayload = {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'interactive',
                    interactive: interactive,
                };
                if (params.replyToMessageId) {
                    messagePayload.context = {
                        message_id: params.replyToMessageId,
                    };
                }
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, messagePayload)];
            });
        });
    };
    /**
     * Send a single product message
     */
    MessagesEndpoint.prototype.sendSingleProductMessage = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a multi-product message
     */
    MessagesEndpoint.prototype.sendMultiProductMessage = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a catalog message
     */
    MessagesEndpoint.prototype.sendCatalogMessage = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
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
                })];
            });
        });
    };
    /**
     * Send a catalog template message
     */
    MessagesEndpoint.prototype.sendCatalogTemplateMessage = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var components;
            return __generator(this, function (_a) {
                components = [];
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
                return [2 /*return*/, this.api.phoneNumberId.messagesCreate(this.version, params.phoneNumberId, {
                    messaging_product: 'whatsapp',
                    to: params.to,
                    type: 'template',
                    template: {
                        name: params.templateName,
                        language: {
                            code: params.languageCode,
                        },
                        components: components,
                    },
                })];
            });
        });
    };
    return MessagesEndpoint;
}());
/**
 * Main WhatsApp Cloud API Client Class
 *
 * A comprehensive client with organized endpoint classifications.
 */
var WhatsAppCloudApiClient = /** @class */ (function () {
    function WhatsAppCloudApiClient(config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        // Get access token from config or environment
        var accessToken = config.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('WhatsApp access token is required. Provide it in config or set WHATSAPP_ACCESS_TOKEN environment variable.');
        }
        this.config = {
            accessToken: accessToken,
            version: config.version || 'v23.0',
            baseUrl: config.baseUrl || 'https://graph.facebook.com',
        };
        // Initialize the HTTP client with authentication
        var httpClient = new Api_1.HttpClient({
            baseUrl: this.config.baseUrl,
            securityWorker: function (securityData) {
                return {
                    headers: {
                        Authorization: "Bearer ".concat((securityData === null || securityData === void 0 ? void 0 : securityData.token) || _this.config.accessToken),
                    },
                };
            },
        });
        // Set security data (access token)
        httpClient.setSecurityData({ token: this.config.accessToken });
        // Initialize the API client
        this.api = new Api_1.Api(httpClient);
        // Initialize endpoint classifications
        this.messages = new MessagesEndpoint(this.api, this.config.version);
        this.webhook = new WebhookEndpoint(this.api, this.config.version);
    }
    /**
     * Get the current configuration
     */
    WhatsAppCloudApiClient.prototype.getConfig = function () {
        return {
            version: this.config.version,
            baseUrl: this.config.baseUrl,
            hasAccessToken: !!this.config.accessToken,
        };
    };
    /**
     * Update the access token
     */
    WhatsAppCloudApiClient.prototype.updateAccessToken = function (newToken) {
        this.config.accessToken = newToken;
        this.api.http.setSecurityData({ token: newToken });
    };
    /**
     * Get the raw API client for advanced usage
     */
    WhatsAppCloudApiClient.prototype.getRawApi = function () {
        return this.api;
    };
    return WhatsAppCloudApiClient;
}());
exports.WhatsAppCloudApiClient = WhatsAppCloudApiClient;
exports.default = WhatsAppCloudApiClient;
