const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
const PORT = 3333;
const CONFIG_PATH = path.join(__dirname, "..", "config", "agent-config.json");

app.use(cors({ origin: /^http:\/\/localhost(:\d+)?$/ }));
app.use(express.json());

// --- helpers ---

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function writeConfig(data) {
  const tmp = CONFIG_PATH + ".tmp." + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, CONFIG_PATH);
}

const VELOCITY_TEXT = {
  1: "Implement only exactly what is requested. Nothing more.",
  2: "Implement with minimal supporting code.",
  3: "Implement with reasonable surrounding structure.",
  4: "Implement with tests and related tooling.",
  5: "Implement the full feature including tests, types, and documentation.",
};

const AUTONOMY_TEXT = {
  1: "Follow instructions exactly. Escalate all ambiguities.",
  2: "Stay close to instructions. Ask before deviating.",
  3: "Use judgment for minor gaps. Note assumptions made.",
  4: "Infer reasonable completions. Communicate important decisions.",
  5: "Act independently. Expand scope when needed. Report afterward.",
};

const CLARIFICATION_TEXT = {
  1: "Never ask questions. Assume and continue.",
  2: "Ask only if the task is fundamentally unclear.",
  3: "Ask when uncertainty affects the approach.",
  4: "Ask proactively about anything that may affect quality.",
  5: "Clarify all ambiguities before starting work.",
};

const REPORTING_TEXT = {
  1: "Silent execution. No summary.",
  2: "One-line status after completing work.",
  3: "Brief summary of what was done.",
  4: "Structured summary: actions, decisions, assumptions.",
  5: "Detailed log: every step, decision rationale, and open questions.",
};

const STRENGTH_TEXT = {
  1: "Observe silently. Log without influencing output.",
  2: "Note issues but do not block.",
  3: "Actively weigh feedback in decisions.",
  4: "Actively challenge decisions that conflict with this perspective.",
  5: "Veto authority. Block until the issue is resolved.",
};

const AGENT_LABELS = {
  consequence: "CONSEQUENCE",
  resources: "RESOURCES",
  craftsmanship: "CRAFTSMANSHIP",
};

const AGENT_DESCRIPTIONS = {
  consequence: "Weigh consequences, bias, and EDI factors in all decisions.",
  resources: "Minimize resource usage and token-expensive patterns.",
  craftsmanship: "Encourage precision, good practices, and code quality.",
};

function buildPrompt(config) {
  const g = config.global;
  const lines = [];

  lines.push(`[VELOCITY] ${VELOCITY_TEXT[g.velocity]}`);
  lines.push(`[AUTONOMY] ${AUTONOMY_TEXT[g.autonomy]}`);
  lines.push(`[CLARIFICATION] ${CLARIFICATION_TEXT[g.clarification]}`);
  lines.push(`[REPORTING] ${REPORTING_TEXT[g.reporting]}`);

  const agents = config.perspective_agents;
  const active = Object.entries(agents)
    .filter(([, a]) => a.active)
    .sort(([, a], [, b]) => a.priority - b.priority);

  if (active.length > 0) {
    lines.push("");
    for (const [id, agent] of active) {
      const label = AGENT_LABELS[id] || id.toUpperCase();
      lines.push(
        `[PERSPECTIVE: ${label} — priority ${agent.priority}, strength ${agent.strength}/5]`
      );
      lines.push(AGENT_DESCRIPTIONS[id] || "");
      lines.push(STRENGTH_TEXT[agent.strength]);
      if (agent.strength >= 4) {
        lines.push(
          "Treat this as a hard constraint. Flag and block issues until resolved."
        );
      } else {
        lines.push("Flag issues but do not block output.");
      }
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

// --- routes ---

app.get("/config", (req, res) => {
  try {
    res.json(readConfig());
  } catch (err) {
    res.status(500).json({ error: "Could not read config", detail: err.message });
  }
});

app.put("/config", (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== "object") {
      return res.status(400).json({ error: "Invalid body" });
    }
    incoming.updated_at = new Date().toISOString();
    writeConfig(incoming);
    res.json(incoming);
  } catch (err) {
    res.status(500).json({ error: "Could not write config", detail: err.message });
  }
});

app.get("/config/prompt", (req, res) => {
  try {
    const config = readConfig();
    res.json({
      system_instructions: buildPrompt(config),
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Could not generate prompt", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Agent Control Server running at http://localhost:${PORT}`);
});
