import { NextRequest } from "next/server";

import { getCachedFlights } from "@/lib/airport/cached-data";
import type { Terminal } from "@/lib/airport/types";

export async function GET(req: NextRequest) {
  const terminal = (req.nextUrl.searchParams.get("terminal") === "T2" ? "T2" : "T1") as Terminal;

  const now = new Date();
  const toKST = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d).replace(/-/g, "");
  const todayStr = toKST(now);
  const tomorrowStr = toKST(new Date(now.getTime() + 86_400_000));

  const data = await getCachedFlights(terminal, todayStr, tomorrowStr);
  return Response.json(data);
}
