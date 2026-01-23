"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  Thermometer,
  HardHat,
  Phone,
  MapPin,
  Heart,
  Wind,
  Snowflake,
  Sun,
  Coffee,
  UserCheck,
  AlertCircle,
  Siren,
  Activity,
  Timer,
  Clipboard,
  RefreshCw
} from "lucide-react";
import type { WeatherData } from "@/lib/weather";

type SafetyLevel = "green" | "yellow" | "red";

type SafetyAlert = {
  id: string;
  type: "weather" | "equipment" | "health" | "environmental";
  severity: "warning" | "critical";
  title: string;
  description: string;
  timestamp: Date;
};

type PPEItem = {
  id: string;
  name: string;
  required: boolean;
  reason?: string;
};

type CrewMember = {
  id: string;
  name: string;
  role: string;
  checkedIn: boolean;
  hoursWorked: number;
  lastBreak: Date | null;
  buddyId: string | null;
};

type SafetyCheckItem = {
  id: string;
  category: string;
  item: string;
  checked: boolean;
  required: boolean;
  weatherDependent?: boolean;
};

type EmergencyContact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  primary: boolean;
};

type CrewSafetyProps = {
  weather: WeatherData;
};

// Safety level determination based on weather conditions
function determineSafetyLevel(weather: WeatherData): SafetyLevel {
  const temp = weather.temp;
  const wind = weather.wind_speed;
  const isPrecip = weather.description.toLowerCase().includes("rain") ||
    weather.description.toLowerCase().includes("snow") ||
    weather.description.toLowerCase().includes("ice");

  // Critical conditions - RED
  if (temp < 20 || temp > 100 || wind > 35 || weather.description.toLowerCase().includes("ice")) {
    return "red";
  }

  // Caution conditions - YELLOW
  if (temp < 40 || temp > 90 || wind > 25 || isPrecip) {
    return "yellow";
  }

  // Safe conditions - GREEN
  return "green";
}

// Generate active safety alerts based on conditions
function generateSafetyAlerts(weather: WeatherData): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const temp = weather.temp;
  const wind = weather.wind_speed;

  if (temp < 32) {
    alerts.push({
      id: "cold-1",
      type: "weather",
      severity: temp < 20 ? "critical" : "warning",
      title: "Cold Weather Alert",
      description: `Temperature is ${Math.round(temp)}°F. Implement cold weather protocols. Mandatory breaks every 60 minutes.`,
      timestamp: new Date()
    });
  }

  if (temp > 90) {
    alerts.push({
      id: "heat-1",
      type: "health",
      severity: temp > 100 ? "critical" : "warning",
      title: "Heat Advisory",
      description: `Temperature is ${Math.round(temp)}°F. Hydration breaks every 30 minutes required. Monitor for heat exhaustion.`,
      timestamp: new Date()
    });
  }

  if (wind > 25) {
    alerts.push({
      id: "wind-1",
      type: "weather",
      severity: wind > 35 ? "critical" : "warning",
      title: "High Wind Warning",
      description: `Wind speed is ${Math.round(wind)} mph. Secure all materials. Consider suspending rooftop work.`,
      timestamp: new Date()
    });
  }

  if (weather.description.toLowerCase().includes("rain")) {
    alerts.push({
      id: "rain-1",
      type: "weather",
      severity: "warning",
      title: "Wet Conditions",
      description: "Rain detected. Slippery surface hazard. Use extra caution on roof surfaces.",
      timestamp: new Date()
    });
  }

  if (weather.description.toLowerCase().includes("snow") || weather.description.toLowerCase().includes("ice")) {
    alerts.push({
      id: "snow-1",
      type: "weather",
      severity: "critical",
      title: "Winter Weather - Work Suspended",
      description: "Snow/ice conditions. All rooftop work must be suspended until conditions clear.",
      timestamp: new Date()
    });
  }

  return alerts;
}

