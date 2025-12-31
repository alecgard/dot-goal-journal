import React, { memo } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme';

interface AddGoalCardProps {
  onPress: () => void;
}

export const AddGoalCard = memo(function AddGoalCard({ onPress }: AddGoalCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Text style={styles.icon}>+</Text>
      <Text style={styles.text}>Add new goal</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.surface,
    borderStyle: 'dashed',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  icon: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  text: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
});
