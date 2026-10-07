import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Git Graph Agent",
  description: "Radiografía visual de un repositorio de GitHub",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0b0d12", color: "#e6e8ee" }}>
        {children}
      </body>
    </html>
  );
}
