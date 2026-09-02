import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Purchase } from "@/lib/supabase/database.types";
import { ensurePdfFont, pdfFileName } from "@/lib/pdf/font";
import { formatMoney, purchaseLineTotal } from "@/lib/purchases";

export async function exportPurchasesPdf(
  purchases: Purchase[],
  options?: { siteLabel?: string | null; title?: string },
): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await ensurePdfFont(doc);

  const title = options?.title ?? "Satın Alımlarım";
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Oluşturulma: ${new Date().toLocaleString("tr-TR")}`, 14, 22);
  if (options?.siteLabel) {
    doc.text(`Şantiye: ${options.siteLabel}`, 14, 27);
  }

  let totalSpend = 0;

  const body = purchases.map((row) => {
    const total = purchaseLineTotal(
      row.unit_price != null ? Number(row.unit_price) : null,
      Number(row.qty),
    );
    if (total != null) totalSpend += total;

    return [
      row.purchased_at.slice(0, 10),
      row.sites?.name ?? "—",
      row.product_name,
      `${row.qty} ${row.unit}`,
      row.unit_price != null ? formatMoney(Number(row.unit_price), row.currency) : "—",
      total != null ? formatMoney(total, row.currency) : "—",
      row.supplier_ref ?? "—",
    ];
  });

  autoTable(doc, {
    startY: options?.siteLabel ? 32 : 28,
    head: [["Tarih", "Şantiye", "Ürün", "Miktar", "Birim fiyat", "Toplam", "Tedarikçi"]],
    body,
    styles: { font: "Roboto", fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 95], font: "Roboto" },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Toplam harcama: ${formatMoney(totalSpend)}`, 14, finalY + 8);

  doc.save(pdfFileName("satin-alimlar", options?.siteLabel));
}
