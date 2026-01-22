// Collaboration & Project Management Types
// Designed for multi-stakeholder coordination: WCI Team, GC, Owner

export type Priority = "critical" | "high" | "medium" | "low";
export type Status = "open" | "in_progress" | "pending_review" | "resolved" | "closed";
export type ItemType = "issue" | "rfi" | "submittal" | "change_order" | "delay" | "safety" | "quality";
export type Stakeholder = "wci" | "gc" | "owner" | "architect" | "inspector";

export type ProjectItem = {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  assignedTo: Stakeholder[];
  createdBy: Stakeholder;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  linkedWeatherDate?: Date; // If related to weather delay
  comments: Comment[];
  attachments: string[];
  tags: string[];
};

export type Comment = {
  id: string;
  author: string;
  authorRole: Stakeholder;
  content: string;
  createdAt: Date;
};

export type ActivityEntry = {
  id: string;
  type: "status_change" | "comment" | "item_created" | "weather_alert" | "document_uploaded" | "milestone";
  title: string;
  description: string;
  actor: string;
  actorRole: Stakeholder;
  timestamp: Date;
  relatedItemId?: string;
};

export type DailyLog = {
  date: Date;
  weatherConditions: string;
  crewCount: number;
  workPerformed: string[];
  materialsUsed: string[];
  issues: string[];
  safetyNotes: string[];
  photos: string[];
  submittedBy: string;
};

// Demo data for Building 140 project
export const DEMO_ITEMS: ProjectItem[] = [
  {
    id: "ISS-001",
    type: "delay",
    title: "Weather Delay - Mod Bit Installation",
    description: "Temperature dropped below 40°F threshold, requiring hold on Green-Lock Plus adhesive application. AI system flagged NO-GO conditions at 0630.",
    priority: "high",
    status: "open",
    assignedTo: ["wci", "gc"],
    createdBy: "wci",
    createdAt: new Date(Date.now() - 86400000), // Yesterday
    updatedAt: new Date(),
    linkedWeatherDate: new Date(),
    comments: [
      {
        id: "c1",
        author: "Mike Thompson",
        authorRole: "wci",
        content: "Weather Guardian system automatically logged this delay. Documentation attached for warranty compliance.",
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: "c2",
        author: "Sarah Chen",
        authorRole: "gc",
        content: "Acknowledged. Please provide updated schedule impact analysis.",
        createdAt: new Date(Date.now() - 1800000)
      }
    ],
    attachments: ["weather_log_01222024.pdf"],
    tags: ["weather", "warranty", "schedule-impact"]
  },
  {
    id: "RFI-012",
    type: "rfi",
    title: "Flashing Detail at RTU-3 Penetration",
    description: "Request clarification on flashing tie-in detail where new RTU curb meets existing built-up roof edge. Drawing detail 4/A-301 conflicts with spec section 07 52 00.",
    priority: "high",
    status: "pending_review",
    assignedTo: ["architect"],
    createdBy: "wci",
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000),
    dueDate: new Date(Date.now() + 172800000), // 2 days from now
    comments: [
      {
        id: "c3",
        author: "David Park",
        authorRole: "architect",
        content: "Reviewing with structural. Will have response by EOD tomorrow.",
        createdAt: new Date(Date.now() - 43200000)
      }
    ],
    attachments: ["rfi_012_sketch.pdf", "photo_rtu3_condition.jpg"],
    tags: ["design", "penetration", "urgent"]
  },
  {
    id: "QC-003",
    type: "quality",
    title: "Adhesive Coverage Verification - Area B",
    description: "QC inspection required for Green-Lock Plus adhesive coverage in Area B before cap sheet installation. Per Garland warranty requirements.",
    priority: "medium",
    status: "in_progress",
    assignedTo: ["wci", "inspector"],
    createdBy: "wci",
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedAt: new Date(),
    comments: [],
    attachments: [],
    tags: ["inspection", "warranty", "quality"]
  },
  {
    id: "SUB-008",
    type: "submittal",
    title: "Metal Panel Color Samples - Resubmittal",
    description: "Revised color samples for R-Mer Span panels per architect comment. Now includes Slate Gray and Charcoal options.",
    priority: "medium",
    status: "pending_review",
    assignedTo: ["architect", "owner"],
    createdBy: "wci",
    createdAt: new Date(Date.now() - 432000000), // 5 days ago
    updatedAt: new Date(Date.now() - 86400000),
    dueDate: new Date(Date.now() + 259200000), // 3 days from now
    comments: [
      {
        id: "c4",
        author: "Col. Martinez",
        authorRole: "owner",
        content: "Slate Gray matches existing hangar doors. Recommend approval.",
        createdAt: new Date(Date.now() - 172800000)
      }
    ],
    attachments: ["color_samples_rev2.pdf"],
    tags: ["submittal", "metal-panels", "color"]
  },
  {
    id: "SAF-002",
    type: "safety",
    title: "High Wind Protocol Reminder",
    description: "Weather forecast shows 25+ mph winds Thursday. Reminder to all crews: No membrane sheet handling when sustained winds exceed 20 mph. Secure all loose materials EOD Wednesday.",
    priority: "high",
    status: "open",
    assignedTo: ["wci", "gc"],
    createdBy: "wci",
    createdAt: new Date(),
    updatedAt: new Date(),
    linkedWeatherDate: new Date(Date.now() + 172800000), // Thursday
    comments: [],
    attachments: [],
    tags: ["safety", "weather", "wind"]
  }
];

