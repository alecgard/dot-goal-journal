import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Shadow } from 'react-native-shadow-2';
import { Goal } from '../../types';
import { useStats } from '../../hooks/useStats';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../constants/theme';

interface GoalHeaderProps {
  goal: Goal;
}

/**
 * GoalHeader - Neumorphic header for goal detail view
 *
 * Features extruded button elements for back/settings
 * and displays goal stats with accent colors.
 */
export const GoalHeader = memo(function GoalHeader({ goal }: GoalHeaderProps) {
  const { percentage, currentStreak } = useStats(goal);
  const [backPressed, setBackPressed] = useState(false);
  const [settingsPressed, setSettingsPressed] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSettings = useCallback(() => {
    router.push(`/goal/${goal.id}/settings`);
  }, [goal.id]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Back button */}
        <Pressable
          onPress={handleBack}
          onPressIn={() => setBackPressed(true)}
          onPressOut={() => setBackPressed(false)}
          style={[styles.iconButton, backPressed && styles.iconButtonPressed]}
        >
          <Text style={styles.backIcon}>{'<'}</Text>
        </Pressable>

        {/* Settings button */}
        <Pressable
          onPress={handleSettings}
          onPressIn={() => setSettingsPressed(true)}
          onPressOut={() => setSettingsPressed(false)}
          style={[styles.textButton, settingsPressed && styles.textButtonPressed]}
        >
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {goal.name}
        </Text>

        <View style={styles.stats}>
          <View style={[styles.statPill, { backgroundColor: `${goal.color}20` }]}>
            <Text style={[styles.percentage, { color: goal.color }]}>
              {percentage}%
            </Text>
          </View>
          {currentStreak > 0 && (
            <Text style={styles.streak}>
              {currentStreak} day{currentStreak !== 1 ? 's' : ''} streak
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
    paddingBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    // Extruded effect
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomColor: 'rgba(163, 177, 198, 0.4)',
    borderRightColor: 'rgba(163, 177, 198, 0.4)',
  },
  iconButtonPressed: {
    borderTopColor: 'rgba(163, 177, 198, 0.4)',
    borderLeftColor: 'rgba(163, 177, 198, 0.4)',
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ scale: 0.95 }],
  },
  backIcon: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
  },
  textButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    // Subtle extruded effect
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomColor: 'rgba(163, 177, 198, 0.3)',
    borderRightColor: 'rgba(163, 177, 198, 0.3)',
  },
  textButtonPressed: {
    borderTopColor: 'rgba(163, 177, 198, 0.3)',
    borderLeftColor: 'rgba(163, 177, 198, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ scale: 0.98 }],
  },
  settingsText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  name: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  percentage: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.md,
  },
  streak: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontFamily: FONTS.body.bold,
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
