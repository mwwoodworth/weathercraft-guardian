import type { WeatherData, DailyForecast } from "./weather";
import { MATERIALS } from "./materials";

export type WorkPackage = {
  id: string;
  name: string;
  description: string;
  constraints: {
    minTemp?: number;
    maxTemp?: number;
    rising?: boolean;
    noPrecip?: boolean;
    maxWind?: number;
    maxHumidity?: number;
  };
  requiredHours: number;
  leadTimeHours: number;
};

export type WorkWindow = {
  start: Date;
  end: Date;
  durationHours: number;
  avgTemp: number;
  maxWind: number;
  maxPrecip: number;
  confidence: number;
};

export type DailySuitability = {
  date: Date;
  status: "go" | "caution" | "hold";
  reasons: string[];
};

const PACKAGE_OVERRIDES: Array<Partial<WorkPackage> & { sourceId?: string; id: string }> = [
  {
    id: "green-lock-plus",
    sourceId: "green-lock-plus",
    name: "Green-Lock Plus Adhesive",
    description: "Temp sensitive adhesive. Requires rising temps and dry surface.",
    requiredHours: 3,
    leadTimeHours: 12
  },
  {
    id: "r-mer-seal",
    sourceId: "r-mer-seal",
    name: "R-Mer Seal Underlayment",
    description: "Critical temp threshold for warranty compliance.",
    requiredHours: 3,
    leadTimeHours: 12
  },
  {
    id: "garla-block-2k",
    sourceId: "garla-block-2k",
    name: "Garla-Block 2K Primer",
    description: "Requires 6 hour dry/temperature window.",
    requiredHours: 6,
    leadTimeHours: 18
  },
  {
    id: "pyramic-plus-lo",
    sourceId: "pyramic-plus-lo",
    name: "Pyramic Plus LO Coating",
    description: "Needs extended dry window and freeze protection.",
    requiredHours: 24,
    leadTimeHours: 24
  },
  {
    id: "metal-panel-install",
    name: "Metal Panel Installation",
    description: "Wind-sensitive work. Avoid gusts and precipitation.",
    requiredHours: 3,
    leadTimeHours: 12,
    constraints: {
      minTemp: 20,
      maxWind: 25,
      noPrecip: true
    }
  },
  {
    id: "tuff-flash-plus",
    sourceId: "tuff-flash-plus",
    name: "Tuff-Flash Plus Liquid Flashing",
    description: "Requires dry surface and mild temperatures.",
    requiredHours: 3,
    leadTimeHours: 12
  }
];

export function getWorkPackages(): WorkPackage[] {
  return PACKAGE_OVERRIDES.map(pkg => {
    const material = pkg.sourceId
      ? MATERIALS.find(item => item.id === pkg.sourceId)
      : undefined;

    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      constraints: pkg.constraints ?? material?.constraints ?? {},
      requiredHours: pkg.requiredHours,
      leadTimeHours: pkg.leadTimeHours
    } as WorkPackage;
  });
}

function isPrecipDescription(desc: string) {
  const lower = desc.toLowerCase();
  return ["rain", "snow", "sleet", "drizzle", "storm"].some(term => lower.includes(term));
}

function meetsConstraints(
  entry: WeatherData,
  constraints: WorkPackage["constraints"]
) {
  const reasons: string[] = [];

  if (constraints.minTemp !== undefined && entry.temp < constraints.minTemp) {
    reasons.push(`Temp ${Math.round(entry.temp)}F below ${constraints.minTemp}F`);
  }

  if (constraints.maxTemp !== undefined && entry.temp > constraints.maxTemp) {
    reasons.push(`Temp ${Math.round(entry.temp)}F above ${constraints.maxTemp}F`);
  }

  if (constraints.maxWind !== undefined && entry.wind_speed > constraints.maxWind) {
    reasons.push(`Wind ${Math.round(entry.wind_speed)}mph above ${constraints.maxWind}mph`);
  }

  if (constraints.maxHumidity !== undefined && entry.humidity > constraints.maxHumidity) {
    reasons.push(`Humidity ${entry.humidity}% above ${constraints.maxHumidity}%`);
  }

  if (constraints.noPrecip) {
    if (isPrecipDescription(entry.description)) {
      reasons.push("Active precipitation");
    }
    if ((entry.pop || 0) * 100 > 40) {
      reasons.push(`Precip risk ${Math.round((entry.pop || 0) * 100)}%`);
    }
  }

  return {
    ok: reasons.length === 0,
    reasons
  };
}

function isRisingWindow(window: WeatherData[], threshold = 2) {
  if (window.length < 2) return true;
  const start = window[0].temp;
  const end = window[window.length - 1].temp;
  return end - start >= threshold;
}

export function findWorkWindows(forecast: WeatherData[], pkg: WorkPackage): WorkWindow[] {
  const intervalHours = 3;
  const requiredSlots = Math.max(1, Math.ceil(pkg.requiredHours / intervalHours));
  const windows: WorkWindow[] = [];

  for (let i = 0; i <= forecast.length - requiredSlots; i += 1) {
    const window = forecast.slice(i, i + requiredSlots);
    const constraintChecks = window.map(entry => meetsConstraints(entry, pkg.constraints));
    if (!constraintChecks.every(check => check.ok)) {
      continue;
    }

    if (pkg.constraints.rising && !isRisingWindow(window)) {
      continue;
    }

    const temps = window.map(entry => entry.temp);
    const winds = window.map(entry => entry.wind_speed);
    const pops = window.map(entry => entry.pop || 0);

    const avgTemp = temps.reduce((sum, value) => sum + value, 0) / temps.length;
    const maxWind = Math.max(...winds);
    const maxPrecip = Math.max(...pops) * 100;
    const confidence = Math.max(0, Math.round(100 - maxPrecip));

    windows.push({
      start: new Date(window[0].dt * 1000),
      end: new Date(window[window.length - 1].dt * 1000 + intervalHours * 60 * 60 * 1000),
      durationHours: requiredSlots * intervalHours,
      avgTemp: Math.round(avgTemp),
      maxWind: Math.round(maxWind),
      maxPrecip: Math.round(maxPrecip),
      confidence
    });
  }

  return windows;
}

export function buildDailySuitability(dailyForecasts: DailyForecast[], pkg: WorkPackage): DailySuitability[] {
  return dailyForecasts.slice(0, 5).map(day => {
    const reasons: string[] = [];
    let status: DailySuitability["status"] = "go";

    if (pkg.constraints.minTemp !== undefined && day.low < pkg.constraints.minTemp) {
      status = "hold";
      reasons.push(`Low ${Math.round(day.low)}F below ${pkg.constraints.minTemp}F`);
    }

    if (pkg.constraints.maxTemp !== undefined && day.high > pkg.constraints.maxTemp) {
      status = "caution";
      reasons.push(`High ${Math.round(day.high)}F above ${pkg.constraints.maxTemp}F`);
    }

    if (pkg.constraints.noPrecip && day.precipProbability > 40) {
      status = status === "hold" ? status : "caution";
      reasons.push(`Precip risk ${day.precipProbability}%`);
    }

    if (pkg.constraints.maxWind !== undefined && day.maxWind > pkg.constraints.maxWind) {
      status = "hold";
      reasons.push(`Wind ${Math.round(day.maxWind)}mph`);
    }

    return {
      date: day.date,
      status,
      reasons
    };
  });
}
