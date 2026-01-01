import React, { memo, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
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
  weeks: (WeekData | null)[]; // null for empty cells
}

// Size of week dots (doubled)
const WEEK_DOT_SIZE = (DOT.size + 4) * 2;
const WEEK_DOT_TOTAL_SIZE = WEEK_DOT_SIZE + DOT.spacing;

// Month label width
const MONTH_LABEL_WIDTH = 40;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a date string to "Mon-DD" format for column headers
 */
function formatWeekHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}-${day}`;
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
  return monday.toISOString().split('T')[0];
}

/**
 * Group an array of dates into weeks (7 days each, starting on Monday)
 */
function groupIntoWeeks(
  dates: string[],
  days: Record<string, { isCompleted: boolean }>,
  goalId: string
): WeekData[] {
  const weeks: WeekData[] = [];
  const weekMap = new Map<string, WeekDayData[]>();
  const lastDateIndex = dates.length - 1;

  // Group dates by their Monday
  dates.forEach((date, index) => {
    const monday = getMondayOfWeek(date);
    const key = `${goalId}_${date}`;
    const entry = days[key];
    const isLastDay = index === lastDateIndex;

    const dayData: WeekDayData = {
      date,
      isCompleted: entry?.isCompleted ?? false,
      isFuture: isFuture(date),
      isLastDay,
      isToday: isToday(date),
    };

    if (!weekMap.has(monday)) {
      weekMap.set(monday, []);
    }
    weekMap.get(monday)!.push(dayData);
  });

  // Convert map to sorted array of weeks
  const sortedMondays = Array.from(weekMap.keys()).sort();
  sortedMondays.forEach((monday, index) => {
    const mondayDate = new Date(monday + 'T00:00:00');
    weeks.push({
      id: `week-${monday}`,
      weekNumber: index,
      days: weekMap.get(monday)!,
      startDate: monday,
      month: mondayDate.getMonth(),
      year: mondayDate.getFullYear(),
    });
  });

  return weeks;
}

/**
 * Get all unique week columns (Mondays) spanning the date range
 */
function getAllWeekColumns(startDate: string, endDate: string): string[] {
  const columns: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  // Get the Monday of the start week
  let current = new Date(getMondayOfWeek(startDate) + 'T00:00:00');

  while (current <= end) {
    columns.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 7);
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
 * Organize weeks into a grid: months as rows, week columns as columns
 */
function organizeIntoGrid(
  weeks: WeekData[],
  weekColumns: string[],
  months: { key: string; label: string; month: number; year: number }[]
): MonthRowData[] {
  // Create a map for quick week lookup by startDate
  const weekByStartDate = new Map<string, WeekData>();
  weeks.forEach(week => weekByStartDate.set(week.startDate, week));

  return months.map(monthInfo => {
    const weeksInRow: (WeekData | null)[] = weekColumns.map(monday => {
      const mondayDate = new Date(monday + 'T00:00:00');
      // A week belongs to a month if its Monday falls within that month
      if (mondayDate.getMonth() === monthInfo.month && mondayDate.getFullYear() === monthInfo.year) {
        return weekByStartDate.get(monday) || null;
      }
      return null;
    });

    return {
      monthKey: monthInfo.key,
      monthLabel: monthInfo.label,
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

  // Generate week data and grid structure
  const { weekColumns, monthRows } = useMemo(() => {
    const dateRange = getDateRange(goal.startDate, goal.endDate);
    const weeks = groupIntoWeeks(dateRange, days, goal.id);
    const columns = getAllWeekColumns(goal.startDate, goal.endDate);
    const months = getAllMonths(goal.startDate, goal.endDate);
    const rows = organizeIntoGrid(weeks, columns, months);

    return { weekColumns: columns, monthRows: rows };
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
      const scrollOffset = todayMonthIndex * WEEK_DOT_TOTAL_SIZE + headerHeight - 100;

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, scrollOffset),
          animated: false,
        });
      }, 100);
    }
  }, [todayMonthIndex]);

  // Render column headers (week start dates)
  const renderColumnHeaders = () => (
    <View style={styles.headerRow}>
      <View style={styles.monthLabelPlaceholder} />
      {weekColumns.map((monday) => (
        <View key={monday} style={styles.columnHeader}>
          <Text style={styles.columnHeaderText}>{formatWeekHeader(monday)}</Text>
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
        <View key={`${monthRow.monthKey}-${index}`} style={styles.dotCell}>
          {week ? (
            <WeekDot
              days={week.days}
              onPress={() => onWeekPress(week.startDate)}
              goalColor={COLORS.dotCompleted}
              weekNumber={week.weekNumber}
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalContent}
      >
        <View style={styles.gridContainer}>
          {renderColumnHeaders()}
          {monthRows.map(renderMonthRow)}
        </View>
      </ScrollView>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingBottom: SPACING.xl,
  },
  horizontalContent: {
    paddingHorizontal: SPACING.md,
  },
  gridContainer: {
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.xs,
    height: 30,
  },
  monthLabelPlaceholder: {
    width: MONTH_LABEL_WIDTH,
  },
  columnHeader: {
    width: WEEK_DOT_TOTAL_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  columnHeaderText: {
    fontSize: FONT_SIZE.xs - 2,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body.regular,
    transform: [{ rotate: '-45deg' }],
    marginBottom: 4,
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
  dotCell: {
    width: WEEK_DOT_TOTAL_SIZE,
    height: WEEK_DOT_TOTAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
