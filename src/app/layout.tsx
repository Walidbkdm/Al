import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { DataProvider } from "@/components/providers/data-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/shell/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});
const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Algerian Ecom Command Center",
  description:
    "Operations brain for Algerian COD e-commerce: profit, returns, ads, delivery, and a single business health score.",
  manifest: "/manifest.webmanifest",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
  applicationName: "AECC"
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" }
  ],
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${display.variable} ${arabic.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <I18nProvider>
            <DataProvider>
              <TooltipProvider delayDuration={150}>
                <Toaster>
                  <AppShell>{children}</AppShell>
                </Toaster>
              </TooltipProvider>
            </DataProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
