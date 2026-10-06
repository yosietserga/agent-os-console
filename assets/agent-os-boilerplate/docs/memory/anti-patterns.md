# Episodic Memory: Anti-Patterns & Known Pitfalls Ledger (Append-Only)

> **REGLA INVIOLABLE (P9):** Este archivo es **append-only**.
> Todo agente DEBE leer este archivo antes de planificar cambios (Fase 0).
> Si una propuesta técnica reintroduce un fallo aquí documentado, la tarea se
> considera fallida (Regla P3 del catálogo de antipatrones).
>
> Para corregir una entrada existente, NO la borres: anexa una nueva entrada con
> referencia `[CORRIGE-AP-XXX]`.

---

## [AP-001] Falso Éxito por No-Op en Scripts de Modificación
- **Fecha:** 2026-10-02
- **Causa Raíz:** Reemplazo de texto mediante scripts que asumieron un espaciado
  inexistente en el archivo real (regex no coincidió silenciosamente).
- **Impacto:** El agente reportó que el error estaba resuelto, pero el código
  permaneció sin cambios durante 79 iteraciones.
- **Regla Correctiva:** Aplicar obligatoriamente la **Regla P1 (Read-After-Edit)**.
  Tras editar un archivo, se debe volver a leer la sección modificada para
  verificar el diff real (`git diff` o lectura directa).

## [AP-002] Invocación Directa de APIs de LLM sin Control Plane L2
- **Fecha:** 2026-10-02
- **Causa Raíz:** Controladores llamaron directamente a librerías de OpenAI /
  Anthropic sin pasar por el bus de resiliencia.
- **Impacto:** Caídas masivas del sistema y errores HTTP 500 ante códigos 429
  del proveedor externo. Vendor lock-in total.
- **Regla Correctiva:** Toda inferencia DEBE encapsularse en el envelope canónico
  XML y pasar por el Circuit Breaker de L2 (**Regla P8 — Aislamiento LLM-Agnóstico**).

## [AP-003] Omisión de Tenant ID en Consultas Dinámicas EAV
- **Fecha:** 2026-10-02
- **Causa Raíz:** Consultas construidas dinámicamente omitieron el filtro
  `tenant_id` al resolver atributos polimórficos.
- **Impacto:** Filtración cruzada de datos entre organizaciones; riesgo grave de
  seguridad y cumplimiento.
- **Regla Correctiva:** Exigir `tenant_id` en cada consulta y activar Row Level
  Security (RLS) en PostgreSQL.

## [AP-004] Puertas de Validación Falsificadas (Typecheck PASS cableado)
- **Fecha:** 2026-10-02
- **Causa Raíz:** Scripts generaron reportes con `Typecheck: PASS` escrito a mano
  sin invocar el compilador.
- **Impacto:** Falsos verdes en CI; regresiones que llegaron a producción.
- **Regla Correctiva:** **Regla P2 (Gate Honesty)**: si no se ejecutó el comando,
  declarar `NOT RUN`. Toda afirmación de éxito debe adjuntar comando + exit code
  + stdout real.

## [AP-005] Pruebas Aisladas sobre Stubs (Overfit-Backend)
- **Fecha:** 2026-10-02
- **Causa Raíz:** Se crearon tests unitarios sobre stubs locales mientras el
  código de producción permanecía roto.
- **Impacto:** Suite verde, producción rota. Hallazgos cerrados falsamente.
- **Regla Correctiva:** **Regla P3 (Closes-Finding Guard)**: el archivo de
  producción debe contener la corrección sustantiva; el test debe validar
  comportamiento real.

## [AP-006] Inyección de Estilos con !important y Layout Monolítico
- **Fecha:** 2026-10-02
- **Causa Raíz:** Parches visuales con `!important` para secuestrar la cascada y
  archivos HTML/PHP monolíticos que ignoraron el motor de layout canónico.
- **Impacto:** Degradación de la consistencia visual, deuda técnica de UI
  inmanejable, rompimiento de la paleta Apple Light Mode.
