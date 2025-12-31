import React, { useState, useCallback } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONTS } from '../../constants/theme';

interface NeumorphicInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  error?: string;
}

/**
 * NeumorphicInput - An inset text input
 *
 * Inputs in neumorphism appear "carved into" the surface
 * using inset shadows. Focus state deepens the inset.
 */
export function NeumorphicInput({
  label,
  containerStyle,
  inputStyle,
  error,
  onFocus,
  onBlur,
  ...props
}: NeumorphicInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  const shadowDistance = isFocused ? 8 : 5;
  const shadowOffset = isFocused ? 4 : 3;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapper}>
        {/* Inner shadow simulation with layered views */}
        <View
          style={[
            styles.insetContainer,
            isFocused && styles.insetContainerFocused,
            error && styles.insetContainerError,
          ]}
        >
          {/* Top-left dark shadow overlay */}
          <View style={[styles.shadowOverlay, styles.shadowDark]} />
          {/* Bottom-right light area */}
          <View style={[styles.shadowOverlay, styles.shadowLight]} />

          <TextInput
            style={[styles.input, inputStyle]}
            placeholderTextColor={COLORS.textMuted}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  insetContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    // Simulate inset shadow with border
    borderWidth: 1,
    borderTopColor: 'rgba(163, 177, 198, 0.4)',
    borderLeftColor: 'rgba(163, 177, 198, 0.4)',
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    position: 'relative',
    overflow: 'hidden',
  },
  insetContainerFocused: {
    borderTopColor: 'rgba(163, 177, 198, 0.6)',
    borderLeftColor: 'rgba(163, 177, 198, 0.6)',
    borderBottomColor: 'rgba(255, 255, 255, 1)',
    borderRightColor: 'rgba(255, 255, 255, 1)',
  },
  insetContainerError: {
    borderColor: '#EF4444',
  },
  shadowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  shadowDark: {
    // Gradient-like overlay for top-left shadow
    backgroundColor: 'transparent',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopColor: 'rgba(163, 177, 198, 0.15)',
    borderLeftColor: 'rgba(163, 177, 198, 0.15)',
    borderRadius: RADIUS.lg,
  },
  shadowLight: {
    // Light area for bottom-right
    backgroundColor: 'transparent',
  },
  input: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  errorText: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.sm,
    color: '#EF4444',
    marginTop: SPACING.xs,
  },
});
