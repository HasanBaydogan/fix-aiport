import Image from "next/image";
import ContactForm from "@/components/ContactForm";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="px-4 pt-8 sm:px-6 sm:pt-12">
        <div className="mx-auto flex w-full max-w-3xl justify-center">
          <Image
            src="/logo.png"
            alt="FiX Ai, Coded By AiPORT"
            width={969}
            height={445}
            priority
            className="h-auto w-[220px] sm:w-[300px]"
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">
            Tamirat Talep Formu
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Tamirat taleplerinizi fotoğraf ve videolar ile gönderebilirsiniz. Ekibimiz
            teklifinizi iletmek üzere sizinle iletişime geçecektir.
          </p>
        </div>
        <ContactForm />
      </main>

      <footer className="px-4 pb-8 text-center text-sm text-slate-500 sm:px-6">
        <p>
          Coded By <span className="font-semibold text-brand-700">AiPORT</span>
        </p>
      </footer>
    </div>
  );
}
