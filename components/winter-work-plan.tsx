"use client";

import { useMemo } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Printer,
  Shield,
  Thermometer,
  Wind,
  CloudRain,
  AlertTriangle
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeatherData, DailyForecast } from "@/lib/weather";
import { getWorkPackages, findWorkWindows, buildDailySuitability } from "@/lib/winter-planner";

const PLAN_SECTIONS = [
  {
    title: "Temperature Protocols",
    items: [
      "No adhesive application when ambient temp is below 40F or falling.",
      "No metal underlayment installation below 50F or with falling temps.",
      "Suspend coating work if overnight lows threaten freezing.",
      "Document temperatures at 6:00 AM, 12:00 PM, 4:00 PM daily."
    ]
  },
  {
    title: "Wind and Precipitation",
    items: [
      "Suspend membrane handling when sustained winds exceed 20 mph.",
      "No roofing installation during active precipitation.",
      "Stage emergency tarps when precip probability exceeds 60%.",
      "Inspect all work areas after any precipitation event."
    ]
  },
  {
    title: "Material Storage",
    items: [
      "Maintain adhesive storage between 60F and 80F.",
      "Stage rolls inside heated enclosure minimum 24 hours before use.",
      "Protect coatings from freezing at all times.",
      "Document material conditioning start/end times in daily log."
    ]
  },
  {
    title: "Crew Safety",
    items: [
      "Mandatory cold-weather PPE below 40F.",
      "Warm-up breaks every 60 minutes below 35F.",
      "Buddy system required on roof when conditions are icy.",
      "Slip-resistant footwear required at all times."
    ]
  },
  {
    title: "Emergency Procedures",
    items: [
      "Immediate work stoppage if weather deteriorates unexpectedly.",
      "Emergency tarps staged at each active work area.",
      "Heated shelter available for crew recovery.",
      "Notify GC within 30 minutes of weather stoppage."
    ]
  }
];

