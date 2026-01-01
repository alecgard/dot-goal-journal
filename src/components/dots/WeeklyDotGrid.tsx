import React, { memo, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { getDateRange, isToday, isFuture } from '../../utils/dates';
import { COLORS, DOT, SPACING, FONTS, FONT_SIZE } from '../../constants/theme';
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
  month: number; // 0-11
  year: number;
}

interface MonthRowData {
  monthKey: string; // e.g., "2024-01" for sorting/keying
  monthLabel: string; // e.g., "Jan"
  year: number;
  weeks: (WeekData | null)[]; // Array of 5-6 slots for week-of-month (null for empty cells)
}

// Month label width
const MONTH_LABEL_WIDTH = 40;

// Padding on each side of the grid
const HORIZONTAL_PADDING = SPACING.md * 2;

// Maximum number of week columns (some months can have 6 weeks)
const MAX_WEEK_COLUMNS = 6;

// Calculate dot size dynamically based on screen width
function calculateDotSize(): { dotSize: number; dotTotalSize: number } {
  const screenWidth = Dimensions.get('window').width;
  // Available width = screen width - month label - horizontal padding
  const availableWidth = screenWidth - MONTH_LABEL_WIDTH - HORIZONTAL_PADDING;
  // Each column needs space for the dot plus spacing
  // We want to fit MAX_WEEK_COLUMNS columns
  const dotTotalSize = Math.floor(availableWidth / MAX_WEEK_COLUMNS);
  const dotSize = dotTotalSize - DOT.spacing;
  return { dotSize, dotTotalSize };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a Date to YYYY-MM-DD using local timezone
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the Monday of the week containing the given date
 */
function getMondayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date);
  monday.setDate(diff);
  return formatLocalDate(monday);
}

/**
 * Get the Thursday of the week containing the given Monday date
 * Thursday is used because it's always in the majority month of a week
 * (ISO week standard: a week belongs to the month containing its Thursday)
 */
function getThursdayOfWeek(mondayDateStr: string): Date {
  const monday = new Date(mondayDateStr + 'T00:00:00');
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3); // Thursday is 3 days after Monday
  return thursday;
}

/**
 * Get the week-of-month index (0-5) for a given Monday date
 * Week assignment is based on which month the Thursday falls in,
 * ensuring weeks are assigned to the month with the majority of days.
 * Week 0 = first week of the month (contains day 1-7 or starts before day 1)
 */
function getWeekOfMonth(mondayDateStr: string): { weekOfMonth: number; month: number; year: number } {
  // Use Thursday to determine which month this week belongs to
  const thursday = getThursdayOfWeek(mondayDateStr);
  const year = thursday.getFullYear();
  const month = thursday.getMonth();

  // Get the first day of this month (the month Thursday is in)
  const firstOfMonth = new Date(year, month, 1);

  // Get the Monday of the week that contains the 1st of this month
  const firstMondayStr = getMondayOfWeek(formatLocalDate(firstOfMonth));
  const firstMonday = new Date(firstMondayStr + 'T00:00:00');

  // But we need to check if that first week's Thursday is actually in this month
  const firstWeekThursday = getThursdayOfWeek(firstMondayStr);

  // If the first week's Thursday is in a previous month, the first week of this month
  // is actually the next week
  let adjustedFirstMonday = firstMonday;
  if (firstWeekThursday.getMonth() !== month) {
    adjustedFirstMonday = new Date(firstMonday);
    adjustedFirstMonday.setDate(adjustedFirstMonday.getDate() + 7);
  }

  const monday = new Date(mondayDateStr + 'T00:00:00');
  // Calculate how many weeks from the adjusted first Monday to this Monday
  const diffTime = monday.getTime() - adjustedFirstMonday.getTime();
  const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

  return { weekOfMonth: diffWeeks, month, year };
}

/**
 * Get the day-of-week index (0=Monday, 1=Tuesday, ..., 6=Sunday)
 */
