import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoalStore, useUIStore } from '../src/stores';
import { Goal } from '../src/types';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../src/constants/theme';
import { GoalCard } from '../src/components/goal/GoalCard';
import { AddGoalCard } from '../src/components/goal/AddGoalCard';
import { ArchivedSection } from '../src/components/goal/ArchivedSection';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [addButtonPressed, setAddButtonPressed] = useState(false);

  const goals = useGoalStore((state) => state.goals);

  const activeGoals = useMemo(() =>
    goals.filter((g) => !g.isArchived).sort((a, b) => a.order - b.order),
    [goals]
  );
  const archivedGoals = useMemo(() =>
    goals.filter((g) => g.isArchived).sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ),
    [goals]
  );

  const hasTrackedScreen = useRef(false);

  useEffect(() => {
    if (hasTrackedScreen.current) return;
    hasTrackedScreen.current = true;
    useUIStore.getState().setLastViewedScreen('home');
  }, []);

  const handleGoalPress = useCallback((goalId: string) => {
    router.push(`/goal/${goalId}`);
  }, []);

  const handleAddGoal = useCallback(() => {
    router.push('/create');
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Goal>) => {
      return (
        <GoalCard
          goal={item}
          onPress={() => handleGoalPress(item.id)}
        />
      );
    },
    [handleGoalPress]
  );

  const ListHeader = useCallback(() => {
    if (activeGoals.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Welcome to Dots</Text>
          <Text style={styles.emptySubtitle}>
            Track your daily goals with a simple grid of dots
          </Text>
        </View>
      );
    }
    return null;
  }, [activeGoals.length]);

  const ListFooter = useCallback(() => {
    return (
      <View>
        <AddGoalCard onPress={handleAddGoal} />
        {archivedGoals.length > 0 && (
          <ArchivedSection
            goals={archivedGoals}
            onGoalPress={handleGoalPress}
          />
        )}
      </View>
    );
  }, [archivedGoals, handleAddGoal, handleGoalPress]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with plus button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dots</Text>
        <Pressable
          onPress={handleAddGoal}
          onPressIn={() => setAddButtonPressed(true)}
          onPressOut={() => setAddButtonPressed(false)}
          style={[styles.addButton, addButtonPressed && styles.addButtonPressed]}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={activeGoals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    // Extruded effect
    shadowColor: 'rgba(108, 99, 255, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonPressed: {
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    transform: [{ scale: 0.95 }],
  },
  addButtonText: {
    fontSize: FONT_SIZE.xxl,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  emptyState: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
