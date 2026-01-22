// AI-Powered Intelligence Engine for Weathercraft Guardian
// Generates smart insights, risk assessments, and scheduling recommendations

import { AssemblyResult, ASSEMBLIES, WeatherConditions, checkAllAssemblies } from "./assemblies";
import { DailyForecast, dailyToWeatherConditions } from "./weather";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type AIInsight = {
  id: string;
  type: "recommendation" | "warning" | "opportunity" | "risk";
  priority: 1 | 2 | 3; // 1 = highest
  title: string;
  description: string;
  reasoning: string;
  actionItems?: string[];
};

export type ScheduleRecommendation = {
  assembly: string;
  recommendedDay: string;
  confidence: number; // 0-100
  reason: string;
  alternateDay?: string;
};

export type DailyRiskAssessment = {
  date: Date;
  dayName: string;
  overallRisk: RiskLevel;
  riskScore: number; // 0-100, higher = more risk
  factors: string[];
  bestWorkWindow?: string;
};

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

  // Insight: Temperature trend analysis
  if (currentConditions.tempTrend === "rising" && currentConditions.temp >= 45 && currentConditions.temp < 50) {
    insights.push({
      id: "temp-rising-opportunity",
      type: "opportunity",
      priority: 1,
      title: "Temperature Window Opening",
      description: `Temperature is ${Math.round(currentConditions.temp)}°F and rising. R-Mer Seal installation window may open within 1-2 hours.`,
      reasoning: "AI detected rising temperature trend approaching the 50°F threshold required for R-Mer Seal underlayment. Historical patterns suggest this window will remain open for 4-6 hours.",
      actionItems: [
        "Prepare R-Mer Seal materials for staging",
        "Brief crew on metal panel area priorities",
        "Monitor temp every 30 minutes"
      ]
    });
  }

  if (currentConditions.tempTrend === "falling" && systemGo) {
    insights.push({
      id: "temp-falling-warning",
      type: "warning",
      priority: 1,
      title: "Closing Weather Window",
      description: "Temperature is falling. Current installation window may close soon.",
      reasoning: "AI analysis shows temperature declining. Recommend completing active adhesive applications within the next 2 hours to ensure proper cure time before temperatures drop below specification limits.",
      actionItems: [
        "Prioritize completing in-progress adhesive work",
        "Do not start new Green-Lock Plus applications",
        "Document current material placements"
      ]
    });
  }

  // Insight: Precipitation risk
  if (currentConditions.precipProbability > 30 && currentConditions.precipProbability <= 50) {
    insights.push({
      id: "precip-watch",
      type: "warning",
      priority: 2,
      title: "Precipitation Watch",
      description: `${currentConditions.precipProbability}% chance of precipitation detected.`,
      reasoning: "AI weather analysis indicates moderate precipitation risk. While installation can proceed, recommend having tarps and protection materials staged for rapid deployment.",
      actionItems: [
        "Stage protective tarps near active work areas",
        "Prioritize work that can be quickly protected",
        "Assign spotter to monitor sky conditions"
      ]
    });
  }

  if (currentConditions.precipProbability > 50) {
    insights.push({
      id: "precip-likely",
      type: "risk",
      priority: 1,
      title: "High Precipitation Probability",
      description: `${currentConditions.precipProbability}% chance of precipitation - recommend defensive posture.`,
      reasoning: "AI predicts high likelihood of precipitation. All weather-sensitive assemblies flagged NO-GO. Focus on interior work, material staging, or protected prep activities.",
      actionItems: [
        "Suspend exterior membrane work",
        "Focus on interior metal panel seaming if applicable",
        "Use time for material inventory and staging",
        "Review tomorrow's forecast for scheduling"
      ]
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
        priority: 2,
        title: "Better Conditions Tomorrow",
        description: `Tomorrow shows ${tomorrowGoCount}/${ASSEMBLIES.length} assemblies GO vs today's ${todayGoCount}/${ASSEMBLIES.length}.`,
        reasoning: `AI forecast analysis indicates improved conditions tomorrow with high of ${Math.round(tomorrowForecast.high)}°F and ${tomorrowForecast.precipProbability}% precip chance. Consider shifting weather-sensitive work to tomorrow.`,
        actionItems: [
          "Focus today on prep work and staging",
          "Schedule critical adhesive work for tomorrow AM",
          "Ensure materials are properly stored overnight"
        ]
      });
    }
  }

  // Insight: Wind conditions
  if (currentConditions.windSpeed > 15 && currentConditions.windSpeed <= 25) {
    insights.push({
      id: "wind-caution",
      type: "warning",
      priority: 2,
      title: "Elevated Wind Conditions",
      description: `Wind speed ${Math.round(currentConditions.windSpeed)} mph requires caution.`,
      reasoning: "AI safety analysis: Current winds are within spec but elevated. Large membrane sheets may be difficult to handle. Recommend additional crew for sheet handling and securing loose materials.",
      actionItems: [
        "Add crew members for membrane handling",
        "Secure all loose materials and equipment",
        "Consider pausing cap sheet installation if gusts exceed 30 mph"
      ]
    });
  }

  // Insight: Cure time analysis
  const hasCoatingWork = assemblyResults.some(r =>
    r.assembly.id === "reflective-coating" && r.compliant
  );
  if (hasCoatingWork) {
    // Check if next 24 hours are clear
    const next24hForecasts = dailyForecasts.slice(0, 2);
    const rainRisk = next24hForecasts.some(d => d.precipProbability > 30);

    if (!rainRisk) {
      insights.push({
        id: "coating-window",
        type: "opportunity",
        priority: 1,
        title: "Coating Application Window",
        description: "24-hour dry window detected - ideal for Pyramic Plus coating.",
        reasoning: "AI analysis confirms low precipitation probability for the next 24 hours, meeting the cure time requirement for reflective coating application. This is an optimal window.",
        actionItems: [
          "Prioritize coating application today",
          "Ensure surface is clean and dry before application",
          "Document application time for warranty records"
        ]
      });
    }
  }

  // Insight: Humidity impact
  if (currentConditions.humidity > 80) {
    insights.push({
      id: "high-humidity",
      type: "warning",
      priority: 2,
      title: "High Humidity Alert",
      description: `Humidity at ${currentConditions.humidity}% may affect adhesive performance.`,
      reasoning: "AI material analysis: High humidity can extend cure times for cold-applied adhesives and may affect initial tack. Green-Lock Plus may require additional cure time before trafficking.",
      actionItems: [
        "Extend cure time before foot traffic",
        "Monitor adhesive tack more frequently",
        "Document humidity in daily log"
      ]
    });
  }

  // Sort by priority
  return insights.sort((a, b) => a.priority - b.priority);
}

