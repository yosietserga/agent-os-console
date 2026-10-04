# Skill: memory-sync

> Lee y anexa registros atómicamente a la memoria empírica. Garantiza la
> invariante append-only (Regla P9) y la numeración monótona de IDs.

## Contrato

### Input
```json
{
  "type": "AP | WIN | WORKLOG",
  "payload": {
    "title": "Título conciso",
    "date": "2026-10-02",
    "class": "W1",                           // solo para WIN
    "porterForce": "Fuerza 2 (Poder de Proveedores)",
    "evidence": "comando ejecutado + exit code + stdout",
    "impact": "qué cambia para el sistema",
    "rootCause": "...",                      // solo para AP
    "correctiveRule": "..."                  // solo para AP
  }
}
```

### Output
```json
{
  "id": "WIN-009",
  "appended": true,
  "filePath": "docs/memory/wins-ledger.md",
  "lineRange": [142, 158],
  "verified": true
}
```

## Invariantes que garantiza

1. **Append-only (P9):** usa `fs.appendFile` o `>>`; nunca reescribe.
2. **ID monótono:** escanea el archivo, encuentra el último ID (`WIN-NNN`),
   asigna `WIN-NNN+1`.
3. **Schema validation:** valida el payload con Zod antes de escribir.
4. **Atomicidad:** escribe en una sola operación `appendFile`; si falla, no
   deja estado parcial.
5. **Auditoría:** cada invocación se registra en `docs/memory/worklog.md` con
   timestamp, ID generado y hash del contenido anexado.

## Reglas que aplica

- Best Practice #91 (Registro append-only de aprendizaje).
- Best Practice #95 (Cuantificación de victorias PSIM).
- Antipatrones #71 (Borrado de lecciones) — previene.

## Ejemplo

```
skill memory-sync --input '{
  "type": "WIN",
  "payload": {
    "title": "Circuit Breaker L2 implementado",
    "date": "2026-10-02",
    "class": "W1",
    "porterForce": "Fuerza 2 (Poder de Proveedores)",
    "evidence": "cargo test test_circuit_breaker — exit 0 — 45ms",
    "impact": "Caídas de proveedor conmutan en <15ms"
  }
}'
```

## Implementación de referencia

`src/index.ts` — TypeScript puro. Lee/escribe archivos de `docs/memory/`.
