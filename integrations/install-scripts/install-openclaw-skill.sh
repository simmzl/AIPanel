#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SOURCE_DIR="${AIPANEL_SKILL_SOURCE_DIR:-$REPO_ROOT/integrations/openclaw-skill}"
TARGET_DIR="${1:-${OPENCLAW_SKILL_TARGET_DIR:-${HOME}/.openclaw/skills/aipanel-feishu-bitable}}"
LEGACY_TARGET_DIR="${HOME}/.openclaw/skills/homepanel-feishu-bitable"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "AIPanel skill source not found: $SOURCE_DIR" >&2
  exit 1
fi

mkdir -p "$(dirname "$TARGET_DIR")"
rm -rf "$TARGET_DIR"
cp -R "$SOURCE_DIR" "$TARGET_DIR"

if [[ -d "$LEGACY_TARGET_DIR" && "$LEGACY_TARGET_DIR" != "$TARGET_DIR" ]]; then
  rm -rf "$LEGACY_TARGET_DIR"
fi

cat <<EOF
Installed AIPanel OpenClaw skill
- source: $SOURCE_DIR
- target: $TARGET_DIR
EOF
