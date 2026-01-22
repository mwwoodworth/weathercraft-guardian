// Advanced Analytics Engine for Weathercraft Guardian
// Production metrics, weather impact analysis, and timeline predictions

import type { WorkEntry, DailyLogEntry } from "./store";
import type { DailyForecast } from "./weather";

// ============ TYPES ============

export type ProductionMetrics = {
  totalSqft: number;
  weeklyAverage: number;
  monthlyTotal: number;
  dailyAverage: number;
  peakDay: { date: string; sqft: number };
  lowestDay: { date: string; sqft: number };
  productionTrend: "increasing" | "decreasing" | "stable";
  trendPercentage: number;
};

export type CrewEfficiency = {
  sqftPerCrewMember: number;
  sqftPerHour: number;
  averageCrewSize: number;
  efficiencyRating: "excellent" | "good" | "average" | "needs_improvement";
  efficiencyScore: number; // 0-100
  comparisonToTarget: number; // percentage vs target
};

export type WeatherImpactMetrics = {
  totalWeatherHoldDays: number;
  weatherHoldPercentage: number;
  avgDelayDuration: number;
  estimatedCostImpact: number;
  holdsByReason: { reason: string; count: number; days: number }[];
  longestHoldStreak: number;
  monthlyHoldTrend: { month: string; holds: number }[];
};

export type TemperatureTrend = {
  date: Date;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  workable: boolean;
};

export type OptimalWorkWindow = {
  date: Date;
  startHour: number;
  endHour: number;
  duration: number;
  confidence: number;
  temperature: { min: number; max: number; avg: number };
  conditions: string;
};

export type ProjectMilestone = {
  id: string;
  name: string;
  targetDate: Date;
  actualDate?: Date;
  status: "completed" | "in_progress" | "upcoming" | "delayed";
  percentComplete: number;
  sqftTarget?: number;
  sqftActual?: number;
};

export type TimelineVariance = {
  milestone: string;
  plannedDays: number;
  actualDays: number;
  variance: number; // positive = behind, negative = ahead
  variancePercentage: number;
  weatherImpactDays: number;
};

export type WeeklyProductionData = {
  week: string;
  weekStart: Date;
  sqft: number;
  daysWorked: number;
  weatherHolds: number;
  avgDailyProduction: number;
};

export type MonthlyProductionData = {
  month: string;
  sqft: number;
  daysWorked: number;
  weatherHolds: number;
  efficiency: number;
};

// ============ DEMO DATA ============

// Generate demo production history for the past 60 days
export function generateDemoProductionHistory(): Record<string, WorkEntry> {
  const entries: Record<string, WorkEntry> = {};
  const today = new Date();
  const phases = ["Area A Base Sheet", "Area A Cap Sheet", "Area B Base Sheet", "Area B Cap Sheet", "Flashings"];
  let currentPhaseIndex = 0;
  let phaseDay = 0;

  for (let i = 60; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      entries[dateKey] = {
        date: dateKey,
        type: "weekend",
        createdAt: date,
        updatedAt: date
      };
      continue;
    }

    // Random weather holds (~20% chance)
    const rand = Math.random();
    if (rand < 0.15) {
      const reasons = ["Temperature below 40", "High winds", "Precipitation", "Temperature falling"];
      entries[dateKey] = {
        date: dateKey,
        type: "weather_hold",
        notes: reasons[Math.floor(Math.random() * reasons.length)],
        weatherReason: rand < 0.08 ? "cold" : rand < 0.12 ? "wind" : "rain",
        createdAt: date,
        updatedAt: date
      };
      continue;
    }

    // Regular work day
    const baseSqft = 800 + Math.floor(Math.random() * 600);
    const phase = phases[currentPhaseIndex];

    entries[dateKey] = {
      date: dateKey,
      type: "worked",
      notes: `${phase} - Progress Day ${phaseDay + 1}`,
      sqft: baseSqft,
      createdAt: date,
      updatedAt: date
    };

    phaseDay++;
    if (phaseDay >= 8 + Math.floor(Math.random() * 4)) {
      currentPhaseIndex = Math.min(currentPhaseIndex + 1, phases.length - 1);
      phaseDay = 0;
    }
  }

  return entries;
}

