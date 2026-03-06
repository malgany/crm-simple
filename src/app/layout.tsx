import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Kanban Simplificado",
  description: "Kanban de atendimento com Supabase e Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        suppressHydrationWarning
        className={`${manrope.variable} ${jetbrainsMono.variable} bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            classNames: {
              toast: "border border-slate-200 bg-white text-slate-950 shadow-lg",
              description: "text-slate-600",
            },
          }}
        />
      </body>
    </html>
  );
}
