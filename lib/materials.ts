export type WeatherConstraint = {
  minTemp?: number;
  maxTemp?: number;
  rising?: boolean; // If true, temp must be rising (usually means check forecast for next few hours)
  noPrecip?: boolean;
  maxWind?: number;
  maxHumidity?: number;
  storageTempMax?: number;
  storageTempMin?: number;
};

export type Material = {
  id: string;
  name: string;
  category: "Roofing (Mod. Bit.)" | "Roofing (Metal)" | "Roofing (Coatings)" | "HVAC" | "Electrical" | "General";
  constraints: WeatherConstraint;
  description: string;
  manufacturerUrl?: string;
};

export const MATERIALS: Material[] = [
  {
    id: "green-lock-plus",
    name: "Green-Lock Plus Membrane Adhesive",
    category: "Roofing (Mod. Bit.)",
    description: "Cold-applied adhesive for modified bitumen. Critical: Must be 40°F and rising.",
    constraints: {
      minTemp: 40,
      rising: true,
      noPrecip: true,
    }
  },
  {
    id: "r-mer-seal",
    name: "R-Mer Seal Underlayment",
    category: "Roofing (Metal)",
    description: "High-temp self-adhering underlayment. Installation 50°F and rising.",
    constraints: {
      minTemp: 50,
      maxTemp: 100,
      rising: true,
      noPrecip: true,
    }
  },
  {
    id: "garla-block-2k",
    name: "Garla-Block 2K (Primer)",
    category: "Roofing (Mod. Bit.)",
    description: "Primer. Do not use if temp drops below 50°F within 6 hours.",
    constraints: {
      minTemp: 50, // Effective min temp due to "within 6 hours" rule
      noPrecip: true,
      storageTempMin: 40,
      storageTempMax: 90
    }
  },
  {
    id: "garla-flex",
    name: "Garla-Flex (Mastic)",
    category: "Roofing (Mod. Bit.)",
    description: "Mastic. Application below 40°F not recommended.",
    constraints: {
      minTemp: 40,
      noPrecip: true,
    }
  },
  {
    id: "tuff-stuff-ms",
    name: "Tuff-Stuff® MS (Sealant)",
    category: "Roofing (Mod. Bit.)",
    description: "Sealant. Heat sensitive storage.",
    constraints: {
      storageTempMax: 80,
      noPrecip: true
    }
  },
  {
    id: "optimax-membrane",
    name: "OptiMax® Mineral Membrane",
    category: "Roofing (Mod. Bit.)",
    description: "Mod Bit rolls. Store above 50°F. Cold weather: Only remove immediate install rolls.",
    constraints: {
      minTemp: 40, // General roofing rule
      noPrecip: true,
      storageTempMin: 50
    }
  },
  {
    id: "pyramic-plus-lo",
    name: "Pyramic® Plus LO (Reflective Coating)",
    category: "Roofing (Coatings)",
    description: "Reflective coating. Do not allow to freeze.",
    constraints: {
      minTemp: 33, // "Do not freeze"
      noPrecip: true,
    }
  },
  {
    id: "tuff-flash-plus",
    name: "Tuff-Flash™ Plus LO (Liquid Flashing)",
    category: "Roofing (Mod. Bit.)",
    description: "Liquid flashing. Service temp wide range, but application needs dry surface.",
    constraints: {
      noPrecip: true,
    }
  },
  {
    id: "general-roofing",
    name: "General Roofing Installation",
    category: "General",
    description: "Base rule: Do not install roofing when air temp is below 40°F.",
    constraints: {
      minTemp: 40,
      maxWind: 20, // Standard safety
      noPrecip: true
    }
  }
];

export function checkCompliance(materialId: string, currentTemp: number, windSpeed: number, isPrecipitating: boolean): { compliant: boolean; reasons: string[] } {
  const material = MATERIALS.find(m => m.id === materialId);
  if (!material) return { compliant: false, reasons: ["Material not found"] };

  const reasons: string[] = [];
  let compliant = true;

  if (material.constraints.minTemp !== undefined && currentTemp < material.constraints.minTemp) {
    compliant = false;
    reasons.push(`Temp ${Math.round(currentTemp)}°F is below min ${material.constraints.minTemp}°F`);
  }

  if (material.constraints.maxTemp !== undefined && currentTemp > material.constraints.maxTemp) {
    compliant = false;
    reasons.push(`Temp ${Math.round(currentTemp)}°F is above max ${material.constraints.maxTemp}°F`);
  }

  if (material.constraints.maxWind !== undefined && windSpeed > material.constraints.maxWind) {
    compliant = false;
    reasons.push(`Wind ${Math.round(windSpeed)}mph exceeds max ${material.constraints.maxWind}mph`);
  }

  if (material.constraints.noPrecip && isPrecipitating) {
    compliant = false;
    reasons.push("Precipitation detected");
  }

  return { compliant, reasons };
}
