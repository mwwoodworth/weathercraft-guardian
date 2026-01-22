// AI-Powered Intelligence Engine for Weathercraft Guardian
// Generates smart insights, risk assessments, and scheduling recommendations

import { AssemblyResult, ASSEMBLIES, WeatherConditions, checkAllAssemblies } from "./assemblies";
import { DailyForecast, dailyToWeatherConditions } from "./weather";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type InsightCategory =
  | "weather_pattern"
  | "coating_window"
  | "crew_scheduling"
  | "material_prep"
  | "weekend_preview"
  | "best_day"
  | "safety"
  | "temperature"
  | "precipitation"
  | "wind"
  | "humidity"
  | "opportunity"
  | "general";

export type AIInsight = {
  id: string;
  type: "recommendation" | "warning" | "opportunity" | "risk";
  category: InsightCategory;
  priority: 1 | 2 | 3; // 1 = highest
  title: string;
  description: string;
  reasoning: string;
  actionItems?: string[];
  confidence: number; // 0-100
  learnMore?: string;
  relatedAssemblies?: string[];
  expiresAt?: Date;
  snoozable?: boolean;
  critical?: boolean;
};

export type ScheduleRecommendation = {
  assembly: string;
  recommendedDay: string;
  confidence: number; // 0-100
  reason: string;
  alternateDay?: string;
  workWindow?: string;
};

export type DailyRiskAssessment = {
  date: Date;
  dayName: string;
  overallRisk: RiskLevel;
  riskScore: number; // 0-100, higher = more risk
  factors: string[];
  bestWorkWindow?: string;
  workableHours?: number;
};

export type WeatherPattern = {
  type: "stable_cold" | "warming_trend" | "cooling_trend" | "storm_approaching" | "post_storm_clearing" | "ideal_conditions" | "variable";
  description: string;
  duration: string;
  recommendation: string;
};

export type CoatingWindow = {
  available: boolean;
  startDate?: Date;
  endDate?: Date;
  duration?: number; // hours
  confidence: number;
  reason: string;
};

// Detect weather pattern from forecast data
export function detectWeatherPattern(dailyForecasts: DailyForecast[]): WeatherPattern {
  if (dailyForecasts.length < 3) {
    return {
      type: "variable",
      description: "Insufficient data for pattern analysis",
      duration: "Unknown",
      recommendation: "Check back when more forecast data is available"
    };
  }

  const temps = dailyForecasts.slice(0, 5).map(d => (d.high + d.low) / 2);
  const precipProbs = dailyForecasts.slice(0, 5).map(d => d.precipProbability);

  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const tempTrend = temps[4] - temps[0];
  const maxPrecip = Math.max(...precipProbs);
  const avgPrecip = precipProbs.reduce((a, b) => a + b, 0) / precipProbs.length;

  // Check for storm approaching (high precip in next 2 days)
  if (precipProbs[0] > 60 || precipProbs[1] > 60) {
    return {
      type: "storm_approaching",
      description: `Storm system approaching with ${Math.round(Math.max(precipProbs[0], precipProbs[1]))}% precipitation probability`,
      duration: "1-2 days",
      recommendation: "Secure materials, complete in-progress work, prepare for weather hold"
    };
  }

  // Check for post-storm clearing
  if (precipProbs[0] > 40 && precipProbs[2] < 20 && precipProbs[3] < 20) {
    return {
      type: "post_storm_clearing",
      description: "Weather clearing after precipitation, improving conditions ahead",
      duration: "2-3 days of good weather expected",
      recommendation: "Plan major work for Day 2-3, allow surfaces to dry"
    };
  }

  // Check for ideal conditions
  if (avgTemp > 55 && avgTemp < 85 && avgPrecip < 25 && maxPrecip < 40) {
    return {
      type: "ideal_conditions",
      description: "Excellent working conditions across the forecast period",
      duration: "5-day optimal window",
      recommendation: "Maximize production - prioritize coating and adhesive work"
    };
  }

  // Check for warming trend
  if (tempTrend > 10) {
    return {
      type: "warming_trend",
      description: `Temperatures rising ${Math.round(tempTrend)}°F over 5 days`,
      duration: "Sustained warming through forecast",
      recommendation: "Schedule temperature-sensitive assemblies for later in the week"
    };
  }

  // Check for cooling trend
  if (tempTrend < -10) {
    return {
      type: "cooling_trend",
      description: `Temperatures falling ${Math.round(Math.abs(tempTrend))}°F over 5 days`,
      duration: "Cooling pattern developing",
      recommendation: "Prioritize adhesive work early, prepare for potential cold holds"
    };
  }

  // Check for stable cold
  if (avgTemp < 45) {
    return {
      type: "stable_cold",
      description: `Cold pattern persisting, average temp ${Math.round(avgTemp)}°F`,
      duration: "Extended cold period",
      recommendation: "Focus on cold-weather compatible work, monitor adhesive temps"
    };
  }

  return {
    type: "variable",
    description: "Mixed conditions with variable temperatures and precipitation",
    duration: "Day-by-day assessment needed",
    recommendation: "Check daily forecasts, be flexible with scheduling"
  };
}

