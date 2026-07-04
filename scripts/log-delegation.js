#!/usr/bin/env node
// PostToolUse hook (matcher: Task). Appends one JSONL line per autotier
// delegation to ~/.claude/autotier.jsonl for the receipts report.
const fs = require('fs');
const os = require('os');
const path = require('path');

const AGENTS = new Set(['grunt', 'scout', 'executor', 'architect']);

let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  try {
    const j = JSON.parse(data);
    const input = j.tool_input || {};
    if (j.tool_name !== 'Task' || !AGENTS.has(input.subagent_type)) return;
    const resp = j.tool_response || {};
    const rec = {
      ts: new Date().toISOString(),
      agent: input.subagent_type,
      desc: input.description || '',
      tokens: resp.totalTokens ?? resp.usage?.output_tokens ?? null,
    };
    fs.appendFileSync(
      path.join(os.homedir(), '.claude', 'autotier.jsonl'),
      JSON.stringify(rec) + '\n'
    );
  } catch {
    // ponytail: logging must never break the session; swallow everything
  }
});
