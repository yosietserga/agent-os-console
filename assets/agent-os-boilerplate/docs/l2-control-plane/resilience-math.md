# Resiliencia Matemática del Control Plane L2

> Especificación formal de los mecanismos de resiliencia del Control Plane L2.
> Toda implementación del cliente L2 (en cualquier lenguaje) DEBE cumplir estas
> fórmulas con rigor.

---

## 1. Circuit Breaker con Ventana Deslizante

### 1.1 Estados del interruptor

```
        failure_rate >= θ_fail            (reset timer expira)
   ┌────────────────────────┐      ┌─────────────────────┐
   │                        ▼      │                     ▼
┌───┴──────┐           ┌────────────┐           ┌─────────────┐
│  CLOSED  │◄──────────│    OPEN    │──────────►│  HALF_OPEN  │
│ (normal) │  success  │ (bloqueado)│  canary   │ (1 prueba)  │
└──────────┘           └────────────┘           └─────────────┘
   │   ▲                                             │
   │   │ success                                     │
   │   └─────────────────────────────────────────────┘
   │
   │ failure (cuenta)
   ▼
```

### 1.2 Cálculo de la tasa de fallos

Para un modelo $M$ dentro de una ventana deslizante con $N$ muestras:

$$R_{\text{fail}} = \frac{\sum_{i=1}^{N} \mathbb{I}(e_i \in \{5xx, 429, \text{Timeout}\})}{N}$$

Donde $\mathbb{I}(\cdot)$ es la función indicadora que vale 1 si el error $e_i$
es transitorio (HTTP 5xx, 429, o timeout) y 0 en caso contrario.

### 1.3 Condición de apertura

El interruptor conmuta de `CLOSED` → `OPEN` si y solo si:

$$N \ge N_{\min} \quad \land \quad R_{\text{fail}} \ge \theta_{\text{fail}}$$

Con valores por defecto:
- $N_{\min} = 10$ muestras mínimas (evita decisiones precipitadas)
- $\theta_{\text{fail}} = 0.40$ (40% de fallos)

### 1.4 Condición de half-open

Tras $T_{\text{reset}}$ milisegundos en estado `OPEN` (default 30000ms), el
interruptor pasa a `HALF_OPEN` y permite **una única** petición de canary:
- Si la petición canary tiene éxito → `CLOSED` (reset contadores).
- Si la petición canary falla → `OPEN` (reinicia $T_{\text{reset}}$).

### 1.5 Persistencia del estado

El estado del circuit breaker se persiste en `l2_circuit_breaker_state`
(ver `l2-schema.sql` §6) y se replica en Redis para acceso sub-milisegundo.

---

## 2. Backoff Exponencial con Jitter Decorrelacionado

### 2.1 Problema: thundering herd

Cuando un proveedor LLM recupera servicio tras una caída, todos los clientes
reintentan simultáneamente, causando una segunda caída. La solución es
**decorrelacionar** los reintentos mediante jitter aleatorio.

### 2.2 Fórmula canónica (AWS "Exponential Backoff With Decorrelated Jitter")

Para el intento $k$-ésimo (con $k \ge 1$):

$$T_{\text{sleep}}^{(k)} = \min\left(T_{\max}, \; \text{random}(T_{\text{base}}, \; T_{\text{prev}} \times 3)\right)$$

Donde:
- $T_{\text{base}} = 200\text{ ms}$ — espera mínima absoluta.
- $T_{\max} = 3000\text{ ms}$ — techo para evitar esperas absurdas.
- $T_{\text{prev}}$ — tiempo dormido en el intento anterior (en el primer intento, $T_{\text{prev}} = T_{\text{base}}$).
- $\text{random}(a, b)$ — distribución uniforme en $[a, b)$.

### 2.3 Pseudocódigo (lenguaje-agnóstico)

```
function retry_with_decorrelated_jitter(operation, max_retries, T_base, T_max):
    T_prev = T_base
    for k in 1..max_retries:
        try:
            return operation()
        except TransientError as e:  # solo 5xx, 429, timeout
            if k == max_retries:
                raise
            T_sleep = min(T_max, random_uniform(T_base, T_prev * 3))
            sleep(T_sleep)
            T_prev = T_sleep
        except NonRetryableError:  # 400, 401, 403, 422
            raise  # NUNCA reintentes errores no transitorios
```

### 2.4 Errores que SÍ se reintentan vs. NO

| HTTP / Tipo | Reintentable | Justificación |
| :--- | :--- | :--- |
| 429 Too Many Requests | SÍ | Throttle transitorio del proveedor. |
| 500 Internal Server Error | SÍ | Error transitorio del proveedor. |
| 502/503/504 | SÍ | Gateway errors transitorios. |
| Network timeout | SÍ | Latencia transitoria. |
| 400 Bad Request | NO | Error de cliente; reintentar no ayuda. |
| 401/403 | NO | Credenciales inválidas; escalar a humano. |
| 404 | NO | Recurso inexistente. |
| 422 Unprocessable | NO | Error semántico del payload. |

