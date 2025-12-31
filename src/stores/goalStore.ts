import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, NeonColor } from '../types';
import { COLORS } from '../constants/theme';

interface GoalStore {
  goals: Goal[];

  // Actions
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'isArchived' | 'isCompleted'>) => string;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  archiveGoal: (id: string) => void;
  unarchiveGoal: (id: string) => void;
  reorderGoals: (orderedIds: string[]) => void;
  markGoalCompleted: (id: string) => void;
  deleteGoal: (id: string) => void;

  // Selectors
  getActiveGoals: () => Goal[];
  getArchivedGoals: () => Goal[];
  getGoalById: (id: string) => Goal | undefined;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goalData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const activeGoals = get().getActiveGoals();

        const newGoal: Goal = {
          ...goalData,
          id,
          isArchived: false,
          isCompleted: false,
          order: activeGoals.length,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          goals: [...state.goals, newGoal],
        }));

        return id;
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id
              ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
              : goal
          ),
        }));
      },

      archiveGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id
              ? { ...goal, isArchived: true, updatedAt: new Date().toISOString() }
              : goal
          ),
        }));
      },

      unarchiveGoal: (id) => {
        const activeGoals = get().getActiveGoals();
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id
              ? {
                  ...goal,
                  isArchived: false,
                  order: activeGoals.length,
                  updatedAt: new Date().toISOString(),
                }
              : goal
          ),
        }));
      },

      reorderGoals: (orderedIds) => {
        set((state) => ({
          goals: state.goals.map((goal) => {
            const newOrder = orderedIds.indexOf(goal.id);
            if (newOrder !== -1) {
              return { ...goal, order: newOrder };
            }
            return goal;
          }),
        }));
      },

      markGoalCompleted: (id) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id
              ? { ...goal, isCompleted: true, updatedAt: new Date().toISOString() }
              : goal
          ),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
      },

      getActiveGoals: () => {
        return get()
          .goals.filter((goal) => !goal.isArchived)
          .sort((a, b) => a.order - b.order);
      },

      getArchivedGoals: () => {
        return get()
          .goals.filter((goal) => goal.isArchived)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      getGoalById: (id) => {
        return get().goals.find((goal) => goal.id === id);
      },
    }),
    {
      name: 'dots-goals',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