- **Regla Correctiva:** **Reglas P5 y P6**: paleta inmutable modo claro Apple,
  layout canónico de 7 posiciones, cero `!important`.

## [AP-007] Uso de Emojis y Placeholders Ficticios en UI
- **Fecha:** 2026-10-02
- **Causa Raíz:** Plantillas heredadas con `+1 800 555-0199` y emojis en botones.
- **Impacto:** Pérdida de sobriedad visual, datos falsos en producción, riesgo de
  presentación a clientes.
- **Regla Correctiva:** **Regla P7 (Zero-Placeholder, Zero-Emoji)**: todos los
  datos deben provenir de la base de datos; solo iconos SVG.

## [AP-008] Reintentos Ciegos sin Backoff ante HTTP 429
- **Fecha:** 2026-10-02
- **Causa Raíz:** Bucles de reintento inmediato ante errores 429 del proveedor.
- **Impacto:** Agravamiento del throttle del proveedor, timeouts masivos en
  cascada.
- **Regla Correctiva:** Backoff exponencial con jitter decorrelacionado
  ($T_{\text{sleep}} = \min(T_{\max}, \text{random}(T_{\text{base}}, T_{\text{prev}} \times 3))$).
  Ver `docs/l2-control-plane/resilience-math.md`.

## [AP-009] Sobreajuste de Modelos Costosos para Tareas Triviales
- **Fecha:** 2026-10-02
- **Causa Raíz:** Uso de modelo de razonamiento de frontera (ej. o3) para
  clasificación binaria simple.
- **Impacto:** Costo innecesario, latencia degradada, agotamiento de presupuesto
  mensual.
- **Regla Correctiva:** Enrutamiento por tiers (SLM_MICRO / FAST_CHEAP /
  GENERAL_PURPOSE / REASONING_FRONTIER) en `l2_model_registry`.

## [AP-010] Auto-Aprobación Complaciente de Reglas por el Mismo LLM
- **Fecha:** 2026-10-02
- **Causa Raíz:** El agente ejecutor proponía y aprobaba sus propios cambios a
  `AGENTS.md`.
- **Impacto:** Relajación progresiva de las restricciones constitucionales.
- **Regla Correctiva:** **Gobernanza PRE-v2.0** (3 roles): el Ejecutor no puede
  tocar reglas; el Optimizador propone en rama aislada; el Juez Determinista
  (`packages/eval`, sin LLM) decide con $\Delta S \ge 5.0$.

## [AP-011] Borrado de Lecciones en Memoria (sobreescritura de ledgers)
- **Fecha:** 2026-10-02
- **Causa Raíz:** Un agente sobrescribió `anti-patterns.md` para "limpiar"
  entradas antiguas.
- **Impacto:** Pérdida de aprendizaje acumulado; reincidencia inmediata de un
  fallo corregido 3 meses antes.
- **Regla Correctiva:** **Regla P9 (Memoria Append-Only)**: solo se anexa, nunca
  se borra. Correcciones via `[CORRIGE-AP-XXX]`.

## [AP-012] Falta de AbortController en Inferencia LLM
- **Fecha:** 2026-10-02
- **Causa Raíz:** Llamadas a inferencia sin timeout; hilos colgados esperando
  respuesta del proveedor caído.
- **Impacto:** Agotamiento del pool de conexiones, degradación en cascada del
  servicio.
- **Regla Correctiva:** Todo `fetch` a LLM DEBE usar `AbortController` con el SLA
  del arquetipo satélite (800ms Commerce-Bot, 90ms Fraud-Guard, etc.).

## [AP-013] Entornos Dev/Deploy No Declarados
- **Fecha:** 2026-10-02
- **Causa Raíz:** Proyectos que desarrollan en Windows y despliegan en Ubuntu
  sin declarar el split en configuración; scripts asumen rutas o barras
  equivocadas y fallan en producción.
