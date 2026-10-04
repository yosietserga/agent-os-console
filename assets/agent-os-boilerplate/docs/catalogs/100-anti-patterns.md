# Catálogo de 100 Antipatrones a Evitar en Desarrollo Agéntico

> Catálogo numerado del 1 al 100. Toda reincidencia en un antipatrón aquí listado
> dispara el bloqueo del PR por `memory-audit.yml` y registra una entrada en
> `docs/memory/anti-patterns.md`.
>
> Organizado en 5 categorías de 20 entradas cada una:
> 1. Vicios de Arquitectura y Llamadas Cognitivas (1-20)
> 2. Antipatrones de Código y Calidad Técnica (21-40)
> 3. Vicios en Interfaz y Experiencia de Usuario (41-60)
> 4. Antipatrones de Proceso Agéntico y Falsedad de Métricas (61-80)
> 5. Antipatrones de Integración, Despliegue y Gobernanza (81-100)

---

## 6.1 Vicios de Arquitectura y Llamadas Cognitivas (1-20)

1. **Llamadas Directas a SDKs de LLM:** Acoplar controladores de negocio a APIs de OpenAI o Anthropic sin pasar por el Control Plane L2. **[Viola P8]**
2. **Ignorar el Envelope Canónico:** Enviar payloads JSON desestructurados que impiden el rastreo de presupuestos y latencias.
3. **Reintentos Ciegos sin Backoff:** Reintentar peticiones inmediatamente ante errores 429, saturando proveedores y prolongando bloqueos.
4. **Ausencia de Circuit Breaker:** Mantener tráfico hacia modelos caídos, causando timeouts masivos en las aplicaciones clientes.
5. **Sobreajuste de Modelos Costosos:** Utilizar modelos de razonamiento de frontera para tareas sencillas de formateo o clasificación básica.
6. **Inyección de Prompts Monolíticos:** Concatenar miles de líneas de contexto innecesario, excediendo ventanas de contexto y elevando costos.
7. **Filtrado Inseguro de Multi-Tenancy:** Omitir la cláusula `tenant_id` en consultas, permitiendo fuga de datos entre organizaciones.
8. **Consultas a Base de Datos desde el Frontend:** Conectar clientes visuales directamente al almacén de datos sin pasar por la API Gateway.
9. **Hardcoding de Identificadores de Tenant:** Cablear identificadores de tienda estáticos (`store_id = 1`) en código compartido.
10. **Composición de Páginas Monolíticas:** Crear archivos gigantes que dupliquen layouts maestros y omitan los motores de renderizado. **[Viola P6]**
11. **Bypass del Sistema de Widgets:** Desarrollar interfaces manuales al margen del sistema polimórfico de widgets EAV del monorepo.
12. **Promoción de Entidades Fantasma:** Mostrar productos o módulos en interfaz que no existan en base de datos ni tengan respaldo transaccional.
13. **Uso de Placeholders Residuales:** Dejar números de teléfono ficticios o textos de prueba de plantillas anteriores en código productivo. **[Viola P7]**
14. **Inyección de Emojis en Interfaces:** Incluir caracteres informales en pantallas empresariales rompiendo la sobriedad visual. **[Viola P7]**
15. **Sobrescritura con `!important`:** Usar directivas forzadas en CSS para parchar colores en lugar de ajustar variables de diseño. **[Viola P5]**
16. **Monitoreo Ciego de Presupuesto:** Ejecutar llamadas a modelos sin límites de costo o sin registrar el consumo en un ledger financiero.
17. **Dependencia Crítica de un Solo Proveedor:** Diseñar el sistema sin modelos de fallback, quedando vulnerable a caídas de servicio. **[Viola P8]**
18. **Timeouts Infinitos en Inferencia:** No establecer límites de tiempo con `AbortController`, congelando hilos de ejecución.
19. **Escalado Innecesario a Modelos Superiores:** Subir de modelo por errores de formateo que se resolverían con decodificación gramatical.
20. **Desincronización de Modelos y Manifiestos:** Desplegar agentes con versiones de manifiesto desalineadas respecto a la base de datos.

