import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NimbrayAI",
  description: "Assistant IA humain, enseignable et prêt pour la bêta plateforme.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
