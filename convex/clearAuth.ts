import { mutation } from "./_generated/server";

// Temporary mutation to clear all auth data.
// Run with: npx convex run --prod clearAuth:clearAllAuthData
// DELETE THIS FILE after use.
export const clearAllAuthData = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "authAccounts",
      "authSessions",
      "authRefreshTokens",
      "authVerificationCodes",
      "authVerifiers",
      "authRateLimits",
    ] as const;

    const counts: Record<string, number> = {};

    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      counts[table] = docs.length;
    }

    // Also clear users table (admin auth accounts)
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    counts["users"] = users.length;

    return counts;
  },
});
