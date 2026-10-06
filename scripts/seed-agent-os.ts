// ════════════════════════════════════════════════════════════════════════
// seed-agent-os.ts — Puebla el Agent OS con la constitución AGENTS.md v1.6.0,
// memoria empírica del boilerplate y el scan real de los 10 repos de
// referencia de radiografía (mejorate scan, epoch en curso).
// Ejecutar: bun run scripts/seed-agent-os.ts
// ════════════════════════════════════════════════════════════════════════
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const EPOCH = Math.floor(Date.now() / 1000);

// ── Reglas Cardinales (AGENTS.md §1) ─────────────────────────────────────
const RULES = [
  { code: "P1", title: "Verificación Tras Edición (Read-After-Edit)", severity: "RED", category: "Prevención", description: "NUNCA asumas que una modificación se aplicó correctamente. Tras cualquier edición, el agente DEBE releer la sección modificada para verificar que el contenido está presente y no ocurrió un no-op." },
  { code: "P2", title: "Honestidad Absoluta en Puertas de Validación (Gate Honesty)", severity: "RED", category: "Prevención", description: "PROHIBIDO declarar PASS sin haber ejecutado el comando real en esta sesión. Toda afirmación de éxito incluye comando exacto, exit code y fragmento del stdout. Lo no ejecutado se declara NOT RUN." },
  { code: "P3", title: "Verificación en Código de Producción (Closes-Finding Guard)", severity: "RED", category: "Prevención", description: "NUNCA declarar resuelto un hallazgo si la solución solo reside en un mock o suite de test. El archivo de producción debe contener la corrección sustantiva." },
  { code: "P4", title: "Sincronización Atómica de Código, Contratos y Documentación", severity: "RED", category: "Invariantes", description: "Todo cambio de código se compromete en el mismo turno junto con especificaciones de API (OpenAPI/Protobuf/GraphQL), documentación y actualización de memoria empírica." },
  { code: "P5", title: "Integridad Visual y Estilo Modo Claro Apple", severity: "RED", category: "UI/UX", description: "Paleta inmutable: fondo #ffffff, superficies #f5f5f7, bordes #e5e5ea/#d2d2d7, texto #1d1d1f, secundario #86868b, acentos #1d1d1f o #0071e3. Cero fondos marrón/mostaza, cero dark mode como tema base, cero !important." },
  { code: "P6", title: "Estructura Canónica de Layout en 7 Posiciones", severity: "RED", category: "UI/UX", description: "Toda interfaz se resuelve mediante las 7 posiciones canónicas: header, featuredContent, column_left, main, column_right, featuredFooter, footer. Prohibidos archivos monolíticos estáticos." },
  { code: "P7", title: 'Política "Zero-Placeholder" y "Zero-Emoji"', severity: "RED", category: "UI/UX", description: "Todos los datos comerciales provienen de configuración o base de datos. Prohibidos correos/telefonos ficticios. Cero emojis en interfaces: exclusivamente iconos vectoriales SVG." },
  { code: "P8", title: "Aislamiento LLM-Agnóstico (Sin Vendor Lock-in)", severity: "RED", category: "Arquitectura", description: "Ningún controlador de negocio importa SDKs de proveedores LLM directamente. Toda inferencia pasa por el Control Plane L2 con envelope canónico, circuit breakers, fallbacks y ledger de costos." },
  { code: "P9", title: "Memoria Append-Only (Inmutabilidad Histórica)", severity: "RED", category: "Memoria", description: "anti-patterns.md, wins-ledger.md y worklog.md son append-only. Solo operaciones de anexado. Prohibido borrar, reescribir o reordenar. Correcciones via nueva entrada [CORRIGE-XXX]." },
  { code: "P10", title: "Declaración de Entornos Dev/Deploy", severity: "RED", category: "Metodología", description: "El agente DEBE conocer el split de entornos antes de tocar scripts. .env define DEV_OS y DEPLOY_OS. Rutas con path.join(), jamás barras hardcodeadas." },
  { code: "P11", title: "Onboarding Tour Obligatorio en Vistas Complejas", severity: "RED", category: "UI/UX", description: "Toda vista con >3 secciones interactivas, composer, >3 métricas o ruta crítica de onboarding DEBE montar un OnboardingTour canónico. persona check falla para apprentice + demo-master sin tour." },
  { code: "P12", title: "Anti-Prompt-Injection (Defensa en 7 Capas)", severity: "RED", category: "Seguridad", description: "Todo input de usuario y contenido externo pasa por 7 capas: structured prompts, input validation, system prompt isolation, output monitoring, HITL, least privilege, monitoring + audit. OWASP LLM Top 10 LLM01." },
  { code: "P13", title: "Auto-Crítica Obligatoria (Anti Complacencia)", severity: "RED", category: "Gobernanza", description: "Todo artefacto pasa auto-crítica antes de publicarse: Modo A (3 debilidades reales) + Modo D (2 vectores de ataque si toca seguridad). Tabla AGREE/DISAGREE obligatoria; cero DISAGREEs es sospechoso." },
  { code: "P14", title: "Headless Browser Verification (No curl aislado)", severity: "RED", category: "Verificación", description: "Un HTTP 200 con HTML vacío es éxito falso. Toda verificación de rutas HTML usa browser headless: console errors, network failures, screenshot, WCAG, 7-pos layout, sticky footer, paleta Apple." },
  { code: "P15", title: "Expected-First Workflow (Expectativas Antes)", severity: "RED", category: "Verificación", description: "ANTES de implementar: documento de expectativas con wireframe ASCII, estados, comportamiento, rendimiento y 8-15 criterios de aceptación. DESPUÉS: expected-check compara real vs esperado con veredicto MATCH/BETTER/WORSE/FAIL." },
  { code: "P16", title: "Estándar Enterprise de Paneles Administrativos (CRUD Completo)", severity: "RED", category: "UI/UX", description: "Todo admin/account/users panel con sidebar cumple AGENTS.md §11 antes de DONE: scroll vertical y horizontal sin errores con beauty scroll panels; dashboard por módulo; soft delete con papelera + hard delete; listado con paginación/filtros/dots menu; forms create/edit como pageviews con URL propia (PROHIBIDO modal box) en doble modalidad wizard/avanzado; datos relacionados consultables en el form; batch processes (export, toggle status, soft/hard delete, quick edit); detalles completos con tabs y URL propia. Verificación P14 headless + P15 expected-first; omisiones = gaps declarados." },
  { code: "P17", title: "Cola de Trabajo de Creación Continua (Work Queue Agéntico)", severity: "RED", category: "UI/UX", description: "Todo flujo de creación soporta registros distintos uno tras otro (§11.6): 'Guardar y crear otro', cola visible con estado por ítem (borrador/guardando/guardado/reintentando/fallido), autosave con rehidratación, reintentos rate-limit aware (backoff exponencial + jitter + presupuesto de intentos por ventana — PROHIBIDO el bucle 429 en cascada), idempotency keys; toasts con presupuesto visual agregados/deduplicados (§11.7, máx 3 visibles, '+N más') y errores terminales estacionados en el centro de notificaciones para acciones human-in-the-loop (Reintentar/Editar/Descartar) sin bloquear la cola. Verificación P14+P15 con §11.6/§11.7 como CAs numerados." },
  { code: "P18", title: "Arquitectura Event-Driven para SaaS y Data Streaming", severity: "RED", category: "Arquitectura", description: "Toda app SaaS (multi-tenancy, suscripciones, billing, colaboración) o con data streaming (tiempo real, feeds, push, chat, telemetría, live dashboards) se construye sobre arquitectura event-driven (§12): event bus central con eventos tipados versionados (metadata tenant/actor/correlation/causation); caching multi-capa con invalidación por eventos (claves por tenant); hooks y filters before/after/around con veto; queuing subsystems con backpressure, prioridades y DLQ reprocesable human-in-the-loop; fast inner pipelines (parse→validate→enrich→persist→broadcast) con batching/coalescing; data transport tipado por contrato; broadcasting WebSocket/SSE con rooms por tenant y rehidratación al reconectar. PROHIBIDO emular tiempo real con polling. Verificación P14+P15 con §12.7 como CAs." },
  { code: "W-CTA", title: "Glowing CTA Button en Estados Listos", severity: "YELLOW", category: "UI/UX", description: "Cuando un botón de acción primaria se habilita por condición cumplida, DEBE usar el widget GlowingCtaButton: gradient #0071e3→#005bb5, glow sutil pulsante 2.4s, máx 12-16px, prefers-reduced-motion respetado." },
];

