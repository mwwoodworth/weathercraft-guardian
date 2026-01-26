// Server-side weather functions - only import in Server Components
import "server-only";

const OPENWEATHER_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const NWS_USER_AGENT =
  process.env.NWS_USER_AGENT || "WeathercraftGuardian/1.0 (support@weathercraft.com)";
const NWS_BASE_URL = "https://api.weather.gov";

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

type NWSPointResponse = {
  properties?: {
    forecastHourly?: string;
    forecast?: string;
    timeZone?: string;
  };
};

type NWSHourlyPeriod = {
  startTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  icon: string;
  probabilityOfPrecipitation?: { value: number | null };
  relativeHumidity?: { value: number | null };
};

type NWSHourlyResponse = {
  properties?: {
    periods?: NWSHourlyPeriod[];
  };
};

const fetchJson = async (url: string, revalidate: number) => {
  const res = await fetch(url, {
    next: { revalidate },
    headers: {
      "User-Agent": NWS_USER_AGENT,
      Accept: "application/geo+json, application/json"
    }
  });
  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }
  return res.json();
};

const parseWindSpeed = (value: string): number => {
  const matches = value.match(/\d+/g);
  if (!matches || matches.length === 0) return 0;
  const nums = matches.map(n => Number(n)).filter(n => Number.isFinite(n));
  if (nums.length === 0) return 0;
  return Math.max(...nums);
};

const directionToDegrees = (value: string): number => {
  const normalized = value.toUpperCase().trim();
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW"
  ];
  const index = directions.indexOf(normalized);
  if (index >= 0) return index * 22.5;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeTemp = (temp: number, unit: string): number => {
  if (unit.toUpperCase() === "C") {
    return (temp * 9) / 5 + 32;
  }
  return temp;
};

const mapNwsPeriodToWeatherData = (period: NWSHourlyPeriod, timezone?: string): WeatherData => {
  const temp = normalizeTemp(period.temperature, period.temperatureUnit);
  const humidity = typeof period.relativeHumidity?.value === "number" ? period.relativeHumidity.value : 0;
  const popValue = typeof period.probabilityOfPrecipitation?.value === "number"
    ? period.probabilityOfPrecipitation.value / 100
    : 0;
  const timestamp = Date.parse(period.startTime);
  return {
    temp,
    feels_like: temp,
    temp_min: temp,
    temp_max: temp,
    humidity,
    wind_speed: parseWindSpeed(period.windSpeed),
    wind_deg: directionToDegrees(period.windDirection),
    description: period.shortForecast,
    icon: period.icon,
    pop: popValue,
    dt: Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : Math.floor(Date.now() / 1000),
    timezone
  };
};

const fetchNwsPoint = async (lat: number, lon: number): Promise<NWSPointResponse> =>
  fetchJson(`${NWS_BASE_URL}/points/${lat},${lon}`, 1800);

const fetchNwsHourly = async (lat: number, lon: number) => {
  const point = await fetchNwsPoint(lat, lon);
  const forecastHourly = point.properties?.forecastHourly;
  if (!forecastHourly) {
    throw new Error("NWS hourly forecast endpoint missing");
  }
  const hourly = (await fetchJson(forecastHourly, 900)) as NWSHourlyResponse;
  return {
    periods: hourly.properties?.periods ?? [],
    timezone: point.properties?.timeZone
  };
};

const fetchOpenWeatherCurrent = async (lat: number, lon: number): Promise<WeatherData> => {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("OPENWEATHERMAP_API_KEY not configured");
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${OPENWEATHER_API_KEY}`,
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
};

const fetchOpenWeatherForecast = async (lat: number, lon: number): Promise<WeatherData[]> => {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("OPENWEATHERMAP_API_KEY not configured");
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${OPENWEATHER_API_KEY}`,
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
};

const fetchOpenWeatherSunTimes = async (lat: number, lon: number): Promise<{ sunrise?: number; sunset?: number } | null> => {
  if (!OPENWEATHER_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${OPENWEATHER_API_KEY}`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      sunrise: data.sys?.sunrise,
      sunset: data.sys?.sunset
    };
  } catch {
    return null;
  }
};

export async function getCurrentWeatherServer(lat: number, lon: number): Promise<WeatherData> {
  try {
    const { periods, timezone } = await fetchNwsHourly(lat, lon);
    const current = periods[0];
    if (!current) throw new Error("NWS hourly forecast returned no periods");

    const sunTimes = await fetchOpenWeatherSunTimes(lat, lon);
    return {
      ...mapNwsPeriodToWeatherData(current, timezone),
      sunrise: sunTimes?.sunrise,
      sunset: sunTimes?.sunset
    };
  } catch (error) {
    if (!OPENWEATHER_API_KEY) {
      throw error;
    }
    const current = await fetchOpenWeatherCurrent(lat, lon);
    try {
      const forecast = await fetchOpenWeatherForecast(lat, lon);
      if (forecast[0]) {
        current.pop = forecast[0].pop ?? current.pop;
      }
    } catch {
      // ignore forecast enrichment errors
    }
    return current;
  }
}

export async function getForecastServer(lat: number, lon: number): Promise<WeatherData[]> {
  try {
    const { periods, timezone } = await fetchNwsHourly(lat, lon);
    if (!periods.length) throw new Error("NWS hourly forecast returned no periods");
    return periods.map(period => mapNwsPeriodToWeatherData(period, timezone));
  } catch (error) {
    if (!OPENWEATHER_API_KEY) {
      throw error;
    }
    return fetchOpenWeatherForecast(lat, lon);
  }
}

export function groupForecastByDayServer(forecast: WeatherData[]): DailyForecast[] {
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

    const conditionCounts = new Map<string, number>();
    for (const h of hourlyData) {
      conditionCounts.set(h.description, (conditionCounts.get(h.description) || 0) + 1);
    }
    const mostCommonCondition = [...conditionCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0][0];

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
