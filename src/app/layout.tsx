/** Root layout: fonts, theme, session, authenticated app shell. */
import type { Metadata } from "next";
import localFont from "next/font/local";
import { getServerSession } from "next-auth";
import { Toaster } from "sonner";
import { getInstituteSettings } from "@/app/settings/actions";
import { getNotifications } from "@/app/notifications/actions";
import { getTasksDueTodayCount } from "@/app/tasks/actions";
import { AppShell } from "@/components/layout/AppShell";
import { AppSessionProvider } from "@/components/providers/AppSessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { authOptions } from "@/lib/auth";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CRM",
  description: "CRM application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [profile, session] = await Promise.all([
    getInstituteSettings(),
    getServerSession(authOptions),
  ]);

  const [taskDueCount, notifications] = session?.user
    ? await Promise.all([getTasksDueTodayCount(), getNotifications()])
    : [0, []];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("crm-theme")==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans bg-background text-foreground antialiased`}>
        <ThemeProvider>
          <AppSessionProvider session={session}>
            {session?.user ? (
              <AppShell
                instituteName={profile.instituteName}
                logoDataUrl={profile.logoDataUrl}
                user={session.user}
                taskDueCount={taskDueCount}
                notifications={notifications}
              >
                {children}
              </AppShell>
            ) : (
              children
            )}
            <Toaster richColors position="top-right" duration={3000} />
          </AppSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
