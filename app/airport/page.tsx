import { Suspense } from "react";
import { AirportDashboard } from "./_dashboard";
import Loading from "./loading";
import type { Terminal } from "@/lib/airport/types";

interface PageProps {
  searchParams: Promise<{ terminal?: string }>;
}

export default async function AirportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const terminal: Terminal = params.terminal === "T2" ? "T2" : "T1";

  return (
    <Suspense fallback={<Loading />}>
      <AirportDashboard terminal={terminal} />
    </Suspense>
  );
}
