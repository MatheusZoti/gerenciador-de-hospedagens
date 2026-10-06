import { cookies } from "next/headers";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SIDEBAR_COOKIE } from "@/components/layout/sidebar-state";
import { requireAppSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, organization } = await requireAppSession();
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";
  const menuUser = {
    name: user.name,
    email: user.email,
    image: user.image,
    jobTitle: user.jobTitle,
  };

  return (
    <div className="flex min-h-svh">
      <AppSidebar
        user={menuUser}
        organizationName={organization.name}
        defaultCollapsed={collapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav user={menuUser} organizationName={organization.name} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
