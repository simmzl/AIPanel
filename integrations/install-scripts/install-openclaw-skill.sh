#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SOURCE_DIR="$REPO_ROOT/integrations/openclaw-skill"
TARGET_DIR="${HOME}/.openclaw/skills/aipanel-feishu-bitable"
mkdir -p "${HOME}/.openclaw/skills"
rm -rf "$TARGET_DIR"
cp -R "$SOURCE_DIR" "$TARGET_DIR"
echo "Installed AIPanel OpenClaw skill to: $TARGET_DIR"
