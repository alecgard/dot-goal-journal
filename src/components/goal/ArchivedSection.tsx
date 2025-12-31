import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Goal } from '../../types';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme';
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

  if (goals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <Text style={styles.title}>Archived ({goals.length})</Text>
        <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
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
    marginTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chevron: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
  },
  list: {
    marginTop: SPACING.sm,
  },
});