---

## 3. Fallback Automático Transparente

Cuando el circuit breaker del modelo primario está `OPEN`:

1. La petición se enruta al `fallback_model_id` del `l2_app_routing_profiles`.
2. El ledger registra `execution_status = 'FALLBACK_SUCCESS'` (o `'FAILED_CIRCUIT'` si también cae).
3. El cliente recibe la respuesta sin notar el cambio de modelo (salvo el campo
   `ModelUsed` en el envelope de respuesta).

### 3.1 Reglas de fallback

- El fallback DEBE ser del mismo tier o inferior (nunca superior sin justificación).
- El fallback DEBE soportar las mismas capacidades (vision, tools) que el primario.
- Si el fallback también falla, se escala a `escalation_model_id` (si está definido).

---

## 4. Escalado Condicional por Validación de Contenido

El escalado NO es solo reactivo (fallos) sino también **proactivo** (calidad).

### 4.1 Criterios de escalado por arquetipo

| Arquetipo | Criterio de Escalado | Modelo de Escalado |
| :--- | :--- | :--- |
| Vision-to-Spec | OCR incompleto o contradicción de idioma detectada | Upgrade → Claude 4.5 Sonnet |
| Accounting-OCR | $\sum \text{items} + \text{tax} \neq \text{total}$ (discrepancia aritmética) | Upgrade → DeepSeek R2 / o3 |
| Commerce-Bot | Caída de hardware de baja latencia (Groq/Cerebras) | Downgrade → Mistral-Small local |
| Fraud-Guard | Petición excede 90ms | Fail-Safe → Denegación preventiva (sin LLM) |

### 4.2 Validadores deterministas post-inferencia

Cada arquetipo registra validadores en `escalation_criteria` (JSONB):
```json
{
  "validator": "accounting_balance",
  "expression": "sum(items) + tax == total",
  "tolerance_cents": 1,
  "on_fail": "ESCALATE",
  "escalation_model_id": "deepseek-r2"
}
```

---

## 5. Presupuesto y AbortController

### 5.1 Presupuesto por petición

El envelope `L2CognitiveRequest` incluye `MaxBudgetUSD`. El cliente L2:
1. Estima el costo de la petición antes de invocar (tokens estimados × costo del modelo).
2. Si la estimación excede `MaxBudgetUSD` → aborta con `BUDGET_EXCEEDED`.
3. Tras la inferencia, registra el costo real en `l2_cost_token_ledger`.

### 5.2 Presupuesto por tenant (mensual)

`l2_tenants_apps.monthly_budget_usd` define el techo mensual. El cliente L2:
1. Antes de cada petición, consulta `current_cycle_spend_usd`.
2. Si `current_cycle_spend_usd + estimated_cost > monthly_budget_usd` → aborta.
3. Resetea el contador en `cycle_reset_at`.

### 5.3 AbortController por SLA de latencia

Toda invocación HTTP al proveedor LLM DEBE usar `AbortController` (o equivalente)
con timeout = `MaxLatencyMs` del envelope:

```typescript
// Ejemplo TypeScript (el patrón es análogo en Python/Go/Rust/PHP/C++)
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), maxLatencyMs);
try {
  const res = await fetch(modelUrl, { ...opts, signal: controller.signal });
  clearTimeout(timer);
  return await res.json();
} catch (e) {
  clearTimeout(timer);
  if (e.name === 'AbortError') throw new TimeoutError(maxLatencyMs);
  throw e;
}
```

---

## 6. Ledger Financiero Inmutable

Toda invocación L2 genera exactamente **una** fila en `l2_cost_token_ledger` con:

| Campo | Fuente |
| :--- | :--- |
| `prompt_tokens`, `completion_tokens`, `cached_tokens` | Respuesta del proveedor (usage object). |
| `cost_usd` | Cálculo: `(prompt - cached) * input_cost + cached * cached_cost + completion * output_cost`, todo dividido por 1_000_000. |
| `duration_ms` | `Date.now()` antes y después de la invocación. |
| `execution_status` | SUCCESS / FALLBACK_SUCCESS / ESCALATED / FAILED_CIRCUIT / FATAL_ABORT / TIMEOUT / BUDGET_EXCEEDED. |
| `circuit_state_on_entry` | Estado del breaker ANTES de la invocación. |
| `retries_attempted` | Contador de reintentos con backoff. |

La tabla tiene triggers `BEFORE UPDATE` y `BEFORE DELETE` que bloquean toda
mutación (Regla P9 — append-only).

---

## 7. Referencias

- AWS Architecture Blog: "Exponential Backoff and Jitter" (2015).
- Microsoft: "Circuit Breaker pattern" (Cloud Design Patterns).
- PostgreSQL docs: `PERCENTILE_CONT`, `FILTER` clause, trigger-based immutability.
- OpenTelemetry: distributed tracing para correlación L2.
