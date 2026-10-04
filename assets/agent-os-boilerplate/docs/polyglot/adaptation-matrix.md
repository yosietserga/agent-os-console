# Matriz de Adaptación Polyglot

> Mapeo canónico de las 5 fases del Pipeline Universal (`AGENTS.md` §2) a las
> herramientas específicas de cada lenguaje soportado.
>
> Lenguajes cubiertos: **TypeScript/Node, Python, Go, Rust, PHP, C++**.
> Cualquier adición de un nuevo lenguaje requiere un PR via PRE-v2.0.

---

## Resumen ejecutivo

| Lenguaje | ORM / Datos | Validación | API / Contratos | Testing | Build / Lint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TypeScript/Node** | Prisma / Drizzle | Zod | OpenAPI 3.1 + Zod | Vitest / Jest | `tsc --noEmit && lint` |
| **Python** | SQLAlchemy + Pydantic v2 | Pydantic v2 | FastAPI + OpenAPI | pytest + pytest-asyncio | `mypy --strict && ruff` |
| **Go** | sqlc / GORM | go-playground/validator | Gin/Chi + Swag/Protobuf | `go test -race -cover` | `golangci-lint && go build` |
| **Rust** | SQLx / Diesel | serde + validator | Axum + utoipa / Protobuf | `cargo test --all-targets` | `cargo clippy -D warnings` |
| **PHP** | Doctrine / Eloquent | Symfony Validator / Laravel Rules | Symfony/Laravel + OpenAPI attrs | Pest / PHPUnit | PHPStan lvl 8 + PHPCS |
| **C++** | RAII structs | manual / Boost.Deserialize | Crow/Pistache/gRPC + Protobuf | CTest / GoogleTest | CMake + clang-tidy |

---

## Fase 1: Núcleo de Datos, Dominio y Tipado Estricto

### TypeScript / Node
- **ORM:** Prisma (declarativo, type-safe) o Drizzle (SQL-like, ligero).
- **Migraciones:** `prisma migrate dev` o `drizzle-kit generate`.
- **Tipado:** `strict: true`, `noUncheckedIndexedAccess: true`, prohibido `any`
  (regla ESLint `@typescript-eslint/no-explicit-any` → `error`).
- **Validación runtime:** Zod para todo input externo; inferir tipos con `z.infer`.
- **EAV polimórfico:** tabla `eav_attributes` con `value_int`, `value_text`,
  `value_json`, `value_decimal`, discriminada por `value_type`.

### Python
- **ORM:** SQLAlchemy 2.0 (estilo typed) con Alembic para migraciones.
- **Tipado:** `mypy --strict` + `pydantic>=2` para modelos de dominio.
- **Validación:** Pydantic v2 con `model_config = ConfigDict(strict=True)`.
- **Async:** `SQLAlchemy[asyncio]` + `asyncpg`.

### Go
- **ORM:** `sqlc` (genera código type-safe desde SQL) preferido sobre GORM.
- **Tipado:** structs inmutables; usar punteros solo donde `nil` es semánticamente válido.
- **Migraciones:** `golang-migrate/migrate` o `goose`.
- **Validación:** `go-playground/validator/v10` con tags `validate:"required,min=3"`.

### Rust
- **ORM:** SQLx (compile-time checked queries) o Diesel (macros, sin async).
- **Tipado:** `Option<T>` / `Result<T, E>` en toda función falible; cero `unwrap()` en producción.
- **Migraciones:** `sqlx migrate` o `refinery`.
- **Validación:** crate `validator` con derive macros; `serde` para (de)serialización.

### PHP
- **ORM:** Doctrine ORM (Symfony) o Eloquent (Laravel).
- **Tipado:** `declare(strict_types=1);` en TODO archivo; tipos de retorno obligatorios.
- **Migraciones:** Doctrine Migrations o Laravel Migrations.
- **Validación:** Symfony Validator Component o Laravel Form Requests.

### C++
- **Datos:** clases RAII; structs POD serializables; smart pointers (`std::unique_ptr`, `std::shared_ptr`).
- **Tipado:** `-Wall -Wextra -Werror -pedantic`; `std::variant` para unions type-safe.
- **Migraciones:** scripts SQL versionados ejecutados por herramienta custom o `dbmate`.
- **Validación:** validación manual o con Boost.Deserialize; aserciones en debug.

---

## Fase 2: Contratos de Interfaz y Envoltorios de API

