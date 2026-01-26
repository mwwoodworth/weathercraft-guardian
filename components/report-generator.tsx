"use client";

import { useState, useMemo, useRef } from "react";
import { useGuardianStore, type WorkEntry, type DailyLogEntry, type WinterWorkPlan } from "@/lib/store";
import type { ProjectItem, ActivityEntry } from "@/lib/collaboration";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Card, CardContent, CardHeader, CardTitle available from @/components/ui/card if needed
// Badge available from @/components/ui/badge if needed
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// Select components available from @/components/ui/select if needed
import {
  FileText,
  Download,
  Printer,
  Mail,
  Calendar,
  CloudRain,
  Sun,
  Thermometer,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Hammer,
  Package,
  Shield,
  TrendingUp,
  FileCheck,
  Building2,
  MapPin,
  Loader2
} from "lucide-react";

// Report Types
type ReportType = "daily_summary" | "weekly_progress" | "weather_delay" | "material_usage";

interface ReportConfig {
  type: ReportType;
  label: string;
  description: string;
  icon: typeof FileText;
  color: string;
}

const REPORT_CONFIGS: Record<ReportType, ReportConfig> = {
  daily_summary: {
    type: "daily_summary",
    label: "Daily Summary Report",
    description: "Comprehensive daily work log with weather conditions, crew activity, and production metrics",
    icon: Calendar,
    color: "bg-blue-500"
  },
  weekly_progress: {
    type: "weekly_progress",
    label: "Weekly Progress Report",
    description: "Week-at-a-glance summary including total production, work days, and weather impacts",
    icon: BarChart3,
    color: "bg-emerald-500"
  },
  weather_delay: {
    type: "weather_delay",
    label: "Weather Delay Documentation",
    description: "Formal documentation of weather-related work stoppages for warranty compliance",
    icon: CloudRain,
    color: "bg-amber-500"
  },
  material_usage: {
    type: "material_usage",
    label: "Material Usage Report",
    description: "Tracking of materials used during project with quantities and dates",
    icon: Package,
    color: "bg-purple-500"
  }
};

interface ReportGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  projectLocation?: string;
}

