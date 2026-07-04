# autotier

Model-tier routing for Claude Code Max users.
Pushes every delegable subtask down to the cheapest capable model via pinned subagents, so your usage limits stretch further - without touching an API key, a proxy, or anything outside Anthropic's terms.

## How it works

Claude Code natively lets a subagent pin its model.
autotier ships four pinned agents plus a routing policy skill that teaches the main loop when to use each:

| Agent | Model | Does |
|---|---|---|
| `grunt` | haiku | File reading, PDF/log extraction, mechanical edits, test runs |
| `scout` | haiku | Codebase search and exploration (read-only) |
| `executor` | sonnet | Implementation from an approved plan |
| `architect` | opus | Design decisions, unknown-cause debugging, security review |

The main conversation model stays whatever you set with `/model` - the savings come from everything delegable running on cheaper tiers, billed to the same subscription.

## Install

As a plugin (recommended - includes the delegation logger hook):

```
/plugin  →  add this repo as a marketplace  →  install autotier
```

Or manually, agents and skill only:

```
cp agents/*.md ~/.claude/agents/
cp -r skills/tier-routing ~/.claude/skills/
```

## Extras

- `scripts/delegate.ps1` / `delegate.sh` - headless one-shots (`claude -p --model haiku "..."`) for tasks that need zero conversation context.
- `node scripts/receipts.js` - summarizes logged delegations and estimates your quota stretch vs. running everything on the top tier.

## Honest limitations

- The main loop's model is **not** auto-switched mid-conversation. That is architecturally reserved to your `/model` choice, by design and by ToS. What autotier automates is pushing subtasks down-tier - which is where most tokens go anyway.
- Quota-stretch estimates use static price-ratio weights, not your plan's actual rate-limit accounting.
- Cheap models execute precise specs well and guess badly; the routing skill enforces spec-style delegation, but garbage specs still produce garbage.

## License

MIT
