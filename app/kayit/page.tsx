import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Kayıt" };

export default function KayitPage() {
  return (
    <PageShell width="6xl" className="!py-0">
      <AuthSplitLayout
        title="Kayıt ol"
        subtitle="Varsayılan rol alıcıdır. Tedarikçi olmak için panelden başvuru yapabilirsiniz."
        footer={
          <p className="text-center text-sm text-slate-600">
            Zaten hesabınız var mı?{" "}
            <Link href="/giris" className="font-semibold text-brand-600 hover:underline">
              Giriş yap
            </Link>
          </p>
        }
      >
        <AuthForm mode="signup" />
      </AuthSplitLayout>
    </PageShell>
  );
}
