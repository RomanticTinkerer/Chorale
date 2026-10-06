import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  submissions: defineTable({
    kind: v.union(v.literal("join"), v.literal("contact")),
    name: v.string(),
    email: v.string(),
    city: v.optional(v.string()),
    message: v.optional(v.string()),
    createdAt: v.number(),
    emailStatus: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
    ),
    emailError: v.optional(v.string()),
  })
    .index("by_email_and_kind", ["email", "kind"])
    .index("by_kind_and_created", ["kind", "createdAt"])
    .index("by_created", ["createdAt"]),
});
