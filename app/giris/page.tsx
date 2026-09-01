import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Giriş" };

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <PageShell width="6xl" className="!py-0">
      <AuthSplitLayout
        title="Giriş yap"
        subtitle="Fiyat, değerlendirme ve şantiye paneline erişmek için giriş yapın."
        footer={
          <p className="text-center text-sm text-slate-600">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="font-semibold text-brand-600 hover:underline">
              Kayıt ol
            </Link>
          </p>
        }
      >
        {params.error === "auth" ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Giriş bağlantısı geçersiz veya süresi dolmuş. Lütfen tekrar deneyin.
          </p>
        ) : null}
        <AuthForm mode="login" nextPath={params.next} />
      </AuthSplitLayout>
    </PageShell>
  );
}