// Demo daily logs
export function generateDemoDailyLogs(): DailyLogEntry[] {
  const logs: DailyLogEntry[] = [];
  const today = new Date();

  for (let i = 14; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    if (Math.random() < 0.15) continue; // Weather hold days

    const sqft = 800 + Math.floor(Math.random() * 600);
    const crew = 4 + Math.floor(Math.random() * 3);
    const hours = 6 + Math.floor(Math.random() * 3);

    logs.push({
      id: `log-${i}`,
      date: date.toISOString().split('T')[0],
      weatherConditions: Math.random() > 0.5 ? "Clear, 52F" : "Partly cloudy, 48F",
      tempHigh: 45 + Math.floor(Math.random() * 20),
      tempLow: 30 + Math.floor(Math.random() * 15),
      crewCount: crew,
      workPerformed: [`Membrane installation - ${sqft} SF`],
      materialsUsed: ["Green-Lock Plus", "OptiMax Base Sheet"],
      equipmentUsed: ["Roller", "Trowels"],
      issues: Math.random() > 0.8 ? ["Minor seam adjustment required"] : [],
      safetyNotes: ["All PPE worn", "Tool check completed"],
      photos: [],
      submittedBy: "Mike Thompson",
      submittedAt: date,
      sqftCompleted: sqft,
      hoursWorked: hours
    });
  }

  return logs;
}

// Demo milestones
export const DEMO_MILESTONES: ProjectMilestone[] = [
  {
    id: "m1",
    name: "Mobilization & Deck Prep",
    targetDate: new Date(2024, 0, 5),
    actualDate: new Date(2024, 0, 4),
    status: "completed",
    percentComplete: 100,
    sqftTarget: 0,
    sqftActual: 0
  },
  {
    id: "m2",
    name: "Area A Base Sheet Complete",
    targetDate: new Date(2024, 0, 15),
    actualDate: new Date(2024, 0, 17),
    status: "completed",
    percentComplete: 100,
    sqftTarget: 4600,
    sqftActual: 4600
  },
  {
    id: "m3",
    name: "Area A Cap Sheet Complete",
    targetDate: new Date(2024, 0, 22),
    actualDate: new Date(2024, 0, 24),
    status: "completed",
    percentComplete: 100,
    sqftTarget: 4600,
    sqftActual: 4600
  },
  {
    id: "m4",
    name: "Area B Base Sheet Complete",
    targetDate: new Date(2024, 0, 31),
    status: "in_progress",
    percentComplete: 65,
    sqftTarget: 5200,
    sqftActual: 3380
  },
  {
    id: "m5",
    name: "Area B Cap Sheet Complete",
    targetDate: new Date(2024, 1, 7),
    status: "upcoming",
    percentComplete: 0,
    sqftTarget: 5200,
    sqftActual: 0
  },
  {
    id: "m6",
    name: "Flashings & Penetrations",
    targetDate: new Date(2024, 1, 14),
    status: "upcoming",
    percentComplete: 0
  },
  {
    id: "m7",
    name: "Metal Panel Installation",
    targetDate: new Date(2024, 1, 28),
    status: "upcoming",
    percentComplete: 0,
    sqftTarget: 3200,
    sqftActual: 0
  },
  {
    id: "m8",
    name: "Final Coating & Inspection",
    targetDate: new Date(2024, 2, 8),
    status: "upcoming",
    percentComplete: 0
  }
];

// ============ CALCULATION FUNCTIONS ============

