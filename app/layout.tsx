import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        {children}
      </body>
    </html>
  );
}
