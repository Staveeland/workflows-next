export const revalidate = 1800;

const MET_URL =
  "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.4138&lon=5.2679";

const RETNINGER = [
  "nord",
  "nordøst",
  "øst",
  "sørøst",
  "sør",
  "sørvest",
  "vest",
  "nordvest",
] as const;

function kompass(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  return RETNINGER[Math.round(normalized / 45) % 8];
}

export async function GET() {
  try {
    const res = await fetch(MET_URL, {
      headers: { "User-Agent": "workflows.no/1.0 petter@workflows.no" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return new Response(null, { status: 204 });

    const data = await res.json();
    const details = data?.properties?.timeseries?.[0]?.data?.instant?.details;
    const speed = details?.wind_speed;
    const direction = details?.wind_from_direction;
    if (typeof speed !== "number" || typeof direction !== "number") {
      return new Response(null, { status: 204 });
    }

    return Response.json({
      text: `${Math.round(speed)} m/s fra ${kompass(direction)}`,
      speed,
      direction,
    });
  } catch {
    // Easter-egg data only — fail 100% silent.
    return new Response(null, { status: 204 });
  }
}
