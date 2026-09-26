/** Protects authenticated routes and redirects by role using NAV_ACCESS. */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { canAccessPath } from "@/constants/roles";
import type { AppRole } from "@/constants/roles";

export default withAuth(
  function middleware(request) {
    const role = request.nextauth.token?.role as AppRole | undefined;
    const pathname = request.nextUrl.pathname;

    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!canAccessPath(role, pathname)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
