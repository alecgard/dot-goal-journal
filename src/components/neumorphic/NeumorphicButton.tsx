import React, { ReactNode, useState, useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONTS } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface NeumorphicButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: ReactNode;
}

/**
 * NeumorphicButton - A pressable button with neumorphic depth
 *
 * States:
 * - Default: Extruded (raised from surface)
 * - Pressed: Flattens/slightly inset with reduced shadow
 * - Disabled: No shadow, muted colors
 */
export function NeumorphicButton({
  children,
  onPress,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  icon,
}: NeumorphicButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = useCallback(() => setIsPressed(true), []);
  const handlePressOut = useCallback(() => setIsPressed(false), []);

  const sizeStyles = getSizeStyles(size);
  const variantStyles = getVariantStyles(variant, disabled);

  if (disabled) {
    return (
      <View style={[styles.base, sizeStyles.container, variantStyles.container, style]}>
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, sizeStyles.text, variantStyles.text, textStyle]}>
            {children}
          </Text>
        </View>
      </View>
    );
  }

  const shadowDistance = isPressed ? 3 : 6;
  const shadowOffset = isPressed ? 2 : 5;

  return (
    <Shadow
      distance={shadowDistance}
      startColor={COLORS.shadowDark}
      offset={[shadowOffset, shadowOffset]}
      style={{ borderRadius: RADIUS.lg }}
    >
      <Shadow
        distance={shadowDistance}
        startColor={COLORS.shadowLight}
        offset={[-shadowOffset, -shadowOffset]}
        style={{ borderRadius: RADIUS.lg }}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.base,
            sizeStyles.container,
            variantStyles.container,
            isPressed && styles.pressed,
            style,
          ]}
        >
          <View style={styles.content}>
            {icon && <View style={styles.iconWrapper}>{icon}</View>}
            <Text style={[styles.text, sizeStyles.text, variantStyles.text, textStyle]}>
              {children}
            </Text>
          </View>
        </Pressable>
      </Shadow>
    </Shadow>
  );
}

function getSizeStyles(size: ButtonSize) {
  switch (size) {
    case 'sm':
      return {
        container: {
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.md,
          minHeight: 36,
        },
        text: {
          fontSize: FONT_SIZE.sm,
        },
      };
    case 'lg':
      return {
        container: {
          paddingVertical: SPACING.md,
          paddingHorizontal: SPACING.xl,
          minHeight: 56,
        },
        text: {
          fontSize: FONT_SIZE.lg,
        },
      };
    default: // md
      return {
        container: {
          paddingVertical: SPACING.sm + 2,
          paddingHorizontal: SPACING.lg,
          minHeight: 48,
        },
        text: {
          fontSize: FONT_SIZE.md,
        },
      };
  }
}

function getVariantStyles(variant: ButtonVariant, disabled: boolean) {
  if (disabled) {
    return {
      container: {
        backgroundColor: COLORS.background,
        opacity: 0.5,
      },
      text: {
        color: COLORS.textMuted,
      },
    };
  }

  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: COLORS.accent,
        },
        text: {
          color: '#FFFFFF',
        },
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
        },
        text: {
          color: COLORS.textSecondary,
        },
      };
    default: // secondary
      return {
        container: {
          backgroundColor: COLORS.background,
        },
        text: {
          color: COLORS.textPrimary,
        },
      };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: SPACING.sm,
  },
  text: {
    fontFamily: FONTS.body.medium,
    fontWeight: '500',
  },
});
