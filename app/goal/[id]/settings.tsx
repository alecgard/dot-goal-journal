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
import { COLORS, SPACING, FONT_SIZE, NEON_COLORS } from '../../../src/constants/theme';
import { NeonColor } from '../../../src/types';
import { toDateString, fromDateString } from '../../../src/utils/dates';

export default function GoalSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Use stable selector - derive goal from goals array
  const goals = useGoalStore((state) => state.goals);
  const goal = useMemo(() => goals.find(g => g.id === id), [goals, id]);

  const [name, setName] = useState(goal?.name || '');
  const [color, setColor] = useState<NeonColor>(goal?.color || COLORS.neon.cyan);
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
        <Pressable onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={styles.headerButton}
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
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Goal name"
            placeholderTextColor={COLORS.textMuted}
            maxLength={30}
          />
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
              themeVariant="dark"
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
              themeVariant="dark"
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
              themeVariant="dark"
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  cancelText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.neon.cyan,
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
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
  },
  charCount: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: COLORS.textPrimary,
  },
  dateButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
  },
  dateText: {
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
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  removeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  addButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  archiveButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  archiveText: {
    fontSize: FONT_SIZE.md,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  unarchiveText: {
    color: COLORS.neon.spring,
  },
});