// ── Comandos Canónicos (AGENTS.md §0) ────────────────────────────────────
const COMMANDS = [
  { name: "start", aliases: "inicia", action: "Bootstrap completo: verificación de servicios, migración de esquemas, seed demo y arranque de servidores", methodology: "Protocolo de Arranque §1", description: "Levanta el sistema: verifica DB, aplica schema, siembra datos demo y arranca servidores." },
  { name: "cold run", aliases: "cold-run", action: "Auditoría exhaustiva sin modificar archivos: tipos, contratos, seguridad, EAV y adherencia arquitectónica", methodology: "Auditoría de Premisas §2", description: "Radiografía del estado actual sin mutar nada: evalúa adherencia a las 15 reglas cardinales." },
  { name: "itera", aliases: "itera N", action: "Procesa hasta N tareas pendientes del worklog consultando anti-patterns para evitar errores históricos", methodology: "Ciclo de Desarrollo §2", description: "Ejecuta tareas pendientes del worklog en orden, consultando memoria para no reincidir." },
  { name: "verify", aliases: "verifica", action: "Batería completa de puertas de calidad deterministas. Emite reporte de Gate Honesty", methodology: "Regla Cardinal P2", description: "Corre las puertas de calidad y reporta PASS/FAIL/NOT RUN con honestidad absoluta." },
  { name: "audit memory", aliases: "audita memoria", action: "Compara el código contra anti-patterns.md. Falla si detecta reintroducción de antipatrón conocido", methodology: "Memoria Episódica §8", description: "Audita contra los 28 anti-patrones históricos del ledger." },
  { name: "sil trend", aliases: "tendencia", action: "Regenera state.json y KPIs K1-K5, balance de victorias W1-W8", methodology: "Framework PSIM §4.1", description: "Recalcula los 5 KPIs de trayectoria y el balance de 8 clases de victoria desde los ledgers." },
  { name: "pre cycle", aliases: "ciclo pre", action: "Juez determinista de mutación de reglas PRE-v2.0 sobre propuesta en staging", methodology: "Gobernanza PRE-v2.0 §4.2", description: "Evalúa propuestas con la fórmula constitucional S = Σ(wi·Di) y promueve si ΔS ≥ 5.0." },
  { name: "report", aliases: "reporte", action: "Informe de cierre con veredicto AGREE/DISAGREE, Porter, costos y handoff en docs/reports/<epoch>", methodology: "Cierre de Sesión §9", description: "Genera el informe époch inmutable con auto-crítica Modo A/D y tabla AGREE/DISAGREE." },
  { name: "ui test", aliases: "ui-test", action: "MCP browser-devtools contra la ruta: 7 posiciones, paleta Apple, WCAG 2.1 AA, sticky footer, cero errores consola", methodology: "Superficie de Consumo Fase 3", description: "Verificación en navegador real de la superficie de consumo." },
  { name: "persona check", aliases: "personas", action: "Itera perfiles de persona (executive, operator, analyst, apprentice, demo-master + cold-run) verificando meta W6", methodology: "Framework PSIM W6", description: "Verifica que cada persona cumple su meta; falla sin OnboardingTour en vistas complejas." },
  { name: "ide", aliases: "ides", action: "Genera prompt extendido que ordena al IDE autoaplicar AGENTS.md. Todo prompt se trata como canónico", methodology: "Auto-Activation Layer", description: "Capa de auto-activación: cualquier prompt del operador se trata como comando canónico." },
  { name: "mejorate", aliases: "improve yourself", action: "Auto-mejora: escanea repos de referencia en GitHub read-only, extrae patrones agénticos, propone adoptions via PRE-v2.0", methodology: "Auto-Improvement Loop", description: "Scan read-only + synthesize con LLM: el sistema se auto-mejora sin intervención." },
  { name: "investiga", aliases: "research", action: "Investiga en internet asumiendo falta de conocimientos: web_search + page_reader + síntesis + adoptions", methodology: "Research Loop", description: "Descubre amenazas emergentes y state-of-the-art en tiempo real." },
  { name: "critica", aliases: "auto-critica", action: "Auto-crítica de artefacto: Modo A (3 debilidades) + Modo D (2 vectores de ataque). Tabla AGREE/DISAGREE", methodology: "Adversarial Self-Review", description: "Auto-crítica obligatoria anti-complacencia de todo artefacto producido." },
  { name: "expected-check", aliases: "expectativas", action: "Compara resultado real vs expectativa previa via browser headless. Veredicto MATCH/BETTER/WORSE/FAIL", methodology: "Expected-First Verification", description: "Compara lo obtenido contra lo esperado con veredicto MATCH/BETTER/WORSE/FAIL." },
  { name: "radiografia", aliases: "reverse-engineer, rayos-x", action: "Radiografía de ingeniería inversa integral: branding, DOM, shaders 3D, modelo de negocio → especificación canónica", methodology: "Pipeline Rayos X §5", description: "Pipeline de 5 etapas: branding → shaders 3D → modelo de negocio → reconstrucción → verificación." },
];

