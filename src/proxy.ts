import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (pathname.startsWith("/dashboard") && !session?.user) {
    const target = new URL("/login", req.url);
    target.searchParams.set("next", pathname);
    return NextResponse.redirect(target);
  }
  return NextResponse.next();
});

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
