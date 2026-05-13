"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Gauge,
  Calculator,
  Map,
  Megaphone,
  Truck,
  HeartPulse,
  Sparkles,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

const items = [
  { href: "/", icon: Gauge, labelKey: "nav.dashboard" },
  { href: "/profit", icon: Calculator, labelKey: "nav.profit" },
  { href: "/returns", icon: Map, labelKey: "nav.returns" },
  { href: "/ads", icon: Megaphone, labelKey: "nav.ads" },
  { href: "/delivery", icon: Truck, labelKey: "nav.delivery" },
  { href: "/health", icon: HeartPulse, labelKey: "nav.health" }
];

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t, dir } = useI18n();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border/60 bg-card/80 backdrop-blur",
        "transition-[width] duration-300",
        collapsed ? "w-[76px]" : "w-[260px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow">
          <Sparkles className="h-4 w-4" />
          <span className="absolute inset-0 animate-pulse rounded-xl bg-brand-500/20" />
        </div>
        {!collapsed && (
          <div className="flex-1 truncate">
            <div className="text-sm font-semibold tracking-tight">AECC</div>
            <div className="truncate text-[11px] text-muted-foreground">Command Center</div>
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className={cn(
            "ml-auto hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:flex",
            dir === "rtl" && "rotate-180"
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              {!collapsed && <span className="relative z-10 truncate">{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-xl border border-border/60 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-900/10 p-3">
        {!collapsed ? (
          <>
            <div className="text-xs font-semibold">Pro tip</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Exclude wilayas with a return rate above 35% from your next campaign.
            </p>
          </>
        ) : (
          <Sparkles className="h-5 w-5 text-primary" />
        )}
      </div>
    </aside>
  );
}
