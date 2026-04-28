export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-[2rem] bg-white/80 px-8 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">离线模式</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">当前网络不可用</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          你仍然可以查看已经缓存的食物库与最近页面。网络恢复后，数据会继续同步。
        </p>
      </div>
    </main>
  );
}
