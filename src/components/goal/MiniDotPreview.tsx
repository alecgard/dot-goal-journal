import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { getDateRange, isFuture } from '../../utils/dates';
import { COLORS } from '../../constants/theme';

interface MiniDotPreviewProps {
  goal: Goal;
}

const MINI_DOT_SIZE = 10;
const MINI_DOT_SPACING = 4;
const PREVIEW_DAYS = 30;

/**
 * MiniDotPreview - Compact dot visualization for goal cards
 *
 * Shows last 30 days as small dots with:
 * - Completed: Goal color with subtle shadow
 * - Future: Light inset appearance
 * - Missed: Muted grey
 */
export const MiniDotPreview = memo(function MiniDotPreview({
  goal,
}: MiniDotPreviewProps) {
  const days = useDayStore((state) => state.days);

  const dots = useMemo(() => {
    const allDates = getDateRange(goal.startDate, goal.endDate);

    // Get the last PREVIEW_DAYS dates, or all if fewer
    const previewDates = allDates.slice(-PREVIEW_DAYS);

    return previewDates.map((date) => {
      const key = `${goal.id}_${date}`;
      const entry = days[key];
      const isCompleted = entry?.isCompleted ?? false;
      const isFutureDate = isFuture(date);

      return {
        date,
        isCompleted,
        isFuture: isFutureDate,
        color: isCompleted ? goal.color : isFutureDate ? COLORS.dotFuture : COLORS.dotMissed,
      };
    });
  }, [goal, days]);

  return (
    <View style={styles.container}>
      {dots.map((dot) => (
        <View
          key={dot.date}
          style={[
            styles.dot,
            { backgroundColor: dot.color },
            dot.isCompleted && styles.dotCompleted,
            dot.isFuture && styles.dotFuture,
          ]}
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
  dotCompleted: {
    // Subtle shadow for completed dots
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 2,
  },
  dotFuture: {
    // Inset border effect
    borderWidth: 1,
    borderTopColor: 'rgba(163, 177, 198, 0.3)',
    borderLeftColor: 'rgba(163, 177, 198, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    borderRightColor: 'rgba(255, 255, 255, 0.5)',
  },
});
