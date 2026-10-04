#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# verify.sh — Comando canónico: `verify`
# Batería completa de puertas de calidad deterministas con Gate Honesty.
# Regla P2: nunca PASS sin comando ejecutado; reportar NOT_RUN si aplica.
# ════════════════════════════════════════════════════════════════════════
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PASS=0; FAIL=0; NOTRUN=0
RESULTS=()

run_gate() {
  local name="$1" cmd="$2"
  printf '\033[1;36m[VERIFY]\033[0m %s\n' "$name"
  printf '  [CMD] %s\n' "$cmd"
  if eval "$cmd" > /tmp/verify_out.log 2>&1; then
    local exit_code=0
    printf '  [EXIT] %d\n' "$exit_code"
    printf '  [STDOUT tail]\n'
    tail -3 /tmp/verify_out.log | sed 's/^/    /'
    RESULTS+=("PASS|$name|$cmd|$exit_code")
    PASS=$((PASS+1))
  else
    local exit_code=$?
    printf '  [EXIT] %d\n' "$exit_code"
    printf '  [STDOUT tail]\n'
    tail -3 /tmp/verify_out.log | sed 's/^/    /'
    RESULTS+=("FAIL|$name|$cmd|$exit_code")
    FAIL=$((FAIL+1))
  fi
}

not_run() {
  local name="$1" reason="$2"
  printf '\033[1;33m[VERIFY]\033[0m %s\n' "$name"
  printf '  [NOT_RUN] %s\n' "$reason"
  RESULTS+=("NOT_RUN|$name|$reason|N/A")
  NOTRUN=$((NOTRUN+1))
}

echo "═══════════════════════════════════════════════════════════════"
echo " Gate Honesty Verification — Regla P2"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── TypeScript ──
if [ -f package.json ] && command -v pnpm >/dev/null 2>&1; then
  run_gate "TS Typecheck" "pnpm exec tsc --noEmit"
  if grep -q '"lint"' package.json; then
    run_gate "TS Lint" "pnpm run lint --max-warnings=0"
  else
    not_run "TS Lint" "no 'lint' script in package.json"
  fi
  if grep -q '"test"' package.json; then
    run_gate "TS Tests" "pnpm run test"
  else
    not_run "TS Tests" "no 'test' script in package.json"
  fi
else
  not_run "TS Typecheck" "no package.json or pnpm not installed"
fi

# ── Python ──
if [ -f pyproject.toml ] && command -v uv >/dev/null 2>&1; then
  run_gate "Py Mypy" "uv run mypy --strict ."
  run_gate "Py Ruff" "uv run ruff check ."
  run_gate "Py Pytest" "uv run pytest --cov --cov-fail-under=80"
else
  not_run "Py Mypy" "no pyproject.toml or uv not installed"
fi

# ── Go ──
if [ -f go.mod ]; then
  run_gate "Go Build" "go build ./..."
  if command -v golangci-lint >/dev/null 2>&1; then
    run_gate "Go Lint" "golangci-lint run ./..."
  else
    not_run "Go Lint" "golangci-lint not installed"
  fi
  run_gate "Go Test" "go test -v -race -cover ./..."
else
  not_run "Go Build" "no go.mod"
fi

# ── Rust ──
if [ -f Cargo.toml ] && command -v cargo >/dev/null 2>&1; then
  run_gate "Rust Clippy" "cargo clippy --all-targets -- -D warnings"
  run_gate "Rust Fmt" "cargo fmt --check"
  run_gate "Rust Test" "cargo test --all-targets"
else
  not_run "Rust Clippy" "no Cargo.toml or cargo not installed"
fi

# ── PHP ──
if [ -f composer.json ] && command -v composer >/dev/null 2>&1; then
  if [ -f vendor/bin/phpstan ]; then
    run_gate "PHP PHPStan" "vendor/bin/phpstan analyse --level=max"
  else
    not_run "PHP PHPStan" "phpstan not installed (composer require phpstan/phpstan)"
  fi
  if [ -f vendor/bin/pest ] || [ -f vendor/bin/phpunit ]; then
    run_gate "PHP Tests" "vendor/bin/pest || vendor/bin/phpunit"
  else
    not_run "PHP Tests" "no test runner installed"
  fi
else
  not_run "PHP PHPStan" "no composer.json or composer not installed"
fi

# ── C++ ──
if [ -f CMakeLists.txt ] && command -v cmake >/dev/null 2>&1; then
  run_gate "C++ Configure" "cmake -S . -B build -DCMAKE_BUILD_TYPE=Release"
  run_gate "C++ Build" "cmake --build build -j\$(nproc)"
  if command -v ctest >/dev/null 2>&1; then
    run_gate "C++ CTest" "ctest --test-dir build --output-on-failure"
  fi
else
  not_run "C++ Configure" "no CMakeLists.txt or cmake not installed"
fi

# ── Memory check (Regla P9) ──
echo ""
if [ -f docs/memory/anti-patterns.md ] && [ -f docs/memory/wins-ledger.md ] && [ -f docs/memory/state.json ]; then
  printf '\033[1;32m[OK]\033[0m Memory files present (anti-patterns.md, wins-ledger.md, state.json)\n'
else
  printf '\033[1;31m[FAIL]\033[0m Memory files incomplete — see docs/memory/\n'
  FAIL=$((FAIL+1))
fi

# ── Reporte final ──
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " Gate Honesty Report (Regla P2)"
echo "═══════════════════════════════════════════════════════════════"
printf '  PASS:    %d\n' "$PASS"
printf '  FAIL:    %d\n' "$FAIL"
printf '  NOT_RUN: %d\n' "$NOTRUN"
echo ""
echo "  Per-gate detail:"
for r in "${RESULTS[@]}"; do
  IFS='|' read -r status name detail exit <<< "$r"
  case "$status" in
    PASS)    printf '    \033[1;32mPASS\033[0m     %-30s\n' "$name" ;;
    FAIL)    printf '    \033[1;31mFAIL\033[0m     %-30s (exit %s)\n' "$name" "$exit" ;;
    NOT_RUN) printf '    \033[1;33mNOT_RUN\033[0m  %-30s (%s)\n' "$name" "$detail" ;;
  esac
done
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
