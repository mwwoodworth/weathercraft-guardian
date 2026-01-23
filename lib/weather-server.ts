// Server-side weather functions - only import in Server Components
import "server-only";

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
  pop: number;
  dt: number;
  sunrise?: number;
  sunset?: number;
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

export async function getCurrentWeatherServer(lat: number, lon: number): Promise<WeatherData> {
  if (!API_KEY) {
    throw new Error("OPENWEATHERMAP_API_KEY not configured");
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

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
    dt: data.dt,
    sunrise: data.sys?.sunrise,
    sunset: data.sys?.sunset
  };
}

export async function getForecastServer(lat: number, lon: number): Promise<WeatherData[]> {
  if (!API_KEY) {
    throw new Error("OPENWEATHERMAP_API_KEY not configured");
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`,
    { next: { revalidate: 1800 } }
  );

  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = await res.json();

  return data.list.map((item: OWMForecastItem) => ({
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

export function groupForecastByDayServer(forecast: WeatherData[]): DailyForecast[] {
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

    const conditionCounts = new Map<string, number>();
    for (const h of hourlyData) {
      conditionCounts.set(h.description, (conditionCounts.get(h.description) || 0) + 1);
    }
    const mostCommonCondition = [...conditionCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0][0];

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
