import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { NavSidebar } from "@/components/nav-sidebar";
import { DemoBanner } from "@/components/demo-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isDemoUser = user.email === process.env.DEMO_USER_EMAIL;

  return (
    <div className="dashboard-layout flex min-h-screen">
      <NavSidebar userEmail={user.email} />
      <main className="dashboard-main flex-1 min-w-0 p-6 overflow-hidden">
        {isDemoUser && (
          <div className="mb-6">
            <DemoBanner />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