### Principio universal
Toda API DEBE exponer:
1. Contrato declarativo (OpenAPI 3.1 / Protobuf / GraphQL SDL).
2. Envoltorio canónico `{ success, data, error, meta }`.
3. Excepciones HTTP semánticas (nunca 200 con body de error).
4. Decoradores de permisos en cada endpoint.

### TypeScript / Node
- **Framework:** Next.js API Routes (App Router), Hono, Fastify o NestJS.
- **Contrato:** OpenAPI 3.1 generado por `@asteasolutions/zod-to-openapi` o
  `@nestjs/swagger`; validación de request/response con Zod.
- **Permisos:** decorador `@RequirePermissions('orders:write')` o middleware.
- **Wrapper:** helper `apiOk(data, meta)` / `apiError(code, message)`.

### Python
- **Framework:** FastAPI (OpenAPI automático) o Litestar.
- **Contrato:** esquemas Pydantic v2 → OpenAPI 3.1 generado automáticamente.
- **Permisos:** dependencias `Depends(require_permission("orders:write"))`.
- **Wrapper:** `ResponseModel[T]` genérico con Pydantic.

### Go
- **Framework:** `net/http` estándar con `chi` o `gin`; o gRPC puro.
- **Contrato:** `swaggo/swag` (OpenAPI 2.0) o Protobuf + `buf`.
- **Permisos:** middleware `func RequirePermission(perm string) func(http.Handler) http.Handler`.
- **Wrapper:** struct `Response[T any]` con generics de Go 1.18+.

### Rust
- **Framework:** Axum (recomendado) o Actix-web.
- **Contrato:** `utoipa` (OpenAPI 3.0) o `prost` (Protobuf).
- **Permisos:** extractor `FromRequestParts` con `RequirePermission`.
- **Wrapper:** `ApiResponse<T>` con derive `serde::Serialize`.

### PHP
- **Framework:** Symfony 7 o Laravel 11.
- **Contrato:** atributos `#[OA\Response(...)]` (nelmio/api-doc-bundle) o
  `zircote/swagger-php`; Sf Serializer para normalización.
- **Permisos:** voters de Symfony o policies de Laravel.
- **Wrapper:** `JsonResponse` con estructura canónica.

### C++
- **Framework:** Crow (ligero) o Pistache; gRPC para microservicios.
- **Contrato:** Protobuf canónico + `grpc-tools` para generación.
- **Permisos:** interceptor gRPC o middleware Crow.
- **Wrapper:** mensaje Protobuf `ApiResponse` con `oneof` data/error.

---

## Fase 3: Superficie de Consumo, UI y Composición de Widgets

> Esta fase depende del stack frontend; se lista orientativamente. La Regla P6
> (7 posiciones canónicas) y la Regla P5 (Apple Light Mode) aplican SIEMPRE.

- **TS web:** Next.js 16 + React 19 + Tailwind 4 + shadcn/ui (New York).
- **TS mobile:** React Native + NativeWind.
- **Python web:** HTMX + Jinja2, o FastAPI + React SPA.
- **Go web:** HTMX + templ, o Go + React SPA.
- **Rust web:** Leptos / Dioxus / Yew (ISG).
- **PHP web:** Twig + HTMX, o Laravel Inertia + React/Vue.
- **C++ web:** Sir Lancer/Crow sirviendo JSON; frontend separado.

**Invariantes en TODOS los stacks:**
- 4 estados obligatorios: Loading (skeleton), Vacío, Error, Éxito.
- WCAG 2.1 AA (contraste, foco teclado, ARIA).
- Layout canónico de 7 posiciones: `header`, `featuredContent`, `column_left`,
  `main`, `column_right`, `featuredFooter`, `footer`.
- Cero emojis en UI; iconos SVG.
- Cero `!important`; variables CSS para temas.

---

## Fase 4: Tests, Documentación y Memoria

### TypeScript / Node
- **Unitarios:** Vitest (preferido) o Jest.
- **Contrato:** `msw` + `zod` para mock de APIs externas validado por esquema.
- **E2E:** Playwright (cross-browser, soporta WCAG assertions).
- **Cobertura:** `vitest --coverage` con umbrales en `vitest.config.ts`.

### Python
- **Unitarios:** `pytest` con `pytest-asyncio` para corutinas.
- **Contrato:** `schemathesis` (fuzzing de OpenAPI) o `pytest-openapi`.
- **E2E:** Playwright for Python.
- **Cobertura:** `pytest-cov` con `--cov-fail-under=80`.

