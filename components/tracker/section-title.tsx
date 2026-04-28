export function SectionTitle({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-1">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">{eyebrow}</p> : null}
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}
