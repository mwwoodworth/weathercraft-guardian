import { API_KEY } from "./config";

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
  pop: number; // Probability of precipitation
  dt: number;
};

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`, { next: { revalidate: 300 } });
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
    pop: 0, // Current weather doesn't have pop usually, need forecast
    dt: data.dt
  };
}

export async function getForecast(lat: number, lon: number): Promise<WeatherData[]> {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`, { next: { revalidate: 1800 } });
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
    pop: item.pop,
    dt: item.dt
  }));
}
