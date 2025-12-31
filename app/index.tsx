import React, { useCallback, useEffect, useRef, useMemo } from 'react';
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
import { COLORS, SPACING, FONT_SIZE } from '../src/constants/theme';
import { GoalCard } from '../src/components/goal/GoalCard';
import { AddGoalCard } from '../src/components/goal/AddGoalCard';
import { ArchivedSection } from '../src/components/goal/ArchivedSection';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Use stable selector - just get the goals array
  const goals = useGoalStore((state) => state.goals);

  // Derive active/archived from goals array using useMemo
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

  // Track last viewed screen (run once)
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
        <View style={styles.headerSpacer} />
        <Pressable onPress={handleAddGoal} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={activeGoals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '300',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
});
