import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { ANIMATION } from '../../constants/theme';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

interface ConfettiBurstProps {
  visible: boolean;
  color: string;
  onComplete?: () => void;
}

const PARTICLE_COUNT = 12;
const PARTICLE_SIZE = 8;

function generateParticles(color: string): Particle[] {
  const particles: Particle[] = [];
  const colors = [color, '#FFFFFF', color, '#FFD700'];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * 2 * Math.PI;
    const distance = 40 + Math.random() * 30;
    particles.push({
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      color: colors[i % colors.length],
      delay: Math.random() * 100,
    });
  }

  return particles;
}

const ParticleView = ({
  particle,
  visible,
}: {
  particle: Particle;
  visible: boolean;
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withDelay(particle.delay, withTiming(1, { duration: 100 }));
      scale.value = withDelay(
        particle.delay,
        withTiming(1, { duration: 200, easing: Easing.out(Easing.back(2)) })
      );
      translateX.value = withDelay(
        particle.delay,
        withTiming(particle.x, { duration: ANIMATION.celebration })
      );
      translateY.value = withDelay(
        particle.delay,
        withTiming(particle.y, { duration: ANIMATION.celebration })
      );
      opacity.value = withDelay(
        particle.delay + ANIMATION.celebration * 0.6,
        withTiming(0, { duration: ANIMATION.celebration * 0.4 })
      );
    } else {
      opacity.value = 0;
      scale.value = 0;
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [visible, particle]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: particle.color },
        animatedStyle,
      ]}
    />
  );
};

export const ConfettiBurst = ({
  visible,
  color,
  onComplete,
}: ConfettiBurstProps) => {
  const particles = React.useMemo(() => generateParticles(color), [color]);

  useEffect(() => {
    if (visible && onComplete) {
      const timer = setTimeout(onComplete, ANIMATION.celebration + 200);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ParticleView key={particle.id} particle={particle} visible={visible} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: PARTICLE_SIZE / 2,
  },
});