export function calculateProductionMetrics(
  workEntries: Record<string, WorkEntry>
): ProductionMetrics {
  const workedDays = Object.values(workEntries).filter(e => e.type === "worked" && e.sqft);

  if (workedDays.length === 0) {
    return {
      totalSqft: 0,
      weeklyAverage: 0,
      monthlyTotal: 0,
      dailyAverage: 0,
      peakDay: { date: "", sqft: 0 },
      lowestDay: { date: "", sqft: 0 },
      productionTrend: "stable",
      trendPercentage: 0
    };
  }

  const totalSqft = workedDays.reduce((sum, d) => sum + (d.sqft || 0), 0);
  const dailyAverage = Math.round(totalSqft / workedDays.length);

  // Find peak and lowest days
  let peak = workedDays[0];
  let lowest = workedDays[0];
  for (const day of workedDays) {
    if ((day.sqft || 0) > (peak.sqft || 0)) peak = day;
    if ((day.sqft || 0) < (lowest.sqft || 0)) lowest = day;
  }

  // Calculate weekly average (assuming 5 work days per week)
  const weeksSpan = Math.max(1, workedDays.length / 5);
  const weeklyAverage = Math.round(totalSqft / weeksSpan);

  // Monthly total (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthlyTotal = workedDays
    .filter(d => new Date(d.date) >= thirtyDaysAgo)
    .reduce((sum, d) => sum + (d.sqft || 0), 0);

  // Calculate trend (compare first half to second half)
  const midPoint = Math.floor(workedDays.length / 2);
  const firstHalf = workedDays.slice(0, midPoint);
  const secondHalf = workedDays.slice(midPoint);

  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + (d.sqft || 0), 0) / Math.max(1, firstHalf.length);
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + (d.sqft || 0), 0) / Math.max(1, secondHalf.length);

  const trendPercentage = firstHalfAvg > 0
    ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
    : 0;

  let productionTrend: "increasing" | "decreasing" | "stable" = "stable";
  if (trendPercentage > 5) productionTrend = "increasing";
  else if (trendPercentage < -5) productionTrend = "decreasing";

  return {
    totalSqft,
    weeklyAverage,
    monthlyTotal,
    dailyAverage,
    peakDay: { date: peak.date, sqft: peak.sqft || 0 },
    lowestDay: { date: lowest.date, sqft: lowest.sqft || 0 },
    productionTrend,
    trendPercentage
  };
}

export function calculateCrewEfficiency(
  dailyLogs: DailyLogEntry[],
  targetSqftPerCrewPerDay: number = 200
): CrewEfficiency {
  if (dailyLogs.length === 0) {
    return {
      sqftPerCrewMember: 0,
      sqftPerHour: 0,
      averageCrewSize: 0,
      efficiencyRating: "needs_improvement",
      efficiencyScore: 0,
      comparisonToTarget: 0
    };
  }

  const totalSqft = dailyLogs.reduce((sum, log) => sum + log.sqftCompleted, 0);
  const totalCrewDays = dailyLogs.reduce((sum, log) => sum + log.crewCount, 0);
  const totalHours = dailyLogs.reduce((sum, log) => sum + (log.hoursWorked * log.crewCount), 0);
  const averageCrewSize = totalCrewDays / dailyLogs.length;

  const sqftPerCrewMember = Math.round(totalSqft / totalCrewDays);
  const sqftPerHour = Math.round((totalSqft / totalHours) * 10) / 10;

  const comparisonToTarget = Math.round((sqftPerCrewMember / targetSqftPerCrewPerDay) * 100);

  let efficiencyRating: CrewEfficiency["efficiencyRating"];
  let efficiencyScore: number;

  if (comparisonToTarget >= 110) {
    efficiencyRating = "excellent";
    efficiencyScore = Math.min(100, 80 + (comparisonToTarget - 110) * 0.5);
  } else if (comparisonToTarget >= 90) {
    efficiencyRating = "good";
    efficiencyScore = 70 + (comparisonToTarget - 90) * 0.5;
  } else if (comparisonToTarget >= 70) {
    efficiencyRating = "average";
    efficiencyScore = 50 + (comparisonToTarget - 70) * 1;
  } else {
    efficiencyRating = "needs_improvement";
    efficiencyScore = Math.max(0, comparisonToTarget * 0.7);
  }

  return {
    sqftPerCrewMember,
    sqftPerHour,
    averageCrewSize: Math.round(averageCrewSize * 10) / 10,
    efficiencyRating,
    efficiencyScore: Math.round(efficiencyScore),
    comparisonToTarget
  };
}

