#!/usr/bin/env pwsh
# Fire-and-forget headless delegation: runs a self-contained task on a cheap model
# via `claude -p`, billed to the same subscription. Usage:
#   delegate.ps1 "extract all tables from ./report.pdf" [-Model haiku] [-TimeoutSec 300]
param(
    [Parameter(Mandatory = $true, Position = 0)][string]$Task,
    [ValidateSet('haiku', 'sonnet', 'opus')][string]$Model = 'haiku',
    [int]$TimeoutSec = 300
)

$p = Start-Process claude -ArgumentList @('-p', '--model', $Model, '--output-format', 'text', $Task) -NoNewWindow -PassThru
if (-not $p.WaitForExit($TimeoutSec * 1000)) {
    $p.Kill()
    Write-Error "delegate: timed out after ${TimeoutSec}s"
    exit 124
}
exit $p.ExitCode
