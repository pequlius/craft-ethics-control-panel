# Craft Ethics Control Panel

An experimental system for steering AI agent behaviour in real time during programming sessions. Built as part of HCI research into human–AI collaboration.

---

## What it does

The system lets you configure how a Claude Code agent behaves before and during a task — without editing prompts manually. Settings are stored in a JSON config file that the agent reads directly at the start of each task and applies immediately.

You control five global behavioural dimensions through a browser-based GUI. Changes take effect on the next step — the agent always reads the latest values and never caches previous settings.

---

## Project structure

```
craft-ethics-control-panel/
├── cases/                               # One folder per session (gitignored)
│   └── case-01/
│       └── CLAUDE.md                    # Compact behaviour contract for this case
│
├── control/                             # The control system
│   ├── CLAUDE.md                        # Full reference behaviour contract
│   ├── CLAUDE.case-template.md          # Compact template copied into new cases
│   ├── config/
│   │   ├── agent-config.json            # Live config (gitignored, read by agent)
│   │   └── agent-config.default.json    # Default values (used by reset script)
│   ├── gui/                             # React + Vite frontend
│   │   └── src/App.jsx
│   ├── server/
│   │   └── server.js                    # Express API server (port 3333)
│   └── scripts/
│       ├── new-case.js                  # Creates a new numbered case folder
│       └── reset.js                     # Resets config to defaults
│
├── start.bat                            # Starts server + GUI (Windows)
└── new-case.bat                         # Creates a new case folder (Windows)
```

---

## Getting started

### 1. Install dependencies

```bash
cd control
npm install

cd gui
npm install
```

### 2. Start the system

Double-click **`start.bat`** in the root folder, or from the `control/` directory:

```bash
npm start
```

This starts both services in parallel:

| Service | URL |
|---------|-----|
| API server | http://localhost:3333 |
| Control panel GUI | http://localhost:5173 |

Open **http://localhost:5173** in your browser.

---

## The control panel

The GUI lets you configure agent behaviour without touching any files. Changes are saved automatically (500 ms debounce). A dot in the bottom bar shows sync state: green = saved, yellow = saving, red = server unreachable.

### Parameters

Five sliders, each on a scale of 1–5:

| Parameter | Low (1) | High (5) | What it controls |
|-----------|---------|----------|-----------------|
| **Fidelity** | Sketch | Complete | How finished the output is per prompt. Low = wireframe outlines and stubs only, built up incrementally. High = production-ready in one pass. |
| **Autonomy** | Strict | Free | How much the agent infers versus asks. Low = stops and asks for every unspecified detail. High = acts fully independently and reports afterward. |
| **Clarification** | Assumes | Asks | Whether the agent clarifies before starting. Low = picks an interpretation and proceeds immediately. High = mandatory restatement and approval before any code is written. |
| **Explanations** | Silent | Detailed | How much the agent documents its work. Low = output only, no commentary. High = thorough log of every step, decision, and alternative considered. |
| **Ethical Awareness** | Provocative | Aware | How much ethical and social considerations shape the output. Low = design provocation mode, actively challenges norms. High = full ethical scrutiny, flags and blocks suggestions with significant risk. |

---

## How the agent reads the config

Each case folder contains a `CLAUDE.md` file. When Claude Code opens a project inside a case folder it reads this file automatically.

`CLAUDE.md` instructs the agent to read the config file directly:

```
../../control/config/agent-config.json
```

The agent reads the five parameters in the `global` block and applies them according to the behaviour descriptions in `CLAUDE.md`. No server call is needed — the config is a plain JSON file on disk.

If the config file is unreachable the agent falls back to:
`fidelity 2 · autonomy 2 · clarification 2 · explanations 2 · ethics 3`
and states this at the start of the response.

---

## Managing cases

### Create a new case

Double-click **`new-case.bat`** in the root folder, or from the `control/` directory:

```bash
npm run new-case
```

This creates the next numbered folder under `cases/` (e.g. `cases/case-08/`) and copies the compact `CLAUDE.case-template.md` into it as `CLAUDE.md`. Open the new case folder in Claude Code to start a session with the behaviour contract active.

### Reset config to defaults

```bash
cd control
npm run reset
```

Copies `agent-config.default.json` over `agent-config.json`. Useful at the start of a new session or when you want a clean baseline.

---

## API reference

The server exposes endpoints on `http://localhost:3333` used by the GUI:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/config` | Returns the full config JSON |
| `PUT` | `/config` | Saves a new config (body: full config object) |
| `GET` | `/config/prompt` | Returns compiled system instructions as plain text |

---

## Typical workshop workflow

1. Double-click `start.bat` to launch the server and GUI.
2. Open the control panel at **http://localhost:5173** and set parameters for the session.
3. Double-click `new-case.bat` to create a fresh case folder.
4. Open the new case folder in Claude Code.
5. Adjust parameters in the control panel as the session progresses — the agent picks up the latest values at the start of each new step.
6. Run `npm run reset` in `control/` between sessions to restore defaults.
