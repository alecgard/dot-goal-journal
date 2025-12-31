import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { COLORS, DOT, ANIMATION } from '../../constants/theme';
import { completionHaptic } from '../../services/haptics';

interface DotProps {
  date: string;
  isCompleted: boolean;
  isToday: boolean;
  isFuture: boolean;
  goalColor: string;
  onLongPress: () => void;
  onPress: () => void;
  shouldAnimate?: boolean;
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
export const Dot = memo(function Dot({
  date,
  isCompleted,
  isToday,
  isFuture,
  goalColor,
  onLongPress,
  onPress,
  shouldAnimate,
}: DotProps) {
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

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
    // Ripple animation
    rippleScale.value = 0;
    rippleOpacity.value = 0.6;
    rippleScale.value = withTiming(2.5, { duration: ANIMATION.celebration });
    rippleOpacity.value = withTiming(0, { duration: ANIMATION.celebration });

    // Scale bounce
    scale.value = withSequence(
      withSpring(1.4, { damping: 4 }),
      withSpring(1, { damping: 10 })
    );

    // Haptic on JS thread
    runOnJS(completionHaptic)();
  }, [scale, rippleScale, rippleOpacity]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onBegin(() => {
      handleLongPressStart();
    })
    .onEnd(() => {
      handleLongPressEnd();
      if (!isFuture) {
        triggerCelebration();
        runOnJS(onLongPress)();
      }
    })
    .onFinalize(() => {
      handleLongPressEnd();
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onPress)();
  });

  const composedGesture = Gesture.Exclusive(longPressGesture, tapGesture);

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  // Determine dot appearance based on state
  const getDotStyle = () => {
    if (isCompleted) {
      return [styles.dot, styles.dotCompleted, { backgroundColor: goalColor }];
    }
    if (isFuture) {
      return [styles.dot, styles.dotFuture];
    }
    return [styles.dot, styles.dotMissed];
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedDotStyle]}>
        {/* Ripple effect */}
        <Animated.View
          style={[
            styles.ripple,
            { backgroundColor: goalColor },
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
});
