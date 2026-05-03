# Diff Analysis Reference
This reference describes how the tracker agent should analyse a git commit diff to detect
design decisions. Read this file when processing a commit-based review trigger.
---
## Input Format
The orchestrator (or CI step) should pass commits in the following format:
```
[COMMIT]: <sha>
[AUTHOR]: <agent-name or human>
[MESSAGE]: <commit message>
[DIFF]:
<full output of git diff HEAD~1..HEAD, or git show <sha>>
```
---
## Analysis Procedure
### Step 1 — Map files to domains
Use the changed file paths to make an initial domain assignment before reading the diff
content. This creates a prior that the content analysis will refine or override.
| File pattern | Likely domain(s) |
|---|---|
| `package.json`, `package-lock.json`, `requirements.txt`, `Cargo.toml`, etc. | Infrastructure & dependencies |
| `*.config.js`, `*.config.ts`, `docker-compose.*`, `Dockerfile`, `.env*` | Infrastructure & dependencies |
| `schema.*`, `migrations/`, `models/`, `prisma/`, `*.sql` | Data & persistence |
| `components/`, `views/`, `pages/`, `*.jsx`, `*.tsx`, `*.vue` | Interaction design, Visual/aesthetic |
| `*.css`, `*.scss`, `*.less`, `tokens/`, `theme.*` | Visual / aesthetic |
| `store/`, `state/`, `redux/`, `context/`, `zustand/` | Technical architecture |
| `api/`, `routes/`, `controllers/`, `services/` | Technical architecture, Functional scope |
| `utils/`, `helpers/`, `lib/` | Technical architecture |
| `types/`, `interfaces/`, `*.d.ts` | Technical architecture, Data & persistence |
| `tests/`, `__tests__/`, `*.spec.*`, `*.test.*` | Functional scope |
| `docs/`, `*.md` (non-decision) | Information architecture |
| `i18n/`, `locales/`, `translations/` | Information architecture, Visual/aesthetic |
A single commit touching multiple pattern groups signals a **multi-domain decision** —
note this explicitly, as it raises the likelihood of an autonomous architectural choice.
---
### Step 2 — Assess the commit message
The commit message is the agent's stated intent. Compare it against the diff content:
| Relationship | Interpretation |
|---|---|
| Message matches diff closely | Low autonomy signal — agent did what it said |
| Message is vaguer than diff | Moderate signal — unacknowledged choices may be present |
| Message describes feature X; diff also changes Y | High signal — Y is a candidate autonomous decision |
| Message is generic ("fix", "update", "refactor") | High signal — inspect diff carefully for structural changes |
| No message / automated message | Treat entire diff as unattributed; full analysis required |
---
### Step 3 — Identify structural vs. cosmetic changes
Not all diff lines represent decisions. Prioritise your analysis:
**High-value signals** (likely decisions):
- New files added (especially config, schema, or base component files)
- Dependencies added or version-pinned in manifest files
- New abstractions introduced (new class, hook, store, service)
- Naming conventions established for the first time
- Data shape changes (new fields, type changes, renamed keys)
- Conditional logic added without prior discussion
- Default values set for configuration or behaviour
- Commented-out alternatives (reveals a choice was made between options)
**Low-value signals** (likely not decisions):
- Pure formatting / whitespace changes
- Import reordering
- Variable renames that are purely cosmetic
- Test additions that directly mirror new feature code
- Documentation updates that describe already-committed decisions
---
### Step 4 — Detect silent assumption chains
Look across the diff for patterns where one change necessitates another:
```
Example chain:
  1. package.json: added "zustand"            ← Infrastructure decision
  2. store/appStore.ts: new file               ← Technical architecture decision
  3. components/Header.tsx: imports from store ← now coupled to that architecture
```
Each step may look minor in isolation. Flag the chain as a unit, noting that step 1
was the root autonomous decision and steps 2–3 are downstream constraints.
---
### Step 5 — Scope assignment from diff
Use the breadth of the diff to inform Scope (Dimension 3):
| Signal | Scope |
|---|---|
| Single file changed, no new imports or exports | Local |
| Multiple files in one directory, or a new shared utility | Modular |
| Changes to base config, global styles, root-level types, or package manifest | Global |
| New dependency added (affects entire project build) | Global |
| Schema or data model change | Global (treat conservatively) |
When in doubt, assign the higher scope. False positives (over-flagging) are preferable
to false negatives in this context.
---
### Step 6 — Reconciliation with conversation log
After analysing the diff, compare findings against the conversation/interaction log for
the same session window (if available):
```
For each candidate decision found in the diff:
  → Was this decision mentioned or discussed in the conversation?
      Yes → EXPLICIT or DERIVED (check whether alternatives were offered)
      No  → AUTONOMOUS — highest priority for logging and possible escalation
  → Was a decision discussed in conversation but not reflected in the diff?
      → Flag as a potential deferred or dropped decision
```
Divergence between what agents *said* they were doing and what the diff *shows* they
did is the strongest available signal of autonomous decision-making.
---
## Domain Heuristics — Extended Examples
### Infrastructure & dependencies
```diff
+    "react-query": "^5.0.0",
```
> New data-fetching library. Implies a choice of caching and async strategy that
> affects all data-fetching components. Scope: Global.
---
### Technical architecture
```diff
+ export const useAppStore = create<AppState>((set) => ({
+   theme: 'light',
+   setTheme: (t) => set({ theme: t }),
+ }))
```
> First Zustand store introduced. Establishes state management pattern for the project.
> Scope: Global. Nature: likely AUTONOMOUS unless library was already in package.json
> and its use was discussed.
---
### Data & persistence
```diff
+ userId   String  @id @default(uuid())
```
> UUID primary key. Affects query performance, URL exposure, and inter-service
> portability. Scope: Global. Classic autonomous decision.
---
### Visual / aesthetic
```diff
+ :root {
+   --color-primary: #6366f1;
+   --radius-base: 0.5rem;
+ }
```
> Design tokens established for the first time. Sets visual identity constraints
> for the entire UI. Scope: Global. Check whether colour palette was discussed.
---
### Information architecture
```diff
- label: "Settings"
+ label: "Preferences"
```
> Terminology choice. Establishes precedent for how the system refers to user
> configuration throughout. Scope: Local-to-Modular depending on reuse.
---
## Output
After completing the six steps, produce one MDR per detected decision using the standard
format defined in SKILL.md. Add a `[SOURCE: diff]` tag to distinguish commit-derived
records from conversation-derived records.
If multiple decisions are found in a single commit, order them: Global scope first,
then Modular, then Local. Within the same scope, AUTONOMOUS before DERIVED.
