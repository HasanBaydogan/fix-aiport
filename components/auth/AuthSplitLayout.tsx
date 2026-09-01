import Image from "next/image";
import Link from "next/link";
import { cardClass } from "@/lib/ui/classes";

export function AuthSplitLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const bullets = [
    "Şantiye stok ve satın alma takibi",
    "Global ürün kataloğuna katkı",
    "Tedarikçi haritasında görünürlük",
  ];

  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
      <div className="hidden lg:block">
        <Image
          src="/logo.png"
          alt="FiX Ai"
          width={969}
          height={445}
          className="h-12 w-auto"
        />
        <h1 className="mt-8 text-3xl font-semibold text-brand-900">
          Şantiye, malzeme ve tedarik
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          FiX Ai ile ürünleri keşfedin, tedarikçileri haritada bulun ve şantiye
          operasyonlarınızı tek panelden yönetin.
        </p>
        <ul className="mt-6 space-y-3">
          {bullets.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className={`${cardClass} !p-6 sm:!p-8`}>
          <h2 className="text-2xl font-semibold text-brand-900">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
