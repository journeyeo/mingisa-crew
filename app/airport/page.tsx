import { AirportDashboard } from "./_dashboard";
import type { Terminal } from "@/lib/airport/types";

interface PageProps {
  searchParams: Promise<{ terminal?: string }>;
}

export default async function AirportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const terminal: Terminal = params.terminal === "T2" ? "T2" : params.terminal === "GMP" ? "GMP" : "T1";
  return <AirportDashboard terminal={terminal} />;
}
