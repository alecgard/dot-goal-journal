import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { COLORS, DOT, ANIMATION } from '../../constants/theme';
import { completionHaptic } from '../../services/haptics';

interface DotProps {
  date: string;
  isCompleted: boolean;
  isToday: boolean;
  isFuture: boolean;
  isLastDay?: boolean;
  goalColor: string;
  /** Called on long press - opens the modal */
  onLongPress: () => void;
  /** Called on single tap to complete (only if not already complete) */
  onComplete: () => void;
  shouldAnimate?: boolean;
  /** Index of this dot in the grid */
  index?: number;
  /** Number of columns in the grid */
  numColumns?: number;
  /** Shared value containing the index of the dot that triggered the ripple */
  rippleTriggerIndex?: SharedValue<number>;
  /** Shared value containing the timestamp of when ripple was triggered */
  rippleTriggerTime?: SharedValue<number>;
  /** Callback to trigger ripple effect (called when this dot is completed) */
  onTriggerRipple?: () => void;
}

/**
 * Dot - Neumorphic dot element
 *
 * States:
 * - Completed: Extruded with goal color, raised from surface
 * - Future: Subtle inset, appears carved into surface
 * - Missed: Flat grey, minimal presence
 * - Today: Orange accent ring
 */
/** Calculate the distance between two dots in a grid */
function calculateDistance(
  index1: number,
  index2: number,
  numColumns: number
): number {
  'worklet';
  const row1 = Math.floor(index1 / numColumns);
  const col1 = index1 % numColumns;
  const row2 = Math.floor(index2 / numColumns);
  const col2 = index2 % numColumns;
  return Math.sqrt(Math.pow(row2 - row1, 2) + Math.pow(col2 - col1, 2));
}

