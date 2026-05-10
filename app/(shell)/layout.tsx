import { redirect } from "next/navigation";

import { BottomTabNav } from "@/components/navigation/bottom-tab-nav";
import { InstallPromptBanner } from "@/components/pwa/install-prompt-banner";
import { getDbUserForAuthUser } from "@/lib/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentAuthUser } from "@/lib/supabase/server";

export default async function ShellLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isSupabaseConfigured()) {
    const authUser = await getCurrentAuthUser();

    if (!authUser) {
      redirect("/login");
    }

    const dbUser = await getDbUserForAuthUser(authUser.id);

    if (!dbUser) {
      redirect("/onboarding");
    }
  }

  return (
    <>
      <InstallPromptBanner />
      <div className="mx-auto min-h-screen w-full max-w-[1280px]">{children}</div>
      <BottomTabNav />
    </>
  );
}
