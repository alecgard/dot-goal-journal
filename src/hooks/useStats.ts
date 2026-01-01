import { useMemo } from 'react';
import { useDayStore } from '../stores';
import { Goal, DayEntry } from '../types';
import { calculateCurrentStreak, calculateCompletionPercentage } from '../utils/streak';
import { getTodayString, getDayCount, fromDateString, getDateRange, isPast, isToday } from '../utils/dates';
import { differenceInDays, startOfDay, getISOWeek, getISOWeekYear } from 'date-fns';

interface Stats {
  percentage: number;
  timeElapsedPercentage: number;
  daysRemaining: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompleted: number;
  totalMissed: number;
  totalDays: number;
  daysElapsed: number;
  averageCompletionsPerWeek: number;
  bestWeekCompletions: number;
  bestWeekLabel: string;
}

/**
 * Calculate time elapsed percentage for a goal
 * This shows how far through the time period we are (days elapsed from start / total days)
 */
function calculateTimeElapsedPercentage(startDate: string, endDate: string): number {
  const today = startOfDay(new Date());
  const start = startOfDay(fromDateString(startDate));
  const totalDays = getDayCount(startDate, endDate);

  // Days elapsed from start (including today if we're in the period)
  const daysElapsed = differenceInDays(today, start) + 1;

  // Clamp to 0-100%
  if (daysElapsed <= 0) return 0;
  if (daysElapsed >= totalDays) return 100;

  return Math.round((daysElapsed / totalDays) * 100);
}

/**
 * Calculate days remaining for a goal
 * Returns the number of days left (including today if within range)
 */
function calculateDaysRemaining(startDate: string, endDate: string): number {
  const today = startOfDay(new Date());
  const end = startOfDay(fromDateString(endDate));

  // Days remaining is difference from today to end date (inclusive of end date)
  const remaining = differenceInDays(end, today) + 1;

  // Clamp to 0 minimum (goal has ended)
  return Math.max(0, remaining);
}

/**
 * Calculate the longest streak for a goal
 */