## 6.2 Antipatrones de Código y Calidad Técnica (21-40)

21. **Uso Indiscriminado de 'any':** Suprimir comprobaciones de tipos mediante `any` o casts opacos para forzar la compilación.
22. **Ocultamiento de Errores con HTTP 200:** Devolver códigos de éxito cuando la operación falló (`{ success: false, error: "..." }`).
23. **Logging Mediante `console.log`:** Usar impresiones por consola estándar en lugar del logger inyectado del framework.
24. **Credenciales Hardcodeadas en Código:** Dejar contraseñas o claves maestras cableadas directamente en archivos del repositorio.
25. **Falta de Validación en Entradas Dinámicas:** Confiar en cargas útiles sin procesarlas mediante esquemas de validación Zod o Pydantic.
26. **Importaciones Cruzadas entre Dominios:** Invocar servicios de otros módulos directamente sin utilizar el bus de eventos.
27. **Uso de Coma Flotante para Moneda:** Operar cálculos financieros con tipos flotantes introduciendo errores de redondeo.
28. **Mutaciones de Datos sin Auditoría:** Modificar entidades críticas sin generar un registro correspondiente en la tabla de auditoría.
29. **Mutaciones sin Emisión de Eventos:** Cambiar estados de negocio sin publicar el evento de dominio a la infraestructura de mensajería.
30. **Duplicación de Utilidades Compartidas:** Crear helpers locales ad-hoc en lugar de consumir las librerías transversales del monorepo.
31. **Invocación de Herramientas Incompatibles:** Ejecutar comandos de paquetes que descargan versiones no soportadas en lugar de binarios locales.
32. **Rutas Monolíticas en Front Controller:** Sobrecargar `public/index.php` o `main.ts` con closures y lógica de ruteo desorganizada.
33. **Falta de Tipado de Retorno en Funciones:** Dejar que el compilador infiera retornos públicos complejos generando tipos frágiles.
34. **Supresión Silenciosa de Excepciones:** Bloques catch vacíos que descartan errores sin registrarlos en los sistemas de telemetría.
35. **Parches Superficiales en Lugar de Correcciones:** Modificar salidas superficiales sin atender la causa raíz en la capa de datos.
36. **Contratos OpenAPI Desactualizados:** Modificar controladores sin reflejar inmediatamente las alteraciones en el contrato público. **[Viola P4]**
37. **Nombres de Atributos Inconsistentes:** Mezclar `camelCase` y `snake_case` de forma arbitraria en las capas de exposición de datos.
38. **Falta de Índices en Consultas Compuestas:** Filtrar tablas de millones de filas por campos no indexados colapsando el motor relacional.
39. **Consultas a Base de Datos N+1:** Realizar consultas individuales en bucles en lugar de utilizar operaciones por lote estructuradas.
40. **Modificación Directa de Esquemas DDL en Caliente:** Alterar tablas en bases de datos productivas sin migraciones versionadas y probadas.

## 6.3 Vicios en Interfaz y Experiencia de Usuario (41-60)