### Go
- **Unitarios:** `go test -v -race -cover ./...` (el flag `-race` es obligatorio).
- **Contrato:** `deepmap/oapi-codegen` para generar clientes desde OpenAPI y
  validar respuestas reales.
- **E2E:** Playwright Go o `chromedp`.

### Rust
- **Unitarios:** `cargo test --all-targets` + `cargo nextest run` (paralelo).
- **Contrato:** `insta` para snapshot testing de respuestas API.
- **E2E:** `fantoccini` (WebDriver) o Playwright Rust.

### PHP
- **Unitarios:** Pest (DX moderna) o PHPUnit clásico.
- **Estático:** PHPStan nivel 8 o max; Larastan para Laravel.
- **Contrato:** `php-openapi` para validar respuestas contra esquemas.
- **E2E:** Playwright PHP o Dusk (Laravel).

### C++
- **Unitarios:** GoogleTest o Catch2; `ctest` como runner.
- **Contrato:** tests generados desde Protobuf vía `grpc-tools`.
- **E2E:** Playwright (frontend) + tests gRPC directos.

### Documentación y memoria (común a todos)
- **Docs API:** generadas desde OpenAPI/Protobuf (`redocly`, `swagger-ui`).
- **Docs técnica:** MkDocs Material o Docusaurus, versionada con el repo.
- **Memoria empírica:** `docs/memory/anti-patterns.md` y `wins-ledger.md`
  (append-only, Regla P9) — agnóstica al lenguaje.

---

## Fase 5: Validación en Caliente y Puertas de Compilación

### TypeScript / Node
```bash
pnpm exec tsc --noEmit           # typecheck
pnpm run lint                    # ESLint + Prettier
pnpm run test                    # Vitest con cobertura
pnpm run build                   # build de producción
# Gate Honesty: reportar exit code + stdout real de cada comando.
```

### Python
```bash
uv run mypy --strict .           # tipado estricto
uv run ruff check .              # linter
uv run ruff format --check .     # formato
uv run pytest --cov --cov-fail-under=80
# Build: wheel via `uv build` o `hatch build`.
```

### Go
```bash
golangci-lint run ./...          # linter comprehensivo
go vet ./...
go test -v -race -cover ./...
go build ./...
```

### Rust
```bash
cargo clippy --all-targets -- -D warnings   # linter estricto
cargo fmt --check
cargo test --all-targets
cargo build --release
```

### PHP
```bash
vendor/bin/phpstan analyse --level=max
vendor/bin/phpcs
vendor/bin/pest --coverage --min=80
# Build: `composer install --no-dev --optimize-autoloader`.
```

### C++
```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j$(nproc)
ctest --test-dir build --output-on-failure
clang-tidy -p build $(find src -name '*.cpp')
```

---

## Matriz de MCP por lenguaje

| Lenguaje | LSP server | Formatter | Linter principal |
| :--- | :--- | :--- | :--- |
| TS/Node | `typescript-language-server` | Prettier | ESLint |
| Python | `pylsp` / `ruff-lsp` / `basedpyright` | Ruff format | Ruff + mypy |
| Go | `gopls` | `gofmt` | `golangci-lint` |
| Rust | `rust-analyzer` | `rustfmt` | `clippy` |
| PHP | `intelephense` | PHP-CS-Fixer | PHPStan + PHPCS |
| C++ | `clangd` | `clang-format` | `clang-tidy` |

El servidor MCP `lsp-mcp-bridge` (`mcp/servers/lsp-bridge.mcp.json`) detecta el
lenguaje del archivo activo y enruta al LSP correcto.

---

## Regla de admisión de un nuevo lenguaje

Para añadir un séptimo lenguaje (ej. Kotlin, Swift, Elixir, Zig):

1. El Optimizador abre PR `pre/propose/add-lang-<nombre>` con:
   - Columna completa para las 5 fases (este archivo).
   - Entrada en la matriz LSP/MCP.
   - Al menos 1 caso de referencia en `packages/eval/benchmark-blind/`.
2. El Juez determinista evalúa que la adición no rompe la coherencia polyglot.
3. Si $\Delta S \ge 5.0$ sin regresiones → merge vía PRE-v2.0.
4. Se anexa entrada W1 (Capability Strengthening) al wins-ledger.
