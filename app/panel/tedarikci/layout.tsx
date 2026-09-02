import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/roles";
import { SupplierSubNav } from "@/components/panel/SupplierSubNav";

export default async function TedarikciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/giris?next=/panel/tedarikci");
  if (session.role !== "supplier" && session.role !== "admin") {
    redirect("/panel");
  }

  return (
    <div className="space-y-6">
      <SupplierSubNav />
      {children}
    </div>
  );
}
