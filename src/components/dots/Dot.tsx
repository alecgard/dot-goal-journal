import React, { memo, useCallback } from 'react';
import { StyleSheet, Pressable } from 'react-native';
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
import { DotState } from '../../types';
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

  // Determine dot color based on state
  const dotColor = isCompleted
    ? goalColor
    : isFuture
    ? COLORS.dotFuture
    : COLORS.dotMissed;

  const handleLongPressStart = useCallback(() => {
    'worklet';
    scale.value = withSpring(0.9);
  }, [scale]);

  const handleLongPressEnd = useCallback(() => {
    'worklet';
    scale.value = withSpring(1);
  }, [scale]);

  const triggerCelebration = useCallback(() => {
    'worklet';
    // Ripple animation
    rippleScale.value = 0;
    rippleOpacity.value = 0.8;
    rippleScale.value = withTiming(2, { duration: ANIMATION.celebration });
    rippleOpacity.value = withTiming(0, { duration: ANIMATION.celebration });

    // Scale bounce
    scale.value = withSequence(
      withSpring(1.3, { damping: 4 }),
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

        {/* Main dot */}
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: dotColor },
            isToday && styles.today,
          ]}
        />
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
  today: {
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
