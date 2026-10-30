import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// First line of defence for /admin. Pages and server actions also call requireAdmin().
export async function proxy(request: NextRequest) {
  const loggedIn = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (isLoginPage && loggedIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (!isLoginPage && !loggedIn) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
