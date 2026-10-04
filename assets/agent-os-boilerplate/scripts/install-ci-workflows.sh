#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# install-ci-workflows.sh
# Copia los workflows de referencia desde docs/ci-workflows/ a .github/workflows/
# para que GitHub Actions los detecte. Requiere push con credenciales que
# tengan scope `workflow`.
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SRC="docs/ci-workflows"
DST=".github/workflows"

log() { printf '\033[1;36m[INSTALL-CI]\033[0m %s\n' "$*"; }

if [ ! -d "$SRC" ]; then
  echo "ERROR: $SRC not found." >&2
  exit 1
fi

mkdir -p "$DST"

for f in gate-honesty.yml memory-audit.yml pre-cycle.yml; do
  if [ -f "$SRC/$f" ]; then
    cp "$SRC/$f" "$DST/$f"
    log "Copied: $SRC/$f → $DST/$f"
  else
    echo "WARN: $SRC/$f not found, skipping." >&2
  fi
done

log ""
log "Done. Workflows installed in $DST/."
log "Next steps:"
log "  git add $DST/"
log "  git commit -m 'ci: install gate-honesty, memory-audit, pre-cycle workflows'"
log "  git push   # requires token with 'workflow' scope"
log ""
log "Verify at: https://github.com/${GITHUB_REPOSITORY:-yosietserga/agent-os-boilerplate}/actions"
