#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  echo "ERROR: not inside a git repository"
  exit 1
fi

cd "$REPO_ROOT"

if [ ! -f "handoff.md" ]; then
  echo "ERROR: handoff.md not found at repo root"
  exit 1
fi

echo "== Launch Rehearsal =="
echo "Repo: $REPO_ROOT"
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Commit: $(git rev-parse --short HEAD)"
echo

echo "[1/3] Unit test suite"
npm run test:unit

echo
echo "[2/3] Production build"
npm run build

echo
if [ "${SKIP_SMOKE:-0}" = "1" ]; then
  echo "[3/3] Smoke e2e skipped (SKIP_SMOKE=1)"
else
  echo "[3/3] Smoke e2e (auth bypass enabled)"
  VITE_E2E_AUTH_BYPASS=true npm run test:smoke
fi

echo
echo "Launch rehearsal checks completed."
