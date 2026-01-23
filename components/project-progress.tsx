"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  CloudRain,
  Flame,
  HardHat,
  Layers,
  MapPin,
  Target,
  TrendingUp,
  Zap,
  ChevronRight,
  X,
  AlertTriangle
} from "lucide-react";

// Types - kept for future production data integration
export type PhaseStatus = "complete" | "in_progress" | "not_started";
export type AreaStatus = "complete" | "in_progress" | "not_started";

export interface ProjectPhase {
  id: string;
  name: string;
  shortName: string;
  targetSF: number;
  completedSF: number;
  status: PhaseStatus;
  color: string;
  icon: typeof Layers;
}

export interface ProjectArea {
  id: string;
  name: string;
  totalSF: number;
  completedSF: number;
  status: AreaStatus;
  phases: {
    phaseId: string;
    status: PhaseStatus;
    completedSF: number;
    targetSF: number;
  }[];
}

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  status: "completed" | "current" | "upcoming";
  isWeatherDelay?: boolean;
}

// Kept for future use when production data is integrated
export interface ProductionStats {
  avgSFPerDay: number;
  bestDaySF: number;
  bestDayDate: Date;
  projectedCompletion: Date;
  totalDaysWorked: number;
  weatherDelayDays: number;
}

// Real project data derived from B140ACCT.csv work log
// NOTE: Square footage tracking data is not available from the accounting system
// Labor hours and days worked are REAL - SF completion tracking is PENDING integration
import { B140_WORK_LOG, getWorkLogStats } from "@/lib/work-log";

// Get real stats from actual work log data
const workLogStats = getWorkLogStats(B140_WORK_LOG);

// Project info - REAL data from work log, SF tracking PENDING
const B140_PROJECT_DATA = {
  // SF data pending - we track labor hours, not SF, in the accounting system
  // These would come from daily production reports (not yet integrated)
  totalSF: null as number | null, // PENDING: Production data integration
  completedSF: null as number | null, // PENDING: Production data integration
  startDate: new Date(2025, 3, 4), // April 4, 2025 - First work log entry
  // Contract end date removed per user request - has been extended

  // Phase tracking - PENDING production data integration
  // Current system tracks labor hours, not SF by phase
  phases: [] as ProjectPhase[],
  areas: [] as ProjectArea[],

  // Milestones - only actual events from work log, no projected dates
  milestones: [
    { id: "m1", name: "Mobilization", date: new Date(2025, 3, 4), status: "completed" as const },
    { id: "m2", name: "Material Delivery", date: new Date(2025, 7, 19), status: "completed" as const },
    { id: "m3", name: "Production Start", date: new Date(2025, 8, 19), status: "completed" as const },
  ] as Milestone[],

  // Stats from REAL work log data
  stats: {
    avgSFPerDay: null as number | null, // PENDING: Need SF tracking
    bestDaySF: null as number | null, // PENDING: Need SF tracking
    bestDayDate: null as Date | null, // PENDING: Need SF tracking
    projectedCompletion: null as Date | null, // PENDING: Schedule integration
    totalDaysWorked: workLogStats.totalDays,
    weatherDelayDays: null as number | null, // PENDING: Weather delay tracking
    // REAL labor data from accounting
    totalLaborHours: workLogStats.totalLaborHours,
    avgHoursPerDay: workLogStats.averageHoursPerDay,
    firstWorkedDate: workLogStats.firstWorkedDate,
    lastWorkedDate: workLogStats.lastWorkedDate,
  }
};

// Animated Progress Ring Component
function ProgressRing({
  percentage,
  size = 200,
  strokeWidth = 12,
  completedSF,
  totalSF,
  animate = true
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  completedSF: number;
  totalSF: number;
  animate?: boolean;
}) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  // Animation state management
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPercentage(percentage);
    }
  }, [percentage, animate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          {Math.round(animatedPercentage)}%
        </span>
        <span className="text-xs text-muted-foreground mt-1 font-mono">
          {completedSF.toLocaleString()} / {totalSF.toLocaleString()} SF
        </span>
      </div>
    </div>
  );
}

