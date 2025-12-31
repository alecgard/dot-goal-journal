import { DayEntry } from '../types';
import { getTodayString, isPast, getDateRange, fromDateString } from './dates';
import { isBefore, startOfDay } from 'date-fns';

/**
 * Calculate current streak for a goal
 * Streak counts consecutive completed days ending at today (or the last completed day if today isn't done)
 */
export function calculateCurrentStreak(
  days: Record<string, DayEntry>,
  goalId: string,
  startDate: string,
  endDate: string
): number {
  const today = getTodayString();
  const allDates = getDateRange(startDate, endDate);

  // Filter to dates up to and including today
  const relevantDates = allDates.filter(date => {
    const d = startOfDay(fromDateString(date));
    const t = startOfDay(fromDateString(today));
    return isBefore(d, t) || date === today;
  });

  // Work backwards from the most recent date
  let streak = 0;
  for (let i = relevantDates.length - 1; i >= 0; i--) {
    const date = relevantDates[i];
    const key = `${goalId}_${date}`;
    const entry = days[key];

    if (entry?.isCompleted) {
      streak++;
    } else {
      // If today isn't completed, we can skip it and continue counting
      if (date === today && i > 0) {
        continue;
      }
      break;
    }
  }

  return streak;
}

/**
 * Calculate completion percentage for a goal
 */
export function calculateCompletionPercentage(
  days: Record<string, DayEntry>,
  goalId: string,
  startDate: string,
  endDate: string
): number {
  const today = getTodayString();
  const allDates = getDateRange(startDate, endDate);

  // Only count days up to today
  const countableDates = allDates.filter(date => !isPast(today) || !isPast(date) ? date <= today : true).filter(date => date <= today);

  if (countableDates.length === 0) return 0;

  const completedCount = countableDates.filter(date => {
    const key = `${goalId}_${date}`;
    return days[key]?.isCompleted;
  }).length;

  return Math.round((completedCount / countableDates.length) * 100);
}

/**
 * Check if a goal is 100% complete
 */
export function isGoalFullyCompleted(
  days: Record<string, DayEntry>,
  goalId: string,
  startDate: string,
  endDate: string
): boolean {
  const allDates = getDateRange(startDate, endDate);

  return allDates.every(date => {
    const key = `${goalId}_${date}`;
    return days[key]?.isCompleted;
  });
}
