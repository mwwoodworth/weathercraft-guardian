// Zustand store for Weathercraft Guardian
// Provides client-side persistence via localStorage

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProjectItem, ActivityEntry, Stakeholder } from "./collaboration";
import { GUARDIAN_DEMO_MODE } from "./demo-mode";

// Work entry type for calendar tracking
export type WorkEntry = {
  date: string; // ISO date string YYYY-MM-DD
  type: "worked" | "weather_hold" | "weekend" | "scheduled" | "holiday";
  notes?: string;
  sqft?: number;
  weatherReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Daily log entry type
export type DailyLogEntry = {
  id: string;
  date: string;
  weatherConditions: string;
  tempHigh: number;
  tempLow: number;
  crewCount: number;
  workPerformed: string[];
  materialsUsed: string[];
  equipmentUsed: string[];
  issues: string[];
  safetyNotes: string[];
  photos: string[];
  submittedBy: string;
  submittedAt: Date;
  sqftCompleted: number;
  hoursWorked: number;
};

// Winter weather work plan type
export type WinterWorkPlan = {
  id: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  preparedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  sections: {
    temperatureProtocols: string[];
    windProtocols: string[];
    precipitationProtocols: string[];
    materialStorage: string[];
    crewSafety: string[];
    emergencyProcedures: string[];
    communicationPlan: string[];
    equipmentRequirements: string[];
  };
  temperatureThresholds: {
    adhesiveMin: number;
    coatingMin: number;
    metalPanelMin: number;
    workSuspension: number;
  };
  windThresholds: {
    cautionSpeed: number;
    suspensionSpeed: number;
    gustLimit: number;
  };
};

interface GuardianState {
  // Project items (issues, RFIs, submittals, etc.)
  items: ProjectItem[];
  addItem: (item: Omit<ProjectItem, "id" | "createdAt" | "updatedAt" | "comments">) => void;
  updateItem: (id: string, updates: Partial<ProjectItem>) => void;
  addComment: (itemId: string, author: string, authorRole: Stakeholder, content: string) => void;

  // Activity feed
  activity: ActivityEntry[];
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;

  // Work history/calendar
  workEntries: Record<string, WorkEntry>;
  setWorkEntry: (date: string, entry: Omit<WorkEntry, "date" | "createdAt" | "updatedAt">) => void;
  removeWorkEntry: (date: string) => void;

  // Daily logs
  dailyLogs: DailyLogEntry[];
  addDailyLog: (log: Omit<DailyLogEntry, "id" | "submittedAt">) => void;
  updateDailyLog: (id: string, updates: Partial<DailyLogEntry>) => void;

  // Winter work plan
  winterPlan: WinterWorkPlan | null;
  setWinterPlan: (plan: Omit<WinterWorkPlan, "id" | "createdAt" | "updatedAt">) => void;
  updateWinterPlan: (updates: Partial<WinterWorkPlan>) => void;

  // Initialize with demo data
  initializeWithDemoData: () => void;
}

// Generate unique ID
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default winter work plan for Building 140
const DEFAULT_WINTER_PLAN: Omit<WinterWorkPlan, "id" | "createdAt" | "updatedAt"> = {
  version: "1.0",
  preparedBy: "WCI Team",
  sections: {
    temperatureProtocols: [
      "Monitor ambient temperature continuously using on-site weather station and Weather Guardian AI system",
      "No Green-Lock Plus adhesive application when temperature is below 40°F or falling",
      "No R-Mer Seal underlayment installation when temperature is below 50°F",
      "No Pyramic Plus coating application when temperature is below 50°F",
      "Allow 2-hour warm-up period after temperature rises above threshold before starting work",
      "Document all temperature readings in daily log at 6:00 AM, 12:00 PM, and 4:00 PM"
    ],
    windProtocols: [
      "Check wind forecast before each work day using Weather Guardian system",
      "No membrane sheet handling when sustained winds exceed 20 mph",
      "Additional crew members required for sheet handling when winds exceed 15 mph",
      "Suspend all rooftop operations when gusts exceed 30 mph",
      "Secure all loose materials at end of each day regardless of forecast",
      "Stage tarps and weighted ballast for emergency material protection"
    ],
    precipitationProtocols: [
      "No roofing installation during active precipitation (rain, snow, sleet)",
      "Surfaces must be dry before adhesive or coating application",
      "Cover all open work areas when precipitation probability exceeds 60%",
      "Allow minimum 24-hour dry time for coatings before precipitation exposure",
      "Inspect all previous day's work after precipitation events",
      "Document any moisture intrusion or material damage immediately"
    ],
    materialStorage: [
      "Store all adhesives in heated enclosure maintaining 60-80°F",
      "Condition Green-Lock Plus at room temperature (65°F+) for 24 hours before use",
      "Keep membrane rolls covered and off ground on pallets",
      "Protect metal panels from moisture and scratching",
      "Rotate stock using FIFO method",
      "Inspect materials daily for cold damage or moisture infiltration"
    ],
    crewSafety: [
      "Mandatory cold weather PPE when temperature below 40°F",
      "Frequent warming breaks - minimum 10 minutes every hour when below 35°F",
      "Slip-resistant footwear required on all roof surfaces",
      "Ice/frost check of all walking surfaces before work begins",
      "Buddy system required - no solo work on roof",
      "Emergency warming shelter on site when working in cold conditions"
    ],
    emergencyProcedures: [
      "Immediate work stoppage if weather conditions deteriorate rapidly",
      "Emergency tarps staged at each work area for rapid deployment",
      "Hot beverage station maintained in staging area",
      "First aid kit with cold weather supplies (hand warmers, thermal blankets)",
      "Emergency contact list posted at job site trailer",
      "Vehicle with heating available for emergency warming"
    ],
    communicationPlan: [
      "Daily weather briefing at 6:00 AM via Weather Guardian dashboard",
      "GC notified immediately of any weather-related work stoppage",
      "Owner representative informed of significant schedule impacts within 24 hours",
      "Weather hold documentation submitted same day via collaboration system",
      "Weekly weather impact summary provided to all stakeholders",
      "Real-time alerts via Weather Guardian AI system to all team leads"
    ],
    equipmentRequirements: [
      "Propane heaters for material conditioning area",
      "Digital thermometer with data logging capability",
      "Anemometer for wind speed monitoring",
      "Moisture meter for surface testing",
      "Industrial tarps (minimum 4) with weighted ballast",
      "Battery-powered radio for weather alerts"
    ]
  },
  temperatureThresholds: {
    adhesiveMin: 40,
    coatingMin: 50,
    metalPanelMin: 50,
    workSuspension: 25
  },
  windThresholds: {
    cautionSpeed: 15,
    suspensionSpeed: 25,
    gustLimit: 30
  }
};

// Create the store with persistence
export const useGuardianStore = create<GuardianState>()(
  persist(
    (set, get) => ({
      items: [],
      activity: [],
      workEntries: {},
      dailyLogs: [],
      winterPlan: null,

      addItem: (item) => {
        const newItem: ProjectItem = {
          ...item,
          id: generateId(item.type.toUpperCase().substring(0, 3)),
          createdAt: new Date(),
          updatedAt: new Date(),
          comments: []
        };
        set((state) => ({
          items: [newItem, ...state.items],
          activity: [{
            id: generateId("act"),
            type: "item_created",
            title: `New ${item.type} Created`,
            description: item.title,
            actor: item.createdBy === "wci" ? "WCI Team" : item.createdBy,
            actorRole: item.createdBy,
            timestamp: new Date(),
            relatedItemId: newItem.id
          }, ...state.activity]
        }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
          ),
          activity: updates.status ? [{
            id: generateId("act"),
            type: "status_change",
            title: `${id} Status Updated`,
            description: `Status changed to ${updates.status}`,
            actor: "System",
            actorRole: "wci",
            timestamp: new Date(),
            relatedItemId: id
          }, ...state.activity] : state.activity
        }));
      },

      addComment: (itemId, author, authorRole, content) => {
        const newComment = {
          id: generateId("cmt"),
          author,
          authorRole,
          content,
          createdAt: new Date()
        };
        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId
              ? { ...item, comments: [...item.comments, newComment], updatedAt: new Date() }
              : item
          ),
          activity: [{
            id: generateId("act"),
            type: "comment",
            title: `Comment on ${itemId}`,
            description: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
            actor: author,
            actorRole: authorRole,
            timestamp: new Date(),
            relatedItemId: itemId
          }, ...state.activity]
        }));
      },

      addActivity: (entry) => {
        set((state) => ({
          activity: [{
            ...entry,
            id: generateId("act"),
            timestamp: new Date()
          }, ...state.activity]
        }));
      },

      setWorkEntry: (date, entry) => {
        set((state) => ({
          workEntries: {
            ...state.workEntries,
            [date]: {
              ...entry,
              date,
              createdAt: state.workEntries[date]?.createdAt || new Date(),
              updatedAt: new Date()
            }
          }
        }));
      },

      removeWorkEntry: (date) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [date]: _, ...rest } = state.workEntries;
          return { workEntries: rest };
        });
      },

      addDailyLog: (log) => {
        const newLog: DailyLogEntry = {
          ...log,
          id: generateId("log"),
          submittedAt: new Date()
        };
        set((state) => ({
          dailyLogs: [newLog, ...state.dailyLogs],
          activity: [{
            id: generateId("act"),
            type: "document_uploaded",
            title: "Daily Log Submitted",
            description: `${log.date} - ${log.sqftCompleted} SF completed, ${log.crewCount} crew`,
            actor: log.submittedBy,
            actorRole: "wci",
            timestamp: new Date()
          }, ...state.activity]
        }));

        // Also update work entry for that date
        get().setWorkEntry(log.date, {
          type: "worked",
          notes: log.workPerformed.join("; "),
          sqft: log.sqftCompleted
        });
      },

      updateDailyLog: (id, updates) => {
        set((state) => ({
          dailyLogs: state.dailyLogs.map(log =>
            log.id === id ? { ...log, ...updates } : log
          )
        }));
      },

      setWinterPlan: (plan) => {
        const newPlan: WinterWorkPlan = {
          ...plan,
          id: generateId("wwp"),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        set({ winterPlan: newPlan });
      },

      updateWinterPlan: (updates) => {
        set((state) => ({
          winterPlan: state.winterPlan
            ? { ...state.winterPlan, ...updates, updatedAt: new Date() }
            : null
        }));
      },

      initializeWithDemoData: () => {
        if (!GUARDIAN_DEMO_MODE) {
          return;
        }
        const state = get();

        // Only initialize if empty
        if (state.items.length === 0) {
          // Import demo data
          import("./collaboration").then(({ DEMO_ITEMS, DEMO_ACTIVITY }) => {
            set({
              items: DEMO_ITEMS,
              activity: DEMO_ACTIVITY
            });
          });
        }

        // Initialize winter plan if not set
        if (!state.winterPlan) {
          get().setWinterPlan(DEFAULT_WINTER_PLAN);
        }

        // Initialize some work history for current month
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        // Generate realistic work history for the past 2 weeks
        for (let i = 14; i >= 0; i--) {
          const date = new Date(year, month, today.getDate() - i);
          const dateKey = date.toISOString().split('T')[0];
          const dayOfWeek = date.getDay();

          // Skip if entry already exists
          if (state.workEntries[dateKey]) continue;

          // Weekends
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            get().setWorkEntry(dateKey, { type: "weekend" });
          }
          // Random weather holds (about 20% chance on weekdays)
          else if (Math.random() < 0.2) {
            get().setWorkEntry(dateKey, {
              type: "weather_hold",
              notes: Math.random() > 0.5 ? "Temperature below 40°F" : "Precipitation event",
              weatherReason: Math.random() > 0.5 ? "cold" : "rain"
            });
          }
          // Worked days
          else {
            get().setWorkEntry(dateKey, {
              type: "worked",
              notes: `Production day - Area ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
              sqft: 800 + Math.floor(Math.random() * 600)
            });
          }
        }
      }
    }),
    {
      name: "weathercraft-guardian-storage",
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          if (value && typeof value === "object" && (value as { __type?: string }).__type === "Date") {
            return new Date((value as { value: string }).value);
          }
          return value;
        },
        replacer: (key, value) => {
          if (value instanceof Date) {
            return { __type: "Date", value: value.toISOString() };
          }
          return value;
        }
      })
    }
  )
);
