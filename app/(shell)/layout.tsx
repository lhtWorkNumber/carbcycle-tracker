import { BottomTabNav } from "@/components/navigation/bottom-tab-nav";
import { InstallPromptBanner } from "@/components/pwa/install-prompt-banner";

export default function ShellLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <InstallPromptBanner />
      <div className="mx-auto min-h-screen w-full max-w-[1280px]">{children}</div>
      <BottomTabNav />
    </>
  );
}
