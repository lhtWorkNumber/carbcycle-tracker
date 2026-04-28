"use client";

import { useEffect, useState } from "react";
import { Droplets } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { useTrackerStore } from "@/store/tracker-store";

export function WaterTracker() {
  const selectedDate = useTrackerStore((state) => state.selectedDate);
  const waterLogs = useTrackerStore((state) => state.waterLogs);
  const addWater = useTrackerStore((state) => state.addWater);
  const upsertWaterLogFromServer = useTrackerStore((state) => state.upsertWaterLogFromServer);
  const authUser = useAuthStore((state) => state.user);
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const log = waterLogs.find((entry) => entry.date === selectedDate) ?? {
    date: selectedDate,
    targetMl: 2000,
    amountMl: 0,
    entries: []
  };
  const { toast } = useToast();
  const fillRatio = Math.min(1, log.amountMl / log.targetMl);
  const [lastDelta, setLastDelta] = useState<number | null>(null);

  useEffect(() => {
    if (lastDelta === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLastDelta(null);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [lastDelta]);

  async function changeWater(amount: number) {
    const nextAmount = Math.max(0, log.amountMl + amount);
    const nextEntries =
      amount < 0 && nextAmount === log.amountMl
        ? log.entries
        : [...log.entries, amount];

    try {
      if (isAuthConfigured && authUser) {
        const response = await fetch("/api/water-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: new Date(`${selectedDate}T12:00:00.000Z`).toISOString(),
            targetMl: log.targetMl,
            amountMl: nextAmount,
            entries: nextEntries
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "保存饮水记录失败");
        }

        const savedLog = await response.json();
        upsertWaterLogFromServer(savedLog);
      } else {
        if (amount > 0) {
          addWater(amount);
        } else {
          upsertWaterLogFromServer({
            ...log,
            amountMl: nextAmount,
            entries: nextEntries
          });
        }
      }

      setLastDelta(amount);
      toast({
        title: amount > 0 ? "饮水已记录" : "饮水已调整",
        description:
          amount > 0
            ? `已新增 ${amount}ml，继续保持补水。`
            : `已减少 ${Math.abs(amount)}ml，当前已记录 ${nextAmount}ml。`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "记录失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    }
  }

  async function undoLastAction() {
    const delta = log.entries.at(-1);

    if (delta === undefined) {
      return;
    }

    const revertedAmount = Math.max(0, log.amountMl - delta);
    const revertedEntries = log.entries.slice(0, -1);

    try {
      if (isAuthConfigured && authUser) {
        const response = await fetch("/api/water-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: new Date(`${selectedDate}T12:00:00.000Z`).toISOString(),
            targetMl: log.targetMl,
            amountMl: revertedAmount,
            entries: revertedEntries
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "撤销饮水记录失败");
        }

        const savedLog = await response.json();
        upsertWaterLogFromServer(savedLog);
      } else {
        upsertWaterLogFromServer({
          ...log,
          amountMl: revertedAmount,
          entries: revertedEntries
        });
      }

      setLastDelta(null);
      toast({
        title: "已撤销上一次操作",
        description: `当前饮水记录回退到 ${revertedAmount}ml。`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "撤销失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    }
  }

  return (
    <section className="space-y-4 rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">饮水追踪</p>
          <h2 className="mt-1 text-lg font-semibold">
            {log.amountMl} / {log.targetMl} ml
          </h2>
        </div>
        <Droplets className="h-5 w-5 text-primary" />
      </div>

      <div className="flex items-end gap-4">
        <div className="relative h-28 w-20 overflow-hidden rounded-[1.4rem] border border-primary/20 bg-secondary">
          <div
            className="absolute inset-x-0 bottom-0 overflow-hidden rounded-b-[1.4rem] transition-[height] duration-500"
            style={{ height: `${fillRatio * 100}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#6ee7b7_0%,#10b981_100%)]" />
            <div className="water-wave absolute -top-3 left-[-50%] h-7 w-[200%] rounded-[45%] bg-emerald-100/80" />
            <div className="water-wave-slow absolute -top-2 left-[-50%] h-8 w-[200%] rounded-[42%] bg-emerald-200/55" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary">
            {Math.round(fillRatio * 100)}%
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={log.amountMl <= 0}
              onClick={() => void changeWater(-250)}
              className="flex-1 rounded-[1.2rem] border border-border bg-background px-4 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              -250ml
            </button>
            <button
              type="button"
              onClick={() => void changeWater(250)}
              className="flex-1 rounded-[1.2rem] bg-secondary px-4 py-4 text-sm font-semibold"
            >
              +250ml
            </button>
            <button
              type="button"
              onClick={() => void changeWater(500)}
              className="flex-1 rounded-[1.2rem] bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground"
            >
              +500ml
            </button>
          </div>
          <button
            type="button"
            disabled={log.entries.length === 0 || lastDelta === null}
            onClick={() => void undoLastAction()}
            className="rounded-[1.2rem] border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            撤销上一次操作
          </button>
        </div>
      </div>
    </section>
  );
}
