"use client";

import { useState, useEffect, useMemo } from "react";
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
  ASSEMBLIES,
  checkAllAssemblies,
  type AssemblyResult,
  type WeatherConditions
} from "@/lib/assemblies";
import {
  WeatherData,
  DailyForecast,
  toWeatherConditions,
  dailyToWeatherConditions
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
  DEMO_ITEMS,
  DEMO_ACTIVITY,
  ITEM_TYPE_CONFIG,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  STAKEHOLDER_CONFIG,
  type ProjectItem,
  type ActivityEntry
} from "@/lib/collaboration";
import { PROJECTS } from "@/lib/config";
import WeatherVisualization from "@/components/weather-viz";
import RealTimeStatus from "@/components/real-time-status";
import CrewSafety from "@/components/crew-safety";
import MaterialTracker from "@/components/material-tracker";
import ProjectProgress from "@/components/project-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  LayoutDashboard,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Brain,
  Sparkles,
  Lightbulb,
  Shield,
  Clock,
  Target,
  Zap,
  Activity,
  BarChart3,
  Users,
  MessageSquare,
  ClipboardList,
  AlertCircle,
  HelpCircle,
  FileCheck,
  Plus,
  Filter,
  Search,
  CalendarDays,
  Sun,
  CloudRain,
  Snowflake,
  HardHat,
  Hammer,
  Flame
} from "lucide-react";

// ========== PREMIUM ANIMATED COMPONENTS ==========

// Animated counter for smooth number transitions
function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start: number;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setDisplayValue(Math.round((1 - Math.pow(1 - p, 4)) * value));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span className="tabular-nums font-mono">{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

// Progress ring with animated fill
function ProgressRing({ progress, size = 64, color = "text-primary" }: { progress: number; size?: number; color?: string }) {
  const r = (size - 5) / 2;
  const c = r * 2 * Math.PI;
  const [p, setP] = useState(0);
  useEffect(() => { setTimeout(() => setP(progress), 100); }, [progress]);
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle className="text-muted/20" strokeWidth={5} stroke="currentColor" fill="transparent" r={r} cx={size/2} cy={size/2} />
        <circle className={`${color} transition-all duration-1000`} strokeWidth={5} strokeDasharray={c} strokeDashoffset={c - (p / 100) * c} strokeLinecap="round" stroke="currentColor" fill="transparent" r={r} cx={size/2} cy={size/2} style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
      </svg>
      <span className={`absolute text-sm font-bold ${color}`}>{Math.round(p)}%</span>
    </div>
  );
}