// ── Memoria: Anti-Patrones (AP-001..AP-028) ──────────────────────────────
const ANTI_PATTERNS = [
  ["AP-001", "Falso Éxito por No-Op", "Scripts regex que no coinciden silenciosamente y reportan éxito. Corrección: Regla P1 Read-After-Edit.", "CRITICA"],
  ["AP-002", "Invocación Directa de APIs LLM", "Controladores que importan SDKs de proveedores sin Control Plane L2. Corrección: Regla P8.", "CRITICA"],
  ["AP-003", "Omisión de Tenant ID", "Filtración cruzada de datos entre tenants. Corrección: RLS + tenantId obligatorio en toda query.", "CRITICA"],
  ["AP-004", "Puertas Falsificadas", "PASS cableado en CI sin ejecutar el comando real. Corrección: Regla P2 Gate Honesty.", "CRITICA"],
  ["AP-005", "Pruebas Aisladas sobre Stubs", "Tests que validan el mock, no la implementación real. Corrección: Regla P3.", "ALTA"],
  ["AP-006", "!important y Layout Monolítico", "Degradación visual por secuestro de cascada y HTML estático duplicado. Corrección: P5 + P6.", "ALTA"],
  ["AP-007", "Emojis y Placeholders Ficticios", "Correos +1 800 555-0199 y emojis rompen sobriedad Apple. Corrección: Regla P7 Zero-Placeholder.", "MEDIA"],
  ["AP-008", "Reintentos Ciegos sin Backoff", "Thundering herd ante fallo de proveedor. Corrección: backoff exponencial con jitter decorrelacionado.", "ALTA"],
  ["AP-009", "Sobreajuste de Modelos Costosos", "Tier mal asignado: razonamiento frontera para tareas triviales. Corrección: matriz de arquetipos L2.", "MEDIA"],
  ["AP-010", "Auto-Aprobación Complaciente", "LLM que relaja sus propias restricciones sin juez determinista. Corrección: PRE-v2.0 3 roles.", "CRITICA"],
  ["AP-011", "Borrado de Lecciones", "Sobrescribir memoria empírica rompe la inmutabilidad histórica. Corrección: Regla P9 append-only.", "CRITICA"],
  ["AP-012", "Falta de AbortController", "Hilos colgados por fetches sin cancelación.", "MEDIA"],
  ["AP-013", "Entornos Dev/Deploy No Declarados", "Bugs Windows↔Ubuntu por suposiciones de shell. Corrección: Regla P10.", "MEDIA"],
  ["AP-014", "Reportes Sin Convención de Nombrado", "Sin orden cronológico lexicográfico. Corrección: docs/reports/<epoch>-<title>.md.", "MEDIA"],
  ["AP-015", "Pantalla UI Compleja Huérfana de Onboarding", "Vistas complejas sin tour canónico fallan apprentice + demo-master. Corrección: Regla P11.", "ALTA"],
  ["AP-016", "Tour No Persistente", "OnboardingTour que se repite en cada visita. Corrección: persistir dismissal en localStorage.", "MEDIA"],
  ["AP-017", "Tour No Responsivo Ni Accesible", "Tour que falla WCAG en móvil. Corrección: foco por teclado + ARIA + responsive.", "MEDIA"],
  ["AP-018", "Sobrescritura de AGENTS.md por Script", "ide.sh corrompió la constitución. Detectado por Regla P1.", "CRITICA"],
  ["AP-019", "Auto-Mejora No Automatizada", "Fatiga meta: el sistema anti-fatiga requería intervención manual. Corrección: comando mejorate.", "ALTA"],
  ["AP-020", "Lectura de Archivo Gigante de Golpe", "Contexto desperdiciado leyendo archivos completos. Corrección: navegación acotada ACI por rangos de líneas.", "MEDIA"],
  ["AP-021", "Mejorate Sin Investigar Internet", "Scan de repos estáticos no descubre amenazas emergentes. Corrección: comando investiga.", "ALTA"],
  ["AP-022", "Prompt Sin Delimitadores Canónicos", "Input externo mezclado con instrucciones de sistema. Corrección: capa 1 del protocolo P12.", "CRITICA"],
  ["AP-023", "Input Sin Sanitization", "Decode-then-validate omitido permite typoglycemia injection. Corrección: capa 2 P12.", "CRITICA"],
  ["AP-024", "Tools Excesivos Sin Least Privilege", "Agente con acceso completo a red/DB. Corrección: capa 6 P12 sandbox + allowlist.", "ALTA"],
  ["AP-025", "Sin Audit Log de Ingesta", "Contenido externo procesado sin registro inmutable. Corrección: capa 7 P12 l2_cost_token_ledger.", "ALTA"],
  ["AP-026", "Auto-Crítica Omitida", "Artefacto publicado sin Modo A/D. Corrección: Regla P13 + comando critica.", "ALTA"],
  ["AP-027", "Verificación por curl/fetch Aislado de HTML", "HTTP 200 con HTML vacío es éxito falso. Corrección: Regla P14 browser headless.", "CRITICA"],
  ["AP-028", "Generación Sin Expectativas Previas", "Implementar sin documento de expectativas produce desviaciones frustrantes. Corrección: Regla P15 expected-first.", "ALTA"],
  ["AP-034", "CRUD Incompleto en Paneles Administrativos", "Paneles al mínimo viable: modal box sin URL, sin papelera, sin batch, detalles en modal. Corrección: Regla P16 + §11 (pageviews, wizard/avanzado, batch, tabs, beauty scrolls).", "ALTA"],
  ["AP-035", "Cola sin Presupuesto de Reintentos y Toasts Saturando la Pantalla", "Reintentos en bucle que agravan el rate limit (429 en cascada), un toast por registro que satura la webview y errores que bloquean o mueren en consola. Corrección: Regla P17 + §11.6/§11.7 (backoff+jitter+presupuesto, toasts acotados agregados, errores a notificaciones human-in-the-loop).", "ALTA"],
  ["AP-036", "SaaS/Streaming sobre Request-Response Acoplado", "Llamadas síncronas punto a punto, caches por TTL, trabajo asíncrono en el request cycle y polling como tiempo real. Corrección: Regla P18 + §12 (event bus, caching por eventos, hooks/filters, colas con DLQ, pipelines, broadcasting con rehidratación).", "ALTA"],
];

