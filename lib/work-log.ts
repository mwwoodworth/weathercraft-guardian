export type WorkLogEntry = {
  date: string; // YYYY-MM-DD
  laborHours: number;
  categories: Record<string, number>;
};

export type WorkLogStats = {
  totalDays: number;
  totalLaborHours: number;
  averageHoursPerDay: number;
  firstWorkedDate?: string;
  lastWorkedDate?: string;
  workStreak: number;
  daysSinceLastWork: number | null;
};

// Sanitized work log derived from B140ACCT.csv
// Financials, names, and other sensitive fields removed.
export const B140_WORK_LOG: WorkLogEntry[] = [
  {
    date: "2025-04-04",
    laborHours: 33.84,
    categories: {
      "LAB IN": 16.91,
      "ROOF IN": 13.6,
      "ROOF OT": 3.33
    }
  },
  {
    date: "2025-08-29",
    laborHours: 25.36,
    categories: {
      "ROOF IN": 12.86,
      "ROOF OT": 12.5
    }
  },
  {
    date: "2025-09-12",
    laborHours: 16.13,
    categories: {
      "LAB IN": 4.04,
      "ROOF IN": 12.09
    }
  },
  {
    date: "2025-09-19",
    laborHours: 101.46,
    categories: {
      "LAB IN": 25.31,
      "LAB OT": 1.07,
      "ROOF IN": 62.88,
      "ROOF OT": 12.2
    }
  },
  {
    date: "2025-09-26",
    laborHours: 220.04,
    categories: {
      "LAB IN": 82.49,
      "ROOF IN": 130.4,
      "ROOF REG": 7.15
    }
  },
  {
    date: "2025-10-03",
    laborHours: 238.39,
    categories: {
      "LAB IN": 55.3,
      "ROOF IN": 169.33,
      "ROOF OT": 13.76
    }
  },
  {
    date: "2025-10-10",
    laborHours: 280.69,
    categories: {
      "LAB IN": 7.27,
      "ROOF IN": 248.32,
      "ROOF OT": 9.46,
      "SHTMT IN": 15.64
    }
  },
  {
    date: "2025-10-17",
    laborHours: 261.25,
    categories: {
      "LAB IN": 1.4,
      "ROOF IN": 259.85
    }
  },
  {
    date: "2025-10-24",
    laborHours: 305.56,
    categories: {
      "LAB IN": 127.91,
      "ROOF IN": 177.65
    }
  },
  {
    date: "2025-10-31",
    laborHours: 263.06,
    categories: {
      "LAB IN": 122.9,
      "LAB OT": 0.14,
      "ROOF IN": 105.56,
      "ROOF OT": 0.54,
      "SHTMT IN": 33.92
    }
  },
  {
    date: "2025-11-07",
    laborHours: 196.65,
    categories: {
      "LAB IN": 97.31,
      "ROOF IN": 84.61,
      "ROOF OT": 6.83,
      "SHTMT IN": 7.9
    }
  },
  {
    date: "2025-11-14",
    laborHours: 276.01,
    categories: {
      "LAB IN": 159.72,
      "LAB OT": 2.98,
      "ROOF IN": 107.07,
      "ROOF OT": 6.24
    }
  },
  {
    date: "2025-11-21",
    laborHours: 293.29,
    categories: {
      "LAB IN": 146.47,
      "ROOF IN": 141.54,
      "ROOF OT": 5.28
    }
  },
  {
    date: "2025-11-26",
    laborHours: 153.64,
    categories: {
      "LAB IN": 95.4,
      "ROOF IN": 58.24
    }
  },
  {
    date: "2025-12-05",
    laborHours: 14.4,
    categories: {
      "ROOF IN": 14.4
    }
  },
  {
    date: "2025-12-12",
    laborHours: 1.22,
    categories: {
      "SHTMT IN": 1.22
    }
  }
];

function parseISODate(date: string): Date | null {
  const parts = date.split("-").map(v => Number(v));
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  const dt = new Date(year, month - 1, day);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function toISODateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getWorkLogStats(log: WorkLogEntry[], today = new Date()): WorkLogStats {
  if (!log.length) {
    return {
      totalDays: 0,
      totalLaborHours: 0,
      averageHoursPerDay: 0,
      workStreak: 0,
      daysSinceLastWork: null
    };
  }

  const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));
  const totalLaborHours = sorted.reduce((sum, entry) => sum + entry.laborHours, 0);
  const totalDays = sorted.length;

  const firstWorkedDate = sorted[0].date;
  const lastWorkedDate = sorted[sorted.length - 1].date;

  const lastWorked = parseISODate(lastWorkedDate);
  const daysSinceLastWork = lastWorked
    ? Math.max(0, Math.floor((toStartOfDay(today).getTime() - toStartOfDay(lastWorked).getTime()) / 86400000))
    : null;

  const logMap = new Set(sorted.map(entry => entry.date));
  const workStreak = lastWorked ? calculateWorkStreak(lastWorked, logMap) : 0;

  return {
    totalDays,
    totalLaborHours: Math.round(totalLaborHours * 100) / 100,
    averageHoursPerDay: totalDays ? Math.round((totalLaborHours / totalDays) * 100) / 100 : 0,
    firstWorkedDate,
    lastWorkedDate,
    workStreak,
    daysSinceLastWork
  };
}

function toStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function calculateWorkStreak(lastWorked: Date, logDates: Set<string>): number {
  let streak = 0;
  const cursor = new Date(lastWorked.getFullYear(), lastWorked.getMonth(), lastWorked.getDate());

  while (true) {
    const dayOfWeek = cursor.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const key = toISODateLocal(cursor);
      if (logDates.has(key)) {
        streak += 1;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function buildWorkLogMap(log: WorkLogEntry[]) {
  const map = new Map<string, WorkLogEntry>();
  for (const entry of log) {
    map.set(entry.date, entry);
  }
  return map;
}

export function getWorkLogMonths(log: WorkLogEntry[]) {
  const months = new Set<string>();
  for (const entry of log) {
    months.add(entry.date.slice(0, 7));
  }
  return [...months].sort();
}
