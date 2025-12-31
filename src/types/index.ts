import { COLORS } from '../constants/theme';

export type NeonColor = typeof COLORS.neon[keyof typeof COLORS.neon];

export interface Goal {
  id: string;
  name: string; // max 30 chars
  color: NeonColor;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string; // ISO date string YYYY-MM-DD
  notificationTime: string | null; // "HH:mm" or null
  isArchived: boolean;
  isCompleted: boolean; // 100% badge
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DayEntry {
  goalId: string;
  date: string; // "YYYY-MM-DD"
  isCompleted: boolean;
  completedAt: string | null;
  note: string;
}

export interface UIState {
  lastViewedScreen: 'home' | `goal:${string}`;
  isLoading: boolean;
}

// Duration presets in days
export const DURATION_PRESETS = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '180 days', days: 180 },
  { label: '365 days', days: 365 },
] as const;

export type DotState = 'future' | 'completed' | 'missed' | 'today';
