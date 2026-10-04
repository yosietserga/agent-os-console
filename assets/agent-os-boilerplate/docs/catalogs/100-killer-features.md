# Catálogo de 100 Killer Features para Apps con LLMs

> Catálogo numerado del 1 al 100. Las killer features son capacidades
> diferenciadoras que un equipo puede implementar para profundizar el moat
> (ventaja competitiva) de su producto agéntico. Cada una mapea a una clase
> PSIM (W1-W8) cuando se implementa con evidencia.
>
> Organizado en 5 categorías de 20 entradas cada una:
> 1. Capacidades Cognitivas y Orquestación Inteligente (1-20)
> 2. Arquitectura de Datos, Eventos y Rendimiento (21-40)
> 3. Interfaz de Usuario y Composición de Experiencias (41-60)
> 4. Seguridad, Cumplimiento y Gobierno de Datos (61-80)
> 5. Autonomía de Agentes, Calidad y CI/CD (81-100)

---

## 7.1 Capacidades Cognitivas y Orquestación Inteligente (1-20)

1. **Streaming XML Parser de Cero Copia:** Procesamiento ultrarrápido de envelopes Ingress extrayendo metadatos en microsegundos.
2. **Circuit Breaker Cognitivo Autónomo:** Conmutación automática a proveedores alternativos en menos de 15ms ante fallos de red.
3. **Enrutamiento Dinámico Multi-Tier:** Despacho inteligente de peticiones según presupuesto, SLA de latencia y dificultad semántica.
4. **Escalado Aritmético Determinado:** Reenvío automático a modelos de frontera cuando se detectan fallos de balance contable.
5. **Decodificación Gramatical Guiada:** Forzar la salida estructurada de modelos mediante gramáticas EBNF para garantizar esquemas JSON.
6. **Compresión Semántica de Contexto:** Reducción selectiva de historiales conversacionales preservando entidades clave y acuerdos.
7. **Normalización Automática de Medios:** Conversión y compresión inteligente de imágenes a WebP antes de su procesamiento multimodal.
8. **Fail-Safe Heurístico Sub-90ms:** Respuesta determinista instantánea ante caídas de modelos en operaciones críticas de antifraude.
9. **Hot-Swapping de Prompts vía Pub/Sub:** Actualización atómica de instrucciones de agentes en memoria sin desconectar servicios.
10. **Despliegues Canario para Agentes:** Derivación ponderada de tráfico ($10\% \rightarrow 50\% \rightarrow 100\%$) entre versiones de agentes.
11. **Shadow Evaluation en CI/CD:** Evaluación de prompts contra casos sintéticos antes de autorizar su promoción a producción.
12. **Inferencia Local Cuantizada en Borde:** Despliegue de SLMs en contenedores optimizados (vLLM) para operaciones ultrarrápidas.
13. **Triangulación Epistémica de Fuentes:** Consulta concurrente a múltiples proveedores para sintetizar respuestas de alta fidelidad.
14. **Extracción Multi-Paso de Documentos Complejos:** División de manuales y contratos en secciones procesadas por agentes paralelos.
15. **Agente Reconciliador de Discrepancias:** Árbitro autónomo que detecta y resuelve contradicciones en salidas multimodales.
16. **Validación Sintética de Esquemas de Salida:** Reparación automática de JSONs incompletos generados por modelos antes de devolverlos.
17. **Caché Semántica Vectorial de Respuestas:** Almacenamiento de consultas frecuentes para responder en menos de 5ms sin costo de LLM.
18. **Atenuación Proactiva de Thundering Herds:** Backoff exponencial con jitter decorrelacionado para proteger APIs en recuperación.
19. **Ledger Inmutable de Consumo de Tokens:** Trazabilidad financiera detallada de cada céntimo invertido en inferencias por tenant.
20. **Control Presupuestario por Tenant con Corte:** Desconexión automática de inferencias caras al alcanzar el límite presupuestario.

## 7.2 Arquitectura de Datos, Eventos y Rendimiento (21-40)

