"use client";

import { useState } from "react";
import Link from "next/link";
import { LoaderCircle, MailCheck, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function LoginForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      toast({
        title: "尚未配置 Supabase",
        description: "请先配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY。",
        variant: "error"
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/confirm?next=/`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (error) {
        throw error;
      }

      setSubmitted(true);
      toast({
        title: "登录邮件已发送",
        description: "请检查邮箱中的魔法链接，点击后即可完成登录。",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "请稍后再试。",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 safe-px py-10">
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">CARBCYCLE TRACKER</p>
          <div className="space-y-3">
            <h1 className="text-balance text-4xl font-semibold leading-tight md:text-5xl">
              登录后，才能把你的记录真正保存下来。
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              当前阶段先使用邮箱 Magic Link 登录。后续可以继续扩展手机号、微信登录等方式。
            </p>
          </div>
          <div className="space-y-3 rounded-[2rem] bg-white/72 p-5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">认证基础设施已接入</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  本项目已使用 Supabase Auth 作为正式用户体系基础。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-white/80 dark:bg-white/5 dark:ring-white/5 md:p-7">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">登录</p>
              <h2 className="text-2xl font-semibold">使用邮箱接收登录链接</h2>
            </div>

            {submitted ? (
              <div className="rounded-[1.5rem] bg-primary/10 px-4 py-5 text-primary">
                <div className="flex items-start gap-3">
                  <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">邮件已发送</p>
                    <p className="mt-1 text-sm">
                      请前往 <span className="font-semibold">{email}</span> 查收登录邮件，点击链接后会自动回到应用。
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="请输入邮箱地址"
                className="h-12 rounded-[1.3rem]"
                required
              />
              <Button className="h-12 w-full rounded-[1.3rem]" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    发送中…
                  </>
                ) : (
                  "发送登录链接"
                )}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground">
              没有配置 Supabase 时，应用仍会以本地体验模式运行。
            </p>

            <Link href="/" className="inline-flex text-sm font-medium text-primary">
              返回首页
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
