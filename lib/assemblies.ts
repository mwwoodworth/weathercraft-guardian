// Assembly-based compliance system for Building 140
// An assembly is a roofing system with multiple weather-sensitive components

export type WeatherConstraint = {
  minTemp?: number;
  maxTemp?: number;
  rising?: boolean;
  noPrecip?: boolean;
  maxWind?: number;
  maxHumidity?: number;
  cureTimeHours?: number; // Hours needed above minTemp after application
};

export type Component = {
  id: string;
  name: string;
  constraints: WeatherConstraint;
  description: string;
  criticalNote?: string; // Warning text for field crews
};

export type Assembly = {
  id: string;
  name: string;
  description: string;
  components: Component[];
  projectPhase: "Deck Prep" | "Base Sheet" | "Cap Sheet" | "Flashings" | "Coatings" | "Metal Panels";
};

// Building 140 Assemblies
export const ASSEMBLIES: Assembly[] = [
  {
    id: "mod-bit-base-system",
    name: "Modified Bitumen Base System",
    description: "Deck preparation, primer, and base sheet installation",
    projectPhase: "Deck Prep",
    components: [
      {
        id: "garla-block-2k",
        name: "Garla-Block 2K Primer",
        description: "Asphalt primer for concrete/metal deck preparation",
        criticalNote: "Temp must stay above 50°F for 6 hours after application",
        constraints: {
          minTemp: 50,
          noPrecip: true,
          cureTimeHours: 6
        }
      },
      {
        id: "green-lock-plus",
        name: "Green-Lock Plus Adhesive",
        description: "Cold-applied membrane adhesive",
        criticalNote: "Must be 40°F AND RISING - do not apply if temps falling",
        constraints: {
          minTemp: 40,
          rising: true,
          noPrecip: true
        }
      },
      {
        id: "optimax-base",
        name: "OptiMax Base Sheet",
        description: "Modified bitumen base ply",
        criticalNote: "Store rolls above 50°F. Only unpack rolls for immediate install in cold weather.",
        constraints: {
          minTemp: 40,
          noPrecip: true,
          maxWind: 25
        }
      }
    ]
  },
  {
    id: "mod-bit-cap-system",
    name: "Modified Bitumen Cap Sheet System",
    description: "Cap sheet and finish membrane installation",
    projectPhase: "Cap Sheet",
    components: [
      {
        id: "green-lock-plus-cap",
        name: "Green-Lock Plus Adhesive (Cap)",
        description: "Adhesive for cap sheet application",
        criticalNote: "Must be 40°F AND RISING",
        constraints: {
          minTemp: 40,
          rising: true,
          noPrecip: true
        }
      },
      {
        id: "optimax-mineral-cap",
        name: "OptiMax Mineral Cap Sheet",
        description: "Granule-surfaced cap sheet membrane",
        criticalNote: "Store above 50°F. Allow rolls to warm before unrolling if cold.",
        constraints: {
          minTemp: 40,
          noPrecip: true,
          maxWind: 25
        }
      }
    ]
  },
  {
    id: "mod-bit-flashings",
    name: "Flashing & Detail System",
    description: "Penetrations, terminations, and detail work",
    projectPhase: "Flashings",
    components: [
      {
        id: "garla-flex",
        name: "Garla-Flex Mastic",
        description: "Trowel-grade flashing mastic",
        criticalNote: "Do not apply below 40°F",
        constraints: {
          minTemp: 40,
          noPrecip: true
        }
      },
      {
        id: "tuff-flash-plus",
        name: "Tuff-Flash Plus LO",
        description: "Liquid-applied flashing",
        criticalNote: "Surface must be completely dry",
        constraints: {
          minTemp: 35,
          noPrecip: true,
          maxHumidity: 85
        }
      },
      {
        id: "tuff-stuff-ms",
        name: "Tuff-Stuff MS Sealant",
        description: "Moisture-cure sealant for terminations",
        criticalNote: "Store below 80°F. Cures faster in humidity.",
        constraints: {
          noPrecip: true
        }
      }
    ]
  },
  {
    id: "reflective-coating",
    name: "Reflective Coating System",
    description: "Final reflective/protective coating application",
    projectPhase: "Coatings",
    components: [
      {
        id: "pyramic-plus-lo",
        name: "Pyramic Plus LO Coating",
        description: "White reflective roof coating",
        criticalNote: "DO NOT allow to freeze. Must have 24hr dry window.",
        constraints: {
          minTemp: 50,
          noPrecip: true,
          cureTimeHours: 24
        }
      }
    ]
  },
  {
    id: "metal-panel-system",
    name: "Standing Seam Metal System",
    description: "R-Mer Span metal panel installation",
    projectPhase: "Metal Panels",
    components: [
      {
        id: "r-mer-seal",
        name: "R-Mer Seal Underlayment",
        description: "High-temp self-adhering underlayment",
        criticalNote: "CRITICAL: Min 50°F and rising for warranty compliance",
        constraints: {
          minTemp: 50,
          maxTemp: 100,
          rising: true,
          noPrecip: true
        }
      },
      {
        id: "metal-panel-install",
        name: "Metal Panel Installation",
        description: "Standing seam panel setting and seaming",
        criticalNote: "High wind = safety stop. No install in rain.",
        constraints: {
          minTemp: 20,
          maxWind: 25,
          noPrecip: true
        }
      }
    ]
  }
];

