// test-judge.ts — Verificación de calibración del juez determinista
// (script de calibración de desarrollo, no test de producción)
import { judgeProposal, constitutionScore, baselineDimensions } from "../src/lib/agent-os/pre-judge";

const base = baselineDimensions();
console.log("Baseline S =", constitutionScore(base), "\n");

const PROPOSALS: [string, string, string][] = [
  ["Pipeline de Radiografía Rayos X como comando canónico 17", "Comando canónico 17 que despliega servidores MCP y ejecuta el pipeline de radiografía de 5 fases sobre cualquier URL: extracción de branding y tokens, análisis DOM con detección de shaders 3D WebGL, radiografía del modelo de negocio hacia esquema SQL y contratos OpenAPI 3.1, reconstrucción modular con widgets EAV y verificación headless P14. Cada fase registra fallback determinista ante errores, sanitiza el contenido externo (P12) y anexa hallazgos al ledger inmutable de memoria empírica.", "KILLER"],
  ["Skill devtools-inspector: WebGL/GLSL + getComputedStyle", "Servidores MCP con Chrome DevTools Protocol y Puppeteer que inyectan scripts en la consola del navegador para inspeccionar instancias WebGL, extraer geometrías, texturas, shaders GLSL y volcar propiedades computadas CSS (getComputedStyle, keyframes, GSAP). Los resultados se validan contra esquema JSON estricto; ante errores de protocolo se aplica fallback determinista y el tráfico interceptado alimenta los contratos OpenAPI 3.1 del sistema.", "MCP"],
  ["Skill market-porter: auditoría de modelo de negocio", "Investigación autónoma del modelo de negocio del objetivo: mapea pricing y planes, analiza propuestas de valor, extrae testimonios para identificar pain points, y audita canales de distribución y pasarelas de pago. El material alimenta las 5 Fuerzas de Porter y las 12 Personas de POV; los hallazgos se validan contra esquema JSON con fallback ante fuentes caídas y se anexan a la memoria del proyecto.", "SKILL"],
  ["Contratos JSON interceptados → OpenAPI 3.1", "Best practice para interceptar el tráfico XHR/Fetch del objetivo y documentar contratos JSON no documentados y los payloads con que el sitio hidrata sus gráficos Three.js. Cada contrato se valida con un ejecutor determinista antes de programar los clientes de backend, se versiona en el esquema OpenAPI 3.1 del sistema, y los errores de red activan fallback y circuit breaker en lugar de reintentos ciegos.", "BP"],
  ["Skill sandbox-compiler: verificación WebGL aislada", "Entorno sandbox aislado donde el agente ensambla el clon de la escena Three.js, verifica que los shaders compilen sin errores WebGL en cada iteración y mide la tasa de FPS antes de incorporar el componente al monorepo. Cumple la regla de aislamiento de la fase 5 del pipeline: los errores de compilación se registran con el contrato de salida JSON, con retry acotado y abort controlado ante fallos consecutivos.", "SKILL"],
  ["Squad de subagentes: extractor + analista + sintetizador", "Best practice de orquestación con división de tareas entre subagentes tipados: un extractor de assets, un analista de contratos y API, y un sintetizador de arquitectura. Cada subagente opera en su fase del pipeline, reporta mediante eventos con esquema JSON validado, y el orquestador aplica fallback determinista ante errores de un miembro, anexando la evidencia al ledger inmutable de memoria.", "BP"],
  ["Firecrawl Extraction Pipeline", "A pipeline for extracting web content using Firecrawl with caching and error handling for robust scraping.", "SKILL"],
  ["MCP Server Framework", "A framework for building MCP servers with tools and resources for agent integration.", "SKILL"],
];

for (const [title, desc, type] of PROPOSALS) {
  const v = judgeProposal(title, desc, type);
  const dims = `d1 ${v.scores.d1} d2 ${v.scores.d2} d3 ${v.scores.d3} d4 ${v.scores.d4} d5 ${v.scores.d5} d6 ${v.scores.d6}`;
  console.log(
    `${v.promoted ? "PROMOTE" : "REJECT "} | S ${String(v.s).padStart(5)} | ΔS ${String(v.deltaS).padStart(6)} | σ ${String(v.sigmaCandidate).padStart(4)} | ${dims} | ${title.slice(0, 40)}`
  );
  if (!v.promoted) console.log(`         razones: ${v.reasons.join(" ;; ")}`);
}
