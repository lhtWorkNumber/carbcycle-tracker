"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarRange, Home, Plus, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "首页", icon: Home },
  { href: "/plan", label: "计划", icon: CalendarRange },
  { href: "/stats", label: "统计", icon: BarChart3 },
  { href: "/settings", label: "我的", icon: UserRound }
] as const;

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-4 flex w-full max-w-[28rem] items-end justify-between rounded-[2rem] border border-white/60 bg-white/88 px-5 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85">
        <div className="flex flex-1 justify-between">
          {items.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[3.75rem] flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/add-food?meal=snack"
          className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(22,163,74,0.35)] transition-transform hover:scale-[1.02]"
          aria-label="添加记录"
        >
          <Plus className="h-6 w-6" />
        </Link>

        <div className="flex flex-1 justify-between">
          {items.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[3.75rem] flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
