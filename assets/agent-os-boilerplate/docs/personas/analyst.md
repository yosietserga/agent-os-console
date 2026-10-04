# Persona: Analyst

- **Id:** analyst
- **Rol:** Analista de datos / BI
- **Meta principal:** Explorar datos, construir reportes custom, detectar anomalías.
- **Permisos:** Lectura de tablas + acceso a vistas materializadas; export CSV/Excel.
- **Dispositivo típico:** Desktop ultrawide (2560×1080).
- **Rutas esperadas:** /analytics, /reports/builder, /data-explorer
- **Criterios de éxito:**
  - Filtros facetados y búsqueda semántica.
  - Paginación inteligente o scroll infinito con memoria de posición.
  - Gráficos (no tablas crudas) para dashboards.
- **Criterios de fracaso:**
  - Sin paginación (carga miles de registros).
  - JSON crudo en UI.
  - Sin accesibilidad WCAG 2.1 AA (contraste insuficiente).
