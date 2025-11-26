import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health ICU Copilot - Prototipo Hospitalar",
  description: "Interface de apoio à decisão para UTI, com visual limpo e hospitalar."
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