21. **Transactional Outbox Pattern Nativo:** Escritura atómica de cambios en base de datos y eventos en cola en una única transacción.
22. **Resolución Dual de Vistas EAV:** Motor híbrido que combina tablas pivotadas relacionales con esquemas dinámicos.
23. **Segregación de Comandos y Consultas (CQRS):** Separación de escrituras transaccionales y lecturas optimizadas en vistas materializadas.
24. **Multi-Tenancy Aislado con RLS Nativo:** Forzado de contexto de tenant mediante políticas de seguridad en el motor relacional.
25. **Cifrado Transparente en Capa de Datos:** Cifrado automático de campos sensibles mediante AES-256-GCM antes de persistir.
26. **Bus Híbrido de Eventos (RabbitMQ + Redis):** Mensajería durable para lógica de negocio y canales en tiempo real para interfaces.
27. **AsyncLocalStorage para Contexto de Tenant:** Propagación invisible de identidad de organización a lo largo de llamadas asíncronas.
28. **Inyección Dinámica de Plugins sin Reinicio:** Carga en caliente de módulos y controladores mediante registros declarativos.
29. **Motor de Workflows Basado en DAGs:** Ejecución de flujos de negocio complejos mediante grafos acíclicos dirigidos configurables.
30. **Reintento Exponencial con DLQ Inteligente:** Reencolamiento de eventos fallidos con inspección y reejecución desde panel de control.
31. **Detección de Ciclos en Grafos Jerárquicos:** Validación en tiempo real para impedir dependencias circulares en estructuras arbóreas.
32. **Pivoteo Dinámico de Atributos EAV:** Transformación de valores dinámicos en columnas indexadas para reportes analíticos rápidos.
33. **Migraciones Transaccionales con Verificación RLS:** Ejecución de cambios de esquema con auto-aplicación de políticas de aislamiento.
34. **Auditoría Inmutable de Mutaciones:** Registro secuencial de autor, estado anterior y estado nuevo en cada operación privilegiada.
35. **Pool Dinámico de Conexiones Multitenant:** Asignación optimizada de conexiones de base de datos ajustada al tráfico de cada tenant.
36. **Caché por Capas con Invalidación Inteligente:** Almacenamiento en memoria local y Redis con purga automática orientada a eventos.
37. **Serialización Canónica Zero-Allocation:** Serialización binaria de alta velocidad para comunicación entre microservicios internos.
38. **Rotación Automática de Claves JWT:** Intercambio de claves sin desconectar sesiones de usuario mediante rotación de pares de claves.
39. **Sincronización de Estados Multitab:** Coordinación del estado de interfaz entre múltiples pestañas abiertas mediante WebSockets.
40. **Búsqueda Semántica Híbrida en Catálogo:** Búsqueda que combina concordancia exacta por texto con similitud vectorial.

## 7.3 Interfaz de Usuario y Composición de Experiencias (41-60)

