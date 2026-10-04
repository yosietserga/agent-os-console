# Catálogo de 100 Mejores Prácticas para Desarrollo Agéntico

> Catálogo numerado del 1 al 100. Verificable en CI. Cada entrada cita la regla
> cardinal relacionada (P1-P9) cuando aplica.
>
> Organizado en 5 categorías de 20 entradas cada una:
> 1. Arquitectura de Sistemas y Gestión de Contexto (1-20)
> 2. Resiliencia, Fallback y Observabilidad (21-40)
> 3. Calidad de Código, Tipado y Contratos (41-60)
> 4. Diseño UI/UX, Accesibilidad y Presentación (61-80)
> 5. Metodología Agéntica, Pruebas y Memoria (81-100)

---

## 5.1 Arquitectura de Sistemas y Gestión de Contexto (1-20)

1. **Desacoplamiento L1/L2/L3:** Mantener la lógica de negocio (L3) estrictamente separada del Control Plane cognitivo (L2) y del sustrato de ejecución determinista (L1). **[P8]**
2. **Contratos Ingress Canónicos:** Normalizar toda carga cognitiva mediante esquemas XML universales antes de procesar el contexto. **[P8]**
3. **Aislamiento Multi-Tenant Estricto:** Exigir `tenant_id` en cada consulta de datos, contexto de ejecución y espacio de memoria.
4. **Context Pruning Dinámico:** Purgar del prompt el historial de conversación irrelevante antes de invocar modelos costosos.
5. **Enrutamiento por Tiers de Modelo:** Asignar tareas operativas a SLMs rápidos y reservar modelos de frontera exclusivamente para resolución compleja.
6. **Estructura Declarativa EAV:** Modelar atributos dinámicos mediante Entity-Attribute-Value con resolución polimórfica tipada.
7. **Documentación Empaquetada Local:** Priorizar la lectura de documentación local vinculada a versiones del proyecto sobre el entrenamiento estático del LLM.
8. **Asunción de Conocimiento Incompleto:** Verificar siempre el estado del código fuente mediante herramientas antes de emitir afirmaciones técnicas. **[P1]**
9. **Event-Driven Architecture:** Desacoplar dominios mediante buses de eventos duraderos (RabbitMQ) y canales de notificación efímeros (Redis).
10. **Idempotencia Transaccional:** Diseñar cada mutación para que admita reintentos seguros mediante tokens únicos de idempotencia.
11. **Registro Inmutable de Auditoría:** Registrar en log de auditoría toda operación privilegiada o alteración de estado en la misma transacción.
12. **Manejo Centralizado de Configuración:** Cargar variables de entorno exclusivamente mediante servicios de configuración validados con esquemas estrictos.
13. **Fail-Safe Determinista Local:** Establecer reglas estáticas sin LLM para contingencias de fallo en servicios de baja latencia.
14. **GitOps para Manifiestos Agénticos:** Tratar los prompts y configuraciones de agentes como código versionado sometido a CI/CD.
15. **AST Compilation Check:** Validar sintáctica y estructuralmente los manifiestos de agentes antes de cargarlos en memoria de ejecución.
16. **Hot-Swapping de Configuración:** Notificar la recarga de instrucciones mediante eventos de pub/sub en Redis sin reiniciar servicios.
17. **Aislamiento en Worktrees de Git:** Ejecutar agentes paralelos en ramas y árboles de trabajo separados para prevenir colisiones de archivos.
18. **Límite de Blast Radius en Fusiones:** Reconciliar cambios de agentes ordenando los merges de menor a mayor impacto en el repositorio.
19. **Single Source of Truth para Esquemas:** Generar contratos de API y tipos de datos a partir de una única fuente de verdad (Prisma, Protobuf).
20. **Presupuesto Máximo de Latencia (SLA):** Asignar timeouts estrictos con `AbortController` para abortar inferencias lentas antes de degradar la experiencia.

## 5.2 Resiliencia, Fallback y Observabilidad (21-40)

