import React, { memo, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions, FlatList } from 'react-native';
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { getDateRange, isToday, isFuture, getTodayString } from '../../utils/dates';
import { COLORS, DOT, SPACING } from '../../constants/theme';
import { Dot } from './Dot';

interface DotGridProps {
  goal: Goal;
  onDotPress: (date: string) => void;
  onDotLongPress: (date: string) => void;
}

interface DotData {
  date: string;
  isCompleted: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export const DotGrid = memo(function DotGrid({
  goal,
  onDotPress,
  onDotLongPress,
}: DotGridProps) {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const days = useDayStore((state) => state.days);

  // Calculate number of columns based on screen width
  const dotTotalSize = DOT.size + DOT.spacing;
  const availableWidth = width - SPACING.md * 2;
  const numColumns = Math.floor(availableWidth / dotTotalSize);

  // Generate dot data
  const dots: DotData[] = useMemo(() => {
    const dateRange = getDateRange(goal.startDate, goal.endDate);

    return dateRange.map((date) => {
      const key = `${goal.id}_${date}`;
      const entry = days[key];

      return {
        date,
        isCompleted: entry?.isCompleted ?? false,
        isToday: isToday(date),
        isFuture: isFuture(date),
      };
    });
  }, [goal.id, goal.startDate, goal.endDate, days]);

  // Find today's index for auto-scroll
  const todayIndex = useMemo(() => {
    const today = getTodayString();
    return dots.findIndex((dot) => dot.date === today);
  }, [dots]);

  // Auto-scroll to today on mount
  useEffect(() => {
    if (todayIndex >= 0 && flatListRef.current) {
      const rowIndex = Math.floor(todayIndex / numColumns);
      const scrollOffset = rowIndex * dotTotalSize - 100; // 100px above

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: Math.max(0, scrollOffset),
          animated: false,
        });
      }, 100);
    }
  }, [todayIndex, numColumns, dotTotalSize]);

  const renderDot = useCallback(
    ({ item }: { item: DotData }) => (
      <Dot
        date={item.date}
        isCompleted={item.isCompleted}
        isToday={item.isToday}
        isFuture={item.isFuture}
        goalColor={goal.color}
        onPress={() => onDotPress(item.date)}
        onLongPress={() => onDotLongPress(item.date)}
      />
    ),
    [goal.color, onDotPress, onDotLongPress]
  );

  const keyExtractor = useCallback((item: DotData) => item.date, []);

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
      data={dots}
      renderItem={renderDot}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={numColumns} // Force re-render when columns change
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
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
