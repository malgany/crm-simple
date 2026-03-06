import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { themeInitScript } from "@/lib/theme";
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className={`${manrope.variable} ${jetbrainsMono.variable} bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            classNames: {
              toast: "border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-lg",
              description: "text-[var(--muted-foreground)]",
            },
          }}
        />
      </body>
    </html>
  );
}
