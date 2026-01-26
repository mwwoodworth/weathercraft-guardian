"use client";

import { useState, useEffect } from "react";
import {
  ClipboardCheck,
  FileText,
  Printer,
  Thermometer,
  Wind,
  CloudRain,
  Clock,
  TrendingUp,
  Warehouse,
  Layers,
  Wrench
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MATERIALS, SYSTEMS, type Material, type RoofingSystem } from "@/lib/materials";

const PLAN_SECTIONS = [
  {
    title: "Temperature Protocols",
    items: [
      "No adhesive application when ambient temp is below 40°F or falling.",
      "No metal underlayment installation below 50°F or with falling temps.",
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
      "Maintain adhesive storage between 60°F and 80°F.",
      "Stage rolls inside heated enclosure minimum 24 hours before use.",
      "Protect coatings from freezing at all times.",
      "Document material conditioning start/end times in daily log."
    ]
  },
  {
    title: "Crew Safety",
    items: [
      "Mandatory cold-weather PPE below 40°F.",
      "Warm-up breaks every 60 minutes below 35°F.",
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

export default function WinterWorkPlan() {
  // Group materials by system
  const modifiedMaterials = MATERIALS.filter(m => m.system === "modified");
  const ssmrMaterials = MATERIALS.filter(m => m.system === "ssmr");

  // Hydration-safe date - only render on client
  const [planDate, setPlanDate] = useState<string | null>(null);
  useEffect(() => {
    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    setPlanDate(formattedDate);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print screen-only">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" /> Winter Work Plan
          </h2>
          <p className="text-sm text-muted-foreground">Product constraints by roofing system.</p>
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
                <div className="text-lg font-semibold text-foreground">{planDate || "Loading..."}</div>
                <div className="text-xs text-muted-foreground mt-2">Prepared By</div>
                <div className="text-sm font-medium text-foreground">Weathercraft Guardian</div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <InfoChip icon={<Thermometer className="w-4 h-4" />} label="Temp Sensitive" value="Adhesives, Underlayment, Coatings" />
              <InfoChip icon={<Wind className="w-4 h-4" />} label="Wind Limit" value="20-25 mph depending on work" />
              <InfoChip icon={<CloudRain className="w-4 h-4" />} label="Precipitation" value="No active precip" />
            </div>
          </header>

          {/* Modified Bitumen System */}
          <SystemSection
            systemKey="modified"
            materials={modifiedMaterials}
          />

          {/* SSMR System */}
          <SystemSection
            systemKey="ssmr"
            materials={ssmrMaterials}
          />

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

function SystemSection({ systemKey, materials }: { systemKey: RoofingSystem; materials: Material[] }) {
  const system = SYSTEMS[systemKey];
  const tempSensitiveCount = materials.filter(m => m.tempSensitive).length;
  const icon = systemKey === "modified" ? <Layers className="w-5 h-5" /> : <Wrench className="w-5 h-5" />;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
          {icon}
          <span>{system.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {system.allTempSensitive ? (
            <Badge variant="destructive" className="text-xs">All Temp Sensitive</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">{tempSensitiveCount} of {materials.length} Temp Sensitive</Badge>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">{system.description}</p>

      <div className="grid gap-3 md:grid-cols-2">
        {materials.map(material => (
          <MaterialCard key={material.id} material={material} />
        ))}
      </div>
    </section>
  );
}

function MaterialCard({ material }: { material: Material }) {
  const { constraints } = material;

  return (
    <div className={`border rounded-lg p-4 bg-background/40 ${material.tempSensitive ? 'border-amber-500/50' : 'border-border/50'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-semibold text-foreground">{material.name}</div>
          <div className="text-xs text-muted-foreground">{material.category}</div>
        </div>
        {material.tempSensitive && (
          <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-[10px] shrink-0">
            <Thermometer className="w-3 h-3 mr-1" />
            Temp Sensitive
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">{material.description}</p>

      <div className="grid grid-cols-3 gap-2 text-xs">
        {/* Temperature Constraints */}
        {constraints.minTemp !== undefined && (
          <ConstraintPill
            icon={<Thermometer className="w-3 h-3" />}
            label="Min"
            value={`${constraints.minTemp}°F`}
            variant="temp"
          />
        )}
        {constraints.maxTemp !== undefined && (
          <ConstraintPill
            icon={<Thermometer className="w-3 h-3" />}
            label="Max"
            value={`${constraints.maxTemp}°F`}
            variant="temp"
          />
        )}
        {constraints.rising && (
          <ConstraintPill
            icon={<TrendingUp className="w-3 h-3" />}
            label="Rising"
            value="Required"
            variant="temp"
          />
        )}

        {/* Wind Constraint */}
        {constraints.maxWind !== undefined && (
          <ConstraintPill
            icon={<Wind className="w-3 h-3" />}
            label="Wind"
            value={`≤${constraints.maxWind} mph`}
            variant="wind"
          />
        )}

        {/* Precipitation */}
        {constraints.noPrecip && (
          <ConstraintPill
            icon={<CloudRain className="w-3 h-3" />}
            label="Precip"
            value="None"
            variant="precip"
          />
        )}

        {/* Time Requirements */}
        <ConstraintPill
          icon={<Clock className="w-3 h-3" />}
          label="Work"
          value={`${material.requiredHours}h`}
          variant="time"
        />
        <ConstraintPill
          icon={<Clock className="w-3 h-3" />}
          label="Lead"
          value={`${material.leadTimeHours}h`}
          variant="time"
        />

        {/* Storage Constraints */}
        {(constraints.storageTempMin !== undefined || constraints.storageTempMax !== undefined) && (
          <ConstraintPill
            icon={<Warehouse className="w-3 h-3" />}
            label="Storage"
            value={
              constraints.storageTempMin && constraints.storageTempMax
                ? `${constraints.storageTempMin}-${constraints.storageTempMax}°F`
                : constraints.storageTempMin
                  ? `≥${constraints.storageTempMin}°F`
                  : `≤${constraints.storageTempMax}°F`
            }
            variant="storage"
          />
        )}
      </div>
    </div>
  );
}

function ConstraintPill({
  icon,
  label,
  value,
  variant
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: 'temp' | 'wind' | 'precip' | 'time' | 'storage';
}) {
  const variantClasses = {
    temp: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    wind: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    precip: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    time: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    storage: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  };

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded border ${variantClasses[variant]}`}>
      {icon}
      <div className="flex flex-col">
        <span className="text-[9px] uppercase opacity-70">{label}</span>
        <span className="text-[11px] font-medium">{value}</span>
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

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="border border-border/50 rounded-lg p-4 bg-background/40">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-6 border-b border-border/60" />
      <div className="text-[10px] text-muted-foreground mt-2">Signature / Date</div>
    </div>
  );
}