export const Dot = memo(function Dot({
  date,
  isCompleted,
  isToday,
  isFuture,
  isLastDay,
  goalColor,
  onLongPress,
  onComplete,
  shouldAnimate,
  index,
  numColumns,
  rippleTriggerIndex,
  rippleTriggerTime,
  onTriggerRipple,
}: DotProps) {
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Determine the display color - last day is always gold
  const displayColor = isLastDay ? COLORS.neon.amber : goalColor;

  // Only set up ripple reaction when we have all required props
  const hasRippleProps = rippleTriggerIndex !== undefined &&
                         rippleTriggerTime !== undefined &&
                         index !== undefined &&
                         numColumns !== undefined;

  // React to ripple triggers from other dots
  useAnimatedReaction(
    () => {
      // Return 0 if we don't have ripple props to skip processing
      if (!hasRippleProps) return 0;
      return rippleTriggerTime?.value ?? 0;
    },
    (currentTime, previousTime) => {
      if (
        currentTime !== previousTime &&
        currentTime > 0 &&
        hasRippleProps
      ) {
        const triggerIndex = rippleTriggerIndex!.value;

        // Don't animate the source dot (it has its own animation)
        if (triggerIndex === index) return;

        const distance = calculateDistance(index!, triggerIndex, numColumns!);

        // Only animate immediate neighbor dots (horizontally, vertically, and diagonally adjacent)
        // Diagonal neighbors have distance sqrt(2) ≈ 1.414, so use 1.5 as threshold
        const maxDistance = 1.5;
        if (distance <= maxDistance) {
          // Delay based on distance - closer dots animate first
          const delay = distance * 50; // 50ms per unit of distance

          // Subtle scale pulse that decreases with distance
          const intensity = 1 - distance / (maxDistance + 1);
          const scaleAmount = 1 + 0.15 * intensity; // Max 15% scale up for adjacent dots

          scale.value = withDelay(
            delay,
            withSequence(
              withTiming(scaleAmount, { duration: 100 }),
              withSpring(1, { damping: 12, stiffness: 200 })
            )
          );
        }
      }
    },
    [hasRippleProps, index, numColumns]
  );

  const handleLongPressStart = useCallback(() => {
    'worklet';
    scale.value = withSpring(0.85);
  }, [scale]);

  const handleLongPressEnd = useCallback(() => {
    'worklet';
    scale.value = withSpring(1);
  }, [scale]);

  const triggerCelebration = useCallback(() => {
    'worklet';
    // Enhanced ripple animation - bigger and more visible
    rippleScale.value = 0;
    rippleOpacity.value = 0.8;
    rippleScale.value = withTiming(3.5, { duration: ANIMATION.celebration });
    rippleOpacity.value = withTiming(0, { duration: ANIMATION.celebration });

    // Glow effect - flash bright then fade
    glowOpacity.value = 1;
    glowOpacity.value = withTiming(0, { duration: ANIMATION.celebration * 1.2 });

    // More dramatic scale bounce - bigger pop with overshoot
    scale.value = withSequence(
      withSpring(1.8, { damping: 3, stiffness: 400 }),
      withSpring(0.9, { damping: 8, stiffness: 300 }),
      withSpring(1.15, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );

    // Haptic on JS thread
    runOnJS(completionHaptic)();
  }, [scale, rippleScale, rippleOpacity, glowOpacity]);

  // Long press opens the modal (for notes, uncompleting, etc.)
  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onBegin(() => {
      handleLongPressStart();
    })
    .onEnd(() => {
      // Reset scale immediately before opening modal
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      if (!isFuture) {
        runOnJS(onLongPress)();
      }
    })
    .onFinalize(() => {
      // Always reset scale when gesture ends
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });

  // Single tap completes the dot (only if not already complete and not future)
  const tapGesture = Gesture.Tap().onEnd(() => {
    if (!isFuture && !isCompleted) {
      triggerCelebration();
      runOnJS(onComplete)();
      // Trigger ripple effect to neighboring dots
      if (onTriggerRipple) {
        runOnJS(onTriggerRipple)();
      }
    }
  });

  const composedGesture = Gesture.Exclusive(longPressGesture, tapGesture);

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1.5 + glowOpacity.value * 0.5 }],
  }));

  // Determine dot appearance based on state
  const getDotStyle = () => {
    // Last day always shows in gold, regardless of state
    if (isLastDay) {
      return [styles.dot, styles.dotCompleted, { backgroundColor: displayColor }];
    }
    if (isCompleted) {
      return [styles.dot, styles.dotCompleted, { backgroundColor: displayColor }];
    }
    if (isFuture) {
      return [styles.dot, styles.dotFuture];
    }
    return [styles.dot, styles.dotMissed];
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedDotStyle]}>
        {/* Glow effect - bright flash on completion */}
        <Animated.View
          style={[
            styles.glow,
            { backgroundColor: displayColor },
            animatedGlowStyle,
          ]}
        />

        {/* Ripple effect */}
        <Animated.View
          style={[
            styles.ripple,
            { backgroundColor: displayColor },
            animatedRippleStyle,
          ]}
        />

        {/* Today indicator ring */}
        {isToday && (
          <View style={styles.todayRing} />
        )}

        {/* Main dot */}
        <Animated.View style={getDotStyle()} />
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    width: DOT.size + DOT.spacing,
    height: DOT.size + DOT.spacing,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: DOT.size,
    height: DOT.size,
    borderRadius: DOT.size / 2,
  },
  // Completed: Extruded appearance with subtle shadow effect
  dotCompleted: {
    // Shadow simulation for raised effect
    shadowColor: 'rgba(163, 177, 198, 0.8)',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 4,
  },
  // Future: Inset appearance
  dotFuture: {
    backgroundColor: COLORS.dotFuture,
    // Inset simulation via border
    borderWidth: 1,
    borderTopColor: 'rgba(163, 177, 198, 0.4)',
    borderLeftColor: 'rgba(163, 177, 198, 0.4)',
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
  },
  // Missed: Flat, muted
  dotMissed: {
    backgroundColor: COLORS.dotMissed,
  },
  // Today ring
  todayRing: {
    position: 'absolute',
    width: DOT.size + DOT.borderWidth * 2 + 4,
    height: DOT.size + DOT.borderWidth * 2 + 4,
    borderRadius: (DOT.size + DOT.borderWidth * 2 + 4) / 2,
    borderWidth: DOT.borderWidth,
    borderColor: COLORS.dotToday,
  },
  ripple: {
    position: 'absolute',
    width: DOT.size,
    height: DOT.size,
    borderRadius: DOT.size / 2,
  },
  glow: {
    position: 'absolute',
    width: DOT.size,
    height: DOT.size,
    borderRadius: DOT.size / 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
});
