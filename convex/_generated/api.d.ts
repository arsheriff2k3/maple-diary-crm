/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as batchChangeRequests from "../batchChangeRequests.js";
import type * as dashboard from "../dashboard.js";
import type * as departments from "../departments.js";
import type * as sessions from "../sessions.js";
import type * as staff from "../staff.js";
import type * as students from "../students.js";
import type * as subjects from "../subjects.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  batchChangeRequests: typeof batchChangeRequests;
  dashboard: typeof dashboard;
  departments: typeof departments;
  sessions: typeof sessions;
  staff: typeof staff;
  students: typeof students;
  subjects: typeof subjects;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
