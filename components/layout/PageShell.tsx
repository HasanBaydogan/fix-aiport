import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import type { AppRole } from "@/lib/supabase/database.types";

const widthClass = {
  md: "max-w-md",
  "3xl": "max-w-3xl",
  "6xl": "max-w-6xl",
} as const;

export function PageShell({
  children,
  userEmail,
  role,
  width = "6xl",
  className = "",
}: {
  children: React.ReactNode;
  userEmail?: string | null;
  role?: AppRole | null;
  width?: keyof typeof widthClass;
  className?: string;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader userEmail={userEmail} role={role} />
      <main
        className={`mx-auto w-full ${widthClass[width]} flex-1 px-4 py-8 sm:px-6 sm:py-10 ${className}`}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