export type ComponentResult = {
  component: Component;
  compliant: boolean;
  reasons: string[];
};

export type AssemblyResult = {
  assembly: Assembly;
  compliant: boolean;
  componentResults: ComponentResult[];
  failingComponents: Component[];
};

export type WeatherConditions = {
  temp: number;
  tempTrend: "rising" | "falling" | "stable";
  windSpeed: number;
  humidity: number;
  isPrecipitating: boolean;
  precipProbability: number;
};

export function checkComponentCompliance(
  component: Component,
  conditions: WeatherConditions
): ComponentResult {
  const reasons: string[] = [];
  let compliant = true;

  const c = component.constraints;

  if (c.minTemp !== undefined && conditions.temp < c.minTemp) {
    compliant = false;
    reasons.push(`Temp ${Math.round(conditions.temp)}°F < min ${c.minTemp}°F`);
  }

  if (c.maxTemp !== undefined && conditions.temp > c.maxTemp) {
    compliant = false;
    reasons.push(`Temp ${Math.round(conditions.temp)}°F > max ${c.maxTemp}°F`);
  }

  if (c.rising && conditions.tempTrend !== "rising") {
    compliant = false;
    reasons.push(`Temp must be rising (currently ${conditions.tempTrend})`);
  }

  if (c.maxWind !== undefined && conditions.windSpeed > c.maxWind) {
    compliant = false;
    reasons.push(`Wind ${Math.round(conditions.windSpeed)}mph > max ${c.maxWind}mph`);
  }

  if (c.maxHumidity !== undefined && conditions.humidity > c.maxHumidity) {
    compliant = false;
    reasons.push(`Humidity ${conditions.humidity}% > max ${c.maxHumidity}%`);
  }

  if (c.noPrecip && conditions.isPrecipitating) {
    compliant = false;
    reasons.push("Active precipitation");
  }

  if (c.noPrecip && conditions.precipProbability > 50) {
    compliant = false;
    reasons.push(`High precip probability (${conditions.precipProbability}%)`);
  }

  return { component, compliant, reasons };
}

export function checkAssemblyCompliance(
  assembly: Assembly,
  conditions: WeatherConditions
): AssemblyResult {
  const componentResults = assembly.components.map(comp =>
    checkComponentCompliance(comp, conditions)
  );

  const failingComponents = componentResults
    .filter(r => !r.compliant)
    .map(r => r.component);

  return {
    assembly,
    compliant: failingComponents.length === 0,
    componentResults,
    failingComponents
  };
}

export function checkAllAssemblies(conditions: WeatherConditions): AssemblyResult[] {
  return ASSEMBLIES.map(assembly => checkAssemblyCompliance(assembly, conditions));
}

// Get the most restrictive constraint across all assemblies
export function getSystemMinTemp(): number {
  let maxMinTemp = 0;
  for (const assembly of ASSEMBLIES) {
    for (const comp of assembly.components) {
      if (comp.constraints.minTemp && comp.constraints.minTemp > maxMinTemp) {
        maxMinTemp = comp.constraints.minTemp;
      }
    }
  }
  return maxMinTemp;
}
