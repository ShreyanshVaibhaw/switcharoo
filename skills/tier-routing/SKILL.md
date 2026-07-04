---
name: tier-routing
description: Model-tier routing policy - delegate subtasks to the cheapest capable pinned agent (grunt/scout on haiku, executor on sonnet, architect on opus) to stretch usage limits. Use at the start of any multi-step task to decide what to delegate, and whenever about to do bulk file reading, searching, or mechanical work in the main loop.
---

# Tier routing

Before doing work yourself, check whether a cheaper pinned agent should do it.
Every delegated task runs on a cheaper model and burns less of the user's usage limit.

## Routing table

| Task shape | Delegate to | Tier |
|---|---|---|
| Read/summarize files, extract from PDFs/docs/logs, convert formats, mechanical edits from an exact spec, run tests and report | `grunt` | haiku |
| Find definitions/usages, trace dependencies, map structure, gather file lists | `scout` | haiku |
| Implement an approved plan, fix a bug with known cause, write tests | `executor` | sonnet |
| Undecided architecture, unknown-cause debugging, security review, plan creation | `architect` | opus |

## Rules

1. Never do bulk file reading or broad searching in the main loop - that is `scout`/`grunt` work.
2. Delegate only self-contained subtasks. If the task needs the full conversation context, keep it in the main loop; a delegation that requires re-explaining everything saves nothing.
3. Write delegation prompts as complete specs: file paths, exact expected output shape, and constraints. Cheap models execute specs well and guess badly.
4. When unsure between two tiers, pick the cheaper one. If the result is inadequate, escalate that one task - do not preemptively upgrade everything.
5. Chain tiers on big tasks: `architect` produces the plan, `executor` implements it, `grunt` runs the tests. The main loop only coordinates and reviews.
6. Do not delegate for its own sake: a task of a few seconds in the main loop is cheaper than spawning any agent.

## Headless delegation

For tasks needing zero conversation context (fresh context means zero cache cost), prefer a headless one-shot over a subagent:

```
scripts/delegate.ps1 "<complete self-contained task spec>" -Model haiku   # Windows
scripts/delegate.sh "<complete self-contained task spec>" haiku           # POSIX
```

This runs `claude -p --model haiku` on the same subscription.
Good for: batch summarization, format conversion, one-off extractions on files named in the prompt.
Bad for: anything referencing "the code we discussed" - headless runs know nothing about this session.