21. **Circuit Breaker con Ventana Deslizante:** Abrir el circuito cuando la tasa de fallos $R_{\text{fail}} \ge 0.40$ en una muestra mínima representativa ($N \ge 10$).
22. **Backoff Decorrelacionado con Jitter:** Aplicar aleatoriedad al tiempo de espera en reintentos para mitigar la sincronización de tráfico.
23. **Fallback Automático Transparente:** Redirigir el tráfico a un proveedor secundario predeterminado sin interrumpir la operación del cliente.
24. **Escalado Condicional por Contenido:** Escalar la consulta a un modelo de mayor razonamiento únicamente cuando se detecte un desbalance lógico.
25. **Sanity Check Intermedio en Memoria:** Ejecutar validaciones aritméticas deterministas antes de dar por buena una extracción de datos.
26. **Ledger Financiero Inmutable:** Auditar el consumo exacto de tokens (entrada, salida, caché) y costo en USD de cada llamada al LLM. **[P9]**
27. **Monitoreo P95 y P99 de Latencia:** Alertar sobre la degradación de proveedores externos antes de que impacte los SLAs de la aplicación.
28. **Detección Precoz de Alucinaciones Numéricas:** Verificar sumas y totales extraídos contra reglas duras de balance contable.
29. **Circuit Breaker Half-Open Canary:** Permitir una petición de prueba cada $N$ milisegundos para evaluar la recuperación del proveedor.
30. **DLQ para Eventos Cognitivos:** Enrutar mensajes fallidos a colas de mensajes muertos para análisis forense y reejecución controlada.
31. **Registro Centralizado Estructurado:** Prohibir `console.log` y emitir logs enriquecidos con contexto (`tenant_id`, `request_id`, severidad).
32. **Propagación de Correlation IDs:** Inyectar un identificador universal en headers para rastrear peticiones a través de todos los microservicios.
33. **Telemetry Tracing Distribuido:** Instrumentar llamadas cognitivas con OpenTelemetry para identificar cuellos de botella en la cadena.
34. **AbortControllers en Inferencia:** Cortar conexiones de socket en cuanto se sobrepase el SLA temporal de la aplicación satélite.
35. **Alertas Automáticas por Desviación de Costos:** Disparar bloqueos cuando un tenant alcance su límite de gasto mensual en tokens.
36. **Compresión Pre-Inferencia de Medios:** Reducir imágenes a formatos optimizados (WebP) y escalar resoluciones para minimizar tokens de visión.
37. **Graceful Degradation en Chatbots:** Reducir el historial conversacional y simplificar prompts si el proveedor rápido experimenta alta carga.
38. **Heurísticas Deterministas de Contingencia:** Disponer de respuestas estáticas seguras para transacciones de alto riesgo ante caídas globales.
39. **Reintento Exclusivo para Errores Transitorios:** Reintentar llamadas únicamente ante códigos HTTP 429 o 5xx temporales, nunca ante 400 o 401.
40. **Aislamiento de Caches por Tenant:** Prefijar claves de Redis con identificador de tenant para evitar filtración cruzada de datos cacheados.

## 5.3 Calidad de Código, Tipado y Contratos (41-60)

