import { API_KEY } from "./config";
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

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("Failed to fetch weather");
  const data = await res.json();

  return {
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
    dt: data.dt
  };
}

export async function getForecast(lat: number, lon: number): Promise<WeatherData[]> {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`,
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) throw new Error("Failed to fetch forecast");
  const data = await res.json();

  return data.list.map((item: any) => ({
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
    dt: item.dt
  }));
}

// Group forecast data by day for calendar view
export function groupForecastByDay(forecast: WeatherData[]): DailyForecast[] {
  const dayMap = new Map<string, WeatherData[]>();

  for (const entry of forecast) {
    const date = new Date(entry.dt * 1000);
    const dayKey = date.toISOString().split('T')[0];

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, []);
    }
    dayMap.get(dayKey)!.push(entry);
  }

  const dailyForecasts: DailyForecast[] = [];

  for (const [dayKey, hourlyData] of dayMap) {
    const date = new Date(dayKey);
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
      const hour = new Date(h.dt * 1000).getHours();
      return hour >= 10 && hour <= 14;
    }) || hourlyData[0];

    dailyForecasts.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
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
