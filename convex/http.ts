import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { resend } from "./email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function readError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to send this just now. Please try again.";
}

const submit = httpAction(async (ctx, request) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Send the form as JSON." }, 400);
  }

  if (typeof payload !== "object" || payload === null) {
    return json({ ok: false, error: "Send the form as JSON." }, 400);
  }

  const body = payload as {
    kind?: unknown;
    name?: unknown;
    email?: unknown;
    city?: unknown;
    message?: unknown;
  };

  if (body.kind !== "join" && body.kind !== "contact") {
    return json({ ok: false, error: "Unknown form." }, 400);
  }
  if (typeof body.name !== "string" || typeof body.email !== "string") {
    return json({ ok: false, error: "Name and email are required." }, 400);
  }

  try {
    const recorded = await ctx.runMutation(internal.submissions.record, {
      kind: body.kind,
      name: body.name,
      email: body.email,
      city: typeof body.city === "string" ? body.city : undefined,
      message: typeof body.message === "string" ? body.message : undefined,
    });

    if (!recorded.duplicate) {
      await ctx.runMutation(internal.email.notify, {
        submissionId: recorded.submissionId,
      });
    }

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: readError(error) }, 400);
  }
});

const options = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
});

const http = httpRouter();

http.route({
  path: "/submit",
  method: "POST",
  handler: submit,
});

http.route({
  path: "/submit",
  method: "OPTIONS",
  handler: options,
});

http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

export default http;