41. **Tolerancia Cero a Tipos 'any':** Usar `unknown` con esquemas de validación en tiempo de ejecución (Zod, Pydantic) para datos dinámicos.
42. **Tipado Estricto de Retorno:** Exigir firmas de retorno explícitas en toda función pública o método de servicio.
43. **Validación Bidireccional de Contratos:** Comprobar que los endpoints generen respuestas idénticas a los esquemas OpenAPI publicados.
44. **Envoltorios de Respuesta Estándar:** Formatear todas las salidas HTTP bajo la estructura unificada `{ success, data, error, meta }`.
45. **Excepciones de Protocolo Semánticas:** Lanzar excepciones HTTP estructuradas; jamás responder HTTP 200 con `{ error: ... }` en el cuerpo.
46. **Decoradores Declarativos de Permisos:** Proteger cada endpoint con permisos explícitos (`@Permissions`) o marcarlo explícitamente como público.
47. **Orden de Importación Riguroso:** Agrupar imports en: built-ins del sistema, dependencias externas, paquetes del monorepo y rutas relativas.
48. **Prohibición de Rutas Relativas entre Paquetes:** Utilizar alias de módulo absolutos para cruzar límites de paquetes en monorepos.
49. **Almacenamiento de Moneda en Enteros:** Almacenar importes en unidades menores (centavos) para evitar imprecisiones de coma flotante.
50. **Asociación Explícita de Divisa:** Guardar el código de divisa junto al importe monetario en toda transacción y entidad.
51. **Cifrado Bidireccional de Secretos:** Cifrar credenciales y claves API en reposo utilizando AES-256-GCM con claves maestras rotativas.
52. **Aislamiento en Base de Datos vía RLS:** Habilitar Row Level Security en PostgreSQL para forzar el filtrado por `tenant_id` en el motor relacional.
53. **Índices en Rutas Críticas de Consulta:** Indexar claves compuestas (`tenant_id`, `created_at`) para garantizar rendimiento constante.
54. **Restricciones Unique en Claves Naturales:** Añadir restricciones únicas compuestas para prevenir duplicación accidental de registros.
55. **Declaración Merging en Interfaces:** Preferir `interface` sobre `type` en TypeScript para permitir extensibilidad mediante plugins.
56. **Inyección de Dependencias Limpia:** Desacoplar la creación de servicios mediante contenedores de inversión de control (IoC).
57. **Desacoplamiento Frontend/Backend:** Prohibir que aplicaciones cliente importen clientes de base de datos o utilidades internas del servidor.
58. **Adaptadores de Normalización de Nombres:** Convertir sistemáticamente estructuras `snake_case` de APIs a `camelCase` en capas de presentación.
59. **Scripts de Compilación con Límites de Pila:** Utilizar wrappers de ejecución para evitar desbordamientos de memoria en compiladores complejos.
60. **Versionado Semántico de APIs:** Prefijar endpoints con versiones mayores (`/api/v1/`) para permitir evolución sin roturas.

## 5.4 Diseño UI/UX, Accesibilidad y Presentación (61-80)

61. **Estilo Sobrio Inspirado en Apple:** Diseñar con fondo blanco puro (`#ffffff`), titanio claro (`#f5f5f7`) y textos gris carbón (`#1d1d1f`). **[P5]**
62. **Layout Canónico de 7 Posiciones:** Resolver pantallas usando las 7 posiciones maestras del motor (`header`, `main`, `footer`, etc.). **[P6]**
63. **Composición Polimórfica de Widgets:** Construir componentes visuales desacoplados parametrizados por Object Type (`ot`) e Instance (`oi`).
64. **Estados Visuales Completos:** Implementar obligatoriamente Loading (esqueleto animado), Vacío, Error tipográfico y Éxito en cada vista.
65. **Accesibilidad WCAG 2.1 AA:** Garantizar contraste cromático suficiente, etiquetas `aria-label` y soporte completo de navegación por teclado.
66. **Áreas de Toque Táctiles Adecuadas:** Diseñar botones y controles interactivos con un tamaño de impacto mínimo de 44px.
67. **Diseño Mobile-First Progresivo:** Desarrollar pensando primero en pantallas reducidas y expandir armónicamente hacia escritorios.
68. **Separadores Finos de 1px:** Utilizar líneas tenues (`#e5e5ea`) para estructurar información sin saturar visualmente. **[P5]**
69. **Prohibición Total de Emojis en UI:** Sustituir emojis informales por iconografía vectorial SVG limpia y estilizada. **[P7]**
70. **Cero Tablas HTML Crudas:** Representar colecciones de datos mediante tarjetas de diseño, gráficos o tablas estilizadas con paginación.
71. **Contenedores con Scroll Acotado:** Limitar listas extensas con desplazamiento interno estilizado (`max-h-96 overflow-y-auto`).
72. **Prevención de Layout Shift (CLS):** Reservar dimensiones exactas para imágenes y componentes asíncronos para evitar saltos de pantalla.
73. **Pie de Página Fijo en Páginas Cortas:** Utilizar esquemas flexibles (`min-h-screen flex flex-col`) para mantener el footer en la base.
74. **Micro-interacciones Sobrias:** Añadir estados de hover y foco tenues que confirmen la interactividad sin distraer al usuario.
75. **Jerarquía Visual Clara:** Guiar la lectura mediante pesos tipográficos contrastados y espaciados consistentes.
76. **Paginación Obligatoria en Listados:** Exigir límites y cursores en todo endpoint de listado para prevenir degradación de renderizado.
77. **Sincronización de Navegación Omni-Context:** Ofrecer migas de pan y barras de navegación universales en vistas de detalle complejas.
78. **Soporte de Tema Dinámico sin `!important`:** Consumir variables CSS administradas desde base de datos respetando la cascada natural. **[P5]**
79. **Inspección de Personas en Pantalla:** Evaluar si la interfaz resuelve las metas de usuarios ejecutivos, operativos y analistas.
80. **Sanitización Estricta de HTML Renderizado:** Limpiar contenido enriquecido en el cliente utilizando librerías dedicadas como DOMPurify.

