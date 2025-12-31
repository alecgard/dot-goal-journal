import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGoalStore } from '../../../src/stores';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../../src/constants/theme';

export default function RemindersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const goals = useGoalStore((state) => state.goals);
  const goal = useMemo(() => goals.find(g => g.id === id), [goals, id]);

  const [notificationTime, setNotificationTime] = useState<Date | null>(
    goal?.notificationTime
      ? new Date(`2000-01-01T${goal.notificationTime}:00`)
      : null
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [cancelPressed, setCancelPressed] = useState(false);
  const [savePressed, setSavePressed] = useState(false);

  // Track changes
  useEffect(() => {
    if (!goal) return;
    const currentTime = notificationTime
      ? `${notificationTime.getHours().toString().padStart(2, '0')}:${notificationTime.getMinutes().toString().padStart(2, '0')}`
      : null;
    const changed = currentTime !== goal.notificationTime;
    setHasChanges(changed);
  }, [notificationTime, goal]);

  const handleSave = useCallback(() => {
    if (!goal || !hasChanges) return;

    useGoalStore.getState().updateGoal(goal.id, {
      notificationTime: notificationTime
        ? `${notificationTime.getHours().toString().padStart(2, '0')}:${notificationTime.getMinutes().toString().padStart(2, '0')}`
        : null,
    });

    router.back();
  }, [goal, hasChanges, notificationTime]);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const handleRemoveNotification = useCallback(() => {
    setNotificationTime(null);
  }, []);

  if (!goal) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleCancel}
          onPressIn={() => setCancelPressed(true)}
          onPressOut={() => setCancelPressed(false)}
          style={[styles.headerButton, cancelPressed && styles.headerButtonPressed]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Reminders</Text>
        <Pressable
          onPress={handleSave}
          onPressIn={() => setSavePressed(true)}
          onPressOut={() => setSavePressed(false)}
          disabled={!hasChanges}
          style={[
            styles.saveButton,
            savePressed && styles.saveButtonPressed,
            !hasChanges && styles.saveButtonDisabled,
          ]}
        >
          <Text style={[styles.saveText, !hasChanges && styles.disabled]}>
            Save
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Notification Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Daily Reminder</Text>
          {notificationTime ? (
            <View style={styles.notificationRow}>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={[styles.dateButton, styles.flex1]}
              >
                <Text style={styles.dateText}>
                  {notificationTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleRemoveNotification}
                style={styles.removeButton}
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setNotificationTime(new Date());
                setShowTimePicker(true);
              }}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Add reminder</Text>
            </Pressable>
          )}
          {showTimePicker && notificationTime && (
            <DateTimePicker
              value={notificationTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (date) setNotificationTime(date);
              }}
              themeVariant="light"
            />
          )}
        </View>

        <Text style={styles.hint}>
          Set a daily reminder to help you stay on track with your goal.
        </Text>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomColor: 'rgba(163, 177, 198, 0.3)',
    borderRightColor: 'rgba(163, 177, 198, 0.3)',
  },
  headerButtonPressed: {
    borderTopColor: 'rgba(163, 177, 198, 0.3)',
    borderLeftColor: 'rgba(163, 177, 198, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ scale: 0.98 }],
  },
  cancelText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  title: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  saveButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    shadowColor: 'rgba(108, 99, 255, 0.4)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonPressed: {
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    transform: [{ scale: 0.98 }],
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.background,
    shadowColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(163, 177, 198, 0.3)',
  },
  saveText: {
    fontFamily: FONTS.body.bold,
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
  },
  disabled: {
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notificationRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  flex1: {
    flex: 1,
  },
  dateButton: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomColor: 'rgba(163, 177, 198, 0.4)',
    borderRightColor: 'rgba(163, 177, 198, 0.4)',
  },
  dateText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  removeButton: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomColor: 'rgba(163, 177, 198, 0.3)',
    borderRightColor: 'rgba(163, 177, 198, 0.3)',
  },
  removeText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  addButton: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderTopColor: 'rgba(163, 177, 198, 0.4)',
    borderLeftColor: 'rgba(163, 177, 198, 0.4)',
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
  },
  addButtonText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  hint: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
