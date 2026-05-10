"use client";

import { useEffect, useState } from "react";
import { Droplets, LoaderCircle, Minus, Plus, Save, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { useTrackerStore } from "@/store/tracker-store";

export function WaterTracker() {
  const selectedDate = useTrackerStore((state) => state.selectedDate);
  const waterLogs = useTrackerStore((state) => state.waterLogs);
  const addWater = useTrackerStore((state) => state.addWater);
  const setWaterTarget = useTrackerStore((state) => state.setWaterTarget);
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
  const fillRatio = Math.min(1, log.amountMl / Math.max(1, log.targetMl));
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [targetDraft, setTargetDraft] = useState(String(log.targetMl));
  const [waterAction, setWaterAction] = useState<string | null>(null);
  const [savingTarget, setSavingTarget] = useState(false);
  const parsedTarget = Number(targetDraft);
  const nextTargetMl = Number.isFinite(parsedTarget) ? Math.round(parsedTarget) : 0;
  const canSaveTarget = nextTargetMl >= 500 && nextTargetMl <= 10000 && nextTargetMl !== log.targetMl;
  const isWaterBusy = waterAction !== null;

  useEffect(() => {
    setTargetDraft(String(log.targetMl));
  }, [log.targetMl, selectedDate]);

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
    const actionId = amount > 0 ? `add-${amount}` : `remove-${Math.abs(amount)}`;
    const nextAmount = Math.min(10000, Math.max(0, log.amountMl + amount));
    const actualDelta = nextAmount - log.amountMl;
    const nextEntries = actualDelta === 0 ? log.entries : [...log.entries, actualDelta];

    if (actualDelta === 0) {
      return;
    }

    try {
      setWaterAction(actionId);

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
        if (actualDelta > 0) {
          addWater(actualDelta);
        } else {
          upsertWaterLogFromServer({
            ...log,
            amountMl: nextAmount,
            entries: nextEntries
          });
        }
      }

      setLastDelta(actualDelta);
      toast({
        title: actualDelta > 0 ? "饮水已记录" : "饮水已调整",
        description:
          actualDelta > 0
            ? `已新增 ${actualDelta}ml，继续保持补水。`
            : `已减少 ${Math.abs(actualDelta)}ml，当前已记录 ${nextAmount}ml。`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "记录失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setWaterAction(null);
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
      setWaterAction("undo");

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
    } finally {
      setWaterAction(null);
    }
  }

  async function saveTarget() {
    if (!canSaveTarget) {
      return;
    }

    try {
      setSavingTarget(true);

      if (isAuthConfigured && authUser) {
        const response = await fetch("/api/water-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: new Date(`${selectedDate}T12:00:00.000Z`).toISOString(),
            targetMl: nextTargetMl,
            amountMl: log.amountMl,
            entries: log.entries
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "保存饮水目标失败");
        }

        const savedLog = await response.json();
        upsertWaterLogFromServer(savedLog);
      } else {
        setWaterTarget(nextTargetMl, selectedDate);
      }

      toast({
        title: "目标已保存",
        description: `今日目标调整为 ${nextTargetMl}ml。`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "目标保存失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setSavingTarget(false);
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
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={log.amountMl <= 0 || isWaterBusy}
              onClick={() => void changeWater(-250)}
              className="h-14 rounded-[1.2rem] px-2"
            >
              {waterAction === "remove-250" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Minus className="mr-1 h-4 w-4" />
                  250ml
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={log.amountMl >= 10000 || isWaterBusy}
              onClick={() => void changeWater(250)}
              className="h-14 rounded-[1.2rem] px-2"
            >
              {waterAction === "add-250" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-1 h-4 w-4" />
                  250ml
                </>
              )}
            </Button>
            <Button
              type="button"
              disabled={log.amountMl >= 10000 || isWaterBusy}
              onClick={() => void changeWater(500)}
              className="h-14 rounded-[1.2rem] px-2"
            >
              {waterAction === "add-500" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-1 h-4 w-4" />
                  500ml
                </>
              )}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={log.entries.length === 0 || lastDelta === null || isWaterBusy}
            onClick={() => void undoLastAction()}
            className="h-11 rounded-[1.2rem] border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
          >
            {waterAction === "undo" ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="mr-2 h-4 w-4" />
            )}
            撤销上一次
          </Button>
        </div>
      </div>

      <div className="grid gap-2 rounded-[1.2rem] bg-secondary/70 p-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <label htmlFor="water-target" className="text-xs font-medium text-muted-foreground">
            今日目标
          </label>
          <div className="relative">
            <Input
              id="water-target"
              type="number"
              inputMode="numeric"
              min={500}
              max={10000}
              step={100}
              value={targetDraft}
              onChange={(event) => setTargetDraft(event.target.value)}
              className="h-11 rounded-[1rem] bg-background pr-12"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              ml
            </span>
          </div>
        </div>
        <Button
          type="button"
          className="h-11 self-end rounded-[1rem]"
          disabled={!canSaveTarget || savingTarget}
          onClick={() => void saveTarget()}
        >
          {savingTarget ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          保存目标
        </Button>
      </div>
    </section>
  );
}
