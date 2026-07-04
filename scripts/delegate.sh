#!/usr/bin/env bash
# Fire-and-forget headless delegation: runs a self-contained task on a cheap model
# via `claude -p`, billed to the same subscription. Usage:
#   delegate.sh "extract all tables from ./report.pdf" [haiku|sonnet|opus] [timeout_sec]
set -euo pipefail
task=${1:?usage: delegate.sh "task" [haiku|sonnet|opus] [timeout_sec]}
model=${2:-haiku}
timeout "${3:-300}" claude -p --model "$model" --output-format text "$task"
