"use client";

// ════════════════════════════════════════════════════════════════════════
// onboarding-tour.tsx — Widget Canónico OnboardingTour (P11)
// Erradica AP-015 (pantalla huérfana), AP-016 (tour no persistente:
// dismissal en localStorage) y AP-017 (tour no responsivo/accesible:
// Esc, foco, ARIA, bottom-sheet en móvil, prefers-reduced-motion).
// ════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TourStep {
  target: string; // selector data-tour="..."
  title: string;
  body: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  storageKey: string;
  version?: number;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingTour({ steps, storageKey, version = 1 }: OnboardingTourProps) {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const dismissedKey = `${storageKey}:v${version}`;

  // AP-016: persistencia del dismissal — no repetir el tour
  useEffect(() => {
    try {
      if (localStorage.getItem(dismissedKey) === "dismissed") return;
    } catch {
      /* almacenamiento no disponible: mostrar igualmente */
    }
    const t = setTimeout(() => setActive(true), 650);
    return () => clearTimeout(t);
  }, [dismissedKey]);

  // Escucha el reinicio manual desde TourRestartButton
  useEffect(() => {
    const restart = () => {
      setIndex(0);
      setActive(true);
    };
    window.addEventListener("agent-os:restart-tour", restart);
    return () => window.removeEventListener("agent-os:restart-tour", restart);
  }, []);

  // Responsive (AP-017): bottom-sheet en móvil, popover en desktop
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
    if (!active) return;
    // Medición asíncrona (rAF): sincroniza con el DOM sin setState síncrono en el efecto
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [active, measure]);

  // Accesibilidad (AP-017): Esc cierra, foco inicial en el botón de cierre
  const dismiss = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(dismissedKey, "dismissed");
    } catch {
      /* sin persistencia disponible */
    }
  }, [dismissedKey]);

  const next = useCallback(() => {
    // En el último paso cierra directamente desde el handler (sin efecto)
    if (index >= steps.length - 1) {
      dismiss();
    } else {
      setIndex(index + 1);
    }
  }, [index, steps.length, dismiss]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (!active) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, dismiss, next, prev]);

  if (!active || !step) return null;

  const panelPosition = isMobile
    ? "fixed bottom-0 left-0 right-0 rounded-t-2xl"
    : rect
      ? "fixed w-[340px] rounded-2xl"
      : "fixed left-1/2 top-1/2 w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-2xl";

  // Posicionamiento desktop: junto al target, sin salir del viewport
  let style: React.CSSProperties = {};
  if (!isMobile && rect) {
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    const above = spaceBelow < 220;
    style = above
      ? { top: Math.max(16, rect.top - 190), left: Math.min(Math.max(16, rect.left), window.innerWidth - 356) }
      : { top: Math.min(rect.top + rect.height + 14, window.innerHeight - 210), left: Math.min(Math.max(16, rect.left), window.innerWidth - 356) };
  }

  return (
    <>
      {/* Overlay + spotlight */}
      <div
        className="fixed inset-0 z-40 bg-[#1d1d1f]/45 backdrop-blur-[1.5px] transition-opacity duration-300"
        onClick={dismiss}
        aria-hidden="true"
      />
      {rect && (
        <div
          className="tour-spot fixed z-[45] bg-transparent"
          style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
          aria-hidden="true"
        />
      )}

      {/* Panel del paso */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Paso ${index + 1} de ${steps.length}: ${step.title}`}
        style={isMobile ? {} : style}
        className={cn(
          panelPosition,
          "z-50 border border-[#e5e5ea] bg-white p-5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)]",
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-reduce:animate-none"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
              Onboarding · Paso {index + 1}/{steps.length}
            </p>
            <h3 className="mt-1 text-base font-semibold text-[#1d1d1f]">{step.title}</h3>
          </div>
          <button
            ref={closeRef}
            onClick={dismiss}
            aria-label="Cerrar tour (Esc)"
            className="rounded-full p-1.5 text-[#86868b] transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#4b4b50]">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-5 bg-[#0071e3]" : "w-1.5 bg-[#d2d2d7]"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prev}
                aria-label="Paso anterior"
                className="h-9 rounded-full border-[#d2d2d7] px-3 text-[#1d1d1f] hover:bg-[#f5f5f7]"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={next}
              className="h-9 rounded-full bg-[#0071e3] px-4 text-white hover:bg-[#0077ed]"
            >
              {index === steps.length - 1 ? "Comenzar" : "Siguiente"}
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Botón "Repetir tour" para re-lanzar (persiste el espíritu AP-016)
export function TourRestartButton({ storageKey, version = 1 }: { storageKey: string; version?: number }) {
  return (
    <button
      onClick={() => {
        try {
          localStorage.removeItem(`${storageKey}:v${version}`);
        } catch {
          /* noop */
        }
        window.dispatchEvent(new CustomEvent("agent-os:restart-tour"));
      }}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#86868b] transition-colors hover:text-[#0071e3]"
    >
      <RotateCcw className="size-3" aria-hidden="true" />
      Repetir tour
    </button>
  );
}
