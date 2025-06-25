/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as conversationStates from "../conversationStates.js";
import type * as conversations from "../conversations.js";
import type * as duplicateDetection from "../duplicateDetection.js";
import type * as exchangeRates from "../exchangeRates.js";
import type * as mediaFiles from "../mediaFiles.js";
import type * as messageStatuses from "../messageStatuses.js";
import type * as messages from "../messages.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as webhookLogs from "../webhookLogs.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  conversationStates: typeof conversationStates;
  conversations: typeof conversations;
  duplicateDetection: typeof duplicateDetection;
  exchangeRates: typeof exchangeRates;
  mediaFiles: typeof mediaFiles;
  messageStatuses: typeof messageStatuses;
  messages: typeof messages;
  transactions: typeof transactions;
  users: typeof users;
  webhookLogs: typeof webhookLogs;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
