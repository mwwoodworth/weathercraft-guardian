// Assembly-based compliance system for Building 140
// An assembly is a TRUE ROOFING SCOPE with multiple weather-sensitive components
// Key principle: A single component GO does not authorize system mobilization
// Requires: Full work day window + lead time for ALL components

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
  scopeType: "Modified Bitumen" | "Standing Seam Metal";
  // Lead time and work window requirements
  minLeadTimeDays: number;        // Minimum days advance notice needed (forecast confidence)
  minWorkWindowHours: number;     // Minimum hours of ALL COMPONENTS GO required
};

// Building 140 TRUE ROOFING SCOPES
// Consolidated from component-level to SYSTEM-level assemblies
// A scope requires ALL components to be GO for the FULL work window
export const ASSEMBLIES: Assembly[] = [
  {
    id: "mod-bit-system",
    name: "Modified Bitumen System",
    description: "Complete mod bit roofing scope: deck prep, primer, base sheet, cap sheet, flashings, sealants, and reflective coating",
    scopeType: "Modified Bitumen",
    minLeadTimeDays: 1,        // Need at least 1 day advance forecast showing GO
    minWorkWindowHours: 8,     // Need full 8-hour work day of ALL components GO
    components: [
      // DECK PREP & PRIMER
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
      // BASE SHEET
      {
        id: "green-lock-plus-base",
        name: "Green-Lock Plus Adhesive (Base)",
        description: "Cold-applied membrane adhesive for base sheet",
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
      },
      // CAP SHEET
      {
        id: "green-lock-plus-cap",
        name: "Green-Lock Plus Adhesive (Cap)",
        description: "Cold-applied membrane adhesive for cap sheet",
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
      },
      // FLASHINGS & DETAILS
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
      },
      // REFLECTIVE COATING (FINAL STEP)
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
    id: "standing-seam-system",
    name: "Standing Seam Metal System",
    description: "Complete standing seam metal roofing scope: underlayment and metal panel installation",
    scopeType: "Standing Seam Metal",
    minLeadTimeDays: 1,        // Need at least 1 day advance forecast showing GO
    minWorkWindowHours: 8,     // Need full 8-hour work day of ALL components GO
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
  compliant: boolean;                    // Current moment: all components GO
  componentResults: ComponentResult[];
  failingComponents: Component[];
  // Enhanced status for TRUE scope-level decision making
  laborGreenLight: boolean;              // TRUE GO: has lead time + full work window + all components GO
  hasRequiredLeadTime: boolean;          // Forecast shows GO at least minLeadTimeDays out
  hasFullWorkWindow: boolean;            // Forecast shows minWorkWindowHours of continuous GO
  workWindowHours: number;               // Actual consecutive GO hours available
  nextWorkWindow?: {                     // When is the next viable work window?
    startDate: Date;
    durationHours: number;
  };
  statusMessage: string;                 // Human-readable status for crews
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
  conditions: WeatherConditions,
  hourlyForecast?: WeatherConditions[]  // Optional hourly forecast for work window calculation
): AssemblyResult {
  const componentResults = assembly.components.map(comp =>
    checkComponentCompliance(comp, conditions)
  );

  const failingComponents = componentResults
    .filter(r => !r.compliant)
    .map(r => r.component);

  const currentCompliant = failingComponents.length === 0;

  // Calculate work window from hourly forecast
  const { hasFullWorkWindow, workWindowHours, hasRequiredLeadTime, nextWorkWindow } =
    calculateWorkWindow(assembly, conditions, hourlyForecast || []);

  // LABOR GREEN LIGHT: requires ALL conditions met
  // 1. Current moment compliant (all components GO)
  // 2. Full work window available (minWorkWindowHours of continuous GO)
  // 3. Lead time requirement met (forecast shows GO at least minLeadTimeDays out)
  const laborGreenLight = currentCompliant && hasFullWorkWindow && hasRequiredLeadTime;

  // Generate human-readable status message
  let statusMessage: string;
  if (laborGreenLight) {
    statusMessage = `✅ LABOR GO: ${workWindowHours}hr window available, ${assembly.minLeadTimeDays}+ day lead time confirmed`;
  } else if (currentCompliant && !hasFullWorkWindow) {
    statusMessage = `⚠️ HOLD: Conditions OK but only ${workWindowHours}hr window (need ${assembly.minWorkWindowHours}hr)`;
  } else if (currentCompliant && !hasRequiredLeadTime) {
    statusMessage = `⚠️ HOLD: Need ${assembly.minLeadTimeDays}+ day forecast showing full work window`;
  } else {
    const failNames = failingComponents.slice(0, 2).map(c => c.name).join(", ");
    statusMessage = `🛑 NO-GO: ${failingComponents.length} component(s) failing - ${failNames}${failingComponents.length > 2 ? '...' : ''}`;
  }

  return {
    assembly,
    compliant: currentCompliant,
    componentResults,
    failingComponents,
    laborGreenLight,
    hasRequiredLeadTime,
    hasFullWorkWindow,
    workWindowHours,
    nextWorkWindow,
    statusMessage
  };
}

// Calculate work window availability from hourly forecast
function calculateWorkWindow(
  assembly: Assembly,
  currentConditions: WeatherConditions,
  hourlyForecast: WeatherConditions[]
): {
  hasFullWorkWindow: boolean;
  workWindowHours: number;
  hasRequiredLeadTime: boolean;
  nextWorkWindow?: { startDate: Date; durationHours: number };
} {
  const requiredHours = assembly.minWorkWindowHours;
  const requiredLeadDays = assembly.minLeadTimeDays;

  // If no forecast data, we can only check current conditions
  if (hourlyForecast.length === 0) {
    const currentGo = assembly.components.every(comp =>
      checkComponentCompliance(comp, currentConditions).compliant
    );
    return {
      hasFullWorkWindow: false,  // Can't confirm without forecast
      workWindowHours: currentGo ? 1 : 0,
      hasRequiredLeadTime: false  // Can't confirm without forecast
    };
  }

  // Count consecutive GO hours starting from each hour
  let maxConsecutiveHours = 0;
  let currentConsecutive = 0;
  let firstWorkWindowStart: number | undefined;

  for (let i = 0; i < hourlyForecast.length; i++) {
    const hourConditions = hourlyForecast[i];
    const allComponentsGo = assembly.components.every(comp =>
      checkComponentCompliance(comp, hourConditions).compliant
    );

    if (allComponentsGo) {
      currentConsecutive++;
      if (firstWorkWindowStart === undefined && currentConsecutive >= requiredHours) {
        firstWorkWindowStart = i - currentConsecutive + 1;
      }
    } else {
      if (currentConsecutive > maxConsecutiveHours) {
        maxConsecutiveHours = currentConsecutive;
      }
      currentConsecutive = 0;
    }
  }

  // Check final streak
  if (currentConsecutive > maxConsecutiveHours) {
    maxConsecutiveHours = currentConsecutive;
  }

  const hasFullWorkWindow = maxConsecutiveHours >= requiredHours;

  // Check lead time: need GO window at least requiredLeadDays * 24 hours out
  const leadTimeHours = requiredLeadDays * 24;
  let hasRequiredLeadTime = false;

  if (hourlyForecast.length >= leadTimeHours) {
    // Check if there's a full work window starting at or after lead time
    for (let startHour = leadTimeHours; startHour <= hourlyForecast.length - requiredHours; startHour++) {
      let consecutiveGo = 0;
      for (let h = startHour; h < startHour + requiredHours && h < hourlyForecast.length; h++) {
        const allGo = assembly.components.every(comp =>
          checkComponentCompliance(comp, hourlyForecast[h]).compliant
        );
        if (allGo) {
          consecutiveGo++;
        } else {
          break;
        }
      }
      if (consecutiveGo >= requiredHours) {
        hasRequiredLeadTime = true;
        break;
      }
    }
  }

  // Find next work window
  let nextWorkWindow: { startDate: Date; durationHours: number } | undefined;
  if (firstWorkWindowStart !== undefined) {
    const now = new Date();
    nextWorkWindow = {
      startDate: new Date(now.getTime() + firstWorkWindowStart * 60 * 60 * 1000),
      durationHours: maxConsecutiveHours
    };
  }

  return {
    hasFullWorkWindow,
    workWindowHours: maxConsecutiveHours,
    hasRequiredLeadTime,
    nextWorkWindow
  };
}

export function checkAllAssemblies(
  conditions: WeatherConditions,
  hourlyForecast?: WeatherConditions[]
): AssemblyResult[] {
  return ASSEMBLIES.map(assembly => checkAssemblyCompliance(assembly, conditions, hourlyForecast));
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