// Determine PPE requirements based on weather
function getPPERequirements(weather: WeatherData): PPEItem[] {
  const temp = weather.temp;
  const isPrecip = weather.description.toLowerCase().includes("rain") ||
    weather.description.toLowerCase().includes("snow");

  const basePPE: PPEItem[] = [
    { id: "hardhat", name: "Hard Hat", required: true },
    { id: "safety-glasses", name: "Safety Glasses", required: true },
    { id: "safety-harness", name: "Fall Protection Harness", required: true },
    { id: "work-boots", name: "Steel-Toe Work Boots", required: true },
    { id: "gloves", name: "Work Gloves", required: true },
    { id: "high-vis", name: "High-Visibility Vest", required: true },
  ];

  // Cold weather PPE
  if (temp < 40) {
    basePPE.push(
      { id: "insulated-jacket", name: "Insulated Jacket", required: true, reason: `Temp: ${Math.round(temp)}°F` },
      { id: "thermal-gloves", name: "Thermal Gloves", required: true, reason: "Cold weather protection" },
      { id: "face-covering", name: "Face/Neck Covering", required: temp < 32, reason: temp < 32 ? "Frostbite prevention" : undefined }
    );
  }

  // Hot weather PPE
  if (temp > 80) {
    basePPE.push(
      { id: "sun-protection", name: "Sun Protection (Hat/Sunscreen)", required: true, reason: `Temp: ${Math.round(temp)}°F` },
      { id: "cooling-towel", name: "Cooling Towel", required: temp > 90, reason: temp > 90 ? "Heat protection" : undefined }
    );
  }

  // Wet weather PPE
  if (isPrecip) {
    basePPE.push(
      { id: "rain-gear", name: "Rain Gear/Waterproof Layer", required: true, reason: "Wet conditions" },
      { id: "slip-resistant", name: "Slip-Resistant Boot Covers", required: true, reason: "Wet surface hazard" }
    );
  }

  return basePPE;
}

// Calculate break schedule based on temperature
function getBreakSchedule(temp: number): { interval: number; duration: number; message: string } {
  if (temp < 20) {
    return { interval: 45, duration: 15, message: "Extreme cold: 15-min breaks every 45 minutes" };
  }
  if (temp < 32) {
    return { interval: 60, duration: 10, message: "Cold weather: 10-min warm-up breaks every hour" };
  }
  if (temp < 40) {
    return { interval: 90, duration: 10, message: "Cool weather: 10-min breaks every 90 minutes" };
  }
  if (temp > 100) {
    return { interval: 30, duration: 15, message: "Extreme heat: 15-min cool-down breaks every 30 minutes" };
  }
  if (temp > 90) {
    return { interval: 45, duration: 10, message: "Hot weather: 10-min shade/hydration breaks every 45 minutes" };
  }
  if (temp > 80) {
    return { interval: 60, duration: 10, message: "Warm weather: 10-min hydration breaks every hour" };
  }
  return { interval: 120, duration: 10, message: "Standard: 10-min breaks every 2 hours" };
}

// Real crew data from B140 project - FULL NAMES from B140ACCT.csv payroll records
// These are the actual crew members who have worked on the Building 140 job
const B140_CREW: CrewMember[] = [
  { id: "c11", name: "Dustin Cartmell", role: "Foreman", checkedIn: true, hoursWorked: 0, lastBreak: new Date(Date.now() - 45 * 60000), buddyId: "c544" },
  { id: "c544", name: "Jesse Vialpando", role: "Lead Laborer", checkedIn: true, hoursWorked: 0, lastBreak: new Date(Date.now() - 45 * 60000), buddyId: "c11" },
  { id: "c197", name: "Rickie Lopez Jr", role: "Journeyman Roofer", checkedIn: true, hoursWorked: 0, lastBreak: new Date(Date.now() - 30 * 60000), buddyId: "c496" },
  { id: "c496", name: "Tevin Morris", role: "Journeyman Roofer", checkedIn: true, hoursWorked: 0, lastBreak: new Date(Date.now() - 30 * 60000), buddyId: "c197" },
  { id: "c90", name: "Steven Miller", role: "Sheet Metal", checkedIn: true, hoursWorked: 0, lastBreak: new Date(Date.now() - 60 * 60000), buddyId: "c573" },
  { id: "c573", name: "Daniel Wright", role: "Laborer", checkedIn: true, hoursWorked: 0, lastBreak: new Date(Date.now() - 60 * 60000), buddyId: "c90" },
  { id: "c580", name: "Josue Giron", role: "Laborer", checkedIn: true, hoursWorked: 0, lastBreak: new Date(Date.now() - 30 * 60000), buddyId: "c590" },
  { id: "c590", name: "Oscar Gallardo Rios", role: "Laborer", checkedIn: true, hoursWorked: 0, lastBreak: new Date(Date.now() - 30 * 60000), buddyId: "c580" },
  { id: "c536", name: "Robert Graham", role: "Journeyman Roofer", checkedIn: false, hoursWorked: 0, lastBreak: null, buddyId: null },
];

