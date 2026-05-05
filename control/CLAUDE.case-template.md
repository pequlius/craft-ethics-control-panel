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

After completing each task, invoke the design-decision-tracker agent to log
any design decisions made during the task. Pass it the files you wrote or
edited. It will append MDR entries to decisions.md in this directory.
Do this before responding to the user.
