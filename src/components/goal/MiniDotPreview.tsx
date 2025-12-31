import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { getDateRange, isFuture } from '../../utils/dates';
import { COLORS } from '../../constants/theme';

interface MiniDotPreviewProps {
  goal: Goal;
}

const CHART_SIZE = 48;
const STROKE_WIDTH = 8;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * MiniDotPreview - Compact pie chart visualization for goal cards
 *
 * Shows each day as an individual segment in clockwise chronological order:
 * - Completed: Goal color
 * - Missed: Muted grey (COLORS.dotMissed)
 * - Future: Light/subtle (COLORS.dotFuture)
 */
export const MiniDotPreview = memo(function MiniDotPreview({
  goal,
}: MiniDotPreviewProps) {
  const days = useDayStore((state) => state.days);

  // Build an array of day statuses in chronological order
  const dayStatuses = useMemo(() => {
    const allDates = getDateRange(goal.startDate, goal.endDate);

    return allDates.map((date) => {
      const key = `${goal.id}_${date}`;
      const entry = days[key];
      const isCompleted = entry?.isCompleted ?? false;
      const isFutureDate = isFuture(date);

      let status: 'completed' | 'missed' | 'future';
      if (isCompleted) {
        status = 'completed';
      } else if (isFutureDate) {
        status = 'future';
      } else {
        status = 'missed';
      }

      return { date, status };
    });
  }, [goal, days]);

  // Create segments for each day in chronological order (clockwise)
  const segments = useMemo(() => {
    const total = dayStatuses.length;
    if (total === 0) {
      return [];
    }

    const segmentLength = CIRCUMFERENCE / total;

    return dayStatuses.map((day, index) => {
      let color: string;
      switch (day.status) {
        case 'completed':
          color = COLORS.dotCompleted;
          break;
        case 'missed':
          color = COLORS.dotMissed;
          break;
        case 'future':
          color = COLORS.dotFuture;
          break;
      }

      // Calculate offset for clockwise order starting from top (12 o'clock)
      // Each segment starts where the previous one ended
      const offset = index * segmentLength;

      return {
        color,
        length: segmentLength,
        offset,
        key: `day-${index}`,
      };
    });
  }, [dayStatuses]);

  const center = CHART_SIZE / 2;

  return (
    <View style={styles.container}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={RADIUS}
          stroke={COLORS.dotFuture}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          opacity={0.3}
        />
        {/* Pie segments - each day shown individually in clockwise order */}
        <G rotation={-90} origin={`${center}, ${center}`}>
          {segments.map((segment) => (
            <Circle
              key={segment.key}
              cx={center}
              cy={center}
              r={RADIUS}
              stroke={segment.color}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
});
