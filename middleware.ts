import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ✅ Allow the login endpoint through (it sets the cookie)
  if (path === "/api/admin/login") {
    return NextResponse.next();
  }

  // Protect admin pages + admin APIs
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    const cookie = req.cookies.get("pb_admin")?.value;

    // Allow viewing the /admin page so you can log in
    if (path === "/admin") return NextResponse.next();

    // If logged in, allow everything
    if (cookie === "1") return NextResponse.next();

    // Otherwise, bounce them to /admin (GET)
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
