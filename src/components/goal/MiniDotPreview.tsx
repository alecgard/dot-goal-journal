import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { getDateRange, getTodayString, isPast, isFuture } from '../../utils/dates';
import { COLORS } from '../../constants/theme';

interface MiniDotPreviewProps {
  goal: Goal;
}

const MINI_DOT_SIZE = 8;
const MINI_DOT_SPACING = 3;
const PREVIEW_DAYS = 30;

export const MiniDotPreview = memo(function MiniDotPreview({
  goal,
}: MiniDotPreviewProps) {
  const days = useDayStore((state) => state.days);

  const dots = useMemo(() => {
    const allDates = getDateRange(goal.startDate, goal.endDate);
    const today = getTodayString();

    // Get the last PREVIEW_DAYS dates, or all if fewer
    const previewDates = allDates.slice(-PREVIEW_DAYS);

    return previewDates.map((date) => {
      const key = `${goal.id}_${date}`;
      const entry = days[key];
      const isCompleted = entry?.isCompleted ?? false;

      let color: string;
      if (isCompleted) {
        color = goal.color;
      } else if (isFuture(date)) {
        color = COLORS.dotFuture;
      } else {
        color = COLORS.dotMissed;
      }

      return { date, color };
    });
  }, [goal, days]);

  return (
    <View style={styles.container}>
      {dots.map((dot) => (
        <View
          key={dot.date}
          style={[styles.dot, { backgroundColor: dot.color }]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MINI_DOT_SPACING,
  },
  dot: {
    width: MINI_DOT_SIZE,
    height: MINI_DOT_SIZE,
    borderRadius: MINI_DOT_SIZE / 2,
  },
});
