#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TARGET_DIR="${1:-${OPENCLAW_INSTALLER_SKILL_TARGET_DIR:-${HOME}/.openclaw/skills/aipanel-installer}}"
RENDER_SCRIPT="$REPO_ROOT/scripts/render-openclaw-installer-skill.mjs"
TEMP_RENDER_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_RENDER_DIR"' EXIT

if [[ ! -f "$RENDER_SCRIPT" ]]; then
  echo "OpenClaw installer skill render script not found: $RENDER_SCRIPT" >&2
  exit 1
fi

node "$RENDER_SCRIPT" "$TEMP_RENDER_DIR"

mkdir -p "$(dirname "$TARGET_DIR")"
rm -rf "$TARGET_DIR"
cp -R "$TEMP_RENDER_DIR" "$TARGET_DIR"

cat <<MSG
Installed AIPanel installer skill
- canonical template: $REPO_ROOT/integrations/openclaw-installer-skill
- rendered copy: $TEMP_RENDER_DIR
- target: $TARGET_DIR
MSG
