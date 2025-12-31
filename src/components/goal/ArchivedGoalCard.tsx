import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Goal } from '../../types';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme';
import { useStats } from '../../hooks/useStats';

interface ArchivedGoalCardProps {
  goal: Goal;
  onPress: () => void;
}

export const ArchivedGoalCard = memo(function ArchivedGoalCard({
  goal,
  onPress,
}: ArchivedGoalCardProps) {
  const { percentage } = useStats(goal);

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[styles.colorDot, { backgroundColor: goal.color }]} />
      <Text style={styles.name} numberOfLines={1}>
        {goal.name}
      </Text>
      <Text style={styles.percentage}>{percentage}%</Text>
      {goal.isCompleted && (
        <View style={[styles.badge, { backgroundColor: goal.color }]}>
          <Text style={styles.badgeText}>Done</Text>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  percentage: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  badge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.background,
  },
});