// ── Memoria: Victorias (WIN-001..WIN-015) ────────────────────────────────
const WINS = [
  ["WIN-001", "Constitución AGENTS.md", "Documento cero que rige operaciones de cualquier agente o humano. 15 reglas cardinales + pipeline 5 fases.", "W1"],
  ["WIN-002", "Desacoplamiento L2 Control Plane", "Envelope XML canónico, registry multi-proveedor, circuit breakers con matemática de resiliencia.", "W1"],
  ["WIN-003", "Gobernanza PRE-v2.0", "3 roles separados: Ejecutor, Optimizador, Juez determinista. Puntuación constitucional S con 6 dimensiones ponderadas.", "W4"],
  ["WIN-004", "Memoria Append-Only", "Ledgers inmutables de anti-patrones y victorias. Ningún LLM olvida restricciones del proyecto.", "W1"],
  ["WIN-005", "Matriz Polyglot 6 Lenguajes", "TS/Py/Go/Rust/PHP/C++ con equivalencias exactas por fase del pipeline.", "W1"],
  ["WIN-006", "Catálogos 1-100", "100 best-practices + 100 anti-patterns + 100 killer features consultados en Fase 0.", "W1"],
  ["WIN-007", "Matriz MCP 5+5", "5 servidores MCP obligatorios (filesystem, worktree, LSP, postgres, browser) + 5 skills modulares.", "W1"],
  ["WIN-008", "CI/CD Gate Honesty", "Workflows que declaran NOT RUN en vez de PASS falso. YAML en docs/ci-workflows/.", "W7"],
  ["WIN-009", "Cobertura 100% Prompts Operativos", "Comandos ui test y persona check añadidos. Regla P10 de entornos.", "W1"],
  ["WIN-010", "Joyride + Ecosistema Personas", "Widget OnboardingTour canónico + 10 personas (6 operativas + 4 cold-run attacker).", "W1"],
  ["WIN-011", "Comando ide 16 IDEs", "Auto-activation layer: todo prompt del operador se trata como canónico sin escribir el prefijo.", "W1"],
  ["WIN-012", "Comando mejorate + 10 repos", "Auto-mejora: scan read-only de repos de referencia → síntesis → adoptions via PRE-v2.0.", "W1"],
  ["WIN-013", "Protocolo Anti-Injection 7 Capas", "OWASP LLM01 mitigado con 7 capas desde structured prompts hasta audit inmutable.", "W1"],
  ["WIN-014", "Auto-Crítica Obligatoria", "Modo A (self-revision) + Modo D (adversario) en todo artefacto. Tabla AGREE/DISAGREE.", "W4"],
  ["WIN-015", "Headless Verify + Expected-First", "P14 browser headless + P15 expectativas previas con veredicto MATCH/BETTER/WORSE/FAIL.", "W1"],
  ["WIN-020", "Estándar Enterprise de Paneles Canonizado", "Regla P16 + §11: todo panel nace completo (dashboard, papelera, wizard/avanzado, batch, tabs) desde la primera iteración.", "W1"],
  ["WIN-021", "Work Queue Agéntico + Event-Driven Canonizados", "Reglas P17 (cola con autosave, reintentos rate-limit aware, toasts sin saturar, human-in-the-loop) + P18 (event bus, caching por eventos, DLQ, broadcasting) heredadas por todo scaffold.", "W1"],
];

