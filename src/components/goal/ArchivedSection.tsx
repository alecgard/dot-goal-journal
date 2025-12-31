import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Goal } from '../../types';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../constants/theme';
import { ArchivedGoalCard } from './ArchivedGoalCard';

interface ArchivedSectionProps {
  goals: Goal[];
  onGoalPress: (goalId: string) => void;
}

export const ArchivedSection = memo(function ArchivedSection({
  goals,
  onGoalPress,
}: ArchivedSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [headerPressed, setHeaderPressed] = useState(false);

  if (goals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        onPressIn={() => setHeaderPressed(true)}
        onPressOut={() => setHeaderPressed(false)}
        style={[styles.header, headerPressed && styles.headerPressed]}
      >
        <Text style={styles.title}>Archived ({goals.length})</Text>
        <View style={styles.chevronContainer}>
          <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.list}>
          {goals.map((goal) => (
            <ArchivedGoalCard
              key={goal.id}
              goal={goal}
              onPress={() => onGoalPress(goal.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomColor: 'rgba(163, 177, 198, 0.3)',
    borderRightColor: 'rgba(163, 177, 198, 0.3)',
  },
  headerPressed: {
    borderTopColor: 'rgba(163, 177, 198, 0.3)',
    borderLeftColor: 'rgba(163, 177, 198, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ scale: 0.99 }],
  },
  title: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderTopColor: 'rgba(163, 177, 198, 0.3)',
    borderLeftColor: 'rgba(163, 177, 198, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    borderRightColor: 'rgba(255, 255, 255, 0.5)',
  },
  chevron: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    marginTop: -2,
  },
  list: {
    marginTop: SPACING.md,
  },
});
