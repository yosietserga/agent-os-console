# Skill: apple-theme-linter

> Escanea hojas de estilo CSS, archivos TSX/JSX/HTML y clases Tailwind para
> garantizar el cumplimiento de la Regla P5 (Apple Light Mode) y la Regla P7
> (Zero-Placeholder, Zero-Emoji).

## Contrato

### Input
```json
{
  "scanPath": "src/",
  "extensions": [".css", ".tsx", ".jsx", ".html", ".php", ".vue", ".svelte"],
  "strictMode": true
}
```

### Output
```json
{
  "totalFilesScanned": 142,
  "violations": [
    {
      "file": "src/components/Hero.tsx",
      "line": 23,
      "rule": "P5_PALETTE",
      "severity": "error",
      "detail": "Found color #b48a44 (mustard/marrón) — forbidden by Regla P5.",
      "suggestion": "Use --bg-surface (#f5f5f7) or --accent (#0071e3)."
    },
    {
      "file": "src/styles/globals.css",
      "line": 87,
      "rule": "P5_NO_IMPORTANT",
      "severity": "error",
      "detail": "Found '!important' directive — forbidden by Regla P5 (cascade hijacking).",
      "suggestion": "Increase specificity or adjust CSS variables."
    },
    {
      "file": "src/components/Footer.tsx",
      "line": 12,
      "rule": "P7_EMOJI",
      "severity": "error",
      "detail": "Found emoji '🚀' in JSX text — forbidden by Regla P7.",
      "suggestion": "Replace with SVG icon from lucide-react."
    },
    {
      "file": "src/components/Contact.tsx",
      "line": 45,
      "rule": "P7_PLACEHOLDER",
      "severity": "warning",
      "detail": "Found placeholder phone '+1 800 555-0199' — forbidden by Regla P7.",
      "suggestion": "Pull from database or config."
    }
  ],
  "summary": {
    "errors": 3,
    "warnings": 1,
    "passes": false
  }
}
```

## Reglas que valida

### P5 — Paleta Apple Light Mode
Colores permitidos:
- `#ffffff` (bg primary)
- `#f5f5f7` (bg surface)
- `#e5e5ea`, `#d2d2d7` (borders)
- `#1d1d1f` (text title)
- `#86868b` (text secondary)
- `#0071e3` (accent)

Prohibidos:
- `#b48a44` (mostaza/marrón) — explícitamente prohibido por P5.
- `#070709` (dark mode como tema base) — prohibido.
- Cualquier `!important`.

### P7 — Zero-Placeholder, Zero-Emoji
- Detecta rangos Unicode de emojis (U+1F300-U+1FAFF, U+2600-U+27BF, etc.).
- Detecta patrones de placeholder: `+1 800 555-XXXX`, `example@`, `lorem ipsum`,
  `test@test.com`, `john doe`, etc.

## Integración con CI

El workflow `.github/workflows/gate-honesty.yml` invoca esta skill en cada PR.
Si `summary.passes === false`, el PR queda bloqueado.

## Reglas que aplica

- Best Practices #61, #68, #69, #78 (estilo Apple, separadores, sin emojis, sin important).
- Antipatrones #14, #15, #41, #42 (emojis, important, colores fuera de paleta, dark mode forzado).

## Implementación de referencia

`src/index.ts` — TypeScript puro. Usa `postcss` para parsear CSS,
`@babel/parser` para TSX/JSX, y regex Unicode para emojis.
