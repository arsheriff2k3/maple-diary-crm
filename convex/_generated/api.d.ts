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
import type * as email from "../email.js";
import type * as lib_auth from "../lib/auth.js";
import type * as sessions from "../sessions.js";
import type * as staff from "../staff.js";
import type * as staffActions from "../staffActions.js";
import type * as staffInternal from "../staffInternal.js";
import type * as studentActions from "../studentActions.js";
import type * as studentAuth from "../studentAuth.js";
import type * as studentAuthInternal from "../studentAuthInternal.js";
import type * as studentInternal from "../studentInternal.js";
import type * as studentPortal from "../studentPortal.js";
import type * as students from "../students.js";
import type * as subjects from "../subjects.js";
import type * as teacherAuth from "../teacherAuth.js";
import type * as teacherAuthInternal from "../teacherAuthInternal.js";
import type * as teacherPortal from "../teacherPortal.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  batchChangeRequests: typeof batchChangeRequests;
  dashboard: typeof dashboard;
  departments: typeof departments;
  email: typeof email;
  "lib/auth": typeof lib_auth;
  sessions: typeof sessions;
  staff: typeof staff;
  staffActions: typeof staffActions;
  staffInternal: typeof staffInternal;
  studentActions: typeof studentActions;
  studentAuth: typeof studentAuth;
  studentAuthInternal: typeof studentAuthInternal;
  studentInternal: typeof studentInternal;
  studentPortal: typeof studentPortal;
  students: typeof students;
  subjects: typeof subjects;
  teacherAuth: typeof teacherAuth;
  teacherAuthInternal: typeof teacherAuthInternal;
  teacherPortal: typeof teacherPortal;
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
