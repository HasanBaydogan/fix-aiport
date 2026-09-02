import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { PurchaseListItem, PurchaseListItemOffer } from "@/lib/supabase/database.types";
import { ensurePdfFont, pdfFileName } from "@/lib/pdf/font";
import { formatMoney } from "@/lib/purchases";

function offerLabel(offer: PurchaseListItemOffer): string {
  const supplier = offer.supplier_profiles?.org_name;
  const place = offer.place_name?.trim();
  if (supplier && place) return `${supplier} (${place})`;
  return supplier ?? place ?? "—";
}

function lowestOfferPrice(offers: PurchaseListItemOffer[] | undefined): string {
  if (!offers?.length) return "—";
  const priced = offers.filter((o) => o.unit_price != null);
  if (!priced.length) return "—";
  const min = priced.reduce((a, b) =>
    Number(a.unit_price!) <= Number(b.unit_price!) ? a : b,
  );
  return formatMoney(Number(min.unit_price), min.currency);
}

export async function exportPurchaseListPdf(
  items: PurchaseListItem[],
  options?: { siteLabel?: string | null; title?: string },
): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await ensurePdfFont(doc);

  const title = options?.title ?? "Satın Alınacaklar";
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Oluşturulma: ${new Date().toLocaleString("tr-TR")}`, 14, 22);
  if (options?.siteLabel) {
    doc.text(`Şantiye: ${options.siteLabel}`, 14, 27);
  }

  const body = items.map((item) => {
    const offers = item.purchase_list_item_offers ?? [];
    const offerSummary =
      offers.length > 0
        ? offers
            .map((o) => {
              const price =
                o.unit_price != null
                  ? formatMoney(Number(o.unit_price), o.currency)
                  : "—";
              return `${offerLabel(o)}: ${price}`;
            })
            .join("; ")
        : "—";

    return [
      item.product_name,
      item.sites?.name ?? "—",
      `${item.qty} ${item.unit}`,
      String(item.priority),
      item.notes ?? "—",
      lowestOfferPrice(offers),
      offerSummary,
    ];
  });

  autoTable(doc, {
    startY: options?.siteLabel ? 32 : 28,
    head: [
      ["Ürün", "Şantiye", "Miktar", "Öncelik", "Not", "En düşük fiyat", "Teklifler"],
    ],
    body,
    styles: { font: "Roboto", fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 95], font: "Roboto" },
    columnStyles: {
      6: { cellWidth: 60 },
    },
  });

  doc.save(pdfFileName("satin-alinacaklar", options?.siteLabel));
}
