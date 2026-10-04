# Matriz de los 4 Arquetipos Satélite

> Los 4 arquetipos definen perfiles operativos canónicos de aplicaciones que
> consumen el Control Plane L2. Cada uno tiene SLA, modelo primario, fallback,
> escalado y criterios de disparo propios.

---

## Arquetipo 1: Vision-to-Spec

| Atributo | Valor |
| :--- | :--- |
| **SLA de latencia** | $8000\text{ ms}$ |
| **Modelo Primario** | Gemini 2.5 Flash (visión) |
| **Fallback (Circuit Open)** | Qwen 2.5 VL 72B (local vía Ollama) |
| **Escalado por Validación** | **Upgrade** → Claude 4.5 Sonnet |
| **Criterio de disparo del escalado** | Extracción OCR incompleta o contradicción en detección de idioma detectada por validador determinista. |
| **Tareas típicas** | Especificación de productos desde fotos, lectura de planos técnicos, escaneo de etiquetas nutricionales. |
| **Tier recomendado** | `GENERAL_PURPOSE` con escalado a `REASONING_FRONTIER`. |

### Validadores deterministas post-inferencia
```json
{
  "validators": [
    { "name": "ocr_completeness", "check": "all_required_fields_present", "on_fail": "ESCALATE" },
    { "name": "language_consistency", "check": "detected_lang == expected_lang", "on_fail": "ESCALATE" }
  ]
}
```

---

## Arquetipo 2: Accounting-OCR

| Atributo | Valor |
| :--- | :--- |
| **SLA de latencia** | $4000\text{ ms}$ |
| **Modelo Primario** | DeepSeek V3.2 |
| **Fallback (Circuit Open)** | GPT-4.1 mini |
| **Escalado por Validación** | **Upgrade** → DeepSeek R2 / o3 |
| **Criterio de disparo del escalado** | Discrepancia aritmética: $\sum \text{items} + \text{tax} \neq \text{total}$ (tolerancia ±1 centavo). |
| **Tareas típicas** | Extracción de facturas, conciliación bancaria, lectura de recibos. |
| **Tier recomendado** | `GENERAL_PURPOSE` con escalado a `REASONING_FRONTIER` ante desbalance. |

### Validadores deterministas post-inferencia
```json
{
  "validators": [
    {
      "name": "accounting_balance",
      "expression": "sum(items) + tax == total",
      "tolerance_cents": 1,
      "on_fail": "ESCALATE",
      "escalation_model_id": "deepseek-r2"
    }
  ]
}
```

### Razón del escalado a R2/o3

Los modelos de razonamiento de frontera (DeepSeek R2, o3) resuelven
discrepancias aritméticas en una pasada adicional, mientras que los
general-purpose a menudo repiten el error. El costo extra se justifica
porque un asiento contable incorrecto tiene impacto financiero real.

---

## Arquetipo 3: Commerce-Bot

| Atributo | Valor |
| :--- | :--- |
| **SLA de latencia** | $800\text{ ms}$ |
| **Modelo Primario** | Llama 3.3 70B (Groq) |
| **Fallback (Circuit Open)** | Cerebras Llama 3.1 8B |
| **Escalado por Validación** | **Downgrade** → Mistral Small (vLLM local) |
| **Criterio de disparo del escalado** | Caída de hardware de baja latencia (Groq/Cerebras ambos en OPEN); compacta contexto al último turno del usuario. |
| **Tareas típicas** | Chatbot de e-commerce, recomendación de productos, asistente de checkout. |
| **Tier recomendado** | `FAST_CHEAP` con downgrade a `SLM_MICRO` local ante caída doble. |

### Estrategia de degradación graceful

Cuando tanto Groq como Cerebras están en `OPEN`:
1. Compactar el contexto: conservar solo el último turno del usuario + system prompt reducido.
2. Invocar Mistral Small en vLLM local (latencia ~120ms).
3. Si el usuario reporta baja calidad, escalar manualmente a general-purpose (Llama 3.3 70B vía Together).

---

## Arquetipo 4: Fraud-Guard

| Atributo | Valor |
| :--- | :--- |
| **SLA de latencia** | $90\text{ ms}$ |
| **Modelo Primario** | Micro-SLM Local (vLLM, modelo <3B cuantizado) |
| **Fallback (Circuit Open)** | Motor de Reglas L1 (sin LLM) |
| **Escalado por Validación** | **Fail-Safe** → Denegación Preventiva |
| **Criterio de disparo del escalado** | Petición $> 90\text{ ms}$ aborta inferencia; aplica regla heurística sin LLM. |
| **Tareas típicas** | Detección de fraude en tiempo real, scoring de riesgo transaccional, filtro de spam. |
| **Tier recomendado** | `SLM_MICRO` con fail-safe determinista. |

### Arquitectura fail-safe

Fraud-Guard **no puede** tolerar latencia > 90ms:
1. El cliente L2 envía la petición al SLM local con `AbortController(90ms)`.
2. Si el SLM responde a tiempo → decisión del modelo.
3. Si timeout/circuit-open → el motor de reglas L1 (sin LLM, SQL o Rust puro)
   aplica heurísticas: IP sospechosa, monto atípico, frecuencia anómala.
4. Ante la duda, **denegar** (fail-safe): es preferible un falso positivo que un fraude consumado.

### Motor de reglas L1 (esquema)

```sql
CREATE TABLE fraud_rules_l1 (
    rule_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    priority        INT NOT NULL,
    condition_sql   TEXT NOT NULL,  -- expresión SQL que devuelve booleano
    action          VARCHAR(16) NOT NULL CHECK (action IN ('ALLOW','DENY','REVIEW')),
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Tabla comparativa

| Arquetipo | SLA | Primario | Fallback | Escalado | Disparo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Vision-to-Spec | 8000ms | Gemini 2.5 Flash | Qwen 2.5 VL 72B | Upgrade → Claude 4.5 | OCR incompleto / idioma contradictorio |
| Accounting-OCR | 4000ms | DeepSeek V3.2 | GPT-4.1 mini | Upgrade → DeepSeek R2 / o3 | Discrepancia aritmética |
| Commerce-Bot | 800ms | Llama 3.3 70B (Groq) | Cerebras Llama 3.1 8B | Downgrade → Mistral Small | Caída doble de HW rápido |
| Fraud-Guard | 90ms | Micro-SLM (vLLM) | Reglas L1 (sin LLM) | Fail-Safe → Denegación | Petición > 90ms |

---

## Cómo registrar un nuevo arquetipo

1. Definir SLA de latencia objetivo.
2. Elegir modelo primario de `l2_model_registry` (tier apropiado).
3. Elegir fallback del mismo tier o inferior con capacidades equivalentes.
4. Definir criterio de escalado (validador determinista o condición de red).
5. Insertar fila en `l2_app_routing_profiles` con la configuración.
6. Documentar el arquetipo en este archivo (nueva sección).

> **Principio rector:** cada arquetipo debe poder degradar con elegancia sin
> romper la experiencia del usuario final. Un `FATAL_ABORT` visible para el
> usuario es un fallo de diseño del arquetipo.