- **Impacto:** Bugs solo reproducibles en deploy (paths `\` vs `/`, saltos de
  línea CRLF vs LF, scripts `.sh` que no corren en Windows-dev sin WSL).
- **Regla Correctiva:** **Regla P10 (Entornos Dev/Deploy)**: `.env` define
  obligatoriamente `DEV_OS` y `DEPLOY_OS`. `.gitattributes` fuerza `eol=lf`.
  Los paths en código de producción usan `path.join()` o equivalente polyglot.

## [AP-014] Reportes de Sesión Sin Convención de Nombrado
- **Fecha:** 2026-10-02
- **Causa Raíz:** Múltiples sesiones agénticas generan reportes con nombres
  arbitrarios (`reporte-final.md`, `cierre-v2.md`, `reporte-final-definitivo.md`).
- **Impacto:** Imposible ordenar cronológicamente; Fase 0 no puede "leer los
  últimos 3 reportes" porque no hay orden determinista; pérdida de continuidad
  entre sesiones.
- **Regla Correctiva:** Convención `docs/reports/<epoch>-<kebab-title>.md`
  (AGENTS.md §8.3 v1.1.0). El epoch garantiza ordenamiento lexicográfico =
  ordenamiento temporal. Reportes son inmutables (Regla P9 extendida).

## [AP-015] Pantalla UI Compleja Huérfana de Onboarding (Violación Apprentice)
- **Fecha:** 2026-10-02
- **Causa Raíz:** El desarrollador/LLM implementa una vista densa (tableros,
  editores visuales, configuradores EAV, composer de layouts) asumiendo que el
  usuario ya conoce el modelo mental de la herramienta.
- **Impacto:** Falla la auditoría de `apprentice` y `demo-master` en
  `persona check`. Tasa de abandono alta en usuarios no técnicos. Demos que
  requieren ingeniero presente porque el prospect no se auto-guía.
- **Regla Correctiva Obligatoria:** **Regla P11 (Onboarding Tour Obligatorio
  en Vistas Complejas)** + widget canónico `OnboardingTour` (ver
  `docs/widgets/onboarding-tour.md`). Toda vista con >3 secciones interactivas,
  composer, o >3 métricas debe incluir un tour interactivo responsivo, accesible
  por teclado, con paleta Apple Light Mode (P5), zero-emoji (P7) y persistencia
  de estado por usuario para evitar repeticiones molestas.

## [AP-016] Tour Onboarding No Persistente (Repetición Molesta)
- **Fecha:** 2026-10-02
- **Causa Raíz:** Tour interactivo que se auto-arranca en cada sesión sin
  verificar si el usuario ya lo completó.
- **Impacto:** Atosigo al usuario; tasa de abandono del tour alta; usuarios
  experimentados odian la app; soporta solo la primera sesión, no la N-ésima.
- **Regla Correctiva:** Persistencia obligatoria con clave
  `tour_<tourKey>_completed` en localStorage o EAV attribute (según stack).
  Si `completed=true`, no autoStart en sesiones posteriores. Reset disponible
  en Settings → Restart onboarding tours (para demos).

## [AP-017] Tour Onboarding No Responsivo Ni Accesible
- **Fecha:** 2026-10-02
- **Causa Raíz:** Tour diseñado solo para desktop 1920×1080; en mobile 375px
  se desborda horizontalmente, no es operable por teclado, no tiene focus-trap.
- **Impacto:** Falla WCAG 2.1 AA; inutilizable en mobile; violación P6 (layout)
  y P5 (paleta) si el tour usa colores discordantes para "destacar".
- **Regla Correctiva:** Tour con placement 'auto' que detecta posición óptima,
  auto-ajuste a 375px sin overflow, focus-trap (Tab cicla dentro del tour),
  Esc cierra, Enter avanza, Shift+Enter retrocede. Ver `docs/widgets/onboarding-tour.md`.

## [AP-018] Sobrescritura de AGENTS.md por Script de Auto-Configuración
- **Fecha:** 2026-10-02
- **Causa Raíz:** El comando `ide` (v1.3.0) en su primera versión tenía a
  `codex` apuntando a `AGENTS.md` como archivo de config (porque Codex CLI
  lo lee nativamente). El script sobrescribía la constitución con el wrapper
  de auto-activación, destruyendo 471 líneas de gobernanza.
- **Impacto:** Casi se pierde la constitución inmutable. Detectado por la
  Regla P1 (Read-After-Edit) al verificar el archivo tras la generación.
  Restaurado inmediatamente desde git.
- **Regla Correctiva:** **Salvaguarda anti-sobrescritura** en `scripts/ide.sh`:
  el case pattern rechaza `AGENTS.md`, `docs/governance/*`, `docs/catalogs/*`,
  `docs/memory/anti-patterns.md`, `docs/memory/wins-ledger.md`,
  `docs/memory/state.json`, `docs/memory/worklog.md`. Codex CLI ahora genera
  `CODEX.md` aparte como wrapper; AGENTS.md queda intacto. **Lección: todo
  script que genere archivos debe tener una lista negra de archivos
  constitucionales que NUNCA sobrescribirá.**

---

> **Instrucción para nuevos agentes:** al descubrir un antipatrón nuevo durante
> tu sesión, anexa una entrada `## [AP-XXX]` con Fecha, Causa Raíz, Impacto y
> Regla Correctiva. **Nunca edites entradas existentes.**

## [AP-019] Auto-Mejora No Automatizada (Fallo Meta del Sistema)
- **Fecha:** 2026-10-02
- **Causa Raíz:** El sistema declaraba erradicar la fatiga del operador pero
  requería que el operador pasara manualmente nuevos patrones de aprendizaje.
  Si el sistema verdaderamente erradica la fatiga, debe auto-mejorarse sin
  intervención.
- **Impacto:** El operador tuvo que sugerir explícitamente escanear 10 repos
  de referencia. El sistema no lo hizo solo. Fatiga residual: alta.
- **Regla Correctiva:** **Comando canónico `mejorate`** (AGENTS.md §0, v1.4.0).
  El script `scripts/mejorate.sh` escanea 10 repos de referencia en GitHub
  en modo read-only, extrae patrones, propone adoptions via PRE-v2.0. El
  operador puede invocar `lee AGENTS.md, ejecuta: mejorate` periódicamente
  o el sistema puede schedulearlo (cron / GitHub Action).

## [AP-020] Lectura de Archivo Gigante de Golpe (Satura Contexto)
- **Fecha:** 2026-10-02
- **Causa Raíz:** Un agente LLM lee un archivo de 5000+ líneas en una sola
  llamada para "entenderlo", saturando la ventana de contexto y perdiendo
  precisión por truncado.
- **Impacto:** Tokens desperdiciados (caro), alucinaciones de "recuerdo",
  timeout del proveedor LLM, pérdida de información crítica.
- **Regla Correctiva:** **ACI (Agent-Computer Interface)** con `view_lines_window`
  máximo 100 líneas por llamada. Usar `view_repo_map` (tree-sitter) para
  orientarse primero. Si se necesitan más líneas, paginar con múltiples
  llamadas. Ver `docs/patterns/aci.md` (patrón SWE-agent).

---

> **Instrucción para nuevos agentes:** al descubrir un antipatrón nuevo durante
> tu sesión, anexa una entrada `## [AP-XXX]` con Fecha, Causa Raíz, Impacto y
> Regla Correctiva. **Nunca edites entradas existentes.**

## [AP-021] Mejorate Sin Investigar Internet (Fallo Meta 2)
- **Fecha:** 2026-10-02
- **Causa Raíz:** El comando `mejorate` (v1.4.0) solo escanea repos estáticos
  de GitHub. No investiga internet para descubrir amenazas emergentes ni
  state-of-the-art en tiempo real.
- **Impacto:** El sistema se auto-mejoraba con conocimiento estático pero
  perdía patrones nuevos publicados después del último commit de los repos
  de referencia. Vulnerabilidades como prompt injection 2026 no se detectaban.
- **Regla Correctiva:** **Comando `investiga <topic>`** (AGENTS.md §0, v1.5.0).
  El script `scripts/investiga.sh` usa z-ai CLI (`web_search` + `page_reader`)
  para buscar en internet en tiempo real, lee top 5 páginas, sintetiza en
  `docs/research/<epoch>-<topic>.md`, propone adoptions via PRE-v2.0.

## [AP-022] System Prompt Sin Delimitadores Canónicos
- **Fecha:** 2026-10-02
- **Causa Raíz:** LLMs que mezclan trusted instructions con user_input sin
  delimitadores claros, permitiendo override via "ignore previous".
- **Impacto:** OWASP LLM01 2026 (prompt injection, #1 por 2ª edición).
- **Regla Correctiva:** **Capa 1 del protocolo P12**: structured prompts con
  delimitadores canónicos (`<system>...</system> <user_input>...</user_input>`).

## [AP-023] Ausencia de Input Sanitization
- **Fecha:** 2026-10-02
- **Causa Raíz:** Validación con regex directo sobre raw input sin decode
  previo. Atacantes evaden con base64, unicode, HTML entities, typoglycemia.
- **Impacto:** Filtros bypassados; prompt injection exitoso.
- **Regla Correctiva:** **Capa 2 del protocolo P12**: decode-then-validate
  (base64/unicode/HTML entities → decode → regex). Normalizar typoglycemia
  (lowercase + leet replacement) antes de matchear.

## [AP-024] Tools con Privilegios Excesivos
- **Fecha:** 2026-10-02
- **Causa Raíz:** Tools LLM con filesystem global, network sin allowlist, o
  DB write sin confirmación.
- **Impacto:** Un prompt injection exitoso puede exfiltrar `.env`, borrar
  datos, o llamar APIs externas maliciosas.
- **Regla Correctiva:** **Capa 6 del protocolo P12**: least privilege. Sandbox
  filesystem (no access a `.env`, `secrets/`). Network allowlist. DB readonly
  por defecto; escritura solo con HITL.

## [AP-025] Ausencia de Audit Log en Llamadas LLM
- **Fecha:** 2026-10-02
- **Causa Raíz:** Llamadas al LLM sin log inmutable. Imposible forense
  post-incidente.
- **Impacto:** No se puede detectar patrón de ataque ni atribuir responsabilidad.
- **Regla Correctiva:** **Capa 7 del protocolo P12**: comprehensive monitoring
  + audit. Log de todas las entradas/salidas del LLM con hash. Audit trail
  inmutable (Regla P9) en `l2_cost_token_ledger`.

## [AP-026] Auto-Crítica Omitida (Auto-Aprobación Complaciente Generalizada)
- **Fecha:** 2026-10-02
- **Causa Raíz:** PRE-v2.0 solo exigía juez determinista para mutaciones de
  reglas. El código, reportes, y respuestas rutinarias del agente se
  publicaban sin auto-crítica.
- **Impacto:** Sesgo de auto-aprobación (Anthropic 2024) en artefactos
  rutinarios. Bugs, sesgos, y suboptimizaciones no detectadas.
- **Regla Correctiva:** **Regla P13 (Auto-Crítica Obligatoria)** + comando
  `critica <file>`. Modo A (3 debilidades reales) mínimo. Modo D (2 vectores
  de ataque) si toca seguridad/tools. Tabla AGREE/DISAGREE con al menos 1
  DISAGREE si exploró algo nuevo.

---

> **Instrucción para nuevos agentes:** al descubrir un antipatrón nuevo durante
> tu sesión, anexa una entrada `## [AP-XXX]` con Fecha, Causa Raíz, Impacto y
> Regla Correctiva. **Nunca edites entradas existentes.**

## [AP-027] Verificación por curl/fetch Aislado de Rutas HTML (Éxito Falso)
- **Fecha:** 2026-10-02
- **Causa Raíz:** LLMs verifican que "el server funciona" con `curl` o `fetch`
  aislado y reportan éxito si HTTP 200. Pero la página puede tener HTML vacío,
  errores de consola, CSS roto, JS no ejecutado, o network failures en assets.
- **Impacto:** Éxitos falsos en CI; bugs llegan a producción; el operador
  descubre el problema cuando ya deployó.
- **Regla Correctiva:** **Regla P14 (Headless Browser Verification)**: toda
  verificación de rutas HTML DEBE usar browser headless (MCP browser-devtools)
  con 10 puntos: navigate + console errors + network failures + screenshot +
  WCAG audit + 7-pos layout + sticky footer + paleta Apple + OnboardingTour +
  CTA Glowing. curl/fetch aislado SOLO válido para healthcheck endpoints
  (`/health`, `/ping`) y smoke tests de API sin UI.

## [AP-028] Generación de Código Sin Expectativas Previas
- **Fecha:** 2026-10-02
- **Causa Raíz:** El operador tiene un modelo mental del resultado esperado pero
  no lo comunica. El LLM genera algo distinto. Fricción alta, N iteraciones.
- **Impacto:** Fatiga del operador ("no es lo que quería"), tokens desperdiciados
  en iteraciones, tiempo perdido, frustración.
- **Regla Correctiva:** **Regla P15 (Expected-First Workflow)**: ANTES de
  implementar, generar `docs/expected/<epoch>-<topic>.md` con 6 secciones
  (visual wireframe, documental, comportamiento, rendimiento, accesibilidad,
  criterios de aceptación verificables). DESPUÉS de implementar, ejecutar
  `expected-check <topic>` que compara resultado real (browser headless) vs
  expectativa con veredicto MATCH/BETTER/WORSE/FAIL.

---

> **Instrucción para nuevos agentes:** al descubrir un antipatrón nuevo durante
> tu sesión, anexa una entrada `## [AP-XXX]` con Fecha, Causa Raíz, Impacto y
> Regla Correctiva. **Nunca edites entradas existentes.**

## [AP-029] Ingeniería Inversa Sin Normalización Apple Light Mode
- **Fecha:** 2026-10-02
- **Causa Raíz:** Al clonar una web objetivo, el agente copia la paleta de
  colores tal cual sin normalizarla a los tokens Apple Light Mode (P5).
- **Impacto:** El clon tiene paleta discordante (mostazas, oscuros agresivos,
  combinaciones no-Apple) que viola P5 y rompe la consistencia visual del
  boilerplate.
- **Regla Correctiva:** Toda ingeniería inversa DEBE incluir Etapa 1
  (extracción branding) que normaliza la paleta extraída a los tokens Apple
  Light Mode: #ffffff, #f5f5f7, #e5e5ea, #d2d2d7, #1d1d1f, #86868b, #0071e3.
  Ver `docs/reverse-engineering/protocol.md` Etapa 1 + BP #125.

## [AP-030] Clonación Sin Expected-First (Iteraciones Infinitas)
- **Fecha:** 2026-10-02
- **Causa Raíz:** El agente clona una web sin generar primero el documento
  de expectativas (P15). El operador tiene modelo mental no comunicado y
  termina con "no es lo que quería" tras N iteraciones.
- **Impacto:** Fatiga del operador, tokens desperdiciados, tiempo perdido.
  El clon se desvía del modelo mental del operador.
- **Regla Correctiva:** Toda clonación DEBE generar `docs/expected/<epoch>-<domain>-clone.md`
  (P15 expected-first) ANTES de empezar la reconstrucción (Etapa 4). El
  documento incluye wireframe ASCII + 8-15 CAs verificables por browser
  headless (P14). Tras clonar, ejecutar `expected-check` con veredicto
  MATCH/BETTER/WORSE/FAIL. Ver `docs/reverse-engineering/protocol.md`
  Etapa 0 + BP #123.

## [AP-031] Ciclo de Calidad Pasivo (Detección de Fallas No Automática)
- **Fecha:** 2026-10-02
- **Causa Raíz:** (Severidad CRÍTICA, clase proceso agéntico). Cuando un
  comando falla o un pipeline entra en FAILED, el fallo queda registrado en
  el log de comandos pero NADIE lo procesa: no hay análisis de causa raíz,
  ni investigación de corrección, ni verificación, ni reporte. El operador
  humano se convierte en el detector de fallas del sistema, que es
  exactamente lo contrario del propósito agéntico.
- **Impacto:** Fallas descubiertas por el operador con screenshots; reportes
  solo generados manualmente; criterios posteriores ejecutados a discreción.
- **Regla Correctiva:** Comando canónico `vigila` (v1.9.0) — el Ciclo
  Autónomo de Calidad se dispara tras cada ERROR del dispatcher, clasifica
  el hallazgo (NO_DEFECT para inputs inválidos del operador), abre ciclos
  de 7 etapas y genera reportes epoch inmutables. Escala a humano tras >3
  intentos fallidos de etapa. Ver `scripts/vigila.sh` + BP #129.

## [AP-032] Presupuesto de Gateway Excedido (HTML 504 Parseado como JSON)
- **Fecha:** 2026-10-02
- **Causa Raíz:** (Severidad ALTA, clase integración). Comandos que tardan
  >30s (scans secuenciales a APIs, LLM síncrono) son cortados por el
  gateway/proxy con una página HTML 504; el frontend hace res.json() del
  HTML y explota con "Unexpected token '<'" — un error de red engañoso que
  oculta la causa real (timeout). Además el catch del frontend reportaba
  durationMs: 0 (mentira P2).
- **Impacto:** El operador ve un error de red genérico que apunta al parseo
  y no al timeout real; la duración mentida (0ms) hace imposible el
  diagnóstico; comandos legítimos parecen rotos.
- **Regla Correctiva:** Paralelizar los scans (cola + workers), mover
  pipelines largos a background con polling (POST responde en <50ms),
  verificar content-type ANTES de parsear JSON, medir duración real con
  AbortController, y flaggear en verify cualquier comando cuyo máximo
  observado exceda 25s (presupuesto de seguridad).

## [AP-033] Regex de Prefijo IDE que Consume Comandos Canónicos
- **Fecha:** 2026-10-02
- **Causa Raíz:** (Severidad MEDIA, clase parser). El strippeo del prefijo
  de entorno ("en este ide, cold run") implementado con regex sin requerir
  la coma también convertía el comando canónico `ide detect` en `detect` →
  comando desconocido. El comando `ide` quedó roto desde su introducción sin
  que nadie lo detectara (symptom complementario de AP-031).
- **Impacto:** El comando canónico `ide` (12º) se reportaba como desconocido
  ante `ide detect` e `ide all`; regresión invisible por ausencia de smoke
  del dispatcher en verify.
- **Regla Correctiva:** El strip solo aplica con coma presente; el parser
  preserva los comandos multi-palabra conocidos (lista `known`); el
  dispatcher smoke de verify ejercita `ide detect`/`ide all` en vivo para
  detectar regresiones.

---

> **Instrucción para nuevos agentes:** al descubrir un antipatrón nuevo durante
> tu sesión, anexa una entrada `## [AP-XXX]` con Fecha, Causa Raíz, Impacto y
> Regla Correctiva. **Nunca edites entradas existentes.**

## [AP-034] CRUD Incompleto en Paneles Administrativos
- **Fecha:** 2026-10-06
- **Causa Raíz:** (Severidad ALTA, clase UX/arquitectura). Los paneles
  admin/account/users se construían al mínimo viable funcional: crear/editar
  en modal box (sin URL propia ni estado compartible), sin papelera (soft
  delete ausente y hard delete sin confirmación destructiva), listados sin
  paginación/filtros/batch, detalles en modal en vez de página con tabs, y
  forms sin datos relacionados consultables. Cada omisión se re-especificaba
  de viva voz por el operador en cada proyecto y cada sesión.
- **Impacto:** Fatiga crónica del operador (re-especificar el mismo estándar);
  paneles que crecen con deuda de UX; acciones destructivas sin red de
  seguridad; rutas no compartibles, no demostrables ni auditable su historial.
- **Regla Correctiva:** Regla P16 + estándar §11 de AGENTS.md: pageviews con
  URL propia convencionada para create/edit (doble modalidad wizard/avanzado),
  papelera + hard delete con confirmación, batch processes, detalles con tabs,
  beauty scroll panels con scroll vertical y horizontal verificados. La
  verificación es headless (P14) + expected-first (P15) y cada omisión es un
  gap declarado con severidad, no una "mejora futura".