// Detect 24-hour dry coating window
export function detectCoatingWindow(dailyForecasts: DailyForecast[]): CoatingWindow {
  if (dailyForecasts.length < 2) {
    return {
      available: false,
      confidence: 0,
      reason: "Insufficient forecast data for coating window analysis"
    };
  }

  // Need 24 hours of dry conditions (precip prob < 20%) and temp > 50°F
  for (let i = 0; i < dailyForecasts.length - 1; i++) {
    const day1 = dailyForecasts[i];
    const day2 = dailyForecasts[i + 1];

    const day1Dry = day1.precipProbability < 20;
    const day2Dry = day2.precipProbability < 20;
    const day1Warm = day1.high > 50 && day1.low > 35;
    const day2Warm = day2.high > 50 && day2.low > 35;

    if (day1Dry && day2Dry && day1Warm && day2Warm) {
      const confidence = 100 - (day1.precipProbability + day2.precipProbability) / 2;
      return {
        available: true,
        startDate: day1.date,
        endDate: new Date(day2.date.getTime() + 24 * 60 * 60 * 1000),
        duration: 48,
        confidence: Math.round(confidence),
        reason: `${day1.dayName}-${day2.dayName}: Low precipitation (${day1.precipProbability}%-${day2.precipProbability}%) with temps ${Math.round(day1.low)}°F-${Math.round(day2.high)}°F`
      };
    }
  }

  return {
    available: false,
    confidence: 0,
    reason: "No 24-hour dry window found in forecast - precipitation or temperature concerns"
  };
}

// Find the best day this week for work
export function findBestWorkDay(dailyForecasts: DailyForecast[]): { day: DailyForecast; score: number; reasons: string[] } | null {
  if (dailyForecasts.length === 0) return null;

  let bestDay: { day: DailyForecast; score: number; reasons: string[] } | null = null;

  for (const forecast of dailyForecasts.slice(0, 7)) {
    let score = 50;
    const reasons: string[] = [];

    // Temperature scoring (ideal: 55-75°F)
    const avgTemp = (forecast.high + forecast.low) / 2;
    if (avgTemp >= 55 && avgTemp <= 75) {
      score += 20;
      reasons.push(`Ideal temperature range (${Math.round(avgTemp)}°F avg)`);
    } else if (avgTemp >= 45 && avgTemp <= 85) {
      score += 10;
      reasons.push(`Acceptable temperature (${Math.round(avgTemp)}°F avg)`);
    } else {
      score -= 10;
    }

    // Precipitation scoring
    if (forecast.precipProbability < 10) {
      score += 25;
      reasons.push("Very low precipitation risk");
    } else if (forecast.precipProbability < 25) {
      score += 15;
      reasons.push("Low precipitation risk");
    } else if (forecast.precipProbability > 50) {
      score -= 20;
    }

    // Wind scoring
    if (forecast.maxWind < 10) {
      score += 15;
      reasons.push("Calm wind conditions");
    } else if (forecast.maxWind < 20) {
      score += 5;
    } else if (forecast.maxWind > 25) {
      score -= 15;
    }

    // Humidity scoring
    if (forecast.avgHumidity < 70) {
      score += 10;
      reasons.push("Good humidity for adhesives");
    } else if (forecast.avgHumidity > 85) {
      score -= 10;
    }

    if (!bestDay || score > bestDay.score) {
      bestDay = { day: forecast, score, reasons };
    }
  }

  return bestDay;
}

