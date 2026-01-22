"use client";

import { useState } from "react";
import { MATERIALS, checkCompliance, Material } from "@/lib/materials";
import { WeatherData } from "@/lib/weather";
import { PROJECTS } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTemp } from "@/lib/utils";
import { 
  Wind, 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Calendar,
  FileText,
  MapPin
} from "lucide-react";

type DashboardProps = {
  initialWeather: WeatherData;
  initialForecast: WeatherData[];
  defaultProject: typeof PROJECTS[0];
};

export default function Dashboard({ initialWeather, initialForecast, defaultProject }: DashboardProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(MATERIALS[0].id);
  const [weather] = useState<WeatherData>(initialWeather);
  const [forecast] = useState<WeatherData[]>(initialForecast);
  
  // Find current material
  const material = MATERIALS.find(m => m.id === selectedMaterialId) || MATERIALS[0];

  // Run compliance check
  const compliance = checkCompliance(
    material.id, 
    weather.temp, 
    weather.wind_speed, 
    weather.description.includes("rain") || weather.description.includes("snow")
  );

  return (
    <div className="space-y-6">
      {/* CONTROL PANEL */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* MATERIAL SELECTOR */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Mission Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Material / Task</label>
              <select 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
              >
                {MATERIALS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-semibold text-foreground mb-1">Constraints:</p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                {material.constraints.minTemp && <li>• Min Temp: {material.constraints.minTemp}°F</li>}
                {material.constraints.maxTemp && <li>• Max Temp: {material.constraints.maxTemp}°F</li>}
                {material.constraints.maxWind && <li>• Max Wind: {material.constraints.maxWind} mph</li>}
                {material.constraints.rising && <li>• Temp must be rising</li>}
                {material.constraints.noPrecip && <li>• No Precipitation</li>}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* GO / NO GO GAUGE */}
        <Card className={`col-span-1 lg:col-span-2 border-l-4 ${compliance.compliant ? 'border-l-primary' : 'border-l-destructive'}`}>
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] py-6">
            <div className="flex items-center gap-4 mb-4">
              {compliance.compliant ? (
                <CheckCircle2 className="w-16 h-16 text-primary animate-pulse" />
              ) : (
                <XCircle className="w-16 h-16 text-destructive animate-pulse" />
              )}
              <div className="text-center md:text-left">
                <h2 className={`text-4xl md:text-5xl font-black tracking-tighter ${compliance.compliant ? 'text-primary' : 'text-destructive'}`}>
                  {compliance.compliant ? "GO FOR LAUNCH" : "NO GO"}
                </h2>
                <p className="text-muted-foreground font-mono mt-1">
                  {compliance.compliant ? "ALL SYSTEMS WITHIN PARAMETERS" : "CONDITIONS VIOLATE WARRANTY SPECS"}
                </p>
              </div>
            </div>

            {!compliance.compliant && (
              <div className="w-full max-w-md bg-destructive/10 border border-destructive/20 rounded-md p-4 mt-4">
                <div className="flex items-center gap-2 text-destructive font-bold mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  VIOLATIONS DETECTED:
                </div>
                <ul className="list-disc list-inside text-sm text-destructive/90 space-y-1">
                  {compliance.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {compliance.compliant && (
              <Button className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold px-8" size="lg">
                <FileText className="mr-2 h-4 w-4" />
                Generate Daily Log
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* WEATHER TELEMETRY */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <TelemetryCard 
          title="TEMPERATURE" 
          value={formatTemp(weather.temp)} 
          subValue={`Feels like ${formatTemp(weather.feels_like)}`}
          icon={<Thermometer className="w-4 h-4" />}
          status={
            (material.constraints.minTemp && weather.temp < material.constraints.minTemp) ||
            (material.constraints.maxTemp && weather.temp > material.constraints.maxTemp) 
              ? "danger" : "normal"
          }
        />
        <TelemetryCard 
          title="WIND SPEED" 
          value={`${Math.round(weather.wind_speed)} mph`} 
          subValue={`Direction: ${weather.wind_deg}°`}
          icon={<Wind className="w-4 h-4" />}
          status={
            material.constraints.maxWind && weather.wind_speed > material.constraints.maxWind
              ? "danger" : "normal"
          }
        />
        <TelemetryCard 
          title="PRECIPITATION" 
          value={weather.description} 
          subValue={`Humidity: ${weather.humidity}%`}
          icon={<Droplets className="w-4 h-4 capitalize" />}
          status={
            material.constraints.noPrecip && (weather.description.includes("rain") || weather.description.includes("snow"))
              ? "danger" : "normal"
          }
        />
        <TelemetryCard 
          title="LOCATION" 
          value={defaultProject.location} 
          subValue={new Date().toLocaleDateString()}
          icon={<MapPin className="w-4 h-4" />}
          status="normal"
        />
      </div>

      {/* FORECAST TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            3-Day Operational Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Conditions</th>
                  <th className="px-4 py-3">Temp</th>
                  <th className="px-4 py-3">Wind</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {forecast.slice(0, 8).map((f, i) => {
                  const fCheck = checkCompliance(
                    material.id, 
                    f.temp, 
                    f.wind_speed, 
                    f.description.includes("rain") || f.description.includes("snow")
                  );
                  return (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        {new Date(f.dt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-4 py-3 capitalize flex items-center gap-2">
                        <img 
                          src={`https://openweathermap.org/img/wn/${f.icon}.png`} 
                          alt="icon" 
                          className="w-6 h-6"
                        />
                        {f.description}
                      </td>
                      <td className="px-4 py-3 font-mono">{Math.round(f.temp)}°F</td>
                      <td className="px-4 py-3 font-mono">{Math.round(f.wind_speed)} mph</td>
                      <td className="px-4 py-3">
                        {fCheck.compliant ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">GO</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">NO GO</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TelemetryCard({ title, value, subValue, icon, status }: { 
  title: string, 
  value: string, 
  subValue: string, 
  icon: React.ReactNode,
  status: "normal" | "danger" | "warning"
}) {
  const statusColors = {
    normal: "bg-card border-border",
    danger: "bg-destructive/10 border-destructive/50",
    warning: "bg-amber-500/10 border-amber-500/50"
  };

  return (
    <Card className={`${statusColors[status]} transition-colors`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground tracking-widest">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {subValue}
        </p>
      </CardContent>
    </Card>
  )
}
