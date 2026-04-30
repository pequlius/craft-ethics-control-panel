#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const casesDir = path.join(__dirname, "..", "..", "cases");
const claudeMd = path.join(__dirname, "..", "CLAUDE.case-template.md");

fs.mkdirSync(casesDir, { recursive: true });

const existing = fs.readdirSync(casesDir).filter((d) => /^case-\d+$/.test(d));
const max = existing.reduce((m, d) => {
  const n = parseInt(d.replace("case-", ""), 10);
  return Math.max(m, n);
}, 0);

const next = String(max + 1).padStart(2, "0");
const newCaseDir = path.join(casesDir, `case-${next}`);

fs.mkdirSync(newCaseDir, { recursive: true });
fs.copyFileSync(claudeMd, path.join(newCaseDir, "CLAUDE.md"));

console.log(`Created cases/case-${next}/`);