function getDayOfWeekIndex(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  // Convert from JS day (0=Sunday, 1=Monday, ..., 6=Saturday)
  // to our format (0=Monday, 1=Tuesday, ..., 6=Sunday)
  return day === 0 ? 6 : day - 1;
}

/**
 * Get all dates in a week starting from the given Monday
 */
function getWeekDates(mondayStr: string): string[] {
  const monday = new Date(mondayStr + 'T00:00:00');
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(formatLocalDate(date));
  }
  return dates;
}

/**
 * Group an array of dates into weeks (7 days each, starting on Monday)
 * Each week is assigned to the month that contains the majority of its days
 * (determined by which month the Thursday falls in).
 *
 * For partial weeks (goal starts/ends mid-week), placeholder entries are
 * added for days outside the goal range. Each day is positioned correctly
 * based on its day-of-week (Monday=0, Tuesday=1, ..., Sunday=6).
 */
function groupIntoWeeks(
  dates: string[],
  days: Record<string, { isCompleted: boolean }>,
  goalId: string
): WeekData[] {
  const weeks: WeekData[] = [];
  const weekMap = new Map<string, Map<number, WeekDayData>>(); // monday -> (dayIndex -> dayData)
  const dateSet = new Set(dates);
  const lastDate = dates[dates.length - 1];

  // Group dates by their Monday, storing by day-of-week index
  dates.forEach((date) => {
    const monday = getMondayOfWeek(date);
    const dayIndex = getDayOfWeekIndex(date);
    const key = `${goalId}_${date}`;
    const entry = days[key];
    const isLastDay = date === lastDate;
    const isTodayFlag = isToday(date);

    const dayData: WeekDayData = {
      date,
      isCompleted: entry?.isCompleted ?? false,
      isFuture: isFuture(date),
      isLastDay,
      isToday: isTodayFlag,
      isPlaceholder: false,
    };

    if (!weekMap.has(monday)) {
      weekMap.set(monday, new Map());
    }
    weekMap.get(monday)!.set(dayIndex, dayData);
  });

  // Convert map to sorted array of weeks, filling in placeholders for missing days
  const sortedMondays = Array.from(weekMap.keys()).sort();
  sortedMondays.forEach((monday) => {
    const dayMap = weekMap.get(monday)!;
    const weekDates = getWeekDates(monday);

    // Get the month this week belongs to (based on Thursday)
    const { weekOfMonth, month: weekMonth, year: weekYear } = getWeekOfMonth(monday);

    // Build array of 7 days, with placeholders for days outside goal range
    // (Month-specific placeholders are applied later in adjustWeekForMonth)
    const weekDays: WeekDayData[] = [];
    for (let i = 0; i < 7; i++) {
      if (dayMap.has(i)) {
        // Day is in goal range - show it
        weekDays.push(dayMap.get(i)!);
      } else {
        // Day is outside goal range - placeholder
        weekDays.push({
          date: weekDates[i],
          isCompleted: false,
          isFuture: false,
          isLastDay: false,
          isToday: false,
          isPlaceholder: true,
        });
      }
    }

    weeks.push({
      id: `week-${monday}`,
      weekNumber: weekOfMonth,
      days: weekDays,
      startDate: monday,
      month: weekMonth,
      year: weekYear,
    });
  });

  return weeks;
}

/**
 * Get the week column numbers to display (1-based for UI)
 * Returns array like [1, 2, 3, 4, 5] or [1, 2, 3, 4, 5, 6]
 */
function getWeekColumnNumbers(weeks: WeekData[]): number[] {
  // Find the maximum week-of-month value across all weeks
  let maxWeekOfMonth = 4; // Minimum 5 columns (0-4 = weeks 1-5)
  weeks.forEach(week => {
    if (week.weekNumber > maxWeekOfMonth) {
      maxWeekOfMonth = week.weekNumber;
    }
  });

  // Generate array of 1-based week numbers
  const columns: number[] = [];
  for (let i = 0; i <= maxWeekOfMonth; i++) {
    columns.push(i + 1); // Convert 0-based to 1-based
  }
  return columns;
}

