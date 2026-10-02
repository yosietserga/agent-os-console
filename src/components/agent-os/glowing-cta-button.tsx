"use client";

// ════════════════════════════════════════════════════════════════════════
// glowing-cta-button.tsx — Widget Canónico W-CTA (docs/widgets/)
// Estados: disabled → enabled-glowing → hover → active → success / error
// Gradient #0071e3→#005bb5 · glow pulsante 2.4s · máx 12-16px · opacidad
// 0.4 · prefers-reduced-motion: desactiva glow, mantiene gradient.
// ════════════════════════════════════════════════════════════════════════

import { forwardRef } from "react";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type CtaState = "disabled" | "ready" | "loading" | "success" | "error";

interface GlowingCtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ctaState?: CtaState;
  glowWhenReady?: boolean;
  icon?: React.ReactNode;
}

const GlowingCtaButton = forwardRef<HTMLButtonElement, GlowingCtaButtonProps>(
  ({ className, children, ctaState = "ready", glowWhenReady = true, icon, disabled, ...props }, ref) => {
    const isDisabled = disabled || ctaState === "disabled" || ctaState === "loading";
    const showGlow = glowWhenReady && ctaState === "ready";

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={ctaState === "loading"}
        aria-live="polite"
        className={cn(
          "group relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5",
          "text-sm font-semibold tracking-tight text-white",
          "transition-all duration-200 ease-out select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isDisabled
            ? "cursor-not-allowed bg-[#c7c7cc] text-white/90 shadow-none"
            : showGlow
              ? "cta-glow cursor-pointer"
              : cn(
                  "cursor-pointer bg-gradient-to-br from-[#0071e3] to-[#005bb5]",
                  "shadow-[0_10px_28px_-10px_rgba(0,113,227,0.55)]",
                  "hover:from-[#0a7ef0] hover:to-[#0666c7] hover:shadow-[0_14px_34px_-10px_rgba(0,113,227,0.7)]",
                  "active:scale-[0.977]"
                ),
          ctaState === "success" &&
            "bg-gradient-to-br from-[#34c759] to-[#248a3d] shadow-[0_10px_28px_-10px_rgba(52,199,89,0.55)]",
          ctaState === "error" &&
            "bg-gradient-to-br from-[#ff3b30] to-[#d70015] shadow-[0_10px_28px_-10px_rgba(255,59,48,0.55)]",
          className
        )}
        {...props}
      >
        {ctaState === "loading" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {ctaState === "success" && <Check className="size-4" aria-hidden="true" />}
        {ctaState === "error" && <AlertTriangle className="size-4" aria-hidden="true" />}
        {ctaState !== "loading" && ctaState !== "success" && ctaState !== "error" && icon}
        <span>{children}</span>
      </button>
    );
  }
);
GlowingCtaButton.displayName = "GlowingCtaButton";

export { GlowingCtaButton };
