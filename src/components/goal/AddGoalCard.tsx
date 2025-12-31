import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../constants/theme';

interface AddGoalCardProps {
  onPress: () => void;
}

/**
 * AddGoalCard - Neumorphic inset "add" button
 *
 * Uses inset shadow to appear "carved into" the surface,
 * contrasting with the extruded goal cards above it.
 */
export const AddGoalCard = memo(function AddGoalCard({ onPress }: AddGoalCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = useCallback(() => setIsPressed(true), []);
  const handlePressOut = useCallback(() => setIsPressed(false), []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        isPressed && styles.pressed,
      ]}
    >
      {/* Plus icon in a small circle */}
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>+</Text>
      </View>
      <Text style={styles.text}>Add new goal</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    // Inset shadow simulation via border
    borderWidth: 1,
    borderTopColor: 'rgba(163, 177, 198, 0.5)',
    borderLeftColor: 'rgba(163, 177, 198, 0.5)',
    borderBottomColor: 'rgba(255, 255, 255, 0.9)',
    borderRightColor: 'rgba(255, 255, 255, 0.9)',
  },
  pressed: {
    borderTopColor: 'rgba(163, 177, 198, 0.7)',
    borderLeftColor: 'rgba(163, 177, 198, 0.7)',
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: FONT_SIZE.xl,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  text: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
});
