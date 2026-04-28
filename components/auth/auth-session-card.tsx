"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";

export function AuthSessionCard() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const isConfigured = useAuthStore((state) => state.isConfigured);
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      toast({
        title: "已退出登录",
        description: "当前会话已经结束。",
        variant: "success"
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "退出失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isConfigured) {
    return (
      <section className="rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
        <h2 className="text-lg font-semibold">登录状态</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          当前未配置 Supabase Auth，应用仍在本地体验模式下运行。
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
      <h2 className="text-lg font-semibold">登录状态</h2>
      {user ? (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-[1.4rem] bg-secondary px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm">
              <UserRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{user.email}</p>
              <p className="text-sm text-muted-foreground">已登录，可进入正式数据模式</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => void handleLogout()} disabled={loading}>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-[1.4rem] bg-secondary px-4 py-4">
          <p className="font-semibold">尚未登录</p>
          <p className="mt-1 text-sm text-muted-foreground">
            现在仍然可以体验页面，但记录不会与正式账号绑定。
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            去登录
          </Link>
        </div>
      )}
    </section>
  );
}