function calculateLongestStreak(
  days: Record<string, DayEntry>,
  goalId: string,
  startDate: string,
  endDate: string
): number {
  const today = getTodayString();
  const allDates = getDateRange(startDate, endDate);

  // Only consider dates up to and including today
  const relevantDates = allDates.filter(date => date <= today);

  let longestStreak = 0;
  let currentStreak = 0;

  for (const date of relevantDates) {
    const key = `${goalId}_${date}`;
    const entry = days[key];

    if (entry?.isCompleted) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return longestStreak;
}

/**
 * Calculate completion stats (completed, missed, rate)
 */
function calculateCompletionStats(
  days: Record<string, DayEntry>,
  goalId: string,
  startDate: string,
  endDate: string
): { totalCompleted: number; totalMissed: number; completionRate: number; pastDays: number } {
  const today = getTodayString();
  const allDates = getDateRange(startDate, endDate);

  // Only count past days (not today, not future)
  const pastDates = allDates.filter(date => isPast(date));

  let totalCompleted = 0;
  let totalMissed = 0;

  for (const date of pastDates) {
    const key = `${goalId}_${date}`;
    const entry = days[key];

    if (entry?.isCompleted) {
      totalCompleted++;
    } else {
      totalMissed++;
    }
  }

  // Also count today if completed
  const todayKey = `${goalId}_${today}`;
  if (allDates.includes(today) && days[todayKey]?.isCompleted) {
    totalCompleted++;
  }

  // Completion rate is based on past days only (days that could have been completed)
  const pastDays = pastDates.length;
  const completionRate = pastDays > 0 ? Math.round((totalCompleted / (pastDays + (allDates.includes(today) ? 1 : 0))) * 100) : 0;

  return { totalCompleted, totalMissed, completionRate, pastDays };
}

/**
 * Calculate weekly stats (average per week, best week)
 */
function calculateWeeklyStats(
  days: Record<string, DayEntry>,
  goalId: string,
  startDate: string,
  endDate: string
): { averageCompletionsPerWeek: number; bestWeekCompletions: number; bestWeekLabel: string } {
  const today = getTodayString();
  const allDates = getDateRange(startDate, endDate);

  // Only consider dates up to and including today
  const relevantDates = allDates.filter(date => date <= today);

  if (relevantDates.length === 0) {
    return { averageCompletionsPerWeek: 0, bestWeekCompletions: 0, bestWeekLabel: '' };
  }

  // Group by week (ISO week number + year)
  const weekMap: Record<string, { count: number; label: string }> = {};

  for (const date of relevantDates) {
    const key = `${goalId}_${date}`;
    const entry = days[key];
    const d = fromDateString(date);
    const weekKey = `${getISOWeekYear(d)}-W${getISOWeek(d)}`;

    if (!weekMap[weekKey]) {
      weekMap[weekKey] = { count: 0, label: `Week ${getISOWeek(d)}` };
    }

    if (entry?.isCompleted) {
      weekMap[weekKey].count++;
    }
  }

  const weeks = Object.values(weekMap);
  if (weeks.length === 0) {
    return { averageCompletionsPerWeek: 0, bestWeekCompletions: 0, bestWeekLabel: '' };
  }

  const totalCompletions = weeks.reduce((sum, w) => sum + w.count, 0);
  const averageCompletionsPerWeek = Math.round((totalCompletions / weeks.length) * 10) / 10;

  const bestWeek = weeks.reduce((best, current) =>
    current.count > best.count ? current : best
  , weeks[0]);

  return {
    averageCompletionsPerWeek,
    bestWeekCompletions: bestWeek.count,
    bestWeekLabel: bestWeek.label,
  };
}

/**
 * Calculate days elapsed from start
 */
function calculateDaysElapsed(startDate: string, endDate: string): number {
  const today = startOfDay(new Date());
  const start = startOfDay(fromDateString(startDate));
  const totalDays = getDayCount(startDate, endDate);

  const daysElapsed = differenceInDays(today, start) + 1;

  // Clamp between 0 and totalDays
  if (daysElapsed <= 0) return 0;
  if (daysElapsed >= totalDays) return totalDays;

  return daysElapsed;
}

export function useStats(goal: Goal | undefined): Stats {
  const days = useDayStore((state) => state.days);

  return useMemo(() => {
    if (!goal) {
      return {
        percentage: 0,
        timeElapsedPercentage: 0,
        daysRemaining: 0,
        currentStreak: 0,
        longestStreak: 0,
        completionRate: 0,
        totalCompleted: 0,
        totalMissed: 0,
        totalDays: 0,
        daysElapsed: 0,
        averageCompletionsPerWeek: 0,
        bestWeekCompletions: 0,
        bestWeekLabel: '',
      };
    }

    const percentage = calculateCompletionPercentage(
      days,
      goal.id,
      goal.startDate,
      goal.endDate
    );

    const timeElapsedPercentage = calculateTimeElapsedPercentage(
      goal.startDate,
      goal.endDate
    );

    const daysRemaining = calculateDaysRemaining(
      goal.startDate,
      goal.endDate
    );

    const currentStreak = calculateCurrentStreak(
      days,
      goal.id,
      goal.startDate,
      goal.endDate
    );

    const longestStreak = calculateLongestStreak(
      days,
      goal.id,
      goal.startDate,
      goal.endDate
    );

    const completionStats = calculateCompletionStats(
      days,
      goal.id,
      goal.startDate,
      goal.endDate
    );

    const weeklyStats = calculateWeeklyStats(
      days,
      goal.id,
      goal.startDate,
      goal.endDate
    );

    const totalDays = getDayCount(goal.startDate, goal.endDate);
    const daysElapsed = calculateDaysElapsed(goal.startDate, goal.endDate);

    return {
      percentage,
      timeElapsedPercentage,
      daysRemaining,
      currentStreak,
      longestStreak,
      completionRate: completionStats.completionRate,
      totalCompleted: completionStats.totalCompleted,
      totalMissed: completionStats.totalMissed,
      totalDays,
      daysElapsed,
      averageCompletionsPerWeek: weeklyStats.averageCompletionsPerWeek,
      bestWeekCompletions: weeklyStats.bestWeekCompletions,
      bestWeekLabel: weeklyStats.bestWeekLabel,
    };
  }, [days, goal]);
}
