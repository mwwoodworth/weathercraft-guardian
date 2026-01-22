"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import {
  LayoutDashboard,
  Brain,
  CalendarDays,
  Users,
  FolderOpen,
  HardHat,
  Package,
  Menu,
  X,
  RefreshCw,
  WifiOff,
  Wifi,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ========== MOBILE HOOKS ==========
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, showOffline, setShowOffline };
}

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0 && diff < 150) {
      setPullDistance(diff);
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 80) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, pullDistance, isRefreshing };
}

// ========== MOBILE NAVIGATION ==========
type TabId = "dashboard" | "calendar" | "intelligence" | "collaboration" | "documents" | "safety" | "materials";

const NAV_ITEMS: { id: TabId; icon: typeof LayoutDashboard; label: string; shortLabel: string }[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Mission Control", shortLabel: "Home" },
  { id: "intelligence", icon: Brain, label: "AI Intelligence", shortLabel: "AI" },
  { id: "calendar", icon: CalendarDays, label: "Calendar", shortLabel: "Calendar" },
  { id: "collaboration", icon: Users, label: "Collaboration", shortLabel: "Team" },
  { id: "safety", icon: HardHat, label: "Crew Safety", shortLabel: "Safety" },
];

interface MobileBottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  badges?: Partial<Record<TabId, number>>;
}

export function MobileBottomNav({ activeTab, onTabChange, badges = {} }: MobileBottomNavProps) {
  return (
    <nav className="mobile-nav md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map(({ id, icon: Icon, shortLabel }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`mobile-nav-item touch-ripple no-select ${activeTab === id ? 'active' : ''}`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {badges[id] && badges[id]! > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {badges[id]! > 9 ? '9+' : badges[id]}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{shortLabel}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ========== HAMBURGER MENU ==========
interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  projectName: string;
}

const FULL_NAV_ITEMS: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Mission Control" },
  { id: "intelligence", icon: Brain, label: "AI Intelligence" },
  { id: "calendar", icon: CalendarDays, label: "Project Calendar" },
  { id: "collaboration", icon: Users, label: "Collaboration" },
  { id: "documents", icon: FolderOpen, label: "Documents" },
  { id: "safety", icon: HardHat, label: "Crew Safety" },
  { id: "materials", icon: Package, label: "Materials" },
];

export function HamburgerMenu({ isOpen, onClose, activeTab, onTabChange, projectName }: HamburgerMenuProps) {
  return (
    <div className={`hamburger-menu ${isOpen ? 'open' : ''}`}>
      <div className="hamburger-menu-content">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold">WEATHERCRAFT</span>
          </div>
          <button onClick={onClose} className="touch-target flex items-center justify-center">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-sm text-muted-foreground mb-4 px-4">
          Project: {projectName}
        </div>

        <div className="space-y-1">
          {FULL_NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                onTabChange(id);
                onClose();
              }}
              className={`hamburger-menu-item w-full ${activeTab === id ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== OFFLINE INDICATOR ==========
interface OfflineIndicatorProps {
  isOnline: boolean;
  showBanner: boolean;
  onDismiss: () => void;
}

export function OfflineIndicator({ isOnline, showBanner, onDismiss }: OfflineIndicatorProps) {
  if (!showBanner) return null;

  return (
    <div className={`offline-banner ${showBanner ? 'visible' : ''} ${isOnline ? 'cached' : ''}`}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online - refreshing data...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You are offline - showing cached data</span>
          </>
        )}
        <button onClick={onDismiss} className="ml-2 text-xs underline">
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ========== PULL TO REFRESH INDICATOR ==========
interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
}

export function PullToRefreshIndicator({ pullDistance, isRefreshing }: PullToRefreshIndicatorProps) {
  const visible = pullDistance > 20;
  const ready = pullDistance > 80;

  return (
    <div
      className={`pull-indicator ${visible ? 'visible' : ''} ${isRefreshing ? 'loading' : ''}`}
      style={{ transform: visible ? `translateX(-50%) translateY(${Math.min(pullDistance, 100)}px)` : undefined }}
    >
      <RefreshCw className={`w-5 h-5 ${ready ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
  );
}

// ========== MOBILE GO/NO-GO STATUS ==========
interface MobileStatusDisplayProps {
  systemCompliant: boolean;
  goCount: number;
  totalCount: number;
  onExpand?: () => void;
  expanded?: boolean;
}

export function MobileStatusDisplay({ systemCompliant, goCount, totalCount, onExpand, expanded }: MobileStatusDisplayProps) {
  return (
    <button
      onClick={onExpand}
      className={`mobile-status-display w-full ${systemCompliant ? 'go' : 'no-go'} touch-ripple`}
    >
      <div className="mobile-status-icon">
        {systemCompliant ? (
          <CheckCircle2 className="w-full h-full text-emerald-500" />
        ) : (
          <XCircle className="w-full h-full text-rose-500" />
        )}
      </div>
      <div className={`mobile-status-text ${systemCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
        {systemCompliant ? "ALL GO" : "HOLD"}
      </div>
      <div className="mobile-status-subtext text-muted-foreground">
        {goCount}/{totalCount} Assemblies Cleared
      </div>
      {onExpand && (
        <ChevronDown className={`w-5 h-5 mt-2 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      )}
    </button>
  );
}

