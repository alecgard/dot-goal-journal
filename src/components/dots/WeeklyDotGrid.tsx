import React, { memo, useMemo, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, useWindowDimensions, FlatList } from 'react-native';
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { getDateRange, isToday, isFuture, getTodayString } from '../../utils/dates';
import { COLORS, DOT, SPACING } from '../../constants/theme';
import { WeekDot, WeekDayData } from './WeekDot';

interface WeeklyDotGridProps {
  goal: Goal;
  /** Called when a week dot is tapped, passing the start date of that week */
  onWeekPress: (weekStartDate: string) => void;
}

interface WeekData {
  id: string;
  weekNumber: number;
  days: WeekDayData[];
  startDate: string;
}

/**
 * Group an array of dates into weeks (7 days each)
 */
function groupIntoWeeks(
  dates: string[],
  days: Record<string, { isCompleted: boolean }>,
  goalId: string
): WeekData[] {
  const weeks: WeekData[] = [];
  let currentWeek: WeekDayData[] = [];
  let weekNumber = 0;
  let weekStartDate = dates[0];
  const lastDateIndex = dates.length - 1;

  dates.forEach((date, index) => {
    const key = `${goalId}_${date}`;
    const entry = days[key];
    const isLastDay = index === lastDateIndex;

    currentWeek.push({
      date,
      isCompleted: entry?.isCompleted ?? false,
      isFuture: isFuture(date),
      isLastDay,
    });

    // When we have 7 days or it's the last date, create a week
    if (currentWeek.length === 7 || index === dates.length - 1) {
      weeks.push({
        id: `week-${weekNumber}`,
        weekNumber,
        days: [...currentWeek],
        startDate: weekStartDate,
      });
      weekNumber++;
      currentWeek = [];
      // Set the start date for the next week
      if (index + 1 < dates.length) {
        weekStartDate = dates[index + 1];
      }
    }
  });

  return weeks;
}

export const WeeklyDotGrid = memo(function WeeklyDotGrid({
  goal,
  onWeekPress,
}: WeeklyDotGridProps) {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const days = useDayStore((state) => state.days);

  // Calculate number of columns based on screen width
  const dotTotalSize = DOT.size + DOT.spacing;
  const availableWidth = width - SPACING.md * 2;
  const numColumns = Math.floor(availableWidth / dotTotalSize);

  // Generate week data
  const weeks: WeekData[] = useMemo(() => {
    const dateRange = getDateRange(goal.startDate, goal.endDate);
    return groupIntoWeeks(dateRange, days, goal.id);
  }, [goal.id, goal.startDate, goal.endDate, days]);

  // Find the week containing today for auto-scroll
  const todayWeekIndex = useMemo(() => {
    const today = getTodayString();
    return weeks.findIndex((week) =>
      week.days.some((day) => day.date === today)
    );
  }, [weeks]);

  // Auto-scroll to the week containing today on mount
  useEffect(() => {
    if (todayWeekIndex >= 0 && flatListRef.current) {
      const rowIndex = Math.floor(todayWeekIndex / numColumns);
      const scrollOffset = rowIndex * dotTotalSize - 100; // 100px above

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: Math.max(0, scrollOffset),
          animated: false,
        });
      }, 100);
    }
  }, [todayWeekIndex, numColumns, dotTotalSize]);

  const renderWeek = useCallback(
    ({ item }: { item: WeekData }) => (
      <WeekDot
        days={item.days}
        onPress={() => onWeekPress(item.startDate)}
        goalColor={COLORS.dotCompleted}
        weekNumber={item.weekNumber}
      />
    ),
    [onWeekPress]
  );

  const keyExtractor = useCallback((item: WeekData) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: dotTotalSize,
      offset: Math.floor(index / numColumns) * dotTotalSize,
      index,
    }),
    [numColumns, dotTotalSize]
  );

  return (
    <FlatList
      ref={flatListRef}
      data={weeks}
      renderItem={renderWeek}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={`weekly-${numColumns}`} // Force re-render when columns change
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      // Render all weeks at once - no batching/virtualization
      initialNumToRender={weeks.length}
      maxToRenderPerBatch={weeks.length}
      windowSize={21}
      removeClippedSubviews={false}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  row: {
    justifyContent: 'flex-start',
  },
});
