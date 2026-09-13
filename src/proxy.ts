import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
// Accessible while logged out, but — unlike PUBLIC_PATHS — never bounces an
// already-logged-in user away (e.g. clicking an old verification link after
// signing in elsewhere should just show the result, not redirect).
const ALWAYS_ACCESSIBLE_PATHS = ["/verify-email", "/verify-email-change", "/terms", "/acceptable-use", "/privacy", "/contact"];

export default auth((req) => {
  const { pathname, origin } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAlwaysAccessible = isPublic || ALWAYS_ACCESSIBLE_PATHS.some((p) => pathname.startsWith(p));
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn && !isAlwaysAccessible && pathname !== "/") {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"],
};
