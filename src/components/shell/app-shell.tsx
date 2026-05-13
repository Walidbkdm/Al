"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { dir } = useI18n();

  return (
    <div dir={dir} className="flex min-h-svh w-full">
      <KeyboardShortcuts />

      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-svh md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-drawer"
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              className={cn(
                "absolute inset-y-0 h-full w-[280px]",
                dir === "rtl" ? "right-0" : "left-0"
              )}
              initial={{ x: dir === "rtl" ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? 300 : -300 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <Sidebar collapsed={false} onToggle={() => {}} onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] grid-bg opacity-60" />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
