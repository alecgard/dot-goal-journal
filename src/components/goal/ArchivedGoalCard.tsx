import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../../types';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../constants/theme';
import { useStats } from '../../hooks/useStats';

interface ArchivedGoalCardProps {
  goal: Goal;
  onPress: () => void;
  onDelete: (goalId: string) => void;
}

export const ArchivedGoalCard = memo(function ArchivedGoalCard({
  goal,
  onPress,
  onDelete,
}: ArchivedGoalCardProps) {
  const { percentage } = useStats(goal);
  const [isPressed, setIsPressed] = useState(false);
  const [deletePressed, setDeletePressed] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to permanently delete "${goal.name}"? This will remove all associated data and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(goal.id),
        },
      ]
    );
  };

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
      <Pressable
        onPress={handleDelete}
        onPressIn={() => setDeletePressed(true)}
        onPressOut={() => setDeletePressed(false)}
        style={[styles.deleteButton, deletePressed && styles.deleteButtonPressed]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
      </Pressable>
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
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomColor: 'rgba(163, 177, 198, 0.25)',
    borderRightColor: 'rgba(163, 177, 198, 0.25)',
  },
  deleteButtonPressed: {
    borderTopColor: 'rgba(163, 177, 198, 0.25)',
    borderLeftColor: 'rgba(163, 177, 198, 0.25)',
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    borderRightColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ scale: 0.95 }],
  },
});
