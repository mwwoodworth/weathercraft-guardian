"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Timer,
  Bell,
  X
} from "lucide-react";
import type { WorkLogStats } from "@/lib/work-log";

type AlertSeverity = "info" | "warning" | "critical" | "success";

type StatusAlert = {
  id: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  autoDismiss?: number; // seconds until auto-dismiss
};

type RealTimeStatusProps = {
  projectLocation: {
    lat: number;
    lon: number;
    name: string;
  };
  lastWeatherUpdate?: Date;
  assemblyGoCount: number;
  totalAssemblies: number;
  systemCompliant: boolean;
  workLogStats?: WorkLogStats;
  onRefresh?: () => void | Promise<void>;
};

// Calculate sunrise/sunset times (simplified algorithm for demo)
// In production, use a proper library like suncalc
function calculateSunTimes(lat: number, date: Date) {
  // Simplified calculation - approximation for Colorado Springs area
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // Base times adjusted by day of year (simplified)
  const baseRise = 6.5 + Math.sin((dayOfYear - 80) * Math.PI / 182.5) * 1.5;
  const baseSet = 17.5 - Math.sin((dayOfYear - 80) * Math.PI / 182.5) * 1.5;

  // Adjust for latitude (simplified)
  const latAdjust = (lat - 39) * 0.1;

  const sunriseHour = baseRise - latAdjust;
  const sunsetHour = baseSet + latAdjust;

  const sunrise = new Date(date);
  sunrise.setHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0, 0);

  const sunset = new Date(date);
  sunset.setHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0, 0);

  return { sunrise, sunset };
}

