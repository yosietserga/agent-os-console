# Agent OS Boilerplate

> **Sistema Universal de Control Agéntico, Memoria Empírica Reusable y Gobernanza L2**
> Plantilla boilerplate agnóstica al LLM/SLM para contextualización de procesos agénticos.
> Actualizada: **2026-10-06** · **Versión 2.2.0**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![LLM Agnostic](https://img.shields.io/badge/LLM-Agnostic-blue)](#stack-agnóstico)
[![Polyglot](https://img.shields.io/badge/Polyglot-TS%7CPHP%7CPy%7CGo%7CRust%7CC%2B%2B-green)](#matriz-polyglot)
[![Version](https://img.shields.io/badge/version-2.2.0-purple)](#changelog)
[![Constitución Agéntica](https://img.shields.io/badge/v2.2.0-constituci%C3%B3n%20ag%C3%A9ntica-blue)](#changelog)

---

## ¿Por qué existe este boilerplate?

Porque estás cansado de escribir lo mismo en cada proyecto, para cada LLM, para
modelar y moderar su comportamiento. Esta plantilla captura **una vez** toda la
gobernanza agéntica — reglas, memoria, resiliencia, medición — y la hace reusable
en cualquier repositorio, con cualquier proveedor LLM/SLM y en cualquier lenguaje.

> **Filosofía:** *"Escribe las reglas una vez. Opéralas para siempre."*
>
> **Objetivo:** que el operador pueda decir **"clona este repo y crea una app…"**
> y todo quede por sentado — sin más agotamientos, ni desgastes, ni degradaciones.

---

## Tabla de contenidos

1. [Visión arquitectónica](#1-visión-arquitectónica)
2. [Diagrama maestro del workflow de cada prompt](#2-diagrama-maestro-del-workflow-de-cada-prompt)
3. [Path secuencial — Pipeline de 5 fases](#3-path-secuencial--pipeline-de-5-fases)
4. [Paths alternos — Dispatch por comando](#4-paths-alternos--dispatch-por-comando)
5. [Paths recíprocos — Feedback loops](#5-paths-recíprocos--feedback-loops)
6. [Paths paralelos — Concurrencia agéntica](#6-paths-paralelos--concurrencia-agéntica)
7. [Estructura del repositorio](#7-estructura-del-repositorio)
8. [Stack agnóstico](#8-stack-agnóstico)
9. [Fórmula canónica de operación](#9-fórmula-canónica-de-operación)
10. [Las 15 Reglas Cardinales + W-CTA](#10-las-15-reglas-cardinales--w-cta)
11. [Gobernanza PRE-v2.0](#11-gobernanza-pre-v20)
12. [Medición PSIM](#12-medición-psim)
13. [Control Plane L2](#13-control-plane-l2)
14. [Cómo usar esta plantilla](#14-cómo-usar-esta-plantilla)
15. [Configuración inicial](#15-configuración-inicial)
16. [Changelog](#16-changelog)

---

## 1. Visión arquitectónica

```
                         ╔═══════════════════════════════════════════════════╗
                         ║              OPERADOR HUMANO                      ║
                         ║   "lee AGENTS.md, ejecuta: <comando>"             ║
                         ╚════════════════════════╤══════════════════════════╝
                                                  │
                                                  ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          CAPA DE CONSTITUCIÓN (L0)                           ║
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────────┐   ║
║   │                         AGENTS.md (Documento Cero)                   │   ║
║   │  19 reglas (P1–P18 + W-CTA)   ·  19 comandos canónicos  ·  5 fases  │   ║
║   └──────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
║   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             ║
║   │ CLAUDE-CODE.md  │  │  CURSOR-RULES   │  │   GEMINI.md     │  + Copilot  ║
║   │  (entrypoint)   │  │   .md (entry)   │  │  (entrypoint)   │             ║
║   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             ║
║            └────────────────────┼────────────────────┘                       ║
║                                 │ todos apuntan a AGENTS.md                  ║
╚─────────────────────────────────┼─────────────────────────────────────────────╝
                                  │
                                  ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                       CAPA DE MEMORIA EMPÍRICA (L-1)                         ║
║                          docs/memory/  (append-only, P9)                     ║
║                                                                              ║
║   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          ║
║   │ anti-patterns.md │  │  wins-ledger.md  │  │    worklog.md    │          ║
║   │   (AP-001..014)  │  │  (WIN-001..009)  │  │ (SESSION-000..)  │          ║
║   └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          ║
║            │                     │                     │                     ║
║            └────────────────────┼────────────────────┘                      ║
║                                 ▼                                             ║
║                       ┌──────────────────┐                                   ║
║                       │    state.json    │  (KPIs K1–K5, baselines)         ║
║                       └──────────────────┘                                   ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    CAPA DE EJECUCIÓN AGÉNTICA (L1)                           ║
║                                                                              ║
║   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        ║
║   │  Pipeline   │  │  Scripts    │  │  MCP        │  │  packages/  │        ║
║   │  5 Fases    │  │  scripts/   │  │  servers/   │  │  eval/      │        ║
║   │  F0→F1→F5   │  │  (11 cmds)  │  │  (5 srvs)   │  │  (Juez P3)  │        ║
║   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                                  │
                                  ▼
╔═══════════════════════════════════════════════════════════════════════════════╗
║                  CAPA DE CONTROL PLANE COGNITIVO (L2)                        ║
║                                                                              ║
║   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          ║
║   │ l2_model_registry│  │ l2_app_routing   │  │ l2_cost_token   │          ║
║   │ (modelos LLM/SLM)│  │ _profiles (CB)   │  │ _ledger (P9)    │          ║
║   └──────────────────┘  └──────────────────┘  └──────────────────┘          ║
║                                                                              ║
║   Circuit Breaker:  CLOSED ⇌ OPEN ⇌ HALF_OPEN                                ║
║   Backoff:  T = min(Tmax, random(Tbase, Tprev × 3))                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Diagrama maestro del workflow de cada prompt

Este es el flujo completo que sigue **cada prompt** enviado por el operador.
Ilustra los 4 tipos de paths: **secuenciales** (↓), **alternos** (◇), **recíprocos**
(↔) y **paralelos** (║).

```
╔═════════════════════════════════════════════════════════════════════════════════════════╗
║                         WORKFLOW MAESTRO DE CADA PROMPT                                 ║
╚═════════════════════════════════════════════════════════════════════════════════════════╝

 [OPERADOR]  "lee AGENTS.md, ejecuta: <comando> [params]"
     │
     ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────┐
 │  PASO 1 — INGESTA DEL PROMPT                                                        │
 │  El LLM/SLM recibe el prompt y detecta el patrón canónico                           │
 │  "lee AGENTS.md, ejecuta: X"                                                        │
 └────────────────────────────────────────────┬────────────────────────────────────────┘
                                              │
                                              ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────┐
 │  PASO 2 — FASE 0 (AUDITORÍA DE PREMISAS & MEMORY SYNC)  ── PATHS PARALELOS          │
 │                                                                                     │
 │   ╔═════════════════════╗   ╔═════════════════════╗   ╔═════════════════════╗       ║
 │   ║  Leer AGENTS.md     ║   ║ Leer anti-patterns  ║   ║ Leer último bloque ║       ║
 │   ║  (Documento Cero)   ║   ║  .md (AP-001..014)  ║   ║ de worklog.md      ║       ║
 │   ╚═════════╤═══════════╝   ╚═════════╤═══════════╝   ╚═════════╤═══════════╝       ║
 │             └──────────────┬──────────┴─────────────────────────┘                   ║
 │                            ▼                                                         ║
 │   ╔═══════════════════════════════════════════════════════════════╗                 ║
 │   ║  Leer últimos 3 reportes de docs/reports/ (epoch desc)        ║                 ║
 │   ╚═══════════════════════════════════════════════════════════════╝                 ║
 │                            │                                                         │�
 │                            ▼                                                         ║
 │   ╔═══════════════════════════════════════════════════════════════╗                 ║
 │   ║  Declarar DEV_OS / DEPLOY_OS (Regla P10)                     ║                 ║
 │   ║  Verificar infraestructura local (DB, Redis, puertos)        ║                 ║
 │   ║  Declarar alcance planificado                                ║                 ║
 │   ╚═══════════════════════════════════════════════════════════════╝                 │
 └────────────────────────────────────┬────────────────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────┐
 │  PASO 3 — DISPATCH DE COMANDO  ── PATHS ALTERNOS (18 rutas + alias rayos-x)         │
 │                                                                                     │
 │            ┌─── start ──────────────► [bootstrap + migrate + seed + serve]          │
 │            ├─── cold run [scope] ──► [auditoría read-only]                          │
 │            │   └─ reverse-engineer ► [radiografía rayos X 5 etapas]                 │
 │            │   └─ rayos-x (alias) ─► [branding + 3D + negocio + clon + verify]     │
 │            ├─── itera [N] ─────────► [procesa N tareas del worklog]                 │
 │            ├─── verify ────────────► [gate-honesty multi-stack]                     │
 │            ├─── audit memory ──────► [anti-reincidencia AP]                         │
 │            ├─── sil trend ─────────► [recalcular K1–K5 + W1–W8]                     │
 │            ├─── pre cycle ─────────► [juez PRE-v2.0 sobre propuesta]                │
 │            ├─── report ────────────► [cierre AGREE/DISAGREE → docs/reports/]        │
 │            ├─── ui test <route> ───► [browser MCP + P5/P6/P7 + WCAG]                │
 │            ├─── persona check ─────► [iterar docs/personas/ → W6]                   │
 │            ├─── ide [detect|all] ──► [auto-activation 16 IDEs]                      │
 │            ├─── mejorate ──────────► [escanea 10 repos GitHub → adoptions]          │
 │            ├─── investiga <topic> ─► [web search + page reader → docs/research/]    │
 │            ├─── critica <file> ────► [auto-crítica Modo A + D + AGREE/DISAGREE]     │
 │            ├─── expected-check ────► [compara real vs expected P15 → MATCH/WORSE]   │
 │            ├─── gaps-finder ───────► [detecta desincronizaciones → 0 gaps]          │
 │            ├─── vigila ───────────► [ciclo autónomo de calidad 7 etapas]            │
 │            └─── <otro> ───────────► [rechazar: comando no canónico]                 │
 └────────────────────────────────────┬────────────────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────┐
 │  PASO 4 — EJECUCIÓN (Pipeline 5 Fases)  ── PATH SECUENCIAL CON LOOPS RECÍPROCOS     │
 │                                                                                     │
 │   F0 ──► F1 ──► F2 ──► F3 ──► F4 ──► F5                                             │
 │   │      │      │      │      │      │                                              │
 │   │      │      │      │      │      └──► [¿compila? ¿lint? ¿tests?] ──no──► ↺     │
 │   │      │      │      │      │                              │ sí               │
 │   │      │      │      │      │                              ▼                  │
 │   │      │      │      │      └──► [sync docs + memoria] ◄────┘                  │
 │   │      │      │      └──► [UI + widgets + 4 estados]                            │
 │   │      │      └──► [contratos OpenAPI + wrapper {success,data,error,meta}]      │
 │   │      └──► [datos + dominio + tipado estricto]                                 │
 │   └──► [premisas + memory sync]                                                   │
 │                                                                                     │
 │   LOOP RECÍPROCO:  si F5 falla > 3 veces ──► abortar ──► escalar a humano           │
 └────────────────────────────────────┬────────────────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────┐
 │  PASO 5 — GATE HONESTY (Regla P2)  ── PATH RECÍPROCO                                │
 │                                                                                     │
 │   por cada puerta:                                                                  │
 │     ejecutar cmd ──► capturar exit code + stdout ──► reportar PASS / FAIL / NOT_RUN │
 │                                                                                     │
 │   si FAIL ──► ↺ volver a PASO 4 (corregir) ──► si > 3 fails ──► escalar humano      │
 └────────────────────────────────────┬────────────────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────┐
 │  PASO 6 — CIERRE DE SESIÓN  ── PATHS PARALELOS                                      │
 │                                                                                     │
 │   ╔═══════════════════════╗   ╔═══════════════════════╗   ╔═══════════════════════╗ ║
 │   ║ Anexar WIN-XXX a     ║   ║ Anexar AP-XXX si      ║   ║ Anexar bloque a      ║ ║
 │   ║ wins-ledger.md       ║   ║ nuevo antipatrón      ║   ║ worklog.md           ║ ║
 │   ╚═════════╤════════════╝   ╚═════════╤════════════╝   ╚═════════╤════════════╝ ║
 │             └──────────────┬──────────┴─────────────────────────┘                ║
 │                            ▼                                                       ║
 │   ╔═══════════════════════════════════════════════════════════════╗               ║
 │   ║  Generar reporte en docs/reports/<epoch>-<title>.md           ║               ║
 │   ║  (AGREE/DISAGREE + Porter + cambios + gate-honesty + próximos)║               ║
 │   ╚═══════════════════════════════════════════════════════════════╝               │
 │                            │                                                       │
 │                            ▼                                                       │
 │   ╔═══════════════════════════════════════════════════════════════╗               ║
 │   ║  Actualizar state.json (K1–K5, W1–W8, baselines)              ║               ║
 │   ╚═══════════════════════════════════════════════════════════════╝               │
 └─────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                              [FIN DE SESIÓN]
                                      │
                                      ▼
              ┌───────────────────────────────────────────┐
              │  La SIGUIENTE sesión hereda toda la       │
              │  memoria empírica (Paso 2 la lee de nuevo)│
              │  → feedback loop cerrado, mejora perpetua │
              └───────────────────────────────────────────┘
```

---

## 3. Path secuencial — Pipeline de 5 fases

El pipeline es el camino **secuencial estricto** que toda mutación al código
debe seguir. Saltarse fases es un antipatrón (#64) y el juez PRE-v2.0 lo penaliza
en $D_3$ (Adherencia al Pipeline).

```
═══════════════════════════════════════════════════════════════════════════════
                              PIPELINE SECUENCIAL
═══════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  FASE 0 — AUDITORÍA DE PREMISAS & MEMORY SYNC                          │
  │                                                                         │
  │  · Verificar afirmaciones contra el código antes de ejecutar            │
  │  · Consultar docs/memory/anti-patterns.md para evitar reincidencias    │
  │  · Verificar orden de arranque de infraestructura y estado de puertos  │
  │  · Leer últimos 3 reportes de docs/reports/                            │
  └─────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼  (solo si F0 pasa)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  FASE 1 — NÚCLEO DE DATOS, DOMINIO Y TIPADO ESTRICTO                   │
  │                                                                         │
  │  · Esquemas relacionales, migraciones, modelos EAV                     │
  │  · Lógica pura de negocio, máquinas de estado, aislamiento de datos    │
  │  · Tipado estricto (cero 'any', cero tipos dinámicos sin validar)      │
  │  · Emisión de eventos de dominio + registro de auditoría en mutaciones │
  └─────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼  (solo si F1 pasa)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  FASE 2 — CONTRATOS DE INTERFAZ Y ENVOLTORIOS DE API                   │
  │                                                                         │
  │  · Controladores y rutas con decoradores de auth y permisos            │
  │  · Especificaciones declarativas (OpenAPI 3.1, Protobuf, Zod)          │
  │  · Envoltorio canónico: { success, data, error, meta }                 │
  │  · Excepciones explícitas (nunca HTTP 200 con error body)              │
  └─────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼  (solo si F2 pasa)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  FASE 3 — SUPERFICIE DE CONSUMO, UI Y COMPOSICIÓN DE WIDGETS           │
  │                                                                         │
  │  · Widgets polimórficos EAV (Object Type ot + Instance oi)             │
  │  · Adaptadores snake_case ↔ camelCase                                  │
  │  · 4 estados obligatorios: Loading, Vacío, Error, Éxito                │
  │  · WCAG 2.1 AA (contraste, foco teclado, ARIA)                         │
  │  · Layout 7 posiciones canónicas (P6) + paleta Apple (P5)              │
  └─────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼  (solo si F3 pasa)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  FASE 4 — TESTS, DOCUMENTACIÓN Y ACTUALIZACIÓN DE MEMORIA              │
  │                                                                         │
  │  · Pruebas de contrato contra esquemas OpenAPI/Protobuf                │
  │  · Tests unitarios e integración para métodos de servicio              │
  │  · Sincronización de documentación técnica y manuales                  │
  │  · Registro de aprendizajes en docs/memory/ (WINS y Anti-Patterns)     │
  └─────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼  (solo si F4 pasa)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  FASE 5 — VALIDACIÓN EN CALIENTE Y PUERTAS DE COMPILACIÓN              │
  │                                                                         │
  │  · Compilación completa: cero errores, cero warnings                   │
  │  · Linter y análisis estático estricto ejecutados y registrados        │
  │  · Smoke test real: invocación HTTP (curl) o inspección de navegador   │
  │  · Si falla > 3 intentos consecutivos → solicitar intervención humana  │
  └─────────────────────────────────┬───────────────────────────────────────┘
                                     │
                                     ▼
                            [CIERRE DE SESIÓN]
```

---

## 4. Paths alternos — Dispatch por comando

Cada comando canónico activa un **path alterno** distinto. El dispatch es
determinista: el agente no elige, rutea según el verbo del comando.

```
                              ┌──────────────┐
                              │  PROMPT IN   │
                              │ "lee AGENTS  │
                              │  .md, ejecu- │
                              │  ta: <cmd>"  │
                              └──────┬───────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  Parser canónico    │
                          │  extrae <cmd>       │
                          └──────────┬──────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       │                             │                             │
       ▼                             ▼                             ▼
 ╔═══════════╗               ╔═══════════╗               ╔═══════════════╗
 ║  GRUPO A  ║               ║  GRUPO B  ║               ║   GRUPO C     ║
 ║ bootstrap ║               ║ auditoría ║               ║ governance    ║
 ║ & arranque║               ║ & verify  ║               ║ & medición    ║
 ╚═════╤═════╝               ╚═════╤═════╝               ╚═══════╤═══════╝
       │                           │                             │
       ▼                           ▼                             ▼
 ┌───────────┐               ┌───────────┐               ┌───────────────┐
 │  start    │               │ cold run  │               │ audit memory  │
 │  inicia   │               │           │               │               │
 └─────┬─────┘               └─────┬─────┘               └───────┬───────┘
       │                           │                             │
       │                           ▼                             ▼
       │                     ┌───────────┐               ┌───────────────┐
       │                     │ verify    │               │ sil trend     │
       │                     │           │               │               │
       │                     └─────┬─────┘               └───────┬───────┘
       │                           │                             │
       ▼                           ▼                             ▼
 ╔═══════════╗               ╔═══════════╗               ╔═══════════════╗
 ║  GRUPO D  ║               ║  GRUPO E  ║               ║   GRUPO F     ║
 ║ iteración ║               ║  UI & UX  ║               ║   reglas      ║
 ║  & work   ║               ║  testing  ║               ║   mutation    ║
 ╚═════╤═════╝               ╚═════╤═════╝               ╚═══════╤═══════╝
       │                           │                             │
       ▼                           ▼                             ▼
 ┌───────────┐               ┌───────────┐               ┌───────────────┐
 │ itera [N] │               │ ui test   │               │ pre cycle     │
 │           │               │ <route>   │               │               │
 └─────┬─────┘               └─────┬─────┘               └───────┬───────┘
       │                           │                             │
       │                           ▼                             │
       │                     ┌───────────┐                     │
       │                     │ persona   │                     │
       │                     │ check     │                     │
       │                     │ <route>   │                     │
       │                     └─────┬─────┘                     │
       │                           │                             │
       ▼                           ▼                             ▼
 ╔═══════════╗               ╔═══════════╗               ╔═══════════════╗
 ║  GRUPO G  ║               ║  SALIDA   ║               ║  VALIDACIÓN   ║
 ║  cierre   ║──────────────►║  COMÚN    ║◄──────────────║  PRE-V2.0     ║
 ║  reporte  ║               ║           ║               ║  (ΔS ≥ 5.0)   ║
 ╚═════╤═════╝               ╚═════╤═════╝               ╚═══════╤═══════╝
       │                           │                             │
       └───────────────────────────┼─────────────────────────────┘
                                   ▼
                          ┌─────────────────────┐
                          │  docs/reports/      │
                          │  <epoch>-<title>.md │
                          │  (inmutable, P9)    │
                          └─────────────────────┘
```

### Tabla de paths alternos (detalle)

| Grupo | Comando | Path alterno | Salida principal |
| :---: | :--- | :--- | :--- |
| **A** | `start` | bootstrap → migrate → seed → serve | servidor corriendo |
| **B** | `cold run` | audit read-only → reporte de gaps | reporte de hallazgos |
| **B** | `verify` | tsc/lint/test por stack → gate-honesty | PASS/FAIL/NOT_RUN por puerta |
| **C** | `audit memory` | grep código vs anti-patterns.md | reincidencias detectadas |
| **C** | `sil trend` | recalcular K1–K5 + W1–W8 | state.json + metrics-trend.md |
| **D** | `itera [N]` | leer worklog → ejecutar N tareas → actualizar | worklog actualizado |
| **E** | `ui test <route>` | curl + browser-devtools MCP → validar P5/P6/P7 | reporte ui-test |
| **E** | `persona check <route>` | iterar docs/personas/ → W6 | reporte persona-check |
| **F** | `pre cycle` | juez determinista → ΔS ≥ 5.0 | PROMOTE / REJECT |
| **G** | `report` | AGREE/DISAGREE + Porter + handoff | reporte de cierre |

---

## 5. Paths recíprocos — Feedback loops

Los paths recíprocos son **loops de retroalimentación** que mantienen al sistema
mejorando perpetuamente. Hay 5 loops principales:

### 5.1 Loop de memoria (entre sesiones)

```
   SESIÓN N                    MEMORIA                SESIÓN N+1
  ┌─────────┐                ┌─────────┐             ┌─────────┐
  │ Escribe │──── anexa ────►│ anti-   │◄─── lee ────│ Lee en  │
  │ AP-XXX  │                │patterns │    Fase 0   │ Fase 0  │
  └─────────┘                │  .md    │             └─────────┘
                             └─────────┘
   SESIÓN N                    MEMORIA                SESIÓN N+1
  ┌─────────┐                ┌─────────┐             ┌─────────┐
  │ Escribe │──── anexa ────►│  wins-  │◄─── lee ────│ Lee en  │
  │ WIN-XXX │                │ledger.md│    Fase 0   │ Fase 0  │
  └─────────┘                └─────────┘             └─────────┘
   SESIÓN N                    MEMORIA                SESIÓN N+1
  ┌─────────┐                ┌─────────┐             ┌─────────┐
  │ Escribe │──── anexa ────►│ worklog │◄─── lee     │ Lee     │
  │ handoff │                │  .md    │    último   │ último  │
  │         │                │         │    bloque   │ bloque  │
  └─────────┘                └─────────┘             └─────────┘
        ▲                                                   │
        └───────────── continuidad garantizada ◄───────────┘
```

### 5.2 Loop de Gate Honesty (dentro de una sesión)

```
   ┌─────────────┐
   │  Editar     │
   │  archivo    │
   └──────┬──────┘
          │
          ▼  (Regla P1: Read-After-Edit)
   ┌─────────────┐
   │  Releer     │──── diff OK ────► continuar
   │  archivo    │
   └──────┬──────┘
          │ diff no aplica
          ▼
   ┌─────────────┐
   │  Reeditar   │◄─── ↺ (hasta 3 veces)
   └──────┬──────┘
          │ > 3 fallos
          ▼
   ┌─────────────┐
   │  ESCALAR A  │
   │   HUMANO    │
   └─────────────┘
```

### 5.3 Loop de Circuit Breaker (L2 Control Plane)

```
                    petición a LLM
                          │
                          ▼
                 ┌─────────────────┐
                 │ estado CLOSED?  │
                 └────────┬────────┘
                     sí   │   no
              ┌──────────┘   └──────────┐
              ▼                          ▼
      ┌──────────────┐          ┌──────────────┐
      │ invocar LLM  │          │ estado OPEN  │
      └──────┬───────┘          │ → fallback   │
             │                  └──────┬───────┘
             ▼                         │
      ┌──────────────┐                 │
      │ ¿éxito?      │                 │
      └──────┬───────┘                 │
         sí  │  no                     │
      ┌──────┘  └────────┐             │
      │                  │             │
      ▼                  ▼             │
  contador           contador          │
  success++          failure++         │
      │                  │             │
      │                  ▼             │
      │     ┌─────────────────────┐    │
      │     │ R_fail ≥ 0.40 &&   │    │
      │     │ N ≥ 10  ?          │    │
      │     └────────┬────────────┘    │
      │         sí   │   no            │
      │     ┌────────┘   └──► retry    │
      │     ▼                          │
      │  ┌──────────┐                  │
      │  │  CLOSED →│── OPEN ──────────┘
      │  └──────────┘
      │      │
      │      │  tras Treset_ms
      │      ▼
      │  ┌──────────┐
      │  │ OPEN →   │── HALF_OPEN
      │  └──────────┘
      │      │
      │      │  1 petición canary
      │      ▼
      │  ┌──────────────┐
      │  │ canary OK?   │
      │  └──────┬───────┘
      │     sí  │  no
      │  ┌──────┘  └──► OPEN (reset timer)
      │  ▼
      │  ┌──────────┐
      └─►│ HALF_OPEN│── CLOSED (reset contadores)
         └──────────┘
```

### 5.4 Loop de gobernanza PRE-v2.0 (3 roles)

```
   ┌─────────────────┐
   │   EJECUTOR      │──── escribe código siguiendo AGENTS.md ────►
   │  (Code Agent)   │                                            │
   └─────────────────┘                                            │
            ▲                                                     │
            │ feedback (¿qué regla ayuda?)                        │
            │                                                     ▼
   ┌─────────────────┐                                  ┌─────────────────┐
   │  JUEZ           │◄── evalúa con benchmark ─────────│   OPTIMIZADOR   │
   │  DETERMINISTA   │                                  │ (Rule Engineer) │
   │  (sin LLM)      │──── veredicto PROMOTE/REJECT ───►│                 │
   └─────────────────┘                                  └─────────────────┘
            │                                                     ▲
            │ si PROMOTE: merge a main                            │
            │ si REJECT: el Optimizador itera                     │
            ▼                                                     │
   ┌─────────────────┐                                            │
   │  main actualiza │─── nueva regla disponible para Ejecutor ───┘
   │  AGENTS.md      │
   └─────────────────┘
            │
            └──► entrada W4 (ADOPTED Promotion) en wins-ledger.md
```

### 5.5 Loop de medición PSIM (mejora continua)

```
   SESIÓN N
   ┌─────────────┐    registra    ┌─────────────────┐
   │ Trabajo     │──────────────►│ wins-ledger.md  │
   │ realizado   │                │ (W1–W8)         │
   └─────────────┘                └────────┬────────┘
                                           │
                                           ▼ sil trend
                                   ┌─────────────────┐
                                   │   state.json    │
                                   │  (K1–K5 KPIs)   │
                                   └────────┬────────┘
                                           │
                                           │ comparación longitudinal
                                           ▼
   SESIÓN N+1                              │
   ┌─────────────┐                         │
   │ Lee KPIs    │◄────────────────────────┘
   │ en Fase 0   │
   │ prioriza    │
   │ deuda técnica│
   └─────────────┘
        │
        │ si K3 degradado → priorizar hallazgos P0
        │ si K4 < 1 → forzar al menos 1 W1 esta sesión
        │ si K5 reinició → investigar ruptura de CI
        ▼
   [ajuste de alcance de la sesión]
```

---

## 6. Paths paralelos — Concurrencia agéntica

Los paths paralelos ejecutan **múltiples operaciones simultáneamente**. Hay 4
patrones de paralelismo en el sistema:

### 6.1 Squad de agentes en worktrees aislados

```
   repo principal (main, protegido)
        │
        │  git worktree add
        │
        ├──► .worktrees/agent-A/  (rama: agent-A/task-123)
        │        │
        │        └──► Agent A opera aislado, sin colisiones
        │
        ├──► .worktrees/agent-B/  (rama: agent-B/task-456)
        │        │
        │        └──► Agent B opera aislado, sin colisiones
        │
        └──► .worktrees/agent-C/  (rama: agent-C/task-789)
                 │
                 └──► Agent C opera aislado, sin colisiones

   merges a main se ordenan por blast radius:
        bajo ──► medio ──► alto
   (Best Practice #18: Límite de Blast Radius en Fusiones)
```

### 6.2 Servidores MCP operando en paralelo

Durante una sesión agéntica, los 5 servidores MCP pueden invocarse
simultáneamente:

```
                 ┌─────────────────────┐
                 │     AGENTE LLM      │
                 └──────────┬──────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
  ┌───────────┐      ┌───────────┐      ┌───────────┐
  │filesystem │      │git worktree│     │lsp-bridge │
  │   MCP     │      │    MCP     │      │    MCP    │
  │           │      │            │      │           │
  │ read_file │      │ create_wt  │      │ diagnostics│
  │ write_file│      │ merge_wt   │      │ definition │
  │           │      │            │      │ references │
  └─────┬─────┘      └─────┬──────┘      └─────┬─────┘
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
  ┌───────────┐      ┌───────────┐      ┌───────────┐
  │ postgres  │      │ browser   │      │  (otros   │
  │ inspector │      │ devtools  │      │   MCP     │
  │   MCP     │      │    MCP    │      │  externos)│
  │           │      │           │      │           │
  │ check_rls │      │ audit_wcag│      │           │
  │ run_query │      │ console   │      │           │
  │ explain   │      │ network   │      │           │
  └───────────┘      └───────────┘      └───────────┘
```

### 6.3 Fase 0 — Lecturas paralelas de memoria

```
   ┌─────────────────────────────────────────────────────────────┐
   │                    FASE 0 (paralela)                        │
   └─────────────────────────────────────────────────────────────┘

   t=0ms   ─┬──► leer AGENTS.md            (≈ 15 KB)
            │
            ├──► leer anti-patterns.md     (≈ 8 KB)
            │
            ├──► leer último worklog block (≈ 2 KB)
            │
            ├──► leer state.json           (≈ 1 KB)
            │
            ├──► leer docs/reports/[-1]    (último)
            │
            ├──► leer docs/reports/[-2]    (penúltimo)
            │
            └──► leer docs/reports/[-3]    (antepenúltimo)

   t≈Xms   ─┬──► todos los reads resueltos
            │
            ▼
   [síntesis de contexto lista para el agente]
```

### 6.4 Cierre de sesión — Escrituras paralelas

```
   ┌─────────────────────────────────────────────────────────────┐
   │              CIERRE DE SESIÓN (paralelo)                    │
   └─────────────────────────────────────────────────────────────┘

   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  append WIN  │  │  append AP   │  │ append work- │
   │  a wins-     │  │  a anti-     │  │ log handoff  │
   │  ledger.md   │  │  patterns.md │  │              │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  write reporte   │
                  │  docs/reports/   │
                  │  <epoch>-<title> │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  update state.json│  (snapshot KPIs)
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  git commit +    │
                  │  push (opcional) │
                  └──────────────────┘
```

### 6.5 CI/CD — Workflows paralelos en cada PR

```
   [PR abierto]
        │
        │  dispara simultáneamente:
        │
        ├──► gate-honesty.yml
        │        │
        │        ├──► detect-stack
        │        │
        │        ├──► ts-gate   (si package.json)
        │        ├──► py-gate   (si pyproject.toml)
        │        ├──► go-gate   (si go.mod)
        │        ├──► rust-gate  (si Cargo.toml)
        │        ├──► php-gate   (si composer.json)
        │        ├──► cpp-gate   (si CMakeLists.txt)
        │        │
        │        └──► gate-honesty-report (comenta en PR)
        │
        ├──► memory-audit.yml
        │        │
        │        ├──► parse anti-patterns.md
        │        ├──► scan diff for reincidences
        │        └──► comment on PR (NO_REINCIDENCE / BLOCK)
        │
        └──► pre-cycle.yml  (solo si toca AGENTS.md/docs/governance/docs/catalogs/)
                 │
                 ├──► build judge (packages/eval)
                 ├──► run judge (ΔS, condiciones)
                 └──► comment verdict (PROMOTE / REJECT)
                      └──► block merge if REJECT
```

---

## 7. Estructura del repositorio

```
agent-os-boilerplate/
├── AGENTS.md                          # Constitución inmutable (Documento Cero)
├── README.md                          # Este archivo
├── LICENSE                            # MIT
├── .gitignore  .gitattributes         # LF forzado (P10)
├── .env.example                       # DEV_OS/DEPLOY_OS + L2 + telemetría
│
├── CURSOR-RULES.md                    # Entrypoint Cursor  → AGENTS.md
├── CLAUDE-CODE.md                     # Entrypoint Claude Code → AGENTS.md
├── GEMINI.md                          # Entrypoint Gemini/Jules → AGENTS.md
├── COPILOT-INSTRUCTIONS.md            # Entrypoint Copilot → AGENTS.md
├── .cursorrules                       # Alias legacy Cursor
├── .github/copilot-instructions.md    # Alias oficial Copilot
│
├── docs/
│   ├── memory/                        # Memoria empírica append-only (P9)
│   │   ├── MEMORY.md                  # Index con frontmatter (patrón Claude Code)
│   │   ├── anti-patterns.md           # AP-001..AP-036 (36 antipatrones)
│   │   ├── wins-ledger.md             # WIN-001..WIN-021 (W1–W8)
│   │   ├── state.json                 # KPIs K1–K5 + baselines (snapshot v1.6.0)
│   │   └── worklog.md                 # Bitácora SESSION-000..SESSION-008
│   ├── reports/                       # Reportes de sesión (<epoch>-<title>.md, inmutables)
│   ├── expected/                      # Documentos de expectativas (P15 expected-first)
│   ├── research/                      # Reportes de investigación (`investiga <topic>`)
│   ├── security/                      # Protocolos de seguridad (3)
│   │   ├── anti-prompt-injection-protocol.md   # P12, 7 capas OWASP LLM01 2026
│   │   ├── auto-critica-protocol.md            # P13, 4 modos (self/judge/det/adversario)
│   │   └── headless-verify-and-expected-first-protocol.md  # P14 + P15
│   ├── patterns/                      # Patrones de orquestación y ACI
│   │   ├── orchestration.md           # 5 patrones Anthropic Cookbook
│   │   └── aci.md                     # Agent-Computer Interface (SWE-agent)
│   ├── mejorate-scans/                # Scans de `mejorate` (scan.md + synthesis.md)
│   ├── personas/                      # Perfiles W6 (10 personas: 3 base + 3 joyride + 4 cold-run)
│   │   ├── executive.md operator.md analyst.md
│   │   ├── apprentice.md demo-master.md experience-architect.md
│   │   └── cold-run/                  # Atacantes y edge cases
│   │       ├── novato.md power.md adversario.md edge.md
│   ├── widgets/                       # Contratos canónicos de widgets (2)
│   │   ├── onboarding-tour.md         # Joyride widget (P11)
│   │   └── glowing-cta-button.md      # CTA gradient + glow (W-CTA)
│   ├── l2-control-plane/              # Capa L2 Control Plane
│   │   ├── l2-envelope.xsd            # Contrato XML canónico Ingress/Response
│   │   ├── l2-schema.sql              # DDL PostgreSQL (5 tablas + triggers P9)
│   │   ├── resilience-math.md         # Circuit breaker + backoff decorrelacionado
│   │   └── archetypes-matrix.md       # 4 arquetipos satélite
│   ├── catalogs/                      # Catálogos exhaustivos 1-100+7
│   │   ├── 100-best-practices.md      # + BP #101-129 (29 extra: ui-test, persona-check, tour, cold-run, IDE, apply_patch, ACI, anti-injection, auto-crítica, headless, expected-first, reverse-engineer, gaps-finder, ciclo autónomo post-error)
│   │   ├── 100-anti-patterns.md       # 100 base
│   │   └── 100-killer-features.md     # + Killer #101-110 (10 extra: OnboardingTour, IDE, mejorate, investiga, critica, headless-verify, expected-first, reverse-engineer, skill orquestador 10 repos, sentinel quality loop)
│   ├── governance/                    # Gobernanza evolutiva
│   │   ├── PRE-v2.0.md                # Perpetual Rule Evolution (3 roles)
│   │   └── PSIM.md                    # Positive Self-Improvement & Measurement
│   ├── polyglot/
│   │   └── adaptation-matrix.md       # Matriz TS/JS/PHP/Py/Go/Rust/C++
│   ├── ide-integrations/              # README del comando `ide` (16 IDEs)
│   └── ci-workflows/                  # Workflows CI (instalar via script)
│
├── mcp/                               # Model Context Protocol
│   ├── servers/                       # 7 servidores MCP obligatorios
│   │   ├── filesystem.mcp.json        #   (P1 Read-After-Edit enforced)
│   │   ├── git-worktree.mcp.json      #   (squads paralelos aislados)
│   │   ├── lsp-bridge.mcp.json        #   (polyglot: TS/Py/Go/Rust/PHP/C++)
│   │   ├── postgres-inspector.mcp.json#   (readonly, check_rls)
│   │   ├── browser-devtools.mcp.json  #   (WCAG + 7pos + palette + console)
│   │   ├── sequential-thinking.mcp.json #  (structured cognitive steps)
│   │   └── memory.mcp.json            #   (knowledge graph append-only P9)
│   └── skills/                        # 7 skills modulares
│       ├── schema-validator/          #   (Zod/OpenAPI vs DDL)
│       ├── circuit-breaker-evaluator/ #   (simula estado CB)
│       ├── memory-sync/               #   (append atómico a memoria)
│       ├── porter-forces-analyzer/    #   (5 fuerzas aplicadas al código)
│       ├── apple-theme-linter/        #   (P5 paleta + P7 zero-emoji)
│       ├── prompt-injection-scanner/  #   (P12, 7 categorías de patrones)
│       └── expected-spec-generator/   #   (P15, genera docs/expected/)
│
├── packages/
│   └── eval/                          # Juez determinista PRE-v2.0 (sin LLM)
│       ├── README.md
│       ├── scoring-formula.md         # S = 100 × Σ wᵢ·Dᵢ (6 dimensiones)
│       ├── benchmark-blind/           # 30% ciego rotativo anti-Goodhart
│       ├── src/                       # Implementación (Rust/Go/TS)
│       └── tests/                     # Tests del propio juez
│
├── .github/
│   ├── copilot-instructions.md
│   └── PULL_REQUEST_TEMPLATE.md       # Checklist P1–P18 + W-CTA + 5 fases + PSIM
│
└── scripts/                           # Comandos operativos canónicos (18 + utilidad)
    ├── start.sh                       # start / inicia
    ├── cold-run.sh                    # cold run [scope]
    ├── verify.sh                      # verify (gate-honesty multi-stack)
    ├── audit-memory.sh                # audit memory
    ├── sil-trend.sh                   # sil trend
    ├── pre-cycle.sh                   # pre cycle
    ├── report.sh                      # report
    ├── ui-test.sh                     # ui test <route>
    ├── persona-check.sh               # persona check <route>
    ├── ide.sh                         # ide [detect|<name>|all] (16 IDEs)
    ├── mejorate.sh                    # mejorate / improve yourself (10 repos)
    ├── investiga.sh                   # investiga <topic> (web search + page reader)
    ├── critica.sh                     # critica <file> (Modo A + Modo D)
    ├── expected-check.sh              # expected-check <topic> (P14 + P15)
    ├── reverse-engineer.sh            # cold run reverse-engineer / rayos-x (5 etapas)
    ├── gaps-finder.sh                 # gaps-finder (15 checks de sincronización)
    ├── vigila.sh                      # vigila (ciclo autónomo de calidad 7 etapas)
    ├── install-ci-workflows.sh        # utilidad (instala 3 workflows)
    └── README.md
```

---

## 8. Stack agnóstico

### Proveedores LLM/SLM compatibles (sin cambiar el código de negocio)

| Familia | Proveedores | Protocolo L2 |
| :--- | :--- | :--- |
| **OpenAI-compatible** | OpenAI (GPT-4.1, o3, o4-mini), DeepSeek (V3.2, R2), Mistral, Together, Groq, Cerebras, vLLM local, Ollama, LM Studio | `OPENAI_COMPATIBLE` |
| **Anthropic-native** | Claude 4.5 Sonnet, Claude 4 Opus, Claude 4 Haiku | `ANTHROPIC_NATIVE` |
| **Google** | Gemini 2.5 Pro/Flash, Gemma 3 | `GEMINI_NATIVE` o `CUSTOM` |
| **Local** | Llama 3.3, Qwen 2.5-VL, Phi-4, Mistral-Small vía vLLM/Ollama | `OLLAMA` o `OPENAI_COMPATIBLE` |

El enrutamiento se declara en la tabla `l2_model_registry`. **Cambiar de proveedor
es una operación de DML, no de código** (Regla P8).

### Matriz polyglot

TypeScript · JavaScript · PHP · Python · Go · Rust · C++

Cada lenguaje tiene su columna en `docs/polyglot/adaptation-matrix.md` que mapea
las 5 fases del pipeline a las herramientas canónicas de cada ecosistema.

---

## 9. Fórmula canónica de operación

```
lee AGENTS.md, ejecuta: <comando> [parámetros]
```

| Comando | Qué hace | Script |
| :--- | :--- | :--- |
| `start` | Bootstrap: verifica DB/Redis/MQ, migra, hace seed, arranca servidores | `scripts/start.sh` |
| `cold run [scope]` | Auditoría sin modificar archivos. **Extensión `cold run reverse-engineer <url>` (alias `rayos-x <url>`):** radiografía rayos X 5 etapas (branding + 3D Three.js + modelo negocio + reconstrucción + verificación) | `scripts/cold-run.sh` + `scripts/reverse-engineer.sh` |
| `itera [N]` | Procesa hasta N tareas del worklog | (manual o via agente) |
| `verify` | Batería de puertas deterministas con Gate Honesty | `scripts/verify.sh` |
| `audit memory` | Compara código vs. anti-patterns.md | `scripts/audit-memory.sh` |
| `sil trend` | Regenera state.json y metrics-trend.md (K1-K5, W1-W8) | `scripts/sil-trend.sh` |
| `pre cycle` | Juez determinista PRE-v2.0 sobre propuesta de regla | `scripts/pre-cycle.sh` |
| `report` | Informe de cierre AGREE/DISAGREE + Porter + handoff en `docs/reports/` | `scripts/report.sh` |
| `ui test <route>` | Valida 7 posiciones, paleta Apple, WCAG, sticky footer, console/network | `scripts/ui-test.sh` |
| `persona check <route>` | Valida la ruta contra todos los perfiles en `docs/personas/` (W6) | `scripts/persona-check.sh` |
| `ide [detect\|<name>\|all]` | Genera auto-activation layer para 16 IDEs (Cursor, Claude, Gemini, Copilot, Windsurf, Cline, Codex, RooCode, OpenCode, Trae, Antigravity, ZCode, VS Code, Aider, Continue). Garantiza que TODO prompt sea tratado como canónico sin necesidad de escribir "lee AGENTS.md, ejecuta:" | `scripts/ide.sh` |
| `mejorate` / `improve yourself` | Auto-mejora del sistema: escanea 10 repos de referencia en GitHub (jujumilk3, LouisShark, dontriskit, PatrickJS, Aider, SWE-agent, OpenHands, LiteLLM, MCP servers, anthropic-cookbook) en modo read-only, extrae patrones agénticos, propone adoptions via PRE-v2.0. **Erradica la fatiga meta** | `scripts/mejorate.sh` |
| `investiga <topic> [N]` | Investiga en internet asumiendo falta de conocimientos: busca (z-ai web_search), lee top 5 páginas (page_reader), sintetiza en `docs/research/<epoch>-<topic>.md`, propone adoptions. Descubre amenazas emergentes y state-of-the-art en tiempo real | `scripts/investiga.sh` |
| `critica <file>` | Auto-crítica obligatoria de artefactos: Modo A (3 debilidades reales) + Modo D (2 vectores ataque si toca seguridad) + tabla AGREE/DISAGREE + análisis crítico contrario. Implementa P13 | `scripts/critica.sh` |
| `expected-check <topic> [base_url]` | Compara resultado real (browser headless, P14) vs expectativa previa (P15, en `docs/expected/<topic>.md`). Veredicto MATCH/BETTER/WORSE/FAIL | `scripts/expected-check.sh` |
| `gaps-finder` | Detecta desincronizaciones entre AGENTS.md, README, state.json, catálogos, scripts/, mcp/. 15 checks. **MANDATORIO antes de cerrar sesión** (BP #128). Bloquea commit si hay gaps critical/high | `scripts/gaps-finder.sh` |
| `vigila` | **Ciclo Autónomo de Calidad (Sentinela)**: escanea los registros de ejecución (comandos con ERROR, pipelines FAILED, errores del ledger L2, presupuestos de gateway >25s) en busca de fallas sin procesar. Cada falla real abre un ciclo de 7 etapas: detectar, analizar causa raíz, investigar la mejor corrección, corregir, verificar (Gate Honesty P2), aplicar criterios posteriores (gaps-finder + audit memory + expected-check) y reportar (epoch inmutable con auto-crítica P13). Se dispara automáticamente tras cada ERROR del dispatcher. Erradica AP-031 | `scripts/vigila.sh` |

### Ejemplos de invocación

```
lee AGENTS.md, ejecuta: start
lee AGENTS.md, ejecuta: cold run src/
lee AGENTS.md, ejecuta: itera 5
lee AGENTS.md, ejecuta: verify
lee AGENTS.md, ejecuta: audit memory
lee AGENTS.md, ejecuta: sil trend
lee AGENTS.md, ejecuta: pre cycle
lee AGENTS.md, ejecuta: report
lee AGENTS.md, ejecuta: ui test /cms/posts?page=1
lee AGENTS.md, ejecuta: persona check /dashboard
lee AGENTS.md, ejecuta: ide all
lee AGENTS.md, ejecuta: mejorate
lee AGENTS.md, ejecuta: investiga "prompt injection defenses 2026"
lee AGENTS.md, ejecuta: critica AGENTS.md
lee AGENTS.md, ejecuta: expected-check analytics-ventas
lee AGENTS.md, ejecuta: cold run reverse-engineer https://target.com
lee AGENTS.md, ejecuta: rayos-x https://target.com
lee AGENTS.md, ejecuta: gaps-finder
lee AGENTS.md, ejecuta: vigila
```

---

## 10. Las 15 Reglas Cardinales + W-CTA

| # | Regla | Qué previene |
| :---: | :--- | :--- |
| **P1** | Read-After-Edit obligatorio | Falsos éxitos por no-op en edición |
| **P2** | Gate Honesty absoluta | Reportar PASS sin ejecutar el comando |
| **P3** | Closes-Finding Guard | Cerrar hallazgos solo en mocks |
| **P4** | Sync atómica código+contratos+docs | Drift entre API y OpenAPI |
| **P5** | Estilo Modo Claro Apple | UI discordante y `!important` |
| **P6** | Layout canónico de 7 posiciones | Archivos monolíticos |
| **P7** | Zero-Placeholder, Zero-Emoji | Datos ficticios en producción |
| **P8** | Aislamiento LLM-Agnóstico | Vendor lock-in con SDKs directos |
| **P9** | Memoria append-only | Pérdida de aprendizaje histórico |
| **P10** | Entornos Dev/Deploy declarados | Bugs Windows↔Ubuntu (paths, CRLF, bash) |
| **P11** | Onboarding Tour obligatorio en vistas complejas | Pantallas densas sin Joyride (AP-015) |
| **P12** | Anti-Prompt-Injection (7 capas) | OWASP LLM01 2026 — prompt injection |
| **P13** | Auto-Crítica obligatoria | Auto-aprobación complaciente (AP-026) |
| **P14** | Headless Browser Verification | curl/fetch aislado de HTML — éxito falso (AP-027) |
| **P15** | Expected-First Workflow | Generación sin expectativas previas (AP-028) |
| **W-CTA** | GlowingCtaButton en estados listos | CTAs grises sin invitar a tocar |

Detalle completo en `AGENTS.md` §1.

---

## 11. Gobernanza PRE-v2.0

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   EJECUTOR      │     │   OPTIMIZADOR    │     │  JUEZ DETERMINISTA  │
│   (Code Agent)  │     │  (Rule Engineer) │     │   (packages/eval)   │
│                 │     │                  │     │                     │
│ Escribe código  │     │ Propone cambios  │     │ Software SIN LLM    │
│ siguiendo       │     │ a AGENTS.md en   │     │ que evalúa contra   │
│ AGENTS.md.      │     │ rama pre/propose │     │ benchmark histórico │
│                 │     │                  │     │                     │
│ ❌ NO puede     │     │ ❌ NO puede      │     │ ✅ Decisión         │
│    tocar reglas │     │    mergear       │     │    matemática       │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

**Condición de promoción inviolable:**

$$\Delta S \ge 5.0 \quad \land \quad \forall i, \Delta D_i \ge -2.0 \quad \land \quad (\sigma_c + \sigma_b) < |\Delta S|$$

- $\Delta S$ — mejora de puntuación total (sobre 100)
- $\Delta D_i$ — cambio por dimensión (6 dimensiones: compilación, contratos, pipeline, casos ocultos, tokens, arquitectura)
- $\sigma$ — desviación estándar (significancia estadística anti-suerte)

Detalle en `docs/governance/PRE-v2.0.md`.

---

## 12. Medición PSIM

### 8 Clases de Victoria (W1–W8)

```
  W1 Capability Strengthening   ──►  nueva capacidad o moat
  W2 Carry-over Closure         ──►  cierre de deuda técnica postergada
  W3 Mock Reduction             ──►  mocks → integración real
  W4 ADOPTED Promotion          ──►  tecnología promovida a estándar
  W5 Anti-Pattern Retirement    ──►  eliminación sostenida de antipatrón
  W6 Persona Satisfied          ──►  ruta cumple meta de un perfil
  W7 Gate Velocity              ──►  reducción de tiempo de compilación
  W8 Finding Half-Life          ──►  hallazgo crítico resuelto en plazo
```

### 5 KPIs de Trayectoria (K1–K5)

| KPI | Objetivo | Frecuencia |
| :--- | :--- | :--- |
| K1 P0/P1 Closure Rate | $\ge 90\%$ | por iteración |
| K2 Mock Reduction Velocity | $< 0$ (negativa) | por iteración |
| K3 Finding Half-Life | $\le 2$ iteraciones | mediana móvil 20 |
| K4 Capability-Strengthening Count | $\ge 1$ W1/iter | por iteración |
| K5 Gate Stability Streak | monótono ↑ | por commit |

Detalle en `docs/governance/PSIM.md`.

---

## 13. Control Plane L2

### Estado del Circuit Breaker (máquina finita)

```
                         failure_rate ≥ 0.40
                         (N ≥ 10 muestras)
   ┌──────────┐  ─────────────────────────────►  ┌──────────┐
   │  CLOSED  │                                  │   OPEN   │
   │ (normal) │  ◄─────────────────────────────  │(bloqueado)│
   └──────────┘   canary OK tras T_reset         └─────┬────┘
        ▲                                             │
        │                                             │ tras T_reset_ms
        │                                             ▼
        │                                        ┌───────────┐
        └──────────  canary OK  ─────────────────│ HALF_OPEN │
                                           │     └───────────┘
                                           │ canary FAIL
                                           ▼
                                      ┌──────────┐
                                      │   OPEN   │
                                      │ (reset)  │
                                      └──────────┘
```

### Backoff exponencial con jitter decorrelacionado

$$T_{\text{sleep}}^{(k)} = \min\left(T_{\max}, \; \text{random}(T_{\text{base}}, \; T_{\text{prev}} \times 3)\right)$$

- $T_{\text{base}} = 200$ ms · $T_{\max} = 3000$ ms
- Solo reintentos transitorios (429, 5xx, timeout). Nunca 400/401/403/422.

### 4 arquetipos satélite

| Arquetipo | SLA | Primario | Fallback | Escalado |
| :--- | :---: | :--- | :--- | :--- |
| Vision-to-Spec | 8000ms | Gemini 2.5 Flash | Qwen 2.5 VL 72B | Upgrade → Claude 4.5 |
| Accounting-OCR | 4000ms | DeepSeek V3.2 | GPT-4.1 mini | Upgrade → DeepSeek R2 |
| Commerce-Bot | 800ms | Llama 3.3 70B (Groq) | Cerebras Llama 3.1 8B | Downgrade → Mistral Small |
| Fraud-Guard | 90ms | Micro-SLM (vLLM) | Reglas L1 (sin LLM) | Fail-Safe → Denegación |

Detalle en `docs/l2-control-plane/`.

---

## 14. Cómo usar esta plantilla

### Opción A: GitHub "Use this template"

1. Ve a `https://github.com/yosietserga/agent-os-boilerplate`
2. Click en **"Use this template"** → **"Create a new repository"**
3. Elige dueño, nombre, visibilidad → **Create repository**

### Opción B: GitHub CLI

```bash
gh repo create mi-nuevo-proyecto \
  --template yosietserga/agent-os-boilerplate \
  --private \
  --clone
cd mi-nuevo-proyecto
```

### Opción C: Clonar y reemplazar el remoto

```bash
git clone https://github.com/yosietserga/agent-os-boilerplate.git mi-proyecto
cd mi-proyecto
git remote set-url origin https://github.com/<tu-usuario>/mi-proyecto.git
git push -u origin main
```

### El prompt mágico (objetivo del boilerplate)

```
clona https://github.com/yosietserga/agent-os-boilerplate y crea una app de <dominio>
```

El LLM leerá `AGENTS.md`, consultará `docs/memory/`, los últimos 3 reportes de
`docs/reports/`, declarará `DEV_OS`/`DEPLOY_OS`, y operará bajo las 10 reglas
P1–P10 sin que tengas que re-explicar nada. **Fatiga erradicada.**

---

## 15. Configuración inicial

### 1. Variables de entorno

```bash
cp .env.example .env
# Edita .env: claves LLM, DATABASE_URL, Redis, DEV_OS, DEPLOY_OS
```

### 2. Base de datos del Control Plane L2

```bash
psql "$DATABASE_URL" -f docs/l2-control-plane/l2-schema.sql
```

### 3. Servidores MCP (recomendado)

Carga las configuraciones de `mcp/servers/` en tu cliente MCP favorito
(Claude Desktop, Cursor, Cline, Continue, etc.).

### 4. CI/CD

```bash
# Instala los 3 workflows (requiere token con scope 'workflow')
bash scripts/install-ci-workflows.sh
git add .github/workflows/ && git commit -m "ci: install workflows" && git push
```

Workflows:
- `gate-honesty.yml` — verificación determinista en cada PR (Regla P2)
- `memory-audit.yml` — anti-reincidencia de antipatrones (BP #93)
- `pre-cycle.yml` — juez PRE-v2.0 para propuestas de reglas

---

## Estado actual (v2.0.0 — snapshot live)

> Estos counts se actualizan en cada PRE-v2.0 proposal promovida. Fuente:
> `docs/memory/state.json`.

| Métrica | Valor |
| :--- | :---: |
| Versión | 2.0.0 |
| Reglas cardinales | 18 (P1–P18) + W-CTA |
| Comandos canónicos | 19 (+ alias `rayos-x`) |
| Antipatrones documentados | 36 (AP-001..AP-036) |
| Victorias PSIM | 21 (WIN-001..WIN-021) |
| Personas | 10 (3 base + 3 joyride + 4 cold-run) |
| MCP servers | 7 |
| MCP skills | 8 |
| Widgets canónicos | 2 (OnboardingTour + GlowingCtaButton) |
| Protocolos de seguridad | 3 (anti-injection, auto-crítica, headless+expected) |
| Protocolos de ingeniería inversa | 1 (radiografía rayos X 5 etapas) |
| IDE integrations | 16 (Cursor, Claude, Gemini, Copilot, Windsurf, Cline, Codex, RooCode, OpenCode, Trae, Antigravity, ZCode, VS Code, Aider, Continue) |
| Repos de referencia escaneados | 20 (10 mejorate + 10 reverse-engineer) |
| Reportes de investigación | 1 (vía `investiga`) |
| Gaps-finder checks | 15 (mandatorio antes de cerrar sesión) |
| Versiones en changelog | 13 (1.0.0 → 2.2.0) |
| Commits en main | 21+ |

---

## Ciclo Autónomo de Calidad (`vigila`, v2.0.0)

El comando canónico `vigila` (18º) convierte el ciclo de calidad de pasivo a
autónomo. Tras cada ERROR del dispatcher o fallo de pipeline, el sentinela se
dispara automáticamente y escanea los registros de ejecución (comandos con
ERROR, pipelines FAILED, errores del ledger L2, presupuestos de gateway >25s)
en busca de fallas sin procesar. Cada falla real abre un ciclo de 7 etapas:
(1) detectar, (2) analizar la causa raíz (determinista + L2), (3) investigar
la mejor corrección (memoria empírica + research), (4) corregir, (5) verificar
con Gate Honesty P2, (6) aplicar los criterios posteriores (gaps-finder +
audit memory + expected-check P15) y (7) generar el reporte epoch inmutable
con auto-crítica P13, anexado al worklog (P9).

Los inputs inválidos del operador (comando desconocido, URL inválida) se
clasifican NO_DEFECT — son respuesta correcta del sistema, no defectos — y no
abren ciclo. Las dependencias externas se clasifican EXTERNAL, los excesos de
presupuesto BUDGET y el resto INTERNAL. Si un ciclo falla más de 3 intentos
consecutivos en una etapa, el sentinela escala a humano. El operador deja de
ser el detector de fallas del sistema (erradica AP-031).

```
 CICLO AUTÓNOMO DE CALIDAD — PIPELINE DE 7 ETAPAS
 ┌──────────────────────────────────────────────────────────────────────┐
 │ 1. DETECTAR    registros de ejecución → fallas sin procesar          │
 │ 2. ANALIZAR    causa raíz: NO_DEFECT / EXTERNAL / BUDGET / INTERNAL  │
 │ 3. INVESTIGAR  memoria empírica (APs) + research → mejor corrección  │
 │ 4. CORREGIR    plan documentado + propuesta pre/propose/* sugerida   │
 │ 5. VERIFICAR   scripts/verify.sh → exit code real (Gate Honesty P2)  │
 │ 6. CRITERIOS   gaps-finder + audit memory + expected-check (P15)     │
 │ 7. REPORTAR    docs/reports/<epoch>-vigila-<slug>.md (inmutable P13) │
 └──────────────────────────────────────────────────────────────────────┘
   disparo: ERROR del dispatcher · escalado a humano: >3 intentos fallidos
```

Implementación file-based: `scripts/vigila.sh`. Uso:
`lee AGENTS.md, ejecuta: vigila` o `./scripts/vigila.sh [--source <file>]`.

---

## 16. Changelog

| Fecha | Versión | Cambios |
| :--- | :--- | :--- |
| 2026-10-02 | 1.0.0 | Versión inicial: AGENTS.md + memoria empírica + L2 Control Plane + catálogos 1-100 + MCP + PRE-v2.0 + PSIM. |
| 2026-10-02 | 1.1.0 | **PRE-v2.0 `add-operational-commands-and-reports` promoted.** Añade: Regla P10 (Entornos Dev/Deploy), comandos `ui test` y `persona check`, convención `docs/reports/<epoch>-<title>.md`, lectura de últimos 3 reportes en Fase 0, BP #101-102, AP-013/014, WIN-009. README reconstruido con diagramas ricos de los 4 tipos de paths (secuenciales, alternos, recíprocos, paralelos). |
| 2026-10-02 | 1.2.0 | **PRE-v2.0 `add-joyride-canonical-and-persona-ecosystem` promoted.** Añade: Regla P11 (Onboarding Tour obligatorio en vistas complejas), 3 nuevas personas (apprentice, demo-master, experience-architect), 4 personas cold-run, widget canónico `OnboardingTour`, AP-015/016/017, BP #103-104, Killer Feature #101, WIN-010. |
| 2026-10-02 | 1.3.0 | **PRE-v2.0 `add-ide-canonical-command` promoted.** Añade: comando `ide [detect\|<name>\|all]` (12º comando canónico). Script `scripts/ide.sh` genera auto-activation layer para 16 IDEs. AP-018, BP #105, Killer #102, WIN-011. |
| 2026-10-02 | 1.4.0 | **PRE-v2.0 `add-mejorate-command-and-pattern-adoption` promoted.** Comando `mejorate` (13º). Script escanea 10 repos de referencia. Adoptions: MEMORY.md index, 2 nuevos MCP (sequential-thinking, memory), docs/patterns/orchestration.md (5 patrones Anthropic), docs/patterns/aci.md (Agent-Computer Interface SWE-agent). AP-019/020, BP #106-107, Killer #103, WIN-012. |
| 2026-10-02 | 1.5.0 | **PRE-v2.0 `add-investiga-and-anti-prompt-injection` promoted.** 2 nuevos comandos (`investiga` 14º + `critica` 15º). 2 nuevas reglas: **P12 Anti-Prompt-Injection (7 capas OWASP LLM01 2026)** + **P13 Auto-Crítica Obligatoria**. `investiga.sh` busca en internet (z-ai CLI), `critica.sh` ejecuta Modo A + Modo D. `docs/security/anti-prompt-injection-protocol.md`, `docs/security/auto-critica-protocol.md`. Skill `prompt-injection-scanner`. AP-021 (mejorate sin internet — fallo meta 2), AP-022..026 (5 APs seguridad + auto-crítica). BP #108-117 (10 nuevas). Killer #104-105. WIN-013..014. **El sistema ahora asume falta de conocimientos, investiga en internet, y se auto-critica antes de publicar.** |
| 2026-10-02 | 1.6.0 | **PRE-v2.0 `add-cta-glowing-headless-verify-expected-first` promoted.** 3 nuevas reglas (**P14 Headless Browser Verification**, **P15 Expected-First Workflow**, **W-CTA Glowing CTA Button**) + 1 nuevo comando (`expected-check` 16º). Widget `GlowingCtaButton` (gradient azul + glow pulsante 2.4s + 6 estados + WCAG 2.1 AA + prefers-reduced-motion). `docs/security/headless-verify-and-expected-first-protocol.md`. Skill `expected-spec-generator`. `docs/expected/` nuevo dir. AP-027 (curl aislado HTML — éxito falso), AP-028 (generación sin expectativas). BP #118-122 (5 nuevas). Killer #106-107. WIN-015. **3 frustraciones finales del operador erradicadas: CTA glowing + browser headless real + expected-first workflow.** |
| 2026-10-02 | 1.7.0 | **PRE-v2.0 `add-reverse-engineer-radiography` promoted.** Extensión de `cold run` con `cold run reverse-engineer <url>` (alias `rayos-x <url>`) — pipeline 5 etapas Radiografía Rayos X: (1) branding → normalización Apple P5, (2) 3D Three.js → WebGL + GLSL + geometrías + ThreeCanvas widget, (3) modelo negocio → pricing + APIs + 5 Fuerzas Porter + DDL, (4) reconstrucción → componentes + widgets EAV + tour + CTA glowing, (5) verificación → browser headless P14 + expected-check P15 + screenshot diff <15%. Skill `reverse-engineer-skill` (8º) con 5 sub-comandos orquestando 10 repos (browser-use 117k⭐, firecrawl 188k⭐, awesome-mcp-servers 96k⭐, modelcontextprotocol/servers 91k⭐, screenshot-to-code 80k⭐, e2b-dev/fragments 6k⭐, crewAI-tools 1.5k⭐, autogen 61k⭐, gpt-researcher 30k⭐, AutoGPT 188k⭐). `docs/reverse-engineering/protocol.md`. AP-029/030. BP #123-127. Killer #108-109. WIN-016. **Fatiga de 'copia este sitio' erradicada.** |
| 2026-10-02 | 1.8.0 | **PRE-v2.0 `add-gaps-finder-mandatorio` promoted.** Comando `gaps-finder` (17º). Script `scripts/gaps-finder.sh` (320 líneas, 15 checks) detecta desincronizaciones entre AGENTS.md, README, state.json, catálogos, scripts/, mcp/, personas, worklog, PR template, changelog. **MANDATORIO en §8.2 antes de cerrar sesión** (BP #128). Bloquea commit si hay gaps critical/high. Corrige gap detectado por operador: README diagrama DISPATCH mostraba '11 rutas' cuando ya hay 16 comandos + alias rayos-x. Tras gaps-finder + corrección: diagrama actualizado a 16 rutas + alias, todos los counts sincronizados. BP #128. WIN-017 (W1+W7). |
| 2026-10-02 | 1.9.0 | **PRE-v2.0 `add-sentinel-autonomous-quality-loop` promoted.** Comando `vigila` (18º) — Ciclo Autónomo de Calidad: el sistema detecta fallas automáticamente (comandos con ERROR, radiografías FAILED, ledger L2 ERROR, presupuesto de gateway >25s), abre por cada falla real un ciclo de 7 etapas (detectar → analizar → investigar → corregir → verificar → criterios posteriores → reportar) y genera reportes epoch inmutables con auto-crítica P13 sin intervención del operador. `scripts/vigila.sh` implementa el ciclo para entornos file-based. AP-031 (ciclo de calidad pasivo), AP-032 (presupuesto de gateway — HTML 504 parseado como JSON), AP-033 (regex de prefijo IDE que consumía `ide detect`/`ide all`). BP #129 (ciclo autónomo post-error). Killer Feature #110 (sentinel quality loop). WIN-019 (W1+W8). |
| 2026-10-04 | 2.0.0 | **PRE-v2.0 `add-goal-driven-workflow-loop` promoted.** Comando `bucle <prompt>` (19º) + protocolo §8.4 — Bucle Agéntico Goal-Driven: asume cero conocimiento, deriva goals con criterios verificables SOLO del prompt inicial, investiga (web real), planifica pasos y tareas, emite reportes PRE/PRO por iteración, ejecuta, auto-critica (P13), auto-aprende (P9), evalúa goals y re-itera con handoff hasta lograr TODOS (PAUSED reanudable con `bucle continúa` — bucle infinito entre invocaciones). `scripts/bucle.sh` implementa el orquestador para entornos file-based. WIN-018. |
| 2026-10-06 | 2.1.0 | **PRE-v2.0 `add-enterprise-admin-panels-standard` promoted.** Regla **P16** + sección **§11** — estándar enterprise de paneles admin/account/users: scroll verificado + beauty scroll panels, dashboard por módulo, soft delete con papelera + hard delete auditado, listados con paginación/filtros/draggable-sortable/dots menu, forms como pageviews con URL propia (PROHIBIDO modal box) en doble modalidad wizard/avanzado, datos cruzados consultables, preview, batch processes y detalles con tabs corporate-grade; UX auto-magic; rutas resourceful; verificación P14+P15. AP-034, BP #130, Killer #111, WIN-020. |
| 2026-10-06 | 2.2.0 | **Directriz del operador promoted (work queue + event-driven).** Reglas **P17** (Cola de Trabajo de Creación Continua: "Guardar y crear otro", autosave con rehidratación, reintentos rate-limit aware con backoff + jitter + presupuesto por ventana, idempotency keys, toasts con presupuesto visual agregados/deduplicados, errores terminales a notificaciones human-in-the-loop sin bloquear la cola) + **§11.6-11.9** (cola, notificaciones inteligentes, menú contextual clic derecho con fuente única vs dots menu, killer features corporate grade por perfil) y **P18** (Arquitectura Event-Driven para SaaS y data streaming) + **§12** (event bus tipado versionado, caching invalidado por eventos, hooks/filters, queuing con backpressure + DLQ reprocesable, fast inner pipelines con batching, data transport por contrato, broadcasting WebSocket/SSE con rooms y rehidratación — PROHIBIDO polling como tiempo real). AP-035/036, BP #131-132, Killer #112-115, WIN-021. |

---

## Licencia

MIT — ver [LICENSE](LICENSE).

---

## Recordatorio de seguridad

**Si clonaste este boilerplate:** rota cualquier token, API key o secreto que se
haya filtrado en el historial git. Este boilerplate **NO** incluye secretos por
defecto; usa `.env.example` como plantilla.

---

> **Filosofía de cierre:** Este README es un mapa. El territorio es `AGENTS.md`.
> Cuando un LLM pierde el mapa, el territorio sigue en pie porque es inmutable (P9)
> y la gobernanza PRE-v2.0 impide su degradación. *Escribe las reglas una vez.
> Opéralas para siempre.*
