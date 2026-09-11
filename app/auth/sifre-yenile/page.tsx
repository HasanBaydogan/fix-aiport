import Link from "next/link";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { PageShell } from "@/components/layout/PageShell";
import { getSessionUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Şifre belirle" };

export default async function SifreYenilePage({
  searchParams,
}: {
  searchParams: Promise<{ davet?: string }>;
}) {
  const session = await getSessionUser();
  const params = await searchParams;
  const isInvite = params.davet === "1";

  if (!session) {
    return (
      <PageShell width="6xl" className="!py-0">
        <AuthSplitLayout
          title="Oturum gerekli"
          subtitle={
            isInvite
              ? "Davet bağlantısı geçersiz veya süresi dolmuş olabilir. Admin’den yeni davet isteyin."
              : "Şifre yenileme bağlantısını e-postanızdan tekrar açın."
          }
          footer={
            <p className="text-center text-sm text-slate-600">
              <Link href="/giris" className="font-semibold text-brand-600 hover:underline">
                Giriş sayfasına dön
              </Link>
            </p>
          }
        >
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Bu sayfa yalnızca e-postadaki bağlantı ile oturum açıldıktan sonra çalışır.
          </p>
        </AuthSplitLayout>
      </PageShell>
    );
  }

  return (
    <PageShell width="6xl" className="!py-0">
      <AuthSplitLayout
        title={isInvite ? "Şifrenizi belirleyin" : "Yeni şifre belirle"}
        subtitle={
          isInvite
            ? "Tedarikçi hesabınızı etkinleştirmek için bir şifre oluşturun."
            : "Hesabınız için yeni bir şifre girin."
        }
        footer={
          <p className="text-center text-sm text-slate-600">
            <Link href="/giris" className="font-semibold text-brand-600 hover:underline">
              Giriş sayfasına dön
            </Link>
          </p>
        }
      >
        <ResetPasswordForm
          successRedirect={
            session.role === "supplier" ? "/panel/tedarikci" : "/panel"
          }
          submitLabel={isInvite ? "Şifreyi kaydet ve devam et" : "Şifreyi güncelle"}
        />
      </AuthSplitLayout>
    </PageShell>
  );
}
