"use strict";
/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Api = exports.HttpClient = exports.ContentType = void 0;
var ContentType;
(function (ContentType) {
    ContentType["Json"] = "application/json";
    ContentType["JsonApi"] = "application/vnd.api+json";
    ContentType["FormData"] = "multipart/form-data";
    ContentType["UrlEncoded"] = "application/x-www-form-urlencoded";
    ContentType["Text"] = "text/plain";
})(ContentType || (exports.ContentType = ContentType = {}));
var HttpClient = /** @class */ (function () {
    function HttpClient(apiConfig) {
        var _a;
        if (apiConfig === void 0) { apiConfig = {}; }
        var _this = this;
        this.baseUrl = "https://graph.facebook.com";
        this.securityData = null;
        this.abortControllers = new Map();
        this.customFetch = function () {
            var fetchParams = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                fetchParams[_i] = arguments[_i];
            }
            return fetch.apply(void 0, fetchParams);
        };
        this.baseApiParams = {
            credentials: "same-origin",
            headers: {},
            redirect: "follow",
            referrerPolicy: "no-referrer",
        };
        this.setSecurityData = function (data) {
            _this.securityData = data;
        };
        this.contentFormatters = (_a = {},
            _a[ContentType.Json] = function (input) {
                return input !== null && (typeof input === "object" || typeof input === "string")
                    ? JSON.stringify(input)
                    : input;
            },
            _a[ContentType.JsonApi] = function (input) {
                return input !== null && (typeof input === "object" || typeof input === "string")
                    ? JSON.stringify(input)
                    : input;
            },
            _a[ContentType.Text] = function (input) {
                return input !== null && typeof input !== "string"
                    ? JSON.stringify(input)
                    : input;
            },
            _a[ContentType.FormData] = function (input) {
                return Object.keys(input || {}).reduce(function (formData, key) {
                    var property = input[key];
                    formData.append(key, property instanceof Blob
                        ? property
                        : typeof property === "object" && property !== null
                            ? JSON.stringify(property)
                            : "".concat(property));
                    return formData;
                }, new FormData());
            },
            _a[ContentType.UrlEncoded] = function (input) { return _this.toQueryString(input); },
            _a);
        this.createAbortSignal = function (cancelToken) {
            if (_this.abortControllers.has(cancelToken)) {
                var abortController_1 = _this.abortControllers.get(cancelToken);
                if (abortController_1) {
                    return abortController_1.signal;
                }
                return void 0;
            }
            var abortController = new AbortController();
            _this.abortControllers.set(cancelToken, abortController);
            return abortController.signal;
        };
        this.abortRequest = function (cancelToken) {
            var abortController = _this.abortControllers.get(cancelToken);
            if (abortController) {
                abortController.abort();
                _this.abortControllers.delete(cancelToken);
            }
        };
        this.request = function (_a) { return __awaiter(_this, void 0, void 0, function () {
            var secureParams, _b, requestParams, queryString, payloadFormatter, responseFormat;
            var _this = this;
            var body = _a.body, secure = _a.secure, path = _a.path, type = _a.type, query = _a.query, format = _a.format, baseUrl = _a.baseUrl, cancelToken = _a.cancelToken, params = __rest(_a, ["body", "secure", "path", "type", "query", "format", "baseUrl", "cancelToken"]);
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
                            this.securityWorker;
                        if (!_b) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.securityWorker(this.securityData)];
                    case 1:
                        _b = (_c.sent());
                        _c.label = 2;
                    case 2:
                        secureParams = (_b) ||
                            {};
                        requestParams = this.mergeRequestParams(params, secureParams);
                        queryString = query && this.toQueryString(query);
                        payloadFormatter = this.contentFormatters[type || ContentType.Json];
                        responseFormat = format || requestParams.format;
                        return [2 /*return*/, this.customFetch("".concat(baseUrl || this.baseUrl || "").concat(path).concat(queryString ? "?".concat(queryString) : ""), __assign(__assign({}, requestParams), { headers: __assign(__assign({}, (requestParams.headers || {})), (type && type !== ContentType.FormData
                                    ? { "Content-Type": type }
                                    : {})), signal: (cancelToken
                                    ? this.createAbortSignal(cancelToken)
                                    : requestParams.signal) || null, body: typeof body === "undefined" || body === null
                                    ? null
                                    : payloadFormatter(body) })).then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                                var r, data, _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            r = response.clone();
                                            r.data = null;
                                            r.error = null;
                                            if (!!responseFormat) return [3 /*break*/, 1];
                                            _a = r;
                                            return [3 /*break*/, 3];
                                        case 1: return [4 /*yield*/, response[responseFormat]()
                                                .then(function (data) {
                                                if (r.ok) {
                                                    r.data = data;
                                                }
                                                else {
                                                    r.error = data;
                                                }
                                                return r;
                                            })
                                                .catch(function (e) {
                                                r.error = e;
                                                return r;
                                            })];
                                        case 2:
                                            _a = _b.sent();
                                            _b.label = 3;
                                        case 3:
                                            data = _a;
                                            if (cancelToken) {
                                                this.abortControllers.delete(cancelToken);
                                            }
                                            if (!response.ok)
                                                throw data;
                                            return [2 /*return*/, data];
                                    }
                                });
                            }); })];
                }
            });
        }); };
        Object.assign(this, apiConfig);
    }
    HttpClient.prototype.encodeQueryParam = function (key, value) {
        var encodedKey = encodeURIComponent(key);
        return "".concat(encodedKey, "=").concat(encodeURIComponent(typeof value === "number" ? value : "".concat(value)));
    };
    HttpClient.prototype.addQueryParam = function (query, key) {
        return this.encodeQueryParam(key, query[key]);
    };
    HttpClient.prototype.addArrayQueryParam = function (query, key) {
        var _this = this;
        var value = query[key];
        return value.map(function (v) { return _this.encodeQueryParam(key, v); }).join("&");
    };
    HttpClient.prototype.toQueryString = function (rawQuery) {
        var _this = this;
        var query = rawQuery || {};
        var keys = Object.keys(query).filter(function (key) { return "undefined" !== typeof query[key]; });
        return keys
            .map(function (key) {
            return Array.isArray(query[key])
                ? _this.addArrayQueryParam(query, key)
                : _this.addQueryParam(query, key);
        })
            .join("&");
    };
    HttpClient.prototype.addQueryParams = function (rawQuery) {
        var queryString = this.toQueryString(rawQuery);
        return queryString ? "?".concat(queryString) : "";
    };
    HttpClient.prototype.mergeRequestParams = function (params1, params2) {
        return __assign(__assign(__assign(__assign({}, this.baseApiParams), params1), (params2 || {})), { headers: __assign(__assign(__assign({}, (this.baseApiParams.headers || {})), (params1.headers || {})), ((params2 && params2.headers) || {})) });
    };
    return HttpClient;
}());
exports.HttpClient = HttpClient;
/**
 * @title WhatsApp Cloud API
 * @version 1.0.0
 * @baseUrl https://graph.facebook.com
 *
 * [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api), hosted by Meta, is the official WhatsApp Business Platform API used for business messaging. This collection contains common queries, sample responses, and links to supporting documentation that can help you quickly get started with the API.
 *
 * ## **Cloud API Overview**
 *
 * Cloud API allows medium and large businesses to communicate with customers at scale. Using the API, businesses can build systems that connect thousands of customers with agents or bots, enabling both programmatic and manual communication. Additionally, businesses can integrate the API with numerous backend systems, such as CRM and marketing platforms.
 *
 * [https://developers.facebook.com/docs/whatsapp/cloud-api/overview](https://developers.facebook.com/docs/whatsapp/cloud-api/overview)
 *
 * ## Getting Started with Cloud API
 *
 * To use the API and this collection you must have a Meta business portfolio, a WhatsApp Business Account, and a business phone number. If you complete the steps in the Cloud API [Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started) guide, these assets will be created for you.
 *
 * ## Get Started as a Solution Partner
 *
 * [This guide](https://developers.facebook.com/docs/whatsapp/solution-providers/get-started-for-solution-partners) goes over the steps Solution Partners need to take in order to offer the Cloud API to their customers.
 *
 * ## Migrating from On-Premises API to Cloud API
 *
 * [This guide explains how to migrate](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/migrating-from-onprem-to-cloud) business phone numbers from On-Premises API to Cloud API.
 *
 * ## Environment
 *
 * This collection has a corresponding WhatsApp Cloud API Postman [environment](https://learning.postman.com/docs/sending-requests/managing-environments/) which you must select when using the collection. Set **current values** for the variables defined in this environment if you wish to use the collection to perform queries.
 *
 * You can find most of these values in the [WhatsApp Manager](https://business.facebook.com/wa/manage/home/) or the **WhatsApp** > **Getting Started** panel in the [app dashboard](https://developers.facebook.com/apps). However, if you have an access token and your business portfolio ID, you can use queries in the collection to get the remaining values.
 *
 * ## Access tokens
 *
 * The API supports both user and system user access tokens. You can get a user access token by loading your app in the [app dashboard](https://developers.facebook.com/apps) and navigating to the WhatsApp > Getting Started panel. Alternatively you can use the [Graph API Explorer](https://developers.facebook.com/tools/explorer/) to generate one.
 *
 * Since user access tokens expire after 24 hours, you'll likely want to generate a system user access token, which lasts up to 60 days (or permanently, if you wish). See [Access Tokens](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#access-tokens) to learn how to create a system user and system user access token.
 *
 * Once you have your token, save it as a **current value** in the environment.
 *
 * ## Business portfolio ID
 *
 * You can get your business portfolio ID by signing into the [Meta Business Suite](https://business.facebook.com). The ID appears in the URL as the `business_id` query string parameter value. Once you save this as a **current value** in the environment, go to the WhatsApp Business Account (WABA) folder and run the **Get all owned WABAs** query. This will return your WABA ID, which you can save to your environment and then use to determine your business phone number ID.
 *
 * ## Permissions
 *
 * The API only relies on two permissions:
 *
 * - whatsapp_business_management
 *
 * - whatsapp_business_messaging
 *
 *
 * Note that if you get a user access token from the app dashboard, your app will automatically be granted these permissions (by you, on your behalf), so you can use the token to test right away.
 *
 * Queries that target your business portfolio require the business_management permission, which you may also need based on your business use case. Most developers do not need this permission, however, as accessing your business portfolio is uncommon, and the Meta Business Suite provides nearly all of this functionality anyway.
 *
 * ## Access token debugger
 *
 * You can paste any token you generate into the [access token debugger](https://developers.facebook.com/tools/debug/accesstoken/) to see what type of token it is and what permission you have granted to your app.
 *
 * ## Pagination
 *
 * Endpoints that return lists/collections may [paginate results](https://developers.facebook.com/docs/graph-api/results) (you'll see previous and next properties in the response). Use the URLs from these properties to get the previous or next set of results. Note that if you click one of these links in Postman, it will open a new query in a new tab which you must save before running (otherwise it can't read your environment variables), so you may wish to cut and paste the URL and run the query in the same tab in which it was returned.
 */