export const DEMO_ACTIVITY: ActivityEntry[] = [
  {
    id: "act-1",
    type: "weather_alert",
    title: "AI Weather Alert",
    description: "Temperature falling - closing installation window for adhesive work",
    actor: "Weather Guardian AI",
    actorRole: "wci",
    timestamp: new Date(Date.now() - 1800000) // 30 min ago
  },
  {
    id: "act-2",
    type: "comment",
    title: "RFI-012 Comment Added",
    description: "Architect reviewing flashing detail with structural team",
    actor: "David Park",
    actorRole: "architect",
    timestamp: new Date(Date.now() - 43200000), // 12 hours ago
    relatedItemId: "RFI-012"
  },
  {
    id: "act-3",
    type: "status_change",
    title: "QC-003 Status Updated",
    description: "Quality inspection moved to In Progress",
    actor: "Mike Thompson",
    actorRole: "wci",
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    relatedItemId: "QC-003"
  },
  {
    id: "act-4",
    type: "document_uploaded",
    title: "Daily Log Submitted",
    description: "January 21, 2024 daily report uploaded with 12 photos",
    actor: "Field Crew",
    actorRole: "wci",
    timestamp: new Date(Date.now() - 100800000) // 28 hours ago
  },
  {
    id: "act-5",
    type: "milestone",
    title: "Area A Base Sheet Complete",
    description: "2,400 SF of base sheet installation completed and inspected",
    actor: "Mike Thompson",
    actorRole: "wci",
    timestamp: new Date(Date.now() - 172800000) // 2 days ago
  },
  {
    id: "act-6",
    type: "item_created",
    title: "New Safety Alert Created",
    description: "High wind protocol reminder for Thursday",
    actor: "Weather Guardian AI",
    actorRole: "wci",
    timestamp: new Date(),
    relatedItemId: "SAF-002"
  }
];

// Helper functions
export function getItemsByStatus(items: ProjectItem[], status: Status): ProjectItem[] {
  return items.filter(item => item.status === status);
}

export function getItemsByType(items: ProjectItem[], type: ItemType): ProjectItem[] {
  return items.filter(item => item.type === type);
}

export function getItemsByPriority(items: ProjectItem[], priority: Priority): ProjectItem[] {
  return items.filter(item => item.priority === priority);
}

export function getItemsForStakeholder(items: ProjectItem[], stakeholder: Stakeholder): ProjectItem[] {
  return items.filter(item =>
    item.assignedTo.includes(stakeholder) || item.createdBy === stakeholder
  );
}

export function getOverdueItems(items: ProjectItem[]): ProjectItem[] {
  const now = new Date();
  return items.filter(item =>
    item.dueDate &&
    item.dueDate < now &&
    item.status !== "resolved" &&
    item.status !== "closed"
  );
}