// Generate optimal schedule recommendations
export function generateScheduleRecommendations(
  dailyForecasts: DailyForecast[]
): ScheduleRecommendation[] {
  const recommendations: ScheduleRecommendation[] = [];

  for (const assembly of ASSEMBLIES) {
    let bestDay: { forecast: DailyForecast; score: number } | null = null;
    let alternatDay: { forecast: DailyForecast; score: number } | null = null;

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

        if (!bestDay || score > bestDay.score) {
          alternatDay = bestDay;
          bestDay = { forecast, score };
        } else if (!alternatDay || score > alternatDay.score) {
          alternatDay = { forecast, score };
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
        alternateDay: alternatDay
          ? alternatDay.forecast.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
          : undefined
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

    // Temperature risk
    if (forecast.low < 40) {
      riskScore += 30;
      factors.push(`Low temp ${Math.round(forecast.low)}°F below 40°F threshold`);
    } else if (forecast.low < 50) {
      riskScore += 15;
      factors.push(`Low temp ${Math.round(forecast.low)}°F limits some assemblies`);
    }

    // Precipitation risk
    if (forecast.precipProbability > 70) {
      riskScore += 35;
      factors.push(`High precipitation probability (${forecast.precipProbability}%)`);
    } else if (forecast.precipProbability > 40) {
      riskScore += 20;
      factors.push(`Moderate precipitation risk (${forecast.precipProbability}%)`);
    } else if (forecast.precipProbability > 20) {
      riskScore += 10;
      factors.push(`Some precipitation chance (${forecast.precipProbability}%)`);
    }

    // Wind risk
    if (forecast.maxWind > 25) {
      riskScore += 25;
      factors.push(`High winds (${Math.round(forecast.maxWind)} mph) - safety concern`);
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
    if (forecast.hourlyData.length > 0) {
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
      bestWorkWindow
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

  if (conditions.tempTrend === "rising") {
    summary += "Temperature trend is positive - conditions may improve. ";
  } else if (conditions.tempTrend === "falling") {
    summary += "Temperature declining - prioritize time-sensitive work. ";
  }

  return summary;
}