// Generate crew scheduling recommendations
export function generateCrewRecommendations(
  conditions: WeatherConditions,
  dailyForecasts: DailyForecast[]
): AIInsight[] {
  const insights: AIInsight[] = [];

  // Early start recommendation for hot days
  const todayForecast = dailyForecasts[0];
  if (todayForecast && todayForecast.high > 85) {
    insights.push({
      id: "crew-early-start",
      type: "recommendation",
      category: "crew_scheduling",
      priority: 1,
      title: "Early Start Recommended",
      description: `High of ${Math.round(todayForecast.high)}°F expected. Schedule crew for 6 AM start to maximize productive hours.`,
      reasoning: "Temperatures above 85°F reduce worker efficiency and increase heat-related risks. Morning hours offer cooler conditions for physical work.",
      actionItems: [
        "Schedule crew arrival at 6:00 AM",
        "Plan adhesive work for morning hours",
        "Ensure adequate water and shade breaks",
        "Consider afternoon pause if temps exceed 95°F"
      ],
      confidence: 90,
      learnMore: "OSHA recommends modified work schedules when heat index exceeds 91°F. Roofing adhesives also perform better in moderate temperatures.",
      relatedAssemblies: ["Green-Lock Plus", "Pyramic Plus Coating"],
      snoozable: false,
      critical: todayForecast.high > 95
    });
  }

  // Weekend work opportunity
  const weekendDays = dailyForecasts.filter(d => {
    const dayOfWeek = d.date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  });

  const goodWeekendDay = weekendDays.find(d =>
    d.precipProbability < 20 && d.high > 50 && d.high < 90 && d.maxWind < 20
  );

  if (goodWeekendDay) {
    insights.push({
      id: "weekend-opportunity",
      type: "opportunity",
      category: "crew_scheduling",
      priority: 2,
      title: "Weekend Work Opportunity",
      description: `${goodWeekendDay.dayName} shows excellent conditions for overtime work.`,
      reasoning: `${goodWeekendDay.dayName} forecast: ${Math.round(goodWeekendDay.high)}°F, ${goodWeekendDay.precipProbability}% precip, ${Math.round(goodWeekendDay.maxWind)} mph wind. Consider scheduling weekend crew.`,
      actionItems: [
        `Contact crew about ${goodWeekendDay.dayName} availability`,
        "Verify material staging for weekend",
        "Arrange site access and supervision"
      ],
      confidence: 85,
      snoozable: true
    });
  }

  // Split shift recommendation for variable conditions
  if (conditions.tempTrend === "falling" && conditions.temp > 50) {
    insights.push({
      id: "split-shift",
      type: "recommendation",
      category: "crew_scheduling",
      priority: 2,
      title: "Consider Split Shift Schedule",
      description: "Falling temperatures suggest morning will be warmest. Schedule critical work accordingly.",
      reasoning: "Temperature trend shows cooling throughout the day. Adhesive and coating work should be prioritized for warmer morning hours.",
      actionItems: [
        "Schedule temperature-sensitive work for 8 AM - 12 PM",
        "Plan mechanical fastening and prep for afternoon",
        "Monitor temps and adjust if needed"
      ],
      confidence: 75,
      snoozable: true
    });
  }

  return insights;
}

// Generate material pre-conditioning alerts
export function generateMaterialAlerts(
  conditions: WeatherConditions,
  dailyForecasts: DailyForecast[]
): AIInsight[] {
  const insights: AIInsight[] = [];

  // Cold material pre-conditioning
  if (conditions.temp < 50) {
    insights.push({
      id: "material-precondition-cold",
      type: "warning",
      category: "material_prep",
      priority: 1,
      title: "Material Pre-Conditioning Required",
      description: `Current temp ${Math.round(conditions.temp)}°F. Adhesives and coatings need conditioning to 60-80°F.`,
      reasoning: "Cold-applied adhesives below 50°F have significantly reduced tack and extended cure times. Pre-conditioning ensures proper application.",
      actionItems: [
        "Move adhesive containers to heated storage",
        "Condition materials for minimum 24 hours at 60-80°F",
        "Test adhesive consistency before application",
        "Keep spare materials in heated enclosure on roof"
      ],
      confidence: 95,
      learnMore: "Garland Green-Lock Plus requires material temperature of 50°F minimum. Below this, viscosity increases significantly affecting application.",
      relatedAssemblies: ["Green-Lock Plus", "R-Mer Seal", "Pyramic Plus Coating"],
      critical: conditions.temp < 40
    });
  }

  // Hot material storage
  const tomorrowForecast = dailyForecasts[1];
  if (tomorrowForecast && tomorrowForecast.high > 90) {
    insights.push({
      id: "material-heat-protection",
      type: "warning",
      category: "material_prep",
      priority: 2,
      title: "Material Heat Protection Needed Tomorrow",
      description: `Tomorrow's high: ${Math.round(tomorrowForecast.high)}°F. Protect materials from excessive heat.`,
      reasoning: "Extended exposure to temperatures above 100°F can degrade adhesive properties and affect coating application.",
      actionItems: [
        "Store materials in shaded area",
        "Use reflective tarps on material pallets",
        "Stage only what you'll use in 2-hour windows",
        "Keep coating containers sealed until use"
      ],
      confidence: 85,
      snoozable: true
    });
  }

  // Moisture protection alert
  if (conditions.humidity > 80 || conditions.precipProbability > 40) {
    insights.push({
      id: "material-moisture-protection",
      type: "warning",
      category: "material_prep",
      priority: 2,
      title: "Protect Materials from Moisture",
      description: "High humidity or precipitation risk - ensure materials are properly protected.",
      reasoning: "Moisture contamination can affect adhesive bond strength and coating finish quality.",
      actionItems: [
        "Keep all materials on elevated pallets",
        "Cover with waterproof tarps",
        "Inspect for moisture before use",
        "Store adhesive containers upright and sealed"
      ],
      confidence: 80,
      snoozable: true
    });
  }

  return insights;
}

