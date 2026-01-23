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
      <div className="flex items-center justify-between no-print">
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

      <div className="print-area bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 space-y-6">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Winter Work Plan</div>
                <h1 className="text-3xl font-black font-display">PSFB Building 140</h1>
                <div className="text-sm text-slate-500">Job 250001 • Peterson SFB</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Plan Date</div>
                <div className="text-lg font-semibold">{planDate}</div>
                <div className="text-xs text-slate-500 mt-2">Prepared By</div>
                <div className="text-sm font-medium">Weathercraft Guardian</div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <InfoChip icon={<Thermometer className="w-4 h-4" />} label="Temp Sensitive" value="Adhesives, Underlayment, Coatings" />
              <InfoChip icon={<Wind className="w-4 h-4" />} label="Wind Limit" value="20 mph sustained" />
              <InfoChip icon={<CloudRain className="w-4 h-4" />} label="Precipitation" value="No active precip" />
            </div>
          </header>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <CalendarDays className="w-5 h-5 text-blue-600" /> Weather Window Planner (Next 5 Days)
            </div>
            <div className="grid gap-4">
              {windowData.map(({ pkg, windows }) => (
                <div key={pkg.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{pkg.name}</div>
                      <div className="text-xs text-slate-500">{pkg.description}</div>
                    </div>
                    <Badge className="bg-slate-900 text-white">Lead Time {pkg.leadTimeHours}h</Badge>
                  </div>
                  {windows.length === 0 ? (
                    <div className="mt-3 text-sm text-rose-600 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> No viable window in forecast. Use winter hold plan.
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {windows.map((window, idx) => (
                        <div key={`${pkg.id}-${idx}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <div className="text-xs uppercase tracking-wide text-slate-500">Window {idx + 1}</div>
                          <div className="text-sm font-semibold text-slate-900">
                            {formatDateTime(window.start)} - {formatDateTime(window.end)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Stage by {formatDateTime(new Date(window.start.getTime() - pkg.leadTimeHours * 3600 * 1000))}
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded bg-white px-2 py-1 text-slate-600">{window.durationHours}h</div>
                            <div className="rounded bg-white px-2 py-1 text-slate-600">Avg {window.avgTemp}F</div>
                            <div className="rounded bg-white px-2 py-1 text-slate-600">{window.confidence}% conf</div>
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
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Shield className="w-5 h-5 text-emerald-600" /> 5-Day Suitability Matrix
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Package</th>
                    {dailyForecasts.slice(0, 5).map(day => (
                      <th key={day.date.toISOString()} className="px-3 py-2 text-center">
                        {day.dayName}<br />
                        <span className="text-slate-500">{day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suitability.map(row => (
                    <tr key={row.pkg.id} className="border-t border-slate-200">
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
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FileText className="w-5 h-5 text-indigo-600" /> Material Constraint Matrix
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {packages.map(pkg => (
                <div key={pkg.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="font-semibold text-slate-900">{pkg.name}</div>
                  <div className="text-xs text-slate-500 mb-2">{pkg.description}</div>
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
            <div className="text-lg font-semibold text-slate-900">Field Protocols</div>
            <div className="grid gap-4 md:grid-cols-2">
              {PLAN_SECTIONS.map(section => (
                <div key={section.title} className="border border-slate-200 rounded-lg p-4">
                  <div className="font-semibold text-slate-900 mb-2">{section.title}</div>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {section.items.map(item => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-lg font-semibold text-slate-900">Approval</div>
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
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700">
      <span className="text-blue-600">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function Constraint({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-xs font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-6 border-b border-slate-300" />
      <div className="text-[10px] text-slate-400 mt-2">Signature / Date</div>
    </div>
  );
}

function statusClass(status: "go" | "caution" | "hold") {
  if (status === "go") return "bg-emerald-500/20 text-emerald-700";
  if (status === "caution") return "bg-amber-500/20 text-amber-700";
  return "bg-rose-500/20 text-rose-700";
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
