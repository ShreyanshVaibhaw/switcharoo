# autotier - model-tier routing for Claude Code Max users

## Goal

An open-source Claude Code plugin that pushes every delegable subtask down to the cheapest capable model tier, so Max-plan users stretch their usage limits without thinking about model selection.
Everything runs through Claude Code's own supported mechanisms (subagent model pinning, headless CLI), fully within Anthropic's terms.

## Non-goals (v1)

- No API proxy, no OAuth interception, no model rewriting of the main loop. The main conversation model stays user-controlled via `/model`.
- No cross-provider routing (GPT/Gemini). Anthropic-only.
- No learned/ML routing. A static, readable policy table is the product.
- No quota dashboard in v1. `/cost` and the statusline exist; receipts come in Phase 3.

## Architecture

Three parts, all plain Claude Code assets:

1. **Pinned agents** (`agents/*.md`) - subagent definitions with `model:` frontmatter. This is where the actual tier switching happens; Claude Code natively runs each agent on its pinned model, billed to the same subscription at the cheaper rate.
2. **Routing skill** (`skills/tier-routing/SKILL.md`) - the "brain". Teaches the main loop when to delegate and to which agent. The policy table lives here in one place.
3. **Headless delegation** (Phase 2) - a thin script wrapping `claude -p --model haiku "<task>"` for fire-and-forget grunt work that does not need conversation context at all.

## Routing policy (the core table)

| Tier | Agent | Model | Task shapes |
|------|-------|-------|-------------|
| Budget | `grunt` | haiku | Read/summarize files, extract data from PDFs/docs/logs, format conversion, mechanical multi-file edits from an exact spec, running tests and reporting output |
| Budget | `scout` | haiku | Codebase search, "where is X defined/used", dependency tracing, gathering file lists |
| Standard | `executor` | sonnet | Writing/modifying code from an approved plan, bug fixes with a known cause, writing tests |
| Top | `architect` | opus | Architecture decisions, debugging with unknown cause, security-sensitive review, plan creation |

Delegation rules for the main loop:

- If a subtask is mechanical (no judgment, exact spec), send it to `grunt` or `scout`. Never do bulk file reading in the main loop.
- If a subtask needs judgment but the approach is already decided, send it to `executor`.
- Only pull in `architect` when the approach itself is undecided or the blast radius is high.
- When unsure between two tiers, take the cheaper one; escalate only if the result is inadequate.
- Do not delegate tasks that need the full conversation context; delegation pays off only when the subtask is self-contained.

## File layout

```
autotier/
  .claude-plugin/plugin.json      # plugin manifest
  agents/
    grunt.md                      # haiku - mechanical work
    scout.md                      # haiku - search and exploration
    executor.md                   # sonnet - implementation
    architect.md                  # opus - design and hard debugging
  skills/
    tier-routing/SKILL.md         # routing policy, auto-loaded guidance
  scripts/
    delegate.ps1                  # Phase 2 - headless haiku one-shots
  plan.md
  README.md                       # Phase 4
```

## Phases

### Phase 1 - core plugin (now)

- [x] Repo scaffold and this plan.
- [x] `plugin.json` manifest.
- [x] Four agent definitions with pinned models and tight tool lists.
- [x] `tier-routing` skill with the policy table.

### Phase 2 - headless delegation

- [x] `scripts/delegate.ps1` (and `delegate.sh`): wraps `claude -p --model <tier> --output-format text`, with a timeout and non-zero exit on failure.
- [x] Extend the skill: when a task needs zero conversation context, prefer headless delegation over a subagent (fresh context = zero cache cost).

### Phase 3 - receipts

- [x] Log each delegation (agent, tier, token counts from the Task result) to `~/.claude/autotier.jsonl` via a PostToolUse hook (`hooks/hooks.json` + `scripts/log-delegation.js`).
- [x] `scripts/receipts.js` summarizes delegations and estimated quota stretch.

### Phase 4 - publish

- [x] README with install instructions and the honest-limitations section (main loop is not auto-switched; that is by design and by ToS).
- [x] `git init`, license (MIT). GitHub repo: pending (needs user's account).
- [ ] Submit to a Claude Code plugin marketplace.

## Dogfooding / testing

1. Install locally: `claude plugin` from this directory, or copy `agents/*` to `~/.claude/agents/` and `skills/tier-routing/` to `~/.claude/skills/`.
2. Run a real session with a mixed task (e.g. "read these three PDFs and refactor module X accordingly") and confirm via the Task tool output that PDF reading ran on haiku and the refactor on sonnet.
3. Compare `/cost` + usage-limit burn against an identical session without the plugin.
4. Success criterion for v1: a mixed session delegates at least the file-reading and search work off the main model with no quality complaints.

## Risks

- **Over-delegation**: cheap agents botch a task and the redo costs more than the savings. Mitigation: the "when unsure, take cheaper, escalate on failure" rule plus tight agent scopes.
- **Model alias drift**: `haiku`/`sonnet`/`opus` aliases are stable in agent frontmatter; pin exact IDs only if behavior changes.
- **Anthropic ships native auto-routing**: real possibility; the policy table and agent pack still work as opinionated defaults on top.