// Generate weekend weather preview
export function generateWeekendPreview(dailyForecasts: DailyForecast[]): AIInsight | null {
  const weekendDays = dailyForecasts.filter(d => {
    const dayOfWeek = d.date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }).slice(0, 2);

  if (weekendDays.length === 0) return null;

  const saturdayForecast = weekendDays.find(d => d.date.getDay() === 6);
  const sundayForecast = weekendDays.find(d => d.date.getDay() === 0);

  let description = "Weekend Outlook: ";
  let score = 0;
  const actionItems: string[] = [];

  if (saturdayForecast) {
    description += `Saturday: ${Math.round(saturdayForecast.high)}°F, ${saturdayForecast.precipProbability}% precip. `;
    if (saturdayForecast.precipProbability < 30 && saturdayForecast.high > 50) {
      score += 50;
      actionItems.push("Saturday looks workable for critical path items");
    }
  }

  if (sundayForecast) {
    description += `Sunday: ${Math.round(sundayForecast.high)}°F, ${sundayForecast.precipProbability}% precip.`;
    if (sundayForecast.precipProbability < 30 && sundayForecast.high > 50) {
      score += 50;
      actionItems.push("Sunday available for catch-up work if needed");
    }
  }

  const weekendGood = score >= 50;

  return {
    id: "weekend-preview",
    type: weekendGood ? "opportunity" : "warning",
    category: "weekend_preview",
    priority: 3,
    title: weekendGood ? "Favorable Weekend Ahead" : "Weekend Weather Concerns",
    description,
    reasoning: weekendGood
      ? "Weekend conditions support optional overtime work if schedule recovery is needed."
      : "Weekend weather may limit catch-up opportunities. Plan accordingly for weekday production.",
    actionItems: actionItems.length > 0 ? actionItems : ["Monitor forecast for updates"],
    confidence: 70,
    snoozable: true
  };
}

