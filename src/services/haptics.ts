import * as Haptics from 'expo-haptics';

/**
 * Strong satisfying "thunk" for completing a day
 */
export async function completionHaptic(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Light tap for general interactions
 */
export async function tapHaptic(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Success notification for major achievements
 */
export async function successHaptic(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
