import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UIState } from '../types';

interface UIStore extends UIState {
  // Actions
  setLastViewedScreen: (screen: UIState['lastViewedScreen']) => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      lastViewedScreen: 'home',
      isLoading: true,

      setLastViewedScreen: (screen) => {
        set({ lastViewedScreen: screen });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'dots-ui',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastViewedScreen: state.lastViewedScreen,
      }),
    }
  )
);