export function ReportGenerator({
  open,
  onOpenChange,
  projectName = "Peterson Space Force Base - Bldg 140",
  projectLocation = "Peterson Space Force Base, Colorado Springs, CO"
}: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>("daily_summary");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const { workEntries, dailyLogs, items, activity, winterPlan } = useGuardianStore();

  const handleGenerateReport = () => {
    setIsGenerating(true);
    // Simulate generation time
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Use browser's print to PDF functionality
    window.print();
  };

  const handleEmailReport = () => {
    // Mock email - would integrate with email service in production
    alert("Report ready to send. Email integration would be configured here.");
  };

  const handleBack = () => {
    setShowPreview(false);
  };

  const config = REPORT_CONFIGS[reportType];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${showPreview ? 'sm:max-w-[900px]' : 'sm:max-w-[600px]'} max-h-[90vh] overflow-y-auto`}>
        {!showPreview ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Generate Professional Report
              </DialogTitle>
              <DialogDescription>
                Create formatted reports for project documentation, stakeholder communication, and warranty compliance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Report Type Selection */}
              <div className="space-y-3">
                <Label>Report Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(REPORT_CONFIGS) as ReportType[]).map((type) => {
                    const cfg = REPORT_CONFIGS[type];
                    const TypeIcon = cfg.icon;
                    const isSelected = reportType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setReportType(type)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${cfg.color}`}>
                            <TypeIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{cfg.label}</div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {cfg.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="report-date">
                  {reportType === "weekly_progress" ? "Week Of" : "Report Date"}
                </Label>
                <Input
                  id="report-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                {reportType === "weekly_progress" && (
                  <p className="text-xs text-muted-foreground">
                    Report will cover the week containing this date
                  </p>
                )}
              </div>

              {/* Project Info Preview */}
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">{projectName}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {projectLocation}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateReport} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon className={`w-5 h-5`} />
                  {config.label}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleBack}>
                    Back
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Report Preview */}
            <div ref={previewRef} className="report-preview border rounded-lg bg-white text-black overflow-hidden">
              <ReportPreview
                type={reportType}
                date={selectedDate}
                projectName={projectName}
                projectLocation={projectLocation}
                workEntries={workEntries}
                dailyLogs={dailyLogs}
                items={items}
                activity={activity}
                winterPlan={winterPlan}
              />
            </div>

            {/* Export Actions */}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2 flex-1">
                <Button variant="outline" onClick={handlePrint} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handleEmailReport} className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-preview, .report-preview * {
            visibility: visible;
          }
          .report-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .report-preview .print-break {
            page-break-before: always;
          }
        }
      `}</style>
    </Dialog>
  );
}

// ========== REPORT PREVIEW COMPONENT ==========
interface ReportPreviewProps {
  type: ReportType;
  date: string;
  projectName: string;
  projectLocation: string;
  workEntries: Record<string, WorkEntry>;
  dailyLogs: DailyLogEntry[];
  items: ProjectItem[];
  activity: ActivityEntry[];
  winterPlan: WinterWorkPlan | null;
}

function ReportPreview({
  type,
  date,
  projectName,
  projectLocation,
  workEntries,
  dailyLogs,
  items,
  activity,
  winterPlan
}: ReportPreviewProps) {
  // Common header for all reports - memoized JSX element
  const reportHeader = useMemo(() => {
    const generatedAt = new Date();
    return (
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">WEATHERCRAFT</div>
            <div className="text-sm text-gray-600">Commercial Roofing Contractors</div>
            <div className="text-xs text-gray-500 mt-1">
              Excellence in Weather-Compliant Roofing Solutions
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">{projectName}</div>
            <div className="text-xs text-gray-600">{projectLocation}</div>
            <div className="text-xs text-gray-500 mt-2">
              Generated: {format(generatedAt, "MMM d, yyyy h:mm a")}
            </div>
          </div>
        </div>
      </div>
    );
  }, [projectName, projectLocation]);

  // Render based on report type
  switch (type) {
    case "daily_summary":
      return <DailySummaryReport
        date={date}
        header={reportHeader}
        workEntries={workEntries}
        dailyLogs={dailyLogs}
        items={items}
        activity={activity}
      />;
    case "weekly_progress":
      return <WeeklyProgressReport
        date={date}
        header={reportHeader}
        workEntries={workEntries}
        dailyLogs={dailyLogs}
      />;
    case "weather_delay":
      return <WeatherDelayReport
        date={date}
        header={reportHeader}
        workEntries={workEntries}
        winterPlan={winterPlan}
        items={items}
      />;
    case "material_usage":
      return <MaterialUsageReport
        date={date}
        header={reportHeader}
        dailyLogs={dailyLogs}
      />;
    default:
      return null;
  }
}

// ========== DAILY SUMMARY REPORT ==========
function DailySummaryReport({
  date,
  header,
  workEntries,
  dailyLogs,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  items: _items,
  activity
}: {
  date: string;
  header: React.ReactNode;
  workEntries: Record<string, WorkEntry>;
  dailyLogs: DailyLogEntry[];
  items: ProjectItem[];
  activity: ActivityEntry[];
}) {
  const reportDate = parseISO(date);
  const dayEntry = workEntries[date];
  const dayLog = dailyLogs.find(log => log.date === date);

  // Get activity for this date
  const dayActivity = activity.filter(act => {
    const actDate = format(act.timestamp, "yyyy-MM-dd");
    return actDate === date;
  });

  return (
    <div className="p-6 space-y-6">
      {header}

      {/* Report Title */}
      <div className="text-center border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900">DAILY SUMMARY REPORT</h1>
        <p className="text-lg text-gray-700">{format(reportDate, "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Work Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Sun className="w-4 h-4" />
            Work Status
          </h3>
          {dayEntry ? (
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                dayEntry.type === "worked" ? "bg-green-100 text-green-800" :
                dayEntry.type === "weather_hold" ? "bg-amber-100 text-amber-800" :
                dayEntry.type === "weekend" ? "bg-gray-100 text-gray-800" :
                "bg-blue-100 text-blue-800"
              }`}>
                {dayEntry.type === "worked" && <CheckCircle2 className="w-4 h-4" />}
                {dayEntry.type === "weather_hold" && <CloudRain className="w-4 h-4" />}
                {dayEntry.type.replace("_", " ").toUpperCase()}
              </div>
              {dayEntry.notes && (
                <p className="text-sm text-gray-600">{dayEntry.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No entry recorded</p>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Production
          </h3>
          {dayLog ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Square Feet:</span>
                <span className="font-semibold">{dayLog.sqftCompleted.toLocaleString()} SF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hours Worked:</span>
                <span className="font-semibold">{dayLog.hoursWorked} hrs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Crew Count:</span>
                <span className="font-semibold">{dayLog.crewCount}</span>
              </div>
            </div>
          ) : dayEntry?.sqft ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Square Feet:</span>
              <span className="font-semibold">{dayEntry.sqft.toLocaleString()} SF</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No production recorded</p>
          )}
        </div>
      </div>

      {/* Weather Conditions */}
      {dayLog && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Weather Conditions
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Conditions:</span>
              <p className="font-medium">{dayLog.weatherConditions || "Not recorded"}</p>
            </div>
            <div>
              <span className="text-gray-600">High Temp:</span>
              <p className="font-medium">{dayLog.tempHigh}°F</p>
            </div>
            <div>
              <span className="text-gray-600">Low Temp:</span>
              <p className="font-medium">{dayLog.tempLow}°F</p>
            </div>
          </div>
        </div>
      )}

      {/* Work Performed */}
      {dayLog && dayLog.workPerformed.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Hammer className="w-4 h-4" />
            Work Performed
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {dayLog.workPerformed.map((work, i) => (
              <li key={i}>{work}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Materials Used */}
      {dayLog && dayLog.materialsUsed.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Materials Used
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {dayLog.materialsUsed.map((material, i) => (
              <li key={i}>{material}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Issues & Safety */}
      <div className="grid grid-cols-2 gap-4">
        {dayLog && dayLog.issues.length > 0 && (
          <div className="border rounded-lg p-4 border-amber-200 bg-amber-50">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Issues Noted
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
              {dayLog.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {dayLog && dayLog.safetyNotes.length > 0 && (
          <div className="border rounded-lg p-4 border-green-200 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Safety Notes
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
              {dayLog.safetyNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Activity Log */}
      {dayActivity.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Activity Log
          </h3>
          <div className="space-y-2">
            {dayActivity.map(act => (
              <div key={act.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                <span className="text-gray-500 whitespace-nowrap">
                  {format(act.timestamp, "h:mm a")}
                </span>
                <div>
                  <span className="font-medium">{act.title}</span>
                  <span className="text-gray-600"> - {act.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature Line */}
      <div className="border-t-2 pt-6 mt-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="border-b border-gray-400 pb-8 mb-2"></div>
            <p className="text-sm text-gray-600">Superintendent Signature</p>
          </div>
          <div>
            <div className="border-b border-gray-400 pb-8 mb-2"></div>
            <p className="text-sm text-gray-600">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== WEEKLY PROGRESS REPORT ==========
function WeeklyProgressReport({
  date,
  header,
  workEntries,
  dailyLogs
}: {
  date: string;
  header: React.ReactNode;
  workEntries: Record<string, WorkEntry>;
  dailyLogs: DailyLogEntry[];
}) {
  const reportDate = parseISO(date);
  const weekStart = startOfWeek(reportDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(reportDate, { weekStartsOn: 1 }); // Sunday
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Calculate weekly stats
  const weekStats = useMemo(() => {
    let workedDays = 0;
    let weatherHoldDays = 0;
    let totalSqft = 0;
    let totalHours = 0;
    let totalCrew = 0;
    let crewDays = 0;

    weekDays.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      const entry = workEntries[dateKey];
      const log = dailyLogs.find(l => l.date === dateKey);

      if (entry?.type === "worked") {
        workedDays++;
        totalSqft += entry.sqft || 0;
      } else if (entry?.type === "weather_hold") {
        weatherHoldDays++;
      }

      if (log) {
        totalSqft = Math.max(totalSqft, log.sqftCompleted || 0);
        totalHours += log.hoursWorked || 0;
        totalCrew += log.crewCount || 0;
        crewDays++;
      }
    });

    return {
      workedDays,
      weatherHoldDays,
      totalSqft,
      totalHours,
      avgCrew: crewDays > 0 ? Math.round(totalCrew / crewDays) : 0,
      productivityRate: workedDays > 0 ? Math.round(totalSqft / workedDays) : 0
    };
  }, [weekDays, workEntries, dailyLogs]);

  return (
    <div className="p-6 space-y-6">
      {header}

      {/* Report Title */}
      <div className="text-center border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900">WEEKLY PROGRESS REPORT</h1>
        <p className="text-lg text-gray-700">
          {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
        </p>
      </div>

      {/* Weekly Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <Hammer className="w-6 h-6 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-gray-900">{weekStats.workedDays}</div>
          <div className="text-sm text-gray-600">Days Worked</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <CloudRain className="w-6 h-6 mx-auto mb-2 text-amber-600" />
          <div className="text-2xl font-bold text-gray-900">{weekStats.weatherHoldDays}</div>
          <div className="text-sm text-gray-600">Weather Holds</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-gray-900">{weekStats.totalSqft.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total SF</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-600" />
          <div className="text-2xl font-bold text-gray-900">{weekStats.productivityRate}</div>
          <div className="text-sm text-gray-600">SF/Day Avg</div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900">SF</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900">Hours</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900">Crew</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Notes</th>
            </tr>
          </thead>
          <tbody>
            {weekDays.map((day, i) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const entry = workEntries[dateKey];
              const log = dailyLogs.find(l => l.date === dateKey);
              const isWeekend = [0, 6].includes(day.getDay());

              return (
                <tr key={dateKey} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 font-medium">
                    {format(day, "EEE, MMM d")}
                  </td>
                  <td className="px-4 py-2">
                    {entry?.type === "worked" && (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <CheckCircle2 className="w-4 h-4" /> Worked
                      </span>
                    )}
                    {entry?.type === "weather_hold" && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <CloudRain className="w-4 h-4" /> Weather Hold
                      </span>
                    )}
                    {entry?.type === "weekend" && (
                      <span className="text-gray-500">Weekend</span>
                    )}
                    {!entry && isWeekend && (
                      <span className="text-gray-500">Weekend</span>
                    )}
                    {!entry && !isWeekend && (
                      <span className="text-gray-400 italic">No entry</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {log?.sqftCompleted || entry?.sqft || "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {log?.hoursWorked || "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {log?.crewCount || "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-600 truncate max-w-[200px]">
                    {entry?.notes || log?.workPerformed?.[0] || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-200 font-semibold">
            <tr>
              <td className="px-4 py-2">TOTALS</td>
              <td className="px-4 py-2">{weekStats.workedDays} days worked</td>
              <td className="px-4 py-2 text-right font-mono">{weekStats.totalSqft.toLocaleString()}</td>
              <td className="px-4 py-2 text-right font-mono">{weekStats.totalHours}</td>
              <td className="px-4 py-2 text-right font-mono">{weekStats.avgCrew} avg</td>
              <td className="px-4 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Weekly Summary Chart Placeholder */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Production Summary</h3>
        <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
          <div className="flex items-end gap-2 h-24">
            {weekDays.map((day, i) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const entry = workEntries[dateKey];
              const sqft = entry?.sqft || 0;
              const maxSqft = Math.max(...weekDays.map(d => workEntries[format(d, "yyyy-MM-dd")]?.sqft || 0), 1);
              const height = sqft > 0 ? Math.max(20, (sqft / maxSqft) * 80) : 4;
              const isWeekend = [0, 6].includes(day.getDay());

              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-8 rounded-t transition-all ${
                      entry?.type === "worked" ? "bg-green-500" :
                      entry?.type === "weather_hold" ? "bg-amber-500" :
                      isWeekend ? "bg-gray-300" : "bg-gray-200"
                    }`}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-xs text-gray-500 mt-1">{format(day, "E")}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" /> Worked
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" /> Weather Hold
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-300" /> Weekend/Off
          </span>
        </div>
      </div>

      {/* Signature Line */}
      <div className="border-t-2 pt-6 mt-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="border-b border-gray-400 pb-8 mb-2"></div>
            <p className="text-sm text-gray-600">Project Manager Signature</p>
          </div>
          <div>
            <div className="border-b border-gray-400 pb-8 mb-2"></div>
            <p className="text-sm text-gray-600">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== WEATHER DELAY REPORT ==========
function WeatherDelayReport({
  date,
  header,
  workEntries,
  winterPlan,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  items: _items
}: {
  date: string;
  header: React.ReactNode;
  workEntries: Record<string, WorkEntry>;
  winterPlan: WinterWorkPlan | null;
  items: ProjectItem[];
}) {
  const reportDate = parseISO(date);
  const dayEntry = workEntries[date];

  // Get all weather holds in the last 30 days
  const recentWeatherHolds = useMemo(() => {
    const holds: { date: string; entry: WorkEntry }[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const d = subDays(today, i);
      const dateKey = format(d, "yyyy-MM-dd");
      const entry = workEntries[dateKey];
      if (entry?.type === "weather_hold") {
        holds.push({ date: dateKey, entry });
      }
    }
    return holds;
  }, [workEntries]);

  return (
    <div className="p-6 space-y-6">
      {header}

      {/* Report Title */}
      <div className="text-center border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900">WEATHER DELAY DOCUMENTATION</h1>
        <p className="text-lg text-gray-700">{format(reportDate, "MMMM d, yyyy")}</p>
        <p className="text-sm text-amber-700 mt-2">For Warranty Compliance Documentation</p>
      </div>

      {/* Current Day Status */}
      {dayEntry?.type === "weather_hold" ? (
        <div className="border-2 border-amber-500 rounded-lg p-4 bg-amber-50">
          <div className="flex items-center gap-3 mb-4">
            <CloudRain className="w-8 h-8 text-amber-600" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">WEATHER HOLD CONFIRMED</h3>
              <p className="text-amber-700">{format(reportDate, "EEEE, MMMM d, yyyy")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <span className="text-sm text-amber-700 font-medium">Reason:</span>
              <p className="text-amber-900">
                {dayEntry.weatherReason === "cold" && "Temperature Below Application Threshold"}
                {dayEntry.weatherReason === "rain" && "Active Precipitation"}
                {dayEntry.weatherReason === "snow" && "Snow/Ice Conditions"}
                {dayEntry.weatherReason === "wind" && "High Wind Conditions"}
                {dayEntry.weatherReason === "humidity" && "Excessive Humidity"}
                {!dayEntry.weatherReason && "Weather Conditions"}
              </p>
            </div>
            <div>
              <span className="text-sm text-amber-700 font-medium">Notes:</span>
              <p className="text-amber-900">{dayEntry.notes || "No additional notes"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-gray-600 text-center">
            No weather hold recorded for {format(reportDate, "MMMM d, yyyy")}
          </p>
        </div>
      )}

      {/* Compliance Thresholds */}
      {winterPlan && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Manufacturer Compliance Thresholds
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Temperature Thresholds</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Adhesive Application:</span>
                  <span className="font-mono">{winterPlan.temperatureThresholds.adhesiveMin}°F min</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Coating Application:</span>
                  <span className="font-mono">{winterPlan.temperatureThresholds.coatingMin}°F min</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Work Suspension:</span>
                  <span className="font-mono">{winterPlan.temperatureThresholds.workSuspension}°F</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Wind Thresholds</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Caution Level:</span>
                  <span className="font-mono">{winterPlan.windThresholds.cautionSpeed} mph</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Work Suspension:</span>
                  <span className="font-mono">{winterPlan.windThresholds.suspensionSpeed} mph</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Gust Limit:</span>
                  <span className="font-mono">{winterPlan.windThresholds.gustLimit} mph</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recent Weather Holds Summary */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">
          Weather Hold History (Last 30 Days)
        </h3>
        {recentWeatherHolds.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentWeatherHolds.map(({ date: holdDate, entry }) => (
                <tr key={holdDate} className="border-b">
                  <td className="px-4 py-2 font-medium">
                    {format(parseISO(holdDate), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-2">
                    {entry.weatherReason === "cold" && "Low Temperature"}
                    {entry.weatherReason === "rain" && "Precipitation"}
                    {entry.weatherReason === "snow" && "Snow/Ice"}
                    {entry.weatherReason === "wind" && "High Wind"}
                    {entry.weatherReason === "humidity" && "Humidity"}
                    {!entry.weatherReason && "Weather"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{entry.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center py-4">No weather holds in the last 30 days</p>
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
          <strong>Total Weather Delays:</strong> {recentWeatherHolds.length} days in last 30 days
        </div>
      </div>

      {/* Certification Statement */}
      <div className="border-2 border-gray-800 rounded-lg p-4 bg-gray-50">
        <h3 className="font-bold text-gray-900 mb-3">CERTIFICATION STATEMENT</h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          I hereby certify that the weather delay documented above was necessary to maintain
          compliance with manufacturer installation requirements and warranty specifications.
          Work was suspended in accordance with the project&apos;s Winter Weather Work Plan and
          all applicable Garland product data sheets. Weather monitoring was performed using
          the Weathercraft Guardian AI system with real-time conditions verified against
          manufacturer thresholds.
        </p>
      </div>

      {/* Signature Lines */}
      <div className="border-t-2 pt-6 mt-8">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="border-b border-gray-400 pb-8 mb-2"></div>
            <p className="text-sm text-gray-600">WCI Superintendent</p>
          </div>
          <div>
            <div className="border-b border-gray-400 pb-8 mb-2"></div>
            <p className="text-sm text-gray-600">General Contractor Rep</p>
          </div>
          <div>
            <div className="border-b border-gray-400 pb-8 mb-2"></div>
            <p className="text-sm text-gray-600">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== MATERIAL USAGE REPORT ==========
function MaterialUsageReport({
  date,
  header,
  dailyLogs
}: {
  date: string;
  header: React.ReactNode;
  dailyLogs: DailyLogEntry[];
}) {
  const reportDate = parseISO(date);

  // Aggregate materials from all logs
  const materialsSummary = useMemo(() => {
    const materials = new Map<string, { dates: string[]; count: number }>();

    dailyLogs.forEach(log => {
      log.materialsUsed.forEach(material => {
        const existing = materials.get(material) || { dates: [], count: 0 };
        existing.dates.push(log.date);
        existing.count++;
        materials.set(material, existing);
      });
    });

    return Array.from(materials.entries()).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.count - a.count);
  }, [dailyLogs]);

  // Get equipment used
  const equipmentSummary = useMemo(() => {
    const equipment = new Map<string, number>();

    dailyLogs.forEach(log => {
      log.equipmentUsed.forEach(item => {
        equipment.set(item, (equipment.get(item) || 0) + 1);
      });
    });

    return Array.from(equipment.entries()).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);
  }, [dailyLogs]);

  return (
    <div className="p-6 space-y-6">
      {header}

      {/* Report Title */}
      <div className="text-center border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900">MATERIAL USAGE REPORT</h1>
        <p className="text-lg text-gray-700">As of {format(reportDate, "MMMM d, yyyy")}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <Package className="w-6 h-6 mx-auto mb-2 text-purple-600" />
          <div className="text-2xl font-bold text-gray-900">{materialsSummary.length}</div>
          <div className="text-sm text-gray-600">Unique Materials</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-gray-900">{dailyLogs.length}</div>
          <div className="text-sm text-gray-600">Daily Logs</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <Hammer className="w-6 h-6 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-gray-900">{equipmentSummary.length}</div>
          <div className="text-sm text-gray-600">Equipment Items</div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="border rounded-lg overflow-hidden">
        <h3 className="font-semibold text-gray-900 px-4 py-3 bg-gray-100 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Materials Used
        </h3>
        {materialsSummary.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Material</th>
                <th className="px-4 py-2 text-center">Usage Count</th>
                <th className="px-4 py-2 text-left">Dates Used</th>
              </tr>
            </thead>
            <tbody>
              {materialsSummary.map((material, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 font-medium">{material.name}</td>
                  <td className="px-4 py-2 text-center font-mono">{material.count}</td>
                  <td className="px-4 py-2 text-gray-600 text-xs">
                    {material.dates.slice(0, 5).map(d => format(parseISO(d), "M/d")).join(", ")}
                    {material.dates.length > 5 && ` +${material.dates.length - 5} more`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center py-8">No materials recorded in daily logs</p>
        )}
      </div>

      {/* Equipment Table */}
      <div className="border rounded-lg overflow-hidden">
        <h3 className="font-semibold text-gray-900 px-4 py-3 bg-gray-100 flex items-center gap-2">
          <Hammer className="w-4 h-4" />
          Equipment Used
        </h3>
        {equipmentSummary.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Equipment</th>
                <th className="px-4 py-2 text-center">Days Used</th>
              </tr>
            </thead>
            <tbody>
              {equipmentSummary.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2 text-center font-mono">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center py-8">No equipment recorded in daily logs</p>
        )}
      </div>

      {/* Standard Materials Reference */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h3 className="font-semibold text-blue-900 mb-3">Standard Project Materials (Reference)</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800">Roofing System</h4>
            <ul className="mt-1 space-y-1 text-blue-700">
              <li>Garland Green-Lock Plus Adhesive</li>
              <li>R-Mer Seal Underlayment</li>
              <li>Pyramic Plus Coating</li>
              <li>Stress Ply IV Base Sheet</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Metal Components</h4>
            <ul className="mt-1 space-y-1 text-blue-700">
              <li>R-Mer Span Metal Panels</li>
              <li>R-Mer Loc Standing Seam</li>
              <li>Custom Flashing Materials</li>
              <li>Fasteners & Accessories</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Signature Line */}
      <div className="border-t-2 pt-6 mt-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="border-b border-gray-400 pb-8 mb-2"></div>
            <p className="text-sm text-gray-600">Project Manager</p>
          </div>
          <div>
            <div className="border-b border-gray-400 pb-8 mb-2"></div>
            <p className="text-sm text-gray-600">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}
