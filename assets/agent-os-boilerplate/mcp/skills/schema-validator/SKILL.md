# Skill: schema-validator

> Valida que los esquemas de aplicación (Zod, OpenAPI, Pydantic, Protobuf)
> coinciden con las definiciones DDL de la base de datos. Previene drift de
> contratos (Antipatrón #36).

## Contrato

### Input
```json
{
  "schemaPath": "src/schemas/order.ts | openapi.yaml | order.py",
  "schemaType": "zod | openapi | pydantic | protobuf",
  "ddlSource": { "connectionString": "..." } | { "ddlPath": "docs/l2-control-plane/l2-schema.sql" },
  "entity": "l2_tenants_apps | orders | users"
}
```

### Output
```json
{
  "valid": false,
  "discrepancies": [
    {
      "field": "monthly_budget_usd",
      "schemaType": "number (float)",
      "ddlType": "NUMERIC(10,4)",
      "severity": "warning",
      "recommendation": "Use integer cents (Best Practice #49) or keep NUMERIC(10,4) and add currency code (Best Practice #50)."
    }
  ],
  "memoryEntryId": "AP-013"
}
```

## Reglas que aplica

- Best Practice #43 (Validación bidireccional de contratos).
- Best Practice #19 (Single source of truth para esquemas).
- Antipatrón #36 (Contratos OpenAPI desactualizados) — previene.

## Ejemplo de invocación

```
skill schema-validator --input '{
  "schemaPath": "src/schemas/order.ts",
  "schemaType": "zod",
  "ddlSource": { "connectionString": "env:DATABASE_URL" },
  "entity": "orders"
}'
```

## Implementación de referencia

`src/index.ts` — TypeScript con Drizzle introspection + ts-morph para parsear
Zod schemas. Sin dependencias de LLM.
