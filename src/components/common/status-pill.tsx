import { cn } from "@/lib/utils";

export function StatusPill({
  status,
  label,
  className
}: {
  status: "healthy" | "stable" | "warning" | "critical" | "risky" | "losing" | "info";
  label: React.ReactNode;
  className?: string;
}) {
  const map: Record<string, string> = {
    healthy: "bg-success/15 text-success",
    stable: "bg-info/15 text-info",
    warning: "bg-warning/15 text-warning",
    critical: "bg-destructive/15 text-destructive",
    risky: "bg-warning/15 text-warning",
    losing: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info"
  };
  const dotMap: Record<string, string> = {
    healthy: "bg-success",
    stable: "bg-info",
    warning: "bg-warning",
    critical: "bg-destructive",
    risky: "bg-warning",
    losing: "bg-destructive",
    info: "bg-info"
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        map[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotMap[status])} />
      {label}
    </span>
  );
}
