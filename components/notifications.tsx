"use client";

import * as React from "react";
import { ToastContainer, ToastData, ToastType, ToastPosition, WEATHER_ICONS } from "@/components/ui/toast";

// Types for notification context
interface NotificationOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

interface NotificationContextValue {
  // Core notification methods
  notify: (options: NotificationOptions) => string;
  success: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;

  // Weather-specific notifications
  weatherAlert: (options: WeatherAlertOptions) => string;

  // Management
  dismiss: (id: string) => void;
  dismissAll: () => void;

  // State
  toasts: ToastData[];
}

interface WeatherAlertOptions {
  alertType: "temperature" | "precipitation" | "wind" | "cold";
  title: string;
  description?: string;
  severity?: "warning" | "error";
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Generate unique ID
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create context
const NotificationContext = React.createContext<NotificationContextValue | null>(null);

// Provider props
interface NotificationProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxVisible?: number;
  defaultDuration?: number;
}

// Provider component
export function NotificationProvider({
  children,
  position = "top-right",
  maxVisible = 5,
  defaultDuration = 5000
}: NotificationProviderProps) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  // Add a new toast
  const addToast = React.useCallback((toast: Omit<ToastData, "id">) => {
    const id = generateId();
    setToasts(prev => [{ ...toast, id }, ...prev]);
    return id;
  }, []);

  // Remove a toast by ID
  const dismiss = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Clear all toasts
  const dismissAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  // Generic notify function
  const notify = React.useCallback((options: NotificationOptions): string => {
    return addToast({
      type: options.type || "info",
      title: options.title,
      description: options.description,
      duration: options.duration ?? defaultDuration,
      icon: options.icon,
      action: options.action,
      onDismiss: options.onDismiss
    });
  }, [addToast, defaultDuration]);

  // Shorthand methods
  const success = React.useCallback((title: string, description?: string): string => {
    return notify({ title, description, type: "success" });
  }, [notify]);

  const warning = React.useCallback((title: string, description?: string): string => {
    return notify({ title, description, type: "warning" });
  }, [notify]);

  const error = React.useCallback((title: string, description?: string): string => {
    return notify({ title, description, type: "error" });
  }, [notify]);

  const info = React.useCallback((title: string, description?: string): string => {
    return notify({ title, description, type: "info" });
  }, [notify]);

  // Weather-specific alert
  const weatherAlert = React.useCallback((options: WeatherAlertOptions): string => {
    const icon = WEATHER_ICONS[options.alertType];
    return notify({
      title: options.title,
      description: options.description,
      type: options.severity || "warning",
      icon,
      action: options.action,
      duration: 8000 // Weather alerts stay longer
    });
  }, [notify]);

  const contextValue: NotificationContextValue = React.useMemo(() => ({
    notify,
    success,
    warning,
    error,
    info,
    weatherAlert,
    dismiss,
    dismissAll,
    toasts
  }), [notify, success, warning, error, info, weatherAlert, dismiss, dismissAll, toasts]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismiss}
        position={position}
        maxVisible={maxVisible}
      />
    </NotificationContext.Provider>
  );
}

// Hook to use notifications
export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

// ========== WEATHER ALERT HOOKS ==========

// Configuration for weather thresholds
export interface WeatherThresholds {
  tempMin: number;        // Minimum safe temperature (default: 40)
  tempMax: number;        // Maximum safe temperature (default: 95)
  tempCritical: number;   // Critical low temperature (default: 32)
  windMax: number;        // Maximum safe wind speed (default: 25)
  windCaution: number;    // Caution wind speed (default: 15)
  precipMax: number;      // Max precipitation probability % (default: 40)
  humidityMax: number;    // Max humidity % (default: 85)
}

const DEFAULT_THRESHOLDS: WeatherThresholds = {
  tempMin: 40,
  tempMax: 95,
  tempCritical: 32,
  windMax: 25,
  windCaution: 15,
  precipMax: 40,
  humidityMax: 85
};

interface WeatherConditions {
  temp: number;
  windSpeed: number;
  precipProbability: number;
  humidity: number;
  description?: string;
}

