import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/components/providers/auth-provider";
import { ClientErrorListener } from "@/components/providers/client-error-listener";
import { ThemeSync } from "@/components/providers/theme-sync";
import { Toaster } from "@/components/ui/toaster";
import { getCurrentAuthUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

import "./globals.css";

export const metadata: Metadata = {
  title: "CarbCycle Tracker",
  description: "碳循环饮食、训练与体重趋势记录工具",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CarbCycle Tracker"
  },
  icons: {
    icon: [
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [{ url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getCurrentAuthUser();
  const authConfigured = isSupabaseConfigured();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider initialUser={initialUser} isConfigured={authConfigured}>
          <ClientErrorListener />
          <ThemeSync />
          <Toaster />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
