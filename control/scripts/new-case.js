#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const casesDir = path.join(__dirname, "..", "..", "cases");
const claudeMd = path.join(__dirname, "..", "CLAUDE.case-template.md");
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

fs.mkdirSync(path.join(newCaseDir, ".claude"), { recursive: true });
fs.copyFileSync(claudeMd, path.join(newCaseDir, "CLAUDE.md"));

const caseSettings = {
  permissions: { allow: ["Skill(update-config)", "Skill(update-config:*)"] },
  hooks: {
    UserPromptSubmit: [{
      hooks: [{
        type: "command",
        command: "node -e \"const fs=require('fs'),cp=require('child_process'),p='../../control/config/agent-prompt.txt';if(!fs.existsSync(p)){cp.execSync('node ../../control/scripts/build-prompt.js',{stdio:'ignore'})}const c=fs.readFileSync(p,'utf8');console.log(JSON.stringify({hookSpecificOutput:{hookEventName:'UserPromptSubmit',additionalContext:'[KONTROLLPANEL]\\n'+c}}))\"",
        timeout: 5,
        statusMessage: "Laddar kontrollpanel..."
      }]
    }],
    PostToolUse: [{
      matcher: "Write|Edit",
      hooks: [{
        type: "agent",
        async: true,
        prompt: "Tool input JSON: $ARGUMENTS\n\n1. Extract tool_input.file_path from the JSON above.\n2. If file_path ends with 'decisions.md' — stop, do nothing.\n3. CASE_DIR = the directory portion of file_path.\n4. PROJECT_ROOT = parent of CASE_DIR's parent directory (two levels up from CASE_DIR).\n5. Read the skill instructions at: PROJECT_ROOT/.claude/skills/design-decision-tracker/SKILL.md\n6. Use the MDR framework from that file to classify the edit.\n7. If a meaningful design decision was made: append one MDR to CASE_DIR/decisions.md (never overwrite).\n8. If trivial (typo, whitespace, content only): do nothing.",
        timeout: 60,
        statusMessage: "Spårar designbeslut..."
      }]
    }]
  }
};
fs.writeFileSync(
  path.join(newCaseDir, ".claude", "settings.local.json"),
  JSON.stringify(caseSettings, null, 2),
  "utf8"
);

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
