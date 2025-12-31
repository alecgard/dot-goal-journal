import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoalStore, useUIStore } from '../src/stores';
import { Goal } from '../src/types';
import { COLORS, SPACING, FONT_SIZE, FONTS } from '../src/constants/theme';
import { GoalCard } from '../src/components/goal/GoalCard';
import { AddGoalCard } from '../src/components/goal/AddGoalCard';
import { ArchivedSection } from '../src/components/goal/ArchivedSection';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

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