export default function RealTimeStatus({
  projectLocation,
  lastWeatherUpdate,
  assemblyGoCount,
  totalAssemblies,
  systemCompliant,
  workLogStats,
  onRefresh
}: RealTimeStatusProps) {
  // Initialize as null to avoid hydration mismatch - will be set on client only
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [dataFreshness, setDataFreshness] = useState<"fresh" | "stale" | "old">("fresh");
  const [nextRefreshCountdown, setNextRefreshCountdown] = useState(300); // 5 minutes
  const [alerts, setAlerts] = useState<StatusAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate sun times (use current time or fallback to now for SSR)
  const currentDateString = currentTime?.toDateString() ?? "";
  const { sunrise, sunset } = useMemo(
    () => calculateSunTimes(projectLocation.lat, currentTime || new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectLocation.lat, currentDateString]
  );

  const fallbackStats: WorkLogStats = {
    totalDays: 0,
    totalLaborHours: 0,
    averageHoursPerDay: 0,
    workStreak: 0,
    daysSinceLastWork: null
  };
  const resolvedStats = workLogStats ?? fallbackStats;

  // Progress ring calculation
  const progressPercentage = (assemblyGoCount / totalAssemblies) * 100;
  const circumference = 2 * Math.PI * 18; // radius = 18
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  // Handle refresh - must be defined before the useEffect that uses it
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Refresh failed";
      setAlerts(prev => {
        const newAlert: StatusAlert = {
          id: `alert-${Date.now()}`,
          message,
          severity: "warning",
          autoDismiss: 6,
          timestamp: new Date()
        };
        return [newAlert, ...prev].slice(0, 3);
      });
    }
    setIsRefreshing(false);
    setNextRefreshCountdown(300);
  }, [onRefresh]);

  // Update clock every second - set initial time on client mount
  useEffect(() => {
    setCurrentTime(new Date()); // Set initial time on client
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer for next refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefreshCountdown(prev => {
        if (prev <= 1) {
          // Trigger refresh
          handleRefresh();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleRefresh]);

  // Check data freshness
  useEffect(() => {
    if (!lastWeatherUpdate) {
      setDataFreshness("old");
      return;
    }

    const checkFreshness = () => {
      const ageMs = Date.now() - lastWeatherUpdate.getTime();
      const ageMinutes = ageMs / 60000;

      if (ageMinutes < 5) setDataFreshness("fresh");
      else if (ageMinutes < 15) setDataFreshness("stale");
      else setDataFreshness("old");
    };

    checkFreshness();
    const timer = setInterval(checkFreshness, 30000);
    return () => clearInterval(timer);
  }, [lastWeatherUpdate]);

  // Simulate connection status changes (in production, use actual network detection)
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Add alert
  const addAlert = useCallback((alert: Omit<StatusAlert, "id" | "timestamp">) => {
    const newAlert: StatusAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      timestamp: new Date()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 3));

    // Auto-dismiss
    if (alert.autoDismiss) {
      setTimeout(() => {
        dismissAlert(newAlert.id);
      }, alert.autoDismiss * 1000);
    }
  }, [dismissAlert]);

  // Demo: Add an alert on mount for demonstration
  useEffect(() => {
    const timer = setTimeout(() => {
      addAlert({
        message: "Weather conditions optimal for all assemblies",
        severity: "success",
        autoDismiss: 8
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [addAlert]);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  };

  const formatTimeShort = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Severity colors
  const severityConfig: Record<AlertSeverity, { bg: string; border: string; icon: typeof AlertTriangle; text: string }> = {
    info: { bg: "bg-blue-500/10", border: "border-blue-500/50", icon: Bell, text: "text-blue-400" },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/50", icon: AlertTriangle, text: "text-amber-400" },
    critical: { bg: "bg-rose-500/10", border: "border-rose-500/50", icon: XCircle, text: "text-rose-400" },
    success: { bg: "bg-emerald-500/10", border: "border-emerald-500/50", icon: CheckCircle2, text: "text-emerald-400" }
  };

  // Freshness config
  const freshnessConfig = {
    fresh: { color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Live" },
    stale: { color: "text-amber-400", bg: "bg-amber-500/20", label: "Syncing" },
    old: { color: "text-rose-400", bg: "bg-rose-500/20", label: "Outdated" }
  };

  return (
    <div className="space-y-3">
      {/* Main Status Bar */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-r from-card via-card to-card/80">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 animate-pulse" />

        <div className="relative p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Live Clock & Date */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {/* Pulsing ring around clock */}
                <motion.div
                  className="absolute -inset-2 rounded-xl bg-primary/20"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.3, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative bg-card border border-primary/30 rounded-xl p-3 shadow-lg shadow-primary/10">
                  <Clock className="w-5 h-5 text-primary mb-1 mx-auto" />
                  <div className="font-mono text-2xl font-bold tracking-wider text-foreground">
                    {currentTime ? formatTime(currentTime) : "--:--:--"}
                  </div>
                  <div className="text-xs text-muted-foreground text-center mt-1 flex items-center gap-1 justify-center">
                    <Calendar className="w-3 h-3" />
                    {currentTime ? currentTime.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric"
                    }) : "---"}
                  </div>
                </div>
              </div>

              {/* Sun Times */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm">
                  <Sunrise className="w-4 h-4 text-amber-400" />
                  <span className="text-muted-foreground">Rise:</span>
                  <span className="font-mono font-medium">{formatTimeShort(sunrise)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sunset className="w-4 h-4 text-orange-400" />
                  <span className="text-muted-foreground">Set:</span>
                  <span className="font-mono font-medium">{formatTimeShort(sunset)}</span>
                </div>
                {/* Daylight indicator */}
                <div className="flex items-center gap-1 mt-1">
                  {currentTime && currentTime >= sunrise && currentTime <= sunset ? (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <Sun className="w-3 h-3" /> Daylight
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Sun className="w-3 h-3 opacity-50" /> {currentTime ? "Night" : "---"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* System Health Indicators */}
            <div className="flex items-center gap-3">
              {/* Live Indicator */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${freshnessConfig[dataFreshness].bg}`}>
                <motion.div
                  className={`w-2 h-2 rounded-full ${dataFreshness === "fresh" ? "bg-emerald-500" : dataFreshness === "stale" ? "bg-amber-500" : "bg-rose-500"}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className={`text-xs font-semibold uppercase tracking-wider ${freshnessConfig[dataFreshness].color}`}>
                  {freshnessConfig[dataFreshness].label}
                </span>
              </div>

              {/* Connection Status */}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isConnected ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-rose-400" />
                )}
                <span className={`text-xs ${isConnected ? "text-emerald-400" : "text-rose-400"}`}>
                  {isConnected ? "Online" : "Offline"}
                </span>
              </div>

              {/* Last Update */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
                <span>
                  {lastWeatherUpdate
                    ? `Updated ${formatTimeShort(lastWeatherUpdate)}`
                    : "No data"}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              {/* Days Since Last Work */}
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {resolvedStats.daysSinceLastWork ?? "—"}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Days Since Work</div>
              </div>

              {/* Work Streak */}
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-blue-400">{resolvedStats.workStreak}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Work Streak</div>
              </div>

              {/* Assemblies Cleared - Progress Ring */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="28"
                    cy="28"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/30"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className={systemCompliant ? "text-emerald-500" : "text-amber-500"}
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-bold">{assemblyGoCount}/{totalAssemblies}</span>
                  <span className="text-[8px] text-muted-foreground">GO</span>
                </div>
              </div>

              {/* Next Refresh Countdown */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <div className="text-center">
                  <div className="font-mono text-sm font-semibold">{formatCountdown(nextRefreshCountdown)}</div>
                  <div className="text-[9px] text-muted-foreground uppercase">Next Check</div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                  title="Refresh now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom status line */}
        <motion.div
          className={`h-0.5 ${systemCompliant ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" : "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500"}`}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 200%" }}
        />
      </div>

      {/* Alert Banner Area */}
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, x: 100, height: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`relative overflow-hidden rounded-lg border ${config.border} ${config.bg}`}
            >
              {/* Progress bar for auto-dismiss */}
              {alert.autoDismiss && (
                <motion.div
                  className={`absolute bottom-0 left-0 h-0.5 ${config.text.replace("text-", "bg-")}`}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: alert.autoDismiss, ease: "linear" }}
                />
              )}

              <div className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Icon className={`w-5 h-5 ${config.text}`} />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
