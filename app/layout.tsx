import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fix.aiport.tr"),
  title: {
    default: "FiX Ai | Şantiye & Malzeme Platformu",
    template: "%s | FiX Ai",
  },
  description:
    "Şantiye, stok, satın alma ve inşaat malzemesi tedarik haritası. Tamirat taleplerinizi de kolayca iletin.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "FiX Ai | Şantiye & Malzeme Platformu",
    description:
      "Şantiye yönetimi, ürün kataloğu ve tedarikçi haritası.",
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
