#!/usr/bin/env node
// Summarizes ~/.claude/switcharoo.jsonl: delegations per agent and an estimated
// quota stretch vs. running the same tokens on the top tier.
const fs = require('fs');
const os = require('os');
const path = require('path');

// ponytail: static price-ratio weights (per-MTok input $15/$3/$1); update if pricing shifts
const WEIGHT = { architect: 15, executor: 3, grunt: 1, scout: 1 };
const TOP = 15;

const file = path.join(os.homedir(), '.claude', 'switcharoo.jsonl');
if (!fs.existsSync(file)) {
  console.log('No delegations logged yet (' + file + ' missing).');
  process.exit(0);
}

const recs = fs
  .readFileSync(file, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const byAgent = {};
for (const r of recs) {
  const a = (byAgent[r.agent] ??= { count: 0, tokens: 0 });
  a.count++;
  a.tokens += r.tokens || 0;
}

let actual = 0;
let topCost = 0;
console.log('agent      runs   tokens');
for (const [agent, s] of Object.entries(byAgent)) {
  console.log(agent.padEnd(10), String(s.count).padStart(4), String(s.tokens).padStart(8));
  actual += s.tokens * (WEIGHT[agent] || TOP);
  topCost += s.tokens * TOP;
}
console.log(`\n${recs.length} delegations total.`);
if (actual > 0) {
  console.log(`Estimated quota stretch: ~${(topCost / actual).toFixed(1)}x vs running everything on the top tier.`);
}
