"use client";

import * as React from "react";
import { Globe, Moon, SunMedium, Keyboard, Menu, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/providers/i18n-provider";
import { useData } from "@/components/providers/data-provider";
import { useToast } from "@/components/ui/toaster";
import type { Lang } from "@/lib/types";

export function Header({ onOpenMobileSidebar }: { onOpenMobileSidebar: () => void }) {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { resetAll } = useData();
  const { toast } = useToast();
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  const langLabel: Record<Lang, string> = { fr: "Français", ar: "العربية", en: "English" };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden flex-1 md:block">
        <div className="relative max-w-md">
          <Input
            placeholder={`${t("common.search")} ( /  )`}
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Escape") (e.currentTarget as HTMLInputElement).blur();
            }}
          />
          <svg
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShortcutsOpen(true)}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Language">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["fr", "ar", "en"] as Lang[]).map((l) => (
              <DropdownMenuItem key={l} onSelect={() => setLang(l)}>
                <span className="flex-1">{langLabel[l]}</span>
                {lang === l && <span className="text-primary">•</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <SunMedium className="h-4 w-4 scale-100 rotate-0 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset demo data"
          title="Reset demo data"
          onClick={() => {
            resetAll();
            toast({
              title: "Demo data reset",
              description: "Fresh seeded data loaded.",
              variant: "success"
            });
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
          </DialogHeader>
          <ul className="grid gap-2 text-sm">
            {[
              ["G then D", "Dashboard"],
              ["G then P", "Profit Calculator"],
              ["G then R", "Returns & Wilayas"],
              ["G then A", "Ads"],
              ["G then L", "Delivery"],
              ["G then H", "Health"],
              ["T", "Toggle theme"],
              ["?", "Open this dialog"]
            ].map(([k, l]) => (
              <li key={k} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <span>{l}</span>
                <kbd className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{k}</kbd>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </header>
  );
}
