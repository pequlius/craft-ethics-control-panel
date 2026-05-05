# Craft Ethics Control Panel

An experimental system for steering AI agent behaviour in real time during programming sessions. Built as part of HCI research into human–AI collaboration.

---

## What it does

The system lets you configure how a Claude Code agent behaves before and during a task — without editing prompts manually. Settings are stored in a JSON config file and compiled into a plain-text prompt file (`agent-prompt.txt`) that the agent reads directly at the start of each task.

You control five global behavioural dimensions and three perspective agents through a browser-based GUI. Changes take effect on the next step — the agent always reads the latest values from disk.

A decision tracker sub-agent automatically logs design decisions made during each case session to a `decisions.md` file in that case folder.

---

## Project structure

```
craft-ethics-control-panel/
├── cases/                               # One folder per session (gitignored)
│   └── case-01/
│       ├── CLAUDE.md                    # Behaviour contract for this case
│       ├── decisions.md                 # Auto-generated decision log (MDR format)
│       └── .claude/
│           └── settings.local.json      # Hooks: kontrollpanel loader
│
├── control/                             # The control system
│   ├── CLAUDE.case-template.md          # Template copied into new cases
│   ├── config/
│   │   ├── agent-config.json            # Live config (gitignored)
│   │   ├── agent-config.default.json    # Default values
│   │   └── agent-prompt.txt             # Compiled instructions (gitignored, read by agent)
│   ├── gui/                             # React + Vite frontend
│   │   └── src/App.jsx
│   ├── server/
│   │   └── server.js                    # Express API (port 3333)
│   └── scripts/
│       ├── new-case.js                  # Creates a new numbered case folder
│       └── reset.js                     # Resets config to defaults
│
├── .claude/
│   └── agents/
│       └── design-decision-tracker.md  # Decision tracker sub-agent definition
│
├── start.bat                            # Starts server + GUI (Windows)
└── new-case.bat                         # Creates a new case folder (Windows)
```

---

## Getting started

### 1. Install dependencies

Run this once after cloning:

```bash
cd control && npm install
cd server && npm install
cd ../gui && npm install
```

Or just double-click **`start.bat`** — it installs nothing automatically, so run the above first.

### 2. Start the system

Double-click **`start.bat`** in the root folder, or from the `control/` directory:

```bash
npm start
```

This starts both services in parallel:

| Service | URL |
|---------|-----|
| API server | `http://localhost:3333` |
| Control panel GUI | `http://localhost:5173` |

Open **http://localhost:5173** in your browser.

> **Note:** If the project is stored inside an OneDrive-synced folder, you may get `EPERM` errors from npm. Move the project to a local path (e.g. `C:\dev\`) to avoid this.

---

## The control panel

The GUI lets you configure agent behaviour without touching any files. Changes are saved automatically (500 ms debounce) and compiled to `control/config/agent-prompt.txt` on every save. A dot in the bottom bar shows sync state: green = saved, yellow = saving, red = server unreachable.

### Parameters

Five sliders, each on a scale of 1–5:

| Parameter | Low (1) | High (5) | What it controls |
|-----------|---------|----------|-----------------|
| **Fidelity** | Sketch | Complete | How finished the output is per prompt. Low = wireframe outlines and stubs only. High = production-ready in one pass. |
| **Autonomy** | Strict | Free | How much the agent infers versus asks. Low = stops at every unspecified detail. High = acts fully independently. |
| **Clarification** | Assumes | Asks | Whether the agent clarifies before starting. Low = picks an interpretation and proceeds. High = mandatory restatement and approval before writing anything. |
| **Explanations** | Silent | Detailed | How much the agent documents its work. Low = output only. High = thorough log of every step and decision. |
| **Ethical Awareness** | Provocative | Aware | How much ethical and social considerations shape the output. Low = design provocation mode. High = full ethical scrutiny. |

### Perspective agents

Three optional sub-agents that run alongside the main agent:

| Agent | Role |
|-------|------|
| **Consequence** | Weighs consequences, bias, and EDI factors |
| **Resources** | Flags token-expensive or resource-heavy patterns |
| **Craftsmanship** | Promotes precision, good practices, and code quality |

Each can be toggled on/off and given a strength (1–5). Strength ≥ 4 = hard constraint; lower = advisory flag only.

---

## How the agent reads the config

Each case folder contains a `CLAUDE.md` file. When Claude Code opens a project inside a case folder it reads this file automatically.

`CLAUDE.md` instructs the agent to read the compiled prompt file:

```
../../control/config/agent-prompt.txt
```

This file is written to disk by the server on every config save and on startup — no network call needed. It works on any machine, including those where newer Claude versions restrict HTTP access.

If the file is unreachable the agent falls back to built-in defaults and states this at the start of the response.

---

## Decision tracking

Each case session has a `decisions.md` file that records design decisions in MDR (Micro Decision Record) format. The `design-decision-tracker` sub-agent populates this file automatically after each completed task.

The tracker is invoked by the case agent (per the instruction in `CLAUDE.md`) — no manual triggering needed. Each MDR captures:

- What was decided and why
- Alternatives not considered
- Whether the user was consulted
- Escalation status (`LOGGED` or `FLAGGED`)

---

## Managing cases

### Create a new case

Double-click **`new-case.bat`**, or from `control/`:

```bash
npm run new-case
```

Creates the next numbered folder under `cases/` (e.g. `cases/case-04/`), copies the behaviour contract template into it as `CLAUDE.md`, creates an empty `decisions.md`, and generates a `.claude/settings.local.json` with the kontrollpanel hook. Sets `current_case` in the config.

### Reset config to defaults

```bash
cd control && npm run reset
```

Copies `agent-config.default.json` over `agent-config.json` and regenerates `agent-prompt.txt`.

---

## API reference

The server exposes endpoints on `http://localhost:3333` used by the GUI:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/config` | Returns the full config JSON |
| `PUT` | `/config` | Saves a new config and regenerates `agent-prompt.txt` |
| `GET` | `/config/prompt` | Returns compiled system instructions as plain text |
| `GET` | `/decisions` | Returns parsed MDR entries from the current case |
| `POST` | `/trigger` | Writes a perspective-agent trigger file |
| `GET` | `/result` | Returns the latest perspective-agent analysis result |

---

## Typical workshop workflow

1. Double-click `start.bat` to launch the server and GUI.
2. Open the control panel at **http://localhost:5173** and set parameters for the session.
3. Double-click `new-case.bat` to create a fresh case folder.
4. Open the new case folder in Claude Code.
5. Adjust parameters in the control panel as the session progresses — changes are picked up at the start of each new prompt.
6. Review `decisions.md` in the case folder to see what decisions the agent made autonomously.
7. Run `npm run reset` in `control/` between sessions to restore defaults.
