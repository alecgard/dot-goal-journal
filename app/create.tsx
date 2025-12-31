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
import { Shadow } from 'react-native-shadow-2';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGoalStore } from '../src/stores';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS, NEON_COLORS } from '../src/constants/theme';
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
  const [cancelPressed, setCancelPressed] = useState(false);
  const [createPressed, setCreatePressed] = useState(false);

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
        <Pressable
          onPress={handleCancel}
          onPressIn={() => setCancelPressed(true)}
          onPressOut={() => setCancelPressed(false)}
          style={[styles.headerButton, cancelPressed && styles.headerButtonPressed]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>New Goal</Text>
        <Pressable
          onPress={handleCreate}
          onPressIn={() => setCreatePressed(true)}
          onPressOut={() => setCreatePressed(false)}
          disabled={!canCreate}
          style={[
            styles.createButton,
            createPressed && styles.createButtonPressed,
            !canCreate && styles.createButtonDisabled,
          ]}
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
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Track calories"
              placeholderTextColor={COLORS.textMuted}
              maxLength={30}
              autoFocus
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
                  durationDays === preset.days && { backgroundColor: `${color}20` },
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
                isCustomDuration && { backgroundColor: `${color}20` },
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
                  themeVariant="light"
                />
              )}
            </View>
          )}
        </View>

        {/* Preview */}
        <View style={styles.preview}>
          <Shadow
            distance={8}
            startColor={COLORS.shadowDark}
            offset={[6, 6]}
            style={{ borderRadius: RADIUS.xl }}
          >
            <Shadow
              distance={8}
              startColor={COLORS.shadowLight}
              offset={[-6, -6]}
              style={{ borderRadius: RADIUS.xl }}
            >
              <View style={[styles.previewCard, { borderLeftColor: color }]}>
                <Text style={styles.previewName}>{name || 'Goal name'}</Text>
                <Text style={styles.previewDates}>
                  {toDateString(startDate)} → {toDateString(endDate)}
                </Text>
              </View>
            </Shadow>
          </Shadow>
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
  createButton: {
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
  createButtonPressed: {
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    transform: [{ scale: 0.98 }],
  },
  createButtonDisabled: {
    backgroundColor: COLORS.background,
    shadowColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(163, 177, 198, 0.3)',
  },
  createText: {
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
  sublabel: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
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
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  durationOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomColor: 'rgba(163, 177, 198, 0.3)',
    borderRightColor: 'rgba(163, 177, 198, 0.3)',
  },
  durationSelected: {
    borderTopColor: 'rgba(163, 177, 198, 0.3)',
    borderLeftColor: 'rgba(163, 177, 198, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
  },
  durationText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  customDateSection: {
    marginTop: SPACING.md,
  },
  preview: {
    marginTop: SPACING.lg,
  },
  previewCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderLeftWidth: 4,
  },
  previewName: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  previewDates: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