## 5.5 Metodología Agéntica, Pruebas y Memoria (81-100)

81. **Lectura Previa Obligatoria de Memoria:** Procesar el archivo de antipatrones históricos antes de planificar o escribir código. **[P9]**
82. **Auditoría de Premisas en Fase 0:** Verificar si las afirmaciones del plan ya están resueltas en el código antes de intentar implementarlas.
83. **Escalera de Evidencia Viva:** Comprobar la funcionalidad mediante respuestas HTTP reales, consultas a base de datos o capturas E2E.
84. **Verificación Inmediata Post-Edición:** Volver a leer cualquier archivo modificado antes de realizar commits para asegurar cambios reales. **[P1]**
85. **Declaración Honesta de Puertas:** Marcar puertas no ejecutadas como `NOT RUN` en vez de fingir aprobaciones no verificadas. **[P2]**
86. **Verificación de Código de Producción:** Confirmar que las correcciones impacten el código operativo y no únicamente archivos de test. **[P3]**
87. **Sincronización de Manifiestos y CLI:** Actualizar herramientas de terminal y scripts de instalación atómicamente con los cambios de código. **[P4]**
88. **Gobernanza de 3 Roles en Reglas:** Separar al agente ejecutor del juez determinista para evitar la auto-aprobación complaciente.
89. **Umbrales Estadísticos de Promoción:** Requerir mejoras significativas ($\Delta S \ge 5.0$) evaluadas en múltiples pasadas antes de promover reglas.
90. **Muestras de Evaluación Ocultas:** Reservar un 30% del benchmark de reglas para pruebas ciegas y prevenir sobreajuste (Goodhart).
91. **Registro Append-Only de Aprendizaje:** Mantener bitácoras de aprendizaje acumulativas que nunca eliminen lecciones del pasado. **[P9]**
92. **Reconocimiento de Hipótesis AGREE/DISAGREE:** Documentar discrepancias entre lo planificado y lo observado como información de valor.
93. **Penalización por Reincidencia:** Bloquear de inmediato soluciones que reintroduzcan fallos documentados y corregidos previamente.
94. **Análisis de Fuerzas de Porter para Código:** Evaluar la salud técnica frente a regresiones, dependencias estancadas y deuda técnica.
95. **Cuantificación de Victorias PSIM:** Documentar al menos una mejora concreta por sesión respaldada por evidencia verificable. **[W1-W8]**
96. **Límite de Auto-Reintentos (Regla de 3):** Abortar y solicitar intervención humana si una tarea falla tras tres intentos consecutivos.
97. **Sincronización Atómica de Libros Técnicos:** Actualizar diagramas de arquitectura en el mismo turno en que se altere la estructura del código. **[P4]**
98. **Pruebas Escritas para Fallar Primero:** Diseñar tests que capturen el fallo antes de introducir el código de resolución.
99. **Ambientes Temporales Aislados para Tests:** Ejecutar suites de prueba en bases de datos efímeras para no corromper datos de desarrollo.
100. **Handoff Estructurado y Tipado:** Finalizar cada ciclo de agente con un resumen tipado de cambios, estado y siguientes pasos.