var Api = /** @class */ (function () {
    function Api(http) {
        var _this = this;
        /**
         * @description The following notification is received when a business sends a message which opens a service [conversation](https://developers.facebook.com/docs/whatsapp/pricing#conversations):
         *
         * @tags Webhook Subscriptions > Webhook Payload Reference
         * @name ViewRoot
         * @summary Status: Transaction Status - Order Details Message
         * @request VIEW:/
         * @secure
         */
        this.viewRoot = function (params) {
            if (params === void 0) { params = {}; }
            return _this.http.request(__assign({ path: "/", method: "VIEW", secure: true }, params));
        };
        this.wabaId = {
            /**
             * @description Creates a new flow. To clone an existing flow you can add the parameter `"clone_flow_id": "original-flow-id"`
             *
             * @tags Flows > Create Flow
             * @name FlowsCreate
             * @summary Create Flow
             * @request POST:/{Version}/{WABA-ID}/flows
             * @secure
             * @response `200` `string` OK
             */
            flowsCreate: function (version, wabaId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId, "/flows"), method: "POST", body: data, secure: true, type: ContentType.FormData, format: "json" }, params));
            },
            /**
             * No description
             *
             * @tags Flows > Create Flow
             * @name FlowsList
             * @summary List Flows
             * @request GET:/{Version}/{WABA-ID}/flows
             * @secure
             * @response `200` `string` OK
             */
            flowsList: function (version, wabaId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId, "/flows"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * No description
             *
             * @tags Flows > Send Flow
             * @name MessageTemplatesCreate
             * @summary Create Flow Template Message by ID
             * @request POST:/{Version}/{WABA-ID}/message_templates
             * @secure
             * @response `200` `string` OK
             */
            messageTemplatesCreate: function (version, wabaId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId, "/message_templates"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description - Guide: [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates) - Guide: [How To Monitor Quality Signals](https://developers.facebook.com/docs/whatsapp/guides/how-to-monitor-quality-signals) - Endpoint reference: [WhatsApp Business Account > Message Templates](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/message_templates/)
             *
             * @tags Templates
             * @name MessageTemplatesDelete
             * @summary Delete template by ID
             * @request DELETE:/{Version}/{WABA-ID}/message_templates
             * @secure
             * @response `200` `string` OK
             */
            messageTemplatesDelete: function (_a, params) {
                var version = _a.version, wabaId = _a.wabaId, query = __rest(_a, ["version", "wabaId"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId, "/message_templates"), method: "DELETE", query: query, secure: true, format: "json" }, params));
            },
            /**
             * @description - Guide: [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates) - Guide: [How To Monitor Quality Signals](https://developers.facebook.com/docs/whatsapp/guides/how-to-monitor-quality-signals) - Endpoint reference: [WhatsApp Business Account > Message Templates](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/message_templates/)
             *
             * @tags Templates
             * @name MessageTemplatesList
             * @summary Get all templates (default fields)
             * @request GET:/{Version}/{WABA-ID}/message_templates
             * @secure
             * @response `200` `string` OK
             */
            messageTemplatesList: function (version, wabaId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId, "/message_templates"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * @description Creates a copy of existing flows from source WABA to destination WABA with the same names.
             *
             * @tags Flows > Create Flow
             * @name MigrateFlowsCreate
             * @summary Migrate Flows
             * @request POST:/{Version}/{WABA-ID}/migrate_flows
             * @secure
             * @response `200` `string` OK
             */
            migrateFlowsCreate: function (version, wabaId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId, "/migrate_flows"), method: "POST", body: data, secure: true, type: ContentType.FormData, format: "json" }, params));
            },
            /**
             * @description - Guide: [Filter Phone Numbers](https://developers.facebook.com/docs/whatsapp/business-management-api/manage-phone-numbers#filter-phone-numbers) - Endpoint reference: [WhatsApp Business Account > Phone Numbers](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/phone_numbers/)
             *
             * @tags Phone Numbers
             * @name PhoneNumbersList
             * @summary Get Phone Numbers with Filtering (beta)
             * @request GET:/{Version}/{WABA-ID}/phone_numbers
             * @secure
             */
            phoneNumbersList: function (_a, params) {
                var version = _a.version, wabaId = _a.wabaId, query = __rest(_a, ["version", "wabaId"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId, "/phone_numbers"), method: "GET", query: query, secure: true }, params));
            },
            /**
             * @description If you want to subscribe to Webhooks for multiple WhatsApp Business Accounts but want messages field Webhooks notifications to be sent to different callback URLs for each WABA, you can override the callback URL when subscribing to Webhooks for each WABA. To do this, first verify that the alternate Webhook endpoint can receive and process Webhooks notifications. Then, subscribe to Webhooks for the WABA as your normally would, but include the alternate endpoint's callback URL along with its verification token as a JSON payload: For more information, see [Overriding the Callback URL](https://developers.facebook.com/docs/whatsapp/embedded-signup/webhooks#overriding-the-callback-url).
             *
             * @tags Webhook Subscriptions
             * @name SubscribedAppsCreate
             * @summary Override Callback URL
             * @request POST:/{Version}/{WABA-ID}/subscribed_apps
             * @secure
             * @response `200` `string` OK
             */
            subscribedAppsCreate: function (version, wabaId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId, "/subscribed_apps"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description To unsubscribe your app from webhooks for a WhatsApp Business Account, send a **DELETE** request to the `/subscribed_apps/` endpoint on the WABA.
             *
             * @tags Webhook Subscriptions
             * @name SubscribedAppsDelete
             * @summary Unsubscribe from a WABA
             * @request DELETE:/{Version}/{WABA-ID}/subscribed_apps
             * @secure
             * @response `200` `string` OK
             */
            subscribedAppsDelete: function (version, wabaId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId, "/subscribed_apps"), method: "DELETE", secure: true, format: "json" }, params));
            },
            /**
             * @description To get a list of apps subscribed to Webhooks for a WABA, send a **GET** request to the **`subscribed_apps`** endpoint on the WABA:
             *
             * @tags Webhook Subscriptions
             * @name SubscribedAppsList
             * @summary Get All Subscriptions for a WABA
             * @request GET:/{Version}/{WABA-ID}/subscribed_apps
             * @secure
             * @response `200` `string` OK
             */
            subscribedAppsList: function (version, wabaId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId, "/subscribed_apps"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * @description - Guide: [Analytics](https://developers.facebook.com/docs/whatsapp/business-management-api/analytics) - Endpoint reference: [WhatsApp Business Account > Analytics](https://developers.facebook.com/docs/graph-api/reference/waba-analytics/)
             *
             * @tags Analytics
             * @name WabaIdList
             * @summary Get conversation analytics
             * @request GET:/{Version}/{WABA-ID}
             * @secure
             * @response `200` `string` OK
             */
            wabaIdList: function (_a, params) {
                var version = _a.version, wabaId = _a.wabaId, query = __rest(_a, ["version", "wabaId"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(wabaId), method: "GET", query: query, secure: true, format: "json" }, params));
            },
        };
        this.phoneNumberId = {
            /**
             * @description - Guide: [Block Users](https://developers.facebook.com/docs/whatsapp/cloud-api/block-users) - Endpoint reference: [POST WhatsApp Buiness Phone Number &gt; block_users](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/block_users/#Creating)
             *
             * @tags Block Users
             * @name BlockUsersCreate
             * @summary Block user(s)
             * @request POST:/{Version}/{Phone-Number-ID}/block_users
             * @secure
             * @response `200` `string` OK
             */
            blockUsersCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/block_users"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description - Guide: [Block Users](https://developers.facebook.com/docs/whatsapp/cloud-api/block-users) - Endpoint reference: [DELETE WhatsApp Buiness Phone Number &gt; block_users](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/block_users/#Deleting)
             *
             * @tags Block Users
             * @name BlockUsersDelete
             * @summary Unblock user(s)
             * @request DELETE:/{Version}/{Phone-Number-ID}/block_users
             * @secure
             * @response `200` `string` OK
             */
            blockUsersDelete: function (version, phoneNumberId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/block_users"), method: "DELETE", secure: true, format: "json" }, params));
            },
            /**
             * @description - Guide: [Block Users](https://developers.facebook.com/docs/whatsapp/cloud-api/block-users) - Endpoint reference: [GET WhatsApp Buiness Phone Number &gt; block_users](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/block_users/#Reading)
             *
             * @tags Block Users
             * @name BlockUsersList
             * @summary Get blocked users
             * @request GET:/{Version}/{Phone-Number-ID}/block_users
             * @secure
             * @response `200` `string` OK
             */
            blockUsersList: function (version, phoneNumberId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/block_users"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * No description
             *
             * @tags Business Compliance
             * @name BusinessComplianceInfoCreate
             * @summary Add India-based business compliance info
             * @request POST:/{Version}/{Phone-Number-ID}/business_compliance_info
             * @secure
             * @response `200` `string` OK
             */
            businessComplianceInfoCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/business_compliance_info"), method: "POST", body: data, secure: true, type: ContentType.Text, format: "json" }, params));
            },
            /**
             * No description
             *
             * @tags Business Compliance
             * @name BusinessComplianceInfoList
             * @summary Get India-based business compliance info
             * @request GET:/{Version}/{Phone-Number-ID}/business_compliance_info
             * @secure
             * @response `200` `string` OK
             */
            businessComplianceInfoList: function (version, phoneNumberId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/business_compliance_info"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * @description To deregister your phone, make a **POST** call to **`{{Phone-Number-ID}}/deregister`**. **Deregister Phone** removes a previously registered phone. You can always re-register your phone using by repeating the registration process. #### Response A successful response returns: ``` json { "success": true } ```
             *
             * @tags Registration
             * @name DeregisterCreate
             * @summary Deregister Phone
             * @request POST:/{Version}/{Phone-Number-ID}/deregister
             * @secure
             * @response `default` `string` Successful response
             */
            deregisterCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/deregister"), method: "POST", body: data, secure: true, type: ContentType.Text }, params));
            },
            /**
             * @description This request uploads an audio as .ogg. The parameters are specified as **form-data** in the request **body**.
             *
             * @tags Media
             * @name MediaCreate
             * @summary Upload Audio
             * @request POST:/{Version}/{Phone-Number-ID}/media
             * @secure
             * @response `200` `string` OK
             */
            mediaCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/media"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description - Guide: [QR Codes](https://developers.facebook.com/docs/whatsapp/business-management-api/qr-codes) - Endpoint reference: [WhatsApp Business Phone Number > Message Qrdls](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/message_qrdls/)
             *
             * @tags QR codes
             * @name MessageQrdlsCreate
             * @summary Update Message QR Code.
             * @request POST:/{Version}/{Phone-Number-ID}/message_qrdls
             * @secure
             * @response `200` `string` OK
             */
            messageQrdlsCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/message_qrdls"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description - Guide: [QR Codes](https://developers.facebook.com/docs/whatsapp/business-management-api/qr-codes) - Endpoint reference: [WhatsApp Business Phone Number > Message Qrdls](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/message_qrdls/)
             *
             * @tags QR codes
             * @name MessageQrdlsList
             * @summary Get QR code PNG image URL
             * @request GET:/{Version}/{Phone-Number-ID}/message_qrdls
             * @secure
             * @response `200` `string` OK
             */
            messageQrdlsList: function (_a, params) {
                var version = _a.version, phoneNumberId = _a.phoneNumberId, query = __rest(_a, ["version", "phoneNumberId"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/message_qrdls"), method: "GET", query: query, secure: true, format: "json" }, params));
            },
            /**
             * @description - Guide: [QR Codes](https://developers.facebook.com/docs/whatsapp/business-management-api/qr-codes) - Endpoint reference: [WhatsApp Business Phone Number > Message Qrdls](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/message_qrdls/)
             *
             * @tags QR codes
             * @name MessageQrdlsQrCodeIdDelete
             * @summary Delete QR code
             * @request DELETE:/{Version}/{Phone-Number-ID}/message_qrdls/<QR_CODE_ID>
             * @secure
             * @response `200` `string` OK
             */
            messageQrdlsQrCodeIdDelete: function (version, phoneNumberId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/message_qrdls/<QR_CODE_ID>"), method: "DELETE", secure: true, format: "json" }, params));
            },
            /**
             * @description - Guide: [QR Codes](https://developers.facebook.com/docs/whatsapp/business-management-api/qr-codes) - Endpoint reference: [WhatsApp Business Phone Number > Message Qrdls](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/message_qrdls/)
             *
             * @tags QR codes
             * @name MessageQrdlsQrCodeIdList
             * @summary Get QR code
             * @request GET:/{Version}/{Phone-Number-ID}/message_qrdls/<QR_CODE_ID>
             * @secure
             * @response `200` `string` OK
             */
            messageQrdlsQrCodeIdList: function (version, phoneNumberId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/message_qrdls/<QR_CODE_ID>"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * No description
             *
             * @tags Examples
             * @name MessagesCreate
             * @summary Send Sample Issue Resolution Template
             * @request POST:/{Version}/{Phone-Number-ID}/messages
             * @secure
             * @response `200` `string` OK
             */
            messagesCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/messages"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description When you receive an incoming message from Webhooks, you could use messages endpoint to change the status of it to read. We recommend marking incoming messages as read within 30 days of receipt. **Note**: you cannot mark outgoing messages you sent as read. You need to obtain the **`message_id`** of the incoming message from Webhooks. For a more in depth guide for marking messages as read, see [Guide: Mark Messages as Read](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/mark-message-as-read).
             *
             * @tags Messages
             * @name MessagesUpdate
             * @summary Mark Message As Read
             * @request PUT:/{Version}/{Phone-Number-ID}/messages
             * @secure
             * @response `200` `string` OK
             */
            messagesUpdate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/messages"), method: "PUT", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description You can use this endpoint to change two-step verification code associated with your account. After you change the verification code, future requests like changing the name, must use the new code. **You set up two-factor verification and [register a phone number](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/registration#register-phone) in the same API call.** You must use the parameters listed below to change two-step verification
             *
             * @tags Phone Numbers
             * @name PhoneNumberIdCreate
             * @summary Set Two-Step Verification Code
             * @request POST:/{Version}/{Phone-Number-ID}
             * @secure
             * @response `200` `string` OK
             */
            phoneNumberIdCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description Include **`fields=name_status`** as a query string parameter to get the status of a display name associated with a specific phone number. This field is currently in beta and not available to all developers.
             *
             * @tags Phone Numbers
             * @name PhoneNumberIdList
             * @summary Get Display Name Status (Beta)
             * @request GET:/{Version}/{Phone-Number-ID}
             * @secure
             * @response `200` `string` OK
             */
            phoneNumberIdList: function (_a, params) {
                var version = _a.version, phoneNumberId = _a.phoneNumberId, query = __rest(_a, ["version", "phoneNumberId"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId), method: "GET", query: query, secure: true, format: "json" }, params));
            },
            /**
             * @description To migrate your account, make a **POST** call to the **`/{{Phone-Number-ID}}/register`** endpoint and include the parameters listed below. Your request may take as long as 15 seconds to finish. During this period, your on-premise deployment is automatically disconnected from WhatsApp server and shutdown; the business account will start up in the cloud-hosted service at the same time. After the request finishes successfully, you can send messages immediately.
             *
             * @tags OnPrem Account Migration
             * @name RegisterCreate
             * @summary Migrate Account
             * @request POST:/{Version}/{Phone-Number-ID}/register
             * @secure
             * @response `200` `string` OK
             */
            registerCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/register"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description You need to verify the phone number you want to use to send messages to your customers. Phone numbers must be verified through SMS/voice call. The verification process can be done through the Graph API calls specified below. To verify a phone number using Graph API, make a **POST** request to **`{{PHONE_NUMBER_ID}}/request_code`**. In your call, include your chosen verification method and locale. You need to authenticate yourself using **{{User-Access-Token}}** (This is automatically done for you in the **`Request Verification Code`** request). #### Response After a successful call to **`Request Verification Code`**, you will receive your verification code via the method you selected in **`code_method`**. To finish the verification process, you need to use the [**`Verify Code`**](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers#verify) request.
             *
             * @tags Phone Numbers
             * @name RequestCodeCreate
             * @summary Request Verification Code
             * @request POST:/{Version}/{Phone-Number-ID}/request_code
             * @secure
             * @response `200` `string` OK
             */
            requestCodeCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/request_code"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description After you received a SMS or Voice request code from [**`Request Verification Code`**](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers#verify), you need to verify the code that was sent to you. To verify this code, make a **POST** request to **`{{PHONE_NUMBER_ID}}/verify_code`** that includes the code as a parameter.
             *
             * @tags Phone Numbers
             * @name VerifyCodeCreate
             * @summary Verify Code
             * @request POST:/{Version}/{Phone-Number-ID}/verify_code
             * @secure
             * @response `200` `string` OK
             */
            verifyCodeCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/verify_code"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description Sets the public key that is used for encrypting the data channel requests
             *
             * @tags Flows > Setup Endpoint Encryption
             * @name WhatsappBusinessEncryptionCreate
             * @summary Set Encryption Public Key
             * @request POST:/{Version}/{Phone-Number-ID}/whatsapp_business_encryption
             * @secure
             * @response `200` `string` OK
             */
            whatsappBusinessEncryptionCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/whatsapp_business_encryption"), method: "POST", body: data, secure: true, type: ContentType.FormData, format: "json" }, params));
            },
            /**
             * No description
             *
             * @tags Flows > Setup Endpoint Encryption
             * @name WhatsappBusinessEncryptionList
             * @summary Get Encryption Public Key
             * @request GET:/{Version}/{Phone-Number-ID}/whatsapp_business_encryption
             * @secure
             * @response `200` `string` OK
             */
            whatsappBusinessEncryptionList: function (version, phoneNumberId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/whatsapp_business_encryption"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * @description Update the business profile information such as the business description, email or address. To update your profile, make a **POST** call to **`/{{Phone-Number-ID}}/whatsapp_business_profile`**. In your request, you can include the parameters listed below. It is recommended that you use **Resumable Upload - Create an Upload Session** to obtain an upload ID. Then use this upload ID in a call to **Resumable Upload - Upload File Data** to obtain the picture handle. This handle can be used for the **`profile_picture_handle`**. ## Delete Business Profile To delete your business profile, you must [delete your phone number](https://developers.facebook.com/docs/whatsapp/phone-numbers#delete-phone-number-from-a-business-account).
             *
             * @tags Business Profiles
             * @name WhatsappBusinessProfileCreate
             * @summary Update Business Profile
             * @request POST:/{Version}/{Phone-Number-ID}/whatsapp_business_profile
             * @secure
             * @response `200` `string` OK
             */
            whatsappBusinessProfileCreate: function (version, phoneNumberId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/whatsapp_business_profile"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description To get information about a business profile, make a **GET** call to the **`/{{Phone-Number-ID}}/whatsapp_business_profile`** endpoint. Within the **`whatsapp_business_profile`** request, you can specify what you want to know from the business. <!-- grahamp 10262022: Removed table item:
             *
             * @tags Business Profiles
             * @name WhatsappBusinessProfileList
             * @summary Get Business Profile
             * @request GET:/{Version}/{Phone-Number-ID}/whatsapp_business_profile
             * @secure
             * @response `200` `string` OK
             */
            whatsappBusinessProfileList: function (version, phoneNumberId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/whatsapp_business_profile"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * @description - Guide: [Sell Products & Services](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/sell-products-and-services) (Cloud API) - Guide: [Sell Products & Services](https://developers.facebook.com/docs/whatsapp/on-premises/guides/commerce-guides) (On-Premises API) - Endpoint reference: [WhatsApp Business Phone Number > WhatsApp Commerce Settings](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/whatsapp_commerce_settings)
             *
             * @tags Commerce Settings
             * @name WhatsappCommerceSettingsCreate
             * @summary Set or update commerce settings
             * @request POST:/{Version}/{Phone-Number-ID}/whatsapp_commerce_settings
             * @secure
             * @response `200` `string` OK
             */
            whatsappCommerceSettingsCreate: function (_a, params) {
                var version = _a.version, phoneNumberId = _a.phoneNumberId, query = __rest(_a, ["version", "phoneNumberId"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/whatsapp_commerce_settings"), method: "POST", query: query, secure: true, format: "json" }, params));
            },
            /**
             * @description - Guide: [Sell Products & Services](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/sell-products-and-services) (Cloud API) - Guide: [Sell Products & Services](https://developers.facebook.com/docs/whatsapp/on-premises/guides/commerce-guides) (On-Premises API) - Endpoint reference: [WhatsApp Business Phone Number > WhatsApp Commerce Settings](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/whatsapp_commerce_settings)
             *
             * @tags Commerce Settings
             * @name WhatsappCommerceSettingsList
             * @summary Get commerce settings
             * @request GET:/{Version}/{Phone-Number-ID}/whatsapp_commerce_settings
             * @secure
             * @response `200` `string` OK
             */
            whatsappCommerceSettingsList: function (version, phoneNumberId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(phoneNumberId, "/whatsapp_commerce_settings"), method: "GET", secure: true, format: "json" }, params));
            },
        };
        this.debugToken = {
            /**
             * No description
             *
             * @tags Get Started
             * @name DebugTokenList
             * @summary Debug Access Token
             * @request GET:/{Version}/debug_token
             * @secure
             */
            debugTokenList: function (version, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/debug_token"), method: "GET", secure: true }, params));
            },
        };
        this.businessId = {
            /**
             * @description Endpoint reference: [Business](https://developers.facebook.com/docs/marketing-api/reference/business/)
             *
             * @tags Business Portfolio
             * @name BusinessIdList
             * @summary Get Business Portfolio (Specific Fields)
             * @request GET:/{Version}/{Business-ID}
             * @secure
             * @response `200` `string` OK
             */
            businessIdList: function (_a, params) {
                var version = _a.version, businessId = _a.businessId, query = __rest(_a, ["version", "businessId"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(businessId), method: "GET", query: query, secure: true, format: "json" }, params));
            },
            /**
             * No description
             *
             * @tags WhatsApp Business Accounts (WABAs)
             * @name ClientWhatsappBusinessAccountsList
             * @summary Get shared WABAs
             * @request GET:/{Version}/{Business-ID}/client_whatsapp_business_accounts
             * @secure
             * @response `200` `string` OK
             */
            clientWhatsappBusinessAccountsList: function (version, businessId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(businessId, "/client_whatsapp_business_accounts"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * @description - Endpoint reference: [Business > Extendedcredits](https://developers.facebook.com/docs/marketing-api/reference/extended-credit/)
             *
             * @tags Billing
             * @name ExtendedcreditsList
             * @summary Get credit lines
             * @request GET:/{Version}/{Business-ID}/extendedcredits
             * @secure
             * @response `200` `string` OK
             */
            extendedcreditsList: function (version, businessId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(businessId, "/extendedcredits"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * @description Endpoint reference: [Business > Extended Credits](https://developers.facebook.com/docs/marketing-api/reference/business/extendedcredits/)
             *
             * @tags WhatsApp Business Accounts (WABAs)
             * @name OwnedWhatsappBusinessAccountsList
             * @summary Get owned WABAs
             * @request GET:/{Version}/{Business-ID}/owned_whatsapp_business_accounts
             * @secure
             * @response `200` `string` OK
             */
            ownedWhatsappBusinessAccountsList: function (version, businessId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(businessId, "/owned_whatsapp_business_accounts"), method: "GET", secure: true, format: "json" }, params));
            },
        };
        this.templateId = {
            /**
             * @description - Guide: [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates) - Guide: [How To Monitor Quality Signals](https://developers.facebook.com/docs/whatsapp/guides/how-to-monitor-quality-signals) - Endpoint reference: [WhatsApp Message Template](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-hsm/)
             *
             * @tags Templates
             * @name TemplateIdCreate
             * @summary Edit template
             * @request POST:/{Version}/<TEMPLATE_ID>
             * @secure
             * @response `200` `string` OK
             */
            templateIdCreate: function (version, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/<TEMPLATE_ID>"), method: "POST", body: data, secure: true, type: ContentType.Json, format: "json" }, params));
            },
            /**
             * @description - Guide: [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates) - Guide: [How To Monitor Quality Signals](https://developers.facebook.com/docs/whatsapp/guides/how-to-monitor-quality-signals) - Endpoint reference: [WhatsApp Message Template](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-hsm/)
             *
             * @tags Templates
             * @name TemplateIdList
             * @summary Get template by ID (default fields)
             * @request GET:/{Version}/<TEMPLATE_ID>
             * @secure
             * @response `200` `string` OK
             */
            templateIdList: function (version, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/<TEMPLATE_ID>"), method: "GET", secure: true, format: "json" }, params));
            },
        };
        this.flowId = {
            /**
             * @description Used to upload a flow JSON file with the flow content. Refer to flow JSON documentation here [https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson) The file must be attached as from data. The response will include any validation errors in the JSON file
             *
             * @tags Flows > Update Flow
             * @name AssetsCreate
             * @summary Update Flow JSON
             * @request POST:/{Version}/{Flow-ID}/assets
             * @secure
             * @response `200` `string` OK
             */
            assetsCreate: function (version, flowId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(flowId, "/assets"), method: "POST", body: data, secure: true, type: ContentType.FormData, format: "json" }, params));
            },
            /**
             * @description Returns all assets attached to the flow. Currently only FLOW_JSON asset is supported
             *
             * @tags Flows > Update Flow
             * @name AssetsList
             * @summary List Assets (Get Flow JSON URL)
             * @request GET:/{Version}/{Flow-ID}/assets
             * @secure
             * @response `200` `string` OK
             */
            assetsList: function (version, flowId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(flowId, "/assets"), method: "GET", secure: true, format: "json" }, params));
            },
            /**
             * @description Updates the status of the flow as "DEPRECATED". This action is not reversible. Only a published flow can be deprecated to prevent sending or opening it.
             *
             * @tags Flows > Update Flow
             * @name DeprecateCreate
             * @summary Deprecate Flow
             * @request POST:/{Version}/{Flow-ID}/deprecate
             * @secure
             * @response `200` `string` OK
             */
            deprecateCreate: function (version, flowId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(flowId, "/deprecate"), method: "POST", secure: true, format: "json" }, params));
            },
            /**
             * No description
             *
             * @tags Flows > Update Flow
             * @name FlowIdCreate
             * @summary Update Flow Metadata
             * @request POST:/{Version}/{Flow-ID}
             * @secure
             * @response `200` `string` OK
             */
            flowIdCreate: function (version, flowId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(flowId), method: "POST", body: data, secure: true, type: ContentType.FormData, format: "json" }, params));
            },
            /**
             * @description Deletes the flow entirely. This action is not reversible. Only a DRAFT flow can be deleted.
             *
             * @tags Flows > Update Flow
             * @name FlowIdDelete
             * @summary Delete Flow
             * @request DELETE:/{Version}/{Flow-ID}
             * @secure
             * @response `200` `string` OK
             */
            flowIdDelete: function (version, flowId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(flowId), method: "DELETE", secure: true, format: "json" }, params));
            },
            /**
             * @description Can request specific fields by enabling the \`fields\` query param
             *
             * @tags Flows > Get Endpoint Metrics
             * @name FlowIdList
             * @summary Get Endpoint Availability Metric
             * @request GET:/{Version}/{Flow-ID}
             * @secure
             * @response `200` `string` OK
             */
            flowIdList: function (_a, params) {
                var version = _a.version, flowId = _a.flowId, query = __rest(_a, ["version", "flowId"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(flowId), method: "GET", query: query, secure: true, format: "json" }, params));
            },
            /**
             * @description Updates the status of the flow as "PUBLISHED". This action is not reversible. The flow and its assets become immutable once published. To update the flow, you must create a new flow and specify the previous flow id as the \`clone_flow_id\` parameter
             *
             * @tags Flows > Update Flow
             * @name PublishCreate
             * @summary Publish Flow
             * @request POST:/{Version}/{Flow-ID}/publish
             * @secure
             * @response `200` `string` OK
             */
            publishCreate: function (version, flowId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(flowId, "/publish"), method: "POST", secure: true, format: "json" }, params));
            },
        };
        this.mediaId = {
            /**
             * @description To delete media, make a **DELETE** call to the ID of the media you want to delete. ## Prerequisites - [User Access Token](https://developers.facebook.com/docs/facebook-login/access-tokens#usertokens) with **`whatsapp_business_messaging`** permission - Media object ID from either uploading media endpoint or media message Webhooks ## Request [Perform requests in Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=DELETE&path=media_id&version=v8.0)
             *
             * @tags Media
             * @name MediaIdDelete
             * @summary Delete Media
             * @request DELETE:/{Version}/{Media-ID}/
             * @secure
             * @response `200` `string` OK
             */
            mediaIdDelete: function (_a, params) {
                var version = _a.version, mediaId = _a.mediaId, query = __rest(_a, ["version", "mediaId"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(mediaId, "/"), method: "DELETE", query: query, secure: true, format: "json" }, params));
            },
            /**
             * @description To retrieve your media’s URL, make a **GET** call to **`/{{Media-ID}}`**. Use the returned URL to download the media file. Note that clicking this URL (i.e. performing a generic GET) will not return the media; you must include an access token. For more information, see [Download Media](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#download-media). You can also use the optional query **`?phone_number_id`** for **`Retrieve Media URL`** and **`Delete Media`**. This parameter checks to make sure the media belongs to the phone number before retrieval or deletion. #### Response A successful response includes an object with a media URL. The URL is only valid for 5 minutes. To use this URL, see [Download Media](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#download-media).
             *
             * @tags Media
             * @name MediaIdList
             * @summary Retrieve Media URL
             * @request GET:/{Version}/{Media-ID}
             * @secure
             * @response `200` `string` OK
             */
            mediaIdList: function (_a, params) {
                var version = _a.version, mediaId = _a.mediaId, query = __rest(_a, ["version", "mediaId"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(mediaId), method: "GET", query: query, secure: true, format: "json" }, params));
            },
        };
        this.mediaUrl = {
            /**
             * @description When you retrieve a media URL through the **GET** Media endpoint, you must use a User Access Token to download media content from the URL. If you click the URL from a browser, you will get an access error. <br/> > **Note**: all media URLs will expire after 5 minutes, you need to retrieve the media URL again if it expires. ## Prerequisites - [User Access Token](https://developers.facebook.com/docs/facebook-login/access-tokens#usertokens) with **`whatsapp_business_messaging`** permission - A media URL obtained from retrieving media url endpoint ## Response: If successful,  you receive the binary data of media saved in **`media_file`**, response headers contain a `content-type` header to indicate the mime type of returned data. For more information, see [Supported Media Types](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#supported-media-types). If media fails to download, you receive a **404 Not Found** response code. In that case, we recommend that you try to [Retrieve Media URL](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#retrieve-media-url) and download again. If doing so doesn't resolve the issue, please try to renew the **`USER_ACCESS_TOKEN`** then retry downloading the media.
             *
             * @tags Media
             * @name MediaUrlList
             * @summary Download Media
             * @request GET:/{Version}/{Media-URL}
             * @secure
             * @response `200` `string` OK
             */
            mediaUrlList: function (version, mediaUrl, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(mediaUrl), method: "GET", secure: true, format: "json" }, params));
            },
        };
        this.app = {
            /**
             * @description The Resumable Upload series of requests allow you to upload Profile Pictures to Meta so you can receive a handle to update these pictures in the Business Profile API. The Resumable Upload requests consist of the following: * **Resumable Upload - Create an Upload Session** * **Resumable Upload - Upload File Data** * **Resumable Upload - Query File Upload Status** To create a new upload session, make a **POST** call using the `/app/uploads` endpoint. For more information, see [Create an Upload Session](https://developers.facebook.com/docs/graph-api/guides/upload#step-1--create-a-session). **Response** The call returns a server-generated value that includes the session ID that you can use in later calls. >Copy this value and Open the **Environment quick look** in Postman and paste it in the **CURRENT VALUE** for `Upload-ID`.
             *
             * @tags Business Profiles
             * @name UploadsCreate
             * @summary Resumable Upload - Create an Upload Session
             * @request POST:/{Version}/app/uploads/
             * @secure
             * @response `200` `string` OK
             */
            uploadsCreate: function (_a, params) {
                var version = _a.version, query = __rest(_a, ["version"]);
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/app/uploads/"), method: "POST", query: query, secure: true, format: "json" }, params));
            },
        };
        this.uploadId = {
            /**
             * @description To upload a profile picture to your business profile, make a **POST** call to the named endpoint {{Version}}/{{Upload-ID}}, where **Upload-ID** is the value you received from **Resumable Upload - Create an Upload Session**. This value should look like the following: ``` json "upload:MTphdHRhY2htZW50Ojlk2mJiZxUwLWV6MDUtNDIwMy05yTA3LWQ4ZDPmZGFkNTM0NT8=?sig=ARZqkGCA_uQMxC8nHKI" ``` The **`file_offset`** parameter **must** be included as an HTTP header. It will not work as a query parameter. The access token must be included in an Authorization HTTP header. It cannot work as a query parameter. For more information, see [Initiate Data Upload](https://developers.facebook.com/docs/graph-api/guides/upload#step-2--initiate-upload). **Response** The call returns a handle that includes the session ID that you can use to update your profile picture using **Update Business Profile**.
             *
             * @tags Business Profiles
             * @name UploadIdCreate
             * @summary Resumable Upload - Upload File Data
             * @request POST:/{Version}/{Upload-ID}
             * @secure
             * @response `200` `string` OK
             */
            uploadIdCreate: function (version, uploadId, data, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(uploadId), method: "POST", body: data, secure: true, type: ContentType.Text, format: "json" }, params));
            },
            /**
             * @description You can query the status of an upload session by making a **GET** call to an endpoint that is named based on the **`Upload-ID`** that was returned through the **Resumable Upload - Create an Upload Session** request. When uploading data, you **must include the access token as an HTTP header.** **Example** ``` bash GET https://graph.facebook.com/v14.0/upload:MTphdHRhY2htZW50Ojlk2mJiZxUwLWV6MDUtNDIwMy05yTA3LWQ4ZDPmZGFkNTM0NT8=?sig=ARZqkGCA_uQMxC8nHKI HTTP/1.1 Authorization: OAuth {{USER_ACCESS_TOKEN}} ``` For more information, see [Query File Upload Status after an Interruption](https://developers.facebook.com/docs/graph-api/guides/upload#interruptions). **Response** The result will be a JSON-encoded ID and offset that looks like the following: ``` json { "id": "upload:MTphdHRhY2htZW50Ojlk2mJiZxUwLWV6MDUtNDIwMy05yTA3LWQ4ZDPmZGFkNTM0NT8=?sig=ARZqkGCA_uQMxC8nHKI", "file_offset": 0 } ```
             *
             * @tags Business Profiles
             * @name UploadIdList
             * @summary Resumable Upload - Query File Upload Status
             * @request GET:/{Version}/{Upload-ID}
             * @secure
             * @response `200` `string` OK
             */
            uploadIdList: function (version, uploadId, params) {
                if (params === void 0) { params = {}; }
                return _this.http.request(__assign({ path: "/".concat(version, "/").concat(uploadId), method: "GET", secure: true, format: "json" }, params));
            },
        };
        this.http = http;
    }
    return Api;
}());
exports.Api = Api;
