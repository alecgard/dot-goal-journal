import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGoalStore } from '../../../src/stores';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS, NEON_COLORS } from '../../../src/constants/theme';
import { NeonColor } from '../../../src/types';
import { toDateString, fromDateString } from '../../../src/utils/dates';

export default function GoalSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Use stable selector - derive goal from goals array
  const goals = useGoalStore((state) => state.goals);
  const goal = useMemo(() => goals.find(g => g.id === id), [goals, id]);

  const [name, setName] = useState(goal?.name || '');
  const [color, setColor] = useState<NeonColor>(goal?.color || COLORS.neon.violet);
  const [startDate, setStartDate] = useState(
    goal ? fromDateString(goal.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState(
    goal ? fromDateString(goal.endDate) : new Date()
  );
  const [notificationTime, setNotificationTime] = useState<Date | null>(
    goal?.notificationTime
      ? new Date(`2000-01-01T${goal.notificationTime}:00`)
      : null
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [cancelPressed, setCancelPressed] = useState(false);
  const [savePressed, setSavePressed] = useState(false);

  // Track changes
  useEffect(() => {
    if (!goal) return;
    const changed =
      name !== goal.name ||
      color !== goal.color ||
      toDateString(startDate) !== goal.startDate ||
      toDateString(endDate) !== goal.endDate ||
      (notificationTime
        ? `${notificationTime.getHours().toString().padStart(2, '0')}:${notificationTime.getMinutes().toString().padStart(2, '0')}`
        : null) !== goal.notificationTime;
    setHasChanges(changed);
  }, [name, color, startDate, endDate, notificationTime, goal]);

  const handleSave = useCallback(() => {
    if (!goal || !hasChanges) return;

    useGoalStore.getState().updateGoal(goal.id, {
      name: name.trim(),
      color,
      startDate: toDateString(startDate),
      endDate: toDateString(endDate),
      notificationTime: notificationTime
        ? `${notificationTime.getHours().toString().padStart(2, '0')}:${notificationTime.getMinutes().toString().padStart(2, '0')}`
        : null,
    });

    router.back();
  }, [goal, hasChanges, name, color, startDate, endDate, notificationTime]);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const handleArchive = useCallback(() => {
    if (!goal) return;

    Alert.alert(
      goal.isArchived ? 'Unarchive Goal' : 'Archive Goal',
      goal.isArchived
        ? 'This goal will appear in your active goals list.'
        : 'This goal will be moved to your archived section.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: goal.isArchived ? 'Unarchive' : 'Archive',
          style: goal.isArchived ? 'default' : 'destructive',
          onPress: () => {
            if (goal.isArchived) {
              useGoalStore.getState().unarchiveGoal(goal.id);
            } else {
              useGoalStore.getState().archiveGoal(goal.id);
            }
            router.replace('/');
          },
        },
      ]
    );
  }, [goal]);

  const handleRemoveNotification = useCallback(() => {
    setNotificationTime(null);
  }, []);

  if (!goal) {
    return null;
  }

  const canSave = name.trim().length > 0 && name.length <= 30 && hasChanges;

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
        <Text style={styles.title}>Settings</Text>
        <Pressable
          onPress={handleSave}
          onPressIn={() => setSavePressed(true)}
          onPressOut={() => setSavePressed(false)}
          disabled={!canSave}
          style={[
            styles.saveButton,
            savePressed && styles.saveButtonPressed,
            !canSave && styles.saveButtonDisabled,
          ]}
        >
          <Text style={[styles.saveText, !canSave && styles.disabled]}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Goal Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Goal name"
              placeholderTextColor={COLORS.textMuted}
              maxLength={30}
            />
          </View>
          <Text style={styles.charCount}>{name.length}/30</Text>
        </View>

        {/* Color Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorPicker}>
            {NEON_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c as NeonColor)}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorSelected,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Start Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Start Date</Text>
          <Pressable
            onPress={() => setShowStartPicker(true)}
            style={styles.dateButton}
          >
            <Text style={styles.dateText}>
              {startDate.toLocaleDateString()}
            </Text>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (date) setStartDate(date);
              }}
              themeVariant="light"
            />
          )}
        </View>

        {/* End Date */}
        <View style={styles.section}>
          <Text style={styles.label}>End Date</Text>
          <Pressable
            onPress={() => setShowEndPicker(true)}
            style={styles.dateButton}
          >
            <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
          </Pressable>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={startDate}
              onChange={(event, date) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (date) setEndDate(date);
              }}
              themeVariant="light"
            />
          )}
        </View>

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

        {/* Archive/Unarchive */}
        <View style={styles.section}>
          <Pressable onPress={handleArchive} style={styles.archiveButton}>
            <Text
              style={[
                styles.archiveText,
                goal.isArchived && styles.unarchiveText,
              ]}
            >
              {goal.isArchived ? 'Unarchive Goal' : 'Archive Goal'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
  },
  contentContainer: {
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
  inputContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderTopColor: 'rgba(163, 177, 198, 0.4)',
    borderLeftColor: 'rgba(163, 177, 198, 0.4)',
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    padding: SPACING.md,
  },
  charCount: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
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
  notificationRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  flex1: {
    flex: 1,
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
  archiveButton: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomColor: 'rgba(163, 177, 198, 0.3)',
    borderRightColor: 'rgba(163, 177, 198, 0.3)',
  },
  archiveText: {
    fontFamily: FONTS.body.bold,
    fontSize: FONT_SIZE.md,
    color: '#FF6B6B',
  },
  unarchiveText: {
    color: COLORS.neon.emerald,
  },
});
