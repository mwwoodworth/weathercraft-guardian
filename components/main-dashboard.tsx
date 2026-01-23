"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamically import map to avoid SSR issues with Leaflet
const ProjectMap = dynamic(() => import("@/components/project-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
      <span className="text-muted-foreground">Loading map...</span>
    </div>
  )
});
import {
  checkAllAssemblies,
  type AssemblyResult,
  type WeatherConditions
} from "@/lib/assemblies";
import {
  WeatherData,
  DailyForecast,
  getCurrentWeather,
  getForecast,
  groupForecastByDay,
  toWeatherConditions,
  dailyToWeatherConditions,
  forecastToWeatherConditionsArray
} from "@/lib/weather";
import {
  generateAIInsights,
  generateScheduleRecommendations,
  generateRiskAssessments,
  generateExecutiveSummary,
  type AIInsight,
  type RiskLevel
} from "@/lib/ai-insights";
import {
  B140_WORK_LOG,
  buildWorkLogMap,
  getWorkLogMonths,
  getWorkLogStats,
  type WorkLogEntry,
  type WorkLogStats
} from "@/lib/work-log";
import type { ProjectManifest } from "@/lib/project-types";
import { PROJECTS } from "@/lib/config";
import WeatherVisualization from "@/components/weather-viz";
import RealTimeStatus from "@/components/real-time-status";
import CrewSafety from "@/components/crew-safety";
import MaterialTracker from "@/components/material-tracker";
import ProjectProgress from "@/components/project-progress";
import ProjectHub from "@/components/project-hub";
import WinterWorkPlan from "@/components/winter-work-plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  LayoutDashboard,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Brain,
  Sparkles,
  Lightbulb,
  Shield,
  Clock,
  Target,
  Zap,
  Activity,
  BarChart3,
  CalendarDays,
  Snowflake,
  Hammer
} from "lucide-react";

// Live clock with real-time updates (hydration-safe)
function LiveClock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return <span className="text-xs text-muted-foreground font-mono tabular-nums">--:--:--</span>;
  }
  return (
    <span className="text-xs text-muted-foreground font-mono tabular-nums">
      {time}
    </span>
  );
}

type MainDashboardProps = {
  initialWeather: WeatherData;
  initialForecast: WeatherData[];
  dailyForecasts: DailyForecast[];
  defaultProject: typeof PROJECTS[0];
  projectManifest: ProjectManifest;
};

type TabId = "dashboard" | "calendar" | "intelligence" | "hub" | "winter";

