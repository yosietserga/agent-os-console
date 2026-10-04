# Persona: Operator

- **Id:** operator
- **Rol:** Usuario operativo (data entry, soporte, atención al cliente)
- **Meta principal:** Completar transacciones rápidas y precisas.
- **Permisos:** CRUD sobre entidades operativas; lectura de auditoría.
- **Dispositivo típico:** Desktop (1366×768).
- **Rutas esperadas:** /cms/posts, /orders, /customers
- **Criterios de éxito:**
  - Formularios con validación inmediata (no al submit).
  - Acciones destructivas piden confirmación.
  - Estados loading/empty/error/success visibles.
- **Criterios de fracaso:**
  - Formularios que pierden datos tras error.
  - Botones táctiles <44px.
  - Lenguaje técnico en mensajes al usuario.
