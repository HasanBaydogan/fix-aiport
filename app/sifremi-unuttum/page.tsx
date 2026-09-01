import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Şifremi unuttum" };

export default function SifremiUnuttumPage() {
  return (
    <PageShell width="6xl" className="!py-0">
      <AuthSplitLayout
        title="Şifremi unuttum"
        subtitle="E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz."
        footer={
          <p className="text-center text-sm text-slate-600">
            <Link href="/giris" className="font-semibold text-brand-600 hover:underline">
              Giriş sayfasına dön
            </Link>
          </p>
        }
      >
        <ForgotPasswordForm />
      </AuthSplitLayout>
    </PageShell>
  );
}
