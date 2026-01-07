import type { Metadata } from "next";
import "./globals.css";
import { PreviewProvider } from "@/components/PreviewProvider";
import { ClinicalSessionProvider } from "@/lib/ClinicalSessionContext";

export const metadata: Metadata = {
  title: "VIC - UTI Pediátrica",
  description: "VIC. Always on. Acompanhamento contínuo para UTI Pediátrica.",
  icons: {
    icon: "/favicon-vic.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon-vic.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-vic.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-vic-512.png" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body>
        <ClinicalSessionProvider>
          <PreviewProvider>
            {children}
          </PreviewProvider>
        </ClinicalSessionProvider>
      </body>
    </html>
  );
}