// Generate AI insights based on current conditions and forecast
export function generateAIInsights(
  currentConditions: WeatherConditions,
  assemblyResults: AssemblyResult[],
  dailyForecasts: DailyForecast[]
): AIInsight[] {
  const insights: AIInsight[] = [];

  // Analyze current situation
  const failingAssemblies = assemblyResults.filter(r => !r.compliant);
  const systemGo = failingAssemblies.length === 0;

  // Weather pattern insight
  const weatherPattern = detectWeatherPattern(dailyForecasts);
  if (weatherPattern.type !== "variable") {
    insights.push({
      id: "weather-pattern",
      type: weatherPattern.type === "ideal_conditions" || weatherPattern.type === "post_storm_clearing" ? "opportunity"
        : weatherPattern.type === "storm_approaching" ? "risk" : "recommendation",
      category: "weather_pattern",
      priority: weatherPattern.type === "storm_approaching" ? 1 : 2,
      title: `Weather Pattern: ${weatherPattern.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}`,
      description: weatherPattern.description,
      reasoning: weatherPattern.recommendation,
      actionItems: [weatherPattern.recommendation],
      confidence: 85,
      learnMore: `Pattern duration: ${weatherPattern.duration}. This analysis is based on 5-day forecast trends.`,
      critical: weatherPattern.type === "storm_approaching"
    });
  }

  // Coating window detection
  const coatingWindow = detectCoatingWindow(dailyForecasts);
  if (coatingWindow.available) {
    insights.push({
      id: "coating-window-detected",
      type: "opportunity",
      category: "coating_window",
      priority: 1,
      title: "24-Hour Coating Window Available",
      description: coatingWindow.reason,
      reasoning: "Pyramic Plus coating requires 24 hours of dry conditions at 50°F+ for proper cure. This window meets all requirements.",
      actionItems: [
        "Prioritize coating application during this window",
        "Ensure surface prep is complete before window opens",
        "Stage all coating materials and equipment",
        "Document application for warranty compliance"
      ],
      confidence: coatingWindow.confidence,
      learnMore: "Coating applied outside optimal windows may require extended cure time or recoating.",
      relatedAssemblies: ["Pyramic Plus Coating", "Reflective Coating"],
      critical: false
    });
  }

  // Best day this week
  const bestDay = findBestWorkDay(dailyForecasts);
  if (bestDay && bestDay.score > 70) {
    insights.push({
      id: "best-day-recommendation",
      type: "opportunity",
      category: "best_day",
      priority: 2,
      title: `Best Day This Week: ${bestDay.day.dayName}`,
      description: `${bestDay.day.dayName} offers optimal conditions with a score of ${bestDay.score}/100.`,
      reasoning: bestDay.reasons.join(". ") + ".",
      actionItems: [
        `Schedule high-priority work for ${bestDay.day.dayName}`,
        "Pre-stage materials the day before",
        "Ensure full crew availability"
      ],
      confidence: Math.round(bestDay.score),
      snoozable: true
    });
  }

  // Add crew recommendations
  insights.push(...generateCrewRecommendations(currentConditions, dailyForecasts));

  // Add material alerts
  insights.push(...generateMaterialAlerts(currentConditions, dailyForecasts));

  // Add weekend preview
  const weekendPreview = generateWeekendPreview(dailyForecasts);
  if (weekendPreview) {
    insights.push(weekendPreview);
  }

  // Original insights (enhanced)

  // Insight: Temperature trend analysis
  if (currentConditions.tempTrend === "rising" && currentConditions.temp >= 45 && currentConditions.temp < 50) {
    insights.push({
      id: "temp-rising-opportunity",
      type: "opportunity",
      category: "temperature",
      priority: 1,
      title: "Temperature Window Opening",
      description: `Temperature is ${Math.round(currentConditions.temp)}°F and rising. R-Mer Seal installation window may open within 1-2 hours.`,
      reasoning: "AI detected rising temperature trend approaching the 50°F threshold required for R-Mer Seal underlayment. Historical patterns suggest this window will remain open for 4-6 hours.",
      actionItems: [
        "Prepare R-Mer Seal materials for staging",
        "Brief crew on metal panel area priorities",
        "Monitor temp every 30 minutes"
      ],
      confidence: 85,
      learnMore: "R-Mer Seal requires minimum 50°F for proper adhesion. Rising temps in the 45-50°F range typically indicate a viable work window within 1-2 hours.",
      relatedAssemblies: ["R-Mer Seal", "Metal Panel System"],
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
    });
  }

  if (currentConditions.tempTrend === "falling" && systemGo) {
    insights.push({
      id: "temp-falling-warning",
      type: "warning",
      category: "temperature",
      priority: 1,
      title: "Closing Weather Window",
      description: "Temperature is falling. Current installation window may close soon.",
      reasoning: "AI analysis shows temperature declining. Recommend completing active adhesive applications within the next 2 hours to ensure proper cure time before temperatures drop below specification limits.",
      actionItems: [
        "Prioritize completing in-progress adhesive work",
        "Do not start new Green-Lock Plus applications",
        "Document current material placements"
      ],
      confidence: 80,
      learnMore: "Falling temperatures can trap adhesives in an uncured state. Complete all active applications before temps drop below 40°F.",
      relatedAssemblies: ["Green-Lock Plus", "Base Sheet", "Cap Sheet"],
      critical: currentConditions.temp < 45
    });
  }

  // Insight: Precipitation risk
  if (currentConditions.precipProbability > 30 && currentConditions.precipProbability <= 50) {
    insights.push({
      id: "precip-watch",
      type: "warning",
      category: "precipitation",
      priority: 2,
      title: "Precipitation Watch",
      description: `${currentConditions.precipProbability}% chance of precipitation detected.`,
      reasoning: "AI weather analysis indicates moderate precipitation risk. While installation can proceed, recommend having tarps and protection materials staged for rapid deployment.",
      actionItems: [
        "Stage protective tarps near active work areas",
        "Prioritize work that can be quickly protected",
        "Assign spotter to monitor sky conditions"
      ],
      confidence: 75,
      snoozable: true
    });
  }

  if (currentConditions.precipProbability > 50) {
    insights.push({
      id: "precip-likely",
      type: "risk",
      category: "precipitation",
      priority: 1,
      title: "High Precipitation Probability",
      description: `${currentConditions.precipProbability}% chance of precipitation - recommend defensive posture.`,
      reasoning: "AI predicts high likelihood of precipitation. All weather-sensitive assemblies flagged NO-GO. Focus on interior work, material staging, or protected prep activities.",
      actionItems: [
        "Suspend exterior membrane work",
        "Focus on interior metal panel seaming if applicable",
        "Use time for material inventory and staging",
        "Review tomorrow's forecast for scheduling"
      ],
      confidence: 90,
      critical: currentConditions.precipProbability > 70
    });
  }

  // Insight: Optimal scheduling from forecast
  const tomorrowForecast = dailyForecasts[1];
  if (tomorrowForecast) {
    const tomorrowConditions = dailyToWeatherConditions(tomorrowForecast);
    const tomorrowResults = checkAllAssemblies(tomorrowConditions);
    const tomorrowGoCount = tomorrowResults.filter(r => r.compliant).length;
    const todayGoCount = assemblyResults.filter(r => r.compliant).length;

    if (tomorrowGoCount > todayGoCount) {
      insights.push({
        id: "better-tomorrow",
        type: "recommendation",
        category: "general",
        priority: 2,
        title: "Better Conditions Tomorrow",
        description: `Tomorrow shows ${tomorrowGoCount}/${ASSEMBLIES.length} assemblies GO vs today's ${todayGoCount}/${ASSEMBLIES.length}.`,
        reasoning: `AI forecast analysis indicates improved conditions tomorrow with high of ${Math.round(tomorrowForecast.high)}°F and ${tomorrowForecast.precipProbability}% precip chance. Consider shifting weather-sensitive work to tomorrow.`,
        actionItems: [
          "Focus today on prep work and staging",
          "Schedule critical adhesive work for tomorrow AM",
          "Ensure materials are properly stored overnight"
        ],
        confidence: 80,
        snoozable: true
      });
    }
  }

  // Insight: Wind conditions
  if (currentConditions.windSpeed > 15 && currentConditions.windSpeed <= 25) {
    insights.push({
      id: "wind-caution",
      type: "warning",
      category: "wind",
      priority: 2,
      title: "Elevated Wind Conditions",
      description: `Wind speed ${Math.round(currentConditions.windSpeed)} mph requires caution.`,
      reasoning: "AI safety analysis: Current winds are within spec but elevated. Large membrane sheets may be difficult to handle. Recommend additional crew for sheet handling and securing loose materials.",
      actionItems: [
        "Add crew members for membrane handling",
        "Secure all loose materials and equipment",
        "Consider pausing cap sheet installation if gusts exceed 30 mph"
      ],
      confidence: 85,
      relatedAssemblies: ["Cap Sheet", "Base Sheet"],
      snoozable: true
    });
  }

  if (currentConditions.windSpeed > 25) {
    insights.push({
      id: "wind-safety-hold",
      type: "risk",
      category: "safety",
      priority: 1,
      title: "High Wind Safety Alert",
      description: `Wind speed ${Math.round(currentConditions.windSpeed)} mph exceeds safe working limits.`,
      reasoning: "OSHA guidelines recommend suspending roofing operations when sustained winds exceed 25 mph due to fall risks and material handling hazards.",
      actionItems: [
        "Suspend all rooftop operations",
        "Secure all materials and equipment",
        "Relocate crew to ground-level tasks",
        "Monitor for wind reduction"
      ],
      confidence: 95,
      critical: true,
      relatedAssemblies: ASSEMBLIES.map(a => a.name)
    });
  }

  // Insight: Humidity impact
  if (currentConditions.humidity > 80) {
    insights.push({
      id: "high-humidity",
      type: "warning",
      category: "humidity",
      priority: 2,
      title: "High Humidity Alert",
      description: `Humidity at ${currentConditions.humidity}% may affect adhesive performance.`,
      reasoning: "AI material analysis: High humidity can extend cure times for cold-applied adhesives and may affect initial tack. Green-Lock Plus may require additional cure time before trafficking.",
      actionItems: [
        "Extend cure time before foot traffic",
        "Monitor adhesive tack more frequently",
        "Document humidity in daily log"
      ],
      confidence: 80,
      learnMore: "High humidity (>80%) can extend cold-applied adhesive cure times by 25-50%. Plan accordingly.",
      relatedAssemblies: ["Green-Lock Plus", "R-Mer Seal"],
      snoozable: true
    });
  }

  // Sort by priority and critical status
  return insights.sort((a, b) => {
    if (a.critical && !b.critical) return -1;
    if (!a.critical && b.critical) return 1;
    return a.priority - b.priority;
  });
}

