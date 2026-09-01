/** Safe internal redirect path — blocks open redirects. */
export function safeRedirectPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/panel";
  return next;
}