41. **Colores Fuera de Paleta Corporativa:** Introducir tonos mostaza o combinaciones discordantes ajenas a la guía de estilo de la marca. **[Viola P5]**
42. **Forzar Dark Mode en Storefront Claro:** Romper la coherencia de tiendas claras forzando fondos oscuros agresivos (`#070709`). **[Viola P5]**
43. **Ausencia de Estados de Carga:** Dejar pantallas en blanco durante la espera de respuestas de red sin mostrar indicadores visuales.
44. **Listados sin Paginación ni Límites:** Renderizar miles de registros en el navegador agotando la memoria de la pestaña del usuario.
45. **Controles Táctiles Diminutos:** Diseñar botones de menos de 44px de área de impacto inutilizables en dispositivos móviles.
46. **Falta de Soporte de Teclado:** Construir interfaces que no permitan la navegación o activación de controles mediante tabulador.
47. **Tablas HTML Crudas para Dashboards:** Presentar métricas y analíticas mediante tablas elementales en lugar de tarjetas y gráficos.
48. **Textos con Contraste Insuficiente:** Utilizar tipografías tenues sobre fondos claros haciendo ilegible la información.
49. **Páginas con Salto de Diseño (CLS):** Cargar imágenes y bloques de contenido sin reservar espacio, desplazando los elementos visibles.
50. **Interfaces con Lenguaje Técnico:** Mostrar mensajes de error de base de datos o stacktraces a usuarios finales.
51. **Acciones Destructivas sin Confirmación:** Permitir el borrado permanente de datos mediante un solo clic accidental sin modal protector.
52. **Pies de Página Flotantes en Pantallas Cortas:** Dejar que el footer flote a mitad de pantalla cuando el contenido de la vista es breve.
53. **Ocultamiento de Enlaces Críticos:** Menús de navegación confusos que requieren más de tres clics para alcanzar funciones primarias.
54. **Diseño Desalineado de las Personas:** Construir pantallas que ignoren las necesidades operativas de los roles que las utilizarán.
55. **Formularios sin Validación Inmediata:** Obligar a enviar formularios complejos para enterarse de campos requeridos no completados.
56. **Renderizado de JSON Crudo:** Mostrar bloques de texto estructurado sin procesar en paneles de administración para usuarios finales.
57. **Sobrecarga de Animaciones:** Diseñar interfaces con transiciones lentas y recargadas que ralentizan el flujo de trabajo del usuario.
58. **Uso de Iconos sin Alternativa Textual:** Controles interactivos representados solo con iconos sin etiquetas de accesibilidad.
59. **Formularios que Pierden Datos tras Error:** Limpiar la información ingresada por el usuario si ocurre un error en el envío del formulario.
60. **Desbordamiento Horizontal en Móviles:** Diseñar contenedores anchos fijos que fuerzan barras de desplazamiento horizontal en teléfonos.

## 6.4 Antipatrones de Proceso Agéntico y Falsedad de Métricas (61-80)

61. **Falso Éxito por No-Op en Ediciones:** Afirmar que un error fue reparado sin verificar que el parche se aplicó en el archivo real. **[Viola P1]**
62. **Puertas de Validación Falsificadas:** Escribir "PASS" en reportes de calidad sin haber ejecutado la herramienta correspondiente. **[Viola P2]**
63. **Cierre Falso de Hallazgos:** Declarar resuelto un defecto ajustando únicamente un test local mientras producción sigue roto. **[Viola P3]**
64. **Saltarse Fases del Pipeline:** Pasar directamente a la interfaz visual sin haber definido el modelo de datos ni los contratos.
65. **Auto-Aprobación Complaciente de Reglas:** Permitir que el mismo modelo que genera el código evalúe y promueva sus propios lineamientos.
66. **Optimización Sobre Métricas Expuestas (Goodhart):** Adaptar soluciones para superar benchmarks específicos sin mejorar el sistema general.
67. **Evaluación sin Muestras Ocultas:** Evaluar candidatos de reglas utilizando únicamente el conjunto de tareas de entrenamiento.
68. **Promoción de Reglas con una Sola Pasada:** Aprobar cambios en lineamientos basándose en una corrida afortunada sin medir varianza.
69. **Tolerancia a Regresiones Severas:** Aprobar una regla porque sube el puntaje total aunque colapse una dimensión crítica de calidad.
70. **Sobrescritura Directa de Reglas Vivas:** Modificar `AGENTS.md` en producción directamente sin someterlo a pruebas y PR. **[Viola gobernanza PRE-v2.0]**
71. **Borrado de Lecciones en Memoria:** Sobrescribir o purgar archivos históricos de errores perdiendo el aprendizaje acumulado. **[Viola P9]**
72. **Ocultamiento de Discrepancias (DISAGREE):** Silenciar contradicciones entre el plan inicial y los resultados reales observados.
73. **Reincidencia en Antipatrones Documentados:** Implementar patrones que ya fueron catalogados como fallidos y corregidos en el pasado.
74. **Reportes Exclusivamente Centrados en Defectos:** Documentar fallos sin registrar victorias ni capacidades ganadas (incumplimiento PSIM).
75. **Iteraciones Infinitas sin Ayuda:** Intentar solucionar un problema técnico en bucle más de tres veces sin consultar al operador humano.
76. **Desincronización de Libros Técnicos:** Entregar código alterando arquitecturas sin actualizar los diagramas documentales. **[Viola P4]**
77. **Tests que No Pueden Fallar:** Escribir aserciones triviales que aprueban incluso cuando el sistema subyacente está roto.
78. **Uso de Datos de Producción en Pruebas:** Ejecutar pruebas contra bases de datos operativas arriesgando corrupción de información.
79. **Handoffs Informales sin Estructura:** Cerrar turnos de agente con resúmenes vagos que impiden a la siguiente sesión continuar el trabajo.
80. **Invocación de Agentes sin Aislamiento de Git:** Correr múltiples modelos en paralelo sobre el mismo árbol de trabajo generando colisiones.

