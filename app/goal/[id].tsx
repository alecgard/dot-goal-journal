import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { useGoalStore, useDayStore, useUIStore } from '../../src/stores';
import { COLORS } from '../../src/constants/theme';
import { GoalHeader } from '../../src/components/headers/GoalHeader';
import { DotGrid } from '../../src/components/dots/DotGrid';
import { WeeklyDotGrid } from '../../src/components/dots/WeeklyDotGrid';
import { DayDetailModal } from '../../src/components/modals/DayDetailModal';
import { StatsModal } from '../../src/components/modals/StatsModal';
import { isFuture } from '../../src/utils/dates';
import { isGoalFullyCompleted } from '../../src/utils/streak';

type ZoomLevel = 'day' | 'week';

// Pinch scale thresholds - more sensitive for easier transitions
// 0 = day view, 1 = week view
const PINCH_SNAP_THRESHOLD = 0.5; // Snap at midpoint
const PINCH_SENSITIVITY = 1.5; // Multiplier for how much pinch affects progress (higher = more sensitive)

export default function GoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Use stable selectors that don't cause infinite loops
  const goals = useGoalStore((state) => state.goals);
  const goal = useMemo(() => goals.find(g => g.id === id), [goals, id]);
  const days = useDayStore((state) => state.days);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
  const hasTrackedScreen = useRef(false);
  const hasCheckedCompletion = useRef(false);

  // Animation value for smooth pinch transition (0 = day view, 1 = week view)
  const zoomProgress = useSharedValue(0);
  // Track if we're currently pinching
  const isPinching = useSharedValue(false);
  // Base scale when pinch started
  const pinchStartScale = useSharedValue(1);

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

  // Update zoom level state when animation completes
  const updateZoomLevel = useCallback((newLevel: ZoomLevel) => {
    setZoomLevel(newLevel);
  }, []);

  // Switch to week view with animation
  const switchToWeekView = useCallback(() => {
    if (zoomLevel === 'week') return;
    zoomProgress.value = withSpring(1, { damping: 20, stiffness: 200 });
    setZoomLevel('week');
  }, [zoomLevel, zoomProgress]);

  // Switch to day view with animation
  const switchToDayView = useCallback(() => {
    if (zoomLevel === 'day') return;
    zoomProgress.value = withSpring(0, { damping: 20, stiffness: 200 });
    setZoomLevel('day');
  }, [zoomLevel, zoomProgress]);

  // Toggle between day and week view with spring animation
  const toggleZoom = useCallback(() => {
    if (zoomLevel === 'day') {
      zoomProgress.value = withSpring(1, { damping: 20, stiffness: 200 });
      setZoomLevel('week');
    } else {
      zoomProgress.value = withSpring(0, { damping: 20, stiffness: 200 });
      setZoomLevel('day');
    }
  }, [zoomLevel, zoomProgress]);

  // Pinch gesture handler with live animation
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      isPinching.value = true;
      pinchStartScale.value = 1;
    })
    .onUpdate((event) => {
      // Convert pinch scale to zoom progress
      // Pinching in (scale < 1) = towards week view (progress -> 1)
      // Pinching out (scale > 1) = towards day view (progress -> 0)
      const currentZoom = zoomProgress.value;
      const scaleDelta = event.scale - pinchStartScale.value;

      // Invert: pinch in (negative delta) increases progress (to week)
      // Use PINCH_SENSITIVITY to make smaller pinch movements create larger progress changes
      const newProgress = Math.max(0, Math.min(1, currentZoom - scaleDelta * PINCH_SENSITIVITY));
      zoomProgress.value = newProgress;

      // Update the start scale to track incremental changes
      pinchStartScale.value = event.scale;
    })
    .onEnd(() => {
      isPinching.value = false;

      // Snap to the nearest view based on current progress
      if (zoomProgress.value >= PINCH_SNAP_THRESHOLD) {
        // Snap to week view
        zoomProgress.value = withSpring(1, { damping: 20, stiffness: 200 });
        runOnJS(updateZoomLevel)('week');
      } else {
        // Snap to day view
        zoomProgress.value = withSpring(0, { damping: 20, stiffness: 200 });
        runOnJS(updateZoomLevel)('day');
      }
    });

  // Opens the modal for notes, viewing/uncompleting, etc.
  const handleDotOpenModal = useCallback((date: string) => {
    setSelectedDate(date);
    setModalVisible(true);
  }, []);

  // Single tap completes a dot (only if not already complete and not future)
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

  const handleStatsPress = useCallback(() => {
    setStatsModalVisible(true);
  }, []);

  const handleCloseStatsModal = useCallback(() => {
    setStatsModalVisible(false);
  }, []);

  // Handle week dot press - switch to day view
  const handleWeekPress = useCallback((weekStartDate: string) => {
    // Switch to day view when tapping a week
    switchToDayView();
  }, [switchToDayView]);

  // Animated styles for transitions based on zoomProgress (0 = day, 1 = week)
  const dayViewAnimatedStyle = useAnimatedStyle(() => {
    // Day view: visible at progress 0, fades out as progress increases
    const opacity = interpolate(zoomProgress.value, [0, 0.5, 1], [1, 0.3, 0]);
    const scale = interpolate(zoomProgress.value, [0, 1], [1, 0.85]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const weekViewAnimatedStyle = useAnimatedStyle(() => {
    // Week view: invisible at progress 0, fades in as progress increases
    const opacity = interpolate(zoomProgress.value, [0, 0.5, 1], [0, 0.3, 1]);
    const scale = interpolate(zoomProgress.value, [0, 1], [1.15, 1]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Redirect if goal doesn't exist
  if (!goal) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <GoalHeader goal={goal} zoomLevel={zoomLevel} onToggleZoom={toggleZoom} onStatsPress={handleStatsPress} />

      <GestureDetector gesture={pinchGesture}>
        <View style={styles.gridContainer}>
          {/* Both views are always rendered for smooth crossfade during pinch */}
          <Animated.View style={[styles.gridWrapper, styles.gridAbsolute, dayViewAnimatedStyle]} pointerEvents={zoomLevel === 'day' ? 'auto' : 'none'}>
            <DotGrid
              goal={goal}
              onDotOpenModal={handleDotOpenModal}
              onDotComplete={handleDotComplete}
            />
          </Animated.View>
          <Animated.View style={[styles.gridWrapper, styles.gridAbsolute, weekViewAnimatedStyle]} pointerEvents={zoomLevel === 'week' ? 'auto' : 'none'}>
            <WeeklyDotGrid
              goal={goal}
              onWeekPress={handleWeekPress}
            />
          </Animated.View>
        </View>
      </GestureDetector>

      <DayDetailModal
        visible={modalVisible}
        date={selectedDate}
        goal={goal}
        onClose={handleCloseModal}
      />

      <StatsModal
        visible={statsModalVisible}
        goal={goal}
        onClose={handleCloseStatsModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gridContainer: {
    flex: 1,
  },
  gridWrapper: {
    flex: 1,
  },
  gridAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
