import { NextRequest } from "next/server";

export const preferredRegion = ["icn1"];

import { getCachedSummary } from "@/lib/airport/cached-data";
import type { Terminal } from "@/lib/airport/types";

export async function GET(req: NextRequest) {
  const terminal = (req.nextUrl.searchParams.get("terminal") === "T2" ? "T2" : "T1") as Terminal;

  const now = new Date();
  const toKST = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d).replace(/-/g, "");
  const todayStr = toKST(now);
  const tomorrowStr = toKST(new Date(now.getTime() + 86_400_000));

  const data = await getCachedSummary(terminal, todayStr, tomorrowStr);
  return Response.json(data);
}
