import React, { memo, useMemo, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, useWindowDimensions, View, Text } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { getDateRange, isToday, isFuture, getTodayString, fromDateString } from '../../utils/dates';
import { COLORS, DOT, SPACING, FONT_SIZE, FONTS } from '../../constants/theme';
import { Dot } from './Dot';
import { format, startOfWeek, getDay } from 'date-fns';

interface DotGridProps {
  goal: Goal;
  /** Called on tap to open modal (for completed/future dots) */
  onDotOpenModal: (date: string) => void;
  /** Called on tap to complete (only if not already complete and not future) */
  onDotComplete: (date: string) => void;
}

interface DotData {
  date: string;
  isCompleted: boolean;
  isToday: boolean;
  isFuture: boolean;
  isLastDay: boolean;
  index: number;
  isPlaceholder?: boolean;
}

interface RowData {
  mondayDate: string;
  dots: DotData[];
  rowIndex: number;
}

export const DotGrid = memo(function DotGrid({
  goal,
  onDotOpenModal,
  onDotComplete,
}: DotGridProps) {
  const flatListRef = useRef<FlatList>(null);
  const days = useDayStore((state) => state.days);
  const { width: screenWidth } = useWindowDimensions();

  // Shared values for coordinating ripple animations across dots
  const rippleTriggerIndex = useSharedValue(-1);
  const rippleTriggerTime = useSharedValue(0);

  // Fixed 7 columns (one for each day of the week) for alignment with week view
  const numColumns = 7;

  // Row label width for Monday dates (e.g., "Jan-05")
  const rowLabelWidth = 48;

  // Calculate dot size dynamically to fill the screen width
  // Account for horizontal padding on the container and row label width
  const horizontalPadding = SPACING.md * 2;
  const availableWidth = screenWidth - horizontalPadding - rowLabelWidth;
  // Each dot container includes the dot + spacing, calculate size based on available width
  const dotTotalSize = Math.floor(availableWidth / numColumns);
  // The actual dot size is the total size minus spacing
  const dynamicDotSize = dotTotalSize - DOT.spacing;

  // Day of week headers
  const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Generate dot data with proper day-of-week alignment
  const dots: DotData[] = useMemo(() => {
    const dateRange = getDateRange(goal.startDate, goal.endDate);
    const lastIndex = dateRange.length - 1;

    // Calculate how many placeholder dots we need at the start to align to Monday
    // getDay returns 0 for Sunday, 1 for Monday, etc.
    // We want Monday = 0 placeholders, Tuesday = 1 placeholder, ..., Sunday = 6 placeholders
    const firstDate = fromDateString(dateRange[0]);
    const dayOfWeek = getDay(firstDate); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Convert to Monday-based: Monday = 0, Tuesday = 1, ..., Sunday = 6
    const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Create placeholder dots for alignment
    const placeholders: DotData[] = [];
    for (let i = 0; i < mondayBasedDay; i++) {
      placeholders.push({
        date: `placeholder-${i}`,
        isCompleted: false,
        isToday: false,
        isFuture: false,
        isLastDay: false,
        index: -1,
        isPlaceholder: true,
      });
    }

    // Create actual dots
    const actualDots = dateRange.map((date, index) => {
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

    return [...placeholders, ...actualDots];
  }, [goal.id, goal.startDate, goal.endDate, days]);

  // Group dots into rows with Monday dates
  const rows: RowData[] = useMemo(() => {
    const result: RowData[] = [];
    for (let i = 0; i < dots.length; i += numColumns) {
      const rowDots = dots.slice(i, i + numColumns);
      // Find the first non-placeholder dot to calculate the Monday date
      const firstRealDot = rowDots.find((dot) => !dot.isPlaceholder);
      if (!firstRealDot) continue; // Skip if all placeholders (shouldn't happen)

      const firstRealDate = fromDateString(firstRealDot.date);
      const monday = startOfWeek(firstRealDate, { weekStartsOn: 1 });
      const mondayFormatted = format(monday, 'MMM-dd');

      result.push({
        mondayDate: mondayFormatted,
        dots: rowDots,
        rowIndex: Math.floor(i / numColumns),
      });
    }
    return result;
  }, [dots, numColumns]);

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

  // Render header with day of week labels
  const renderHeader = useCallback(
    () => (
      <View style={styles.headerRow}>
        <View style={[styles.rowLabel, { width: rowLabelWidth }]} />
        {dayHeaders.map((day, index) => (
          <View
            key={index}
            style={[styles.headerCell, { width: dotTotalSize }]}
          >
            <Text style={styles.headerText}>{day}</Text>
          </View>
        ))}
      </View>
    ),
    [dayHeaders, dotTotalSize, rowLabelWidth]
  );

  // Render a row with Monday label and dots
  const renderRow = useCallback(
    ({ item }: { item: RowData }) => (
      <View style={styles.dataRow}>
        <View style={[styles.rowLabel, { width: rowLabelWidth }]}>
          <Text style={styles.rowLabelText}>{item.mondayDate}</Text>
        </View>
        <View style={styles.dotsContainer}>
          {item.dots.map((dot) =>
            dot.isPlaceholder ? (
              <View
                key={dot.date}
                style={{ width: dotTotalSize, height: dotTotalSize }}
              />
            ) : (
              <Dot
                key={dot.date}
                date={dot.date}
                isCompleted={dot.isCompleted}
                isToday={dot.isToday}
                isFuture={dot.isFuture}
                isLastDay={dot.isLastDay}
                goalColor={COLORS.dotCompleted}
                onOpenModal={() => onDotOpenModal(dot.date)}
                onComplete={() => onDotComplete(dot.date)}
                index={dot.index}
                numColumns={numColumns}
                rippleTriggerIndex={rippleTriggerIndex}
                rippleTriggerTime={rippleTriggerTime}
                onTriggerRipple={createRippleTrigger(dot.index)}
                dotSize={dynamicDotSize}
                dotTotalSize={dotTotalSize}
              />
            )
          )}
        </View>
      </View>
    ),
    [onDotOpenModal, onDotComplete, numColumns, rippleTriggerIndex, rippleTriggerTime, createRippleTrigger, dynamicDotSize, dotTotalSize, rowLabelWidth]
  );

  const keyExtractor = useCallback((item: RowData) => item.mondayDate + item.rowIndex, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: dotTotalSize,
      offset: index * dotTotalSize,
      index,
    }),
    [dotTotalSize]
  );

  return (
    <FlatList
      ref={flatListRef}
      data={rows}
      renderItem={renderRow}
      keyExtractor={keyExtractor}
      ListHeaderComponent={renderHeader}
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      // Render all rows at once - no batching/virtualization
      initialNumToRender={rows.length}
      maxToRenderPerBatch={rows.length}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  headerCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body.medium,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    justifyContent: 'center',
    paddingRight: SPACING.xs,
  },
  rowLabelText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body.regular,
  },
  dotsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
});