// Hook to monitor weather conditions and trigger alerts
export function useWeatherAlerts(
  conditions: WeatherConditions | null,
  thresholds: Partial<WeatherThresholds> = {},
  enabled: boolean = true
) {
  const { weatherAlert } = useNotification();
  const lastAlerts = React.useRef<Set<string>>(new Set());
  const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  React.useEffect(() => {
    if (!enabled || !conditions) return;

    const alerts: Array<{ key: string; options: WeatherAlertOptions }> = [];

    // Temperature checks
    if (conditions.temp <= mergedThresholds.tempCritical) {
      alerts.push({
        key: "temp-critical",
        options: {
          alertType: "cold",
          title: "Critical Temperature Warning",
          description: `Temperature at ${Math.round(conditions.temp)}°F - Below freezing. All outdoor work suspended.`,
          severity: "error",
          action: {
            label: "View Guidelines",
            onClick: () => console.log("Opening cold weather guidelines")
          }
        }
      });
    } else if (conditions.temp < mergedThresholds.tempMin) {
      alerts.push({
        key: "temp-low",
        options: {
          alertType: "temperature",
          title: "Low Temperature Alert",
          description: `Temperature at ${Math.round(conditions.temp)}°F - Below minimum threshold for adhesive application.`,
          severity: "warning"
        }
      });
    } else if (conditions.temp > mergedThresholds.tempMax) {
      alerts.push({
        key: "temp-high",
        options: {
          alertType: "temperature",
          title: "High Temperature Alert",
          description: `Temperature at ${Math.round(conditions.temp)}°F - Heat safety protocols in effect.`,
          severity: "warning"
        }
      });
    }

    // Wind checks
    if (conditions.windSpeed > mergedThresholds.windMax) {
      alerts.push({
        key: "wind-critical",
        options: {
          alertType: "wind",
          title: "High Wind Warning",
          description: `Wind speed ${Math.round(conditions.windSpeed)} mph - Suspend rooftop operations immediately.`,
          severity: "error"
        }
      });
    } else if (conditions.windSpeed > mergedThresholds.windCaution) {
      alerts.push({
        key: "wind-caution",
        options: {
          alertType: "wind",
          title: "Wind Advisory",
          description: `Wind speed ${Math.round(conditions.windSpeed)} mph - Use caution with sheet handling.`,
          severity: "warning"
        }
      });
    }

    // Precipitation check
    if (conditions.precipProbability > mergedThresholds.precipMax) {
      alerts.push({
        key: "precip-high",
        options: {
          alertType: "precipitation",
          title: "Precipitation Alert",
          description: `${conditions.precipProbability}% chance of precipitation - Secure materials and prepare covers.`,
          severity: "warning"
        }
      });
    }

    // Only fire new alerts (don't repeat)
    const currentAlertKeys = new Set(alerts.map(a => a.key));

    alerts.forEach(({ key, options }) => {
      if (!lastAlerts.current.has(key)) {
        weatherAlert(options);
      }
    });

    // Update last alerts for next comparison
    lastAlerts.current = currentAlertKeys;

  }, [
    conditions?.temp,
    conditions?.windSpeed,
    conditions?.precipProbability,
    conditions?.humidity,
    enabled,
    weatherAlert,
    mergedThresholds
  ]);
}

// ========== DEMO COMPONENT FOR TESTING ==========

export function NotificationDemo() {
  const { success, warning, error, info, weatherAlert, dismissAll } = useNotification();

  const triggerSuccess = () => {
    success(
      "Assembly Cleared",
      "All weather conditions within spec for Green-Lock Plus application."
    );
  };

  const triggerWarning = () => {
    warning(
      "Temperature Approaching Threshold",
      "Current temp 42°F - Monitor conditions closely."
    );
  };

  const triggerError = () => {
    error(
      "Work Suspension Required",
      "Multiple assemblies non-compliant. Review flagged components."
    );
  };

  const triggerInfo = () => {
    info(
      "Forecast Updated",
      "5-day forecast has been refreshed with latest data."
    );
  };

  const triggerWeatherAlert = () => {
    weatherAlert({
      alertType: "precipitation",
      title: "Rain Expected",
      description: "60% precipitation probability in next 2 hours. Cover exposed materials.",
      severity: "warning",
      action: {
        label: "View Forecast",
        onClick: () => console.log("Opening forecast")
      }
    });
  };

  const triggerMultiple = () => {
    success("System Online", "All sensors reporting.");
    setTimeout(() => warning("Wind Speed Rising", "Now at 18 mph."), 500);
    setTimeout(() => info("Crew Check-in", "Morning briefing complete."), 1000);
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
      <button
        onClick={triggerSuccess}
        className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
      >
        Success
      </button>
      <button
        onClick={triggerWarning}
        className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
      >
        Warning
      </button>
      <button
        onClick={triggerError}
        className="px-3 py-1.5 text-sm bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
      >
        Error
      </button>
      <button
        onClick={triggerInfo}
        className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Info
      </button>
      <button
        onClick={triggerWeatherAlert}
        className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
      >
        Weather Alert
      </button>
      <button
        onClick={triggerMultiple}
        className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:opacity-90 transition-opacity"
      >
        Stack Multiple
      </button>
      <button
        onClick={dismissAll}
        className="px-3 py-1.5 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
      >
        Clear All
      </button>
    </div>
  );
}