// Animated Phase Progress Bar Component
function PhaseProgressBar({
  phase,
  index,
  isVisible
}: {
  phase: ProjectPhase;
  index: number;
  isVisible: boolean;
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = (phase.completedSF / phase.targetSF) * 100;

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setAnimatedWidth(percentage);
      }, 100 + index * 150);
      return () => clearTimeout(timer);
    }
  }, [isVisible, percentage, index]);

  const statusColors = {
    complete: "text-emerald-400",
    in_progress: "text-amber-400",
    not_started: "text-muted-foreground"
  };

  const Icon = phase.icon;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", phase.color.replace("bg-", "bg-").concat("/20"))}>
            <Icon className={cn("w-4 h-4", phase.color.replace("bg-", "text-"))} />
          </div>
          <span className="font-medium text-sm">{phase.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">
            {phase.completedSF.toLocaleString()} / {phase.targetSF.toLocaleString()} SF
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              phase.status === "complete" && "border-emerald-500/50 text-emerald-400",
              phase.status === "in_progress" && "border-amber-500/50 text-amber-400",
              phase.status === "not_started" && "border-muted text-muted-foreground"
            )}
          >
            {phase.status === "complete" ? "Complete" :
             phase.status === "in_progress" ? "In Progress" : "Pending"}
          </Badge>
        </div>
      </div>
      <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
            phase.color
          )}
          style={{ width: `${animatedWidth}%` }}
        />
        {/* Shimmer effect for in-progress */}
        {phase.status === "in_progress" && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
            style={{ width: `${animatedWidth}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1">
        <span className={cn("text-xs font-mono", statusColors[phase.status])}>
          {Math.round(percentage)}%
        </span>
        {phase.status === "in_progress" && (
          <span className="text-xs text-muted-foreground">
            ~{Math.ceil((phase.targetSF - phase.completedSF) / 1050)} days remaining
          </span>
        )}
      </div>
    </div>
  );
}

// Area Grid Component with click details
function AreaGrid({
  areas,
  phases,
  onAreaClick
}: {
  areas: ProjectArea[];
  phases: ProjectPhase[];
  onAreaClick: (area: ProjectArea) => void;
}) {
  const statusColors = {
    complete: "bg-emerald-500",
    in_progress: "bg-amber-500",
    not_started: "bg-slate-600"
  };

  const statusBg = {
    complete: "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50",
    in_progress: "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50",
    not_started: "bg-slate-500/10 border-slate-500/30 hover:border-slate-500/50"
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {areas.map((area) => {
        const percentage = (area.completedSF / area.totalSF) * 100;
        return (
          <button
            key={area.id}
            onClick={() => onAreaClick(area)}
            className={cn(
              "relative p-4 rounded-xl border-2 transition-all duration-300 text-left group",
              statusBg[area.status]
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", statusColors[area.status])} />
                <span className="font-semibold">{area.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Mini progress for each phase */}
            <div className="space-y-1.5 mb-3">
              {area.phases.slice(0, 4).map((phaseData) => {
                const phase = phases.find(p => p.id === phaseData.phaseId);
                if (!phase) return null;
                const phasePercent = phaseData.targetSF > 0 ? (phaseData.completedSF / phaseData.targetSF) * 100 : 0;
                return (
                  <div key={phaseData.phaseId} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12 truncate">{phase.shortName}</span>
                    <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", phase.color)}
                        style={{ width: `${phasePercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right font-mono">
                      {Math.round(phasePercent)}%
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {area.totalSF.toLocaleString()} SF Total
              </span>
              <span className="text-sm font-bold font-mono">
                {Math.round(percentage)}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Area Detail Modal
function AreaDetailModal({
  area,
  phases,
  onClose
}: {
  area: ProjectArea | null;
  phases: ProjectPhase[];
  onClose: () => void;
}) {
  if (!area) return null;

  const percentage = (area.completedSF / area.totalSF) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">{area.name}</h3>
              <p className="text-sm text-muted-foreground">
                {area.totalSF.toLocaleString()} SF Total | {Math.round(percentage)}% Complete
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {area.phases.map((phaseData) => {
              const phase = phases.find(p => p.id === phaseData.phaseId);
              if (!phase) return null;
              const phasePercent = phaseData.targetSF > 0 ? (phaseData.completedSF / phaseData.targetSF) * 100 : 0;
              const Icon = phase.icon;

              return (
                <div key={phaseData.phaseId} className="p-3 rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", phase.color.replace("bg-", "text-"))} />
                      <span className="font-medium text-sm">{phase.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        phaseData.status === "complete" && "border-emerald-500/50 text-emerald-400",
                        phaseData.status === "in_progress" && "border-amber-500/50 text-amber-400",
                        phaseData.status === "not_started" && "border-muted text-muted-foreground"
                      )}
                    >
                      {phaseData.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={cn("absolute inset-y-0 left-0 rounded-full", phase.color)}
                      style={{ width: `${phasePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {phaseData.completedSF.toLocaleString()} / {phaseData.targetSF.toLocaleString()} SF
                    </span>
                    <span className="text-xs font-mono font-bold">
                      {Math.round(phasePercent)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Horizontal Timeline Component
function ProjectTimeline({ milestones }: { milestones: Milestone[] }) {
  const sortedMilestones = [...milestones].sort((a, b) => a.date.getTime() - b.date.getTime());
  // Use state to avoid hydration mismatch with Date
  const [today, setToday] = useState<Date | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setToday(new Date());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Calculate timeline span (use fallback date for SSR)
  const currentDate = today || new Date(2025, 0, 1); // Fixed fallback for SSR
  const startDate = sortedMilestones[0]?.date || currentDate;
  const endDate = sortedMilestones[sortedMilestones.length - 1]?.date || currentDate;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  const daysSinceStart = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercent = today ? Math.min(100, Math.max(0, (daysSinceStart / totalDays) * 100)) : 0;

  return (
    <div className="relative">
      {/* Timeline track */}
      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Current date marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg z-10 animate-pulse"
          style={{ left: `${progressPercent}%`, marginLeft: '-8px' }}
        />
      </div>

      {/* Milestones */}
      <div className="relative mt-4 flex justify-between">
        {sortedMilestones.map((milestone, index) => {
          const position = ((milestone.date.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;

          return (
            <div
              key={milestone.id}
              className="absolute flex flex-col items-center"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
              {/* Milestone dot */}
              <div
                className={cn(
                  "w-3 h-3 rounded-full border-2 transition-all",
                  milestone.status === "completed" && "bg-emerald-500 border-emerald-400",
                  milestone.status === "current" && "bg-primary border-primary animate-pulse",
                  milestone.status === "upcoming" && "bg-muted border-muted-foreground",
                  milestone.isWeatherDelay && "bg-amber-500 border-amber-400"
                )}
              />
              {/* Label (alternating top/bottom) */}
              <div className={cn(
                "absolute whitespace-nowrap text-xs",
                index % 2 === 0 ? "top-5" : "top-5"
              )}>
                {milestone.isWeatherDelay ? (
                  <div className="flex items-center gap-1 text-amber-400">
                    <CloudRain className="w-3 h-3" />
                    <span>{milestone.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                ) : (
                  <div className={cn(
                    "text-center",
                    milestone.status === "completed" && "text-emerald-400",
                    milestone.status === "current" && "text-primary font-bold",
                    milestone.status === "upcoming" && "text-muted-foreground"
                  )}>
                    <div className="font-medium truncate max-w-20">{milestone.name}</div>
                    <div className="text-muted-foreground">
                      {milestone.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Production Stats Cards
function ProductionStatsGrid({ stats }: { stats: ProductionStats }) {
  // Use state to avoid hydration mismatch with Date
  const [daysUntilCompletion, setDaysUntilCompletion] = useState<number | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDaysUntilCompletion(Math.ceil((stats.projectedCompletion.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  }, [stats.projectedCompletion]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{stats.avgSFPerDay.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Avg SF/Day</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{stats.bestDaySF.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Best Day Record</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{stats.totalDaysWorked}</div>
              <div className="text-xs text-muted-foreground">Days Worked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20">
              <CloudRain className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{stats.weatherDelayDays}</div>
              <div className="text-xs text-muted-foreground">Weather Delays</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono">
                {stats.projectedCompletion.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs text-muted-foreground">
                Projected ({daysUntilCompletion === null ? '...' : daysUntilCompletion > 0 ? `${daysUntilCompletion} days` : 'Overdue'})
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Real Labor Stats Cards - shows actual data from work log
function RealLaborStatsGrid({ stats }: { stats: typeof B140_PROJECT_DATA.stats }) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Calendar className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{stats.totalDaysWorked}</div>
              <div className="text-xs text-muted-foreground">Days Worked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{stats.totalLaborHours?.toLocaleString() || "—"}</div>
              <div className="text-xs text-muted-foreground">Total Labor Hours</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{stats.avgHoursPerDay?.toLocaleString() || "—"}</div>
              <div className="text-xs text-muted-foreground">Avg Hours/Day</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <HardHat className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono">{formatDate(stats.lastWorkedDate)}</div>
              <div className="text-xs text-muted-foreground">Last Worked</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Project Progress Component
export default function ProjectProgress() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const projectData = B140_PROJECT_DATA;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
          <BarChart3 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Project Progress</h2>
          <p className="text-sm text-muted-foreground">
            PSFB Building 140 Roof Replacement - Job #250001
          </p>
        </div>
      </div>

      {/* Data Validation Notice */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-400">Production Data Integration In Progress</div>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Labor hours and days worked are REAL</strong> (from B140ACCT accounting data).
                Square footage completion tracking requires daily production report integration - coming soon.
                Phase and area progress visualizations will be activated once production data is available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline - Actual milestones only */}
      {projectData.milestones.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Project Timeline (Actual Events)
              </span>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Completed
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-16">
            <ProjectTimeline milestones={projectData.milestones} />
          </CardContent>
        </Card>
      )}

      {/* Real Labor Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Labor Metrics (Real Data)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RealLaborStatsGrid stats={projectData.stats} />
        </CardContent>
      </Card>

      {/* Project Summary */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Project Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Project</div>
                <div className="font-semibold">PSFB Building 140 Roof Replacement</div>
                <div className="text-sm text-muted-foreground">Peterson Space Force Base, Colorado Springs</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Job Number</div>
                <div className="font-mono font-semibold">250001</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Work Started</div>
                <div className="font-semibold">{projectData.startDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Scope</div>
                <div className="font-semibold">Modified Bitumen + Standing Seam Metal</div>
                <div className="text-sm text-muted-foreground">Full roof system replacement</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</div>
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Active - In Progress
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Primary Material Supplier</div>
                <div className="font-semibold">Garland Company</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
