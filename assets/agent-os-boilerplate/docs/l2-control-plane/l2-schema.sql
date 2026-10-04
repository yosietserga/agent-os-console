-- ════════════════════════════════════════════════════════════════════════
-- L2 Control Plane — PostgreSQL DDL
-- ════════════════════════════════════════════════════════════════════════
-- Gestiona:
--   1. Catálogo de Aplicaciones Satélite (multi-tenant)
--   2. Catálogo Global de Modelos y Proveedores LLM
--   3. Perfiles de Enrutamiento y Resiliencia por App
--   4. Registro de Despliegue de Manifiestos (.agent.md)
--   5. Ledger Inmutable de Auditoría y Consumo de Tokens
--
-- Versión: 1.0.0  —  2026-10-02
-- Compatible con: PostgreSQL 14+
-- ════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Catálogo de Aplicaciones Satélite (Tenants)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE l2_tenants_apps (
    app_id              VARCHAR(64)   PRIMARY KEY,
    name                VARCHAR(128)  NOT NULL,
    description         TEXT,
    api_key_hash        VARCHAR(64)   NOT NULL,  -- SHA-256 del API key del tenant
    status              VARCHAR(16)   NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DRAINING')),
    monthly_budget_usd  NUMERIC(10,4) NOT NULL DEFAULT 100.0000,
    current_cycle_spend_usd NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
    cycle_reset_at      TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE l2_tenants_apps IS 'Aplicaciones satélite que consumen el Control Plane L2. Aislamiento estricto por app_id.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Catálogo Global de Modelos y Proveedores
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE l2_model_registry (
    model_id                    VARCHAR(64)   PRIMARY KEY,
    provider                    VARCHAR(32)   NOT NULL,  -- openai, anthropic, google, deepseek, groq, cerebras, mistral, ollama, vllm, etc.
    display_name                VARCHAR(128)  NOT NULL,
    base_url                    TEXT          NOT NULL,
    api_protocol                VARCHAR(24)   NOT NULL DEFAULT 'OPENAI_COMPATIBLE'
        CHECK (api_protocol IN ('OPENAI_COMPATIBLE', 'ANTHROPIC_NATIVE', 'OLLAMA', 'GEMINI_NATIVE', 'CUSTOM')),
    tier                        VARCHAR(24)   NOT NULL
        CHECK (tier IN ('SLM_MICRO', 'FAST_CHEAP', 'GENERAL_PURPOSE', 'REASONING_FRONTIER')),
    input_cost_per_m_usd        NUMERIC(10,6) NOT NULL,  -- costo por 1M tokens de entrada
    output_cost_per_m_usd       NUMERIC(10,6) NOT NULL,  -- costo por 1M tokens de salida
    cached_input_cost_per_m_usd NUMERIC(10,6) NOT NULL DEFAULT 0,  -- costo de tokens cacheados (prompt caching)
    context_window              INT           NOT NULL,
    max_output_tokens           INT           NOT NULL,
    supports_vision             BOOLEAN       NOT NULL DEFAULT FALSE,
    supports_tools              BOOLEAN       NOT NULL DEFAULT FALSE,
    supports_grammar_decoding   BOOLEAN       NOT NULL DEFAULT TRUE,
    supports_prompt_caching     BOOLEAN       NOT NULL DEFAULT FALSE,
    sla_p95_latency_ms          INT           NOT NULL DEFAULT 1200,
    is_active                   BOOLEAN       NOT NULL DEFAULT TRUE,
    deprecated_at               TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE l2_model_registry IS 'Catálogo agnóstico de modelos. Cambiar de proveedor es UPDATE aquí, no código.';
COMMENT ON COLUMN l2_model_registry.tier IS 'SLM_MICRO (<3B), FAST_CHEAP (3-13B), GENERAL_PURPOSE (70B+), REASONING_FRONTIER (o-series, R1, etc.)';

-- Seed con modelos vigentes a 2026-10-02 (sustituir cuando se publiquen superiores)
INSERT INTO l2_model_registry (model_id, provider, display_name, base_url, api_protocol, tier, input_cost_per_m_usd, output_cost_per_m_usd, cached_input_cost_per_m_usd, context_window, max_output_tokens, supports_vision, supports_tools, supports_grammar_decoding, supports_prompt_caching, sla_p95_latency_ms) VALUES
  ('claude-4.5-sonnet',   'anthropic', 'Claude 4.5 Sonnet',  'https://api.anthropic.com',     'ANTHROPIC_NATIVE',    'REASONING_FRONTIER', 3.000000, 15.000000, 0.300000, 200000, 8192,  TRUE, TRUE, TRUE, TRUE, 2500),
  ('claude-4-opus',       'anthropic', 'Claude 4 Opus',      'https://api.anthropic.com',     'ANTHROPIC_NATIVE',    'REASONING_FRONTIER', 15.00000, 75.000000, 1.500000, 200000, 8192,  TRUE, TRUE, TRUE, TRUE, 4000),
  ('gpt-4.1',             'openai',    'GPT-4.1',            'https://api.openai.com',        'OPENAI_COMPATIBLE',   'GENERAL_PURPOSE',   2.500000, 10.000000, 1.250000, 1047576, 32768, TRUE, TRUE, TRUE, TRUE, 2000),
  ('gpt-4.1-mini',        'openai',    'GPT-4.1 mini',       'https://api.openai.com',        'OPENAI_COMPATIBLE',   'FAST_CHEAP',         0.400000, 1.600000, 0.100000, 1047576, 16384, TRUE, TRUE, TRUE, TRUE,  900),
  ('o3',                  'openai',    'o3',                 'https://api.openai.com',        'OPENAI_COMPATIBLE',   'REASONING_FRONTIER', 10.00000, 40.000000, 2.500000, 200000, 100000, FALSE, TRUE, FALSE, FALSE, 8000),
  ('o4-mini',             'openai',    'o4-mini',            'https://api.openai.com',        'OPENAI_COMPATIBLE',   'REASONING_FRONTIER', 1.100000, 4.400000, 0.275000, 200000, 100000, TRUE, TRUE, FALSE, FALSE, 5000),
  ('gemini-2.5-pro',      'google',    'Gemini 2.5 Pro',     'https://generativelanguage.googleapis.com', 'GEMINI_NATIVE', 'GENERAL_PURPOSE', 1.250000, 10.000000, 0.315000, 1048576, 8192, TRUE, TRUE, TRUE, TRUE, 2500),
  ('gemini-2.5-flash',    'google',    'Gemini 2.5 Flash',   'https://generativelanguage.googleapis.com', 'GEMINI_NATIVE', 'FAST_CHEAP',       0.075000, 0.300000, 0.018750, 1048576, 8192, TRUE, TRUE, TRUE, TRUE,  800),
  ('deepseek-v3.2',       'deepseek',  'DeepSeek V3.2',      'https://api.deepseek.com',      'OPENAI_COMPATIBLE',   'GENERAL_PURPOSE',   0.270000, 1.100000, 0.027000, 131072, 8192, FALSE, TRUE, TRUE, TRUE, 1800),
  ('deepseek-r2',         'deepseek',  'DeepSeek R2',        'https://api.deepseek.com',      'OPENAI_COMPATIBLE',   'REASONING_FRONTIER', 0.550000, 2.190000, 0.055000, 131072, 8192, FALSE, TRUE, FALSE, TRUE, 6000),
  ('llama-3.3-70b-groq',  'groq',      'Llama 3.3 70B (Groq)','https://api.groq.com',         'OPENAI_COMPATIBLE',   'GENERAL_PURPOSE',   0.590000, 0.790000, 0.000000, 131072, 32768, FALSE, TRUE, TRUE, FALSE,  300),
  ('llama-3.1-8b-cerebras','cerebras', 'Llama 3.1 8B (Cerebras)','https://api.cerebras.ai',    'OPENAI_COMPATIBLE',   'FAST_CHEAP',         0.100000, 0.100000, 0.000000, 131072, 8192, FALSE, TRUE, TRUE, FALSE,  150),
  ('qwen-2.5-vl-72b',     'ollama',    'Qwen 2.5 VL 72B',    'http://localhost:11434',        'OLLAMA',              'GENERAL_PURPOSE',   0.000000, 0.000000, 0.000000, 131072, 8192, TRUE, TRUE, TRUE, FALSE, 2000),
  ('mistral-small-local', 'vllm',      'Mistral Small (vLLM local)','http://localhost:8000',   'OPENAI_COMPATIBLE',   'FAST_CHEAP',         0.000000, 0.000000, 0.000000, 32768,  4096, FALSE, TRUE, TRUE, FALSE,  120),
  ('fraud-slm-local',     'vllm',      'Micro-SLM Fraude (vLLM local)','http://localhost:8000','OPENAI_COMPATIBLE',   'SLM_MICRO',          0.000000, 0.000000, 0.000000, 4096,   512, FALSE, FALSE, TRUE, FALSE,   90)
ON CONFLICT (model_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Perfiles de Enrutamiento y Resiliencia por App
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE l2_app_routing_profiles (
    id                              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id                          VARCHAR(64)   NOT NULL REFERENCES l2_tenants_apps(app_id) ON DELETE CASCADE,
    route_key                       VARCHAR(64)   NOT NULL,
    primary_model_id                VARCHAR(64)   NOT NULL REFERENCES l2_model_registry(model_id),
    fallback_model_id               VARCHAR(64)   NOT NULL REFERENCES l2_model_registry(model_id),
    escalation_model_id             VARCHAR(64)   REFERENCES l2_model_registry(model_id),
    timeout_ms                      INT           NOT NULL DEFAULT 3500,
    max_retries                     INT           NOT NULL DEFAULT 2,
    circuit_breaker_error_threshold NUMERIC(3,2)  NOT NULL DEFAULT 0.40,  -- θ_fail
    circuit_breaker_min_samples     INT           NOT NULL DEFAULT 10,    -- N_min
    circuit_breaker_reset_ms        INT           NOT NULL DEFAULT 30000, -- tiempo HALF_OPEN
    backoff_base_ms                 INT           NOT NULL DEFAULT 200,
    backoff_max_ms                  INT           NOT NULL DEFAULT 3000,
    escalation_criteria             JSONB,        -- reglas para escalar (ej. discrepancia aritmética)
    created_at                      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_app_route UNIQUE(app_id, route_key),
    CONSTRAINT chk_threshold_range CHECK (circuit_breaker_error_threshold BETWEEN 0.0 AND 1.0)
);

COMMENT ON TABLE l2_app_routing_profiles IS 'Configuración de resiliencia por (app_id, route_key). Define circuit breaker, backoff y escalado.';

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Registro de Despliegue de Manifiestos (.agent.md)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE l2_manifest_deployments (
    manifest_id         VARCHAR(64)   NOT NULL,
    version             VARCHAR(32)   NOT NULL,
    app_id              VARCHAR(64)   NOT NULL REFERENCES l2_tenants_apps(app_id) ON DELETE CASCADE,
    compiled_ast        JSONB         NOT NULL,   -- AST validado sintácticamente
    system_fingerprint  VARCHAR(64)   NOT NULL,   -- hash SHA-256 del system prompt
    is_active           BOOLEAN       NOT NULL DEFAULT FALSE,
    canary_weight       INT           NOT NULL DEFAULT 0 CHECK (canary_weight BETWEEN 0 AND 100),
    deployed_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deployed_by         VARCHAR(128),
    PRIMARY KEY (manifest_id, version)
);

CREATE INDEX idx_manifest_active ON l2_manifest_deployments (app_id) WHERE is_active = TRUE;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Ledger Inmutable de Auditoría y Consumo de Tokens
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE l2_cost_token_ledger (
    ledger_id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id              VARCHAR(128)  NOT NULL,
    app_id                  VARCHAR(64)   NOT NULL REFERENCES l2_tenants_apps(app_id),
    model_id                VARCHAR(64)   NOT NULL REFERENCES l2_model_registry(model_id),
    route_key               VARCHAR(64)   NOT NULL,
    execution_status        VARCHAR(24)   NOT NULL
        CHECK (execution_status IN ('SUCCESS', 'FALLBACK_SUCCESS', 'ESCALATED', 'FAILED_CIRCUIT', 'FATAL_ABORT', 'TIMEOUT', 'BUDGET_EXCEEDED')),
    prompt_tokens           INT           NOT NULL DEFAULT 0,
    completion_tokens       INT           NOT NULL DEFAULT 0,
    cached_tokens           INT           NOT NULL DEFAULT 0,
    cost_usd                NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    duration_ms             INT           NOT NULL,
    circuit_state_on_entry  VARCHAR(16)   NOT NULL
        CHECK (circuit_state_on_entry IN ('CLOSED', 'OPEN', 'HALF_OPEN')),
    retries_attempted       INT           NOT NULL DEFAULT 0,
    error_code              VARCHAR(64),
    error_message           TEXT,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Ledger es append-only: bloquear UPDATE y DELETE
CREATE OR REPLACE FUNCTION block_ledger_mutation() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'l2_cost_token_ledger is append-only (Regla P9). INSERT only.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_ledger BEFORE UPDATE ON l2_cost_token_ledger
    FOR EACH ROW EXECUTE FUNCTION block_ledger_mutation();
CREATE TRIGGER no_delete_ledger BEFORE DELETE ON l2_cost_token_ledger
    FOR EACH ROW EXECUTE FUNCTION block_ledger_mutation();

CREATE INDEX idx_ledger_app_timestamp ON l2_cost_token_ledger (app_id, created_at DESC);
CREATE INDEX idx_ledger_model_perf    ON l2_cost_token_ledger (model_id, created_at DESC)
    INCLUDE (duration_ms, execution_status);
CREATE INDEX idx_ledger_routing_lookup ON l2_cost_token_ledger (app_id, route_key, created_at DESC);
CREATE INDEX idx_ledger_request_id    ON l2_cost_token_ledger (request_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Estado del Circuit Breaker (en memoria de Redis, pero persistido aquí)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE l2_circuit_breaker_state (
    app_id              VARCHAR(64)   NOT NULL,
    route_key           VARCHAR(64)   NOT NULL,
    model_id            VARCHAR(64)   NOT NULL REFERENCES l2_model_registry(model_id),
    state               VARCHAR(16)   NOT NULL
        CHECK (state IN ('CLOSED', 'OPEN', 'HALF_OPEN')),
    failure_count       INT           NOT NULL DEFAULT 0,
    success_count       INT           NOT NULL DEFAULT 0,
    last_failure_at     TIMESTAMPTZ,
    opened_at           TIMESTAMPTZ,
    next_half_open_at   TIMESTAMPTZ,
    PRIMARY KEY (app_id, route_key, model_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. Vista de KPIs L2 (para sil trend)
-- ─────────────────────────────────────────────────────────────────────────
CREATE VIEW v_l2_kpis AS
SELECT
    app_id,
    route_key,
    COUNT(*)                                                              AS total_requests,
    COUNT(*) FILTER (WHERE execution_status = 'SUCCESS')                  * 100.0
        / NULLIF(COUNT(*), 0)                                             AS success_rate_pct,
    COUNT(*) FILTER (WHERE execution_status IN ('FAILED_CIRCUIT','FATAL_ABORT','TIMEOUT','BUDGET_EXCEEDED'))
                                                                          AS failure_count,
    AVG(duration_ms)                                                      AS avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)             AS p95_latency_ms,
    SUM(cost_usd)                                                         AS total_cost_usd,
    SUM(prompt_tokens)                                                    AS total_prompt_tokens,
    SUM(completion_tokens)                                                AS total_completion_tokens,
    SUM(cached_tokens)                                                    AS total_cached_tokens
FROM l2_cost_token_ledger
GROUP BY app_id, route_key;

COMMENT ON VIEW v_l2_kpis IS 'KPIs de Control Plane L2 por app y route. Consumida por scripts/sil-trend.sh.';

-- ════════════════════════════════════════════════════════════════════════
-- FIN DEL DDL — Aplicar con: psql "$DATABASE_URL" -f l2-schema.sql
-- ════════════════════════════════════════════════════════════════════════
