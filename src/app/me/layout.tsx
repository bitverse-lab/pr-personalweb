import { redirect } from "next/navigation";
import { auth, signOut } from "@/server/auth";
import MeSidebar from "@/components/layout/MeSidebar";
import { ToastProvider } from "@/components/shared/ToastProvider";
import ToastStack from "@/components/shared/ToastStack";
import TimezoneCookie from "@/components/shared/TimezoneCookie";
import CommandPalette from "@/components/me/CommandPalette";
import ActionErrorWatcher from "@/components/me/ActionErrorWatcher";
import { getUnreadMessageCount } from "@/features/contact/actions";

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const unreadMessages = await getUnreadMessageCount().catch(() => 0);

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <ToastProvider>
      <a href="#me-main" className="visually-hidden-focusable position-fixed top-0 start-0 m-2 p-2 bg-white text-dark rounded shadow" style={{ zIndex: 2000 }}>
        Skip to main content
      </a>
      <div className="me-shell">
        <MeSidebar user={session.user ?? {}} signOutAction={signOutAction} unreadMessages={unreadMessages} />
        <main id="me-main" tabIndex={-1} className="me-main">
          {children}
        </main>
      </div>
      <ToastStack />
      <ActionErrorWatcher />
      <TimezoneCookie />
      <CommandPalette />
    </ToastProvider>
  );
}
