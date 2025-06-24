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

export interface AssetsCreatePayload {
  /** @example "FLOW_JSON" */
  asset_type?: string;
  /** @format binary */
  file?: File;
  /** @example "flow.json" */
  name?: string;
}

/** @example {"messaging_product":"whatsapp","block_users":[{"user":"{{Recipient-Phone-Number}}"}]} */
export type BlockUsersCreatePayload = object;

export type BusinessComplianceInfoCreatePayload = string;

export interface BusinessIdListParams {
  businessId: string;
  /** @example "id,name,timezone_id" */
  fields?: string;
  version: string;
}

export type DeregisterCreateError = string;

export type DeregisterCreatePayload = string;

export interface FlowIdCreatePayload {
  /**
   * A list of Flow categories. Multiple values are possible, but at least one is required. Choose the values which represent your business use case.
   *
   * Allowed values: "SIGN_UP", "SIGN_IN", "APPOINTMENT_BOOKING", "LEAD_GENERATION", "CONTACT_US", "CUSTOMER_SUPPORT", "SURVEY", "OTHER"
   * @example "["OTHER"]"
   */
  categories?: string;
  /**
   * Endpoint URI for the Flow
   * @example "https://example.com"
   */
  endpoint_uri?: string;
  /** @example "<NEW_FLOW_NAME>" */
  name?: string;
}

export interface FlowIdListParams {
  /** @example "metric.name(ENDPOINT_AVAILABILITY).granularity(DAY).since(2024-01-28).until(2024-01-30)" */
  fields?: string;
  flowId: string;
  version: string;
}

export interface FlowsCreatePayload {
  /**
   * A list of Flow categories. Multiple values are possible, but at least one is required. Choose the values which represent your business use case.
   *
   * Possible values: "SIGN_UP", "SIGN_IN", "APPOINTMENT_BOOKING", "LEAD_GENERATION", "CONTACT_US", "CUSTOMER_SUPPORT", "SURVEY", "OTHER"
   * @example "["OTHER"]"
   */
  categories?: string;
  /**
   * Creates a copy of the existing flow specified
   * @example "<EXISTING_FLOW_ID>"
   */
  clone_flow_id?: string;
  /**
   * Endpoint URI for the Flow
   * @example "https://example.com"
   */
  endpoint_uri?: string;
  /** @example "<FLOW_NAME>" */
  name?: string;
}

/** @example {"file":"@/local/path/file.ogg;type=audio/ogg","messaging_product":"whatsapp"} */
export type MediaCreatePayload = object;

export interface MediaIdDeleteParams {
  mediaId: string;
  /**
   * Specifies that deletion of the media  only be performed if the media belongs to the provided phone number.
   * @example "<PHONE_NUMBER_ID>"
   */
  phone_number_id?: string;
  version: string;
}

export interface MediaIdListParams {
  mediaId: string;
  /**
   * Specifies that this action only be performed if the media belongs to the provided phone number.
   * @example "<PHONE_NUMBER_ID>"
   */
  phone_number_id?: string;
  version: string;
}

/** @example {"prefilled_message":"<PREFILLED_MESSAGE>","code":"<CODE>"} */
export type MessageQrdlsCreatePayload = object;

export interface MessageQrdlsListParams {
  /** @example "<QR_CODE_ID>" */
  code?: string;
  /** @example "prefilled_message,deep_link_url,qr_image_url.format(PNG)" */
  fields?: string;
  phoneNumberId: string;
  version: string;
}

/** @example {"name":"<TEMPLATE_NAME>","language":"en_US","category":"MARKETING","components":[{"type":"body","text":"Check out this new offer"},{"type":"BUTTONS","buttons":[{"type":"FLOW","text":"Check out this offer!","flow_id":"{{Flow-ID}}","navigate_screen":"<SCREEN_ID>","flow_action":"navigate"}]}]} */
export type MessageTemplatesCreatePayload = object;

export interface MessageTemplatesDeleteParams {
  /**
   * Template ID
   * @example "<HSM_ID>"
   */
  hsm_id?: string;
  /**
   * Template name
   * @example "<NAME>"
   */
  name?: string;
  version: string;
  wabaId: string;
}

/** @example {"messaging_product":"whatsapp","to":"{{Recipient-Phone-Number}}","type":"template","template":{"name":"sample_issue_resolution","language":{"code":"en_US","policy":"deterministic"},"components":[{"type":"body","parameters":[{"type":"text","text":"*Mr. Jones*"}]},{"type":"button","sub_type":"quick_reply","index":0,"parameters":[{"type":"text","text":"Yes"}]},{"type":"button","sub_type":"quick_reply","index":1,"parameters":[{"type":"text","text":"No"}]}]}} */
export type MessagesCreatePayload = object;

/** @example {"messaging_product":"whatsapp","status":"read","message_id":"<INCOMING_MSG_ID>"} */
export type MessagesUpdatePayload = object;

export interface MigrateFlowsCreatePayload {
  /**
   * [Optional] The names of the flows that will be copied from the source WABA. If not specified, all flows in the source WABA will be copied
   * @example "["appointment", "leadgen"]"
   */
  source_flow_names?: string;
  /**
   * The ID of the source WABA from which the flows will be copied
   * @example "<SOURCE_WABA_ID>"
   */
  source_waba_id?: string;
}

/** @example {"pin":"<6-digit-pin>"} */
export type PhoneNumberIdCreatePayload = object;

export interface PhoneNumberIdListParams {
  /**
   * The status of a display name associated with a specific phone number. The **`name_status`** value can be one of the following:
   *
   * * `APPROVED`: The name has been approved. You can download your certificate now.
   * * `AVAILABLE_WITHOUT_REVIEW`: The certificate for the phone is available and display name is ready to use without review.
   * * `DECLINED`: The name has not been approved. You cannot download your certificate.
   * * `EXPIRED`: Your certificate has expired and can no longer be downloaded.
   * * `PENDING_REVIEW`: Your name request is under review. You cannot download your certificate.
   * NONE: No certificate is available.
   * @example "name_status"
   */
  fields?: string;
  phoneNumberId: string;
  version: string;
}

export interface PhoneNumbersListParams {
  /** @example "id,is_official_business_account,display_phone_number,verified_name" */
  fields?: string;
  /** @example "[{'field':'account_mode','operator':'EQUAL','value':'SANDBOX'}]" */
  filtering?: string;
  version: string;
  wabaId: string;
}

/** @example {"messaging_product":"whatsapp","pin":"6-digit-pin","backup":{"data":"backup_data","password":"password"}} */
export type RegisterCreatePayload = object;

/** @example {"code_method":"SMS","locale":"en_US"} */
export type RequestCodeCreatePayload = object;