// ── Patrones extraídos del scan real (mejorate scan de radiografía) ──────
const PATTERNS = [
  { repo: "browser-use/browser-use", category: "agent-arch", pattern: "AGENTS.md + skills/ en raíz: arquitectura de agente navegador con constitución embebida y skills cargables", evidence: "AGENTS.md, CLAUDE.md, skills/, browser_use/ — 116,983 estrellas" },
  { repo: "browser-use/browser-use", category: "aci", pattern: "DOM accesible + visión artificial combinados: extracción de jerarquía de elementos interactivos y capturas por sección", evidence: "browser_use/ core + examples/ — alimenta Fase 0 (auditoría) y Fase 3 (superficie)" },
  { repo: "mendableai/firecrawl", category: "extraccion", pattern: "Skills versionadas por producto (firecrawl-skills, firecrawl-cli-skills, firecrawl-workflows): separación de capacidades por superficie de consumo", evidence: "dirs firecrawl-skills/, firecrawl-cli-skills/, apps/api/native/src/crawler.rs" },
  { repo: "mendableai/firecrawl", category: "extraccion", pattern: "Crawler nativo Rust + workflows Playwright: crawling completo a Markdown/sitemap/JSON limpio para LLMs", evidence: "crawler.rs + deploy-playwright.yml + scrape-evals.yml — 187,706 estrellas" },
  { repo: "punkpeye/awesome-mcp-servers", category: "mcp-catalog", pattern: "Catálogo curado de servidores MCP incluyendo Chrome DevTools Protocol, Puppeteer y volcadores de red para inspección WebGL/GLSL", evidence: "95,761 estrellas — matriz de ejecución técnica del sistema" },
  { repo: "modelcontextprotocol/servers", category: "mcp-tools", pattern: "Servidores oficiales con contrato JSON estricto: filesystem, git, memory, sequentialthinking, fetch, time", evidence: "src/everything/AGENTS.md, .mcp.json — 90,947 estrellas" },
  { repo: "abi/screenshot-to-code", category: "replicacion", pattern: "Pipeline multimodal screenshot→código: tools de preview de screenshot + reportes de prompt para depuración visual", evidence: "backend/agent/tools/screenshot_preview.py, fs_logging/prompt_reports.py" },
  { repo: "e2b-dev/fragments", category: "sandbox", pattern: "Sandbox-templates por stack (Next.js, Vite, Gradio, Three.js): aislamiento de ejecución con build.dev/build.prod separados", evidence: "sandbox-templates/gradio-developer/, app/api/sandbox/route.ts" },
  { repo: "crewAIInc/crewAI-tools", category: "subagentes", pattern: "MCP adapter + browser toolkit: herramientas empaquetadas como skills con equipos de agentes especializados", evidence: "crewai_tools/adapters/mcp_adapter.py, browser_session_manager.py" },
  { repo: "microsoft/autogen", category: "personas", pattern: "Equipo de agentes con prompts por rol (Developer, DeveloperLead, ProductManager) + Sandbox.cs: orquestación tipo squad", evidence: "dotnet/samples/dev-team/.../DeveloperPrompts.cs, PMPrompts.cs" },
  { repo: "assafelovic/gpt-researcher", category: "research", pattern: "SKILL.md + references/*.md con carga lazy (mcp, multi-agents, prompts): investigación comprensiva modular", evidence: ".claude/SKILL.md, .claude/references/mcp.md, .cursorrules, mcp-server/" },
  { repo: "Significant-Gravitas/AutoGPT", category: "orchestration", pattern: ".claude/skills/*/SKILL.md con scripts bash deterministas por skill (capacity.sh, classify-pane.sh): orquestación de paneles", evidence: ".claude/skills/orchestrate/, .agents/ — 187,652 estrellas" },
];

// ── L2 Model Registry (arquetipos §3.4) ──────────────────────────────────
const L2_MODELS = [
  { name: "Gemini 2.5 Flash (Vision)", provider: "Google", tier: "REASONING_FRONTIER", latencySlaMs: 8000, role: "PRIMARY", archetype: "Vision-to-Spec", status: "CLOSED", failRate: 0.02, samples: 128 },
  { name: "Qwen 2.5 VL 72B", provider: "Ollama (local)", tier: "GENERAL_PURPOSE", latencySlaMs: 8000, role: "FALLBACK", archetype: "Vision-to-Spec", status: "CLOSED", failRate: 0.05, samples: 64 },
  { name: "Claude 4.5 Sonnet", provider: "Anthropic", tier: "REASONING_FRONTIER", latencySlaMs: 12000, role: "ESCALATION", archetype: "Vision-to-Spec", status: "CLOSED", failRate: 0.01, samples: 32 },
  { name: "DeepSeek V3.2", provider: "DeepSeek", tier: "GENERAL_PURPOSE", latencySlaMs: 4000, role: "PRIMARY", archetype: "Accounting-OCR", status: "CLOSED", failRate: 0.03, samples: 96 },
  { name: "GPT-4.1 mini", provider: "OpenAI", tier: "GENERAL_PURPOSE", latencySlaMs: 4000, role: "FALLBACK", archetype: "Accounting-OCR", status: "CLOSED", failRate: 0.02, samples: 48 },
  { name: "Llama 3.3 70B (Groq)", provider: "Groq", tier: "FAST_CHEAP", latencySlaMs: 800, role: "PRIMARY", archetype: "Commerce-Bot", status: "CLOSED", failRate: 0.01, samples: 512 },
  { name: "Cerebras Llama 3.1 8B", provider: "Cerebras", tier: "FAST_CHEAP", latencySlaMs: 800, role: "FALLBACK", archetype: "Commerce-Bot", status: "CLOSED", failRate: 0.01, samples: 256 },
  { name: "Mistral Small (vLLM)", provider: "vLLM local", tier: "SLM_MICRO", latencySlaMs: 2000, role: "ESCALATION", archetype: "Commerce-Bot", status: "CLOSED", failRate: 0.04, samples: 128 },
  { name: "Micro-SLM Local (vLLM)", provider: "vLLM local", tier: "SLM_MICRO", latencySlaMs: 90, role: "PRIMARY", archetype: "Fraud-Guard", status: "CLOSED", failRate: 0.005, samples: 1024 },
  { name: "Motor de Reglas L1", provider: "Determinista", tier: "SLM_MICRO", latencySlaMs: 5, role: "FALLBACK", archetype: "Fraud-Guard", status: "CLOSED", failRate: 0.0, samples: 2048 },
  { name: "GLM-4.6 (z-ai)", provider: "Z.AI", tier: "GENERAL_PURPOSE", latencySlaMs: 6000, role: "PRIMARY", archetype: "Console", status: "CLOSED", failRate: 0.01, samples: 42 },
];