## 5.6 Operación Agéntica Extendida (101-104 — añadidos en v1.1.0 y v1.2.0)

101. **Test UI por Ruta con Browser MCP:** Ejecutar `ui test <route>` antes de cerrar cualquier cambio que toque UI. Valida 7 posiciones canónicas (P6), paleta Apple (P5), WCAG 2.1 AA, sticky footer, cero errores de consola, cero network ≠ 2xx-3xx. El reporte se guarda en `docs/reports/<epoch>-ui-test-<route>.md`. **[P6]**

102. **Validación por Personas de Usuario:** Ejecutar `persona check <route>` iterando sobre todos los perfiles en `docs/personas/`. Verifica que cada persona (executive, operator, analyst, apprentice, demo-master, experience-architect + cold-run) pueda cumplir su meta en la ruta. Genera victoria W6 (Persona Satisfied) cuando todos pasan. Reporte en `docs/reports/<epoch>-persona-check-<route>.md`.

103. **Onboarding Tour Canónico en Vistas Complejas:** Toda vista con >3 secciones interactivas, composer, >3 métricas analíticas, o ruta crítica de onboarding DEBE montar un widget `OnboardingTour` (ver `docs/widgets/onboarding-tour.md`). El tour debe ser: paleta Apple Light Mode (P5), zero-emoji (P7), responsivo a 375px sin overflow, focus-trap operable por teclado (Tab/Esc/Enter/Shift+Enter), persistencia por usuario (`tour_<tourKey>_completed`), máximo 8 steps, contenido Apprentice-friendly sin jerga. **[P11]**

104. **Personas Cold-Run para Validación Adversarial:** Mantener 4 personas cold-run en `docs/personas/cold-run/` (novato, power, adversario, edge) que simulan usuarios frágiles, expertos, atacantes y condiciones extremas. Correr `persona check` con estas personas antes de cada deploy detecta: fallas de onboarding (novato), cuellos de botella UX (power), vulnerabilidades explotables (adversario), fallos en 3G/RTL/timezones (edge).

105. **Auto-Activación IDE en Clonado del Boilerplate:** Tras clonar el boilerplate, ejecutar `bash scripts/ide.sh all` (o `ide detect`) para generar los archivos de auto-activación de los IDEs presentes. Esto garantiza que TODO prompt del operador (incluso sin "lee AGENTS.md, ejecuta:") sea tratado como canónico: el IDE auto-aplica Fase 0, las 11 reglas P1-P11, detección de verbo implícito, estilo Apple Light Mode, y generación de reporte al cierre. Soporta 16 IDEs (Cursor, Claude Code, Gemini, Copilot, Windsurf, Cline, Codex CLI, RooCode, OpenCode, Trae, Antigravity, ZCode, VS Code, Aider, Continue). Salvaguarda anti-sobrescritura de archivos constitucionales (AP-018).

