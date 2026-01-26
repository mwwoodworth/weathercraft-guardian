export type WeatherConstraint = {
  minTemp?: number;
  maxTemp?: number;
  rising?: boolean; // If true, temp must be rising
  noPrecip?: boolean;
  maxWind?: number;
  maxHumidity?: number;
  storageTempMax?: number;
  storageTempMin?: number;
};

export type RoofingSystem = "modified" | "ssmr";

export type Material = {
  id: string;
  name: string;
  system: RoofingSystem;
  category: string;
  constraints: WeatherConstraint;
  description: string;
  tempSensitive: boolean; // Whether this product has temperature requirements
  requiredHours: number; // Work window duration needed
  leadTimeHours: number; // Staging lead time
  manufacturerUrl?: string;
};

// =====================================================
// MODIFIED BITUMEN SYSTEM - All temp sensitive
// =====================================================
const MODIFIED_MATERIALS: Material[] = [
  {
    id: "green-lock-plus",
    name: "Green-Lock Plus Membrane Adhesive",
    system: "modified",
    category: "Adhesive",
    description: "Cold-applied adhesive for modified bitumen. Must be 40°F and rising.",
    tempSensitive: true,
    requiredHours: 3,
    leadTimeHours: 12,
    constraints: {
      minTemp: 40,
      rising: true,
      noPrecip: true,
    }
  },
  {
    id: "garla-block-2k",
    name: "Garla-Block 2K Primer",
    system: "modified",
    category: "Primer",
    description: "Primer for modified bitumen. Do not use if temp drops below 50°F within 6 hours.",
    tempSensitive: true,
    requiredHours: 6,
    leadTimeHours: 18,
    constraints: {
      minTemp: 50,
      noPrecip: true,
      storageTempMin: 40,
      storageTempMax: 90
    }
  },
  {
    id: "garla-flex",
    name: "Garla-Flex Mastic",
    system: "modified",
    category: "Mastic/Sealant",
    description: "Mastic for modified bitumen. Application below 40°F not recommended.",
    tempSensitive: true,
    requiredHours: 2,
    leadTimeHours: 12,
    constraints: {
      minTemp: 40,
      noPrecip: true,
    }
  },
  {
    id: "tuff-stuff-ms",
    name: "Tuff-Stuff® MS Sealant",
    system: "modified",
    category: "Mastic/Sealant",
    description: "MS polymer sealant. Heat sensitive storage.",
    tempSensitive: true,
    requiredHours: 2,
    leadTimeHours: 12,
    constraints: {
      minTemp: 40,
      storageTempMax: 80,
      noPrecip: true
    }
  },
  {
    id: "optimax-membrane",
    name: "OptiMax® Mineral Membrane",
    system: "modified",
    category: "Membrane",
    description: "Mod Bit membrane rolls. Store above 50°F. Cold weather: Only remove immediate install rolls.",
    tempSensitive: true,
    requiredHours: 4,
    leadTimeHours: 24,
    constraints: {
      minTemp: 40,
      noPrecip: true,
      storageTempMin: 50
    }
  },
  {
    id: "pyramic-plus-lo",
    name: "Pyramic® Plus LO Coating",
    system: "modified",
    category: "Coating",
    description: "Reflective coating. Do not allow to freeze. Extended dry window required.",
    tempSensitive: true,
    requiredHours: 24,
    leadTimeHours: 24,
    constraints: {
      minTemp: 33,
      noPrecip: true,
    }
  },
  {
    id: "tuff-flash-plus",
    name: "Tuff-Flash™ Plus LO",
    system: "modified",
    category: "Liquid Flashing",
    description: "Liquid flashing. Requires dry surface and mild temperatures.",
    tempSensitive: true,
    requiredHours: 3,
    leadTimeHours: 12,
    constraints: {
      minTemp: 35,
      noPrecip: true,
    }
  },
];

// =====================================================
// SSMR (STANDING SEAM METAL ROOF) SYSTEM
// Only R-Mer Seal is temp sensitive
// =====================================================
const SSMR_MATERIALS: Material[] = [
  {
    id: "r-mer-seal",
    name: "R-Mer Seal Underlayment",
    system: "ssmr",
    category: "Underlayment",
    description: "High-temp self-adhering underlayment. Installation requires 50°F and rising for warranty compliance.",
    tempSensitive: true,
    requiredHours: 3,
    leadTimeHours: 12,
    constraints: {
      minTemp: 50,
      maxTemp: 100,
      rising: true,
      noPrecip: true,
    }
  },
  {
    id: "metal-panel-install",
    name: "Metal Panel Installation",
    system: "ssmr",
    category: "Panel Installation",
    description: "Standing seam metal panel installation. Wind-sensitive, avoid gusts.",
    tempSensitive: false,
    requiredHours: 3,
    leadTimeHours: 12,
    constraints: {
      minTemp: 20,
      maxWind: 25,
      noPrecip: true
    }
  },
  {
    id: "ssmr-fasteners",
    name: "Panel Fasteners & Clips",
    system: "ssmr",
    category: "Fasteners",
    description: "Concealed clip system and fasteners. No temperature restrictions.",
    tempSensitive: false,
    requiredHours: 2,
    leadTimeHours: 6,
    constraints: {
      maxWind: 25,
      noPrecip: true
    }
  },
  {
    id: "ssmr-trim",
    name: "Metal Trim & Flashing",
    system: "ssmr",
    category: "Trim",
    description: "Pre-formed metal trim and flashing. Wind restrictions only.",
    tempSensitive: false,
    requiredHours: 2,
    leadTimeHours: 6,
    constraints: {
      maxWind: 20,
      noPrecip: true
    }
  },
];

// All materials combined
export const MATERIALS: Material[] = [...MODIFIED_MATERIALS, ...SSMR_MATERIALS];

// Get materials by system
export function getMaterialsBySystem(system: RoofingSystem): Material[] {
  return MATERIALS.filter(m => m.system === system);
}

// Get temp-sensitive materials only
export function getTempSensitiveMaterials(): Material[] {
  return MATERIALS.filter(m => m.tempSensitive);
}

// System display info
export const SYSTEMS = {
  modified: {
    name: "Modified Bitumen System",
    shortName: "Modified",
    description: "Temperature-sensitive membrane roofing system",
    allTempSensitive: true,
  },
  ssmr: {
    name: "Standing Seam Metal Roof (SSMR)",
    shortName: "SSMR",
    description: "Metal panel roofing system",
    allTempSensitive: false,
  }
} as const;

export function checkCompliance(
  materialId: string,
  currentTemp: number,
  windSpeed: number,
  isPrecipitating: boolean,
  tempTrend?: "rising" | "falling" | "stable"
): { compliant: boolean; reasons: string[] } {
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

  if (material.constraints.rising && tempTrend && tempTrend !== "rising") {
    compliant = false;
    reasons.push(`Temp must be rising (currently ${tempTrend})`);
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
