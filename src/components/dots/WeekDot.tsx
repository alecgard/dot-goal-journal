import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, G } from 'react-native-svg';
import { COLORS, DOT } from '../../constants/theme';
import { tapHaptic } from '../../services/haptics';

export interface WeekDayData {
  date: string;
  isCompleted: boolean;
  isFuture: boolean;
  isLastDay?: boolean;
  isToday?: boolean;
}

interface WeekDotProps {
  days: WeekDayData[];
  onPress: () => void;
  goalColor?: string;
  weekNumber?: number;
}

// Size of the week dot (doubled for better visibility)
const WEEK_DOT_SIZE = (DOT.size + 4) * 2;
const CENTER = WEEK_DOT_SIZE / 2;
const RADIUS = (WEEK_DOT_SIZE / 2) - 2;

/**
 * Calculate SVG path for a pie segment in a square
 * The segments radiate from the center, dividing the square into 7 wedges
 */
function getSegmentPath(index: number, totalSegments: number = 7): string {
  // Each segment spans an angle of 360/7 degrees
  const anglePerSegment = 360 / totalSegments;
  const startAngle = index * anglePerSegment - 90; // Start from top (-90 degrees)
  const endAngle = startAngle + anglePerSegment;

  // Convert to radians
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calculate points on the edge (using a larger radius to extend to edges)
  const edgeRadius = RADIUS * 1.5; // Extend beyond the visible circle to reach edges
  const x1 = CENTER + edgeRadius * Math.cos(startRad);
  const y1 = CENTER + edgeRadius * Math.sin(startRad);
  const x2 = CENTER + edgeRadius * Math.cos(endRad);
  const y2 = CENTER + edgeRadius * Math.sin(endRad);

  // Create pie slice path from center to edge points
  const largeArcFlag = anglePerSegment > 180 ? 1 : 0;

  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${edgeRadius} ${edgeRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

/**
 * Get color for a segment based on day status
 */
function getSegmentColor(day: WeekDayData | undefined, goalColor: string): string {
  if (!day) {
    // No day data (partial week) - use very light/transparent
    return 'transparent';
  }
  // Last day is always gold
  if (day.isLastDay) {
    return COLORS.neon.gold;
  }
  if (day.isCompleted) {
    return goalColor;
  }
  if (day.isFuture) {
    return COLORS.dotFuture;
  }
  // Missed day
  return COLORS.dotMissed;
}

/**
 * WeekDot - A square dot divided into 7 pie-like segments
 *
 * Each segment represents a day of the week, colored based on status:
 * - Completed: goal color (green by default)
 * - Missed: grey
 * - Future: light/inset appearance
 */
export const WeekDot = memo(function WeekDot({
  days,
  onPress,
  goalColor = COLORS.dotCompleted,
}: WeekDotProps) {
  const scale = useSharedValue(1);

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withTiming(0.95, { duration: 50 });
    })
    .onEnd(() => {
      scale.value = withSequence(
        withTiming(1.05, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) })
      );
      runOnJS(tapHaptic)();
      runOnJS(onPress)();
    })
    .onFinalize(() => {
      scale.value = withTiming(1, { duration: 100 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Generate the 7 segments
  const segments = Array.from({ length: 7 }, (_, index) => {
    const day = days[index];
    const color = getSegmentColor(day, goalColor);
    const path = getSegmentPath(index);
    const isSegmentToday = day?.isToday ?? false;

    return (
      <Path
        key={index}
        d={path}
        fill={color}
        stroke={isSegmentToday ? COLORS.dotToday : COLORS.background}
        strokeWidth={isSegmentToday ? 3 : 0.5}
      />
    );
  });

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.dotContainer}>
          <Svg
            width={WEEK_DOT_SIZE}
            height={WEEK_DOT_SIZE}
            viewBox={`0 0 ${WEEK_DOT_SIZE} ${WEEK_DOT_SIZE}`}
          >
            <G>
              {segments}
            </G>
          </Svg>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    width: WEEK_DOT_SIZE + DOT.spacing,
    height: WEEK_DOT_SIZE + DOT.spacing,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotContainer: {
    width: WEEK_DOT_SIZE,
    height: WEEK_DOT_SIZE,
    borderRadius: DOT.borderRadius * 2,
    overflow: 'hidden',
    // Neumorphic shadow for raised appearance
    shadowColor: 'rgba(163, 177, 198, 0.8)',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: COLORS.background,
  },
});
