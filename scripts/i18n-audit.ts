/**
 * Heuristic scan for leftover user-facing hardcoded strings in the app.
 * Usage: npx tsx scripts/i18n-audit.ts
 * Output: docs/I18N_DASHBOARD_AUDIT.md
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib"];
const EXCLUDE = [
  "node_modules",
  ".next",
  "components/marketing",
  "app/(marketing)",
  "lib/i18n/dictionaries",
];

const RO_HINT =
  /[ăâîșțĂÂÎȘȚ]|(?:\b(Salvează|Șterge|Adaugă|Invitați|Buget|Nunta|Setări|Anulează|Confirmă|Completează|Autentificare)\b)/;

type Finding = {
  file: string;
  line: number;
  string: string;
  classification: string;
  action: string;
};

function shouldSkip(filePath: string) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  return EXCLUDE.some((ex) => rel.includes(ex));
}

function walk(dir: string, out: string[] = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function classify(text: string, file: string): { classification: string; action: string } {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (/^(Planner|Seating|Timeline|Website|Privacy|Analytics|Dashboard|Admin|RSVP)$/i.test(text)) {
    return { classification: "intentionally-English", action: "keep" };
  }
  if (
    rel.startsWith("lib/actions/") ||
    rel.startsWith("lib/email") ||
    rel.startsWith("lib/services") ||
    rel.startsWith("lib/billing/") ||
    rel.startsWith("lib/entitlements/") ||
    rel.startsWith("lib/invitations/") ||
    rel.startsWith("lib/planner/")
  ) {
    return {
      classification: "action-fallback",
      action: "prefer-errorCode-when-touched",
    };
  }
  if (/errorCode|feature_key|stripe|supabase|rpc/i.test(rel)) {
    return { classification: "technical", action: "review" };
  }
  if (RO_HINT.test(text) && text.length > 2 && text.length < 120) {
    return { classification: "remaining", action: "move-to-dictionary" };
  }
  return { classification: "technical", action: "ignore-or-review" };
}

function extractStrings(content: string, file: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split(/\r?\n/);
  const patterns = [
    />([^<>{}\n]{3,80})</g,
    /(?:placeholder|title|aria-label|description|label)=["'`]([^"'`]{3,100})["'`]/g,
    /(?:error|success):\s*["'`]([^"'`]{5,120})["'`]/g,
  ];

  lines.forEach((line, idx) => {
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
    if (!RO_HINT.test(line) && !/(placeholder|aria-label|error:|success:)=/.test(line)) {
      return;
    }
    for (const re of patterns) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line))) {
        const text = m[1].trim();
        if (!text || text.startsWith("{") || text.includes("className")) continue;
        if (!RO_HINT.test(text) && !/error:|success:/.test(line)) continue;
        const { classification, action } = classify(text, file);
        findings.push({
          file: path.relative(ROOT, file).replace(/\\/g, "/"),
          line: idx + 1,
          string: text.slice(0, 100),
          classification,
          action,
        });
      }
    }
  });
  return findings;
}

function main() {
  const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d))).filter(
    (f) => !shouldSkip(f),
  );
  const findings = files.flatMap((f) =>
    extractStrings(fs.readFileSync(f, "utf8"), f),
  );

  const remaining = findings.filter((f) => f.classification === "remaining");
  const lines = [
    "# I18N Dashboard Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Files scanned: ${files.length}`,
    `Findings: ${findings.length}`,
    `Remaining (RO heuristics): ${remaining.length}`,
    "",
    "| Route/File | Line | String | Classification | Action |",
    "|---|---:|---|---|---|",
    ...remaining.slice(0, 500).map(
      (f) =>
        `| \`${f.file}\` | ${f.line} | ${f.string.replace(/\|/g, "\\|")} | ${f.classification} | ${f.action} |`,
    ),
    "",
    "## Notes",
    "",
    "- Heuristic only (not full AST).",
    "- `intentionally-English`, `technical`, and user-generated content are out of migration scope.",
    "- `action-fallback`: leftover RO strings in `lib/actions` returned as compat `error`/`success` alongside `errorCode` where migrated; UI should prefer `translateErrorCode` / `translateValidationMessage`.",
    "- Success criterion: `app/` + `components/` UI chrome has **0** `remaining` findings.",
    "- Re-run after each i18n phase.",
    "",
    "## Summary",
    "",
    `- UI remaining (app/components): ${remaining.filter((f) => !f.file.startsWith("lib/")).length}`,
    `- Action/service fallbacks: ${findings.filter((f) => f.classification === "action-fallback").length}`,
    "",
  ];

  const outPath = path.join(ROOT, "docs", "I18N_DASHBOARD_AUDIT.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${outPath} (${remaining.length} remaining)`);
}

main();
