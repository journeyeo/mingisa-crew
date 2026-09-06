import { NextRequest, NextResponse } from "next/server";

const CAPACITOR_UA = "MinGisaCrewApp";

// 리다이렉트 제외 경로
const BYPASS = ["/", "/privacy", "/api/"];

export function proxy(req: NextRequest) {
  if (process.env.APP_LAUNCH_MODE !== "true") return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/" || pathname === "/privacy" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ua = req.headers.get("user-agent") ?? "";
  if (ua.includes(CAPACITOR_UA)) return NextResponse.next();

  return NextResponse.redirect(new URL("/", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.ico$).*)"],
};
