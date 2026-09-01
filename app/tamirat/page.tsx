import type { Metadata } from "next";
import RepairRequestForm from "@/components/forms/RepairRequestForm";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSessionUser } from "@/lib/auth/roles";
import { cardClass } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "Tamirat Talep Formu",
  description: "Login olmadan tamirat talebi gönderin.",
};

const trustItems = [
  { title: "Giriş gerekmez", body: "Hesap açmadan talep gönderebilirsiniz." },
  { title: "Fotoğraf eklenebilir", body: "Hasar görselleri ve belgeler yüklenebilir." },
  { title: "KVKK uyumlu", body: "Verileriniz yalnızca talep sürecinde kullanılır." },
];

const steps = [
  "Formu doldurun ve fotoğraf ekleyin",
  "Ekibimiz talebinizi inceler",
  "Size telefon veya e-posta ile dönüş yapılır",
];

export default async function TamiratPage() {
  const session = await getSessionUser();

  return (
    <PageShell userEmail={session?.user.email} role={session?.role} width="6xl" className="space-y-8">
      <PageHeader
        eyebrow="FiX Ai · Tamirat"
        title="Tamirat talep formu"
        description="Giriş yapmadan talep gönderebilirsiniz. Fotoğraf ve belgeler ekleyin; ekibimiz sizinle iletişime geçecektir."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <RepairRequestForm />

        <aside className="space-y-4">
          <div className={cardClass}>
            <h2 className="font-semibold text-brand-900">Nasıl işler?</h2>
            <ol className="mt-4 space-y-3">
              {steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-slate-500">
              Ortalama yanıt süresi: 1–2 iş günü
            </p>
          </div>

          <div className="space-y-3">
            {trustItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-brand-100 bg-brand-50/40 px-4 py-3"
              >
                <p className="text-sm font-semibold text-brand-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
