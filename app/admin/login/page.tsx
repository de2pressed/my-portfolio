import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin/panel");
  }

  return <AdminLoginForm />;
}