export function calculateWeatherImpact(
  workEntries: Record<string, WorkEntry>,
  dailyCostRate: number = 2500
): WeatherImpactMetrics {
  const entries = Object.values(workEntries);
  const weatherHolds = entries.filter(e => e.type === "weather_hold");
  const workedDays = entries.filter(e => e.type === "worked");
  const totalWorkDays = workedDays.length + weatherHolds.length;

  // Group holds by reason
  const holdsByReasonMap = new Map<string, number>();
  for (const hold of weatherHolds) {
    const reason = hold.weatherReason || hold.notes || "Unknown";
    holdsByReasonMap.set(reason, (holdsByReasonMap.get(reason) || 0) + 1);
  }

  const holdsByReason = Array.from(holdsByReasonMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      days: count
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate longest hold streak
  let maxStreak = 0;
  let currentStreak = 0;
  const sortedEntries = entries.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const entry of sortedEntries) {
    if (entry.type === "weather_hold") {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Monthly trend (last 3 months)
  const monthlyHoldTrend: { month: string; holds: number }[] = [];
  const now = new Date();

  for (let i = 2; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = monthDate.toISOString().slice(0, 7);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const holdsInMonth = weatherHolds.filter(h => h.date.startsWith(monthKey)).length;
    monthlyHoldTrend.push({ month: monthName, holds: holdsInMonth });
  }

  return {
    totalWeatherHoldDays: weatherHolds.length,
    weatherHoldPercentage: totalWorkDays > 0
      ? Math.round((weatherHolds.length / totalWorkDays) * 100)
      : 0,
    avgDelayDuration: 1, // Most holds are single days
    estimatedCostImpact: weatherHolds.length * dailyCostRate,
    holdsByReason,
    longestHoldStreak: maxStreak,
    monthlyHoldTrend
  };
}

export function calculateTemperatureTrends(
  dailyForecasts: DailyForecast[]
): TemperatureTrend[] {
  return dailyForecasts.map(forecast => ({
    date: forecast.date,
    avgTemp: Math.round(forecast.avgTemp),
    minTemp: Math.round(forecast.low),
    maxTemp: Math.round(forecast.high),
    workable: forecast.low >= 40 && forecast.precipProbability < 50
  }));
}

export function predictOptimalWorkWindows(
  dailyForecasts: DailyForecast[]
): OptimalWorkWindow[] {
  const windows: OptimalWorkWindow[] = [];

  for (const forecast of dailyForecasts.slice(0, 7)) {
    if (!forecast.hourlyData || forecast.hourlyData.length === 0) continue;

    // Find contiguous hours where temp >= 40 and pop < 30%
    let windowStart: number | null = null;
    let windowTemps: number[] = [];

    for (const hour of forecast.hourlyData) {
      const hourNum = new Date(hour.dt * 1000).getHours();
      const isWorkable = hour.temp >= 40 && hour.pop < 0.3;

      if (isWorkable && windowStart === null) {
        windowStart = hourNum;
        windowTemps = [hour.temp];
      } else if (isWorkable) {
        windowTemps.push(hour.temp);
      } else if (windowStart !== null) {
        // End current window
        const duration = windowTemps.length;
        if (duration >= 2) {
          windows.push({
            date: forecast.date,
            startHour: windowStart,
            endHour: hourNum,
            duration,
            confidence: Math.min(95, 70 + duration * 3 - forecast.precipProbability / 2),
            temperature: {
              min: Math.min(...windowTemps),
              max: Math.max(...windowTemps),
              avg: Math.round(windowTemps.reduce((a, b) => a + b, 0) / windowTemps.length)
            },
            conditions: forecast.conditions
          });
        }
        windowStart = null;
        windowTemps = [];
      }
    }

    // Close any open window at end of day
    if (windowStart !== null && windowTemps.length >= 2) {
      windows.push({
        date: forecast.date,
        startHour: windowStart,
        endHour: 23,
        duration: windowTemps.length,
        confidence: Math.min(95, 70 + windowTemps.length * 3 - forecast.precipProbability / 2),
        temperature: {
          min: Math.min(...windowTemps),
          max: Math.max(...windowTemps),
          avg: Math.round(windowTemps.reduce((a, b) => a + b, 0) / windowTemps.length)
        },
        conditions: forecast.conditions
      });
    }
  }

  return windows.sort((a, b) => b.confidence - a.confidence);
}

export function calculateTimelineVariances(
  milestones: ProjectMilestone[],
  weatherHoldDays: number
): TimelineVariance[] {
  return milestones
    .filter(m => m.status === "completed" || m.status === "in_progress")
    .map(milestone => {
      const plannedDays = milestone.status === "completed" && milestone.actualDate
        ? Math.ceil((milestone.targetDate.getTime() - milestones[0].targetDate.getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((milestone.targetDate.getTime() - milestones[0].targetDate.getTime()) / (1000 * 60 * 60 * 24));

      const actualDays = milestone.actualDate
        ? Math.ceil((milestone.actualDate.getTime() - (milestones[0].actualDate || milestones[0].targetDate).getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((new Date().getTime() - (milestones[0].actualDate || milestones[0].targetDate).getTime()) / (1000 * 60 * 60 * 24));

      const variance = actualDays - plannedDays;
      const variancePercentage = plannedDays > 0 ? Math.round((variance / plannedDays) * 100) : 0;

      return {
        milestone: milestone.name,
        plannedDays,
        actualDays,
        variance,
        variancePercentage,
        weatherImpactDays: Math.round(weatherHoldDays * (plannedDays / 60)) // Proportional weather impact
      };
    });
}

export function getWeeklyProduction(
  workEntries: Record<string, WorkEntry>
): WeeklyProductionData[] {
  const weeks: Map<string, { sqft: number; worked: number; holds: number; startDate: Date }> = new Map();

  for (const entry of Object.values(workEntries)) {
    const date = new Date(entry.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, { sqft: 0, worked: 0, holds: 0, startDate: weekStart });
    }

    const week = weeks.get(weekKey)!;
    if (entry.type === "worked") {
      week.sqft += entry.sqft || 0;
      week.worked++;
    } else if (entry.type === "weather_hold") {
      week.holds++;
    }
  }

  return Array.from(weeks.entries())
    .map(([_weekKey, data]) => ({
      week: data.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekStart: data.startDate,
      sqft: data.sqft,
      daysWorked: data.worked,
      weatherHolds: data.holds,
      avgDailyProduction: data.worked > 0 ? Math.round(data.sqft / data.worked) : 0
    }))
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .slice(-8); // Last 8 weeks
}

export function getMonthlyProduction(
  workEntries: Record<string, WorkEntry>
): MonthlyProductionData[] {
  const months: Map<string, { sqft: number; worked: number; holds: number }> = new Map();

  for (const entry of Object.values(workEntries)) {
    const monthKey = entry.date.slice(0, 7);

    if (!months.has(monthKey)) {
      months.set(monthKey, { sqft: 0, worked: 0, holds: 0 });
    }

    const month = months.get(monthKey)!;
    if (entry.type === "worked") {
      month.sqft += entry.sqft || 0;
      month.worked++;
    } else if (entry.type === "weather_hold") {
      month.holds++;
    }
  }

  return Array.from(months.entries())
    .map(([monthKey, data]) => {
      const monthDate = new Date(monthKey + "-01");
      return {
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        sqft: data.sqft,
        daysWorked: data.worked,
        weatherHolds: data.holds,
        efficiency: data.worked > 0
          ? Math.round((data.worked / (data.worked + data.holds)) * 100)
          : 0
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months
}

// Format large numbers with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