// ── Propuestas iniciales de adopción (del scan + pipeline de radiografía) ─
const PROPOSALS = [
  { title: "Pipeline de Radiografía Rayos X como comando canónico 17", type: "KILLER", origin: "mejorate scan (pipeline del operador)", description: "Comando canónico 17 que despliega servidores MCP y ejecuta el pipeline de radiografía de 5 fases sobre cualquier URL: extracción de branding y tokens, análisis DOM con detección de shaders 3D WebGL, radiografía del modelo de negocio hacia esquema SQL y contratos OpenAPI 3.1, reconstrucción modular con widgets EAV y verificación headless P14. Cada fase registra fallback determinista ante errores, sanitiza el contenido externo (P12) y anexa hallazgos al ledger inmutable de memoria empírica." },
  { title: "Skill browser-radiography: DOM accesible + visión", type: "SKILL", origin: "browser-use/browser-use", description: "Skill de navegación agéntica que combina visión artificial y análisis del DOM accesible para extraer la jerarquía exacta de elementos interactivos por sección del sitio objetivo. Mapea el user journey completo (login, carritos, dashboards) antes de clonar, captura pantallas por sección para el pipeline multimodal, valida el esquema JSON de hallazgos contra el contrato canónico y degrada a extracción HTML determinista ante errores de navegador con retry y backoff." },
  { title: "Skill crawl-to-llm: sitios completos a Markdown/JSON", type: "SKILL", origin: "mendableai/firecrawl", description: "Motor de crawling que rastrea subpáginas institucionales, catálogos, términos legales y documentación del objetivo, convirtiéndolos en Markdown limpio, sitemap y esquema JSON estructurado para LLMs. Extrae metadatos SEO y OpenGraph, elimina scripts residuales, respeta la política Zero-Placeholder al poblar el catálogo del tenant, e implementa fallback con reintentos y circuit breaker ante errores HTTP en cada fase de extracción." },
  { title: "Skill devtools-inspector: WebGL/GLSL + getComputedStyle", type: "MCP", origin: "punkpeye/awesome-mcp-servers + modelcontextprotocol/servers", description: "Servidores MCP con Chrome DevTools Protocol y Puppeteer que inyectan scripts en la consola del navegador en cada fase de la radiografía: inspeccionan instancias WebGL, extraen geometrías, texturas, shaders GLSL y vuelcan propiedades computadas CSS (getComputedStyle, keyframes, GSAP) hacia tokens normalizados. Los resultados se validan contra esquema JSON estricto con verificación por sección; ante errores de protocolo se aplica fallback determinista con retry y backoff, y el tráfico interceptado alimenta los contratos OpenAPI 3.1, los widgets EAV y el ledger inmutable de memoria." },
  { title: "Skill screenshot-to-tokens: capturas a componentes tipados", type: "SKILL", origin: "abi/screenshot-to-code", description: "Pipeline multimodal que convierte capturas por sección en marcado declarativo tipado (React, Tailwind), extrayendo proporciones espaciales, tipografías y sombras para normalizarlas a tokens Apple Light (#ffffff, #f5f5f7, #1d1d1f, #86868b, #0071e3). Cada componente generado se valida contra el contrato de widgets EAV del pipeline (fase 3), con manejo de errores por imagen y fallback a extracción regex del DOM." },
  { title: "Skill sandbox-compiler: verificación WebGL aislada", type: "SKILL", origin: "e2b-dev/fragments", description: "Entorno sandbox aislado donde el agente ensambla el clon de la escena Three.js, verifica que los shaders compilen sin errores WebGL en cada iteración y mide la tasa de FPS antes de incorporar el componente al monorepo. Cumple la regla de aislamiento de la fase 5 del pipeline: cada compilación emite contrato de salida en esquema JSON, los tokens y widgets EAV resultantes se validan contra la arquitectura canónica, y los errores activan retry acotado con backoff y abort controlado ante fallos consecutivos, anexando la evidencia al ledger de memoria." },
  { title: "Squad de subagentes: extractor + analista + sintetizador", type: "BP", origin: "crewAIInc/crewAI-tools", description: "Best practice de orquestación con división de tareas entre subagentes tipados: un extractor de assets, un analista de contratos y API, y un sintetizador de arquitectura. Cada subagente opera en su fase del pipeline de extracción y reconstrucción, reporta mediante eventos con esquema JSON validado y verificación por etapa, y el orquestador aplica fallback determinista ante errores de un miembro con retry y backoff, anexando la evidencia al ledger inmutable de memoria y los tokens de la arquitectura PSIM." },
  { title: "Biblioteca local de skills de ingeniería inversa", type: "SKILL", origin: "microsoft/autogen", description: "Registro persistente de funciones de ingeniería inversa (extractor de fuentes tipográficas, decodificador de mallas .gltf/.glb, dump de getComputedStyle) en una biblioteca local invocable de forma determinista por el agente. Cada skill declara su contrato JSON de entrada/salida, pertenece a una fase del pipeline de radiografía, y gestiona errores con fallback y retry sin reescribir código por iteración." },
  { title: "Skill market-porter: auditoría de modelo de negocio", type: "SKILL", origin: "assafelovic/gpt-researcher", description: "Investigación autónoma del modelo de negocio del objetivo: mapea pricing y planes, analiza propuestas de valor, extrae testimonios para identificar pain points, y audita canales de distribución y pasarelas de pago. El material alimenta las 5 Fuerzas de Porter y las 12 Personas de POV; los hallazgos se validan contra esquema JSON con fallback ante fuentes caídas y se anexan a la memoria del proyecto." },
  { title: "Blocks de orquestación secuencial por lotes", type: "BP", origin: "Significant-Gravitas/AutoGPT", description: "Bloques modulares preconstruidos para procesamiento de peticiones web, análisis de sitemaps, parsing de API REST/GraphQL y ejecución en sandboxes locales, orquestando la extracción secuencial de un sitio completo en lotes. Cada bloque declara su contrato de entrada/salida JSON, pertenece a una fase del pipeline, y los errores activan retry con backoff y registro inmutable en el ledger de auditoría." },
  { title: "Contratos JSON interceptados → OpenAPI 3.1", type: "BP", origin: "modelcontextprotocol/servers (fetch/puppeteer)", description: "Best practice para interceptar el tráfico XHR/Fetch del objetivo en la fase de auditoría y documentar contratos JSON no documentados y los payloads con que el sitio hidrata sus gráficos Three.js. Cada contrato se valida con un ejecutor determinista fase por fase antes de programar los clientes de backend, se versiona en el esquema OpenAPI 3.1 canónico del sistema junto a los tokens y widgets EAV, y los errores de red activan fallback con circuit breaker y backoff en lugar de reintentos ciegos, con registro inmutable en el ledger de auditoría de memoria." },
];