106. **apply_patch con Bloques Search/Replace Estrictos:** Toda edición de archivo existente DEBE usar bloques `<<<< SEARCH / ==== REPLACE / >>>> REPLACE` que coincidan exactamente con el contenido actual. Si el bloque SEARCH no coincide, se rechaza con diff (no se aplica difusa). Esto erradica alucinaciones de edición (Antipatrón AP-001 ampliado). Tras aplicar, releer con `view_lines_window` para verificar (Regla P1). Si `apply_patch` falla 3 veces seguidas, escalar a humano (BP #96). Patrón extraído de Aider-AI/aider. Ver `docs/patterns/aci.md`.

107. **Navegación Acotada ACI (Agent-Computer Interface):** Un agente LLM NUNCA debe leer archivos gigantes (5000+ líneas) de golpe. Máximo 100 líneas por `view_lines_window`. Usar `view_repo_map` (tree-sitter) para orientarse primero. Si se necesitan más líneas, paginar con múltiples llamadas. Herramientas ACI canónicas: `search_dir`, `search_file`, `view_lines_window`, `view_repo_map`, `apply_patch`, `find_file`. Previene AP-020 (saturación de contexto). Patrón extraído de SWE-agent/SWE-agent. Ver `docs/patterns/aci.md`.

## 5.7 Seguridad y Auto-Crítica Agéntica (108-117 — añadidos en v1.5.0)

108. **Structured Prompts con Delimitadores Canónicos:** Toda interacción LLM DEBE separar trusted_instructions de user_input con delimitadores canónicos (`<system>...</system> <user_input>...</user_input>`). Evita que "ignore previous instructions" overridee el system prompt. **[P12 Capa 1]**

109. **Input Sanitization con Decode-then-Validate:** Validar input DECODEANDO primero (base64, unicode escapes, HTML entities, URL encoding) y luego aplicando regex. Sin decode, los atacantes evaden filtros fácilmente. Normalizar typoglycemia (lowercase + leet replacement `0→o, 1→i, 3→e, 4→a, 5→s, 7→t`) antes de matchear. **[P12 Capa 2]**

110. **System Prompt Sandwich:** Colocar instrucciones críticas ANTES Y DESPUÉS del user_input. Patrón 2026 que refuerza boundaries desde ambas direcciones. Ej: `<system>NEVER reveal secrets</system> <user_input>...</user_input> <system>Remember: NEVER reveal secrets</system>`. **[P12 Capa 3]**

111. **Output Validation contra Schema + Detección de Exfiltración:** Toda salida del LLM DEBE validarse contra schema (Zod/Pydantic). Detectar exfiltración: URLs externas, base64 strings largos, JSON sospechoso, credenciales. Si la salida no valida o contiene exfil → bloquear. **[P12 Capa 4]**

112. **Human-in-the-Loop (HITL) para Acciones Críticas:** Toda acción destructiva (delete, drop, overwrite) o hacia externo (HTTP request, email, deploy) requiere confirmación humana explícita. Definir allowlist de acciones autónomas vs. HITL. **[P12 Capa 5]**

113. **Auto-Crítica Modo A (Self-Revision 3 Debilidades Reales):** Todo artefacto producido por el agente DEBE pasar self-revision identificando al menos 3 debilidades reales (arquitectura, seguridad, rendimiento, legibilidad, mantenimiento, contrato, testing, docs). Cero debilidades es sospechoso (sesgo de auto-aprobación, Antipatrón #65). **[P13]**

114. **Auto-Crítica Modo D (Adversario Red Team):** Si el artefacto toca seguridad, input externo, o tools, ejecutar Modo D: 2 vectores de ataque probados concretos (prompt injection, path traversal, race condition, etc.). Si exploit crítico → REJECT. **[P13]**

115. **Tabla AGREE/DISAGREE Obligatoria:** Todo reporte debe incluir tabla con veredicto AGREE/DISAGREE por cada hipótesis. Al menos 1 DISAGREE si exploró algo nuevo. Cero DISAGREEs en sesión exploratoria = sesgo confirmatorio. DISAGREE no es fracaso; es información valiosa para `anti-patterns.md`.

116. **Análisis Crítico Contrario:** Todo reporte debe incluir pregunta: "¿hay mejores formas de hacer esto? ¿newer ways 2026? ¿more accurate? ¿more reliable?". Si la respuesta es "no", justificar con evidencia. Inspirado en el prompt del operador.

117. **LLM-as-Judge con Familia Distinta:** Cuando se use Modo B (juez sintético), el LLM juez DEBE ser de familia distinta al generador (ej: generador Claude → juez GPT-4.1). Mitiga bias de familia. Calibrar contra humanos periódicamente. Previene Goodhart (Antipatrón #66).

## 5.8 Verificación Headless + Expected-First + CTA Glowing (118-122 — añadidos en v1.6.0)

118. **Verificación por Browser Headless (no curl/fetch aislado):** Toda verificación de rutas HTML DEBE usar MCP `browser-devtools` (headless real) con 10 puntos: navigate + console errors + network failures + screenshot + WCAG audit + 7-pos layout + sticky footer + paleta Apple + OnboardingTour + CTA Glowing. curl/fetch aislado SOLO para healthcheck (`/health`) y smoke API sin UI. **[P14]**

119. **Expected-First Workflow (generar expectativas ANTES):** Antes de implementar cualquier feature, generar `docs/expected/<epoch>-<topic>.md` con 6 secciones: wireframe ASCII, documental, comportamiento, rendimiento, accesibilidad, criterios de aceptación (8-15 CAs verificables). DESPUÉS ejecutar `expected-check <topic>` que compara real vs esperado. **[P15]**

120. **Comparación Visual con Screenshot Diff:** Tras implementar, capturar screenshot real vía browser headless y comparar contra wireframe ASCII esperado. Documentar MATCH/DIFF con anotaciones. Si DIFF crítico → iterar. **[P14, P15]**

121. **Criterios de Aceptación Verificables (8-15 CAs):** Todo documento de expectativas debe listar 8-15 CAs, cada uno: específico (no ambiguo), verificable por browser headless (selector, screenshot, audit, métrica), binario o cuátruple (PASS/FAIL/BETTER/WORSE). Menos de 8 = insuficiente; más de 15 = satura. **[P15]**

122. **Veredicto MATCH/BETTER/WORSE/FAIL en Todo expected-check:** Toda comparación expected vs real termina con uno de 4 veredictos. MATCH cumple; BETTER supera; WORSE inferior (iterar); FAIL no cumple críticos (iterar o escalar). El veredicto se registra en `docs/reports/<epoch>-expected-check-<topic>.md` y anexa al worklog. **[P15, P13]**

## 5.9 Ingeniería Inversa y Radiografía Rayos X (123-127 — añadidos en v1.7.0)

123. **Radiografía Rayos X Completa Antes de Clonar (5 Etapas):** Toda clonación de web/app/software DEBE ejecutar el pipeline de 5 etapas: (1) extracción branding, (2) extracción 3D Three.js, (3) radiografía modelo de negocio, (4) reconstrucción modular, (5) verificación. No saltarse ninguna etapa. Ver `docs/reverse-engineering/protocol.md`. **[P14, P15]**

124. **Screenshot Diff Automatizado entre Clon y Original:** Tras clonar, capturar screenshots de ambas URLs (original + clon) vía browser headless y comparar con umbral <15% DIFF. Si DIFF > 15% → iterar. Documentar MATCH/DIFF con anotaciones en `docs/reverse-engineering/<epoch>-<domain>/05-verification.md`. **[P14]**

125. **Normalización de Paleta Extraída a Tokens Apple Light Mode:** Toda paleta de colores extraída de la web objetivo DEBE normalizarse a los tokens Apple canónicos (#ffffff, #f5f5f7, #e5e5ea, #d2d2d7, #1d1d1f, #86868b, #0071e3). Prohibido copiar paleta discordante tal cual (mostazas, oscuros agresivos). Mapear cada color original al token Apple más cercano. **[P5]**

126. **Aislamiento de Canvas 3D en Widget Polimórfico EAV Autónomo:** Todo Canvas Three.js detectado en la web objetivo DEBE aislarse en un widget `ThreeCanvas` con ot (Object Type) `three-canvas` e oi (Object Instance) único. El widget es autónomo: carga sus propias geometrías, shaders, texturas y animaciones sin acoplarse al resto del código de negocio. Permite hot-swap y testing aislado.

127. **Interceptación de API Contracts Internos via Network (XHR/Fetch) → OpenAPI 3.1:** Durante la Etapa 3 (radiografía modelo de negocio), interceptar todas las llamadas XHR/Fetch de la web objetivo via browser-devtools MCP. Para cada endpoint: capturar método, request schema, response schema. Generar especificación OpenAPI 3.1 canónica lista para que el clon la implemente. Prohibido adivinar APIs sin interceptación real. **[P2, P14]**

---

> **Uso en CI:** El workflow `memory-audit.yml` puede importar este catálogo y
> verificar presencia de patrones recomendados en diffs. El
> `skill-apple-theme-linter` cubre específicamente las entradas 61-80. La
> BP #103 la valida `scripts/persona-check.sh` automáticamente. La BP #105
> la ejecuta `scripts/ide.sh` al clonar el boilerplate. Las BP #106-107
> se validan en `docs/patterns/aci.md`. Las BP #108-117 las valida el skill
> `prompt-injection-scanner` y el comando `critica <file>`. Las BP #118-122
> las valida el comando `expected-check <topic>` + browser-devtools MCP. Las
> BP #123-127 las valida el comando `cold run reverse-engineer <url>` + skill
> `reverse-engineer-skill`.

128. **Gaps-Finder Mandatorio Antes de Cerrar Sesión:** Toda sesión agéntica DEBE ejecutar `bash scripts/gaps-finder.sh` antes de commitear. El script ejecuta 15 checks de sincronización entre AGENTS.md, README, state.json, catálogos, scripts/, mcp/, personas, worklog, PR template, y changelog. Si hay gaps critical/high, bloquea commit y obliga a corregir. Solo cuando hay cero gaps critical/high se puede cerrar sesión. **[P2, P13]**

---

> **Uso en CI:** El workflow `memory-audit.yml` puede importar este catálogo y
> verificar presencia de patrones recomendados en diffs. El
> `skill-apple-theme-linter` cubre específicamente las entradas 61-80. La
> BP #103 la valida `scripts/persona-check.sh` automáticamente. La BP #105
> la ejecuta `scripts/ide.sh` al clonar el boilerplate. Las BP #106-107
> se validan en `docs/patterns/aci.md`. Las BP #108-117 las valida el skill
> `prompt-injection-scanner` y el comando `critica <file>`. Las BP #118-122
> las valida el comando `expected-check <topic>` + browser-devtools MCP. Las
> BP #123-127 las valida el comando `cold run reverse-engineer <url>` + skill
> `reverse-engineer-skill`. La BP #128 la valida el comando `gaps-finder`
> (mandatorio en §8.2). La BP #129 la valida el comando `vigila`
> (disparo automático tras cada ERROR del dispatcher).

129. **Ciclo Autónomo de Calidad post-error** — Tras cada ERROR del dispatcher o fallo de pipeline, dispara automáticamente un ciclo que analiza causa raíz, investiga la mejor corrección, corrige, verifica (Gate Honesty), aplica criterios posteriores y genera reporte inmutable. Nunca dejes que una falla muera en el log: el operador no debe ser el detector de fallas del sistema. **[P2, P13]**

---

> **Uso en CI:** El workflow `memory-audit.yml` puede importar este catálogo y
> verificar presencia de patrones recomendados en diffs. El
> `skill-apple-theme-linter` cubre específicamente las entradas 61-80. La
> BP #103 la valida `scripts/persona-check.sh` automáticamente. La BP #105
> la ejecuta `scripts/ide.sh` al clonar el boilerplate. Las BP #106-107
> se validan en `docs/patterns/aci.md`. Las BP #108-117 las valida el skill
> `prompt-injection-scanner` y el comando `critica <file>`. Las BP #118-122
> las valida el comando `expected-check <topic>` + browser-devtools MCP. Las
> BP #123-127 las valida el comando `cold run reverse-engineer <url>` + skill
> `reverse-engineer-skill`. La BP #128 la valida el comando `gaps-finder`
> (mandatorio en §8.2). La BP #129 la valida el comando `vigila`
> (disparo automático tras cada ERROR del dispatcher).
