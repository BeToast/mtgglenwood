import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface Period {
  id: string;
  weekday: number;               // 0-6 (0=Sunday, 2=Tuesday, etc.)
  hour: number;                  // 0-23 (MST)
  minute: number;                // 0-59
  matchesPerPlayer: number;      // Match limit per player
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Converts a Date to MST timezone
 * MST is UTC-7 (no daylight saving time)
 */
export function toMST(date: Date): Date {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const mst = new Date(utc - (7 * 3600000)); // MST = UTC-7
  return mst;
}

/**
 * Gets all periods sorted by time
 */
export async function getAllPeriods(): Promise<Period[]> {
  try {
    const periodsRef = collection(db, 'periods');
    const q = query(periodsRef, orderBy('weekday'), orderBy('hour'), orderBy('minute'));
    const snapshot = await getDocs(q);

    const periods: Period[] = [];
    snapshot.forEach((doc) => {
      periods.push({
        id: doc.id,
        ...doc.data()
      } as Period);
    });

    return periods;
  } catch (error) {
    console.error('Error fetching periods:', error);
    return [];
  }
}

/**
 * Converts a period to a comparable time value
 * Format: weekday*10000 + hour*100 + minute
 * This allows easy comparison of times across the week
 */
function periodToComparableTime(period: { weekday: number; hour: number; minute: number }): number {
  return period.weekday * 10000 + period.hour * 100 + period.minute;
}

/**
 * Calculates which period contains the given timestamp
 *
 * Algorithm:
 * 1. Convert current time to MST
 * 2. Convert to comparable format: weekday*10000 + hour*100 + minute
 * 3. Find most recent period before current time
 * 4. If none found, wrap to last period of previous week
 */
export function getCurrentPeriod(periods: Period[], now: Date = new Date()): Period | null {
  if (periods.length === 0) {
    return null;
  }

  // Convert to MST
  const mstNow = toMST(now);
  const currentWeekday = mstNow.getDay();
  const currentHour = mstNow.getHours();
  const currentMinute = mstNow.getMinutes();

  const currentTime = currentWeekday * 10000 + currentHour * 100 + currentMinute;

  // Find the most recent period that started before or at current time
  let currentPeriod: Period | null = null;

  for (const period of periods) {
    const periodTime = periodToComparableTime(period);

    if (periodTime <= currentTime) {
      currentPeriod = period;
    } else {
      // Since periods are sorted, we can stop once we find a future period
      break;
    }
  }

  // If no period found, we're before the first period of the week
  // So wrap around to the last period of the previous week
  if (!currentPeriod && periods.length > 0) {
    currentPeriod = periods[periods.length - 1];
  }

  return currentPeriod;
}

/**
 * Formats a period for display
 * Example: "Tuesday 5:00 PM MST"
 */
export function formatPeriodTime(period: Period): string {
  const weekdayName = WEEKDAY_NAMES[period.weekday];

  // Convert hour to 12-hour format
  const hour12 = period.hour === 0 ? 12 : period.hour > 12 ? period.hour - 12 : period.hour;
  const ampm = period.hour >= 12 ? 'PM' : 'AM';

  // Format minute with leading zero
  const minuteStr = period.minute.toString().padStart(2, '0');

  return `${weekdayName} ${hour12}:${minuteStr} ${ampm} MST`;
}

/**
 * Formats a short version for display
 * Example: "Tue 5:00 PM"
 */
export function formatPeriodTimeShort(period: Period): string {
  const weekdayShort = WEEKDAY_NAMES[period.weekday].substring(0, 3);

  const hour12 = period.hour === 0 ? 12 : period.hour > 12 ? period.hour - 12 : period.hour;
  const ampm = period.hour >= 12 ? 'PM' : 'AM';
  const minuteStr = period.minute.toString().padStart(2, '0');

  return `${weekdayShort} ${hour12}:${minuteStr} ${ampm}`;
}
