import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import {
  normalizeCity,
  normalizeEmail,
  normalizeMessage,
  normalizeName,
} from "./lib/fields";

const REPEAT_WINDOW_MS = 90_000;

export const record = internalMutation({
  args: {
    kind: v.union(v.literal("join"), v.literal("contact")),
    name: v.string(),
    email: v.string(),
    city: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  returns: v.object({
    submissionId: v.id("submissions"),
    duplicate: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const name = normalizeName(args.name);
    const email = normalizeEmail(args.email);
    const city = normalizeCity(args.city);
    const message =
      args.kind === "contact"
        ? normalizeMessage(args.message ?? "")
        : undefined;
    const createdAt = Date.now();

    const recent = await ctx.db
      .query("submissions")
      .withIndex("by_email_and_kind", (q) =>
        q.eq("email", email).eq("kind", args.kind),
      )
      .order("desc")
      .take(1);
    const last = recent[0];
    if (last && createdAt - last.createdAt < REPEAT_WINDOW_MS) {
      if (last.emailStatus === "failed") {
        return { submissionId: last._id, duplicate: false };
      }
      return { submissionId: last._id, duplicate: true };
    }

    const submissionId = await ctx.db.insert("submissions", {
      kind: args.kind,
      name,
      email,
      city,
      message,
      createdAt,
      emailStatus: "pending",
    });

    return { submissionId, duplicate: false };
  },
});