/** @example {"override_callback_uri":"<ALTERNATE_WEBHOOK_ENDPOINT_URL>","verify_token":"<ALTERNATE_WEBOOK_ENDPOINT_VERIFICATION_TOKEN>"} */
export type SubscribedAppsCreatePayload = object;

/** @example {"name":"2023_april_promo","components":[{"type":"HEADER","format":"TEXT","text":"Fall Sale"},{"type":"BODY","text":"Hi {{1}}, our Fall Sale is on! Use promo code {{2}} Get an extra 25% off every order above $350!","example":{"body_text":[["Mark","FALL25"]]}},{"type":"FOOTER","text":"Not interested in any of our sales? Tap Stop Promotions"},{"type":"BUTTONS","buttons":[{"type":"QUICK_REPLY","text":"Stop promotions"}]}],"language":"en_US","category":"MARKETING"} */
export type TemplateIdCreatePayload = object;

export interface UploadsCreateParams {
  /**
   * **Required**<br/>Specifies the size of your file in bytes.
   * @example "<YOUR_FILE_LENGTH>"
   */
  file_length?: string;
  /**
   * **Optional**<br/>Specifies the file name you are using to create the session.
   * @example "myprofile.jpg"
   */
  file_name?: string;
  /**
   * **Required**<br/>Specifies the MIME type. Values are <ul><li>`image/jpeg`</li><li>`image/png`</li><li>`video/mp4`</li></ul>
   * @example "image/jpeg"
   */
  file_type?: string;
  version: string;
}

/** @example {"code":"<your-requested-code>"} */
export type VerifyCodeCreatePayload = object;

export interface WabaIdListParams {
  /** @example "conversation_analytics.start(1656661480).end(1674859480).granularity(MONTHLY).conversation_directions(["business_initiated"]).dimensions(["conversation_type", "conversation_direction"])" */
  fields?: string;
  version: string;
  wabaId: string;
}

export interface WhatsappBusinessEncryptionCreatePayload {
  /**
   * @example "-----BEGIN PUBLIC KEY-----
   * MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
   * ...
   * 8QIDAQAB
   * -----END PUBLIC KEY-----"
   */
  business_public_key?: string;
}

/** @example {"messaging_product":"whatsapp","address":"<business-address>","description":"<business-description>","vertical":"<business-industry>","about":"<profile-about-text>","email":"<business-email>","websites":["<https://website-1>","<https://website-2>"],"profile_picture_handle":"<IMAGE_HANDLE_ID>"} */
export type WhatsappBusinessProfileCreatePayload = object;

export interface WhatsappCommerceSettingsCreateParams {
  /** @example "true" */
  is_cart_enabled?: boolean;
  /** @example "true" */
  is_catalog_visible?: boolean;
  phoneNumberId: string;
  version: string;
}

