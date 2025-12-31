import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Goal } from '../../types';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../constants/theme';
import { MiniDotPreview } from './MiniDotPreview';
import { useStats } from '../../hooks/useStats';

interface GoalCardProps {
  goal: Goal;
  onPress: () => void;
  onLongPress?: () => void;
  isActive?: boolean;
}

/**
 * GoalCard - Neumorphic goal card
 *
 * Features extruded shadow effect with:
 * - Color accent bar on left
 * - Mini dot preview
 * - Stats (percentage + streak)
 */
export const GoalCard = memo(function GoalCard({
  goal,
  onPress,
  onLongPress,
  isActive,
}: GoalCardProps) {
  const { timeElapsedPercentage, daysRemaining, currentStreak } = useStats(goal);
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = useCallback(() => setIsPressed(true), []);
  const handlePressOut = useCallback(() => setIsPressed(false), []);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={200}
        style={[
          styles.container,
          isActive && styles.active,
          isPressed && styles.pressed,
        ]}
      >
        {/* Color accent indicator */}
        <View style={[styles.accentBar, { backgroundColor: COLORS.dotCompleted }]} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {goal.name}
            </Text>
            {goal.isCompleted && (
              <View style={[styles.badge, { backgroundColor: COLORS.dotCompleted }]}>
                <Text style={styles.badgeText}>Done</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={[styles.statPill, { backgroundColor: `${COLORS.textSecondary}20` }]}>
              <Text style={[styles.statValue, { color: COLORS.textSecondary }]}>
                {timeElapsedPercentage}% · {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
              </Text>
            </View>
            {currentStreak > 0 && (
              <Text style={styles.streakText}>
                {currentStreak} day streak
              </Text>
            )}
          </View>
        </View>

        {/* Pie chart on the right */}
        <View style={styles.pieChartContainer}>
          <MiniDotPreview goal={goal} />
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xxl,
    flexDirection: 'row',
    overflow: 'hidden',
    // Neumorphic shadow
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  active: {
    opacity: 0.95,
  },
  accentBar: {
    width: 6,
    borderTopLeftRadius: RADIUS.xxl,
    borderBottomLeftRadius: RADIUS.xxl,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  pieChartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  name: {
    flex: 1,
    fontFamily: FONTS.display.semiBold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontFamily: FONTS.body.bold,
    fontSize: FONT_SIZE.xs,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  statValue: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.sm,
  },
  streakText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
