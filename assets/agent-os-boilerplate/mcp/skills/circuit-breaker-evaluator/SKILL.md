# Skill: circuit-breaker-evaluator

> Calcula y simula el estado del circuit breaker y los tiempos de backoff ante
> una serie histórica de fallos de un modelo. Implementa las fórmulas de
> `docs/l2-control-plane/resilience-math.md`.

## Contrato

### Input
```json
{
  "appId": "commerce-app",
  "routeKey": "commerce-bot",
  "modelId": "llama-3.3-70b-groq",
  "history": [
    { "ts": "2026-10-02T10:00:00Z", "status": "SUCCESS", "durationMs": 350 },
    { "ts": "2026-10-02T10:00:01Z", "status": "FAILED_CIRCUIT", "errorCode": "503", "durationMs": 5000 },
    { "ts": "2026-10-02T10:00:02Z", "status": "TIMEOUT", "durationMs": 800 }
  ],
  "config": {
    "minSamples": 10,
    "failThreshold": 0.40,
    "resetMs": 30000,
    "backoffBaseMs": 200,
    "backoffMaxMs": 3000
  }
}
```

### Output
```json
{
  "currentState": "OPEN",
  "failureRate": 0.42,
  "samplesCount": 12,
  "openedAt": "2026-10-02T10:00:02Z",
  "nextHalfOpenAt": "2026-10-02T10:00:32Z",
  "projectedBackoffMs": [200, 480, 1240, 3000],
  "recommendation": "Route to fallback_model_id 'cerebras-llama-3.1-8b' until half-open canary succeeds."
}
```

## Fórmulas implementadas

- $R_{\text{fail}} = \frac{\sum \mathbb{I}(e_i \in \{5xx,429,Timeout\})}{N}$
- Apertura: $N \ge N_{\min} \land R_{\text{fail}} \ge \theta_{\text{fail}}$
- Backoff: $T_{\text{sleep}}^{(k)} = \min(T_{\max}, \text{random}(T_{\text{base}}, T_{\text{prev}} \times 3))$

## Reglas que aplica

- Best Practice #21, #22, #29 (circuit breaker, backoff, half-open canary).
- Antipatrones #3, #4 (reintentos ciegos, ausencia de breaker) — previene.

## Implementación de referencia

`src/index.ts` — TypeScript puro (sin LLM). Lee histórico de
`l2_cost_token_ledger` vía `postgres-inspector` MCP server.
