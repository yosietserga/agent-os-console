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
  title: "Agent OS — L2 Control Plane & Empirical Memory Console",
  description:
    "Sistema Universal de Control Agéntico: constitución AGENTS.md v1.8.0, memoria empírica append-only, gobernanza PRE-v2.0, PSIM K1-K5, L2 Control Plane y pipeline de radiografía de ingeniería inversa.",
  keywords: [
    "Agent OS", "AGENTS.md", "Control Plane L2", "PRE-v2.0", "PSIM",
    "mejorate", "radiografía", "ingeniería inversa", "memoria empírica",
  ],
  authors: [{ name: "Yosiet Serga" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Agent OS — Universal Agent Operating System",
    description:
      "Escribe las reglas una vez. Opéralas para siempre. Consola de control agéntico con auto-mejora (mejorate), juez determinista PRE-v2.0 y radiografía de ingeniería inversa.",
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