export function getUpcomingItems(items: ProjectItem[], days: number = 7): ProjectItem[] {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return items.filter(item =>
    item.dueDate &&
    item.dueDate >= now &&
    item.dueDate <= future &&
    item.status !== "resolved" &&
    item.status !== "closed"
  );
}

export const ITEM_TYPE_CONFIG: Record<ItemType, { label: string; color: string; icon: string }> = {
  issue: { label: "Issue", color: "bg-rose-500", icon: "AlertCircle" },
  rfi: { label: "RFI", color: "bg-blue-500", icon: "HelpCircle" },
  submittal: { label: "Submittal", color: "bg-purple-500", icon: "FileCheck" },
  change_order: { label: "Change Order", color: "bg-amber-500", icon: "FileEdit" },
  delay: { label: "Delay", color: "bg-orange-500", icon: "Clock" },
  safety: { label: "Safety", color: "bg-red-600", icon: "Shield" },
  quality: { label: "QC", color: "bg-emerald-500", icon: "CheckSquare" }
};

export const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "bg-amber-500" },
  pending_review: { label: "Pending Review", color: "bg-purple-500" },
  resolved: { label: "Resolved", color: "bg-emerald-500" },
  closed: { label: "Closed", color: "bg-slate-500" }
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-rose-600 text-white" },
  high: { label: "High", color: "bg-orange-500 text-white" },
  medium: { label: "Medium", color: "bg-amber-500 text-black" },
  low: { label: "Low", color: "bg-slate-400 text-white" }
};

export const STAKEHOLDER_CONFIG: Record<
  Stakeholder,
  { label: string; color: string; initials: string; fullName: string }
> = {
  wci: { label: "WCI", color: "bg-primary", initials: "MT", fullName: "Mike Thompson" },
  gc: { label: "GC", color: "bg-blue-600", initials: "SC", fullName: "Sarah Chen" },
  owner: { label: "Owner", color: "bg-emerald-600", initials: "CM", fullName: "Col. Martinez" },
  architect: { label: "Architect", color: "bg-purple-600", initials: "DP", fullName: "David Park" },
  inspector: { label: "Inspector", color: "bg-amber-600", initials: "JR", fullName: "James Roberts" }
};

// Helper to group activities by time period
export function groupActivitiesByTime(activities: ActivityEntry[]): {
  today: ActivityEntry[];
  yesterday: ActivityEntry[];
  thisWeek: ActivityEntry[];
  older: ActivityEntry[];
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

  return {
    today: activities.filter((a) => a.timestamp >= todayStart),
    yesterday: activities.filter((a) => a.timestamp >= yesterdayStart && a.timestamp < todayStart),
    thisWeek: activities.filter((a) => a.timestamp >= weekStart && a.timestamp < yesterdayStart),
    older: activities.filter((a) => a.timestamp < weekStart)
  };
}

// Helper to get critical/high priority item count
export function getCriticalItemCount(items: ProjectItem[]): number {
  return items.filter(
    (i) =>
      (i.priority === "critical" || i.priority === "high") &&
      i.status !== "resolved" &&
      i.status !== "closed"
  ).length;
}

// Helper to calculate due date status
export function getDueDateStatus(
  dueDate: Date | undefined
): { label: string; color: string; urgent: boolean } | null {
  if (!dueDate) return null;

  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return { label: `${Math.abs(days)}d overdue`, color: "text-rose-500 bg-rose-500/10", urgent: true };
  } else if (days === 0) {
    return { label: "Due today", color: "text-amber-500 bg-amber-500/10", urgent: true };
  } else if (days === 1) {
    return { label: "Due tomorrow", color: "text-amber-500 bg-amber-500/10", urgent: true };
  } else if (days <= 3) {
    return { label: `${days}d left`, color: "text-amber-400 bg-amber-500/10", urgent: false };
  } else if (days <= 7) {
    return { label: `${days}d left`, color: "text-blue-400 bg-blue-500/10", urgent: false };
  } else {
    return { label: `${days}d left`, color: "text-muted-foreground bg-muted/30", urgent: false };
  }
}
