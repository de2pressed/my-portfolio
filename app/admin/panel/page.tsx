import { redirect } from "next/navigation";

import { AdminPanel } from "@/components/admin/AdminPanel";
import { getAdminSession } from "@/lib/admin-session";
import { getAnalyticsSummary, getPortfolioData } from "@/lib/content-repository";

export const dynamic = "force-dynamic";

export default async function AdminPanelPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const [data, summary] = await Promise.all([getPortfolioData(), getAnalyticsSummary()]);

  return <AdminPanel adminEmail={session.email} data={data} summary={summary} />;
}
