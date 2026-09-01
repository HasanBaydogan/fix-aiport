import { badgeClass } from "@/lib/ui/classes";
import type { ContentStatus } from "@/lib/supabase/database.types";

const labels: Record<string, string> = {
  published: "Yayında",
  pending: "Onay bekliyor",
  rejected: "Reddedildi",
  draft: "Taslak",
  archived: "Arşiv",
};

export function Badge({ status }: { status: ContentStatus | string }) {
  return (
    <span className={badgeClass(status)}>{labels[status] ?? status}</span>
  );
}
