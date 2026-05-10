"use client";

import { type ChangeEvent, type MutableRefObject, useEffect, useRef, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UnitInput } from "@/components/ui/unit-input";
import { SectionTitle } from "@/components/tracker/section-title";
import { formatChineseDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { useTrackerStore } from "@/store/tracker-store";

function isServerBodyRecordId(recordId: string) {
  return recordId.startsWith("body-record-");
}

function UploadCard({
  label,
  preview,
  onChange
}: {
  label: string;
  preview: string | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex min-h-[11rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.6rem] border border-dashed border-border bg-white/72 p-3 text-center dark:bg-white/5 sm:p-4">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} className="h-40 w-full rounded-[1.15rem] object-cover" />
      ) : (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
    </label>
  );
}

export function RecordScreen() {
  const { toast } = useToast();
  const addBodyRecord = useTrackerStore((state) => state.addBodyRecord);
  const insertBodyRecordFromServer = useTrackerStore((state) => state.insertBodyRecordFromServer);
  const removeBodyRecord = useTrackerStore((state) => state.removeBodyRecord);
  const bodyRecords = useTrackerStore((state) => state.bodyRecords);
  const selectedDate = useTrackerStore((state) => state.selectedDate);
  const authUser = useAuthStore((state) => state.user);
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const [weight, setWeight] = useState("72");
  const [bodyFat, setBodyFat] = useState("16");
  const [waist, setWaist] = useState("82");
  const [note, setNote] = useState("");
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const beforePreviewRef = useRef<string | null>(null);
  const afterPreviewRef = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const sortedBodyRecords = bodyRecords.slice().sort((left, right) => right.date.localeCompare(left.date));
  const weightValue = Number(weight);
  const bodyFatValue = bodyFat ? Number(bodyFat) : undefined;
  const waistValue = waist ? Number(waist) : undefined;
  const trimmedNote = note.trim();
  const canSubmit =
    Number.isFinite(weightValue) &&
    weightValue >= 25 &&
    weightValue <= 350 &&
    (bodyFatValue === undefined || (Number.isFinite(bodyFatValue) && bodyFatValue >= 0 && bodyFatValue <= 75)) &&
    (waistValue === undefined || (Number.isFinite(waistValue) && waistValue >= 20 && waistValue <= 300));

  useEffect(() => {
    return () => {
      revokePreview(beforePreviewRef.current);
      revokePreview(afterPreviewRef.current);
    };
  }, []);

  function revokePreview(previewUrl: string | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }

  function setPreviewFromFile(
    event: ChangeEvent<HTMLInputElement>,
    currentPreviewRef: MutableRefObject<string | null>,
    setPreview: (preview: string | null) => void
  ) {
    const file = event.target.files?.[0] ?? null;
    revokePreview(currentPreviewRef.current);

    if (!file) {
      currentPreviewRef.current = null;
      setPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    currentPreviewRef.current = previewUrl;
    setPreview(previewUrl);
    event.target.value = "";
  }

  function clearPhotoPreviews() {
    revokePreview(beforePreviewRef.current);
    revokePreview(afterPreviewRef.current);
    beforePreviewRef.current = null;
    afterPreviewRef.current = null;
    setBeforePreview(null);
    setAfterPreview(null);
  }

  async function handleSubmit() {
    if (!canSubmit) {
      toast({
        title: "请检查身体记录",
        description: "体重、体脂率和腰围需要填写为有效数值。",
        variant: "error"
      });
      return;
    }

    setSubmitting(true);

    try {
      if (isAuthConfigured && authUser) {
        const response = await fetch("/api/body-records", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: new Date(`${selectedDate}T12:00:00.000Z`).toISOString(),
            weight: weightValue,
            body_fat_percentage: bodyFatValue ?? null,
            waist_cm: waistValue ?? null,
            note: trimmedNote
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "保存身体记录失败");
        }

        const record = await response.json();
        insertBodyRecordFromServer(record);
      } else {
        addBodyRecord({
          weight: weightValue,
          bodyFatPercentage: bodyFatValue,
          waistCm: waistValue,
          note: trimmedNote
        });
      }

      setNote("");
      clearPhotoPreviews();
      toast({
        title: "身体记录已保存",
        description: "你的体重与围度数据已经更新。",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteBodyRecord(recordId: string) {
    setDeletingRecordId(recordId);

    try {
      if (isAuthConfigured && authUser && isServerBodyRecordId(recordId)) {
        const response = await fetch(`/api/body-records?id=${encodeURIComponent(recordId)}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "删除身体记录失败");
        }
      }

      removeBodyRecord(recordId);
      toast({
        title: "身体记录已删除",
        description: "趋势和成就数据已经同步更新。",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setDeletingRecordId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 safe-px pb-28 pt-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">身体记录</p>
        <h1 className="text-3xl font-semibold tracking-tight">记录体重与围度</h1>
      </section>

      <section className="rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
        <SectionTitle title="今日录入" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <UnitInput label="体重" unit="kg" value={weight} onChange={(event) => setWeight(event.target.value)} type="number" inputMode="decimal" min={35} step="0.1" />
          <UnitInput label="体脂率" unit="%" value={bodyFat} onChange={(event) => setBodyFat(event.target.value)} type="number" inputMode="decimal" min={0} max={60} step="0.1" />
          <UnitInput label="腰围" unit="cm" value={waist} onChange={(event) => setWaist(event.target.value)} type="number" inputMode="decimal" min={40} step="0.1" />
        </div>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="备注：例如今天睡眠、训练状态、饮食执行情况" className="mt-3" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <UploadCard label="上传对比照（之前）" preview={beforePreview} onChange={(event) => setPreviewFromFile(event, beforePreviewRef, setBeforePreview)} />
          <UploadCard label="上传对比照（现在）" preview={afterPreview} onChange={(event) => setPreviewFromFile(event, afterPreviewRef, setAfterPreview)} />
        </div>
        <Button className="mt-4 h-12 w-full rounded-[1.3rem]" onClick={() => void handleSubmit()} disabled={submitting || !canSubmit}>
          {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
          {submitting ? "保存中…" : "保存身体记录"}
        </Button>
      </section>

      <section className="space-y-3">
        <SectionTitle title="最近记录" />
        <div className="space-y-3">
          {sortedBodyRecords.length > 0 ? sortedBodyRecords.map((record) => (
            <div key={record.id} className="rounded-[1.6rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{formatChineseDate(record.date, { month: "numeric", day: "numeric" })}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    体重 {record.weight} kg
                    {record.bodyFatPercentage != null ? ` · 体脂 ${record.bodyFatPercentage}%` : ""}
                    {record.waistCm != null ? ` · 腰围 ${record.waistCm} cm` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => void deleteBodyRecord(record.id)}
                  disabled={deletingRecordId === record.id}
                  aria-label="删除身体记录"
                >
                  {deletingRecordId === record.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {record.note ? <p className="mt-3 text-sm text-muted-foreground">{record.note}</p> : null}
            </div>
          )) : (
            <div className="rounded-[1.6rem] border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              还没有身体记录，保存一次体重或围度后会显示在这里。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
