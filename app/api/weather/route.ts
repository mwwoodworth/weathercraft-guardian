import { NextRequest } from "next/server";
import { getCurrentWeatherServer, getForecastServer } from "@/lib/weather-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const type = searchParams.get("type") ?? "current";

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    if (type === "forecast") {
      const data = await getForecastServer(lat, lon);
      return Response.json(data, {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300"
        }
      });
    }

    if (type === "current") {
      const data = await getCurrentWeatherServer(lat, lon);
      return Response.json(data, {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=120, s-maxage=120"
        }
      });
    }

    return Response.json({ error: "Unsupported type" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Weather API error";
    return Response.json({ error: message }, { status: 500 });
  }
}
