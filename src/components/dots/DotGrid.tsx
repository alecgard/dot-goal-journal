import React, { memo, useMemo, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, useWindowDimensions, FlatList } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { getDateRange, isToday, isFuture, getTodayString } from '../../utils/dates';
import { COLORS, DOT, SPACING } from '../../constants/theme';
import { Dot } from './Dot';

interface DotGridProps {
  goal: Goal;
  /** Called on long press - opens the modal */
  onDotLongPress: (date: string) => void;
  /** Called on single tap to complete (only if not already complete) */
  onDotComplete: (date: string) => void;
  /** Called when hold begins (for modal slide-in animation) */
  onDotHoldStart?: (date: string) => void;
  /** Called when hold is cancelled before threshold */
  onDotHoldCancel?: () => void;
}

interface DotData {
  date: string;
  isCompleted: boolean;
  isToday: boolean;
  isFuture: boolean;
  isLastDay: boolean;
  index: number;
}

export const DotGrid = memo(function DotGrid({
  goal,
  onDotLongPress,
  onDotComplete,
  onDotHoldStart,
  onDotHoldCancel,
}: DotGridProps) {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const days = useDayStore((state) => state.days);

  // Shared values for coordinating ripple animations across dots
  const rippleTriggerIndex = useSharedValue(-1);
  const rippleTriggerTime = useSharedValue(0);

  // Calculate number of columns based on screen width
  const dotTotalSize = DOT.size + DOT.spacing;
  const availableWidth = width - SPACING.md * 2;
  const numColumns = Math.floor(availableWidth / dotTotalSize);

  // Generate dot data
  const dots: DotData[] = useMemo(() => {
    const dateRange = getDateRange(goal.startDate, goal.endDate);
    const lastIndex = dateRange.length - 1;

    return dateRange.map((date, index) => {
      const key = `${goal.id}_${date}`;
      const entry = days[key];

      return {
        date,
        isCompleted: entry?.isCompleted ?? false,
        isToday: isToday(date),
        isFuture: isFuture(date),
        isLastDay: index === lastIndex,
        index,
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

  // Create a callback to trigger ripple effect from a specific dot index
  const createRippleTrigger = useCallback(
    (dotIndex: number) => () => {
      rippleTriggerIndex.value = dotIndex;
      rippleTriggerTime.value = Date.now();
    },
    [rippleTriggerIndex, rippleTriggerTime]
  );

  const renderDot = useCallback(
    ({ item }: { item: DotData }) => (
      <Dot
        date={item.date}
        isCompleted={item.isCompleted}
        isToday={item.isToday}
        isFuture={item.isFuture}
        isLastDay={item.isLastDay}
        goalColor={COLORS.dotCompleted}
        onLongPress={() => onDotLongPress(item.date)}
        onComplete={() => onDotComplete(item.date)}
        onHoldStart={onDotHoldStart ? () => onDotHoldStart(item.date) : undefined}
        onHoldCancel={onDotHoldCancel}
        index={item.index}
        numColumns={numColumns}
        rippleTriggerIndex={rippleTriggerIndex}
        rippleTriggerTime={rippleTriggerTime}
        onTriggerRipple={createRippleTrigger(item.index)}
      />
    ),
    [onDotLongPress, onDotComplete, onDotHoldStart, onDotHoldCancel, numColumns, rippleTriggerIndex, rippleTriggerTime, createRippleTrigger]
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
      // Render all dots at once - no batching/virtualization
      initialNumToRender={dots.length}
      maxToRenderPerBatch={dots.length}
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
