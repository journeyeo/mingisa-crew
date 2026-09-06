export const preferredRegion = ["icn1"];

export type { GimpoFlight, GimpoFlightsData } from "@/lib/airport/gimpo-data";
import { getCachedGimpoFlights } from "@/lib/airport/gimpo-data";

export async function GET() {
  if (!process.env.AIRPORT_API_SERVICE_KEY) {
    return Response.json({ error: "no key" }, { status: 500 });
  }
  const data = await getCachedGimpoFlights();
  return Response.json(data);
}
