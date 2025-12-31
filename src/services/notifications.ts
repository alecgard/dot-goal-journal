import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Goal } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // Per spec: no sound
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Schedule a daily notification for a goal
 */
export async function scheduleGoalNotification(
  goal: Goal
): Promise<string | null> {
  if (!goal.notificationTime) return null;

  const [hours, minutes] = goal.notificationTime.split(':').map(Number);

  // Cancel any existing notification for this goal
  await cancelGoalNotification(goal.id);

  // Schedule new daily notification
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Reminder',
      body: `Don't forget to complete: ${goal.name}`,
      data: { goalId: goal.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });

  return identifier;
}

/**
 * Cancel notification for a goal
 */
export async function cancelGoalNotification(goalId: string): Promise<void> {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduledNotifications) {
    if (notification.content.data?.goalId === goalId) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}