// Mini sparkline for trend visualization
function Sparkline({ data, color = "#22c55e", h = 28 }: { data: number[]; color?: string; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  const gid = useMemo(() => `s-${Math.random().toString(36).slice(2)}`, []);
  return (
    <svg viewBox={`0 0 100 ${h}`} className="w-full" preserveAspectRatio="none">
      <defs><linearGradient id={gid} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity="0.4" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} 100,${h}`} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Live clock with real-time updates
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="text-xs text-muted-foreground font-mono tabular-nums">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

type MainDashboardProps = {
  initialWeather: WeatherData;
  initialForecast: WeatherData[];
  dailyForecasts: DailyForecast[];
  defaultProject: typeof PROJECTS[0];
};

type TabId = "dashboard" | "calendar" | "intelligence" | "collaboration" | "documents";

// Demo work history data - in production this would come from database
const WORK_HISTORY: Record<string, { type: "worked" | "weather_hold" | "weekend" | "scheduled"; notes?: string; sqft?: number }> = {
  "2024-01-08": { type: "worked", notes: "Base sheet Area A - North section", sqft: 1200 },
  "2024-01-09": { type: "worked", notes: "Base sheet Area A - Center section", sqft: 1400 },
  "2024-01-10": { type: "weather_hold", notes: "Rain - 0.5\" precipitation" },
  "2024-01-11": { type: "worked", notes: "Base sheet Area A - South section", sqft: 1100 },
  "2024-01-12": { type: "worked", notes: "Completed Area A base sheet", sqft: 900 },
  "2024-01-13": { type: "weekend" },
  "2024-01-14": { type: "weekend" },
  "2024-01-15": { type: "weather_hold", notes: "Temp 32°F - Below adhesive threshold" },
  "2024-01-16": { type: "weather_hold", notes: "Temp 35°F - Below adhesive threshold" },
  "2024-01-17": { type: "worked", notes: "Cap sheet Area A - Started", sqft: 800 },
  "2024-01-18": { type: "worked", notes: "Cap sheet Area A - Progress", sqft: 1100 },
  "2024-01-19": { type: "worked", notes: "Cap sheet Area A - Complete, flashings started", sqft: 600 },
  "2024-01-20": { type: "weekend" },
  "2024-01-21": { type: "weekend" },
  "2024-01-22": { type: "scheduled", notes: "Area B base sheet planned" },
  "2024-01-23": { type: "scheduled", notes: "Area B base sheet" },
  "2024-01-24": { type: "scheduled", notes: "Area B cap sheet" },
};

export default function MainDashboard({
  initialWeather,
  initialForecast,
  dailyForecasts,
  defaultProject
}: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [expandedAssemblies, setExpandedAssemblies] = useState<Set<string>>(new Set());
  const [lastUpdated] = useState(new Date());

  const conditions = toWeatherConditions(initialWeather, initialForecast);
  const assemblyResults = checkAllAssemblies(conditions);
  const aiInsights = generateAIInsights(conditions, assemblyResults, dailyForecasts);
  const scheduleRecs = generateScheduleRecommendations(dailyForecasts);
  const riskAssessments = generateRiskAssessments(dailyForecasts);
  const executiveSummary = generateExecutiveSummary(conditions, assemblyResults, dailyForecasts);

  const systemCompliant = assemblyResults.every(r => r.compliant);
  const failingAssemblies = assemblyResults.filter(r => !r.compliant);
  const goCount = assemblyResults.filter(r => r.compliant).length;

  const toggleAssembly = (id: string) => {
    const next = new Set(expandedAssemblies);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedAssemblies(next);
  };

  // Calculate project stats
  const openItems = DEMO_ITEMS.filter(i => i.status === "open" || i.status === "in_progress").length;
  const criticalItems = DEMO_ITEMS.filter(i => i.priority === "critical" || i.priority === "high").length;

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
          Project Calendar
        </TabButton>
        <TabButton active={activeTab === "collaboration"} onClick={() => setActiveTab("collaboration")} icon={<Users className="w-4 h-4" />} badge={openItems}>
          Collaboration
        </TabButton>
        <TabButton active={activeTab === "documents"} onClick={() => setActiveTab("documents")} icon={<FolderOpen className="w-4 h-4" />}>
          Documents
        </TabButton>
      </motion.div>

      {/* VIEWS */}
      {activeTab === "dashboard" && (
        <DashboardView
          conditions={conditions}
          weather={initialWeather}
          hourlyForecast={initialForecast}
          assemblyResults={assemblyResults}
          systemCompliant={systemCompliant}
          failingAssemblies={failingAssemblies}
          goCount={goCount}
          expandedAssemblies={expandedAssemblies}
          toggleAssembly={toggleAssembly}
          project={defaultProject}
          executiveSummary={executiveSummary}
          topInsights={aiInsights.slice(0, 2)}
          openItems={openItems}
          criticalItems={criticalItems}
        />
      )}

      {activeTab === "intelligence" && (
        <IntelligenceView
          insights={aiInsights}
          scheduleRecs={scheduleRecs}
          riskAssessments={riskAssessments}
          conditions={conditions}
        />
      )}

      {activeTab === "calendar" && (
        <ProjectCalendarView
          dailyForecasts={dailyForecasts}
          riskAssessments={riskAssessments}
          workHistory={WORK_HISTORY}
        />
      )}

      {activeTab === "collaboration" && (
        <CollaborationView
          items={DEMO_ITEMS}
          activity={DEMO_ACTIVITY}
        />
      )}

      {activeTab === "documents" && <DocumentsView />}
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

// ========== DASHBOARD VIEW ==========
function DashboardView({ conditions, weather, hourlyForecast, assemblyResults, systemCompliant, failingAssemblies, goCount, expandedAssemblies, toggleAssembly, project, executiveSummary, topInsights, openItems, criticalItems }: {
  conditions: WeatherConditions; weather: WeatherData; hourlyForecast: WeatherData[]; assemblyResults: AssemblyResult[]; systemCompliant: boolean;
  failingAssemblies: AssemblyResult[]; goCount: number; expandedAssemblies: Set<string>; toggleAssembly: (id: string) => void;
  project: typeof PROJECTS[0]; executiveSummary: string; topInsights: AIInsight[]; openItems: number; criticalItems: number;
}) {
  const TrendIcon = conditions.tempTrend === "rising" ? TrendingUp : conditions.tempTrend === "falling" ? TrendingDown : Minus;
  const trendColor = conditions.tempTrend === "rising" ? "text-emerald-400" : conditions.tempTrend === "falling" ? "text-rose-400" : "text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* WEATHER VISUALIZATION */}
      <WeatherVisualization
        current={weather}
        hourlyForecast={hourlyForecast}
      />

      {/* SYSTEM STATUS */}
      <div className={`relative overflow-hidden rounded-xl border-2 ${systemCompliant ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5' : 'border-rose-500/50 bg-gradient-to-br from-rose-500/10 to-rose-500/5'}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-32 translate-x-32" />
        <div className="relative p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl ${systemCompliant ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                {systemCompliant ? <CheckCircle2 className="w-16 h-16 text-emerald-500" /> : <XCircle className="w-16 h-16 text-rose-500" />}
              </div>
              <div>
                <h2 className={`text-4xl font-black tracking-tight ${systemCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {systemCompliant ? "ALL SYSTEMS GO" : "SYSTEM HOLD"}
                </h2>
                <p className="text-lg text-muted-foreground mt-1">{goCount}/{assemblyResults.length} Assemblies Cleared</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-purple-400" /> AI Confidence: High
                  </span>
                  <span className="flex items-center gap-1 text-sm text-amber-400">
                    <AlertCircle className="w-4 h-4" /> {openItems} Open Items
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickStat label="Temp" value={`${Math.round(conditions.temp)}°F`} trend={<TrendIcon className={`w-4 h-4 ${trendColor}`} />} />
              <QuickStat label="Wind" value={`${Math.round(conditions.windSpeed)} mph`} alert={conditions.windSpeed > 20} />
              <QuickStat label="Precip" value={`${conditions.precipProbability}%`} alert={conditions.precipProbability > 40} />
              <QuickStat label="Humidity" value={`${conditions.humidity}%`} alert={conditions.humidity > 80} />
            </div>
          </div>
        </div>
      </div>

      {/* AI SUMMARY + PROJECT MAP */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">AI Analysis</div>
                <p className="text-sm leading-relaxed">{executiveSummary}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              Project Location
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
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

      {/* INSIGHTS PREVIEW */}
      {topInsights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {topInsights.map(insight => <InsightCard key={insight.id} insight={insight} compact />)}
        </div>
      )}

      {/* ASSEMBLY STATUS */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Assembly Status</span>
            <Badge variant="outline" className="font-mono">{goCount}/{assemblyResults.length} GO</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assemblyResults.map(result => (
            <AssemblyRow key={result.assembly.id} result={result} expanded={expandedAssemblies.has(result.assembly.id)} onToggle={() => toggleAssembly(result.assembly.id)} />
          ))}
        </CardContent>
      </Card>

      {/* FLAGGED */}
      {!systemCompliant && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-5 h-5" />Installation Hold - Flagged Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {failingAssemblies.map(result => (
                <div key={result.assembly.id} className="border-b border-rose-500/20 pb-4 last:border-0">
                  <div className="font-semibold text-rose-300 mb-2">{result.assembly.name}</div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {result.componentResults.filter(cr => !cr.compliant).map(cr => (
                      <div key={cr.component.id} className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/20">
                        <div className="font-medium text-sm">{cr.component.name}</div>
                        {cr.component.criticalNote && <div className="text-xs text-rose-300/70 mt-1 italic">{cr.component.criticalNote}</div>}
                        <div className="mt-2 space-y-1">
                          {cr.reasons.map((r, i) => <div key={i} className="flex items-center gap-2 text-xs text-rose-300"><XCircle className="w-3 h-3 flex-shrink-0" /> {r}</div>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OPERATIONS CENTER */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RealTimeStatus
          projectLocation={{ lat: project.lat, lon: project.lon, name: project.name }}
          assemblyGoCount={goCount}
          totalAssemblies={assemblyResults.length}
          systemCompliant={systemCompliant}
        />
        <CrewSafety weather={weather} />
      </div>

      {/* MATERIALS & PROGRESS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MaterialTracker
          currentTemp={weather.temp}
          windSpeed={weather.wind_speed}
          isPrecipitating={(weather.pop || 0) > 0.3}
        />
        <ProjectProgress />
      </div>
    </div>
  );
}

function QuickStat({ label, value, trend, alert }: { label: string; value: string; trend?: React.ReactNode; alert?: boolean; }) {
  return (
    <div className={`p-3 rounded-lg ${alert ? 'bg-amber-500/20' : 'bg-white/5'}`}>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold font-mono flex items-center gap-2">{value}{trend}</div>
    </div>
  );
}

function AssemblyRow({ result, expanded, onToggle }: { result: AssemblyResult; expanded: boolean; onToggle: () => void; }) {
  const passingCount = result.componentResults.filter(c => c.compliant).length;
  const totalCount = result.componentResults.length;
  return (
    <div className={`rounded-lg border transition-all ${result.compliant ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10'}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {result.compliant ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}
          <div>
            <div className="font-semibold">{result.assembly.name}</div>
            <div className="text-xs text-muted-foreground">{result.assembly.projectPhase}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground font-mono">{passingCount}/{totalCount}</div>
          <Badge className={result.compliant ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}>{result.compliant ? "GO" : "HOLD"}</Badge>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border/30 p-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {result.componentResults.map(cr => (
            <div key={cr.component.id} className={`flex items-start gap-2 p-2 rounded ${cr.compliant ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              {cr.compliant ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />}
              <div>
                <span className="text-sm font-medium">{cr.component.name}</span>
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
function IntelligenceView({ insights, scheduleRecs, riskAssessments, conditions }: {
  insights: AIInsight[]; scheduleRecs: ReturnType<typeof generateScheduleRecommendations>;
  riskAssessments: ReturnType<typeof generateRiskAssessments>; conditions: WeatherConditions;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
          <Brain className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">AI Intelligence Center</h2>
          <p className="text-sm text-muted-foreground">Real-time analysis, predictive insights, and smart recommendations</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-400" />Active Insights</h3>
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
        <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" />AI Schedule Optimization</CardTitle></CardHeader>
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
function ProjectCalendarView({ dailyForecasts, riskAssessments, workHistory }: {
  dailyForecasts: DailyForecast[]; riskAssessments: ReturnType<typeof generateRiskAssessments>;
  workHistory: Record<string, { type: string; notes?: string; sqft?: number }>;
}) {
  // Calculate stats
  const workedDays = Object.values(workHistory).filter(d => d.type === "worked").length;
  const weatherHoldDays = Object.values(workHistory).filter(d => d.type === "weather_hold").length;
  const totalSqft = Object.values(workHistory).filter(d => d.sqft).reduce((sum, d) => sum + (d.sqft || 0), 0);

  // Generate calendar days for January 2024
  const calendarDays = [];
  for (let i = 1; i <= 31; i++) {
    const date = new Date(2024, 0, i);
    const dateKey = date.toISOString().split('T')[0];
    calendarDays.push({ date, dateKey, data: workHistory[dateKey] });
  }

  return (
    <div className="space-y-6">
      {/* PROJECT STATS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Hammer className="w-8 h-8 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold">{workedDays}</div>
                <div className="text-sm text-muted-foreground">Days Worked</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CloudRain className="w-8 h-8 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{weatherHoldDays}</div>
                <div className="text-sm text-muted-foreground">Weather Holds</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalSqft.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">SF Installed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{Math.round((workedDays / (workedDays + weatherHoldDays)) * 100)}%</div>
                <div className="text-sm text-muted-foreground">Work Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CALENDAR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" />January 2024 - Project Calendar</span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500" /> Worked</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-500" /> Weather Hold</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-500" /> Weekend</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500" /> Scheduled</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for January 2024 starting on Monday */}
            <div className="aspect-square" />
            {calendarDays.map(({ date, dateKey, data }) => {
              const dayNum = date.getDate();
              const isToday = dayNum === 22;
              const typeColors: Record<string, string> = {
                worked: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
                weather_hold: "bg-amber-500/20 border-amber-500/50 text-amber-400",
                weekend: "bg-slate-500/20 border-slate-500/30 text-slate-400",
                scheduled: "bg-blue-500/20 border-blue-500/50 text-blue-400"
              };
              const bgClass = data ? typeColors[data.type] || "bg-muted/30" : "bg-muted/10";

              return (
                <div key={dateKey} className={`aspect-square p-1 rounded-lg border ${bgClass} ${isToday ? 'ring-2 ring-primary' : ''} hover:bg-white/10 transition-colors cursor-pointer group relative`}>
                  <div className="text-xs font-bold">{dayNum}</div>
                  {data?.sqft && <div className="text-[10px] text-muted-foreground">{data.sqft}sf</div>}
                  {data?.type === "weather_hold" && <CloudRain className="w-3 h-3 absolute bottom-1 right-1 text-amber-400" />}
                  {data?.type === "worked" && <Sun className="w-3 h-3 absolute bottom-1 right-1 text-emerald-400" />}
                  {/* Tooltip */}
                  {data?.notes && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-popover border border-border rounded-md p-2 text-xs shadow-lg whitespace-nowrap">
                        {data.notes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* FORECAST */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />5-Day Forecast</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {dailyForecasts.slice(0, 5).map((day, i) => {
              const conditions = dailyToWeatherConditions(day);
              const results = checkAllAssemblies(conditions);
              const goCount = results.filter(r => r.compliant).length;
              const risk = riskAssessments[i];
              return <ForecastCard key={day.date.toISOString()} day={day} goCount={goCount} total={results.length} isToday={i === 0} risk={risk} />;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ForecastCard({ day, goCount, total, isToday, risk }: {
  day: DailyForecast; goCount: number; total: number; isToday: boolean; risk: ReturnType<typeof generateRiskAssessments>[0];
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
        <div className="text-xs text-muted-foreground">GO</div>
      </CardContent>
    </Card>
  );
}

// ========== COLLABORATION VIEW ==========
function CollaborationView({ items, activity }: { items: ProjectItem[]; activity: ActivityEntry[]; }) {
  const [filter, setFilter] = useState<string>("all");

  const filteredItems = filter === "all" ? items : items.filter(i => i.type === filter || i.status === filter);
  const openCount = items.filter(i => i.status === "open").length;
  const inProgressCount = items.filter(i => i.status === "in_progress").length;
  const pendingCount = items.filter(i => i.status === "pending_review").length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Project Collaboration</h2>
            <p className="text-sm text-muted-foreground">Issues, RFIs, submittals and team coordination</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Item
        </button>
      </div>

      {/* QUICK STATS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setFilter("open")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20"><AlertCircle className="w-5 h-5 text-blue-500" /></div>
            <div><div className="text-2xl font-bold">{openCount}</div><div className="text-sm text-muted-foreground">Open</div></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setFilter("in_progress")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20"><Clock className="w-5 h-5 text-amber-500" /></div>
            <div><div className="text-2xl font-bold">{inProgressCount}</div><div className="text-sm text-muted-foreground">In Progress</div></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setFilter("pending_review")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20"><HelpCircle className="w-5 h-5 text-purple-500" /></div>
            <div><div className="text-2xl font-bold">{pendingCount}</div><div className="text-sm text-muted-foreground">Pending Review</div></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setFilter("all")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20"><ClipboardList className="w-5 h-5 text-emerald-500" /></div>
            <div><div className="text-2xl font-bold">{items.length}</div><div className="text-sm text-muted-foreground">Total Items</div></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ITEMS LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Active Items</h3>
            <div className="flex items-center gap-2">
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-muted border-border rounded-md px-3 py-1.5 text-sm">
                <option value="all">All Types</option>
                <option value="issue">Issues</option>
                <option value="rfi">RFIs</option>
                <option value="submittal">Submittals</option>
                <option value="delay">Delays</option>
                <option value="safety">Safety</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {filteredItems.map(item => <ProjectItemCard key={item.id} item={item} />)}
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <div>
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <Card className="bg-muted/20">
            <CardContent className="p-4 space-y-4">
              {activity.slice(0, 8).map(entry => (
                <div key={entry.id} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0">
                  <ActivityIcon type={entry.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{entry.title}</div>
                    <div className="text-xs text-muted-foreground">{entry.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {entry.actor} • {formatTimeAgo(entry.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProjectItemCard({ item }: { item: ProjectItem }) {
  const typeConfig = ITEM_TYPE_CONFIG[item.type];
  const statusConfig = STATUS_CONFIG[item.status];
  const priorityConfig = PRIORITY_CONFIG[item.priority];

  return (
    <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${typeConfig.color} text-white text-xs`}>{typeConfig.label}</Badge>
              <span className="text-xs text-muted-foreground font-mono">{item.id}</span>
              <Badge className={`${priorityConfig.color} text-xs`}>{priorityConfig.label}</Badge>
            </div>
            <h4 className="font-semibold mb-1">{item.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {item.assignedTo.map(s => STAKEHOLDER_CONFIG[s].label).join(", ")}
              </span>
              {item.dueDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Due {item.dueDate.toLocaleDateString()}
                </span>
              )}
              {item.comments.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {item.comments.length}
                </span>
              )}
            </div>
          </div>
          <Badge className={`${statusConfig.color} text-white`}>{statusConfig.label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ type }: { type: ActivityEntry["type"] }) {
  const icons: Record<ActivityEntry["type"], { icon: typeof Activity; color: string }> = {
    status_change: { icon: Activity, color: "text-blue-400" },
    comment: { icon: MessageSquare, color: "text-purple-400" },
    item_created: { icon: Plus, color: "text-emerald-400" },
    weather_alert: { icon: CloudRain, color: "text-amber-400" },
    document_uploaded: { icon: FileText, color: "text-cyan-400" },
    milestone: { icon: Target, color: "text-green-400" }
  };
  const config = icons[type];
  const Icon = config.icon;
  return <div className={`p-1.5 rounded-full bg-muted ${config.color}`}><Icon className="w-3 h-3" /></div>;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ========== DOCUMENTS VIEW ==========
function DocumentsView() {
  const projectDocs = [
    { category: "Specifications & Data Sheets", icon: FileText, docs: [
      { name: "Building 140 Roofing Specification", type: "PDF", size: "2.4 MB", date: "Jan 15, 2024" },
      { name: "Garland Green-Lock Plus TDS", type: "PDF", size: "892 KB", date: "Jan 10, 2024" },
      { name: "R-Mer Seal Installation Manual", type: "PDF", size: "1.8 MB", date: "Jan 10, 2024" },
    ]},
    { category: "Submittals & Drawings", icon: FolderOpen, docs: [
      { name: "Material Submittal Package - Approved", type: "PDF", size: "12.4 MB", date: "Jan 12, 2024" },
      { name: "Shop Drawings - Roof Details", type: "DWG", size: "4.2 MB", date: "Jan 8, 2024" },
    ]},
    { category: "Safety & Compliance", icon: Shield, docs: [
      { name: "Site-Specific Safety Plan", type: "PDF", size: "3.2 MB", date: "Jan 5, 2024" },
      { name: "Weather Compliance Log Template", type: "XLSX", size: "124 KB", date: "Jan 1, 2024" },
    ]},
    { category: "Warranty & QC", icon: CheckCircle2, docs: [
      { name: "Garland NDL Warranty Requirements", type: "PDF", size: "1.4 MB", date: "Jan 2, 2024" },
      { name: "Temperature Compliance Tracking", type: "XLSX", size: "234 KB", date: "Jan 1, 2024" },
    ]}
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><FolderOpen className="w-5 h-5 text-primary" />Project Documents</span>
            <Badge variant="outline" className="font-mono">Building 140</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {projectDocs.map(category => (
              <Card key={category.category} className="bg-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <category.icon className="w-4 h-4 text-primary" />{category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {category.docs.map(doc => (
                    <a key={doc.name} href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">{doc.type} • {doc.size} • {doc.date}</div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-primary" />Connected Platforms</h3>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { name: "Google Drive", desc: "Project Folder", color: "bg-blue-500" },
                { name: "Dropbox", desc: "Photo Uploads", color: "bg-sky-500" },
                { name: "Procore", desc: "Project Mgmt", color: "bg-orange-500" },
                { name: "PlanGrid", desc: "Field Drawings", color: "bg-emerald-500" },
              ].map(platform => (
                <a key={platform.name} href="#" className="flex items-center gap-3 p-4 bg-background rounded-lg border hover:border-primary transition-colors">
                  <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white font-bold`}>{platform.name[0]}</div>
                  <div>
                    <div className="font-medium text-sm">{platform.name}</div>
                    <div className="text-xs text-muted-foreground">{platform.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
