import type { WeatherConditions } from "./assemblies";

export type WeatherData = {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  description: string;
  icon: string;
  pop: number; // Probability of precipitation (0-1)
  dt: number;
  sunrise?: number;
  sunset?: number;
  timezone?: string;
};

export type DailyForecast = {
  date: Date;
  dayName: string;
  high: number;
  low: number;
  avgTemp: number;
  maxWind: number;
  avgHumidity: number;
  precipProbability: number;
  conditions: string;
  icon: string;
  hourlyData: WeatherData[];
};

export function resolveWeatherIcon(icon: string): string {
  if (icon.startsWith("http")) return icon;
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

// Fetch current weather via server API route
export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(
    `/api/weather?lat=${lat}&lon=${lon}&type=current`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch weather");
  return res.json();
}

// Fetch forecast via server API route
export async function getForecast(lat: number, lon: number): Promise<WeatherData[]> {
  const res = await fetch(
    `/api/weather?lat=${lat}&lon=${lon}&type=forecast`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch forecast");
  return res.json();
}

// Group forecast data by day for calendar view
export function groupForecastByDay(forecast: WeatherData[]): DailyForecast[] {
  const dayMap = new Map<string, WeatherData[]>();
  const timeZone = forecast.find(entry => entry.timezone)?.timezone ?? "UTC";

  const toDayKey = (entry: WeatherData) => {
    const date = new Date(entry.dt * 1000);
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
  };
  const toLocalHour = (entry: WeatherData) => {
    const date = new Date(entry.dt * 1000);
    const hour = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(date);
    return Number(hour);
  };

  for (const entry of forecast) {
    const dayKey = toDayKey(entry);

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, []);
    }
    dayMap.get(dayKey)!.push(entry);
  }

  const dailyForecasts: DailyForecast[] = [];

  for (const [, hourlyData] of dayMap) {
    const representativeDate = new Date(hourlyData[0].dt * 1000);
    const temps = hourlyData.map(h => h.temp);
    const winds = hourlyData.map(h => h.wind_speed);
    const humidities = hourlyData.map(h => h.humidity);
    const pops = hourlyData.map(h => h.pop);

    // Find most common condition for the day
    const conditionCounts = new Map<string, number>();
    for (const h of hourlyData) {
      conditionCounts.set(h.description, (conditionCounts.get(h.description) || 0) + 1);
    }
    const mostCommonCondition = [...conditionCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0][0];

    // Get midday icon
    const middayEntry = hourlyData.find(h => {
      const hour = toLocalHour(h);
      return hour >= 10 && hour <= 14;
    }) || hourlyData[0];

    dailyForecasts.push({
      date: representativeDate,
      dayName: new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(representativeDate),
      high: Math.max(...temps),
      low: Math.min(...temps),
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      maxWind: Math.max(...winds),
      avgHumidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
      precipProbability: Math.round(Math.max(...pops) * 100),
      conditions: mostCommonCondition,
      icon: middayEntry.icon,
      hourlyData
    });
  }

  return dailyForecasts.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Convert WeatherData to WeatherConditions for compliance checking
export function toWeatherConditions(
  current: WeatherData,
  forecast: WeatherData[]
): WeatherConditions {
  // Determine temperature trend by looking at next 3 hours
  const nextHours = forecast.slice(0, 2);
  let tempTrend: "rising" | "falling" | "stable" = "stable";

  if (nextHours.length > 0) {
    const avgFutureTemp = nextHours.reduce((sum, h) => sum + h.temp, 0) / nextHours.length;
    const diff = avgFutureTemp - current.temp;
    if (diff > 2) tempTrend = "rising";
    else if (diff < -2) tempTrend = "falling";
  }

  const isPrecip = current.description.toLowerCase().includes("rain") ||
    current.description.toLowerCase().includes("snow") ||
    current.description.toLowerCase().includes("drizzle") ||
    current.description.toLowerCase().includes("sleet");

  return {
    temp: current.temp,
    tempTrend,
    windSpeed: current.wind_speed,
    humidity: current.humidity,
    isPrecipitating: isPrecip,
    precipProbability: Math.round((forecast[0]?.pop || 0) * 100)
  };
}

// Convert hourly forecast array to WeatherConditions array for work window calculation
export function forecastToWeatherConditionsArray(forecast: WeatherData[]): WeatherConditions[] {
  return forecast.map((hour, i) => {
    // Determine temperature trend by looking at next hour
    let tempTrend: "rising" | "falling" | "stable" = "stable";
    if (i < forecast.length - 1) {
      const nextTemp = forecast[i + 1].temp;
      const diff = nextTemp - hour.temp;
      if (diff > 1) tempTrend = "rising";
      else if (diff < -1) tempTrend = "falling";
    }

    const isPrecip = hour.description.toLowerCase().includes("rain") ||
      hour.description.toLowerCase().includes("snow") ||
      hour.description.toLowerCase().includes("drizzle") ||
      hour.description.toLowerCase().includes("sleet");

    return {
      temp: hour.temp,
      tempTrend,
      windSpeed: hour.wind_speed,
      humidity: hour.humidity,
      isPrecipitating: isPrecip,
      precipProbability: Math.round((hour.pop || 0) * 100)
    };
  });
}

// Convert DailyForecast to WeatherConditions (use worst-case for the day)
export function dailyToWeatherConditions(daily: DailyForecast): WeatherConditions {
  // For daily compliance, use conservative estimates
  const isPrecip = daily.conditions.toLowerCase().includes("rain") ||
    daily.conditions.toLowerCase().includes("snow") ||
    daily.conditions.toLowerCase().includes("drizzle");

  // Check temp trend through the day
  const temps = daily.hourlyData.map(h => h.temp);
  let tempTrend: "rising" | "falling" | "stable" = "stable";
  if (temps.length > 2) {
    const firstHalf = temps.slice(0, Math.floor(temps.length / 2));
    const secondHalf = temps.slice(Math.floor(temps.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (secondAvg - firstAvg > 3) tempTrend = "rising";
    else if (firstAvg - secondAvg > 3) tempTrend = "falling";
  }

  return {
    temp: daily.low, // Use low temp for conservative estimate
    tempTrend,
    windSpeed: daily.maxWind,
    humidity: daily.avgHumidity,
    isPrecipitating: isPrecip,
    precipProbability: daily.precipProbability
  };
}
