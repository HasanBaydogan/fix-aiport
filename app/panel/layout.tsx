import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PanelNav, SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { getSessionUser, roleLabel } from "@/lib/auth/roles";
import { cardClass } from "@/lib/forms/types";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) {
    const headersList = await headers();
    const pathname =
      headersList.get("x-pathname") ??
      headersList.get("x-invoke-path") ??
      "/panel";
    redirect(`/giris?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader userEmail={session.user.email} role={session.role} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              FiX Ai · Panel
            </p>
            <h1 className="text-xl font-semibold text-brand-900">
              Hoş geldiniz, {roleLabel(session.role)}
            </h1>
            <p className="text-sm text-slate-500">{session.user.email}</p>
          </div>
          <SignOutButton />
        </div>
        <PanelNav role={session.role} />
        <div className={cardClass}>{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
