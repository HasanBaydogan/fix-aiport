import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fix.aiport.tr"),
  title: "FiX Ai | Destek Formu",
  description:
    "FiX Ai destek ve talep formu. Bilgilerinizi doldurun, eklerinizi ekleyin; mesajınız doğrudan ilgili ekibe iletilir.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "FiX Ai | Destek Formu",
    description:
      "FiX Ai destek ve talep formu. Mesajınız seçilen e-posta adresine iletilir.",
    url: "https://fix.aiport.tr",
    siteName: "FiX Ai",
    images: [{ url: "/logo.png" }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
