import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayEntry } from '../types';

interface DayStore {
  days: Record<string, DayEntry>; // key: `${goalId}_${date}`

  // Actions
  toggleCompletion: (goalId: string, date: string) => boolean; // returns new completion state
  updateNote: (goalId: string, date: string, note: string) => void;
  getDayEntry: (goalId: string, date: string) => DayEntry | undefined;
  getDaysForGoal: (goalId: string) => DayEntry[];
  clearGoalDays: (goalId: string) => void;
}

function createKey(goalId: string, date: string): string {
  return `${goalId}_${date}`;
}

function createEmptyEntry(goalId: string, date: string): DayEntry {
  return {
    goalId,
    date,
    isCompleted: false,
    completedAt: null,
    note: '',
  };
}

export const useDayStore = create<DayStore>()(
  persist(
    (set, get) => ({
      days: {},

      toggleCompletion: (goalId, date) => {
        const key = createKey(goalId, date);
        const existing = get().days[key];
        const wasCompleted = existing?.isCompleted ?? false;
        const newCompleted = !wasCompleted;

        set((state) => ({
          days: {
            ...state.days,
            [key]: {
              ...(existing || createEmptyEntry(goalId, date)),
              isCompleted: newCompleted,
              completedAt: newCompleted ? new Date().toISOString() : null,
            },
          },
        }));

        return newCompleted;
      },

      updateNote: (goalId, date, note) => {
        const key = createKey(goalId, date);
        const existing = get().days[key];

        set((state) => ({
          days: {
            ...state.days,
            [key]: {
              ...(existing || createEmptyEntry(goalId, date)),
              note,
            },
          },
        }));
      },

      getDayEntry: (goalId, date) => {
        const key = createKey(goalId, date);
        return get().days[key];
      },

      getDaysForGoal: (goalId) => {
        return Object.values(get().days).filter(
          (entry) => entry.goalId === goalId
        );
      },

      clearGoalDays: (goalId) => {
        set((state) => {
          const newDays = { ...state.days };
          Object.keys(newDays).forEach((key) => {
            if (key.startsWith(`${goalId}_`)) {
              delete newDays[key];
            }
          });
          return { days: newDays };
        });
      },
    }),
    {
      name: 'dots-days',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
