import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Goal } from '../../types';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../constants/theme';
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
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[styles.container, isPressed && styles.containerPressed]}
    >
      <View style={[styles.colorDot, { backgroundColor: COLORS.dotCompleted }]} />
      <Text style={styles.name} numberOfLines={1}>
        {goal.name}
      </Text>
      <View style={[styles.percentagePill, { backgroundColor: `${COLORS.dotCompleted}15` }]}>
        <Text style={[styles.percentage, { color: COLORS.dotCompleted }]}>{percentage}%</Text>
      </View>
      {goal.isCompleted && (
        <View style={[styles.badge, { backgroundColor: COLORS.dotCompleted }]}>
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
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomColor: 'rgba(163, 177, 198, 0.25)',
    borderRightColor: 'rgba(163, 177, 198, 0.25)',
  },
  containerPressed: {
    borderTopColor: 'rgba(163, 177, 198, 0.25)',
    borderLeftColor: 'rgba(163, 177, 198, 0.25)',
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    borderRightColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ scale: 0.99 }],
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  name: {
    flex: 1,
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  percentagePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  percentage: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.sm,
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
});
