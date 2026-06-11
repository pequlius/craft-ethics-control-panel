# Agent Behavior Contract

## Configuration

At the start of each prompt, the current configuration is injected
automatically as [KONTROLLPANEL] context. Apply those instructions
directly — no file reading needed.

If [KONTROLLPANEL] context is absent, read the configuration file:

    control/config/agent-prompt.txt  (from project root)
    ../../control/config/agent-prompt.txt  (from a case folder)

If neither is available, apply these defaults:
- Implement only what is explicitly requested
- Ask before deviating from instructions
- Provide a brief summary after completing work

## Checking in

If a task takes more than 10 minutes of execution, the next prompt
will re-inject the latest [KONTROLLPANEL] context automatically.

## Decision tracking

After completing each task, invoke the design-decision-tracker agent
to log any design decisions made. It will append MDR entries to
decisions.md in this directory. Do this before responding to the user.