41. **Motor de Widgets Polimórficos EAV:** Composición modular de pantallas basada en Object Types e Object Instances configurables. **[P6]**
42. **Layout Canónico de 7 Posiciones:** Disposición visual estructurada que garantiza coherencia en todas las vistas de la plataforma. **[P6]**
43. **Visual Composer Arrastrar y Soltar:** Diseñador visual de páginas que genera árboles de componentes JSON en tiempo real.
44. **Paleta de Alta Gama Modo Claro Apple:** Interfaz sobria con fondos blancos puros, superficies titanio y acentos sobrios. **[P5]**
45. **Skeleton Loaders Paramétricos:** Esqueletos animados que reproducen la estructura exacta del componente durante la carga.
46. **Omni-Navigation Context Bar:** Barra superior universal con historial de navegación y comandos rápidos por teclado.
47. **Inspector Dinámico de Personas de Usuario:** Panel de desarrollo para conmutar y validar la experiencia visual según 16 perfiles de usuario.
48. **Sistema de Temas Dinámico sin `!important`:** Personalización de marcas mediante inyección limpia de variables CSS desde base de datos. **[P5]**
49. **Control de Revisiones y Rollback de Widgets:** Historial versionado de cambios en componentes de página con reversión en un clic.
50. **Pruebas A/B Nativas de Componentes:** División de tráfico entre variantes de layouts para medir conversión comercial.
51. **Accesibilidad Integral con Soporte ARIA:** Compatibilidad total con lectores de pantalla y navegación por teclado (WCAG 2.1 AA).
52. **Responsive Design Mobile-First Adaptativo:** Adaptación de vistas complejas a interfaces móviles fluidas sin barras horizontales.
53. **Sanitización Dinámica de Contenido:** Limpieza de código HTML insertado en el navegador para bloquear ataques XSS.
54. **Formularios con Guardado Automático:** Persistencia de borradores en cliente para evitar pérdida de datos ante desconexiones.
55. **Paginación Inteligente con Scroll Infinito:** Carga progresiva de registros con memoria de posición y soporte de enlaces directos.
56. **HUD Flotante para Operaciones Críticas:** Barra flotante de acciones rápidas accesible desde cualquier pantalla del sistema.
57. **Gestión Unificada de Iconografía Vectorial:** Catálogo de iconos SVG ligeros para mantener interfaces limpias sin emojis informales. **[P7]**
58. **Vistas Previas con Token de Acceso Seguro:** Enlaces efímeros para previsualizar cambios en páginas antes de su publicación oficial.
59. **Notificaciones Push y Toasts Interactivos:** Avisos no intrusivos que informan del avance de tareas en segundo plano en tiempo real.
60. **Formatos Multimoneda con Conversión en Vivo:** Visualización de precios adaptada a la divisa del visitante calculada en el cliente.

## 7.4 Seguridad, Cumplimiento y Gobierno de Datos (61-80)

61. **Autenticación FIDO2 / WebAuthn con Passkeys:** Inicio de sesión biométrico sin contraseñas para máxima protección de cuentas.
62. **Control de Acceso Híbrido (RBAC + ABAC):** Evaluación de permisos combinando roles de usuario con atributos dinámicos del contexto.
63. **Gestión de Permisos Dirigida por Base de Datos:** Concesión de capacidades almacenada en tablas relacionales sin cableado en código.
64. **Inspección de Firmas de Archivos (Magic Bytes):** Verificación del contenido binario real en subidas de medios bloqueando archivos falsos.
65. **Firma Criptográfica HMAC en Webhooks:** Validación de integridad en cada mensaje saliente a integraciones externas.
66. **Rate Limiting Dinámico por IP y Organización:** Protección contra ataques de denegación de servicio y abusos de API mediante Redis.
67. **Cookies HttpOnly con Prefijo Seguro:** Almacenamiento de tokens protegido contra acceso desde scripts maliciosos de navegador.
68. **Rotación de Refresh Tokens con Detección de Robo:** Invalidación masiva de sesiones si un token de actualización es reutilizado.
69. **Aislamiento Criptográfico de Secretos por Tenant:** Llaves derivadas independientes para que cada tenant encripte sus propias credenciales.
70. **Bloqueo Preventivo por Detección de Anomalías:** Suspensión temporal de operaciones financieras ante comportamientos atípicos.
71. **Protección contra Inyección de Prompts:** Filtros intermedios que neutralizan intentos de evasión en entradas de usuarios.
72. **Sanitización de Datos en Logs de Auditoría:** Máscaras automáticas sobre información personal o tarjetas antes de escribir registros.
73. **Validación Estricta de Esquemas en Endpoints:** Rechazo automático de peticiones que contengan campos no declarados en contratos.
74. **Firma Criptográfica de Paquetes en Marketplace:** Verificación de clave pública antes de instalar módulos de terceros en el monorepo.
75. **Gestión de Consentimientos y Retención:** Políticas automáticas de expiración y purga de información conforme a regulaciones GDPR.
76. **Aislamiento de Entornos de Ejecución Sandbox:** Aislamiento de código arbitrario de plugins en entornos restringidos sin acceso a red.
77. **Control de Residencia Geográfica de Datos:** Asignación de regiones específicas de almacenamiento según normativas locales.
78. **Protección contra Desbordamiento de Pila en CLI:** Wrappers de memoria que aseguran la ejecución estable de compiladores.
79. **Revocación Inmediata de Tokens vía JTI:** Lista negra en Redis para invalidar tokens específicos antes de su expiración formal.
80. **Políticas de Seguridad de Contenido (CSP) Estrictas:** Cabeceras HTTP que bloquean la carga de scripts no autorizados.

