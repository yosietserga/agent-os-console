#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# pre-cycle.sh — Comando canónico: `pre cycle`
# Ejecuta el juez determinista PRE-v2.0 sobre una propuesta de regla.
# Uso: bash scripts/pre-cycle.sh <branch-or-path-to-proposal>
#       bash scripts/pre-cycle.sh --rotate-benchmark   (rotación anti-Goodhart)
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

EVAL_DIR="packages/eval"
log() { printf '\033[1;36m[PRE-CYCLE]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[ERR]\033[0m %s\n' "$*" >&2; }

# ── Modo rotación de benchmark ──
if [ "${1:-}" = "--rotate-benchmark" ]; then
  log "Rotating benchmark-blind (anti-Goodhart)..."
  CURRENT_DIR="$EVAL_DIR/benchmark-blind/current"
  ARCHIVE_DIR="$EVAL_DIR/benchmark-blind/archive"
  mkdir -p "$ARCHIVE_DIR"
  ROT_DATE=$(date -u +"%Y%m%d")
  # Mueve el 10% de current a archive
  if [ -d "$CURRENT_DIR" ]; then
    FILES=($(ls "$CURRENT_DIR"/*.case.json 2>/dev/null || true))
    TOTAL=${#FILES[@]}
    if [ "$TOTAL" -gt 0 ]; then
      MOVE_COUNT=$(( TOTAL / 10 ))
      [ "$MOVE_COUNT" -lt 1 ] && MOVE_COUNT=1
      log "Moving $MOVE_COUNT of $TOTAL cases to archive (suffix -rotated-$ROT_DATE)..."
      for f in "${FILES[@]:0:$MOVE_COUNT}"; do
        base=$(basename "$f" .case.json)
        mv "$f" "$ARCHIVE_DIR/${base}-rotated-$ROT_DATE.case.json"
      done
      log "  Done. Remaining in current: $(( TOTAL - MOVE_COUNT ))"
    fi
  fi
  log "Benchmark rotation complete."
  exit 0
fi

PROPOSAL="${1:-}"
if [ -z "$PROPOSAL" ]; then
  err "Usage: bash scripts/pre-cycle.sh <branch-or-path-to-proposal>"
  err "       bash scripts/pre-cycle.sh --rotate-benchmark"
  exit 1
fi

log "Evaluating proposal: $PROPOSAL"
log ""

# ── Materializar base y candidato ──
BASE_DIR=$(mktemp -d /tmp/pre-base.XXXXXX)
CAND_DIR=$(mktemp -d /tmp/pre-cand.XXXXXX)
trap 'rm -rf "$BASE_DIR" "$CAND_DIR"' EXIT

log "Materializing base (main)..."
git worktree add --force "$BASE_DIR" main 2>/dev/null || git archive main | tar -x -C "$BASE_DIR"

log "Materializing candidate ($PROPOSAL)..."
if git rev-parse --verify "$PROPOSAL" >/dev/null 2>&1; then
  git worktree add --force "$CAND_DIR" "$PROPOSAL" 2>/dev/null || git archive "$PROPOSAL" | tar -x -C "$CAND_DIR"
else
  cp -r "$REPO_ROOT"/* "$CAND_DIR"/ 2>/dev/null || true
  cp -r "$REPO_ROOT"/.github "$CAND_DIR"/ 2>/dev/null || true
fi

# ── Construir juez ──
log "Building judge ($EVAL_DIR)..."
JUDGE_CMD=""
if [ -f "$EVAL_DIR/Cargo.toml" ] && command -v cargo >/dev/null 2>&1; then
  (cd "$EVAL_DIR" && cargo build --release --quiet)
  JUDGE_CMD="(cd $EVAL_DIR && cargo run --release --quiet --)"
elif [ -f "$EVAL_DIR/go.mod" ] && command -v go >/dev/null 2>&1; then
  (cd "$EVAL_DIR" && go build -o /tmp/judge ./cmd/eval)
  JUDGE_CMD="/tmp/judge"
elif [ -f "$EVAL_DIR/package.json" ] && command -v node >/dev/null 2>&1; then
  (cd "$EVAL_DIR" && npm ci --silent && npm run build --silent)
  JUDGE_CMD="(cd $EVAL_DIR && node dist/index.js)"
else
  err "Judge not yet implemented in $EVAL_DIR."
  err "Build packages/eval to enable PRE-v2.0 promotions."
  err "See packages/eval/README.md for the contract."
  JUDGE_CMD=""
fi

if [ -z "$JUDGE_CMD" ]; then
  log "STUB VERDICT: REJECT (judge not implemented)"
  cat << 'EOF'
{
  "decision": "REJECT",
  "reason": "Judge not yet implemented. Build packages/eval to enable PRE-v2.0 promotions.",
  "S_base": 0, "S_candidate": 0, "deltaS": 0,
  "sigma_base": 0, "sigma_candidate": 0,
  "conditions": {
    "improvementSignificant": false,
    "noSevereRegression": true,
    "statisticalSignificance": false
  }
}
EOF
  exit 1
fi

# ── Ejecutar juez ──
log "Running judge..."
log "  base:      $BASE_DIR"
log "  candidate: $CAND_DIR"
log "  benchmark: $EVAL_DIR/benchmark-blind/current"
log ""

eval "$JUDGE_CMD" \
  --base "$BASE_DIR" \
  --candidate "$CAND_DIR" \
  --benchmark "$EVAL_DIR/benchmark-blind/current" \
  --json

log ""
log "Done. See verdict above."
