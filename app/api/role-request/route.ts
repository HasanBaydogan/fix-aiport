import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/roles";

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  const origin = request.nextUrl.origin;

  if (!session) {
    return NextResponse.redirect(`${origin}/giris`);
  }

  await session.supabase.from("role_requests").insert({
    user_id: session.user.id,
    requested_role: "supplier",
    status: "pending",
  });

  return NextResponse.redirect(`${origin}/panel`);
}
