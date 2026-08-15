import { NextRequest, NextResponse } from "next/server";
import {
  addCheckin,
  getCheckinStats,
  markBoarded,
} from "@/lib/airport/checkin-store";
import type { Terminal } from "@/lib/airport/types";

export async function GET(req: NextRequest) {
  const terminal = req.nextUrl.searchParams.get("terminal") as Terminal | null;
  const stats = getCheckinStats(terminal ?? undefined);
  return NextResponse.json(stats);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { driverName, terminal } = body as {
    driverName?: string;
    terminal?: Terminal;
  };

  if (!driverName || !terminal || !["T1", "T2"].includes(terminal)) {
    return NextResponse.json({ error: "driverName, terminal 필수" }, { status: 400 });
  }

  const record = addCheckin(driverName.trim(), terminal);
  return NextResponse.json(record, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id } = body as { id?: string };

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  const record = markBoarded(id);
  if (!record) {
    return NextResponse.json({ error: "기록 없음" }, { status: 404 });
  }
  return NextResponse.json(record);
}
