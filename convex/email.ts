import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { INBOX_EMAIL } from "./lib/fields";

export const resend = new Resend(components.resend, {
  testMode: false,
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const notify = internalMutation({
  args: {
    submissionId: v.id("submissions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.submissionId);
    if (!row) {
      throw new Error("Submission not found");
    }

    const inbox = process.env.INBOX_EMAIL ?? INBOX_EMAIL;
    const from =
      process.env.RESEND_FROM ?? "Chorale Foundation <beth.t@example.com>";
    const title =
      row.kind === "join"
        ? `Join the Movement — ${row.name}`
        : `Contact — ${row.name}`;
    const lines = [
      `Kind: ${row.kind}`,
      `Name: ${row.name}`,
      `Email: ${row.email}`,
      row.city ? `City: ${row.city}` : undefined,
      row.message ? `Message:\n${row.message}` : undefined,
    ].filter((line): line is string => line !== undefined);
    const text = lines.join("\n");
    const html = `
      <p><strong>${row.kind === "join" ? "Join the Movement" : "Contact"}</strong></p>
      <p>Name: ${escapeHtml(row.name)}<br/>
      Email: ${escapeHtml(row.email)}
      ${row.city ? `<br/>City: ${escapeHtml(row.city)}` : ""}</p>
      ${row.message ? `<p>${escapeHtml(row.message).replaceAll("\n", "<br/>")}</p>` : ""}
    `;

    try {
      await resend.sendEmail(ctx, {
        from,
        to: inbox,
        replyTo: [row.email],
        subject: title,
        text,
        html,
      });
      await ctx.db.patch(args.submissionId, {
        emailStatus: "sent",
        emailError: undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send email";
      await ctx.db.patch(args.submissionId, {
        emailStatus: "failed",
        emailError: message,
      });
      throw new Error("Unable to email the foundation. Please try again.");
    }

    return null;
  },
});
