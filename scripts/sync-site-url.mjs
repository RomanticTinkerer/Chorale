import { readFileSync, writeFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const match = env.match(/^CONVEX_SITE_URL=(.+)$/m);
if (!match) {
  throw new Error("CONVEX_SITE_URL is missing from .env.local. Run `npx convex dev` first.");
}

const url = match[1].trim().replace(/^["']|["']$/g, "");
writeFileSync(
  "js/env.js",
  `window.CHORALE_CONVEX_SITE = ${JSON.stringify(url)};\n`,
);
console.log(`Wrote js/env.js → ${url}`);
