# Craft Ethics Control Panel

An experimental system for steering AI agent behaviour in real time during programming sessions. Built as part of HCI research into human–AI collaboration.

---

## What it does

The system lets you configure how a Claude agent behaves before and during a task — without editing prompts manually. Settings are stored in a JSON config file that a local API server exposes. The agent reads those settings at the start of each task and applies them.

You control four global behavioural dimensions and up to three perspective agents, all through a browser-based GUI. Changes take effect immediately; the agent picks them up the next time it reads `/config/prompt`.

---

## Project structure

```
craft-ethics-control-panel/
├── cases/                        # One folder per study session / task
│   └── case-01/
│       └── CLAUDE.md             # Agent behaviour contract for this case
│
└── control/                      # The control system
    ├── CLAUDE.md                 # Master agent behaviour contract
    ├── config/
    │   ├── agent-config.json          # Live config (read by the server)
    │   └── agent-config.default.json  # Default values (used by reset script)
    ├── gui/                      # React + Vite frontend
    │   └── src/App.jsx
    ├── server/
    │   └── server.js             # Express API server (port 3333)
    └── scripts/
        ├── new-case.js           # Creates a new numbered case folder
        └── reset.js              # Resets config to defaults
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

From the `control/` directory, run:

```bash
npm start
```

This starts both services in parallel using `concurrently`:

| Service | URL |
|---------|-----|
| API server | http://localhost:3333 |
| Control panel GUI | http://localhost:5173 |

Open **http://localhost:5173** in your browser to access the control panel.

---

## The control panel

The GUI lets you configure agent behaviour without touching any files. Changes are saved automatically (debounced, 500 ms after the last interaction).

### Global parameters

Four sliders that apply to all tasks:

| Parameter | Low (1) | High (5) | Description |
|-----------|---------|----------|-------------|
| **Velocity** | Minimalt | Fullt | How much the agent implements beyond what is explicitly asked |
| **Autonomy** | Strikt | Fritt | How freely the agent deviates from instructions |
| **Clarification** | Antar | Frågar | How often the agent asks clarifying questions |
| **Reporting** | Tyst | Utförlig | How much the agent explains what it did |

### Perspective agents

Three optional agents that add a specific lens to the agent's reasoning. Each can be toggled on/off and given a strength level (1–5):

| Agent | Focus |
|-------|-------|
| **Konsekvens** | Consequences, bias, and EDI factors |
| **Resurser** | Resource usage and token efficiency |
| **Noggrannhet** | Code quality, precision, and good practices |

A strength of **4 or 5** makes the perspective a hard constraint — the agent will flag and block issues rather than just noting them.

### Status indicator

A dot in the bottom bar shows the sync state:

- 🟢 **Synkroniserad** — config saved to disk
- 🟡 **Sparar...** — save in progress
- 🔴 **Offline** — server not reachable, changes are not saved

---

## How the agent reads the config

Every case folder contains a `CLAUDE.md` file. When Claude opens a project inside a case folder, it reads this file automatically (it is a standard Claude Code behaviour contract).

`CLAUDE.md` tells the agent to fetch its instructions from:

```
http://localhost:3333/config/prompt
```

The server returns a plain-text system instruction block derived from the current config, for example:

```
[VELOCITY] Implement with reasonable surrounding structure.
[AUTONOMY] Stay close to instructions. Ask before deviating.
[CLARIFICATION] Ask only if the task is fundamentally unclear.
[REPORTING] One-line status after completing work.

[PERSPECTIVE: CONSEQUENCE — priority 1, strength 3/5]
Weigh consequences, bias, and EDI factors in all decisions.
Actively weigh feedback in decisions.
Flag issues but do not block output.
```

If the server is unreachable the agent falls back to the defaults described in `CLAUDE.md`.

---

## Managing cases

### Create a new case

From the `control/` directory:

```bash
npm run new-case
```

This creates the next numbered folder under `cases/` (e.g. `cases/case-02/`) and copies `CLAUDE.md` into it. Open the new case folder in Claude Code to start a session with the behaviour contract active.

### Reset config to defaults

```bash
npm run reset
```

Copies `control/config/agent-config.default.json` over `control/config/agent-config.json`. Useful at the start of a new case or when you want a clean baseline.

---

## API reference

The server exposes three endpoints on `http://localhost:3333`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/config` | Returns the full config JSON |
| `PUT` | `/config` | Saves a new config (body: full config object) |
| `GET` | `/config/prompt` | Returns the compiled system instruction string |

---

## Typical workflow

1. Run `npm run reset` in `control/` to start from a clean config.
2. Run `npm run new-case` to create a fresh case folder.
3. Run `npm start` to launch the server and GUI.
4. Open the new case folder in Claude Code.
5. Adjust behaviour in the control panel at http://localhost:5173 as the session progresses.
6. The agent re-reads `/config/prompt` at the start of each new task (and after 10 minutes of continuous work).
