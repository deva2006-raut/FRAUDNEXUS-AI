import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "FRAUDNEXUS AI — From Suspicious Transaction to Explainable Investigation",
  description:
    "Agentic AI financial-crime investigation platform prototype. Correlates transaction history, customer behaviour, device signals, location and patterns into an explainable investigation trail with human review recommendation. DEMO — synthetic data only.",
};

export const viewport: Viewport = {
  themeColor: "#04070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-navy-950 text-ink-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
