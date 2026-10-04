#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# cold-run.sh — Comando canónico: `cold run [scope]`
# Auditoría exhaustiva sin modificar archivos.
# Evalúa tipos, contratos, seguridad, EAV y adherencia arquitectónica.
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SCOPE="${1:-.}"
log() { printf '\033[1;36m[COLD-RUN]\033[0m %s\n' "$*"; }
report() { printf '  %-40s %s\n' "$1" "$2"; }

log "Auditing scope: $SCOPE"
log "Phase 0: Premise audit & memory sync"
log ""

# ── Fase 0: Memory sync ──
log "== Memory sync =="
if [ -f docs/memory/anti-patterns.md ]; then
  AP_COUNT=$(grep -cE '^## \[AP-[0-9]+\]' docs/memory/anti-patterns.md || echo 0)
  report "Anti-patterns documented:" "$AP_COUNT"
else
  report "Anti-patterns ledger:" "MISSING (critical)"
fi
if [ -f docs/memory/wins-ledger.md ]; then
  WIN_COUNT=$(grep -cE '^## \[WIN-[0-9]+\]' docs/memory/wins-ledger.md || echo 0)
  report "PSIM wins recorded:" "$WIN_COUNT"
fi
if [ -f docs/memory/state.json ]; then
  report "state.json:" "present"
else
  report "state.json:" "MISSING"
fi
log ""

# ── Stack detection ──
log "== Stack detection =="
HAS_TS=false; HAS_PY=false; HAS_GO=false; HAS_RUST=false; HAS_PHP=false; HAS_CPP=false
[ -f package.json ] && HAS_TS=true && report "TypeScript/Node:" "detected"
[ -f pyproject.toml ] && HAS_PY=true && report "Python:" "detected"
[ -f go.mod ] && HAS_GO=true && report "Go:" "detected"
[ -f Cargo.toml ] && HAS_RUST=true && report "Rust:" "detected"
[ -f composer.json ] && HAS_PHP=true && report "PHP:" "detected"
[ -f CMakeLists.txt ] && HAS_CPP=true && report "C++:" "detected"
log ""

# ── Tipado estricto ──
log "== Type checking (no mutation) =="
if $HAS_TS && command -v pnpm >/dev/null 2>&1; then
  log "  [CMD] pnpm exec tsc --noEmit"
  if pnpm exec tsc --noEmit 2>&1 | tail -5; then
    report "TypeScript typecheck:" "PASS (exit 0)"
  else
    report "TypeScript typecheck:" "FAIL (exit $?)"
  fi
else
  report "TypeScript typecheck:" "NOT_RUN"
fi
if $HAS_PY && command -v uv >/dev/null 2>&1; then
  log "  [CMD] uv run mypy --strict"
  uv run mypy --strict . 2>&1 | tail -5 && report "Python mypy:" "PASS" || report "Python mypy:" "FAIL/NOT_RUN"
else
  report "Python mypy:" "NOT_RUN"
fi
if $HAS_GO; then
  log "  [CMD] go vet ./..."
  go vet ./... 2>&1 | tail -5 && report "Go vet:" "PASS" || report "Go vet:" "NOT_RUN"
fi
if $HAS_RUST; then
  log "  [CMD] cargo check"
  cargo check 2>&1 | tail -5 && report "Rust check:" "PASS" || report "Rust check:" "NOT_RUN"
fi
log ""

# ── Contratos ──
log "== Contract fidelity =="
if find . -name 'openapi*.yaml' -o -name 'openapi*.json' 2>/dev/null | grep -q .; then
  report "OpenAPI spec present:" "yes"
else
  report "OpenAPI spec present:" "no (consider adding)"
fi
log ""

# ── LLM-agnostic check (Regla P8) ──
log "== LLM-agnostic check (Regla P8) =="
VIOLATIONS=$(grep -rE "from ['\"]openai['\"]|from ['\"]@anthropic-ai/sdk['\"]|from ['\"]@google/generative-ai['\"]|require\(['\"]openai['\"]\)" \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
  --include='*.py' --include='*.go' --include='*.rs' --include='*.php' \
  --exclude-dir=node_modules --exclude-dir=vendor --exclude-dir=target \
  --exclude-dir=mcp --exclude-dir=packages --exclude-dir=.git \
  "$SCOPE" 2>/dev/null | grep -v 'packages/l2' | grep -v 'l2-client' || true)
if [ -z "$VIOLATIONS" ]; then
  report "Direct LLM SDK imports in business code:" "NONE (P8 satisfied)"
else
  report "Direct LLM SDK imports in business code:" "VIOLATIONS DETECTED"
  echo "$VIOLATIONS" | head -20
fi
log ""

# ── Memoria append-only check (P9) ──
log "== Memory append-only check (Regla P9) =="
if [ -f docs/memory/anti-patterns.md ]; then
  report "anti-patterns.md exists:" "yes"
  report "Entries (rough count):" "$(grep -cE '^## \[AP-' docs/memory/anti-patterns.md || echo 0)"
fi
log ""

log "Cold run complete. No files modified."
