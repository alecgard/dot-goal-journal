import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGoalStore } from '../src/stores';
import { COLORS, SPACING, FONT_SIZE, NEON_COLORS } from '../src/constants/theme';
import { DURATION_PRESETS, NeonColor } from '../src/types';
import { toDateString, calculateEndDate, fromDateString } from '../src/utils/dates';
import { getRandomNeonColor } from '../src/utils/colors';

export default function CreateGoalScreen() {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [color, setColor] = useState<NeonColor>(getRandomNeonColor());
  const [startDate, setStartDate] = useState(new Date());
  const [durationDays, setDurationDays] = useState<number | null>(30);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const isCustomDuration = durationDays === null;
  const endDate = isCustomDuration
    ? customEndDate || new Date()
    : fromDateString(calculateEndDate(toDateString(startDate), durationDays || 30));

  const canCreate = name.trim().length > 0 && name.length <= 30;

  const handleCreate = useCallback(() => {
    if (!canCreate) return;

    const goalId = useGoalStore.getState().addGoal({
      name: name.trim(),
      color,
      startDate: toDateString(startDate),
      endDate: toDateString(endDate),
      notificationTime: null,
    });

    router.replace(`/goal/${goalId}`);
  }, [name, color, startDate, endDate, canCreate]);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const handleSelectDuration = useCallback((days: number | null) => {
    setDurationDays(days);
    if (days !== null) {
      setCustomEndDate(null);
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>New Goal</Text>
        <Pressable
          onPress={handleCreate}
          disabled={!canCreate}
          style={styles.headerButton}
        >
          <Text style={[styles.createText, !canCreate && styles.disabled]}>
            Create
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
            placeholder="e.g., Track calories"
            placeholderTextColor={COLORS.textMuted}
            maxLength={30}
            autoFocus
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

        {/* Duration Presets */}
        <View style={styles.section}>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.durationOptions}>
            {DURATION_PRESETS.map((preset) => (
              <Pressable
                key={preset.days}
                onPress={() => handleSelectDuration(preset.days)}
                style={[
                  styles.durationOption,
                  durationDays === preset.days && styles.durationSelected,
                  durationDays === preset.days && { borderColor: color },
                ]}
              >
                <Text
                  style={[
                    styles.durationText,
                    durationDays === preset.days && { color },
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                handleSelectDuration(null);
                setShowEndPicker(true);
              }}
              style={[
                styles.durationOption,
                isCustomDuration && styles.durationSelected,
                isCustomDuration && { borderColor: color },
              ]}
            >
              <Text
                style={[
                  styles.durationText,
                  isCustomDuration && { color },
                ]}
              >
                Custom
              </Text>
            </Pressable>
          </View>

          {/* Custom End Date Picker */}
          {isCustomDuration && (
            <View style={styles.customDateSection}>
              <Text style={styles.sublabel}>End Date</Text>
              <Pressable
                onPress={() => setShowEndPicker(true)}
                style={styles.dateButton}
              >
                <Text style={styles.dateText}>
                  {customEndDate
                    ? customEndDate.toLocaleDateString()
                    : 'Select end date'}
                </Text>
              </Pressable>
              {showEndPicker && (
                <DateTimePicker
                  value={customEndDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={startDate}
                  onChange={(event, date) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (date) setCustomEndDate(date);
                  }}
                  themeVariant="dark"
                />
              )}
            </View>
          )}
        </View>

        {/* Preview */}
        <View style={styles.preview}>
          <View style={[styles.previewCard, { borderLeftColor: color }]}>
            <Text style={styles.previewName}>{name || 'Goal name'}</Text>
            <Text style={styles.previewDates}>
              {toDateString(startDate)} → {toDateString(endDate)}
            </Text>
          </View>
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
  createText: {
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
  sublabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
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
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  durationOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surface,
    backgroundColor: COLORS.surface,
  },
  durationSelected: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  durationText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  customDateSection: {
    marginTop: SPACING.sm,
  },
  preview: {
    marginTop: SPACING.lg,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderLeftWidth: 4,
  },
  previewName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  previewDates: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
