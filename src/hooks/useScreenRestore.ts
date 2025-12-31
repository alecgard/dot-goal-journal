import { useEffect, useState, useRef } from 'react';
import { router } from 'expo-router';
import { useUIStore, useGoalStore } from '../stores';

/**
 * Hook to restore the last viewed screen on app launch
 * Call this in the root layout
 */
export function useScreenRestore() {
  const [isRestoring, setIsRestoring] = useState(true);
  const hasRestored = useRef(false);
  const lastViewedScreen = useUIStore((state) => state.lastViewedScreen);
  const isLoading = useUIStore((state) => state.isLoading);
  const goals = useGoalStore((state) => state.goals);

  useEffect(() => {
    if (isLoading || hasRestored.current) return;

    hasRestored.current = true;

    // Check if we need to restore to a goal screen
    if (lastViewedScreen.startsWith('goal:')) {
      const goalId = lastViewedScreen.replace('goal:', '');
      const goal = goals.find(g => g.id === goalId);

      // Only restore if the goal still exists and isn't archived
      if (goal && !goal.isArchived) {
        // Use setTimeout to ensure navigation happens after initial render
        setTimeout(() => {
          router.replace(`/goal/${goalId}`);
          setIsRestoring(false);
        }, 0);
        return;
      }
    }

    setIsRestoring(false);
  }, [isLoading, lastViewedScreen, goals]);

  return isRestoring;
}
