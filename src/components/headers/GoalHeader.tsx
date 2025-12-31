import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Goal } from '../../types';
import { useStats } from '../../hooks/useStats';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme';

interface GoalHeaderProps {
  goal: Goal;
}

export const GoalHeader = memo(function GoalHeader({ goal }: GoalHeaderProps) {
  const { percentage, currentStreak } = useStats(goal);

  const handleBack = () => {
    router.back();
  };

  const handleSettings = () => {
    router.push(`/goal/${goal.id}/settings`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>

        <Pressable onPress={handleSettings} style={styles.settingsButton}>
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {goal.name}
        </Text>

        <View style={styles.stats}>
          <Text style={[styles.percentage, { color: goal.color }]}>
            {percentage}%
          </Text>
          {currentStreak > 0 && (
            <Text style={styles.streak}>
              {' '}
              • {currentStreak} day{currentStreak !== 1 ? 's' : ''} streak
            </Text>
          )}
        </View>

        {goal.isCompleted && (
          <View style={[styles.badge, { backgroundColor: goal.color }]}>
            <Text style={styles.badgeText}>Completed!</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    paddingBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backText: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '300',
  },
  settingsButton: {
    padding: SPACING.sm,
  },
  settingsText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  content: {
    paddingHorizontal: SPACING.md,
  },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentage: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  streak: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.background,
  },
});
