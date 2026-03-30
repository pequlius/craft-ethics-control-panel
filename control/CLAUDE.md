# Agent Behavior Contract

This project is connected to an Agent Control System.
Before starting each new task, read the current configuration:

    http://localhost:3333/config/prompt

Apply the returned instructions exactly. If the server is unreachable,
proceed with the following defaults:
- Implement only what is explicitly requested
- Ask before deviating from instructions
- Provide a brief summary after completing work

## Perspective agents

Active perspective agents are included in the /config/prompt response.
Apply their constraints in priority order. An agent with strength >= 4
should be treated as a hard constraint, not a suggestion.

## Checking in

If a task takes more than 10 minutes of execution, re-read /config/prompt
before continuing to the next subtask. Settings may have changed.