export default function WinterWorkPlan({
  dailyForecasts,
  hourlyForecast
}: {
  dailyForecasts: DailyForecast[];
  hourlyForecast: WeatherData[];
}) {
  const packages = useMemo(() => getWorkPackages(), []);

  const windowData = useMemo(() => {
    return packages.map(pkg => {
      const windows = findWorkWindows(hourlyForecast, pkg).slice(0, 2);
      return {
        pkg,
        windows
      };
    });
  }, [packages, hourlyForecast]);

  const suitability = useMemo(() => {
    return packages.map(pkg => ({
      pkg,
      days: buildDailySuitability(dailyForecasts, pkg)
    }));
  }, [packages, dailyForecasts]);

  const planDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print screen-only">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" /> Winter Work Plan
          </h2>
          <p className="text-sm text-muted-foreground">Printable plan for temperature-sensitive work and approvals.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      <div className="print-area rounded-2xl border border-border/40 bg-card/80 backdrop-blur shadow-2xl overflow-hidden">
        <div className="p-8 space-y-6">
          <header className="flex flex-col gap-4 border-b border-border/50 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Winter Work Plan</div>
                <h1 className="text-3xl font-black font-display text-foreground">PSFB Building 140</h1>
                <div className="text-sm text-muted-foreground">Job 250001 • Peterson SFB</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Plan Date</div>
                <div className="text-lg font-semibold text-foreground">{planDate}</div>
                <div className="text-xs text-muted-foreground mt-2">Prepared By</div>
                <div className="text-sm font-medium text-foreground">Weathercraft Guardian</div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <InfoChip icon={<Thermometer className="w-4 h-4" />} label="Temp Sensitive" value="Adhesives, Underlayment, Coatings" />
              <InfoChip icon={<Wind className="w-4 h-4" />} label="Wind Limit" value="20 mph sustained" />
              <InfoChip icon={<CloudRain className="w-4 h-4" />} label="Precipitation" value="No active precip" />
            </div>
          </header>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CalendarDays className="w-5 h-5 text-blue-600" /> Weather Window Planner (Next 5 Days)
            </div>
            <div className="grid gap-4">
              {windowData.map(({ pkg, windows }) => (
                <div key={pkg.id} className="border border-border/50 rounded-lg p-4 bg-background/40">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground">{pkg.name}</div>
                      <div className="text-xs text-muted-foreground">{pkg.description}</div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">Lead Time {pkg.leadTimeHours}h</Badge>
                  </div>
                  {windows.length === 0 ? (
                    <div className="mt-3 text-sm text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> No viable window in forecast. Use winter hold plan.
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {windows.map((window, idx) => (
                        <div key={`${pkg.id}-${idx}`} className="rounded-md border border-border/50 bg-muted/40 p-3">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">Window {idx + 1}</div>
                          <div className="text-sm font-semibold text-foreground">
                            {formatDateTime(window.start)} - {formatDateTime(window.end)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Stage by {formatDateTime(new Date(window.start.getTime() - pkg.leadTimeHours * 3600 * 1000))}
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded bg-background/60 px-2 py-1 text-muted-foreground">{window.durationHours}h</div>
                            <div className="rounded bg-background/60 px-2 py-1 text-muted-foreground">Avg {window.avgTemp}F</div>
                            <div className="rounded bg-background/60 px-2 py-1 text-muted-foreground">{window.confidence}% conf</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Shield className="w-5 h-5 text-emerald-600" /> 5-Day Suitability Matrix
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-border/50">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left">Package</th>
                    {dailyForecasts.slice(0, 5).map(day => (
                      <th key={day.date.toISOString()} className="px-3 py-2 text-center">
                        {day.dayName}<br />
                        <span className="text-muted-foreground">{day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suitability.map(row => (
                    <tr key={row.pkg.id} className="border-t border-border/50">
                      <td className="px-3 py-2 font-medium">{row.pkg.name}</td>
                      {row.days.map(day => (
                        <td key={day.date.toISOString()} className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-semibold ${statusClass(day.status)}`}>
                            {day.status.toUpperCase()}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <FileText className="w-5 h-5 text-indigo-600" /> Material Constraint Matrix
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {packages.map(pkg => (
                <div key={pkg.id} className="border border-border/50 rounded-lg p-4 bg-background/40">
                  <div className="font-semibold text-foreground">{pkg.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{pkg.description}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Constraint label="Min Temp" value={pkg.constraints.minTemp ? `${pkg.constraints.minTemp}F` : "-"} />
                    <Constraint label="Max Temp" value={pkg.constraints.maxTemp ? `${pkg.constraints.maxTemp}F` : "-"} />
                    <Constraint label="Rising Temp" value={pkg.constraints.rising ? "Yes" : "No"} />
                    <Constraint label="No Precip" value={pkg.constraints.noPrecip ? "Yes" : "No"} />
                    <Constraint label="Max Wind" value={pkg.constraints.maxWind ? `${pkg.constraints.maxWind} mph` : "-"} />
                    <Constraint label="Required Hours" value={`${pkg.requiredHours}h`} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-lg font-semibold text-foreground">Field Protocols</div>
            <div className="grid gap-4 md:grid-cols-2">
              {PLAN_SECTIONS.map(section => (
                <div key={section.title} className="border border-border/50 rounded-lg p-4 bg-background/40">
                  <div className="font-semibold text-foreground mb-2">{section.title}</div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {section.items.map(item => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-lg font-semibold text-foreground">Approval</div>
            <div className="grid gap-4 md:grid-cols-2">
              <SignatureLine label="Prepared By" />
              <SignatureLine label="GC Approval" />
              <SignatureLine label="Owner Rep" />
              <SignatureLine label="Government Review" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 bg-muted/40 text-foreground">
      <span className="text-primary">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function Constraint({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 border border-border/50 rounded px-2 py-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="border border-border/50 rounded-lg p-4 bg-background/40">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-6 border-b border-border/60" />
      <div className="text-[10px] text-muted-foreground mt-2">Signature / Date</div>
    </div>
  );
}

function statusClass(status: "go" | "caution" | "hold") {
  if (status === "go") return "bg-emerald-500/20 text-emerald-300";
  if (status === "caution") return "bg-amber-500/20 text-amber-300";
  return "bg-rose-500/20 text-rose-300";
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