const INITIAL_SAFETY_CHECKLIST: SafetyCheckItem[] = [
  { id: "sc1", category: "Pre-Work", item: "Conducted morning safety briefing", checked: false, required: true },
  { id: "sc2", category: "Pre-Work", item: "Verified all fall protection equipment", checked: false, required: true },
  { id: "sc3", category: "Pre-Work", item: "Inspected roof access points", checked: false, required: true },
  { id: "sc4", category: "Pre-Work", item: "Confirmed weather conditions acceptable", checked: false, required: true, weatherDependent: true },
  { id: "sc5", category: "Equipment", item: "Checked kettle/torch connections", checked: false, required: true },
  { id: "sc6", category: "Equipment", item: "Fire extinguisher accessible and charged", checked: false, required: true },
  { id: "sc7", category: "Equipment", item: "First aid kit stocked and accessible", checked: false, required: true },
  { id: "sc8", category: "Site", item: "Perimeter barriers in place", checked: false, required: true },
  { id: "sc9", category: "Site", item: "Warning signs posted", checked: false, required: true },
  { id: "sc10", category: "Site", item: "Evacuation routes clear", checked: false, required: true },
  { id: "sc11", category: "Cold Weather", item: "Warming station available", checked: false, required: false, weatherDependent: true },
  { id: "sc12", category: "Cold Weather", item: "Hot beverages/soup available", checked: false, required: false, weatherDependent: true },
];

// Emergency contacts - role-based (contact Weathercraft dispatch for specific personnel)
const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: "ec1", name: "911 Emergency", role: "Police/Fire/EMS", phone: "911", primary: true },
  { id: "ec2", name: "Weathercraft Dispatch", role: "24/7 Emergency Line", phone: "(719) 632-1886", primary: true },
  { id: "ec3", name: "Peterson SFB Security", role: "Base Emergency", phone: "(719) 556-4000", primary: true },
  { id: "ec4", name: "UCHealth Memorial", role: "Nearest Trauma Center", phone: "(719) 365-5000", primary: false },
];