// Generate optimal schedule recommendations
export function generateScheduleRecommendations(
  dailyForecasts: DailyForecast[]
): ScheduleRecommendation[] {
  const recommendations: ScheduleRecommendation[] = [];

  for (const assembly of ASSEMBLIES) {
    let bestDay: { forecast: DailyForecast; score: number; workWindow?: string } | null = null;
    let alternateDay: { forecast: DailyForecast; score: number } | null = null;

    for (const forecast of dailyForecasts.slice(0, 5)) {
      const conditions = dailyToWeatherConditions(forecast);
      const results = checkAllAssemblies(conditions);
      const result = results.find(r => r.assembly.id === assembly.id);

      if (result?.compliant) {
        // Score based on conditions (higher = better)
        let score = 50; // Base score for compliance

        // Bonus for warmer temps
        score += Math.min((forecast.high - 50) * 2, 20);

        // Bonus for low precip probability
        score += Math.max(0, (100 - forecast.precipProbability) / 5);

        // Bonus for low wind
        score += Math.max(0, (25 - forecast.maxWind));

        // Penalty for humidity
        score -= Math.max(0, (forecast.avgHumidity - 60) / 2);

        // Calculate work window
        let workWindow: string | undefined;
        if (forecast.hourlyData && forecast.hourlyData.length > 0) {
          const goodHours = forecast.hourlyData.filter(h => h.temp >= 50 && h.pop < 0.3);
          if (goodHours.length > 0) {
            const startHour = new Date(goodHours[0].dt * 1000).getHours();
            const endHour = new Date(goodHours[goodHours.length - 1].dt * 1000).getHours();
            workWindow = `${startHour}:00 - ${endHour}:00`;
          }
        }

        if (!bestDay || score > bestDay.score) {
          alternateDay = bestDay;
          bestDay = { forecast, score, workWindow };
        } else if (!alternateDay || score > alternateDay.score) {
          alternateDay = { forecast, score };
        }
      }
    }

    if (bestDay) {
      const dayName = bestDay.forecast.date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = bestDay.forecast.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      recommendations.push({
        assembly: assembly.name,
        recommendedDay: `${dayName}, ${dateStr}`,
        confidence: Math.min(95, Math.round(bestDay.score)),
        reason: `Optimal conditions: ${Math.round(bestDay.forecast.high)}°F high, ${bestDay.forecast.precipProbability}% precip risk, ${bestDay.forecast.maxWind}mph max wind`,
        alternateDay: alternateDay
          ? alternateDay.forecast.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
          : undefined,
        workWindow: bestDay.workWindow
      });
    } else {
      recommendations.push({
        assembly: assembly.name,
        recommendedDay: "No suitable day in forecast",
        confidence: 0,
        reason: "Weather conditions do not meet requirements within the 5-day forecast window"
      });
    }
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

// Generate daily risk assessments
export function generateRiskAssessments(
  dailyForecasts: DailyForecast[]
): DailyRiskAssessment[] {
  return dailyForecasts.slice(0, 5).map(forecast => {
    const factors: string[] = [];
    let riskScore = 0;
    let workableHours = 10; // Start with full 10-hour day

    // Temperature risk
    if (forecast.low < 40) {
      riskScore += 30;
      factors.push(`Low temp ${Math.round(forecast.low)}°F below 40°F threshold`);
      workableHours -= 3;
    } else if (forecast.low < 50) {
      riskScore += 15;
      factors.push(`Low temp ${Math.round(forecast.low)}°F limits some assemblies`);
      workableHours -= 1;
    }

    // Precipitation risk
    if (forecast.precipProbability > 70) {
      riskScore += 35;
      factors.push(`High precipitation probability (${forecast.precipProbability}%)`);
      workableHours -= 4;
    } else if (forecast.precipProbability > 40) {
      riskScore += 20;
      factors.push(`Moderate precipitation risk (${forecast.precipProbability}%)`);
      workableHours -= 2;
    } else if (forecast.precipProbability > 20) {
      riskScore += 10;
      factors.push(`Some precipitation chance (${forecast.precipProbability}%)`);
    }

    // Wind risk
    if (forecast.maxWind > 25) {
      riskScore += 25;
      factors.push(`High winds (${Math.round(forecast.maxWind)} mph) - safety concern`);
      workableHours -= 3;
    } else if (forecast.maxWind > 15) {
      riskScore += 10;
      factors.push(`Elevated winds (${Math.round(forecast.maxWind)} mph)`);
    }

    // Humidity risk
    if (forecast.avgHumidity > 85) {
      riskScore += 10;
      factors.push(`High humidity (${forecast.avgHumidity}%) affects cure times`);
    }

    // Determine risk level
    let overallRisk: RiskLevel;
    if (riskScore >= 60) overallRisk = "critical";
    else if (riskScore >= 40) overallRisk = "high";
    else if (riskScore >= 20) overallRisk = "moderate";
    else overallRisk = "low";

    // Determine best work window
    let bestWorkWindow: string | undefined;
    if (forecast.hourlyData && forecast.hourlyData.length > 0) {
      const goodHours = forecast.hourlyData.filter(h => h.temp >= 50 && h.pop < 0.3);
      if (goodHours.length > 0) {
        const startHour = new Date(goodHours[0].dt * 1000).getHours();
        const endHour = new Date(goodHours[goodHours.length - 1].dt * 1000).getHours();
        bestWorkWindow = `${startHour}:00 - ${endHour}:00`;
      }
    }

    if (factors.length === 0) {
      factors.push("Favorable conditions expected");
    }

    return {
      date: forecast.date,
      dayName: forecast.dayName,
      overallRisk,
      riskScore: Math.min(100, riskScore),
      factors,
      bestWorkWindow,
      workableHours: Math.max(0, workableHours)
    };
  });
}

// Generate executive summary
export function generateExecutiveSummary(
  conditions: WeatherConditions,
  assemblyResults: AssemblyResult[],
  dailyForecasts: DailyForecast[]
): string {
  const goCount = assemblyResults.filter(r => r.compliant).length;
  const totalCount = assemblyResults.length;
  const systemGo = goCount === totalCount;

  const riskAssessments = generateRiskAssessments(dailyForecasts);
  const goodDays = riskAssessments.filter(r => r.overallRisk === "low" || r.overallRisk === "moderate").length;

  const weatherPattern = detectWeatherPattern(dailyForecasts);
  const coatingWindow = detectCoatingWindow(dailyForecasts);

  let summary = "";

  if (systemGo) {
    summary = `All ${totalCount} roofing assemblies are cleared for installation. Current conditions: ${Math.round(conditions.temp)}°F, ${conditions.tempTrend} trend, ${conditions.precipProbability}% precipitation probability. `;
  } else {
    const failingNames = assemblyResults
      .filter(r => !r.compliant)
      .map(r => r.assembly.name)
      .join(", ");
    summary = `${goCount} of ${totalCount} assemblies are GO. Flagged: ${failingNames}. Current temp ${Math.round(conditions.temp)}°F. `;
  }

  summary += `5-day outlook: ${goodDays} favorable days for exterior work. `;

  if (weatherPattern.type === "ideal_conditions") {
    summary += "Weather pattern is ideal - maximize production. ";
  } else if (weatherPattern.type === "storm_approaching") {
    summary += "Storm system approaching - prepare for weather hold. ";
  } else if (conditions.tempTrend === "rising") {
    summary += "Temperature trend is positive - conditions may improve. ";
  } else if (conditions.tempTrend === "falling") {
    summary += "Temperature declining - prioritize time-sensitive work. ";
  }

  if (coatingWindow.available) {
    summary += "Coating window available this week. ";
  }

  return summary;
}

// Generate AI response for chat feature
export function generateAIResponse(
  question: string,
  conditions: WeatherConditions,
  assemblyResults: AssemblyResult[],
  dailyForecasts: DailyForecast[]
): string {
  const lowerQuestion = question.toLowerCase();

  // Can we work today?
  if (lowerQuestion.includes("work today") || lowerQuestion.includes("can we work") || lowerQuestion.includes("go today")) {
    const goCount = assemblyResults.filter(r => r.compliant).length;
    const totalCount = assemblyResults.length;

    if (goCount === totalCount) {
      return `Yes! All ${totalCount} assemblies are cleared for work today. Current conditions: ${Math.round(conditions.temp)}°F, ${conditions.precipProbability}% precipitation probability, ${Math.round(conditions.windSpeed)} mph wind. Proceed with installation.`;
    } else {
      const failing = assemblyResults.filter(r => !r.compliant).map(r => r.assembly.name);
      return `Partial work possible. ${goCount}/${totalCount} assemblies are GO. On hold: ${failing.join(", ")}. Consider focusing on compliant assemblies today.`;
    }
  }

  // Best day question
  if (lowerQuestion.includes("best day") || lowerQuestion.includes("when should")) {
    const bestDay = findBestWorkDay(dailyForecasts);
    if (bestDay) {
      return `${bestDay.day.dayName} is the best day this week with a score of ${bestDay.score}/100. Conditions: ${Math.round(bestDay.day.high)}°F high, ${bestDay.day.precipProbability}% precip chance. ${bestDay.reasons.join(". ")}.`;
    }
    return "Unable to determine best day - forecast data limited.";
  }

  // Coating/application questions
  if (lowerQuestion.includes("coating") || lowerQuestion.includes("pyramic")) {
    const coatingWindow = detectCoatingWindow(dailyForecasts);
    if (coatingWindow.available) {
      return `Yes, a coating window is available! ${coatingWindow.reason}. ${coatingWindow.duration} hour dry period with ${coatingWindow.confidence}% confidence. Prioritize Pyramic Plus application during this window.`;
    }
    return "No 24-hour dry window currently available for coating application. Monitor forecast for updates.";
  }

  // Weather pattern
  if (lowerQuestion.includes("weather pattern") || lowerQuestion.includes("forecast") || lowerQuestion.includes("week look")) {
    const pattern = detectWeatherPattern(dailyForecasts);
    return `Current pattern: ${pattern.type.replace(/_/g, " ")}. ${pattern.description}. Duration: ${pattern.duration}. Recommendation: ${pattern.recommendation}`;
  }

  // Temperature questions
  if (lowerQuestion.includes("temperature") || lowerQuestion.includes("temp") || lowerQuestion.includes("cold") || lowerQuestion.includes("warm")) {
    return `Current temperature: ${Math.round(conditions.temp)}°F, trending ${conditions.tempTrend}. Minimum for most adhesives: 40°F. Minimum for R-Mer Seal: 50°F. ${conditions.temp < 50 ? "Material pre-conditioning recommended." : "Temperatures are adequate for all assemblies."}`;
  }

  // Safety questions
  if (lowerQuestion.includes("safe") || lowerQuestion.includes("wind") || lowerQuestion.includes("danger")) {
    if (conditions.windSpeed > 25) {
      return `⚠️ CAUTION: Wind speed ${Math.round(conditions.windSpeed)} mph exceeds safe working limits. Suspend rooftop operations until winds decrease below 25 mph.`;
    }
    if (conditions.precipProbability > 70) {
      return `⚠️ High precipitation probability (${conditions.precipProbability}%). Roof surfaces may become slippery. Exercise caution and have fall protection in place.`;
    }
    return `Current conditions are within safe working parameters. Wind: ${Math.round(conditions.windSpeed)} mph, Precip: ${conditions.precipProbability}%. Standard safety protocols apply.`;
  }

  // Default response
  return `Based on current conditions (${Math.round(conditions.temp)}°F, ${conditions.precipProbability}% precip, ${Math.round(conditions.windSpeed)} mph wind), ${assemblyResults.filter(r => r.compliant).length}/${assemblyResults.length} assemblies are cleared for installation. Ask me about specific assemblies, best days to work, or coating windows for more detailed guidance.`;
}

// Generate quick question suggestions based on context
export function generateQuickQuestions(
  conditions: WeatherConditions,
  assemblyResults: AssemblyResult[],
  dailyForecasts: DailyForecast[]
): string[] {
  const questions: string[] = [];

  const goCount = assemblyResults.filter(r => r.compliant).length;
  const totalCount = assemblyResults.length;

  // Always include basic questions
  questions.push("Can we work today?");
  questions.push("What's the best day this week?");

  // Context-specific questions
  if (goCount < totalCount) {
    questions.push("Why are some assemblies on hold?");
  }

  if (conditions.temp < 55) {
    questions.push("Do we need to pre-condition materials?");
  }

  const coatingWindow = detectCoatingWindow(dailyForecasts);
  if (coatingWindow.available) {
    questions.push("When can we apply coating?");
  }

  if (conditions.windSpeed > 15) {
    questions.push("Is it safe to work in this wind?");
  }

  if (conditions.precipProbability > 30) {
    questions.push("What's the rain risk today?");
  }

  questions.push("What's the weather pattern this week?");

  return questions.slice(0, 6); // Return max 6 questions
}
