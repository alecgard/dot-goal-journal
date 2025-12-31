import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { COLORS, DOT } from '../../constants/theme';
import { completionHaptic } from '../../services/haptics';

// Animation timing constants (total animation ~1 second)
const COMPLETION_DURATION = 1000; // Total animation duration in ms
const WAVE_DURATION = 700; // Duration for each wave to expand
const WAVE_STAGGER = 150; // Delay between waves

interface DotProps {
  date: string;
  isCompleted: boolean;
  isToday: boolean;
  isFuture: boolean;
  isLastDay?: boolean;
  goalColor: string;
  /** Called on tap to open modal (for completed/future dots) */
  onOpenModal: () => void;
  /** Called on tap to complete (only if not already complete and not future) */
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
  onOpenModal,
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

  // Multiple wave rings for expanding wave effect
  const wave1Scale = useSharedValue(0);
  const wave1Opacity = useSharedValue(0);
  const wave2Scale = useSharedValue(0);
  const wave2Opacity = useSharedValue(0);
  const wave3Scale = useSharedValue(0);
  const wave3Opacity = useSharedValue(0);

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

        // Animate immediate neighbor dots (horizontally, vertically, and diagonally adjacent)
        // Diagonal neighbors have distance sqrt(2) ≈ 1.414, so use 1.5 as threshold
        const maxDistance = 1.5;
        if (distance <= maxDistance) {
          // Delay based on distance - closer dots animate first
          const delay = distance * 80; // 80ms per unit of distance for more visible stagger

          // More prominent scale pulse that decreases with distance
          const intensity = 1 - distance / (maxDistance + 1);
          const scaleAmount = 1 + 0.25 * intensity; // Max 25% scale up for adjacent dots

          // Enhanced neighbor ripple: scale bounce + glow flash
          scale.value = withDelay(
            delay,
            withSequence(
              withTiming(scaleAmount, { duration: 120, easing: Easing.out(Easing.quad) }),
              withTiming(1, { duration: 300, easing: Easing.inOut(Easing.quad) })
            )
          );

          // Flash glow on neighbors for more visible feedback
          glowOpacity.value = withDelay(
            delay,
            withSequence(
              withTiming(0.6 * intensity, { duration: 100 }),
              withTiming(0, { duration: 400 })
            )
          );
        }
      }
    },
    [hasRippleProps, index, numColumns]
  );

  const triggerCelebration = useCallback(() => {
    'worklet';
    // Central ripple animation - solid fill that expands and fades
    rippleScale.value = 0;
    rippleOpacity.value = 0.9;
    rippleScale.value = withTiming(4, { duration: COMPLETION_DURATION, easing: Easing.out(Easing.quad) });
    rippleOpacity.value = withTiming(0, { duration: COMPLETION_DURATION, easing: Easing.out(Easing.quad) });

    // Wave 1 - first expanding ring (starts immediately)
    wave1Scale.value = 0;
    wave1Opacity.value = 0.7;
    wave1Scale.value = withTiming(5, { duration: WAVE_DURATION, easing: Easing.out(Easing.quad) });
    wave1Opacity.value = withTiming(0, { duration: WAVE_DURATION, easing: Easing.out(Easing.quad) });

    // Wave 2 - second expanding ring (staggered)
    wave2Scale.value = 0;
    wave2Opacity.value = 0;
    wave2Scale.value = withDelay(
      WAVE_STAGGER,
      withTiming(5, { duration: WAVE_DURATION, easing: Easing.out(Easing.quad) })
    );
    wave2Opacity.value = withDelay(
      WAVE_STAGGER,
      withSequence(
        withTiming(0.5, { duration: 50 }),
        withTiming(0, { duration: WAVE_DURATION - 50, easing: Easing.out(Easing.quad) })
      )
    );

    // Wave 3 - third expanding ring (more staggered)
    wave3Scale.value = 0;
    wave3Opacity.value = 0;
    wave3Scale.value = withDelay(
      WAVE_STAGGER * 2,
      withTiming(5, { duration: WAVE_DURATION, easing: Easing.out(Easing.quad) })
    );
    wave3Opacity.value = withDelay(
      WAVE_STAGGER * 2,
      withSequence(
        withTiming(0.35, { duration: 50 }),
        withTiming(0, { duration: WAVE_DURATION - 50, easing: Easing.out(Easing.quad) })
      )
    );

    // Glow effect - bright flash that fades
    glowOpacity.value = 1;
    glowOpacity.value = withTiming(0, { duration: COMPLETION_DURATION });

    // Scale animation - pop up then return to exactly 1.0
    // Total timing ~1 second: 150ms up + ~850ms settle back
    scale.value = withSequence(
      withTiming(1.35, { duration: 150, easing: Easing.out(Easing.quad) }),
      withTiming(1.0, { duration: 850, easing: Easing.out(Easing.elastic(1)) })
    );

    // Haptic on JS thread
    runOnJS(completionHaptic)();
  }, [scale, rippleScale, rippleOpacity, glowOpacity, wave1Scale, wave1Opacity, wave2Scale, wave2Opacity, wave3Scale, wave3Opacity]);

  // Single tap handles all interactions:
  // - Completed dots: opens modal (to view notes or uncomplete)
  // - Future dots: opens modal (to add notes for upcoming days)
  // - Uncompleted dots (not future): completes the dot
  const tapGesture = Gesture.Tap().onEnd(() => {
    if (isCompleted || isFuture) {
      // Completed or future - open modal
      runOnJS(onOpenModal)();
    } else {
      // Not completed and not future - complete it
      triggerCelebration();
      runOnJS(onComplete)();
      // Trigger ripple effect to neighboring dots
      if (onTriggerRipple) {
        runOnJS(onTriggerRipple)();
      }
    }
  });

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

  // Wave ring animated styles
  const animatedWave1Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave1Scale.value }],
    opacity: wave1Opacity.value,
  }));

  const animatedWave2Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave2Scale.value }],
    opacity: wave2Opacity.value,
  }));

  const animatedWave3Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave3Scale.value }],
    opacity: wave3Opacity.value,
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
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.container, animatedDotStyle]}>
        {/* Wave rings - expanding circular waves */}
        <Animated.View
          style={[
            styles.waveRing,
            { borderColor: displayColor },
            animatedWave1Style,
          ]}
        />
        <Animated.View
          style={[
            styles.waveRing,
            { borderColor: displayColor },
            animatedWave2Style,
          ]}
        />
        <Animated.View
          style={[
            styles.waveRing,
            { borderColor: displayColor },
            animatedWave3Style,
          ]}
        />

        {/* Glow effect - bright flash on completion */}
        <Animated.View
          style={[
            styles.glow,
            { backgroundColor: displayColor },
            animatedGlowStyle,
          ]}
        />

        {/* Ripple effect - solid expanding fill */}
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
  // Wave ring - expanding circular outline
  waveRing: {
    position: 'absolute',
    width: DOT.size,
    height: DOT.size,
    borderRadius: DOT.size / 2,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
});
