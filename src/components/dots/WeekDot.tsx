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
  /** True if this day is outside the goal's date range (used for partial weeks) */
  isPlaceholder?: boolean;
}

interface WeekDotProps {
  days: WeekDayData[];
  onPress: () => void;
  goalColor?: string;
  weekNumber?: number;
  /** Size of the dot in pixels. Defaults to (DOT.size + 4) * 2 */
  size?: number;
}

// Default size of the week dot (doubled for better visibility)
const DEFAULT_WEEK_DOT_SIZE = (DOT.size + 4) * 2;

/**
 * Calculate SVG path for a pie segment in a square
 * The segments radiate from the center, dividing the square into 7 wedges
 */
function getSegmentPath(index: number, dotSize: number, totalSegments: number = 7): string {
  const center = dotSize / 2;
  const radius = (dotSize / 2) - 2;

  // Each segment spans an angle of 360/7 degrees
  const anglePerSegment = 360 / totalSegments;
  const startAngle = index * anglePerSegment - 90; // Start from top (-90 degrees)
  const endAngle = startAngle + anglePerSegment;

  // Convert to radians
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calculate points on the edge (using a larger radius to extend to edges)
  const edgeRadius = radius * 1.5; // Extend beyond the visible circle to reach edges
  const x1 = center + edgeRadius * Math.cos(startRad);
  const y1 = center + edgeRadius * Math.sin(startRad);
  const x2 = center + edgeRadius * Math.cos(endRad);
  const y2 = center + edgeRadius * Math.sin(endRad);

  // Create pie slice path from center to edge points
  const largeArcFlag = anglePerSegment > 180 ? 1 : 0;

  return `M ${center} ${center} L ${x1} ${y1} A ${edgeRadius} ${edgeRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

/**
 * Get color for a segment based on day status
 */
function getSegmentColor(day: WeekDayData | undefined, goalColor: string): string {
  if (!day) {
    // No day data (partial week) - use very light/transparent
    return 'transparent';
  }
  // Placeholder days (outside goal date range) - transparent
  if (day.isPlaceholder) {
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
 * Get stroke properties for a segment
 */
function getSegmentStroke(day: WeekDayData | undefined): { stroke: string; strokeWidth: number } {
  if (!day) {
    return { stroke: COLORS.background, strokeWidth: 0.5 };
  }
  // Placeholder segments get a faint outline
  if (day.isPlaceholder) {
    return { stroke: 'rgba(163, 177, 198, 0.3)', strokeWidth: 0.5 };
  }
  // Today gets prominent orange stroke
  if (day.isToday) {
    return { stroke: COLORS.dotToday, strokeWidth: 4 };
  }
  // Normal segments
  return { stroke: COLORS.background, strokeWidth: 0.5 };
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
  size = DEFAULT_WEEK_DOT_SIZE,
}: WeekDotProps) {
  const scale = useSharedValue(1);

  // Find if there's a "today" segment for glow effect
  const todayIndex = days.findIndex(day => day?.isToday);

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
    const path = getSegmentPath(index, size);
    const { stroke, strokeWidth } = getSegmentStroke(day);

    return (
      <Path
        key={index}
        d={path}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  });

  // Create a separate glow layer for today's segment (rendered on top)
  // Multiple layers create a soft glow effect around the orange stroke
  const todayGlowSegment = todayIndex >= 0 ? (
    <>
      {/* Outer glow layer - wide and very transparent */}
      <Path
        d={getSegmentPath(todayIndex, size)}
        fill="transparent"
        stroke={COLORS.dotToday}
        strokeWidth={10}
        strokeOpacity={0.15}
      />
      {/* Middle glow layer */}
      <Path
        d={getSegmentPath(todayIndex, size)}
        fill="transparent"
        stroke={COLORS.dotToday}
        strokeWidth={7}
        strokeOpacity={0.25}
      />
      {/* Inner glow layer - more visible */}
      <Path
        d={getSegmentPath(todayIndex, size)}
        fill="transparent"
        stroke={COLORS.dotToday}
        strokeWidth={5}
        strokeOpacity={0.4}
      />
    </>
  ) : null;

  // Dynamic container and dot sizes based on size prop
  const containerSize = size + DOT.spacing;
  const dynamicContainerStyle = {
    width: containerSize,
    height: containerSize,
  };
  const dynamicDotStyle = {
    width: size,
    height: size,
  };

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.container, dynamicContainerStyle, animatedStyle]}>
        <View style={[styles.dotContainer, dynamicDotStyle]}>
          <Svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            <G>
              {segments}
              {todayGlowSegment}
            </G>
          </Svg>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotContainer: {
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
