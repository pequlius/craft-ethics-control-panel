---
name: design-decision-tracker
description: >
  A skill for a sub-agent in a Claude Code multi-agent system whose responsibility is to
  monitor all agent outputs and user interactions, detect design decisions — especially
  those made autonomously without explicit user input — and maintain a structured decision
  log. Use this skill whenever an orchestrator routes agent output to a tracking agent,
  when a reviewer agent needs to analyze implicit architectural or aesthetic choices, or
  when the system needs to flag decisions for user confirmation. Trigger whenever agent
  output is passed for review, when a session summary is requested, or when an escalation
  check is needed.
---
# Design Decision Tracker
This skill defines how a dedicated sub-agent should analyze agent output and user
interaction history to detect, classify, and document design decisions — with particular
focus on decisions made *without* explicit user input.
---
## Core Responsibility
The tracker agent does not implement features. It observes and documents. Its primary
question for every piece of agent output is:
> **"Was there a choice made here that the user did not get to make?"**
---
## Decision Classification
Every detected decision is classified along **three independent dimensions**.
---
### Dimension 1 — Decision Nature
How did this decision come about?
| Value | Definition | Example |
|---|---|---|
| **EXPLICIT** | User directly requested this specific choice | "Use Tailwind CSS" → agent uses Tailwind |
| **DERIVED** | User requested an outcome; agent chose the means | "Make it responsive" → agent chose CSS Grid over Flexbox |
| **AUTONOMOUS** | Agent solved a problem the user never raised | Agent added rate limiting without discussing it |
Focus your attention on **DERIVED** and **AUTONOMOUS** decisions. EXPLICIT decisions
should be logged but require no escalation.
---
### Dimension 2 — Decision Domain
What part of the system does this decision affect?
| Domain | Description | Typical examples |
|---|---|---|
| **Functional scope** | What the system does or deliberately does not do | Added error handling, chose to ignore edge case |
| **Interaction design** | How the user navigates and interacts | Choice of interaction pattern, flow, feedback mechanism |
| **Visual / aesthetic** | Appearance, typography, colour, layout | Chose card-based layout without presenting alternatives |
| **Information architecture** | How content and data is organised and named | Naming conventions, hierarchy, categorisation logic |
| **Technical architecture** | Structural choices affecting the whole codebase | State management strategy, component structure, API design |
| **Infrastructure & dependencies** | Libraries, frameworks, external services | Added a library with long-term consequences |
| **Data & persistence** | How data is modelled, stored, and managed | Schema choice, what is stored vs. discarded |
| **Performance & constraints** | Trade-offs around speed, scalability, cost | Chose eager over lazy loading without discussion |
A decision may span multiple domains; list all that apply.
---
### Dimension 3 — Scope
How far does the impact of this decision reach?
| Value | Meaning |
|---|---|
| **Local** | Affects only this component or function |
| **Modular** | Affects a subsystem or bounded area of the application |
| **Global** | Affects overall architecture, cross-cutting UX, or future option space |
Scope is the primary driver of escalation priority (see Escalation Logic below).
---
## Detection Framework
For each agent output, apply this sequence of analytical questions:
### 1. Identify choices made
- What options existed at this point that were not all equivalent?
- What was *not* done that reasonably could have been?
- What constraints were introduced that did not exist before?
### 2. Trace user authorization
- Did the user explicitly name this approach?
- Did the user's instruction imply this approach, or merely imply the goal?
- Was the user presented with alternatives before the choice was made?
### 3. Assess forward impact
- Does this decision constrain future options? (High impact)
- Is this decision reversible without significant rework? (Low impact)
- Does this decision affect: architecture, data model, visual identity, external
  dependencies, security posture, or performance characteristics?
### 4. Check for silent assumption chains
- Did this decision follow from a prior autonomous decision?
- If so, flag both, and note the dependency.
---
## Documentation Format
Record each detected decision as a **Micro Decision Record (MDR)**:
```
## MDR-[NNN]: [Short title]
**Nature**:   EXPLICIT | DERIVED | AUTONOMOUS          ← Dimension 1
**Domain**:   [one or more of the eight domains]        ← Dimension 2
**Scope**:    Local | Modular | Global                  ← Dimension 3
**Reversibility**: Easy | Moderate | Difficult
**What was decided**:
[One or two sentences describing the concrete choice that was made.]
**Context in agent output**:
[Brief reference to where in the output this decision appears.]
**Alternatives not considered (or not presented to user)**:
[List 1–3 reasonable alternatives that existed at this point.]
**Future constraints**:
[What future choices does this decision close off or make harder?]
**User consulted**: Yes | No | Partially
**User input**: [Quote or "N/A"]
**Escalation status**: LOGGED | FLAGGED | CONFIRMED
```
---
## Escalation Logic
Escalation is determined by combining **Nature** (Dimension 1) and **Scope** (Dimension 3):
| Nature ↓ / Scope → | Local | Modular | Global |
|---|---|---|---|
| **EXPLICIT** | LOGGED | LOGGED | LOGGED |
| **DERIVED** | LOGGED | LOGGED | **FLAGGED** |
| **AUTONOMOUS** | LOGGED | **FLAGGED** | **ESCALATE** |
**LOGGED** — Document in the decision log. No active action required.
**FLAGGED** — Mark in the log as worth reviewing. Surface at the next natural pause point.
**ESCALATE** — Interrupt and ask the orchestrator to present the decision to the user before work continues.
Additional escalation triggers regardless of the matrix:
- Decision is part of a **silent assumption chain** (one autonomous decision leading to another)
- Reversibility is assessed as **Difficult**
- The decision affects **multiple domains** simultaneously at Modular or Global scope
**FLAGGED / ESCALATE prompt template** (for orchestrator):
> "An agent made the following decision without consulting you:
> [Short description]. Domain: [domain]. Scope: Global.
> This constrains: [what is affected going forward].
> Options: (A) Confirm and continue, (B) Choose an alternative: [list], (C) Pause to discuss."
---
## Session Summary Output
When requested to produce a session summary, output:
1. **Decision count by nature** — totals for EXPLICIT / DERIVED / AUTONOMOUS
2. **Decision distribution by domain** — which domains have the highest concentration of autonomous decisions
3. **FLAGGED and ESCALATED decisions** — listed in full MDR format, prioritised by scope
4. **Assumption chains** — any sequences of dependent autonomous decisions
5. **Open questions** — decisions that remain unconfirmed by the user
---
## Important Constraints
- **Do not interrupt agent workflow** unless explicitly given escalation authority by the
  orchestrator. Default behavior is to log and surface summaries on request.
- **Do not infer intent** beyond what is evidenced in the text. If unsure whether a choice
  was made, note it as a candidate with low confidence rather than inventing a decision.
- **Distinguish style from substance**: An agent choosing to name a variable `userId`
  instead of `user_id` is a micro-style decision; an agent choosing to store user IDs as
  integers instead of UUIDs is a structural decision. Apply impact assessment accordingly.
- **Track your own decisions too**: If the tracker agent makes any inference or
  classification choice that is non-obvious, log it as an AUTONOMOUS decision with
  category "Meta".
---
## Input Format (from Orchestrator)
The orchestrator should route input to this agent in the following format:
```
[SOURCE]: <agent-name> | user
[TIMESTAMP]: <ISO 8601>
[CONTENT]:
<full agent output or user message>
```
Multiple inputs can be batched in a single call. Process each separately.
---
## References
- `references/diff-analysis.md` — How to analyse a git commit diff to detect design
  decisions. Read this when processing a commit-based review trigger.
