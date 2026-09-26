import { NextRequest, NextResponse } from "next/server";

const CAPACITOR_UA = "MinGisaCrewApp";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/") || pathname === "/downloads" || pathname === "/privacy") {
    return NextResponse.next();
  }

  const ua = req.headers.get("user-agent") ?? "";
  const isApp = ua.includes(CAPACITOR_UA);

  if (process.env.APP_LAUNCH_MODE === "true" && !isApp) {
    return NextResponse.redirect(new URL("/downloads", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.ico$).*)"],
};