## 7.5 Autonomía de Agentes, Calidad y CI/CD (81-100)

81. **Squads de Agentes Paralelos en Worktrees:** Coordinación de múltiples LLMs operando simultáneamente en ramas aisladas de Git.
82. **Juez Determinista sin LLM (PRE-v2.0):** Evaluación matemática objetiva de propuestas de reglas mediante software compilado.
83. **Ledger Append-Only de Aprendizajes:** Memoria episódica permanente que previene la reaparición de fallos resueltos. **[P9]**
84. **Monitoreo Longitudinal de KPIs (PSIM):** Cuantificación histórica de victorias técnicas y velocidad de resolución de deuda.
85. **Detección Automática de Reportes Simulados:** Filtros de integridad que anulan reportes con métricas aprobadas artificialmente. **[P2]**
86. **Verificación Automatizada tras Edición:** Relectura inmediata de archivos tras modificaciones para asegurar la aplicación real de cambios. **[P1]**
87. **Sincronización Mandatoria de Libros Técnicos:** Actualización automática de documentación interactiva ante alteraciones de esquema. **[P4]**
88. **Pipeline GitOps de Manifiestos Agénticos:** Validación, prueba sintética y despliegue de prompts mediante acciones de GitHub.
89. **Generación Automatizada de Codemods:** Scripts basados en AST (ts-morph) para ejecutar transformaciones masivas de código sin errores.
90. **Mapeo de Cobertura por Personas de Usuario:** Auditoría de interfaces contrastando cada pantalla frente a perfiles de usuarios reales.
91. **Smoke Tests Automatizados con Navegador Real:** Ejecución de pruebas en navegador headless validando consola, red y renderizado.
92. **Red-Teaming Cruzado entre Modelos:** Revisión del código producido por un agente mediante un modelo independiente de diferente familia.
93. **Circuit Breaker para Agentes Atascados:** Cancelación de tareas y escalado a humanos tras tres iteraciones fallidas.
94. **Análisis de Fuerzas de Porter Aplicado al Código:** Evaluación estratégica periódica de la deuda técnica y moats del software.
95. **Benchmark Rotativo Ciego Anti-Goodhart:** Renovación periódica de casos de prueba reservados para evitar sobreajuste en reglas.
96. **Instalador de Un Solo Clic con Verificación:** Script de despliegue inicial que migra esquemas, siembra datos y comprueba servicios.
97. **Comprobación de Drift en Contratos de API:** Detección automática en CI de discrepancias entre controladores y esquemas OpenAPI.
98. **Aislamiento de Bases de Datos en Baterías de Test:** Creación y destrucción de esquemas efímeros para cada suite de prueba.
99. **Contrato de Handoff Estandarizado en JSON:** Esquema estructurado para transferir contexto técnico entre sesiones de agentes.
100. **Auto-Mejora Perpetua Respaldada por Evidencia:** Protocolo de evolución del sistema que prohíbe cambios de reglas sin evidencia matemática.

## 7.6 Onboarding & Persona Ecosystem (101-109 — añadidos en v1.2.0 a v1.7.0)

101. **Widget Canónico `OnboardingTour` (Joyride Apple-Style):** Tour interactivo obligatorio en vistas complejas (>3 secciones, composer, >3 métricas, ruta crítica). Paleta Apple Light Mode (P5), zero-emoji (P7), responsivo 375px, focus-trap WCAG 2.1 AA, persistencia `tour_<tourKey>_completed`, máximo 8 steps Apprentice-friendly. Activado automáticamente por `persona check` contra apprentice + demo-master. Erradica la necesidad de re-solicitar Joyrides. Ver `docs/widgets/onboarding-tour.md`.