/**
 * Get all months that span the date range
 */
function getAllMonths(startDate: string, endDate: string): { key: string; label: string; month: number; year: number }[] {
  const months: { key: string; label: string; month: number; year: number }[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  let current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    const month = current.getMonth();
    const year = current.getFullYear();
    months.push({
      key: `${year}-${month.toString().padStart(2, '0')}`,
      label: MONTH_NAMES[month],
      month,
      year,
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Check if a week has any days in a given month
 */
function weekHasDaysInMonth(weekStartMonday: string, targetMonth: number, targetYear: number): boolean {
  const weekDates = getWeekDates(weekStartMonday);
  return weekDates.some(dateStr => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
  });
}

/**
 * Calculate week-of-month for a week relative to a specific month
 * (may differ from the Thursday-based assignment for boundary weeks)
 */
function getWeekOfMonthForDisplay(weekStartMonday: string, targetMonth: number, targetYear: number): number {
  // Get the first day of the target month
  const firstOfMonth = new Date(targetYear, targetMonth, 1);
  const firstMondayStr = getMondayOfWeek(formatLocalDate(firstOfMonth));
  const firstMonday = new Date(firstMondayStr + 'T00:00:00');

  const weekMonday = new Date(weekStartMonday + 'T00:00:00');
  const diffTime = weekMonday.getTime() - firstMonday.getTime();
  const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

  return Math.max(0, diffWeeks); // Ensure non-negative
}

/**
 * Create a copy of week data with days adjusted for display in a specific month
 * Days not in the target month become placeholders
 */
function adjustWeekForMonth(week: WeekData, targetMonth: number, targetYear: number): WeekData {
  const adjustedDays = week.days.map(day => {
    const dayDate = new Date(day.date + 'T00:00:00');
    const dayMonth = dayDate.getMonth();
    const dayYear = dayDate.getFullYear();

    // If day is not in the target month, make it a placeholder
    if (dayMonth !== targetMonth || dayYear !== targetYear) {
      return {
        ...day,
        isCompleted: false,
        isFuture: false,
        isLastDay: false,
        isToday: false,
        isPlaceholder: true,
      };
    }
    return day;
  });

  return {
    ...week,
    days: adjustedDays,
  };
}

/**
 * Organize weeks into a grid: months as rows, week-of-month as columns
 * Weeks that span two months appear in BOTH months' rows
 */
function organizeIntoGrid(
  weeks: WeekData[],
  weekColumnNumbers: number[],
  months: { key: string; label: string; month: number; year: number }[]
): MonthRowData[] {
  // Build a map: for each month, map weekOfMonth -> week data (adjusted for that month)
  // A week can appear in multiple months if it spans month boundaries
  const monthWeekMaps = new Map<string, Map<number, WeekData>>();

  months.forEach(monthInfo => {
    const monthKey = `${monthInfo.year}-${monthInfo.month}`;
    monthWeekMaps.set(monthKey, new Map());
  });

  // For each week, add it to every month it has days in
  weeks.forEach(week => {
    months.forEach(monthInfo => {
      if (weekHasDaysInMonth(week.startDate, monthInfo.month, monthInfo.year)) {
        const monthKey = `${monthInfo.year}-${monthInfo.month}`;
        const weekOfMonth = getWeekOfMonthForDisplay(week.startDate, monthInfo.month, monthInfo.year);
        // Adjust the week's days for this specific month
        const adjustedWeek = adjustWeekForMonth(week, monthInfo.month, monthInfo.year);
        monthWeekMaps.get(monthKey)!.set(weekOfMonth, adjustedWeek);
      }
    });
  });

  return months.map(monthInfo => {
    const monthKey = `${monthInfo.year}-${monthInfo.month}`;
    const weekMap = monthWeekMaps.get(monthKey)!;

    // For each week column (1-based), find the corresponding week (0-based weekNumber)
    const weeksInRow: (WeekData | null)[] = weekColumnNumbers.map(colNum => {
      const weekOfMonth = colNum - 1; // Convert 1-based column to 0-based weekNumber
      return weekMap.get(weekOfMonth) || null;
    });

    return {
      monthKey: monthInfo.key,
      monthLabel: monthInfo.label,
      year: monthInfo.year,
      weeks: weeksInRow,
    };
  });
}

export const WeeklyDotGrid = memo(function WeeklyDotGrid({
  goal,
  onWeekPress,
}: WeeklyDotGridProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const days = useDayStore((state) => state.days);

  // Calculate dynamic dot size based on screen width
  const { dotSize, dotTotalSize } = useMemo(() => calculateDotSize(), []);

  // Generate week data and grid structure
  const { weekColumnNumbers, monthRows } = useMemo(() => {
    const dateRange = getDateRange(goal.startDate, goal.endDate);
    const weeks = groupIntoWeeks(dateRange, days, goal.id);
    const columnNumbers = getWeekColumnNumbers(weeks);
    const months = getAllMonths(goal.startDate, goal.endDate);
    const rows = organizeIntoGrid(weeks, columnNumbers, months);

    return { weekColumnNumbers: columnNumbers, monthRows: rows };
  }, [goal.id, goal.startDate, goal.endDate, days]);

  // Find the month containing today for auto-scroll
  const todayMonthIndex = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    return monthRows.findIndex(
      (row) =>
        parseInt(row.monthKey.split('-')[0]) === todayYear &&
        parseInt(row.monthKey.split('-')[1]) === todayMonth
    );
  }, [monthRows]);

  // Auto-scroll to the month containing today on mount
  useEffect(() => {
    if (todayMonthIndex >= 0 && scrollViewRef.current) {
      const headerHeight = 30;
      const scrollOffset = todayMonthIndex * dotTotalSize + headerHeight - 100;

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, scrollOffset),
          animated: false,
        });
      }, 100);
    }
  }, [todayMonthIndex, dotTotalSize]);

  // Dynamic styles based on calculated dot size
  const dynamicStyles = useMemo(() => ({
    columnHeader: {
      width: dotTotalSize,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    dotCell: {
      width: dotTotalSize,
      height: dotTotalSize,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  }), [dotTotalSize]);

  // Render column headers (week numbers 1-5 or 1-6)
  const renderColumnHeaders = () => (
    <View style={styles.headerRow}>
      <View style={styles.monthLabelPlaceholder} />
      {weekColumnNumbers.map((weekNum) => (
        <View key={weekNum} style={dynamicStyles.columnHeader}>
          <Text style={styles.columnHeaderText}>{weekNum}</Text>
        </View>
      ))}
    </View>
  );

  // Render a month row
  const renderMonthRow = (monthRow: MonthRowData) => (
    <View key={monthRow.monthKey} style={styles.monthRow}>
      <View style={styles.monthLabel}>
        <Text style={styles.monthLabelText}>{monthRow.monthLabel}</Text>
      </View>
      {monthRow.weeks.map((week, index) => (
        <View key={`${monthRow.monthKey}-${index}`} style={dynamicStyles.dotCell}>
          {week ? (
            <WeekDot
              days={week.days}
              onPress={() => onWeekPress(week.startDate)}
              goalColor={COLORS.dotCompleted}
              weekNumber={week.weekNumber}
              size={dotSize}
            />
          ) : null}
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.gridContainer}>
        {renderColumnHeaders()}
        {monthRows.map(renderMonthRow)}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  gridContainer: {
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    height: 24,
  },
  monthLabelPlaceholder: {
    width: MONTH_LABEL_WIDTH,
  },
  columnHeaderText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body.medium,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthLabel: {
    width: MONTH_LABEL_WIDTH,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: SPACING.xs,
  },
  monthLabelText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body.medium,
  },
});
