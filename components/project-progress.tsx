"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  Clock,
  CloudRain,
  HardHat,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

// Types - kept for future production data integration
export type PhaseStatus = "complete" | "in_progress" | "not_started";

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  status: "completed" | "current" | "upcoming";
  isWeatherDelay?: boolean;
}

// Real project data derived from B140ACCT.csv work log
// NOTE: Square footage tracking data is not available from the accounting system
// Labor hours and days worked are REAL - SF completion tracking is PENDING integration
import { B140_WORK_LOG, getWorkLogStats } from "@/lib/work-log";

// Get real stats from actual work log data
const workLogStats = getWorkLogStats(B140_WORK_LOG);

// Project info - REAL data from work log, SF tracking PENDING
const B140_PROJECT_DATA = {
  startDate: new Date(2025, 3, 4), // April 4, 2025 - First work log entry

  // Milestones - only actual events from work log, no projected dates
  milestones: [
    { id: "m1", name: "Mobilization", date: new Date(2025, 3, 4), status: "completed" as const },
    { id: "m2", name: "Material Delivery", date: new Date(2025, 7, 19), status: "completed" as const },
    { id: "m3", name: "Production Start", date: new Date(2025, 8, 19), status: "completed" as const },
  ] as Milestone[],

  // Stats from REAL work log data
  stats: {
    totalDaysWorked: workLogStats.totalDays,
    totalLaborHours: workLogStats.totalLaborHours,
    avgHoursPerDay: workLogStats.averageHoursPerDay,
    firstWorkedDate: workLogStats.firstWorkedDate,
    lastWorkedDate: workLogStats.lastWorkedDate,
  }
};

// Horizontal Timeline Component
function ProjectTimeline({ milestones }: { milestones: Milestone[] }) {
  const sortedMilestones = [...milestones].sort((a, b) => a.date.getTime() - b.date.getTime());
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const currentDate = today || new Date(2025, 0, 1);
  const startDate = sortedMilestones[0]?.date || currentDate;
  const endDate = sortedMilestones[sortedMilestones.length - 1]?.date || currentDate;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  const daysSinceStart = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercent = today ? Math.min(100, Math.max(0, (daysSinceStart / totalDays) * 100)) : 0;

  return (
    <div className="relative">
      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg z-10 animate-pulse"
          style={{ left: `${progressPercent}%`, marginLeft: '-8px' }}
        />
      </div>

      <div className="relative mt-4 flex justify-between">
        {sortedMilestones.map((milestone, index) => {
          const position = ((milestone.date.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;

          return (
            <div
              key={milestone.id}
              className="absolute flex flex-col items-center"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full border-2 transition-all",
                  milestone.status === "completed" && "bg-emerald-500 border-emerald-400",
                  milestone.status === "current" && "bg-primary border-primary animate-pulse",
                  milestone.status === "upcoming" && "bg-muted border-muted-foreground",
                  milestone.isWeatherDelay && "bg-amber-500 border-amber-400"
                )}
              />
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
  const containerRef = useRef<HTMLDivElement>(null);
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