102. **Auto-Activation Layer para 16 IDEs (comando `ide`):** Script `scripts/ide.sh` que genera archivos de auto-activación (.cursorrules, CLAUDE.md, GEMINI.md, .windsurfrules, .clinerules, CODEX.md, .roo/rules, opencode.md, .trae/rules, .antigravity/rules, .zcode/rules, .vscode/settings.json, .aider.conf.yml, .continue/config.json) que garantizan que TODO prompt del operador (incluso sin "lee AGENTS.md, ejecuta:") sea tratado como canónico. El IDE auto-aplica Fase 0, las 15 reglas P1-P15, detección de verbo implícito, estilo Apple Light Mode, y generación de reporte al cierre. Salvaguarda anti-sobrescritura de archivos constitucionales. Ver `docs/ide-integrations/README.md`.

103. **Auto-Improvement Loop (comando `mejorate`):** Script `scripts/mejorate.sh` que escanea 10 repositorios de referencia en GitHub en modo read-only (jujumilk3/leaked-system-prompts, LouisShark/chatgpt_system_prompt, dontriskit/awesome-ai-system-prompts, PatrickJS/awesome-cursorrules, Aider-AI/aider, SWE-agent/SWE-agent, OpenHands/OpenHands, BerriAI/litellm, modelcontextprotocol/servers, anthropics/anthropic-cookbook), extrae patrones agénticos ventajosos, y propone adoptions via PRE-v2.0. Modos: `scan` (escanea y genera reporte), `synthesize` (extrae patrones y propone adoptions). Erradica la fatiga meta: el sistema se auto-mejora sin intervención del operador. Ver `docs/mejorate-scans/`.

104. **Research Loop en Tiempo Real (comando `investiga`):** Script `scripts/investiga.sh` que busca en internet (z-ai CLI `web_search` + `page_reader`) asumiendo falta de conocimientos del agente, lee las top 5 páginas, sintetiza hallazgos en `docs/research/<epoch>-<topic-slug>.md`, propone adoptions via PRE-v2.0. Resuelve el fallo de `mejorate` (que solo escanea repos estáticos): `investiga` descubre amenazas emergentes y state-of-the-art en tiempo real. Ej: `investiga "prompt injection defenses 2026"`. Erradica la fatiga de "no sabía que eso existía".

105. **Adversarial Self-Review (comando `critica` + protocolo auto-crítica):** Script `scripts/critica.sh` que ejecuta Modo A (self-revision: 3 debilidades reales) + Modo D (adversario: 2 vectores de ataque si toca seguridad) sobre cualquier artefacto. Genera reporte con tabla AGREE/DISAGREE obligatoria (al menos 1 DISAGREE si exploró) + análisis crítico contrario ("¿hay mejores formas? ¿newer ways 2026?"). Implementa `docs/security/auto-critica-protocol.md` (4 modos: self-revision, juez sintético, juez determinista PRE-v2.0, adversario red team). Mitiga sesgo de auto-aprobación (Anthropic 2024) y sesgo confirmatorio.

106. **Headless Browser Verification (P14):** Verificación de rutas HTML por browser headless real (MCP `browser-devtools`) con 10 puntos: navigate + console errors + network failures + screenshot + WCAG audit + 7-pos layout + sticky footer + paleta Apple + OnboardingTour + CTA Glowing. curl/fetch aislado SOLO para healthcheck. Erradica el éxito falso (HTTP 200 con HTML roto). Implementa `docs/security/headless-verify-and-expected-first-protocol.md` Parte 1.

107. **Expected-First Workflow (P15 + comando `expected-check`):** Skill `expected-spec-generator` genera `docs/expected/<epoch>-<topic>.md` con 6 secciones (wireframe ASCII, documental, comportamiento, rendimiento, accesibilidad, 8-15 CAs verificables) ANTES de implementar. Comando `expected-check <topic>` (16º canónico) compara resultado real (browser headless) vs expectativa con veredicto MATCH/BETTER/WORSE/FAIL. Erradica la frustración del operador de "tener resultado esperado en mente y no obtenerlo". Implementa `docs/security/headless-verify-and-expected-first-protocol.md` Parte 2.

