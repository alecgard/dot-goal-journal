import { useMemo } from 'react';
import { useDayStore } from '../stores';
import { Goal } from '../types';
import { calculateCurrentStreak, calculateCompletionPercentage } from '../utils/streak';
import { getTodayString, getDayCount, fromDateString } from '../utils/dates';
import { differenceInDays, startOfDay } from 'date-fns';

interface Stats {
  percentage: number;
  timeElapsedPercentage: number;
  currentStreak: number;
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

export function useStats(goal: Goal | undefined): Stats {
  const days = useDayStore((state) => state.days);

  return useMemo(() => {
    if (!goal) {
      return { percentage: 0, timeElapsedPercentage: 0, currentStreak: 0 };
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

    const currentStreak = calculateCurrentStreak(
      days,
      goal.id,
      goal.startDate,
      goal.endDate
    );

    return { percentage, timeElapsedPercentage, currentStreak };
  }, [days, goal]);
}
