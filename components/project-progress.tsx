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

// Types
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

export interface ProductionStats {
  avgSFPerDay: number;
  bestDaySF: number;
  bestDayDate: Date;
  projectedCompletion: Date;
  totalDaysWorked: number;
  weatherDelayDays: number;
}

// Demo project data - In production this would come from the store/API
const DEMO_PROJECT_DATA = {
  totalSF: 45000,
  completedSF: 18750,
  startDate: new Date(2024, 0, 8),
  originalEndDate: new Date(2024, 2, 15),

  phases: [
    { id: "deck_prep", name: "Deck Preparation", shortName: "Deck", targetSF: 45000, completedSF: 45000, status: "complete" as PhaseStatus, color: "bg-slate-500", icon: HardHat },
    { id: "base_sheet", name: "Base Sheet Installation", shortName: "Base", targetSF: 45000, completedSF: 28500, status: "in_progress" as PhaseStatus, color: "bg-blue-500", icon: Layers },
    { id: "cap_sheet", name: "Cap Sheet Installation", shortName: "Cap", targetSF: 45000, completedSF: 12000, status: "in_progress" as PhaseStatus, color: "bg-emerald-500", icon: Layers },
    { id: "flashings", name: "Flashings & Penetrations", shortName: "Flash", targetSF: 8500, completedSF: 3200, status: "in_progress" as PhaseStatus, color: "bg-amber-500", icon: Zap },
    { id: "coatings", name: "Protective Coatings", shortName: "Coat", targetSF: 45000, completedSF: 0, status: "not_started" as PhaseStatus, color: "bg-purple-500", icon: Flame },
    { id: "metal_panels", name: "Metal Edge Panels", shortName: "Metal", targetSF: 4200, completedSF: 0, status: "not_started" as PhaseStatus, color: "bg-cyan-500", icon: Target },
  ] as ProjectPhase[],

  areas: [
    {
      id: "area_a",
      name: "Area A - North Wing",
      totalSF: 15000,
      completedSF: 12750,
      status: "in_progress" as AreaStatus,
      phases: [
        { phaseId: "deck_prep", status: "complete" as PhaseStatus, completedSF: 15000, targetSF: 15000 },
        { phaseId: "base_sheet", status: "complete" as PhaseStatus, completedSF: 15000, targetSF: 15000 },
        { phaseId: "cap_sheet", status: "in_progress" as PhaseStatus, completedSF: 9000, targetSF: 15000 },
        { phaseId: "flashings", status: "in_progress" as PhaseStatus, completedSF: 1800, targetSF: 2800 },
        { phaseId: "coatings", status: "not_started" as PhaseStatus, completedSF: 0, targetSF: 15000 },
        { phaseId: "metal_panels", status: "not_started" as PhaseStatus, completedSF: 0, targetSF: 1400 },
      ]
    },
    {
      id: "area_b",
      name: "Area B - Central",
      totalSF: 18000,
      completedSF: 6000,
      status: "in_progress" as AreaStatus,
      phases: [
        { phaseId: "deck_prep", status: "complete" as PhaseStatus, completedSF: 18000, targetSF: 18000 },
        { phaseId: "base_sheet", status: "in_progress" as PhaseStatus, completedSF: 13500, targetSF: 18000 },
        { phaseId: "cap_sheet", status: "in_progress" as PhaseStatus, completedSF: 3000, targetSF: 18000 },
        { phaseId: "flashings", status: "in_progress" as PhaseStatus, completedSF: 1400, targetSF: 3400 },
        { phaseId: "coatings", status: "not_started" as PhaseStatus, completedSF: 0, targetSF: 18000 },
        { phaseId: "metal_panels", status: "not_started" as PhaseStatus, completedSF: 0, targetSF: 1700 },
      ]
    },
    {
      id: "area_c",
      name: "Area C - South Wing",
      totalSF: 12000,
      completedSF: 0,
      status: "not_started" as AreaStatus,
      phases: [
        { phaseId: "deck_prep", status: "complete" as PhaseStatus, completedSF: 12000, targetSF: 12000 },
        { phaseId: "base_sheet", status: "not_started" as PhaseStatus, completedSF: 0, targetSF: 12000 },
        { phaseId: "cap_sheet", status: "not_started" as PhaseStatus, completedSF: 0, targetSF: 12000 },
        { phaseId: "flashings", status: "not_started" as PhaseStatus, completedSF: 0, targetSF: 2300 },
        { phaseId: "coatings", status: "not_started" as PhaseStatus, completedSF: 0, targetSF: 12000 },
        { phaseId: "metal_panels", status: "not_started" as PhaseStatus, completedSF: 0, targetSF: 1100 },
      ]
    }
  ] as ProjectArea[],

  milestones: [
    { id: "m1", name: "Project Kickoff", date: new Date(2024, 0, 8), status: "completed" as const },
    { id: "m2", name: "Deck Prep Complete", date: new Date(2024, 0, 12), status: "completed" as const },
    { id: "m3", name: "Area A Base Sheet", date: new Date(2024, 0, 19), status: "completed" as const },
    { id: "m4", name: "Weather Hold #1", date: new Date(2024, 0, 15), status: "completed" as const, isWeatherDelay: true },
    { id: "m5", name: "Weather Hold #2", date: new Date(2024, 0, 16), status: "completed" as const, isWeatherDelay: true },
    { id: "m6", name: "Area A Cap Sheet", date: new Date(2024, 0, 26), status: "current" as const },
    { id: "m7", name: "Area B Base Sheet", date: new Date(2024, 1, 2), status: "upcoming" as const },
    { id: "m8", name: "Area B Cap Sheet", date: new Date(2024, 1, 16), status: "upcoming" as const },
    { id: "m9", name: "Area C Complete", date: new Date(2024, 2, 1), status: "upcoming" as const },
    { id: "m10", name: "Final Inspection", date: new Date(2024, 2, 15), status: "upcoming" as const },
  ] as Milestone[],

  stats: {
    avgSFPerDay: 1050,
    bestDaySF: 1450,
    bestDayDate: new Date(2024, 0, 18),
    projectedCompletion: new Date(2024, 2, 22),
    totalDaysWorked: 9,
    weatherDelayDays: 4
  } as ProductionStats
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
  const today = new Date();

  // Calculate timeline span
  const startDate = sortedMilestones[0]?.date || today;
  const endDate = sortedMilestones[sortedMilestones.length - 1]?.date || today;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceStart = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.max(0, (daysSinceStart / totalDays) * 100));

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
  const daysUntilCompletion = Math.ceil((stats.projectedCompletion.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                Projected ({daysUntilCompletion > 0 ? `${daysUntilCompletion} days` : 'Overdue'})
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Project Progress Component
export default function ProjectProgress() {
  const [selectedArea, setSelectedArea] = useState<ProjectArea | null>(null);
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

  const projectData = DEMO_PROJECT_DATA;
  const overallPercentage = (projectData.completedSF / projectData.totalSF) * 100;

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
            Building 140 Roof Replacement - Real-time tracking
          </p>
        </div>
      </div>

      {/* Overall Progress + Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress Ring */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Overall Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <ProgressRing
              percentage={overallPercentage}
              completedSF={projectData.completedSF}
              totalSF={projectData.totalSF}
              animate={isVisible}
            />
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{projectData.phases.filter(p => p.status === "complete").length} Phases Done</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                <Clock className="w-4 h-4" />
                <span>{projectData.phases.filter(p => p.status === "in_progress").length} In Progress</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Stats */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Production Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductionStatsGrid stats={projectData.stats} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Phase Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Phase Progress
            </span>
            <Badge variant="outline" className="font-mono">
              {projectData.phases.filter(p => p.status === "complete").length}/{projectData.phases.length} Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {projectData.phases.map((phase, index) => (
            <PhaseProgressBar
              key={phase.id}
              phase={phase}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </CardContent>
      </Card>

      {/* Area Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Area Breakdown
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Complete
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                In Progress
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                Not Started
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AreaGrid
            areas={projectData.areas}
            phases={projectData.phases}
            onAreaClick={setSelectedArea}
          />
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Project Timeline
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Current
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <CloudRain className="w-3 h-3 text-amber-400" />
                Weather Delay
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-16">
          <ProjectTimeline milestones={projectData.milestones} />
        </CardContent>
      </Card>

      {/* Schedule Alert */}
      {projectData.stats.projectedCompletion > projectData.originalEndDate && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-400">Schedule Impact Detected</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Due to {projectData.stats.weatherDelayDays} weather delay days, the projected completion date
                  ({projectData.stats.projectedCompletion.toLocaleDateString()}) is {Math.ceil((projectData.stats.projectedCompletion.getTime() - projectData.originalEndDate.getTime()) / (1000 * 60 * 60 * 24))} days
                  beyond the original target ({projectData.originalEndDate.toLocaleDateString()}).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Area Detail Modal */}
      <AreaDetailModal
        area={selectedArea}
        phases={projectData.phases}
        onClose={() => setSelectedArea(null)}
      />
    </div>
  );
}
