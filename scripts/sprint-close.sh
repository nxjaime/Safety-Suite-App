#!/bin/sh
set -e

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

SPRINT_NUM="$(awk 'match($0, /^### Sprint ([0-9]+)/, m) { sprint=m[1] } END { print sprint }' handoff.md)"
if [ -z "$SPRINT_NUM" ]; then
  echo "ERROR: could not parse sprint number from handoff.md"
  echo "Expected lines like: ### Sprint 2:"
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [ -z "$BRANCH" ]; then
  echo "ERROR: could not determine current branch"
  exit 1
fi

# Stage everything

git add -A

# No changes staged
if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

echo "Running checks..."

npm run build
npm run test -- --run src/test

echo "Checks passed. Committing..."

git commit -m "sprint-${SPRINT_NUM}: closeout"

echo "Pushing to origin/${BRANCH}..."

git push origin "$BRANCH"

echo "Done."