export default function CrewSafety({ weather }: CrewSafetyProps) {
  const [crew] = useState<CrewMember[]>(B140_CREW);
  const [checklist, setChecklist] = useState<SafetyCheckItem[]>(INITIAL_SAFETY_CHECKLIST);
  const [breakTimer, setBreakTimer] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  const safetyLevel = determineSafetyLevel(weather);
  const alerts = generateSafetyAlerts(weather);
  const ppeRequirements = getPPERequirements(weather);
  const breakSchedule = getBreakSchedule(weather.temp);

  // Update current time every minute for break calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter checklist based on weather
  const activeChecklist = checklist.filter(item => {
    if (!item.weatherDependent) return true;
    if (item.category === "Cold Weather" && weather.temp < 40) return true;
    if (item.category === "Hot Weather" && weather.temp > 80) return true;
    if (item.id === "sc4") return true; // Always show weather verification
    return false;
  });

  // Break timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && breakTimer > 0) {
      interval = setInterval(() => {
        setBreakTimer(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, breakTimer]);

  const toggleCheckItem = useCallback((id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  }, []);

  const startBreakTimer = useCallback(() => {
    setBreakTimer(breakSchedule.interval * 60);
    setTimerRunning(true);
  }, [breakSchedule.interval]);

  const resetBreakTimer = useCallback(() => {
    setBreakTimer(0);
    setTimerRunning(false);
  }, []);

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const checkedInCrew = crew.filter(c => c.checkedIn);
  const completedChecks = activeChecklist.filter(c => c.checked).length;
  const totalRequiredChecks = activeChecklist.filter(c => c.required).length;
  const requiredChecksComplete = activeChecklist.filter(c => c.required && c.checked).length;

  const safetyColors = {
    green: { bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-400", icon: CheckCircle2 },
    yellow: { bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-400", icon: AlertTriangle },
    red: { bg: "bg-rose-500/20", border: "border-rose-500/50", text: "text-rose-400", icon: XCircle }
  };

  const levelConfig = safetyColors[safetyLevel];
  const LevelIcon = levelConfig.icon;

  return (
    <div className="space-y-6">
      {/* SAFETY STATUS HEADER */}
      <Card className={`${levelConfig.bg} ${levelConfig.border} border-2`}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${levelConfig.bg}`}>
                <LevelIcon className={`w-12 h-12 ${levelConfig.text}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Safety Status</span>
                </div>
                <h2 className={`text-3xl font-black tracking-tight ${levelConfig.text}`}>
                  {safetyLevel === "green" ? "CONDITIONS SAFE" : safetyLevel === "yellow" ? "CAUTION REQUIRED" : "WORK SUSPENDED"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {safetyLevel === "green"
                    ? "All safety parameters within normal limits"
                    : safetyLevel === "yellow"
                    ? "Enhanced safety protocols in effect"
                    : "Critical conditions - evacuate work areas"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickStat icon={<Users className="w-4 h-4" />} label="Crew On Site" value={`${checkedInCrew.length}/${crew.length}`} />
              <QuickStat icon={<Clipboard className="w-4 h-4" />} label="Safety Checks" value={`${requiredChecksComplete}/${totalRequiredChecks}`} alert={requiredChecksComplete < totalRequiredChecks} />
              <QuickStat icon={<Thermometer className="w-4 h-4" />} label="Temperature" value={`${Math.round(weather.temp)}°F`} />
              <QuickStat icon={<Wind className="w-4 h-4" />} label="Wind" value={`${Math.round(weather.wind_speed)} mph`} alert={weather.wind_speed > 25} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ACTIVE ALERTS */}
      {alerts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <Siren className="w-5 h-5" />
              Active Safety Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${alert.severity === "critical" ? "bg-rose-500/20 border border-rose-500/30" : "bg-amber-500/20 border border-amber-500/30"}`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.severity === "critical" ? "text-rose-400" : "text-amber-400"}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{alert.title}</span>
                    <Badge className={alert.severity === "critical" ? "bg-rose-500" : "bg-amber-500"}>{alert.severity.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* PPE REQUIREMENTS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-primary" />
              PPE Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {ppeRequirements.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-2 rounded-lg ${item.required ? "bg-primary/10" : "bg-muted/30"}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${item.required ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm ${item.required ? "font-medium" : "text-muted-foreground"}`}>{item.name}</span>
                  </div>
                  {item.reason && (
                    <Badge variant="outline" className="text-xs">{item.reason}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* BREAK SCHEDULE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-primary" />
                Break Schedule
              </span>
              <Badge variant="outline" className="font-mono">{Math.round(weather.temp)}°F</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${weather.temp < 40 || weather.temp > 80 ? "bg-amber-500/20 border border-amber-500/30" : "bg-muted/30"}`}>
              <div className="flex items-center gap-2 mb-2">
                {weather.temp < 40 ? <Snowflake className="w-4 h-4 text-blue-400" /> : weather.temp > 80 ? <Sun className="w-4 h-4 text-amber-400" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                <span className="font-semibold">Current Protocol</span>
              </div>
              <p className="text-sm text-muted-foreground">{breakSchedule.message}</p>
            </div>

            {/* Break Timer */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  Break Timer
                </span>
                {timerRunning && breakTimer < 300 && (
                  <Badge className="bg-amber-500 animate-pulse">Break Soon!</Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-mono font-bold ${breakTimer > 0 && breakTimer < 300 ? "text-amber-400" : "text-foreground"}`}>
                  {breakTimer > 0 ? formatTimer(breakTimer) : `${breakSchedule.interval}:00`}
                </div>
                <div className="flex gap-2">
                  {!timerRunning ? (
                    <Button onClick={startBreakTimer} size="sm" className="bg-primary">
                      <Activity className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  ) : (
                    <Button onClick={resetBreakTimer} size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SAFETY CHECKLIST */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-primary" />
                Daily Safety Checklist
              </span>
              <Badge variant={requiredChecksComplete === totalRequiredChecks ? "default" : "destructive"} className="font-mono">
                {completedChecks}/{activeChecklist.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Pre-Work", "Equipment", "Site", "Cold Weather", "Hot Weather"].map(category => {
                const categoryItems = activeChecklist.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h4>
                    <div className="space-y-2">
                      {categoryItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleCheckItem(item.id)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                            item.checked
                              ? "bg-emerald-500/20 border border-emerald-500/30"
                              : item.required
                              ? "bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
                              : "bg-muted/30 hover:bg-muted/50"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            item.checked
                              ? "bg-emerald-500 border-emerald-500"
                              : item.required
                              ? "border-rose-500/50"
                              : "border-muted-foreground/50"
                          }`}>
                            {item.checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                            {item.item}
                          </span>
                          {item.required && !item.checked && (
                            <Badge variant="destructive" className="ml-auto text-xs">Required</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CREW TRACKING */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Crew Tracking
              </span>
              <Badge variant="outline" className="font-mono">{checkedInCrew.length} on site</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Crew Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/20 text-center">
                <div className="text-2xl font-bold text-emerald-400">{checkedInCrew.length}</div>
                <div className="text-xs text-muted-foreground">Checked In</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(checkedInCrew.reduce((sum, c) => sum + c.hoursWorked, 0) / checkedInCrew.length * 10) / 10 || 0}h
                </div>
                <div className="text-xs text-muted-foreground">Avg Hours</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {Math.floor(checkedInCrew.length / 2)}
                </div>
                <div className="text-xs text-muted-foreground">Buddy Pairs</div>
              </div>
            </div>

            {/* Crew List */}
            <div className="space-y-2">
              {crew.map(member => {
                const buddy = member.buddyId ? crew.find(c => c.id === member.buddyId) : null;
                const minutesSinceBreak = member.lastBreak
                  ? Math.floor((currentTime - member.lastBreak.getTime()) / 60000)
                  : null;
                const needsBreak = minutesSinceBreak !== null && minutesSinceBreak >= breakSchedule.interval;

                return (
                  <div key={member.id} className={`flex items-center justify-between p-3 rounded-lg ${member.checkedIn ? "bg-muted/30" : "bg-muted/10 opacity-60"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${member.checkedIn ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {member.name}
                          {needsBreak && (
                            <Badge className="bg-amber-500 text-xs">Break Overdue</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{member.role}</span>
                          {buddy && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                Buddy: {buddy.name.split(' ')[0]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {member.checkedIn && (
                      <div className="text-right text-sm">
                        <div className="font-mono">{member.hoursWorked}h</div>
                        {minutesSinceBreak !== null && (
                          <div className={`text-xs ${needsBreak ? "text-amber-400" : "text-muted-foreground"}`}>
                            Break: {minutesSinceBreak}m ago
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EMERGENCY PROCEDURES */}
      <Card className="border-rose-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-400">
            <Siren className="w-5 h-5" />
            Emergency Procedures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Emergency Contacts */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Emergency Contacts
              </h4>
              <div className="space-y-2">
                {EMERGENCY_CONTACTS.map(contact => (
                  <div key={contact.id} className={`flex items-center justify-between p-3 rounded-lg ${contact.primary ? "bg-rose-500/20 border border-rose-500/30" : "bg-muted/30"}`}>
                    <div>
                      <div className="font-semibold">{contact.name}</div>
                      <div className="text-xs text-muted-foreground">{contact.role}</div>
                    </div>
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Protocols */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Weather Emergency Protocols
              </h4>
              <div className="space-y-3">
                <ProtocolCard
                  icon={<Snowflake className="w-4 h-4 text-blue-400" />}
                  title="Extreme Cold (<20°F)"
                  steps={["Stop work immediately", "Move crew to warming station", "Check for frostbite signs", "Do not resume until temp >25°F"]}
                />
                <ProtocolCard
                  icon={<Sun className="w-4 h-4 text-amber-400" />}
                  title="Extreme Heat (>100°F)"
                  steps={["Stop rooftop work", "Move to shaded/cooled area", "Mandatory hydration", "Monitor for heat illness"]}
                />
                <ProtocolCard
                  icon={<Wind className="w-4 h-4 text-slate-400" />}
                  title="High Winds (>35 mph)"
                  steps={["Secure all loose materials", "Evacuate roof immediately", "Account for all crew", "Resume when wind <25 mph"]}
                />
              </div>
            </div>
          </div>

          {/* First Aid Location */}
          <div className="mt-6 p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="font-semibold">First Aid Station Location</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ground level, NE corner of building - Next to crew parking area
                </div>
              </div>
              <div className="ml-auto">
                <Badge className="bg-emerald-500">Stocked & Ready</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function QuickStat({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: string; alert?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${alert ? "bg-amber-500/20" : "bg-white/5"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-bold font-mono ${alert ? "text-amber-400" : ""}`}>{value}</div>
    </div>
  );
}

function ProtocolCard({ icon, title, steps }: { icon: React.ReactNode; title: string; steps: string[] }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <ol className="space-y-1 text-xs text-muted-foreground">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
