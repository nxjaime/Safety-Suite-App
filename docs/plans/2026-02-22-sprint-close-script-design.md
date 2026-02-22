# Sprint Close Script Design

**Goal:** Provide a single local command to auto-stage, run required checks, commit with a sprint-based message, and push to the current branch.

**Behavior**
- Auto-stage all changes in repo.
- Run checks:
  - `npm run build`
  - `npm run test -- --run src/test`
- Parse current sprint number from `handoff.md`.
- Commit message format: `sprint-<n>: closeout`.
- Push to current branch (`git branch --show-current`).

**Error Handling**
- If checks fail, abort before commit and print failure reason.
- If sprint number cannot be parsed, abort with clear guidance.
- If push fails, exit non-zero and print git error.

**Constraints**
- Script must be POSIX-compatible `sh`.
- No interactive prompts for message or branch.
- Works with repo path containing spaces.

**Artifacts**
- `scripts/sprint-close.sh`
- README note on usage
