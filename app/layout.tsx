import type { Metadata } from "next";
import "./globals.css";
import { PreviewProvider } from "@/components/PreviewProvider";
import { ClinicalSessionProvider } from "@/lib/ClinicalSessionContext";
import { SidebarModeProvider } from "@/lib/SidebarModeContext";

export const metadata: Metadata = {
  title: "Iatron",
  description: "Iatron. Always on. Assistente de IA para apoio à decisão clínica.",
  icons: {
    icon: "/favicon-kyron.png"
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
        <link rel="icon" href="/favicon-kyron.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-kyron-512.png" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body>
        <ClinicalSessionProvider>
          <PreviewProvider>
            <SidebarModeProvider>
              {children}
            </SidebarModeProvider>
          </PreviewProvider>
        </ClinicalSessionProvider>
      </body>
    </html>
  );
}