export default function MainDashboard({
  initialWeather,
  initialForecast,
  dailyForecasts: initialDailyForecasts,
  defaultProject,
  projectManifest
}: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [expandedAssemblies, setExpandedAssemblies] = useState<Set<string>>(new Set());
  const [weather, setWeather] = useState<WeatherData>(initialWeather);
  const [forecast, setForecast] = useState<WeatherData[]>(initialForecast);
  const [dailyForecasts, setDailyForecasts] = useState<DailyForecast[]>(initialDailyForecasts);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(new Date());
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const refreshWeather = useCallback(async () => {
    setWeatherError(null);
    try {
      const [current, hourly] = await Promise.all([
        getCurrentWeather(defaultProject.lat, defaultProject.lon),
        getForecast(defaultProject.lat, defaultProject.lon)
      ]);
      setWeather(current);
      setForecast(hourly);
      setDailyForecasts(groupForecastByDay(hourly));
      setLastUpdated(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Weather update failed";
      setWeatherError(message);
    }
  }, [defaultProject.lat, defaultProject.lon]);

  // Initial data fetch on mount - legitimate async data fetching pattern
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    refreshWeather();
  }, [refreshWeather]);

  // Refresh weather when switching to weather-dependent tabs
  useEffect(() => {
    if (activeTab === "calendar" || activeTab === "winter") {
      refreshWeather();
    }
  }, [activeTab, refreshWeather]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const conditions = toWeatherConditions(weather, forecast);
  // Convert hourly forecast to WeatherConditions array for work window calculation
  const hourlyConditions = forecastToWeatherConditionsArray(forecast);
  const assemblyResults = checkAllAssemblies(conditions, hourlyConditions);
  const aiInsights = generateAIInsights(conditions, assemblyResults, dailyForecasts);
  const scheduleRecs = generateScheduleRecommendations(dailyForecasts);
  const riskAssessments = generateRiskAssessments(dailyForecasts);
  const executiveSummary = generateExecutiveSummary(conditions, assemblyResults, dailyForecasts);
  const workLog = B140_WORK_LOG;
  const workLogStats = useMemo(() => getWorkLogStats(workLog), [workLog]);

  // LABOR GREEN LIGHT requires: all components GO + full work window + lead time
  const systemCompliant = assemblyResults.every(r => r.laborGreenLight);
  const failingAssemblies = assemblyResults.filter(r => !r.laborGreenLight);
  const goCount = assemblyResults.filter(r => r.laborGreenLight).length;

  const toggleAssembly = (id: string) => {
    const next = new Set(expandedAssemblies);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedAssemblies(next);
  };

  // Project hub summary count for tab badge
  const openItems = projectManifest.rfis.length + projectManifest.submittals.length;

  return (
    <div className="space-y-6">
      {/* PREMIUM HEADER WITH GLASSMORPHISM */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl glass border border-white/10 p-5 lg:p-6"
      >
        {/* Animated background gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent rounded-full -translate-y-40 translate-x-40 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full translate-y-30 -translate-x-30 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Animated logo with glow */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />
              <div className="relative p-3.5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/30 backdrop-blur-sm">
                <Shield className="w-9 h-9 text-primary drop-shadow-lg" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">WEATHERCRAFT</span>
                <span className="text-primary drop-shadow-sm">GUARDIAN</span>
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
                <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>AI-Powered Roofing Operations Command Center</span>
                <span className="hidden sm:inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-xs font-semibold border border-purple-500/20">
                  <Sparkles className="w-3 h-3" /> v2.0
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Live status with pulsing indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
            {/* Project selector */}
            <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all duration-300 cursor-pointer backdrop-blur-sm group">
              <MapPin className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">{defaultProject.name}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            {/* Live clock */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <LiveClock />
            </div>
          </div>
        </div>
      </motion.div>

      {weatherError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-300" />
          <span>Weather API update failed. Displaying last known conditions.</span>
        </div>
      )}

      {/* PREMIUM TAB NAVIGATION */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-wrap gap-1.5 bg-gradient-to-r from-muted/40 via-muted/30 to-muted/40 p-1.5 rounded-xl w-fit border border-border/50 backdrop-blur-sm"
      >
        <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard className="w-4 h-4" />}>
          Mission Control
        </TabButton>
        <TabButton active={activeTab === "intelligence"} onClick={() => setActiveTab("intelligence")} icon={<Brain className="w-4 h-4" />} badge={aiInsights.filter(i => i.priority === 1).length}>
          AI Intelligence
        </TabButton>
        <TabButton active={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} icon={<CalendarDays className="w-4 h-4" />}>
          Work Log + Forecast
        </TabButton>
        <TabButton active={activeTab === "hub"} onClick={() => setActiveTab("hub")} icon={<FolderOpen className="w-4 h-4" />} badge={openItems}>
          Project Hub
        </TabButton>
        <TabButton active={activeTab === "winter"} onClick={() => setActiveTab("winter")} icon={<Snowflake className="w-4 h-4" />}>
          Winter Work Plan
        </TabButton>
      </motion.div>

      {/* VIEWS */}
      {activeTab === "dashboard" && (
        <DashboardView
          conditions={conditions}
          weather={weather}
          hourlyForecast={forecast}
          assemblyResults={assemblyResults}
          systemCompliant={systemCompliant}
          failingAssemblies={failingAssemblies}
          goCount={goCount}
          expandedAssemblies={expandedAssemblies}
          toggleAssembly={toggleAssembly}
          project={defaultProject}
          executiveSummary={executiveSummary}
          topInsights={aiInsights.slice(0, 2)}
          workLogStats={workLogStats}
          lastWeatherUpdate={lastUpdated}
          onRefresh={refreshWeather}
        />
      )}

      {activeTab === "intelligence" && (
        <IntelligenceView
          insights={aiInsights}
          scheduleRecs={scheduleRecs}
          riskAssessments={riskAssessments}
        />
      )}

      {activeTab === "calendar" && (
        <ProjectCalendarView
          dailyForecasts={dailyForecasts}
          workLog={workLog}
        />
      )}

      {activeTab === "hub" && <ProjectHub manifest={projectManifest} />}

      {activeTab === "winter" && (
        <WinterWorkPlan
          dailyForecasts={dailyForecasts}
          hourlyForecast={forecast}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, children, badge }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode; badge?: number;
}) {
  return (
    <button onClick={onClick} className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all
      ${active ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
      {icon}{children}
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">{badge}</span>
      )}
    </button>
  );
}

// ========== DASHBOARD VIEW WITH SUB-TABS ==========
type DashboardSubTab = "overview" | "compliance" | "operations" | "progress";

function DashboardView({ conditions, weather, hourlyForecast, assemblyResults, systemCompliant, failingAssemblies, goCount, expandedAssemblies, toggleAssembly, project, executiveSummary, topInsights, workLogStats, lastWeatherUpdate, onRefresh }: {
  conditions: WeatherConditions; weather: WeatherData; hourlyForecast: WeatherData[]; assemblyResults: AssemblyResult[]; systemCompliant: boolean;
  failingAssemblies: AssemblyResult[]; goCount: number; expandedAssemblies: Set<string>; toggleAssembly: (id: string) => void;
  project: typeof PROJECTS[0]; executiveSummary: string; topInsights: AIInsight[];
  workLogStats: WorkLogStats; lastWeatherUpdate?: Date; onRefresh?: () => void | Promise<void>;
}) {
  const [activeSubTab, setActiveSubTab] = useState<DashboardSubTab>("overview");
  const [showHoldDetails, setShowHoldDetails] = useState(false);
  const TrendIcon = conditions.tempTrend === "rising" ? TrendingUp : conditions.tempTrend === "falling" ? TrendingDown : Minus;
  const trendColor = conditions.tempTrend === "rising" ? "text-emerald-400" : conditions.tempTrend === "falling" ? "text-rose-400" : "text-muted-foreground";

  const issueCount = failingAssemblies.reduce((acc, r) => acc + r.componentResults.filter(cr => !cr.compliant).length, 0);

  return (
    <div className="space-y-4">
      {/* COMPACT SYSTEM STATUS HEADER - Always visible */}
      <div className={`relative overflow-hidden rounded-xl border ${systemCompliant ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'}`}>
        <div className="relative p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${systemCompliant ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                {systemCompliant ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-rose-500" />}
              </div>
              <div>
                <h2 className={`text-lg font-bold ${systemCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {systemCompliant ? "ALL SYSTEMS GO" : "SYSTEM HOLD"}
                </h2>
                <p className="text-xs text-muted-foreground">{goCount}/{assemblyResults.length} Assemblies • {project.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <QuickStat label="TEMP" value={`${Math.round(conditions.temp)}°`} trend={<TrendIcon className={`w-3 h-3 ${trendColor}`} />} />
              <QuickStat label="WIND" value={`${Math.round(conditions.windSpeed)}`} alert={conditions.windSpeed > 20} />
              <QuickStat label="PRECIP" value={`${conditions.precipProbability}%`} alert={conditions.precipProbability > 40} />
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB NAVIGATION */}
      <div className="flex flex-wrap gap-1 bg-muted/30 p-1 rounded-lg w-fit border border-border/30">
        <SubTabButton active={activeSubTab === "overview"} onClick={() => setActiveSubTab("overview")} icon={<LayoutDashboard className="w-3.5 h-3.5" />}>
          Overview
        </SubTabButton>
        <SubTabButton active={activeSubTab === "compliance"} onClick={() => setActiveSubTab("compliance")} icon={<Target className="w-3.5 h-3.5" />} badge={!systemCompliant ? issueCount : undefined}>
          Compliance
        </SubTabButton>
        <SubTabButton active={activeSubTab === "operations"} onClick={() => setActiveSubTab("operations")} icon={<Activity className="w-3.5 h-3.5" />}>
          Operations
        </SubTabButton>
        <SubTabButton active={activeSubTab === "progress"} onClick={() => setActiveSubTab("progress")} icon={<Hammer className="w-3.5 h-3.5" />}>
          Progress
        </SubTabButton>
      </div>

      {/* SUB-TAB CONTENT */}
      <AnimatePresence mode="wait">
        {activeSubTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
            {/* Weather Visualization */}
            <WeatherVisualization
              current={weather}
              hourlyForecast={hourlyForecast}
              sunrise={weather.sunrise}
              sunset={weather.sunset}
            />

            {/* AI Analysis + Map */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">AI ANALYSIS</div>
                      <p className="text-sm leading-relaxed">{executiveSummary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    Project Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <ProjectMap
                    lat={project.lat}
                    lon={project.lon}
                    projectName={project.name}
                    location={project.location}
                    systemStatus={systemCompliant ? "go" : failingAssemblies.length < assemblyResults.length / 2 ? "partial" : "no-go"}
                    currentTemp={conditions.temp}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Priority Alerts */}
            {topInsights.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {topInsights.map(insight => <InsightCard key={insight.id} insight={insight} compact />)}
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === "compliance" && (
          <motion.div key="compliance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
            {/* Assembly Status Grid */}
            <Card>
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-base"><Target className="w-4 h-4 text-primary" />Assembly Status</span>
                  <Badge variant="outline" className="font-mono text-xs">{goCount}/{assemblyResults.length} GO</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {assemblyResults.map(result => (
                  <AssemblyRow key={result.assembly.id} result={result} expanded={expandedAssemblies.has(result.assembly.id)} onToggle={() => toggleAssembly(result.assembly.id)} />
                ))}
              </CardContent>
            </Card>

            {/* Hold Details */}
            {!systemCompliant && (
              <Card className="border-rose-500/30 bg-rose-500/5">
                <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowHoldDetails(!showHoldDetails)}>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-rose-400 text-base">
                      <AlertTriangle className="w-4 h-4" />
                      Installation Hold - Flagged Components
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-rose-500/20 text-rose-300 text-xs">{issueCount} issues</Badge>
                      {showHoldDetails ? <ChevronDown className="w-4 h-4 text-rose-400" /> : <ChevronRight className="w-4 h-4 text-rose-400" />}
                    </div>
                  </CardTitle>
                </CardHeader>
                <AnimatePresence>
                  {showHoldDetails && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {failingAssemblies.map(result => (
                            <div key={result.assembly.id} className="border-b border-rose-500/20 pb-3 last:border-0 last:pb-0">
                              <div className="font-semibold text-rose-300 text-sm mb-2">{result.assembly.name}</div>
                              <div className="grid gap-2 md:grid-cols-2">
                                {result.componentResults.filter(cr => !cr.compliant).map(cr => (
                                  <div key={cr.component.id} className="bg-rose-500/10 rounded-lg p-2.5 border border-rose-500/20">
                                    <div className="font-medium text-xs">{cr.component.name}</div>
                                    {cr.component.criticalNote && <div className="text-[10px] text-rose-300/70 mt-0.5 italic">{cr.component.criticalNote}</div>}
                                    <div className="mt-1.5 space-y-0.5">
                                      {cr.reasons.map((r, i) => <div key={i} className="flex items-center gap-1.5 text-[10px] text-rose-300"><XCircle className="w-2.5 h-2.5 flex-shrink-0" /> {r}</div>)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}
          </motion.div>
        )}

        {activeSubTab === "operations" && (
          <motion.div key="operations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
            {/* Real-time status - full width at top */}
            <RealTimeStatus
              projectLocation={{ lat: project.lat, lon: project.lon, name: project.name }}
              lastWeatherUpdate={lastWeatherUpdate}
              assemblyGoCount={goCount}
              totalAssemblies={assemblyResults.length}
              systemCompliant={systemCompliant}
              workLogStats={workLogStats}
              onRefresh={onRefresh}
            />
            {/* Crew Safety - full width below */}
            <CrewSafety weather={weather} />
          </motion.div>
        )}

        {activeSubTab === "progress" && (
          <motion.div key="progress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
            {/* Project Progress - full width with timeline at top */}
            <ProjectProgress />
            {/* Material Tracker - full width below */}
            <MaterialTracker
              currentTemp={weather.temp}
              windSpeed={weather.wind_speed}
              isPrecipitating={(weather.pop || 0) > 0.3}
              tempTrend={conditions.tempTrend}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubTabButton({ active, onClick, icon, children, badge }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode; badge?: number;
}) {
  return (
    <button onClick={onClick} className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all
      ${active ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
      {icon}{children}
      {badge && badge > 0 && (
        <span className="ml-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">{badge}</span>
      )}
    </button>
  );
}

function QuickStat({ label, value, trend, alert }: { label: string; value: string; trend?: React.ReactNode; alert?: boolean; }) {
  return (
    <div className={`px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg ${alert ? 'bg-amber-500/20' : 'bg-white/5'}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-base lg:text-lg font-bold font-mono flex items-center gap-1">{value}{trend}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon, badge }: { title: string; subtitle?: string; icon?: React.ReactNode; badge?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-2 rounded-lg border border-white/10 bg-white/5 text-primary">
            {icon}
          </div>
        )}
        <div>
          <div className="text-lg font-semibold tracking-tight">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      {badge && <Badge variant="outline" className="font-mono">{badge}</Badge>}
    </div>
  );
}