async function main() {
  console.log("[SEED] Poblando Agent OS...");

  // Limpiar (solo para re-seed idempotente)
  await db.commandLog.deleteMany();
  await db.costLedgerEntry.deleteMany();
  await db.report.deleteMany();
  await db.radiografiaRun.deleteMany();
  await db.adoptionProposal.deleteMany();
  await db.extractedPattern.deleteMany();
  await db.scanRun.deleteMany();
  await db.referenceRepo.deleteMany();
  await db.memoryEntry.deleteMany();
  await db.psimState.deleteMany();
  await db.l2Model.deleteMany();
  await db.commandDef.deleteMany();
  await db.cardinalRule.deleteMany();

  // Reglas
  await db.cardinalRule.createMany({
    data: RULES.map((r, i) => ({ ...r, order: i + 1 })),
  });
  console.log(`[SEED] ${RULES.length} reglas cardinales`);

  // Comandos
  await db.commandDef.createMany({
    data: COMMANDS.map((c, i) => ({ ...c, order: i + 1 })),
  });
  console.log(`[SEED] ${COMMANDS.length} comandos canónicos`);

  // Memoria: anti-patrones
  await db.memoryEntry.createMany({
    data: ANTI_PATTERNS.map(([code, title, content, severity]) => ({
      type: "ANTI_PATTERN", code: code as string, title: title as string,
      content: content as string, severity: severity as string, epoch: EPOCH - 86400,
    })),
  });

  // Memoria: victorias
  await db.memoryEntry.createMany({
    data: WINS.map(([code, title, content, winClass]) => ({
      type: "WIN", code: code as string, title: title as string,
      content: content as string, winClass: winClass as string, epoch: EPOCH - 43200,
    })),
  });
  console.log(`[SEED] ${ANTI_PATTERNS.length} anti-patrones + ${WINS.length} victorias`);

  // Memoria: user / feedback / project / reference
  await db.memoryEntry.createMany({
    data: [
      { type: "USER", title: "Operador: Yosiet Serga", content: "yosietserga, Venezuela. PHP/Symfony/Laravel/WordPress + React/ReactNative. Stack split: desarrolla en Windows, despliega en Ubuntu VPS (P10). Estilo pragmático, enterprise-grade, sin sobre-explicar. Fatiga cero: erradicar repetición de directrices es prioridad máxima.", epoch: EPOCH - 86400 * 7 },
      { type: "FEEDBACK", title: "NO usar emojis en UI", content: "Why: rompe sobriedad Apple Light Mode. How to apply: SVG icons only.", epoch: EPOCH - 86400 * 6 },
      { type: "FEEDBACK", title: "NO !important en CSS", content: "Why: secuestra cascada. How: variables CSS y tokens.", epoch: EPOCH - 86400 * 6 },
      { type: "FEEDBACK", title: "Reportes con epoch time", content: "Why: orden cronológico lexicográfico. How: docs/reports/<epoch>-<title>.md.", epoch: EPOCH - 86400 * 5 },
      { type: "FEEDBACK", title: "Joyrides automáticos", content: "Why: pantallas complejas sin onboarding fallan Apprentice. How: widget OnboardingTour canónico (P11).", epoch: EPOCH - 86400 * 4 },
      { type: "FEEDBACK", title: "Auto-mejora del sistema", content: "Why: si el sistema erradica fatiga, debe auto-mejorarse sin intervención. How: comando mejorate escanea repos de referencia y propone adoptions.", epoch: EPOCH - 86400 * 3 },
      { type: "PROJECT", title: "Radiografía de Ingeniería Inversa", content: "Pipeline de 5 etapas para clonar software: (1) extracción visual y branding normalizado a Apple Light, (2) shaders y 3D Three.js via MCP DevTools, (3) modelo de negocio → PostgreSQL DDL + OpenAPI 3.1, (4) reconstrucción modular con widgets polimórficos, (5) verificación con reporte crítico epoch. Catálogo: 10 repos de referencia, 857,949 estrellas combinadas.", epoch: EPOCH - 7200 },
      { type: "PROJECT", title: "Estado actual del sistema", content: "Versión 1.6.0 del boilerplate asimilada. 16 comandos canónicos operativos. Este console ejecuta mejorate (scan + synthesize con LLM), PRE-v2.0 (juez determinista), sil trend (PSIM K1-K5) y radiografia (pipeline rayos X) en vivo.", epoch: EPOCH },
      { type: "REFERENCE", title: "yosietserga/agent-os-boilerplate", content: "https://github.com/yosietserga/agent-os-boilerplate — Documento cero: AGENTS.md universal, memoria empírica, L2 Control Plane, PRE-v2.0, PSIM, catálogos 1-100, MCP 5+5.", epoch: EPOCH - 86400 },
      { type: "WORKLOG", title: "Sesión: bootstrap del Agent OS Console", content: "Se clonó y procesó agent-os-boilerplate v1.6.0 completo (AGENTS.md, memoria, gobernanza, L2). Se ejecutó mejorate scan real contra GitHub API con el catálogo de 10 repos de radiografía del operador: 10/10 escaneados, 857,949 estrellas totales. Se construyó el Agent OS Console en Next.js con las 7 posiciones canónicas, OnboardingTour, GlowingCtaButton y juez PRE-v2.0 determinista. Siguiente: synthesize con LLM + radiografía en vivo.", epoch: EPOCH },
    ],
  });
  console.log("[SEED] Memoria user/feedback/project/reference/worklog");

  // Repos de referencia (datos del scan real)
  const scanResults = JSON.parse(await Bun.file("mejorate-scan-results.json").text());
  await db.referenceRepo.createMany({
    data: scanResults.map((r: any) => ({
      repo: r.repo, category: r.category, role: r.role, description: r.desc,
      stars: r.stars, sizeKb: r.sizeKb, language: r.language, branch: r.branch,
      topics: JSON.stringify(r.topics || []),
      topDirs: JSON.stringify(r.topDirs || []),
      keyFiles: JSON.stringify(r.keyFiles || []),
      ghDescription: r.ghDescription || null,
      lastScannedAt: new Date(),
    })),
  });
  console.log(`[SEED] ${scanResults.length} repos de referencia (scan real)`);

  // ScanRun + patrones
  const scanRun = await db.scanRun.create({
    data: {
      mode: "scan", reposScanned: scanResults.length,
      totalStars: scanResults.reduce((a: number, r: any) => a + (r.stars || 0), 0),
      status: "COMPLETED", finishedAt: new Date(),
      note: "Scan real via GitHub API (mejorate) — catálogo radiografía del operador",
    },
  });
  await db.extractedPattern.createMany({
    data: PATTERNS.map(p => ({ ...p, scanRunId: scanRun.id })),
  });
  console.log(`[SEED] ScanRun ${scanRun.id.slice(-6)} + ${PATTERNS.length} patrones extraídos`);

  // Propuestas de adopción (estado PROPOSED, pendientes de juez)
  await db.adoptionProposal.createMany({
    data: PROPOSALS.map(p => ({ ...p, status: "PROPOSED" })),
  });
  console.log(`[SEED] ${PROPOSALS.length} propuestas PRE-v2.0 en staging`);

  // PSIM
  const wCounts: Record<string, number> = {};
  for (const [, , , wc] of WINS) wCounts[wc as string] = (wCounts[wc as string] || 0) + 1;
  await db.psimState.create({
    data: {
      version: "1.6.0", epoch: EPOCH,
      k1: 0.92, k2: -3, k3: 1.6, k4: 2, k5: 6,
      w1: wCounts["W1"] || 0, w2: wCounts["W2"] || 0, w3: wCounts["W3"] || 0,
      w4: wCounts["W4"] || 0, w5: wCounts["W5"] || 0, w6: wCounts["W6"] || 0,
      w7: wCounts["W7"] || 0, w8: wCounts["W8"] || 0,
    },
  });
  console.log("[SEED] PSIM state K1-K5 + W1-W8");

  // L2 models
  await db.l2Model.createMany({ data: L2_MODELS });
  console.log(`[SEED] ${L2_MODELS.length} modelos en L2 registry`);

  // Ledger inicial (sesiones previas simuladas del propio sistema)
  await db.costLedgerEntry.createMany({
    data: [
      { model: "GLM-4.6 (z-ai)", tenant: "agent-os-console", purpose: "mejorate-synthesize", promptTokens: 2841, completionTokens: 1107, costUsd: 0.0129, latencyMs: 4210, outcome: "OK" },
      { model: "GLM-4.6 (z-ai)", tenant: "agent-os-console", purpose: "mejorate-synthesize", promptTokens: 3120, completionTokens: 1483, costUsd: 0.0161, latencyMs: 4890, outcome: "OK" },
      { model: "Qwen 2.5 VL 72B", tenant: "vision-satellite", purpose: "l2-infer", promptTokens: 5210, completionTokens: 892, costUsd: 0.0089, latencyMs: 6120, outcome: "FALLBACK" },
    ],
  });

  // Reporte de apertura
  await db.report.create({
    data: {
      epoch: EPOCH,
      title: "bootstrap-agent-os-console",
      verdict: "MIXED",
      content: "# Reporte de Apertura — Bootstrap del Agent OS Console\n\n## Veredicto por hipótesis\n\n| Hipótesis | Veredicto |\n| :-- | :-- |\n| El boilerplate es arquitectura de contexto, no código | AGREE |\n| mejorate scan ejecutable en vivo contra GitHub API | AGREE |\n| La consola puede operar los 16 comandos canónicos | AGREE (parcial: 8 ejecutan en vivo, 8 documentan) |\n| synthesize con LLM produce adoptions accionables | DISAGREE (pendiente de evidencia runtime) |\n\n## Auto-crítica Modo A\n1. El comando verify simula puertas sobre estado DB, no sobre compilación real del host.\n2. La verificación P14 debe ejecutarse con browser headless externo, no solo dentro del sandbox.\n3. El synthesize depende de un único proveedor LLM sin fallback real ejercitado.\n\n## Modo D (vectores)\n1. El PAT de GitHub viaja en memoria del servidor: rotar tras la sesión.\n2. Inputs de radiografía deben pasar capas 1-2 de P12 antes del LLM (sanitization implementada, monitoreo pendiente).",
    },
  });
  console.log("[SEED] Reporte de apertura + ledger");

  console.log("[SEED] Completado.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
