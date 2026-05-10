import { cn } from "@/lib/utils";

export function LifestylePanel({
  imageUrl,
  title,
  eyebrow,
  metrics,
  className
}: {
  imageUrl: string;
  title: string;
  eyebrow: string;
  metrics: Array<{
    label: string;
    value: string;
  }>;
  className?: string;
}) {
  return (
    <div className={cn("group relative min-h-[17rem] overflow-hidden rounded-[2rem] bg-secondary", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="h-full min-h-[17rem] w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.3)_52%,rgba(15,23,42,0.72)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 space-y-4 p-5 text-white">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">{eyebrow}</p>
          <p className="max-w-sm text-2xl font-semibold leading-tight">{title}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[1.1rem] bg-white/16 px-3 py-3 backdrop-blur-md">
              <p className="text-xs text-white/68">{metric.label}</p>
              <p className="mt-1 text-lg font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
