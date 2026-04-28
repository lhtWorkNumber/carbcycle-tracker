import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MacroProgressCard({
  icon: Icon,
  title,
  description,
  items
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Card className="border-white/70 bg-white/80 shadow-[0_20px_70px_rgba(90,73,43,0.1)] backdrop-blur">
      <CardHeader className="pb-3">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-stone-200/80 bg-stone-50/70 px-4 py-3 text-sm">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
