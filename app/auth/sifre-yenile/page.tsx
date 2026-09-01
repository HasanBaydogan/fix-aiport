import Link from "next/link";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Şifre yenile" };

export default function SifreYenilePage() {
  return (
    <PageShell width="6xl" className="!py-0">
      <AuthSplitLayout
        title="Yeni şifre belirle"
        subtitle="Hesabınız için yeni bir şifre girin."
        footer={
          <p className="text-center text-sm text-slate-600">
            <Link href="/giris" className="font-semibold text-brand-600 hover:underline">
              Giriş sayfasına dön
            </Link>
          </p>
        }
      >
        <ResetPasswordForm />
      </AuthSplitLayout>
    </PageShell>
  );
}
