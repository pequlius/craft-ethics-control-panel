# Agent Behavior Contract

This project is connected to an Agent Control System.
Before starting each new task, read the current configuration:

    ../../control/config/agent-prompt.txt

Apply the instructions in that file exactly. If the file is missing,
proceed with the following defaults:
- Implement only what is explicitly requested
- Ask before deviating from instructions
- Provide a brief summary after completing work

## Perspective agents

Active perspective agents are included in agent-prompt.txt.
Apply their constraints in priority order. An agent with strength >= 4
should be treated as a hard constraint, not a suggestion.

## Checking in

If a task takes more than 10 minutes of execution, re-read agent-prompt.txt
before continuing to the next subtask. Settings may have changed.

## Decision tracking

Decision tracking is handled automatically by a PostToolUse hook in
`.claude/settings.local.json`. The hook triggers the design-decision-tracker
agent after every Write or Edit operation — no manual invocation needed.

If settings.local.json is missing from this case folder, the hook will not
run. In that case, invoke the design-decision-tracker agent manually after
each task, passing the files you wrote or edited.
