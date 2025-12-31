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
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { formatDisplayDate, formatDayContext, isFuture, isToday as isTodayFn } from '../../utils/dates';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme';
import { completionHaptic } from '../../services/haptics';

interface DayDetailModalProps {
  visible: boolean;
  date: string | null;
  goal: Goal;
  onClose: () => void;
}

export const DayDetailModal = memo(function DayDetailModal({
  visible,
  date,
  goal,
  onClose,
}: DayDetailModalProps) {
  // Use stable selector - just get the days object
  const days = useDayStore((state) => state.days);

  // Derive entry from days using useMemo
  const entry = useMemo(() => {
    if (!date) return undefined;
    const key = `${goal.id}:${date}`;
    return days[key];
  }, [days, goal.id, date]);

  const [note, setNote] = useState(entry?.note || '');

  // Reset note when modal opens with new date
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
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.date}>{dateDisplay}</Text>
              <Text style={styles.context}>{dayContext}</Text>
              {isTodayDate && (
                <View style={[styles.todayBadge, { borderColor: COLORS.dotToday }]}>
                  <Text style={[styles.todayText, { color: COLORS.dotToday }]}>
                    Today
                  </Text>
                </View>
              )}
            </View>

            {/* Completion Toggle */}
            {!isFutureDate && (
              <Pressable
                onPress={handleToggleCompletion}
                style={[
                  styles.completionButton,
                  isCompleted && { backgroundColor: goal.color },
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

            {/* Close Button */}
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Done</Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  date: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  context: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  todayBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  todayText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  completionButton: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  completionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  completionTextActive: {
    color: COLORS.background,
  },
  futureNotice: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  futureText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  notesSection: {
    marginBottom: SPACING.lg,
  },
  notesLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    minHeight: 100,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  closeText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
