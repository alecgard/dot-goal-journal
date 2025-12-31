import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Goal } from '../../types';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme';
import { MiniDotPreview } from './MiniDotPreview';
import { useStats } from '../../hooks/useStats';

interface GoalCardProps {
  goal: Goal;
  onPress: () => void;
  onLongPress?: () => void;
  isActive?: boolean;
}

export const GoalCard = memo(function GoalCard({
  goal,
  onPress,
  onLongPress,
  isActive,
}: GoalCardProps) {
  const { percentage, currentStreak } = useStats(goal);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={200}
      style={[
        styles.container,
        { borderLeftColor: goal.color },
        isActive && styles.active,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {goal.name}
        </Text>
        {goal.isCompleted && (
          <View style={[styles.badge, { backgroundColor: goal.color }]}>
            <Text style={styles.badgeText}>100%</Text>
          </View>
        )}
      </View>

      <MiniDotPreview goal={goal} />

      <View style={styles.stats}>
        <Text style={styles.statText}>{percentage}%</Text>
        {currentStreak > 0 && (
          <Text style={styles.statText}> • {currentStreak} day streak</Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
  },
  active: {
    opacity: 0.9,
    transform: [{ scale: 1.02 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.background,
  },
  stats: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  statText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