export namespace WabaId {
  /**
   * @description Creates a new flow. To clone an existing flow you can add the parameter `"clone_flow_id": "original-flow-id"`
   * @tags Flows > Create Flow
   * @name FlowsCreate
   * @summary Create Flow
   * @request POST:/{Version}/{WABA-ID}/flows
   * @secure
   * @response `200` `string` OK
   */
  export namespace FlowsCreate {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = FlowsCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * No description
   * @tags Flows > Create Flow
   * @name FlowsList
   * @summary List Flows
   * @request GET:/{Version}/{WABA-ID}/flows
   * @secure
   * @response `200` `string` OK
   */
  export namespace FlowsList {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * No description
   * @tags Flows > Send Flow
   * @name MessageTemplatesCreate
   * @summary Create Flow Template Message by ID
   * @request POST:/{Version}/{WABA-ID}/message_templates
   * @secure
   * @response `200` `string` OK
   */
  export namespace MessageTemplatesCreate {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = MessageTemplatesCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates) - Guide: [How To Monitor Quality Signals](https://developers.facebook.com/docs/whatsapp/guides/how-to-monitor-quality-signals) - Endpoint reference: [WhatsApp Business Account > Message Templates](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/message_templates/)
   * @tags Templates
   * @name MessageTemplatesDelete
   * @summary Delete template by ID
   * @request DELETE:/{Version}/{WABA-ID}/message_templates
   * @secure
   * @response `200` `string` OK
   */
  export namespace MessageTemplatesDelete {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {
      /**
       * Template ID
       * @example "<HSM_ID>"
       */
      hsm_id?: string;
      /**
       * Template name
       * @example "<NAME>"
       */
      name?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates) - Guide: [How To Monitor Quality Signals](https://developers.facebook.com/docs/whatsapp/guides/how-to-monitor-quality-signals) - Endpoint reference: [WhatsApp Business Account > Message Templates](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/message_templates/)
   * @tags Templates
   * @name MessageTemplatesList
   * @summary Get all templates (default fields)
   * @request GET:/{Version}/{WABA-ID}/message_templates
   * @secure
   * @response `200` `string` OK
   */
  export namespace MessageTemplatesList {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description Creates a copy of existing flows from source WABA to destination WABA with the same names.
   * @tags Flows > Create Flow
   * @name MigrateFlowsCreate
   * @summary Migrate Flows
   * @request POST:/{Version}/{WABA-ID}/migrate_flows
   * @secure
   * @response `200` `string` OK
   */
  export namespace MigrateFlowsCreate {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = MigrateFlowsCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [Filter Phone Numbers](https://developers.facebook.com/docs/whatsapp/business-management-api/manage-phone-numbers#filter-phone-numbers) - Endpoint reference: [WhatsApp Business Account > Phone Numbers](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/phone_numbers/)
   * @tags Phone Numbers
   * @name PhoneNumbersList
   * @summary Get Phone Numbers with Filtering (beta)
   * @request GET:/{Version}/{WABA-ID}/phone_numbers
   * @secure
   */
  export namespace PhoneNumbersList {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {
      /** @example "id,is_official_business_account,display_phone_number,verified_name" */
      fields?: string;
      /** @example "[{'field':'account_mode','operator':'EQUAL','value':'SANDBOX'}]" */
      filtering?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = any;
  }

  /**
   * @description If you want to subscribe to Webhooks for multiple WhatsApp Business Accounts but want messages field Webhooks notifications to be sent to different callback URLs for each WABA, you can override the callback URL when subscribing to Webhooks for each WABA. To do this, first verify that the alternate Webhook endpoint can receive and process Webhooks notifications. Then, subscribe to Webhooks for the WABA as your normally would, but include the alternate endpoint's callback URL along with its verification token as a JSON payload: For more information, see [Overriding the Callback URL](https://developers.facebook.com/docs/whatsapp/embedded-signup/webhooks#overriding-the-callback-url).
   * @tags Webhook Subscriptions
   * @name SubscribedAppsCreate
   * @summary Override Callback URL
   * @request POST:/{Version}/{WABA-ID}/subscribed_apps
   * @secure
   * @response `200` `string` OK
   */
  export namespace SubscribedAppsCreate {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = SubscribedAppsCreatePayload;
    export type RequestHeaders = {
      /** @example "Bearer {{User-Access-Token}}" */
      Authorization?: string;
    };
    export type ResponseBody = string;
  }

  /**
   * @description To unsubscribe your app from webhooks for a WhatsApp Business Account, send a **DELETE** request to the `/subscribed_apps/` endpoint on the WABA.
   * @tags Webhook Subscriptions
   * @name SubscribedAppsDelete
   * @summary Unsubscribe from a WABA
   * @request DELETE:/{Version}/{WABA-ID}/subscribed_apps
   * @secure
   * @response `200` `string` OK
   */
  export namespace SubscribedAppsDelete {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** @example "Bearer {{User-Access-Token}}" */
      Authorization?: string;
    };
    export type ResponseBody = string;
  }

  /**
   * @description To get a list of apps subscribed to Webhooks for a WABA, send a **GET** request to the **`subscribed_apps`** endpoint on the WABA:
   * @tags Webhook Subscriptions
   * @name SubscribedAppsList
   * @summary Get All Subscriptions for a WABA
   * @request GET:/{Version}/{WABA-ID}/subscribed_apps
   * @secure
   * @response `200` `string` OK
   */
  export namespace SubscribedAppsList {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** @example "Bearer {{User-Access-Token}}" */
      Authorization?: string;
    };
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [Analytics](https://developers.facebook.com/docs/whatsapp/business-management-api/analytics) - Endpoint reference: [WhatsApp Business Account > Analytics](https://developers.facebook.com/docs/graph-api/reference/waba-analytics/)
   * @tags Analytics
   * @name WabaIdList
   * @summary Get conversation analytics
   * @request GET:/{Version}/{WABA-ID}
   * @secure
   * @response `200` `string` OK
   */
  export namespace WabaIdList {
    export type RequestParams = {
      version: string;
      wabaId: string;
    };
    export type RequestQuery = {
      /** @example "conversation_analytics.start(1656661480).end(1674859480).granularity(MONTHLY).conversation_directions(["business_initiated"]).dimensions(["conversation_type", "conversation_direction"])" */
      fields?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }
}

export namespace PhoneNumberId {
  /**
   * @description - Guide: [Block Users](https://developers.facebook.com/docs/whatsapp/cloud-api/block-users) - Endpoint reference: [POST WhatsApp Buiness Phone Number &gt; block_users](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/block_users/#Creating)
   * @tags Block Users
   * @name BlockUsersCreate
   * @summary Block user(s)
   * @request POST:/{Version}/{Phone-Number-ID}/block_users
   * @secure
   * @response `200` `string` OK
   */
  export namespace BlockUsersCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = BlockUsersCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [Block Users](https://developers.facebook.com/docs/whatsapp/cloud-api/block-users) - Endpoint reference: [DELETE WhatsApp Buiness Phone Number &gt; block_users](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/block_users/#Deleting)
   * @tags Block Users
   * @name BlockUsersDelete
   * @summary Unblock user(s)
   * @request DELETE:/{Version}/{Phone-Number-ID}/block_users
   * @secure
   * @response `200` `string` OK
   */
  export namespace BlockUsersDelete {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [Block Users](https://developers.facebook.com/docs/whatsapp/cloud-api/block-users) - Endpoint reference: [GET WhatsApp Buiness Phone Number &gt; block_users](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/block_users/#Reading)
   * @tags Block Users
   * @name BlockUsersList
   * @summary Get blocked users
   * @request GET:/{Version}/{Phone-Number-ID}/block_users
   * @secure
   * @response `200` `string` OK
   */
  export namespace BlockUsersList {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * No description
   * @tags Business Compliance
   * @name BusinessComplianceInfoCreate
   * @summary Add India-based business compliance info
   * @request POST:/{Version}/{Phone-Number-ID}/business_compliance_info
   * @secure
   * @response `200` `string` OK
   */
  export namespace BusinessComplianceInfoCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = BusinessComplianceInfoCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * No description
   * @tags Business Compliance
   * @name BusinessComplianceInfoList
   * @summary Get India-based business compliance info
   * @request GET:/{Version}/{Phone-Number-ID}/business_compliance_info
   * @secure
   * @response `200` `string` OK
   */
  export namespace BusinessComplianceInfoList {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description To deregister your phone, make a **POST** call to **`{{Phone-Number-ID}}/deregister`**. **Deregister Phone** removes a previously registered phone. You can always re-register your phone using by repeating the registration process. #### Response A successful response returns: ``` json { "success": true } ```
   * @tags Registration
   * @name DeregisterCreate
   * @summary Deregister Phone
   * @request POST:/{Version}/{Phone-Number-ID}/deregister
   * @secure
   * @response `default` `string` Successful response
   */
  export namespace DeregisterCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = DeregisterCreatePayload;
    export type RequestHeaders = {
      /** @example "application/json" */
      "Content-Type"?: string;
    };
    export type ResponseBody = any;
  }

  /**
   * @description This request uploads an audio as .ogg. The parameters are specified as **form-data** in the request **body**.
   * @tags Media
   * @name MediaCreate
   * @summary Upload Audio
   * @request POST:/{Version}/{Phone-Number-ID}/media
   * @secure
   * @response `200` `string` OK
   */
  export namespace MediaCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = MediaCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [QR Codes](https://developers.facebook.com/docs/whatsapp/business-management-api/qr-codes) - Endpoint reference: [WhatsApp Business Phone Number > Message Qrdls](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/message_qrdls/)
   * @tags QR codes
   * @name MessageQrdlsCreate
   * @summary Update Message QR Code.
   * @request POST:/{Version}/{Phone-Number-ID}/message_qrdls
   * @secure
   * @response `200` `string` OK
   */
  export namespace MessageQrdlsCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = MessageQrdlsCreatePayload;
    export type RequestHeaders = {
      /** @example "application/json" */
      "Content-Type"?: string;
    };
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [QR Codes](https://developers.facebook.com/docs/whatsapp/business-management-api/qr-codes) - Endpoint reference: [WhatsApp Business Phone Number > Message Qrdls](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/message_qrdls/)
   * @tags QR codes
   * @name MessageQrdlsList
   * @summary Get QR code PNG image URL
   * @request GET:/{Version}/{Phone-Number-ID}/message_qrdls
   * @secure
   * @response `200` `string` OK
   */
  export namespace MessageQrdlsList {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {
      /** @example "<QR_CODE_ID>" */
      code?: string;
      /** @example "prefilled_message,deep_link_url,qr_image_url.format(PNG)" */
      fields?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [QR Codes](https://developers.facebook.com/docs/whatsapp/business-management-api/qr-codes) - Endpoint reference: [WhatsApp Business Phone Number > Message Qrdls](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/message_qrdls/)
   * @tags QR codes
   * @name MessageQrdlsQrCodeIdDelete
   * @summary Delete QR code
   * @request DELETE:/{Version}/{Phone-Number-ID}/message_qrdls/<QR_CODE_ID>
   * @secure
   * @response `200` `string` OK
   */
  export namespace MessageQrdlsQrCodeIdDelete {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [QR Codes](https://developers.facebook.com/docs/whatsapp/business-management-api/qr-codes) - Endpoint reference: [WhatsApp Business Phone Number > Message Qrdls](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/message_qrdls/)
   * @tags QR codes
   * @name MessageQrdlsQrCodeIdList
   * @summary Get QR code
   * @request GET:/{Version}/{Phone-Number-ID}/message_qrdls/<QR_CODE_ID>
   * @secure
   * @response `200` `string` OK
   */
  export namespace MessageQrdlsQrCodeIdList {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * No description
   * @tags Examples
   * @name MessagesCreate
   * @summary Send Sample Issue Resolution Template
   * @request POST:/{Version}/{Phone-Number-ID}/messages
   * @secure
   * @response `200` `string` OK
   */
  export namespace MessagesCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = MessagesCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description When you receive an incoming message from Webhooks, you could use messages endpoint to change the status of it to read. We recommend marking incoming messages as read within 30 days of receipt. **Note**: you cannot mark outgoing messages you sent as read. You need to obtain the **`message_id`** of the incoming message from Webhooks. For a more in depth guide for marking messages as read, see [Guide: Mark Messages as Read](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/mark-message-as-read).
   * @tags Messages
   * @name MessagesUpdate
   * @summary Mark Message As Read
   * @request PUT:/{Version}/{Phone-Number-ID}/messages
   * @secure
   * @response `200` `string` OK
   */
  export namespace MessagesUpdate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = MessagesUpdatePayload;
    export type RequestHeaders = {
      /** @example "application/json" */
      "Content-Type"?: string;
    };
    export type ResponseBody = string;
  }

  /**
   * @description You can use this endpoint to change two-step verification code associated with your account. After you change the verification code, future requests like changing the name, must use the new code. **You set up two-factor verification and [register a phone number](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/registration#register-phone) in the same API call.** You must use the parameters listed below to change two-step verification
   * @tags Phone Numbers
   * @name PhoneNumberIdCreate
   * @summary Set Two-Step Verification Code
   * @request POST:/{Version}/{Phone-Number-ID}
   * @secure
   * @response `200` `string` OK
   */
  export namespace PhoneNumberIdCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = PhoneNumberIdCreatePayload;
    export type RequestHeaders = {
      /** @example "application/json" */
      "Content-Type"?: string;
    };
    export type ResponseBody = string;
  }

  /**
   * @description Include **`fields=name_status`** as a query string parameter to get the status of a display name associated with a specific phone number. This field is currently in beta and not available to all developers.
   * @tags Phone Numbers
   * @name PhoneNumberIdList
   * @summary Get Display Name Status (Beta)
   * @request GET:/{Version}/{Phone-Number-ID}
   * @secure
   * @response `200` `string` OK
   */
  export namespace PhoneNumberIdList {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {
      /**
       * The status of a display name associated with a specific phone number. The **`name_status`** value can be one of the following:
       *
       * * `APPROVED`: The name has been approved. You can download your certificate now.
       * * `AVAILABLE_WITHOUT_REVIEW`: The certificate for the phone is available and display name is ready to use without review.
       * * `DECLINED`: The name has not been approved. You cannot download your certificate.
       * * `EXPIRED`: Your certificate has expired and can no longer be downloaded.
       * * `PENDING_REVIEW`: Your name request is under review. You cannot download your certificate.
       * NONE: No certificate is available.
       * @example "name_status"
       */
      fields?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description To migrate your account, make a **POST** call to the **`/{{Phone-Number-ID}}/register`** endpoint and include the parameters listed below. Your request may take as long as 15 seconds to finish. During this period, your on-premise deployment is automatically disconnected from WhatsApp server and shutdown; the business account will start up in the cloud-hosted service at the same time. After the request finishes successfully, you can send messages immediately.
   * @tags OnPrem Account Migration
   * @name RegisterCreate
   * @summary Migrate Account
   * @request POST:/{Version}/{Phone-Number-ID}/register
   * @secure
   * @response `200` `string` OK
   */
  export namespace RegisterCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = RegisterCreatePayload;
    export type RequestHeaders = {
      /** @example "application/json" */
      "Content-Type"?: string;
    };
    export type ResponseBody = string;
  }

  /**
   * @description You need to verify the phone number you want to use to send messages to your customers. Phone numbers must be verified through SMS/voice call. The verification process can be done through the Graph API calls specified below. To verify a phone number using Graph API, make a **POST** request to **`{{PHONE_NUMBER_ID}}/request_code`**. In your call, include your chosen verification method and locale. You need to authenticate yourself using **{{User-Access-Token}}** (This is automatically done for you in the **`Request Verification Code`** request). #### Response After a successful call to **`Request Verification Code`**, you will receive your verification code via the method you selected in **`code_method`**. To finish the verification process, you need to use the [**`Verify Code`**](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers#verify) request.
   * @tags Phone Numbers
   * @name RequestCodeCreate
   * @summary Request Verification Code
   * @request POST:/{Version}/{Phone-Number-ID}/request_code
   * @secure
   * @response `200` `string` OK
   */
  export namespace RequestCodeCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = RequestCodeCreatePayload;
    export type RequestHeaders = {
      /** @example "application/json" */
      "Content-Type"?: string;
      /** @example "Bearer {{User-Access-Token}}" */
      Authorization?: string;
    };
    export type ResponseBody = string;
  }

  /**
   * @description After you received a SMS or Voice request code from [**`Request Verification Code`**](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers#verify), you need to verify the code that was sent to you. To verify this code, make a **POST** request to **`{{PHONE_NUMBER_ID}}/verify_code`** that includes the code as a parameter.
   * @tags Phone Numbers
   * @name VerifyCodeCreate
   * @summary Verify Code
   * @request POST:/{Version}/{Phone-Number-ID}/verify_code
   * @secure
   * @response `200` `string` OK
   */
  export namespace VerifyCodeCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = VerifyCodeCreatePayload;
    export type RequestHeaders = {
      /** @example "application/json" */
      "Content-Type"?: string;
      /** @example "Bearer {{User-Access-Token}}" */
      Authorization?: string;
    };
    export type ResponseBody = string;
  }

  /**
   * @description Sets the public key that is used for encrypting the data channel requests
   * @tags Flows > Setup Endpoint Encryption
   * @name WhatsappBusinessEncryptionCreate
   * @summary Set Encryption Public Key
   * @request POST:/{Version}/{Phone-Number-ID}/whatsapp_business_encryption
   * @secure
   * @response `200` `string` OK
   */
  export namespace WhatsappBusinessEncryptionCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = WhatsappBusinessEncryptionCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * No description
   * @tags Flows > Setup Endpoint Encryption
   * @name WhatsappBusinessEncryptionList
   * @summary Get Encryption Public Key
   * @request GET:/{Version}/{Phone-Number-ID}/whatsapp_business_encryption
   * @secure
   * @response `200` `string` OK
   */
  export namespace WhatsappBusinessEncryptionList {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description Update the business profile information such as the business description, email or address. To update your profile, make a **POST** call to **`/{{Phone-Number-ID}}/whatsapp_business_profile`**. In your request, you can include the parameters listed below. It is recommended that you use **Resumable Upload - Create an Upload Session** to obtain an upload ID. Then use this upload ID in a call to **Resumable Upload - Upload File Data** to obtain the picture handle. This handle can be used for the **`profile_picture_handle`**. ## Delete Business Profile To delete your business profile, you must [delete your phone number](https://developers.facebook.com/docs/whatsapp/phone-numbers#delete-phone-number-from-a-business-account).
   * @tags Business Profiles
   * @name WhatsappBusinessProfileCreate
   * @summary Update Business Profile
   * @request POST:/{Version}/{Phone-Number-ID}/whatsapp_business_profile
   * @secure
   * @response `200` `string` OK
   */
  export namespace WhatsappBusinessProfileCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = WhatsappBusinessProfileCreatePayload;
    export type RequestHeaders = {
      /** @example "application/json" */
      "Content-Type"?: string;
    };
    export type ResponseBody = string;
  }

  /**
   * @description To get information about a business profile, make a **GET** call to the **`/{{Phone-Number-ID}}/whatsapp_business_profile`** endpoint. Within the **`whatsapp_business_profile`** request, you can specify what you want to know from the business. <!-- grahamp 10262022: Removed table item:
   * @tags Business Profiles
   * @name WhatsappBusinessProfileList
   * @summary Get Business Profile
   * @request GET:/{Version}/{Phone-Number-ID}/whatsapp_business_profile
   * @secure
   * @response `200` `string` OK
   */
  export namespace WhatsappBusinessProfileList {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [Sell Products & Services](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/sell-products-and-services) (Cloud API) - Guide: [Sell Products & Services](https://developers.facebook.com/docs/whatsapp/on-premises/guides/commerce-guides) (On-Premises API) - Endpoint reference: [WhatsApp Business Phone Number > WhatsApp Commerce Settings](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/whatsapp_commerce_settings)
   * @tags Commerce Settings
   * @name WhatsappCommerceSettingsCreate
   * @summary Set or update commerce settings
   * @request POST:/{Version}/{Phone-Number-ID}/whatsapp_commerce_settings
   * @secure
   * @response `200` `string` OK
   */
  export namespace WhatsappCommerceSettingsCreate {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {
      /** @example "true" */
      is_cart_enabled?: boolean;
      /** @example "true" */
      is_catalog_visible?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [Sell Products & Services](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/sell-products-and-services) (Cloud API) - Guide: [Sell Products & Services](https://developers.facebook.com/docs/whatsapp/on-premises/guides/commerce-guides) (On-Premises API) - Endpoint reference: [WhatsApp Business Phone Number > WhatsApp Commerce Settings](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account-to-number-current-status/whatsapp_commerce_settings)
   * @tags Commerce Settings
   * @name WhatsappCommerceSettingsList
   * @summary Get commerce settings
   * @request GET:/{Version}/{Phone-Number-ID}/whatsapp_commerce_settings
   * @secure
   * @response `200` `string` OK
   */
  export namespace WhatsappCommerceSettingsList {
    export type RequestParams = {
      phoneNumberId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }
}

export namespace DebugToken {
  /**
   * No description
   * @tags Get Started
   * @name DebugTokenList
   * @summary Debug Access Token
   * @request GET:/{Version}/debug_token
   * @secure
   */
  export namespace DebugTokenList {
    export type RequestParams = {
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = any;
  }
}

export namespace BusinessId {
  /**
   * @description Endpoint reference: [Business](https://developers.facebook.com/docs/marketing-api/reference/business/)
   * @tags Business Portfolio
   * @name BusinessIdList
   * @summary Get Business Portfolio (Specific Fields)
   * @request GET:/{Version}/{Business-ID}
   * @secure
   * @response `200` `string` OK
   */
  export namespace BusinessIdList {
    export type RequestParams = {
      businessId: string;
      version: string;
    };
    export type RequestQuery = {
      /** @example "id,name,timezone_id" */
      fields?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * No description
   * @tags WhatsApp Business Accounts (WABAs)
   * @name ClientWhatsappBusinessAccountsList
   * @summary Get shared WABAs
   * @request GET:/{Version}/{Business-ID}/client_whatsapp_business_accounts
   * @secure
   * @response `200` `string` OK
   */
  export namespace ClientWhatsappBusinessAccountsList {
    export type RequestParams = {
      businessId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Endpoint reference: [Business > Extendedcredits](https://developers.facebook.com/docs/marketing-api/reference/extended-credit/)
   * @tags Billing
   * @name ExtendedcreditsList
   * @summary Get credit lines
   * @request GET:/{Version}/{Business-ID}/extendedcredits
   * @secure
   * @response `200` `string` OK
   */
  export namespace ExtendedcreditsList {
    export type RequestParams = {
      businessId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description Endpoint reference: [Business > Extended Credits](https://developers.facebook.com/docs/marketing-api/reference/business/extendedcredits/)
   * @tags WhatsApp Business Accounts (WABAs)
   * @name OwnedWhatsappBusinessAccountsList
   * @summary Get owned WABAs
   * @request GET:/{Version}/{Business-ID}/owned_whatsapp_business_accounts
   * @secure
   * @response `200` `string` OK
   */
  export namespace OwnedWhatsappBusinessAccountsList {
    export type RequestParams = {
      businessId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }
}

export namespace TemplateId {
  /**
   * @description - Guide: [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates) - Guide: [How To Monitor Quality Signals](https://developers.facebook.com/docs/whatsapp/guides/how-to-monitor-quality-signals) - Endpoint reference: [WhatsApp Message Template](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-hsm/)
   * @tags Templates
   * @name TemplateIdCreate
   * @summary Edit template
   * @request POST:/{Version}/<TEMPLATE_ID>
   * @secure
   * @response `200` `string` OK
   */
  export namespace TemplateIdCreate {
    export type RequestParams = {
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = TemplateIdCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description - Guide: [Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates) - Guide: [How To Monitor Quality Signals](https://developers.facebook.com/docs/whatsapp/guides/how-to-monitor-quality-signals) - Endpoint reference: [WhatsApp Message Template](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-hsm/)
   * @tags Templates
   * @name TemplateIdList
   * @summary Get template by ID (default fields)
   * @request GET:/{Version}/<TEMPLATE_ID>
   * @secure
   * @response `200` `string` OK
   */
  export namespace TemplateIdList {
    export type RequestParams = {
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }
}

export namespace FlowId {
  /**
   * @description Used to upload a flow JSON file with the flow content. Refer to flow JSON documentation here [https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson) The file must be attached as from data. The response will include any validation errors in the JSON file
   * @tags Flows > Update Flow
   * @name AssetsCreate
   * @summary Update Flow JSON
   * @request POST:/{Version}/{Flow-ID}/assets
   * @secure
   * @response `200` `string` OK
   */
  export namespace AssetsCreate {
    export type RequestParams = {
      flowId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = AssetsCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description Returns all assets attached to the flow. Currently only FLOW_JSON asset is supported
   * @tags Flows > Update Flow
   * @name AssetsList
   * @summary List Assets (Get Flow JSON URL)
   * @request GET:/{Version}/{Flow-ID}/assets
   * @secure
   * @response `200` `string` OK
   */
  export namespace AssetsList {
    export type RequestParams = {
      flowId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description Updates the status of the flow as "DEPRECATED". This action is not reversible. Only a published flow can be deprecated to prevent sending or opening it.
   * @tags Flows > Update Flow
   * @name DeprecateCreate
   * @summary Deprecate Flow
   * @request POST:/{Version}/{Flow-ID}/deprecate
   * @secure
   * @response `200` `string` OK
   */
  export namespace DeprecateCreate {
    export type RequestParams = {
      flowId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * No description
   * @tags Flows > Update Flow
   * @name FlowIdCreate
   * @summary Update Flow Metadata
   * @request POST:/{Version}/{Flow-ID}
   * @secure
   * @response `200` `string` OK
   */
  export namespace FlowIdCreate {
    export type RequestParams = {
      flowId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = FlowIdCreatePayload;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description Deletes the flow entirely. This action is not reversible. Only a DRAFT flow can be deleted.
   * @tags Flows > Update Flow
   * @name FlowIdDelete
   * @summary Delete Flow
   * @request DELETE:/{Version}/{Flow-ID}
   * @secure
   * @response `200` `string` OK
   */
  export namespace FlowIdDelete {
    export type RequestParams = {
      flowId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description Can request specific fields by enabling the \`fields\` query param
   * @tags Flows > Get Endpoint Metrics
   * @name FlowIdList
   * @summary Get Endpoint Availability Metric
   * @request GET:/{Version}/{Flow-ID}
   * @secure
   * @response `200` `string` OK
   */
  export namespace FlowIdList {
    export type RequestParams = {
      flowId: string;
      version: string;
    };
    export type RequestQuery = {
      /** @example "metric.name(ENDPOINT_AVAILABILITY).granularity(DAY).since(2024-01-28).until(2024-01-30)" */
      fields?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description Updates the status of the flow as "PUBLISHED". This action is not reversible. The flow and its assets become immutable once published. To update the flow, you must create a new flow and specify the previous flow id as the \`clone_flow_id\` parameter
   * @tags Flows > Update Flow
   * @name PublishCreate
   * @summary Publish Flow
   * @request POST:/{Version}/{Flow-ID}/publish
   * @secure
   * @response `200` `string` OK
   */
  export namespace PublishCreate {
    export type RequestParams = {
      flowId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }
}

export namespace MediaId {
  /**
   * @description To delete media, make a **DELETE** call to the ID of the media you want to delete. ## Prerequisites - [User Access Token](https://developers.facebook.com/docs/facebook-login/access-tokens#usertokens) with **`whatsapp_business_messaging`** permission - Media object ID from either uploading media endpoint or media message Webhooks ## Request [Perform requests in Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=DELETE&path=media_id&version=v8.0)
   * @tags Media
   * @name MediaIdDelete
   * @summary Delete Media
   * @request DELETE:/{Version}/{Media-ID}/
   * @secure
   * @response `200` `string` OK
   */
  export namespace MediaIdDelete {
    export type RequestParams = {
      mediaId: string;
      version: string;
    };
    export type RequestQuery = {
      /**
       * Specifies that deletion of the media  only be performed if the media belongs to the provided phone number.
       * @example "<PHONE_NUMBER_ID>"
       */
      phone_number_id?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }

  /**
   * @description To retrieve your media’s URL, make a **GET** call to **`/{{Media-ID}}`**. Use the returned URL to download the media file. Note that clicking this URL (i.e. performing a generic GET) will not return the media; you must include an access token. For more information, see [Download Media](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#download-media). You can also use the optional query **`?phone_number_id`** for **`Retrieve Media URL`** and **`Delete Media`**. This parameter checks to make sure the media belongs to the phone number before retrieval or deletion. #### Response A successful response includes an object with a media URL. The URL is only valid for 5 minutes. To use this URL, see [Download Media](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#download-media).
   * @tags Media
   * @name MediaIdList
   * @summary Retrieve Media URL
   * @request GET:/{Version}/{Media-ID}
   * @secure
   * @response `200` `string` OK
   */
  export namespace MediaIdList {
    export type RequestParams = {
      mediaId: string;
      version: string;
    };
    export type RequestQuery = {
      /**
       * Specifies that this action only be performed if the media belongs to the provided phone number.
       * @example "<PHONE_NUMBER_ID>"
       */
      phone_number_id?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }
}

export namespace MediaUrl {
  /**
   * @description When you retrieve a media URL through the **GET** Media endpoint, you must use a User Access Token to download media content from the URL. If you click the URL from a browser, you will get an access error. <br/> > **Note**: all media URLs will expire after 5 minutes, you need to retrieve the media URL again if it expires. ## Prerequisites - [User Access Token](https://developers.facebook.com/docs/facebook-login/access-tokens#usertokens) with **`whatsapp_business_messaging`** permission - A media URL obtained from retrieving media url endpoint ## Response: If successful,  you receive the binary data of media saved in **`media_file`**, response headers contain a `content-type` header to indicate the mime type of returned data. For more information, see [Supported Media Types](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#supported-media-types). If media fails to download, you receive a **404 Not Found** response code. In that case, we recommend that you try to [Retrieve Media URL](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#retrieve-media-url) and download again. If doing so doesn't resolve the issue, please try to renew the **`USER_ACCESS_TOKEN`** then retry downloading the media.
   * @tags Media
   * @name MediaUrlList
   * @summary Download Media
   * @request GET:/{Version}/{Media-URL}
   * @secure
   * @response `200` `string` OK
   */
  export namespace MediaUrlList {
    export type RequestParams = {
      mediaUrl: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = string;
  }
}

export namespace App {
  /**
   * @description The Resumable Upload series of requests allow you to upload Profile Pictures to Meta so you can receive a handle to update these pictures in the Business Profile API. The Resumable Upload requests consist of the following: * **Resumable Upload - Create an Upload Session** * **Resumable Upload - Upload File Data** * **Resumable Upload - Query File Upload Status** To create a new upload session, make a **POST** call using the `/app/uploads` endpoint. For more information, see [Create an Upload Session](https://developers.facebook.com/docs/graph-api/guides/upload#step-1--create-a-session). **Response** The call returns a server-generated value that includes the session ID that you can use in later calls. >Copy this value and Open the **Environment quick look** in Postman and paste it in the **CURRENT VALUE** for `Upload-ID`.
   * @tags Business Profiles
   * @name UploadsCreate
   * @summary Resumable Upload - Create an Upload Session
   * @request POST:/{Version}/app/uploads/
   * @secure
   * @response `200` `string` OK
   */
  export namespace UploadsCreate {
    export type RequestParams = {
      version: string;
    };
    export type RequestQuery = {
      /**
       * **Required**<br/>Specifies the size of your file in bytes.
       * @example "<YOUR_FILE_LENGTH>"
       */
      file_length?: string;
      /**
       * **Optional**<br/>Specifies the file name you are using to create the session.
       * @example "myprofile.jpg"
       */
      file_name?: string;
      /**
       * **Required**<br/>Specifies the MIME type. Values are <ul><li>`image/jpeg`</li><li>`image/png`</li><li>`video/mp4`</li></ul>
       * @example "image/jpeg"
       */
      file_type?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** @example "OAuth {{User-Access-Token}}" */
      Authorization?: string;
    };
    export type ResponseBody = string;
  }
}

export namespace UploadId {
  /**
   * @description To upload a profile picture to your business profile, make a **POST** call to the named endpoint {{Version}}/{{Upload-ID}}, where **Upload-ID** is the value you received from **Resumable Upload - Create an Upload Session**. This value should look like the following: ``` json "upload:MTphdHRhY2htZW50Ojlk2mJiZxUwLWV6MDUtNDIwMy05yTA3LWQ4ZDPmZGFkNTM0NT8=?sig=ARZqkGCA_uQMxC8nHKI" ``` The **`file_offset`** parameter **must** be included as an HTTP header. It will not work as a query parameter. The access token must be included in an Authorization HTTP header. It cannot work as a query parameter. For more information, see [Initiate Data Upload](https://developers.facebook.com/docs/graph-api/guides/upload#step-2--initiate-upload). **Response** The call returns a handle that includes the session ID that you can use to update your profile picture using **Update Business Profile**.
   * @tags Business Profiles
   * @name UploadIdCreate
   * @summary Resumable Upload - Upload File Data
   * @request POST:/{Version}/{Upload-ID}
   * @secure
   * @response `200` `string` OK
   */
  export namespace UploadIdCreate {
    export type RequestParams = {
      uploadId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = any;
    export type RequestHeaders = {
      /** @example "image/jpeg" */
      "Content-Type"?: string;
      /** @example "OAuth {{User-Access-Token}}" */
      Authorization?: string;
      /**
       * Specifies the offset to start the upload. The offset value should always be `0`.
       * @example "0"
       */
      file_offset?: number;
    };
    export type ResponseBody = string;
  }

  /**
   * @description You can query the status of an upload session by making a **GET** call to an endpoint that is named based on the **`Upload-ID`** that was returned through the **Resumable Upload - Create an Upload Session** request. When uploading data, you **must include the access token as an HTTP header.** **Example** ``` bash GET https://graph.facebook.com/v14.0/upload:MTphdHRhY2htZW50Ojlk2mJiZxUwLWV6MDUtNDIwMy05yTA3LWQ4ZDPmZGFkNTM0NT8=?sig=ARZqkGCA_uQMxC8nHKI HTTP/1.1 Authorization: OAuth {{USER_ACCESS_TOKEN}} ``` For more information, see [Query File Upload Status after an Interruption](https://developers.facebook.com/docs/graph-api/guides/upload#interruptions). **Response** The result will be a JSON-encoded ID and offset that looks like the following: ``` json { "id": "upload:MTphdHRhY2htZW50Ojlk2mJiZxUwLWV6MDUtNDIwMy05yTA3LWQ4ZDPmZGFkNTM0NT8=?sig=ARZqkGCA_uQMxC8nHKI", "file_offset": 0 } ```
   * @tags Business Profiles
   * @name UploadIdList
   * @summary Resumable Upload - Query File Upload Status
   * @request GET:/{Version}/{Upload-ID}
   * @secure
   * @response `200` `string` OK
   */
  export namespace UploadIdList {
    export type RequestParams = {
      uploadId: string;
      version: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** @example "no-cache" */
      "Cache-Control"?: string;
      /** @example "OAuth {{User-Access-Token}}" */
      Authorization?: string;
    };
    export type ResponseBody = string;
  }
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "https://graph.facebook.com";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

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
export class Api<SecurityDataType extends unknown> {
  http: HttpClient<SecurityDataType>;

  constructor(http: HttpClient<SecurityDataType>) {
    this.http = http;
  }

  /**
   * @description The following notification is received when a business sends a message which opens a service [conversation](https://developers.facebook.com/docs/whatsapp/pricing#conversations):
   *
   * @tags Webhook Subscriptions > Webhook Payload Reference
   * @name ViewRoot
   * @summary Status: Transaction Status - Order Details Message
   * @request VIEW:/
   * @secure
   */
  viewRoot = (params: RequestParams = {}) =>
    this.http.request<any, any>({
      path: `/`,
      method: "VIEW",
      secure: true,
      ...params,
    });

  wabaId = {
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
    flowsCreate: (
      version: string,
      wabaId: string,
      data: FlowsCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${wabaId}/flows`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

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
    flowsList: (version: string, wabaId: string, params: RequestParams = {}) =>
      this.http.request<string, any>({
        path: `/${version}/${wabaId}/flows`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    messageTemplatesCreate: (
      version: string,
      wabaId: string,
      data: MessageTemplatesCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${wabaId}/message_templates`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    messageTemplatesDelete: (
      { version, wabaId, ...query }: MessageTemplatesDeleteParams,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${wabaId}/message_templates`,
        method: "DELETE",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

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
    messageTemplatesList: (
      version: string,
      wabaId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${wabaId}/message_templates`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    migrateFlowsCreate: (
      version: string,
      wabaId: string,
      data: MigrateFlowsCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${wabaId}/migrate_flows`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * @description - Guide: [Filter Phone Numbers](https://developers.facebook.com/docs/whatsapp/business-management-api/manage-phone-numbers#filter-phone-numbers) - Endpoint reference: [WhatsApp Business Account > Phone Numbers](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/phone_numbers/)
     *
     * @tags Phone Numbers
     * @name PhoneNumbersList
     * @summary Get Phone Numbers with Filtering (beta)
     * @request GET:/{Version}/{WABA-ID}/phone_numbers
     * @secure
     */
    phoneNumbersList: (
      { version, wabaId, ...query }: PhoneNumbersListParams,
      params: RequestParams = {},
    ) =>
      this.http.request<any, any>({
        path: `/${version}/${wabaId}/phone_numbers`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

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
    subscribedAppsCreate: (
      version: string,
      wabaId: string,
      data: SubscribedAppsCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${wabaId}/subscribed_apps`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    subscribedAppsDelete: (
      version: string,
      wabaId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${wabaId}/subscribed_apps`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

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
    subscribedAppsList: (
      version: string,
      wabaId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${wabaId}/subscribed_apps`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    wabaIdList: (
      { version, wabaId, ...query }: WabaIdListParams,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${wabaId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  phoneNumberId = {
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
    blockUsersCreate: (
      version: string,
      phoneNumberId: string,
      data: BlockUsersCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/block_users`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    blockUsersDelete: (
      version: string,
      phoneNumberId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/block_users`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

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
    blockUsersList: (
      version: string,
      phoneNumberId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/block_users`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    businessComplianceInfoCreate: (
      version: string,
      phoneNumberId: string,
      data: BusinessComplianceInfoCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/business_compliance_info`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Text,
        format: "json",
        ...params,
      }),

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
    businessComplianceInfoList: (
      version: string,
      phoneNumberId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/business_compliance_info`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    deregisterCreate: (
      version: string,
      phoneNumberId: string,
      data: DeregisterCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<any, DeregisterCreateError>({
        path: `/${version}/${phoneNumberId}/deregister`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Text,
        ...params,
      }),

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
    mediaCreate: (
      version: string,
      phoneNumberId: string,
      data: MediaCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/media`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    messageQrdlsCreate: (
      version: string,
      phoneNumberId: string,
      data: MessageQrdlsCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/message_qrdls`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    messageQrdlsList: (
      { version, phoneNumberId, ...query }: MessageQrdlsListParams,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/message_qrdls`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

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
    messageQrdlsQrCodeIdDelete: (
      version: string,
      phoneNumberId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/message_qrdls/<QR_CODE_ID>`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

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
    messageQrdlsQrCodeIdList: (
      version: string,
      phoneNumberId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/message_qrdls/<QR_CODE_ID>`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    messagesCreate: (
      version: string,
      phoneNumberId: string,
      data: MessagesCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/messages`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    messagesUpdate: (
      version: string,
      phoneNumberId: string,
      data: MessagesUpdatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/messages`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    phoneNumberIdCreate: (
      version: string,
      phoneNumberId: string,
      data: PhoneNumberIdCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    phoneNumberIdList: (
      { version, phoneNumberId, ...query }: PhoneNumberIdListParams,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

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
    registerCreate: (
      version: string,
      phoneNumberId: string,
      data: RegisterCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/register`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    requestCodeCreate: (
      version: string,
      phoneNumberId: string,
      data: RequestCodeCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/request_code`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    verifyCodeCreate: (
      version: string,
      phoneNumberId: string,
      data: VerifyCodeCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/verify_code`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    whatsappBusinessEncryptionCreate: (
      version: string,
      phoneNumberId: string,
      data: WhatsappBusinessEncryptionCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/whatsapp_business_encryption`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

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
    whatsappBusinessEncryptionList: (
      version: string,
      phoneNumberId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/whatsapp_business_encryption`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    whatsappBusinessProfileCreate: (
      version: string,
      phoneNumberId: string,
      data: WhatsappBusinessProfileCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/whatsapp_business_profile`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    whatsappBusinessProfileList: (
      version: string,
      phoneNumberId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/whatsapp_business_profile`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    whatsappCommerceSettingsCreate: (
      {
        version,
        phoneNumberId,
        ...query
      }: WhatsappCommerceSettingsCreateParams,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/whatsapp_commerce_settings`,
        method: "POST",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

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
    whatsappCommerceSettingsList: (
      version: string,
      phoneNumberId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${phoneNumberId}/whatsapp_commerce_settings`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  debugToken = {
    /**
     * No description
     *
     * @tags Get Started
     * @name DebugTokenList
     * @summary Debug Access Token
     * @request GET:/{Version}/debug_token
     * @secure
     */
    debugTokenList: (version: string, params: RequestParams = {}) =>
      this.http.request<any, any>({
        path: `/${version}/debug_token`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  businessId = {
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
    businessIdList: (
      { version, businessId, ...query }: BusinessIdListParams,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${businessId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

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
    clientWhatsappBusinessAccountsList: (
      version: string,
      businessId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${businessId}/client_whatsapp_business_accounts`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    extendedcreditsList: (
      version: string,
      businessId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${businessId}/extendedcredits`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    ownedWhatsappBusinessAccountsList: (
      version: string,
      businessId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${businessId}/owned_whatsapp_business_accounts`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  templateId = {
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
    templateIdCreate: (
      version: string,
      data: TemplateIdCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/<TEMPLATE_ID>`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

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
    templateIdList: (version: string, params: RequestParams = {}) =>
      this.http.request<string, any>({
        path: `/${version}/<TEMPLATE_ID>`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  flowId = {
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
    assetsCreate: (
      version: string,
      flowId: string,
      data: AssetsCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${flowId}/assets`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

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
    assetsList: (version: string, flowId: string, params: RequestParams = {}) =>
      this.http.request<string, any>({
        path: `/${version}/${flowId}/assets`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

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
    deprecateCreate: (
      version: string,
      flowId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${flowId}/deprecate`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

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
    flowIdCreate: (
      version: string,
      flowId: string,
      data: FlowIdCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${flowId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

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
    flowIdDelete: (
      version: string,
      flowId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${flowId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

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
    flowIdList: (
      { version, flowId, ...query }: FlowIdListParams,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${flowId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

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
    publishCreate: (
      version: string,
      flowId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${flowId}/publish`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  mediaId = {
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
    mediaIdDelete: (
      { version, mediaId, ...query }: MediaIdDeleteParams,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${mediaId}/`,
        method: "DELETE",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

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
    mediaIdList: (
      { version, mediaId, ...query }: MediaIdListParams,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${mediaId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  mediaUrl = {
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
    mediaUrlList: (
      version: string,
      mediaUrl: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${mediaUrl}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  app = {
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
    uploadsCreate: (
      { version, ...query }: UploadsCreateParams,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/app/uploads/`,
        method: "POST",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  uploadId = {
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
    uploadIdCreate: (
      version: string,
      uploadId: string,
      data: any,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${uploadId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Text,
        format: "json",
        ...params,
      }),

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
    uploadIdList: (
      version: string,
      uploadId: string,
      params: RequestParams = {},
    ) =>
      this.http.request<string, any>({
        path: `/${version}/${uploadId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
