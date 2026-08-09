/**
 * Cloudflare deploy with fallback when the Services API returns 520.
 *
 * Primary: wrangler.jsonc (with WORKER_SELF_REFERENCE)
 * Fallback: wrangler.emergency.jsonc (no self service binding)
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, label) {
  console.log(`\n▶ ${label}\n   ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  return result.status ?? 1;
}

const buildCode = run(
  "npx",
  ["opennextjs-cloudflare", "build"],
  "OpenNext Cloudflare build",
);
if (buildCode !== 0) {
  console.error("✗ OpenNext build failed");
  process.exit(buildCode);
}

if (!existsSync(path.join(projectRoot, ".open-next", "worker.js"))) {
  console.error("✗ Missing .open-next/worker.js after build");
  process.exit(1);
}

const primary = run(
  "npx",
  [
    "wrangler",
    "deploy",
    "--config",
    "wrangler.jsonc",
    // Keep dashboard Secrets/Variables that are not declared in wrangler.jsonc
    // (Stripe price IDs, NEXT_PUBLIC_*, etc.). Without this, wrangler deletes them.
    "--keep-vars",
  ],
  "Deploy (wrangler.jsonc + WORKER_SELF_REFERENCE + --keep-vars)",
);

if (primary === 0) {
  console.log("\n✓ Deployed with WORKER_SELF_REFERENCE\n");
  process.exit(0);
}

console.error(`
✗ Primary deploy failed (exit ${primary}).
  Common cause: Cloudflare API 520 on GET .../workers/services/easywedd-raianvisual
  Retrying emergency deploy WITHOUT WORKER_SELF_REFERENCE…
`);

const emergency = run(
  "npx",
  [
    "wrangler",
    "deploy",
    "--config",
    "wrangler.emergency.jsonc",
    "--keep-vars",
  ],
  "Emergency deploy (wrangler.emergency.jsonc + --keep-vars)",
);

if (emergency === 0) {
  console.log(`
✓ Emergency deploy succeeded (easywedd-raianvisual).
  Re-run later with a healthy Cloudflare API to restore WORKER_SELF_REFERENCE:
    npx wrangler deploy --config wrangler.jsonc
`);
  process.exit(0);
}

console.error(`
✗ Both deploys failed.
  1) Run interactively: npx wrangler login
  2) Confirm Worker name is easywedd-raianvisual in Dashboard
  3) Check https://www.cloudflarestatus.com
  4) Retry: npm run cf:deploy
`);
process.exit(emergency);
