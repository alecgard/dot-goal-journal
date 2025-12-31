import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { formatDisplayDate, formatDayContext, isFuture, isToday as isTodayFn } from '../../utils/dates';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../constants/theme';
import { completionHaptic } from '../../services/haptics';

interface DayDetailModalProps {
  visible: boolean;
  date: string | null;
  goal: Goal;
  onClose: () => void;
}

/**
 * DayDetailModal - Neumorphic day detail view
 *
 * Features:
 * - Extruded modal card
 * - Inset notes input
 * - Neumorphic completion toggle button
 */
export const DayDetailModal = memo(function DayDetailModal({
  visible,
  date,
  goal,
  onClose,
}: DayDetailModalProps) {
  const days = useDayStore((state) => state.days);

  const entry = useMemo(() => {
    if (!date) return undefined;
    const key = `${goal.id}:${date}`;
    return days[key];
  }, [days, goal.id, date]);

  const [note, setNote] = useState(entry?.note || '');
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  useEffect(() => {
    if (date) {
      const key = `${goal.id}:${date}`;
      const currentEntry = days[key];
      setNote(currentEntry?.note || '');
    }
  }, [date, goal.id, days]);

  const canToggleCompletion = date && !isFuture(date);
  const isCompleted = entry?.isCompleted ?? false;

  const handleToggleCompletion = useCallback(async () => {
    if (!date || !canToggleCompletion) return;
    useDayStore.getState().toggleCompletion(goal.id, date);
    await completionHaptic();
  }, [date, goal.id, canToggleCompletion]);

  const handleSaveNote = useCallback(() => {
    if (!date) return;
    if (note !== (entry?.note || '')) {
      useDayStore.getState().updateNote(goal.id, date, note);
    }
  }, [date, goal.id, note, entry?.note]);

  const handleClose = useCallback(() => {
    handleSaveNote();
    onClose();
  }, [handleSaveNote, onClose]);

  if (!date) return null;

  const dateDisplay = formatDisplayDate(date);
  const dayContext = formatDayContext(goal.startDate, goal.endDate, date);
  const isTodayDate = isTodayFn(date);
  const isFutureDate = isFuture(date);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Shadow
              distance={12}
              startColor={COLORS.shadowDark}
              offset={[10, 10]}
              style={{ borderRadius: RADIUS.xxl }}
            >
              <Shadow
                distance={12}
                startColor={COLORS.shadowLight}
                offset={[-10, -10]}
                style={{ borderRadius: RADIUS.xxl }}
              >
                <View style={styles.modal}>
                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={styles.date}>{dateDisplay}</Text>
                    <Text style={styles.context}>{dayContext}</Text>
                    {isTodayDate && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayText}>Today</Text>
                      </View>
                    )}
                  </View>

                  {/* Completion Toggle */}
                  {!isFutureDate && (
                    <Pressable
                      onPress={handleToggleCompletion}
                      onPressIn={() => setIsButtonPressed(true)}
                      onPressOut={() => setIsButtonPressed(false)}
                      style={[
                        styles.completionButton,
                        isCompleted && { backgroundColor: goal.color },
                        isButtonPressed && styles.completionButtonPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.completionText,
                          isCompleted && styles.completionTextActive,
                        ]}
                      >
                        {isCompleted ? 'Completed' : 'Mark as complete'}
                      </Text>
                    </Pressable>
                  )}

                  {isFutureDate && (
                    <View style={styles.futureNotice}>
                      <Text style={styles.futureText}>
                        This day is in the future. You can add notes but cannot mark it complete yet.
                      </Text>
                    </View>
                  )}

                  {/* Notes */}
                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Notes</Text>
                    <View style={styles.notesInputContainer}>
                      <TextInput
                        style={styles.notesInput}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Add notes for this day..."
                        placeholderTextColor={COLORS.textMuted}
                        multiline
                        textAlignVertical="top"
                        onBlur={handleSaveNote}
                      />
                    </View>
                  </View>

                  {/* Close Button */}
                  <Pressable onPress={handleClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>Done</Text>
                  </Pressable>
                </View>
              </Shadow>
            </Shadow>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: 340,
    maxWidth: '100%',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  date: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  context: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  todayBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.dotToday}20`,
  },
  todayText: {
    fontFamily: FONTS.body.bold,
    fontSize: FONT_SIZE.xs,
    color: COLORS.dotToday,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completionButton: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    // Extruded effect via border
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomColor: 'rgba(163, 177, 198, 0.4)',
    borderRightColor: 'rgba(163, 177, 198, 0.4)',
  },
  completionButtonPressed: {
    borderTopColor: 'rgba(163, 177, 198, 0.4)',
    borderLeftColor: 'rgba(163, 177, 198, 0.4)',
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ scale: 0.98 }],
  },
  completionText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  completionTextActive: {
    color: '#FFFFFF',
  },
  futureNotice: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    // Inset effect
    borderWidth: 1,
    borderTopColor: 'rgba(163, 177, 198, 0.3)',
    borderLeftColor: 'rgba(163, 177, 198, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
  },
  futureText: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  notesSection: {
    marginBottom: SPACING.lg,
  },
  notesLabel: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notesInputContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    // Inset effect for input
    borderWidth: 1,
    borderTopColor: 'rgba(163, 177, 198, 0.4)',
    borderLeftColor: 'rgba(163, 177, 198, 0.4)',
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
  },
  notesInput: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    padding: SPACING.md,
    minHeight: 100,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  closeText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.md,
    color: COLORS.accent,
  },
});
