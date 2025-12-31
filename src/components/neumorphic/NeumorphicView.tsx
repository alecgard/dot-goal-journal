import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import { COLORS, RADIUS } from '../../constants/theme';

type ShadowVariant = 'extruded' | 'extrudedSmall' | 'inset' | 'insetDeep' | 'flat';

interface NeumorphicViewProps {
  children: ReactNode;
  variant?: ShadowVariant;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  radius?: number;
  disabled?: boolean;
}

/**
 * NeumorphicView - A container with dual opposing shadows
 *
 * Neumorphism requires TWO shadows:
 * 1. Light shadow (top-left) - simulates light source
 * 2. Dark shadow (bottom-right) - creates depth
 *
 * This component layers two Shadow components to achieve the effect.
 */
export function NeumorphicView({
  children,
  variant = 'extruded',
  style,
  containerStyle,
  radius = RADIUS.xxl,
  disabled = false,
}: NeumorphicViewProps) {
  if (variant === 'flat' || disabled) {
    return (
      <View style={[styles.base, { borderRadius: radius }, containerStyle]}>
        <View style={[styles.inner, { borderRadius: radius }, style]}>
          {children}
        </View>
      </View>
    );
  }

  const shadowConfig = getShadowConfig(variant);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Dark shadow (bottom-right) */}
      <Shadow
        distance={shadowConfig.distance}
        startColor={shadowConfig.darkColor}
        offset={shadowConfig.darkOffset}
        style={{ borderRadius: radius }}
      >
        {/* Light shadow (top-left) */}
        <Shadow
          distance={shadowConfig.distance}
          startColor={shadowConfig.lightColor}
          offset={shadowConfig.lightOffset}
          style={{ borderRadius: radius }}
        >
          <View style={[styles.inner, { borderRadius: radius }, style]}>
            {children}
          </View>
        </Shadow>
      </Shadow>
    </View>
  );
}

function getShadowConfig(variant: ShadowVariant) {
  switch (variant) {
    case 'extruded':
      return {
        distance: 9,
        darkColor: COLORS.shadowDark,
        lightColor: COLORS.shadowLight,
        darkOffset: [9, 9] as [number, number],
        lightOffset: [-9, -9] as [number, number],
      };
    case 'extrudedSmall':
      return {
        distance: 5,
        darkColor: COLORS.shadowDark,
        lightColor: COLORS.shadowLight,
        darkOffset: [5, 5] as [number, number],
        lightOffset: [-5, -5] as [number, number],
      };
    case 'inset':
      return {
        distance: 6,
        darkColor: COLORS.shadowDark,
        lightColor: COLORS.shadowLight,
        darkOffset: [3, 3] as [number, number],
        lightOffset: [-3, -3] as [number, number],
      };
    case 'insetDeep':
      return {
        distance: 10,
        darkColor: COLORS.shadowDarkStrong,
        lightColor: COLORS.shadowLightStrong,
        darkOffset: [5, 5] as [number, number],
        lightOffset: [-5, -5] as [number, number],
      };
    default:
      return {
        distance: 9,
        darkColor: COLORS.shadowDark,
        lightColor: COLORS.shadowLight,
        darkOffset: [9, 9] as [number, number],
        lightOffset: [-9, -9] as [number, number],
      };
  }
}

const styles = StyleSheet.create({
  wrapper: {
    // Wrapper needs no background to let shadows show
  },
  base: {
    backgroundColor: COLORS.background,
  },
  inner: {
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
});
