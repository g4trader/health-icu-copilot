import type { Metadata } from "next";
import "./globals.css";
import { PreviewProvider } from "@/components/PreviewProvider";
import { ClinicalSessionProvider } from "@/lib/ClinicalSessionContext";

export const metadata: Metadata = {
  title: "Health Copilot + - UTI Pediátrica",
  description: "Interface de apoio à decisão para UTI Pediátrica, com visual limpo e hospitalar.",
  icons: {
    icon: "/favicon.png"
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
        <link rel="icon" href="/favicon.png" sizes="any" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
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
