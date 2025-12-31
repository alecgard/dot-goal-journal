import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoalStore, useDayStore, useUIStore } from '../../src/stores';
import { COLORS } from '../../src/constants/theme';
import { GoalHeader } from '../../src/components/headers/GoalHeader';
import { DotGrid } from '../../src/components/dots/DotGrid';
import { DayDetailModal } from '../../src/components/modals/DayDetailModal';
import { isFuture } from '../../src/utils/dates';
import { isGoalFullyCompleted } from '../../src/utils/streak';

export default function GoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Use stable selectors that don't cause infinite loops
  const goals = useGoalStore((state) => state.goals);
  const goal = useMemo(() => goals.find(g => g.id === id), [goals, id]);
  const days = useDayStore((state) => state.days);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const hasTrackedScreen = useRef(false);
  const hasCheckedCompletion = useRef(false);

  // Track last viewed screen (run once per goal)
  useEffect(() => {
    if (id && !hasTrackedScreen.current) {
      hasTrackedScreen.current = true;
      useUIStore.getState().setLastViewedScreen(`goal:${id}`);
    }
  }, [id]);

  // Check if goal is fully completed (run once when data is loaded)
  useEffect(() => {
    if (goal && !goal.isCompleted && !hasCheckedCompletion.current) {
      const isFullyComplete = isGoalFullyCompleted(
        days,
        goal.id,
        goal.startDate,
        goal.endDate
      );
      if (isFullyComplete) {
        hasCheckedCompletion.current = true;
        useGoalStore.getState().markGoalCompleted(goal.id);
      }
    }
  }, [goal, days]);

  // Long press opens the modal for notes, uncompleting, etc.
  const handleDotLongPress = useCallback((date: string) => {
    setSelectedDate(date);
    setModalVisible(true);
  }, []);

  // Single tap completes a dot (only if not already complete)
  const handleDotComplete = useCallback(
    (date: string) => {
      if (!goal || isFuture(date)) return;
      // Only complete, never uncomplete via tap (must use modal to uncomplete)
      const key = `${goal.id}_${date}`;
      const entry = days[key];
      if (!entry?.isCompleted) {
        useDayStore.getState().toggleCompletion(goal.id, date);
      }
    },
    [goal, days]
  );

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedDate(null);
  }, []);

  // Redirect if goal doesn't exist
  if (!goal) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <GoalHeader goal={goal} />

      <DotGrid
        goal={goal}
        onDotLongPress={handleDotLongPress}
        onDotComplete={handleDotComplete}
      />

      <DayDetailModal
        visible={modalVisible}
        date={selectedDate}
        goal={goal}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
