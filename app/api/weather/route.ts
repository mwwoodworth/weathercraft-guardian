import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.OPENWEATHERMAP_API_KEY;

type OWMForecastItem = {
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  pop?: number;
  dt: number;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const type = searchParams.get("type") || "current"; // "current" or "forecast"

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Missing lat or lon parameters" },
      { status: 400 }
    );
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: "Weather API not configured" },
      { status: 500 }
    );
  }

  try {
    if (type === "current") {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`,
        { next: { revalidate: 300 } } // Cache for 5 minutes
      );

      if (!res.ok) {
        throw new Error(`Weather API error: ${res.status}`);
      }

      const data = await res.json();

      return NextResponse.json({
        temp: data.main.temp,
        feels_like: data.main.feels_like,
        temp_min: data.main.temp_min,
        temp_max: data.main.temp_max,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        wind_deg: data.wind.deg,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        pop: 0,
        dt: data.dt,
      });
    } else {
      // Forecast
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`,
        { next: { revalidate: 1800 } } // Cache for 30 minutes
      );

      if (!res.ok) {
        throw new Error(`Weather API error: ${res.status}`);
      }

      const data = await res.json();

      const forecast = data.list.map((item: OWMForecastItem) => ({
        temp: item.main.temp,
        feels_like: item.main.feels_like,
        temp_min: item.main.temp_min,
        temp_max: item.main.temp_max,
        humidity: item.main.humidity,
        wind_speed: item.wind.speed,
        wind_deg: item.wind.deg,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        pop: item.pop || 0,
        dt: item.dt,
      }));

      return NextResponse.json(forecast);
    }
  } catch (error) {
    console.error("Weather fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
