#!/bin/bash
# SessionStart hook (.claude/settings.json), in Claude Code cloud sessions only: installs the dependencies when the
# lock file changed. Hooks don't run in sessions with several repositories: see AGENTS.md.

[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 1

hashes=node_modules/.cloud-session-start.sha256
if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  rm -f "$hashes"
  npm ci --no-audit --no-fund && sha256sum package.json package-lock.json > "$hashes"
fi
exit 0
