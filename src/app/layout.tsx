import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent OS — Living Topology Visualizer & Ciclo Autónomo de Calidad",
  description:
    "Mira el workflow agéntico respirar: topología viva con nodos activos/inactivos, flujos y transferencias de contexto en tiempo real (incluidas las transferencias de inferencia L2), iteraciones del ciclo autónomo de calidad en un kanban KPI, y la consola Agent OS v2.2.0 con Instanciador Zero-Shot (Protocolo 11), constitución AGENTS.md, memoria empírica y gobernanza PRE-v2.0.",
  keywords: [
    "Agent OS", "AGENTS.md", "Living Topology Visualizer", "topología viva",
    "kanban KPI", "transferencias de contexto", "Control Plane L2", "PRE-v2.0", "PSIM",
    "mejorate", "radiografía", "ciclo autónomo de calidad",
  ],
  authors: [{ name: "Yosiet Serga" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Agent OS — Living Topology Visualizer",
    description:
      "Topología viva del workflow agéntico: pasos, flujos, nodos activados y desactivados, iteraciones y contextos transferidos en cada inferencia — con kanban KPI y consola de control.",
    siteName: "Agent OS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
