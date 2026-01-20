import type { Metadata } from "next";
import "./globals.css";
import { PreviewProvider } from "@/components/PreviewProvider";
import { ClinicalSessionProvider } from "@/lib/ClinicalSessionContext";

export const metadata: Metadata = {
  title: "Kyron AI agent",
  description: "Kyron AI agent. Always on. Assistente de IA para apoio à decisão clínica.",
  icons: {
    icon: "/favicon-kyron.svg"
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
        <link rel="icon" href="/favicon-kyron.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-kyron.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-kyron-512.png" />
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
