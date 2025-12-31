import {
  format,
  parseISO,
  isToday as isTodayFns,
  isBefore,
  isAfter,
  startOfDay,
  addDays,
  differenceInDays,
  eachDayOfInterval,
} from 'date-fns';

/**
 * Format a date to YYYY-MM-DD string (for storage)
 */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse a YYYY-MM-DD string to Date
 */
export function fromDateString(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Get today's date as YYYY-MM-DD string (device local timezone)
 */
export function getTodayString(): string {
  return toDateString(new Date());
}

/**
 * Check if a date string is today
 */
export function isToday(dateString: string): boolean {
  return isTodayFns(fromDateString(dateString));
}

/**
 * Check if a date string is in the past (before today)
 */
export function isPast(dateString: string): boolean {
  const date = startOfDay(fromDateString(dateString));
  const today = startOfDay(new Date());
  return isBefore(date, today);
}

/**
 * Check if a date string is in the future (after today)
 */
export function isFuture(dateString: string): boolean {
  const date = startOfDay(fromDateString(dateString));
  const today = startOfDay(new Date());
  return isAfter(date, today);
}

/**
 * Get all dates between start and end (inclusive)
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const start = fromDateString(startDate);
  const end = fromDateString(endDate);

  return eachDayOfInterval({ start, end }).map(toDateString);
}

/**
 * Calculate end date from start date and number of days
 */
export function calculateEndDate(startDate: string, days: number): string {
  const start = fromDateString(startDate);
  return toDateString(addDays(start, days - 1)); // -1 because start day counts
}

/**
 * Get the number of days between two dates (inclusive)
 */
export function getDayCount(startDate: string, endDate: string): number {
  return differenceInDays(fromDateString(endDate), fromDateString(startDate)) + 1;
}

/**
 * Get day number within a goal (1-indexed)
 */
export function getDayNumber(startDate: string, currentDate: string): number {
  return differenceInDays(fromDateString(currentDate), fromDateString(startDate)) + 1;
}

/**
 * Format date for display in modal
 * e.g., "Monday, Jan 15"
 */
export function formatDisplayDate(dateString: string): string {
  return format(fromDateString(dateString), 'EEEE, MMM d');
}

/**
 * Format date with context for modal
 * e.g., "Day 45 of 180"
 */
export function formatDayContext(
  startDate: string,
  endDate: string,
  currentDate: string
): string {
  const dayNum = getDayNumber(startDate, currentDate);
  const totalDays = getDayCount(startDate, endDate);
  return `Day ${dayNum} of ${totalDays}`;
}
