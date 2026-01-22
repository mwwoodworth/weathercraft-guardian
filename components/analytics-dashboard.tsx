"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  CloudRain,
  Thermometer,
  Clock,
  Target,
  Calendar,
  Zap,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Sun
} from "lucide-react";
import type { DailyForecast } from "@/lib/weather";
import type { WorkEntry, DailyLogEntry } from "@/lib/store";
import {
  type ProductionMetrics,
  type CrewEfficiency,
  type WeatherImpactMetrics,
  type ProjectMilestone,
  type TimelineVariance,
  type WeeklyProductionData,
  type MonthlyProductionData,
  type OptimalWorkWindow,
  calculateProductionMetrics,
  calculateCrewEfficiency,
  calculateWeatherImpact,
  calculateTimelineVariances,
  getWeeklyProduction,
  getMonthlyProduction,
  predictOptimalWorkWindows,
  formatNumber,
  formatCurrency,
  generateDemoProductionHistory,
  generateDemoDailyLogs,
  DEMO_MILESTONES
} from "@/lib/analytics";

// ============ ANIMATED COUNTER COMPONENT ============

function AnimatedCounter({
  value,
  duration = 2000,
  suffix = "",
  prefix = ""
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = 0;
    const endValue = value;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}

// ============ MAIN ANALYTICS DASHBOARD ============

type AnalyticsDashboardProps = {
  dailyForecasts: DailyForecast[];
  workEntries?: Record<string, WorkEntry>;
  dailyLogs?: DailyLogEntry[];
};

export default function AnalyticsDashboard({
  dailyForecasts,
  workEntries: propWorkEntries,
  dailyLogs: propDailyLogs
}: AnalyticsDashboardProps) {
  const [activeSection, setActiveSection] = useState<"production" | "weather" | "timeline">("production");

  // Use demo data if not provided
  const workEntries = propWorkEntries || generateDemoProductionHistory();
  const dailyLogs = propDailyLogs || generateDemoDailyLogs();
  const milestones = DEMO_MILESTONES;

  // Calculate all metrics
  const productionMetrics = calculateProductionMetrics(workEntries);
  const crewEfficiency = calculateCrewEfficiency(dailyLogs);
  const weatherImpact = calculateWeatherImpact(workEntries);
  const weeklyProduction = getWeeklyProduction(workEntries);
  const monthlyProduction = getMonthlyProduction(workEntries);
  const timelineVariances = calculateTimelineVariances(milestones, weatherImpact.totalWeatherHoldDays);
  const optimalWindows = predictOptimalWorkWindows(dailyForecasts);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
            <BarChart3 className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Advanced Analytics</h2>
            <p className="text-sm text-muted-foreground">Production metrics, weather impact, and project timeline</p>
          </div>
        </div>
        <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
          <SectionTab
            active={activeSection === "production"}
            onClick={() => setActiveSection("production")}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Production"
          />
          <SectionTab
            active={activeSection === "weather"}
            onClick={() => setActiveSection("weather")}
            icon={<CloudRain className="w-4 h-4" />}
            label="Weather Impact"
          />
          <SectionTab
            active={activeSection === "timeline"}
            onClick={() => setActiveSection("timeline")}
            icon={<Calendar className="w-4 h-4" />}
            label="Timeline"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === "production" && (
          <motion.div
            key="production"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProductionMetricsSection
              metrics={productionMetrics}
              crewEfficiency={crewEfficiency}
              weeklyProduction={weeklyProduction}
              monthlyProduction={monthlyProduction}
            />
          </motion.div>
        )}
        {activeSection === "weather" && (
          <motion.div
            key="weather"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WeatherImpactSection
              weatherImpact={weatherImpact}
              dailyForecasts={dailyForecasts}
              optimalWindows={optimalWindows}
            />
          </motion.div>
        )}
        {activeSection === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TimelineSection
              milestones={milestones}
              timelineVariances={timelineVariances}
              weatherImpact={weatherImpact}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionTab({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all
        ${active
          ? "bg-primary text-primary-foreground shadow-lg"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ============ PRODUCTION METRICS SECTION ============

function ProductionMetricsSection({
  metrics,
  crewEfficiency,
  weeklyProduction,
  monthlyProduction
}: {
  metrics: ProductionMetrics;
  crewEfficiency: CrewEfficiency;
  weeklyProduction: WeeklyProductionData[];
  monthlyProduction: MonthlyProductionData[];
}) {
  const TrendIcon = metrics.productionTrend === "increasing"
    ? TrendingUp
    : metrics.productionTrend === "decreasing"
      ? TrendingDown
      : Minus;
  const trendColor = metrics.productionTrend === "increasing"
    ? "text-emerald-400"
    : metrics.productionTrend === "decreasing"
      ? "text-rose-400"
      : "text-muted-foreground";

  const efficiencyColor =
    crewEfficiency.efficiencyRating === "excellent"
      ? "text-emerald-400"
      : crewEfficiency.efficiencyRating === "good"
        ? "text-blue-400"
        : crewEfficiency.efficiencyRating === "average"
          ? "text-amber-400"
          : "text-rose-400";

  return (
    <div className="space-y-6">
      {/* KEY METRICS - ANIMATED COUNTERS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Total SF Completed</p>
                <div className="text-4xl font-black mt-2">
                  <AnimatedCounter value={metrics.totalSqft} suffix=" SF" />
                </div>
                <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{metrics.trendPercentage > 0 ? "+" : ""}{metrics.trendPercentage}% trend</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-cyan-500/20">
                <BarChart3 className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Weekly Average</p>
                <div className="text-4xl font-black mt-2">
                  <AnimatedCounter value={metrics.weeklyAverage} suffix=" SF" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {metrics.dailyAverage} SF/day avg
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Crew Efficiency</p>
                <div className={`text-4xl font-black mt-2 ${efficiencyColor}`}>
                  {crewEfficiency.efficiencyScore}%
                </div>
                <p className="text-sm text-muted-foreground mt-2 capitalize">
                  {crewEfficiency.efficiencyRating.replace("_", " ")}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/20">
                <Gauge className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Peak Production</p>
                <div className="text-4xl font-black mt-2">
                  <AnimatedCounter value={metrics.peakDay.sqft} suffix=" SF" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {metrics.peakDay.date ? new Date(metrics.peakDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-500/20">
                <Zap className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Production Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              Weekly Production (SF)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyProduction}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar
                    dataKey="sqft"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Square Feet"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Production Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Monthly Production Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyProduction}>
                  <defs>
                    <linearGradient id="colorSqft" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sqft"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorSqft)"
                    strokeWidth={2}
                    name="Square Feet"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CREW EFFICIENCY DETAILS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Crew Efficiency Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground">SF per Crew Member</div>
              <div className="text-2xl font-bold mt-1">{crewEfficiency.sqftPerCrewMember}</div>
              <div className="text-xs text-muted-foreground mt-1">per day average</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground">SF per Hour</div>
              <div className="text-2xl font-bold mt-1">{crewEfficiency.sqftPerHour}</div>
              <div className="text-xs text-muted-foreground mt-1">crew productivity</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground">Average Crew Size</div>
              <div className="text-2xl font-bold mt-1">{crewEfficiency.averageCrewSize}</div>
              <div className="text-xs text-muted-foreground mt-1">workers</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground">vs Target</div>
              <div className={`text-2xl font-bold mt-1 ${crewEfficiency.comparisonToTarget >= 100 ? "text-emerald-400" : "text-amber-400"}`}>
                {crewEfficiency.comparisonToTarget}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">of 200 SF/crew/day</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ WEATHER IMPACT SECTION ============

function WeatherImpactSection({
  weatherImpact,
  dailyForecasts,
  optimalWindows
}: {
  weatherImpact: WeatherImpactMetrics;
  dailyForecasts: DailyForecast[];
  optimalWindows: OptimalWorkWindow[];
}) {
  const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

  // Prepare pie chart data
  const pieData = weatherImpact.holdsByReason.map((item, index) => ({
    name: item.reason,
    value: item.count,
    color: COLORS[index % COLORS.length]
  }));

  // Temperature trend data
  const tempData = dailyForecasts.slice(0, 7).map(forecast => ({
    day: forecast.dayName,
    high: Math.round(forecast.high),
    low: Math.round(forecast.low),
    avg: Math.round(forecast.avgTemp),
    threshold: 40
  }));

  return (
    <div className="space-y-6">
      {/* WEATHER IMPACT STATS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Weather Holds</p>
                <div className="text-4xl font-black mt-2 text-rose-400">
                  <AnimatedCounter value={weatherImpact.totalWeatherHoldDays} suffix=" days" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {weatherImpact.weatherHoldPercentage}% of work days
                </p>
              </div>
              <div className="p-3 rounded-full bg-rose-500/20">
                <CloudRain className="w-8 h-8 text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Est. Cost Impact</p>
                <div className="text-4xl font-black mt-2 text-amber-400">
                  {formatCurrency(weatherImpact.estimatedCostImpact)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  at $2,500/day standby
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-500/20">
                <DollarSign className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Longest Streak</p>
                <div className="text-4xl font-black mt-2 text-blue-400">
                  {weatherImpact.longestHoldStreak} days
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  consecutive hold
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <AlertTriangle className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Optimal Windows</p>
                <div className="text-4xl font-black mt-2 text-emerald-400">
                  {optimalWindows.filter(w => w.confidence >= 70).length}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  high confidence (7 days)
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/20">
                <Sun className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* HOLDS BY REASON PIE CHART */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CloudRain className="w-5 h-5 text-primary" />
              Weather Holds by Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* TEMPERATURE TREND ANALYSIS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Thermometer className="w-5 h-5 text-primary" />
              7-Day Temperature Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tempData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    domain={[20, 80]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="high"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                    name="High"
                  />
                  <Line
                    type="monotone"
                    dataKey="low"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                    name="Low"
                  />
                  <Line
                    type="monotone"
                    dataKey="threshold"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="40F Threshold"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OPTIMAL WORK WINDOWS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            Predicted Optimal Work Windows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {optimalWindows.slice(0, 6).map((window, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border transition-all hover:bg-muted/30 ${
                  window.confidence >= 80
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : window.confidence >= 60
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-muted bg-muted/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">
                    {window.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <Badge
                    className={
                      window.confidence >= 80
                        ? "bg-emerald-500"
                        : window.confidence >= 60
                          ? "bg-amber-500"
                          : "bg-slate-500"
                    }
                  >
                    {window.confidence}%
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {window.startHour}:00 - {window.endHour}:00 ({window.duration}hrs)
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Thermometer className="w-3 h-3" />
                    {window.temperature.min}F - {window.temperature.max}F
                  </div>
                  <div className="text-xs text-muted-foreground/70 capitalize mt-1">
                    {window.conditions}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MONTHLY TREND */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingDown className="w-5 h-5 text-primary" />
            Monthly Weather Hold Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weatherImpact.monthlyHoldTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar
                  dataKey="holds"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  name="Weather Hold Days"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ TIMELINE SECTION ============

function TimelineSection({
  milestones,
  timelineVariances,
  weatherImpact
}: {
  milestones: ProjectMilestone[];
  timelineVariances: TimelineVariance[];
  weatherImpact: WeatherImpactMetrics;
}) {
  return (
    <div className="space-y-6">
      {/* SUMMARY STATS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-3xl font-bold">
              {milestones.filter(m => m.status === "completed").length}
            </div>
            <div className="text-sm text-muted-foreground">Milestones Complete</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardContent className="p-6 text-center">
            <Activity className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-3xl font-bold">
              {milestones.filter(m => m.status === "in_progress").length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-3xl font-bold">
              {milestones.filter(m => m.status === "upcoming").length}
            </div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
      </div>

      {/* GANTT-STYLE PROGRESS BARS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            Project Timeline - Milestone Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <MilestoneProgressBar key={milestone.id} milestone={milestone} index={index} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SCHEDULE VARIANCE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Schedule Variance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Milestone</th>
                  <th className="text-center py-3 px-4 font-semibold">Planned</th>
                  <th className="text-center py-3 px-4 font-semibold">Actual</th>
                  <th className="text-center py-3 px-4 font-semibold">Variance</th>
                  <th className="text-center py-3 px-4 font-semibold">Weather Days</th>
                  <th className="text-center py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {timelineVariances.map((variance, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{variance.milestone}</td>
                    <td className="text-center py-3 px-4">{variance.plannedDays}d</td>
                    <td className="text-center py-3 px-4">{variance.actualDays}d</td>
                    <td className="text-center py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-mono ${
                        variance.variance > 0
                          ? "text-rose-400"
                          : variance.variance < 0
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                      }`}>
                        {variance.variance > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : variance.variance < 0 ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : null}
                        {variance.variance > 0 ? "+" : ""}{variance.variance}d
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-amber-400">{variance.weatherImpactDays}d</td>
                    <td className="text-center py-3 px-4">
                      <Badge className={
                        variance.variance <= 0
                          ? "bg-emerald-500"
                          : variance.variance <= 2
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }>
                        {variance.variance <= 0 ? "On Track" : variance.variance <= 2 ? "Minor Delay" : "Behind"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* WEATHER IMPACT ON SCHEDULE */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-rose-500/10 border-amber-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-500/20">
              <CloudRain className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Weather Impact Summary</h3>
              <p className="text-muted-foreground mb-4">
                Weather conditions have contributed to approximately{" "}
                <span className="font-bold text-amber-400">{weatherImpact.totalWeatherHoldDays} days</span>{" "}
                of schedule impact. This represents{" "}
                <span className="font-bold text-amber-400">{weatherImpact.weatherHoldPercentage}%</span>{" "}
                of potential work days and an estimated cost of{" "}
                <span className="font-bold text-amber-400">{formatCurrency(weatherImpact.estimatedCostImpact)}</span>.
              </p>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div className="p-3 rounded bg-background/50">
                  <div className="text-muted-foreground">Primary Cause</div>
                  <div className="font-semibold">
                    {weatherImpact.holdsByReason[0]?.reason || "N/A"} ({weatherImpact.holdsByReason[0]?.count || 0} days)
                  </div>
                </div>
                <div className="p-3 rounded bg-background/50">
                  <div className="text-muted-foreground">Longest Streak</div>
                  <div className="font-semibold">{weatherImpact.longestHoldStreak} consecutive days</div>
                </div>
                <div className="p-3 rounded bg-background/50">
                  <div className="text-muted-foreground">Current Trend</div>
                  <div className="font-semibold">
                    {weatherImpact.monthlyHoldTrend[weatherImpact.monthlyHoldTrend.length - 1]?.holds || 0} holds this month
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MilestoneProgressBar({
  milestone,
  index
}: {
  milestone: ProjectMilestone;
  index: number;
}) {
  const statusColors = {
    completed: { bg: "bg-emerald-500", text: "text-emerald-400" },
    in_progress: { bg: "bg-amber-500", text: "text-amber-400" },
    upcoming: { bg: "bg-blue-500", text: "text-blue-400" },
    delayed: { bg: "bg-rose-500", text: "text-rose-400" }
  };

  const colors = statusColors[milestone.status];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center text-white text-xs font-bold`}>
            {index + 1}
          </div>
          <div>
            <div className="font-medium">{milestone.name}</div>
            <div className="text-xs text-muted-foreground">
              Target: {milestone.targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {milestone.actualDate && (
                <> | Actual: {milestone.actualDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {milestone.sqftTarget && (
            <span className="text-sm text-muted-foreground">
              {formatNumber(milestone.sqftActual || 0)} / {formatNumber(milestone.sqftTarget)} SF
            </span>
          )}
          <Badge className={`${colors.bg} text-white`}>
            {milestone.percentComplete}%
          </Badge>
        </div>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colors.bg} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${milestone.percentComplete}%` }}
          transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
