#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const casesDir  = path.join(__dirname, "..", "..", "cases");
const claudeMd  = path.join(__dirname, "..", "CLAUDE.case-template.md");
const configPath = path.join(__dirname, "..", "config", "agent-config.json");

fs.mkdirSync(casesDir, { recursive: true });

const existing = fs.readdirSync(casesDir).filter((d) => /^case-\d+$/.test(d));
const max = existing.reduce((m, d) => {
  const n = parseInt(d.replace("case-", ""), 10);
  return Math.max(m, n);
}, 0);

const next = String(max + 1).padStart(2, "0");
const caseId = `case-${next}`;
const newCaseDir = path.join(casesDir, caseId);

fs.mkdirSync(newCaseDir, { recursive: true });
fs.copyFileSync(claudeMd, path.join(newCaseDir, "CLAUDE.md"));

fs.writeFileSync(
  path.join(newCaseDir, "decisions.md"),
  `# Decision Log — ${caseId}\n\nThis file is maintained by the design-decision-tracker agent.\nEach entry follows the MDR (Micro Decision Record) format.\n\n<!-- MDRs appended below this line -->\n`,
  "utf8"
);

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
config.current_case = caseId;
config.updated_at = new Date().toISOString();
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

console.log(`Created cases/${caseId}/ — set as current_case in config`);
