import { useMemo } from 'react';
import { useDayStore } from '../stores';
import { Goal } from '../types';
import { calculateCurrentStreak, calculateCompletionPercentage } from '../utils/streak';

interface Stats {
  percentage: number;
  currentStreak: number;
}

export function useStats(goal: Goal | undefined): Stats {
  const days = useDayStore((state) => state.days);

  return useMemo(() => {
    if (!goal) {
      return { percentage: 0, currentStreak: 0 };
    }

    const percentage = calculateCompletionPercentage(
      days,
      goal.id,
      goal.startDate,
      goal.endDate
    );

    const currentStreak = calculateCurrentStreak(
      days,
      goal.id,
      goal.startDate,
      goal.endDate
    );

    return { percentage, currentStreak };
  }, [days, goal]);
}