function AssemblyRow({ result, expanded, onToggle }: { result: AssemblyResult; expanded: boolean; onToggle: () => void; }) {
  const passingCount = result.componentResults.filter(c => c.compliant).length;
  const totalCount = result.componentResults.length;

  // Determine display status: LABOR GO (green), HOLD (amber), NO-GO (red)
  const isLaborGo = result.laborGreenLight;
  const isPartialGo = result.compliant && !result.laborGreenLight; // Components OK but missing window/lead time

  const borderClass = isLaborGo
    ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
    : isPartialGo
    ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
    : 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10';

  const iconClass = isLaborGo
    ? 'text-emerald-500'
    : isPartialGo
    ? 'text-amber-500'
    : 'text-rose-500';

  const badgeClass = isLaborGo
    ? 'bg-emerald-500 text-white'
    : isPartialGo
    ? 'bg-amber-500 text-white'
    : 'bg-rose-500 text-white';

  const statusLabel = isLaborGo ? 'LABOR GO' : isPartialGo ? 'HOLD' : 'NO-GO';

  return (
    <div className={`rounded-lg border transition-all ${borderClass}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {isLaborGo ? <CheckCircle2 className={`w-5 h-5 ${iconClass}`} /> : isPartialGo ? <Clock className={`w-5 h-5 ${iconClass}`} /> : <XCircle className={`w-5 h-5 ${iconClass}`} />}
          <div>
            <div className="font-semibold">{result.assembly.name}</div>
            <div className="text-xs text-muted-foreground">{result.assembly.scopeType} • {result.assembly.minWorkWindowHours}hr min window</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground font-mono">{passingCount}/{totalCount}</div>
          <Badge className={badgeClass}>{statusLabel}</Badge>
        </div>
      </button>
      {/* Status message row */}
      <div className={`px-4 pb-2 text-sm ${isLaborGo ? 'text-emerald-400' : isPartialGo ? 'text-amber-400' : 'text-rose-400'}`}>
        {result.statusMessage}
        {result.workWindowHours > 0 && !isLaborGo && (
          <span className="ml-2 text-muted-foreground">({result.workWindowHours}hr window available)</span>
        )}
      </div>
      {expanded && (
        <div className="border-t border-border/30 p-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {result.componentResults.map(cr => (
            <div key={cr.component.id} className={`flex items-start gap-2 p-2 rounded ${cr.compliant ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              {cr.compliant ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />}
              <div>
                <span className="text-sm font-medium">{cr.component.name}</span>
                {cr.component.criticalNote && <div className="text-xs text-muted-foreground mt-0.5">{cr.component.criticalNote}</div>}
                {!cr.compliant && <div className="text-xs text-rose-400 mt-0.5">{cr.reasons.join(" • ")}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight, compact }: { insight: AIInsight; compact?: boolean }) {
  const typeConfig = {
    recommendation: { icon: Lightbulb, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
    warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
    opportunity: { icon: Sparkles, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
    risk: { icon: Shield, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" }
  };
  const config = typeConfig[insight.type];
  const Icon = config.icon;
  return (
    <Card className={`${config.bg} border`}>
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{insight.title}</span>
              {insight.priority === 1 && <Badge variant="destructive" className="text-xs">Priority</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
            {!compact && (
              <>
                <div className="text-xs text-muted-foreground/70 mb-3 italic"><Brain className="w-3 h-3 inline mr-1" />{insight.reasoning}</div>
                {insight.actionItems && (
                  <div className="space-y-1">
                    {insight.actionItems.map((item, i) => <div key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />{item}</div>)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== AI INTELLIGENCE VIEW ==========
function IntelligenceView({ insights, scheduleRecs, riskAssessments }: {
  insights: AIInsight[]; scheduleRecs: ReturnType<typeof generateScheduleRecommendations>;
  riskAssessments: ReturnType<typeof generateRiskAssessments>;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI Intelligence Center"
        subtitle="Real-time analysis, predictive insights, and smart recommendations."
        icon={<Brain className="w-4 h-4" />}
      />

      <div className="space-y-3">
        <SectionHeader title="Active Insights" subtitle="Priority findings and actionable recommendations." icon={<Lightbulb className="w-4 h-4 text-amber-400" />} />
        {insights.length > 0 ? (
          <div className="space-y-4">{insights.map(insight => <InsightCard key={insight.id} insight={insight} />)}</div>
        ) : (
          <Card className="bg-muted/30">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <div className="font-semibold">All Clear</div>
              <div className="text-sm text-muted-foreground">No issues or opportunities detected</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" />Schedule Optimization</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleRecs.map((rec, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium">{rec.assembly}</div>
                  <div className="text-sm text-muted-foreground">{rec.reason}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">{rec.recommendedDay}</div>
                  {rec.confidence > 0 && <div className="flex items-center gap-1 text-xs text-muted-foreground"><BarChart3 className="w-3 h-3" />{rec.confidence}% confidence</div>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-400" />5-Day Risk Assessment</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {riskAssessments.map((assessment, i) => <RiskCard key={i} assessment={assessment} isToday={i === 0} />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RiskCard({ assessment, isToday }: { assessment: ReturnType<typeof generateRiskAssessments>[0]; isToday: boolean; }) {
  const riskColors: Record<RiskLevel, string> = {
    low: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
    moderate: "bg-amber-500/20 border-amber-500/50 text-amber-400",
    high: "bg-orange-500/20 border-orange-500/50 text-orange-400",
    critical: "bg-rose-500/20 border-rose-500/50 text-rose-400"
  };
  return (
    <Card className={`${riskColors[assessment.overallRisk]} ${isToday ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4 text-center">
        <div className="font-bold text-lg">{isToday ? "TODAY" : assessment.dayName}</div>
        <div className="text-xs text-muted-foreground mb-2">{assessment.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        <div className="text-2xl font-black uppercase mb-2">{assessment.overallRisk}</div>
        <div className="text-xs text-muted-foreground">Risk Score: {assessment.riskScore}</div>
        {assessment.bestWorkWindow && <div className="text-xs mt-2 flex items-center justify-center gap-1"><Clock className="w-3 h-3" />{assessment.bestWorkWindow}</div>}
      </CardContent>
    </Card>
  );
}

// ========== PROJECT CALENDAR VIEW ==========
function ProjectCalendarView({ dailyForecasts, workLog }: {
  dailyForecasts: DailyForecast[];
  workLog: WorkLogEntry[];
}) {
  // Use fixed reference date for SSR consistency (work log stats don't need current date for display)
  const stats = useMemo(() => getWorkLogStats(workLog), [workLog]);
  const workLogMap = useMemo(() => buildWorkLogMap(workLog), [workLog]);
  const months = useMemo(() => getWorkLogMonths(workLog), [workLog]);

  const formatDate = (date?: string) => {
    if (!date) return "—";
    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const toISODateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Work Log + Forecast"
        subtitle="Actual production history with forward-looking weather impact."
        icon={<CalendarDays className="w-4 h-4" />}
      />

      {/* PROJECT STATS */}
      <SectionHeader
        title="Work Log Summary"
        subtitle="Actual days worked and labor hours captured to date."
        icon={<Activity className="w-4 h-4" />}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Hammer className="w-8 h-8 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalDays}</div>
                <div className="text-sm text-muted-foreground">Workdays Logged</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalLaborHours.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Labor Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.averageHoursPerDay.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Avg Hours / Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{formatDate(stats.lastWorkedDate)}</div>
                <div className="text-sm text-muted-foreground">Last Worked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CALENDAR */}
      <SectionHeader
        title="Work Log Calendar"
        subtitle="Daily activity snapshot by month."
        icon={<CalendarDays className="w-4 h-4" />}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Work Log Calendar ({formatDate(stats.firstWorkedDate)} – {formatDate(stats.lastWorkedDate)})
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500" /> Worked</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-500" /> No Log</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <div className="text-sm text-muted-foreground">No work log entries available.</div>
          ) : (
            <div className="space-y-6">
              {months.map(monthKey => {
                const [year, month] = monthKey.split("-").map(Number);
                const firstDay = new Date(year, month - 1, 1);
                const daysInMonth = new Date(year, month, 0).getDate();
                const startOffset = firstDay.getDay();
                const label = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                const days = Array.from({ length: daysInMonth }, (_, i) => {
                  const date = new Date(year, month - 1, i + 1);
                  const key = toISODateLocal(date);
                  return { date, key, entry: workLogMap.get(key) };
                });

                return (
                  <div key={monthKey} className="space-y-3">
                    <div className="text-sm font-semibold text-muted-foreground">{label}</div>
                    <div className="grid grid-cols-7 gap-2 text-xs">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="text-center font-semibold text-muted-foreground py-1">{day}</div>
                      ))}
                      {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`empty-${monthKey}-${i}`} className="aspect-square" />
                      ))}
                      {days.map(({ date, key, entry }) => {
                        const bgClass = entry ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-muted/10 border-border/40 text-muted-foreground";
                        return (
                          <div key={key} className={`aspect-square p-1 rounded-lg border ${bgClass} hover:bg-white/10 transition-colors relative`}>
                            <div className="text-[10px] font-semibold">{date.getDate()}</div>
                            {entry && (
                              <div className="text-[10px] text-emerald-200 mt-1">{entry.laborHours.toFixed(1)}h</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FORECAST */}
      <SectionHeader
        title="5-Day Forecast"
        subtitle="Weather-driven Go/No-Go outlook for assemblies."
        icon={<Calendar className="w-4 h-4" />}
      />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />5-Day Scope Forecast</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {dailyForecasts.slice(0, 5).map((day, i) => {
              const conditions = dailyToWeatherConditions(day);
              // Convert day's hourly data to WeatherConditions array for work window calculation
              const dayHourlyConditions = forecastToWeatherConditionsArray(day.hourlyData);
              const results = checkAllAssemblies(conditions, dayHourlyConditions);
              // Show how many scopes have a viable work window this day
              const goCount = results.filter(r => r.hasFullWorkWindow).length;
              return <ForecastCard key={day.date.toISOString()} day={day} goCount={goCount} total={results.length} isToday={i === 0} />;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ForecastCard({ day, goCount, total, isToday }: {
  day: DailyForecast; goCount: number; total: number; isToday: boolean;
}) {
  const allGo = goCount === total;
  const someGo = goCount > 0;
  return (
    <Card className={`overflow-hidden ${allGo ? 'border-emerald-500/50' : someGo ? 'border-amber-500/50' : 'border-rose-500/50'} ${isToday ? 'ring-2 ring-primary' : ''}`}>
      <div className={`h-1 ${allGo ? 'bg-emerald-500' : someGo ? 'bg-amber-500' : 'bg-rose-500'}`} />
      <CardContent className="p-4 text-center">
        <div className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>{isToday ? 'TODAY' : day.dayName}</div>
        <div className="text-xs text-muted-foreground mb-2">{day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        <img src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} alt={day.conditions} className="w-12 h-12 mx-auto" />
        <div className="font-mono text-sm">
          <span className="text-emerald-400">{Math.round(day.high)}°</span> / <span className="text-blue-400">{Math.round(day.low)}°</span>
        </div>
        <div className="text-xs text-muted-foreground capitalize mb-2">{day.conditions}</div>
        <div className={`text-2xl font-black ${allGo ? 'text-emerald-500' : someGo ? 'text-amber-500' : 'text-rose-500'}`}>{goCount}/{total}</div>
        <div className="text-xs text-muted-foreground">Scopes Viable</div>
      </CardContent>
    </Card>
  );
}
