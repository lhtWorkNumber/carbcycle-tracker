"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UnitInput } from "@/components/ui/unit-input";
import { SectionTitle } from "@/components/tracker/section-title";
import { formatChineseDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { useTrackerStore } from "@/store/tracker-store";

function UploadCard({
  label,
  preview,
  onChange
}: {
  label: string;
  preview: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex min-h-[11rem] cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-border bg-white/72 p-4 text-center dark:bg-white/5">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} className="h-40 w-full rounded-2xl object-cover" />
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
  const [submitting, setSubmitting] = useState(false);
  const sortedBodyRecords = bodyRecords.slice().sort((left, right) => right.date.localeCompare(left.date));

  async function handleSubmit() {
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
            weight: Number(weight),
            body_fat_percentage: bodyFat ? Number(bodyFat) : null,
            waist_cm: waist ? Number(waist) : null,
            note
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
          weight: Number(weight),
          bodyFatPercentage: bodyFat ? Number(bodyFat) : undefined,
          waistCm: waist ? Number(waist) : undefined,
          note
        });
      }

      setNote("");
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
          <UploadCard label="上传对比照（之前）" preview={beforePreview} onChange={(event) => setBeforePreview(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : null)} />
          <UploadCard label="上传对比照（现在）" preview={afterPreview} onChange={(event) => setAfterPreview(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : null)} />
        </div>
        <Button className="mt-4 h-12 w-full rounded-[1.3rem]" onClick={() => void handleSubmit()} disabled={submitting}>
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
