"use client";

import { useMutation, useAction } from "convex/react";
import { FunctionReference } from "convex/server";
import { toast } from "sonner";
import { useCallback } from "react";

function parseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
      .replace(/^Uncaught Error:\s*/i, "")
      .replace(/^Error:\s*/i, "");
  }
  return "Something went wrong. Please try again.";
}

export function useApiMutation<M extends FunctionReference<"mutation">>(
  mutationRef: M
) {
  const mutation = useMutation(mutationRef);
  return useCallback(
    async (...args: Parameters<typeof mutation>) => {
      try {
        return await mutation(...args);
      } catch (error) {
        toast.error(parseError(error));
        throw error;
      }
    },
    [mutation]
  ) as typeof mutation;
}

export function useApiAction<A extends FunctionReference<"action">>(
  actionRef: A
) {
  const action = useAction(actionRef);
  return useCallback(
    async (...args: Parameters<typeof action>) => {
      try {
        return await action(...args);
      } catch (error) {
        toast.error(parseError(error));
        throw error;
      }
    },
    [action]
  ) as typeof action;
}