// ========== MOBILE TEMPERATURE DISPLAY ==========
interface MobileTempDisplayProps {
  temp: number;
  condition: string;
  icon?: string;
  high?: number;
  low?: number;
}

export function MobileTempDisplay({ temp, condition, icon, high, low }: MobileTempDisplayProps) {
  return (
    <div className="mobile-temp-display">
      <div className="flex items-start">
        <span className="mobile-temp-value">{Math.round(temp)}</span>
        <span className="mobile-temp-unit">F</span>
      </div>
      {icon && (
        <img
          src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
          alt={condition}
          className="w-16 h-16 -mt-2"
        />
      )}
      <div className="mobile-temp-condition">{condition}</div>
      {high !== undefined && low !== undefined && (
        <div className="flex gap-3 text-sm mt-2">
          <span className="text-emerald-400">H: {Math.round(high)}F</span>
          <span className="text-blue-400">L: {Math.round(low)}F</span>
        </div>
      )}
    </div>
  );
}

// ========== MOBILE WEATHER STATS ==========
interface MobileWeatherStatsProps {
  stats: { label: string; value: string; alert?: boolean }[];
}

export function MobileWeatherStats({ stats }: MobileWeatherStatsProps) {
  return (
    <div className="mobile-stats-row">
      {stats.map((stat, i) => (
        <div key={i} className={`mobile-stat-item ${stat.alert ? 'bg-amber-500/20' : ''}`}>
          <span className={`mobile-stat-value ${stat.alert ? 'text-amber-400' : ''}`}>{stat.value}</span>
          <span className="mobile-stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

// ========== SWIPEABLE CARD CAROUSEL ==========
interface SwipeableCarouselProps {
  children: ReactNode[];
  onSlideChange?: (index: number) => void;
}

export function SwipeableCarousel({ children, onSlideChange }: SwipeableCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const itemWidth = containerRef.current.clientWidth;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      onSlideChange?.(newIndex);
    }
  };

  return (
    <div>
      <div
        ref={containerRef}
        className="swipe-container flex gap-4 pb-2"
        onScroll={handleScroll}
      >
        {children.map((child, i) => (
          <div key={i} className="swipe-item w-[calc(100%-2rem)] min-w-[calc(100%-2rem)]">
            {child}
          </div>
        ))}
      </div>
      <div className="scroll-indicator">
        {children.map((_, i) => (
          <div key={i} className={`scroll-indicator-dot ${i === activeIndex ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}

// ========== SWIPE ACTION LIST ITEM ==========
interface SwipeActionItemProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { icon: ReactNode; color: string };
  rightAction?: { icon: ReactNode; color: string };
}

export function SwipeActionItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction
}: SwipeActionItemProps) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startX.current;
    // Limit swipe distance
    const limitedOffset = Math.max(-120, Math.min(120, diff));
    setOffset(limitedOffset);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (offset > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (offset < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    setOffset(0);
  };

  return (
    <div className="swipe-action-container">
      {leftAction && (
        <div className="swipe-action-left" style={{ background: leftAction.color }}>
          {leftAction.icon}
        </div>
      )}
      {rightAction && (
        <div className="swipe-action-right" style={{ background: rightAction.color }}>
          {rightAction.icon}
        </div>
      )}
      <div
        className={`swipe-action-content ${isSwiping ? 'swiping' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// ========== MOBILE HEADER ==========
interface MobileHeaderProps {
  projectName: string;
  onMenuOpen: () => void;
  isOnline: boolean;
  lastUpdated: Date;
}

export function MobileHeader({ projectName, onMenuOpen, isOnline, lastUpdated }: MobileHeaderProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-card border-b border-border md:hidden safe-area-top">
      <button
        onClick={onMenuOpen}
        className="touch-target flex items-center justify-center -ml-2"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <span className="font-bold text-sm">GUARDIAN</span>
      </div>

      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-emerald-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-rose-500" />
        )}
        <span className="text-xs text-muted-foreground">
          {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