108. **Comando `cold run reverse-engineer <url>` (alias `rayos-x`):** Pipeline de 5 etapas de Radiografía Rayos X para ingeniería inversa de web/app/software. (1) Extracción visual & branding → normalización Apple Light Mode (P5). (2) Extracción shaders & 3D Three.js → WebGL inspect + GLSL + geometrías + texturas + ThreeCanvas widget aislado. (3) Radiografía modelo de negocio → pricing + APIs interceptadas + 5 Fuerzas Porter + DDL PostgreSQL. (4) Reconstrucción modular → componentes tipados + widgets EAV + OnboardingTour (P11) + GlowingCtaButton (W-CTA). (5) Verificación → browser headless P14 (10 puntos) + expected-check P15 + screenshot diff <15%. Genera `docs/reverse-engineering/<epoch>-<domain>/` con 5 reportes + consolidado + expected-first + reporte sesión. Ver `docs/reverse-engineering/protocol.md`.

109. **Skill `reverse-engineer-skill` (orquestador 10 repos):** Skill MCP con 5 sub-comandos (extract-branding, extract-threejs, extract-business, reconstruct, verify-clone) que orquesta 10 repos de skills de ingeniería inversa: browser-use (117k⭐, navegación agéntica), firecrawl (188k⭐, crawling → Markdown), awesome-mcp-servers (96k⭐, catálogo MCP), modelcontextprotocol/servers (91k⭐, puppeteer + fetch), screenshot-to-code (80k⭐, screenshots → código), e2b-dev/fragments (6k⭐, sandboxes Three.js), crewAI-tools (1.5k⭐, SeleniumScrapingTool), autogen (61k⭐, biblioteca skills), gpt-researcher (30k⭐, 5 Fuerzas Porter), AutoGPT (188k⭐, bloques modulares APIs). Permite al operador decir `lee AGENTS.md, ejecuta: rayos-x https://target.com` y obtener radiografía completa + especificación del clon lista para compilación.

---

> **Uso:** Cada killer feature implementada con evidencia genera una entrada
> `WIN-XXX` en `docs/memory/wins-ledger.md` mapeada a su clase PSIM (W1-W8).
> Las más diferenciadoras (1-20, 81-100) son candidatas naturales a W1
> (Capability Strengthening) o W4 (ADOPTED Promotion). La #101 es además
> candidata a W6 (Persona Satisfied). La #102 es W1+W6+W7. La #103 es W1+W4.
> Las #104-105 son W1+W4+W6. Las #106-107 son W1+W6. Las #108-109 son W1+W6
> (ingeniería inversa canónica + 10 repos orquestados = clonación profesional).
> La #110 es W1+W8 (sentinel quality loop — cierre automático de hallazgos).

110. **Sentinel Quality Loop** — Un órgano del sistema vigila sus propios registros de ejecución, abre hallazgos con severidad, corre ciclos de corrección verificados y produce reportes de cierre sin intervención humana. Convierte la constitución de prose a pipeline ejecutado.

---

> **Uso:** Cada killer feature implementada con evidencia genera una entrada
> `WIN-XXX` en `docs/memory/wins-ledger.md` mapeada a su clase PSIM (W1-W8).
> Las más diferenciadoras (1-20, 81-100) son candidatas naturales a W1
> (Capability Strengthening) o W4 (ADOPTED Promotion). La #101 es además
> candidata a W6 (Persona Satisfied). La #102 es W1+W6+W7. La #103 es W1+W4.
> Las #104-105 son W1+W4+W6. Las #106-107 son W1+W6. Las #108-109 son W1+W6
> (ingeniería inversa canónica + 10 repos orquestados = clonación profesional).
> La #110 es W1+W8 (sentinel quality loop — cierre automático de hallazgos).
