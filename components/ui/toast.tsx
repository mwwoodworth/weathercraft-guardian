"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Thermometer,
  CloudRain,
  Wind,
  Snowflake
} from "lucide-react";

// Toast types and their configurations
export type ToastType = "success" | "warning" | "error" | "info";

export type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
  index: number;
}

// Toast configuration by type
const TOAST_CONFIG: Record<ToastType, {
  icon: React.ReactNode;
  containerClass: string;
  iconClass: string;
  progressClass: string;
}> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    containerClass: "border-emerald-500/50 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5",
    iconClass: "text-emerald-500",
    progressClass: "bg-emerald-500"
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    containerClass: "border-amber-500/50 bg-gradient-to-r from-amber-500/15 to-amber-500/5",
    iconClass: "text-amber-500",
    progressClass: "bg-amber-500"
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    containerClass: "border-rose-500/50 bg-gradient-to-r from-rose-500/15 to-rose-500/5",
    iconClass: "text-rose-500",
    progressClass: "bg-rose-500"
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    containerClass: "border-blue-500/50 bg-gradient-to-r from-blue-500/15 to-blue-500/5",
    iconClass: "text-blue-500",
    progressClass: "bg-blue-500"
  }
};

// Weather-specific icon mapping
export const WEATHER_ICONS = {
  temperature: <Thermometer className="w-5 h-5" />,
  precipitation: <CloudRain className="w-5 h-5" />,
  wind: <Wind className="w-5 h-5" />,
  cold: <Snowflake className="w-5 h-5" />
};

export function Toast({ toast, onDismiss, index }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  const [progress, setProgress] = React.useState(100);
  const [isPaused, setIsPaused] = React.useState(false);

  const config = TOAST_CONFIG[toast.type];
  const duration = toast.duration ?? 5000;
  const hasAutoDismiss = duration > 0;

  // Entry animation
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Progress and auto-dismiss
  React.useEffect(() => {
    if (!hasAutoDismiss || isPaused) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, hasAutoDismiss, isPaused]);

  const handleDismiss = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
      toast.onDismiss?.();
    }, 300);
  }, [toast, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        // Base styles
        "relative overflow-hidden w-[380px] rounded-xl border backdrop-blur-xl shadow-2xl",
        "transition-all duration-300 ease-out",
        config.containerClass,
        // Animation states
        isVisible && !isExiting
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
        // Stacking offset
        index > 0 && "scale-[0.98]"
      )}
      style={{
        transform: isVisible && !isExiting
          ? `translateX(0) translateY(${index * 4}px)`
          : `translateX(100%) translateY(${index * 4}px)`,
        zIndex: 100 - index
      }}
    >
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("flex-shrink-0 mt-0.5", config.iconClass)}>
            {toast.icon || config.icon}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground leading-tight">
              {toast.title}
            </h4>
            {toast.description && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {toast.description}
              </p>
            )}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  handleDismiss();
                }}
                className={cn(
                  "mt-2 text-xs font-semibold px-3 py-1.5 rounded-md",
                  "transition-colors duration-200",
                  "hover:bg-white/10",
                  config.iconClass
                )}
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-lg",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-white/10 transition-colors duration-200"
            )}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {hasAutoDismiss && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className={cn(
              "h-full transition-all duration-50 ease-linear",
              config.progressClass,
              isPaused && "opacity-50"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Toast container component
interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
  position?: ToastPosition;
  maxVisible?: number;
}

export function ToastContainer({
  toasts,
  onDismiss,
  position = "top-right",
  maxVisible = 5
}: ToastContainerProps) {
  const positionClasses: Record<ToastPosition, string> = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2"
  };

  const visibleToasts = toasts.slice(0, maxVisible);

  if (visibleToasts.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed z-[9999] flex flex-col gap-3",
        positionClasses[position]
      )}
      aria-label="Notifications"
    >
      {visibleToasts.map((toast, index) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          index={index}
        />
      ))}

      {/* Overflow indicator */}
      {toasts.length > maxVisible && (
        <div className="text-center text-xs text-muted-foreground py-2">
          +{toasts.length - maxVisible} more notification{toasts.length - maxVisible > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