## 6.5 Antipatrones de Integración, Despliegue y Gobernanza (81-100)

81. **Despliegues sin Validación Previa en CI:** Promover código a ramas principales sin pasar por comprobaciones automáticas de esquemas.
82. **Ausencia de Hot-Reload Seguro:** Forzar reinicios completos de infraestructura para aplicar pequeños ajustes en prompts agénticos.
83. **Falta de Canarios en Despliegue de Agentes:** Enviar el 100% del tráfico a nuevas versiones de agentes sin pruebas de ponderación gradual.
84. **Variables de Entorno sin Tipado:** Consumir `process.env` directamente sin esquemas que validen tipos y presencia obligatoria.
85. **Manejo Descentralizado de Conexiones:** Abrir conexiones a bases de datos o Redis en múltiples módulos sin pools centralizados.
86. **Falta de Detección de Ciclos en Jerarquías:** Permitir que estructuras de árbol (carpetas, menús) formen referencias circulares infinitas.
87. **Desactivación de Seguridad para Agilizar:** Apagar temporalmente firewalls o esquemas RLS para resolver errores de permisos.
88. **Tokens de Sesión en LocalStorage:** Almacenar tokens JWT en almacenamiento local vulnerable a ataques XSS en lugar de cookies httpOnly.
89. **Uso de Permisos Wildcard Globales:** Asignar comodines `*:*` a roles comunes de tenant en lugar de limitar accesos por módulo.
90. **Falta de Verificación de Tipos MIME Reales:** Validar archivos subidos solo por extensión en lugar de inspeccionar bytes mágicos.
91. **Ausencia de Aislamiento en Colas de Mensajes:** Mezclar mensajes de múltiples organizaciones en las mismas colas sin vhosts dedicados.
92. **Reintentos Infinitos en Mensajería:** Configurar consumidores de eventos que reintentan fallos indefinidamente bloqueando las colas.
93. **Monolitos Ocultos en Microservicios:** Crear servicios independientes que comparten la misma base de datos relacional sin límites claros.
94. **Falta de Versionado en Manifiestos de Módulos:** Publicar plugins o módulos sin declarar versiones semánticas ni dependencias.
95. **Sistemas sin Modo Degradado:** Construir flujos donde la caída de un servicio accesorio paraliza completamente el negocio central.
96. **Falta de Estrategia de Rotación de Secretos:** Diseñar plataformas con claves maestras imposibles de rotar sin interrumpir el servicio.
97. **Uso de Dependencias Abandonadas:** Incorporar librerías externas sin mantenimiento activo que introducen vulnerabilidades críticas.
98. **Ignorar Métricas de Latencia en Cola:** Monitorear solo el consumo de CPU ignorando el tiempo de espera de mensajes en colas de eventos.
99. **Desalineación entre Código y Documentación:** Permitir que la documentación técnica describa patrones obsoletos ya eliminados del código. **[Viola P4]**
100. **Falta de Respaldo Transaccional en Sagas:** Ejecutar flujos distribuidos multi-paso sin mecanismos de compensación ante fallos a mitad de proceso.

---

> **Uso en CI:** El workflow `memory-audit.yml` carga este catálogo como
> patrones regex y bloquea PRs que reintroduzcan antipatrones documentados.
> El `skill-apple-theme-linter` cubre específicamente las entradas 41-42, 15.
