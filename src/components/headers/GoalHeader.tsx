import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { Shadow } from 'react-native-shadow-2';
import { Goal } from '../../types';
import { useStats } from '../../hooks/useStats';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../constants/theme';

type ZoomLevel = 'day' | 'week';

interface GoalHeaderProps {
  goal: Goal;
  /** Current zoom level (day or week) */
  zoomLevel?: ZoomLevel;
  /** Callback to toggle between day and week view */
  onToggleZoom?: () => void;
  /** Callback when stats pill is pressed */
  onStatsPress?: () => void;
}

/**
 * GoalHeader - Neumorphic header for goal detail view
 *
 * Features extruded button elements for back/settings
 * and displays goal stats with accent colors.
 */
export const GoalHeader = memo(function GoalHeader({ goal, zoomLevel, onToggleZoom, onStatsPress }: GoalHeaderProps) {
  const { timeElapsedPercentage, daysRemaining, currentStreak } = useStats(goal);
  const [backPressed, setBackPressed] = useState(false);
  const [remindersPressed, setRemindersPressed] = useState(false);
  const [settingsPressed, setSettingsPressed] = useState(false);
  const [zoomPressed, setZoomPressed] = useState(false);
  const [statsPressed, setStatsPressed] = useState(false);

  const handleBack = useCallback(() => {
    router.replace('/');
  }, []);

  const handleReminders = useCallback(() => {
    router.push(`/goal/${goal.id}/reminders`);
  }, [goal.id]);

  const handleSettings = useCallback(() => {
    router.push(`/goal/${goal.id}/settings`);
  }, [goal.id]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Home button */}
        <Pressable
          onPress={handleBack}
          onPressIn={() => setBackPressed(true)}
          onPressOut={() => setBackPressed(false)}
          style={[styles.iconButton, backPressed && styles.iconButtonPressed]}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
              stroke={COLORS.textPrimary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        <View style={styles.rightButtons}>
          {/* Reminders button */}
          <Pressable
            onPress={handleReminders}
            onPressIn={() => setRemindersPressed(true)}
            onPressOut={() => setRemindersPressed(false)}
            style={[styles.iconButton, remindersPressed && styles.iconButtonPressed]}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                stroke={COLORS.textPrimary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          {/* Edit button */}
          <Pressable
            onPress={handleSettings}
            onPressIn={() => setSettingsPressed(true)}
            onPressOut={() => setSettingsPressed(false)}
            style={[styles.iconButton, settingsPressed && styles.iconButtonPressed]}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                stroke={COLORS.textPrimary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {goal.name}
          </Text>
          {zoomLevel && onToggleZoom && (
            <Pressable
              onPress={onToggleZoom}
              onPressIn={() => setZoomPressed(true)}
              onPressOut={() => setZoomPressed(false)}
              style={[styles.zoomPill, zoomPressed && styles.zoomPillPressed]}
            >
              <Text style={styles.zoomText}>
                {zoomLevel === 'day' ? 'Day' : 'Week'}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.stats}>
          <Pressable
            onPress={onStatsPress}
            onPressIn={() => setStatsPressed(true)}
            onPressOut={() => setStatsPressed(false)}
            style={[
              styles.statPill,
              { backgroundColor: `${COLORS.textSecondary}20` },
              statsPressed && styles.statPillPressed,
            ]}
          >
            <Text style={[styles.percentage, { color: COLORS.textSecondary }]}>
              {timeElapsedPercentage}% · {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
            </Text>
          </Pressable>
          {currentStreak > 0 && (
            <Text style={styles.streak}>
              {currentStreak} day{currentStreak !== 1 ? 's' : ''} streak
            </Text>
          )}
        </View>

        {goal.isCompleted && (
          <View style={[styles.badge, { backgroundColor: COLORS.dotCompleted }]}>
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
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  name: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
  },
  zoomPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.sm,
    // Subtle neumorphic extruded effect
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomColor: 'rgba(163, 177, 198, 0.4)',
    borderRightColor: 'rgba(163, 177, 198, 0.4)',
  },
  zoomPillPressed: {
    borderTopColor: 'rgba(163, 177, 198, 0.4)',
    borderLeftColor: 'rgba(163, 177, 198, 0.4)',
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ scale: 0.95 }],
  },
  zoomText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
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
  statPillPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
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
