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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import { Goal } from '../../types';
import { useDayStore } from '../../stores';
import { formatDisplayDate, formatDayContext, isFuture, isToday as isTodayFn, getDayNumber, getDayCount } from '../../utils/dates';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../constants/theme';
import { completionHaptic } from '../../services/haptics';

interface DayDetailModalProps {
  visible: boolean;
  date: string | null;
  goal: Goal;
  onClose: () => void;
  /** Date being held (for slide-in animation during hold) */
  holdingDate?: string | null;
  /** Whether hold was cancelled (modal should slide back out) */
  holdCancelled?: boolean;
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
  holdingDate,
  holdCancelled,
}: DayDetailModalProps) {
  const days = useDayStore((state) => state.days);

  // Animation value: 0 = fully hidden (off-screen), 1 = fully visible
  const slideProgress = useSharedValue(0);
  // Track if modal content should be shown
  const [showModal, setShowModal] = useState(false);

  // The date to display - either the holding date or the selected date
  const displayDate = holdingDate || date;

  const entry = useMemo(() => {
    if (!displayDate) return undefined;
    const key = `${goal.id}_${displayDate}`;
    return days[key];
  }, [days, goal.id, displayDate]);

  const [note, setNote] = useState(entry?.note || '');
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // Handle hold start - begin sliding in
  useEffect(() => {
    if (holdingDate && !visible) {
      setShowModal(true);
      // Animate to 70% visible during hold (gives visual feedback)
      slideProgress.value = withTiming(0.7, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [holdingDate, visible, slideProgress]);

  // Handle hold cancelled - slide back out
  useEffect(() => {
    if (holdCancelled && !visible) {
      slideProgress.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      }, () => {
        runOnJS(setShowModal)(false);
      });
    }
  }, [holdCancelled, visible, slideProgress]);

  // Handle fully visible (hold completed or opened via tap)
  useEffect(() => {
    if (visible) {
      setShowModal(true);
      slideProgress.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
    } else if (!holdingDate) {
      // Closing the modal
      slideProgress.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      }, () => {
        runOnJS(setShowModal)(false);
      });
    }
  }, [visible, holdingDate, slideProgress]);

  useEffect(() => {
    if (displayDate) {
      const key = `${goal.id}_${displayDate}`;
      const currentEntry = days[key];
      setNote(currentEntry?.note || '');
    }
  }, [displayDate, goal.id, days]);

  const canToggleCompletion = displayDate && !isFuture(displayDate);
  const isCompleted = entry?.isCompleted ?? false;

  // Animated style for the modal container
  const animatedModalStyle = useAnimatedStyle(() => {
    // Modal height is approximately 450px, translate from bottom
    const translateY = interpolate(
      slideProgress.value,
      [0, 1],
      [500, 0]
    );
    return {
      transform: [{ translateY }],
    };
  });

  // Animated style for backdrop opacity
  const animatedBackdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      slideProgress.value,
      [0, 1],
      [0, 0.3]
    );
    return {
      backgroundColor: `rgba(0, 0, 0, ${opacity})`,
    };
  });

  const handleSaveNote = useCallback(() => {
    if (!displayDate) return;
    if (note !== (entry?.note || '')) {
      useDayStore.getState().updateNote(goal.id, displayDate, note);
    }
  }, [displayDate, goal.id, note, entry?.note]);

  const handleClose = useCallback(() => {
    handleSaveNote();
    onClose();
  }, [handleSaveNote, onClose]);

  const handleToggleCompletion = useCallback(async () => {
    if (!displayDate || !canToggleCompletion) return;
    useDayStore.getState().toggleCompletion(goal.id, displayDate);
    await completionHaptic();
    // Close modal on both complete and uncomplete actions
    handleClose();
  }, [displayDate, goal.id, canToggleCompletion, handleClose]);

  // Don't render if nothing to show
  if (!showModal && !displayDate) return null;

  const dateDisplay = displayDate ? formatDisplayDate(displayDate) : '';
  const dayContext = displayDate ? formatDayContext(goal.startDate, goal.endDate, displayDate) : '';
  const dayNum = displayDate ? getDayNumber(goal.startDate, displayDate) : 0;
  const totalDays = getDayCount(goal.startDate, goal.endDate);
  const daysRemaining = totalDays - dayNum;
  const dayContextWithRemaining = `${dayContext} (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining)`;
  const isTodayDate = displayDate ? isTodayFn(displayDate) : false;
  const isFutureDate = displayDate ? isFuture(displayDate) : false;

  // Determine if interactions should be enabled (only when fully visible)
  const isInteractive = visible;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isInteractive ? handleClose : undefined}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          pointerEvents={isInteractive ? 'auto' : 'none'}
        >
          <Animated.View style={animatedModalStyle}>
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
                      <Text style={styles.context}>{dayContextWithRemaining}</Text>
                      {isTodayDate && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayText}>Today</Text>
                        </View>
                      )}
                    </View>

                    {/* Completion Toggle */}
                    {!isFutureDate && (
                      <Pressable
                        onPress={isInteractive ? handleToggleCompletion : undefined}
                        onPressIn={() => isInteractive && setIsButtonPressed(true)}
                        onPressOut={() => setIsButtonPressed(false)}
                        style={[
                          styles.completionButton,
                          isCompleted && { backgroundColor: COLORS.dotCompleted },
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
                          onChangeText={isInteractive ? setNote : undefined}
                          placeholder="Add notes for this day..."
                          placeholderTextColor={COLORS.textMuted}
                          multiline
                          textAlignVertical="top"
                          onBlur={handleSaveNote}
                          editable={isInteractive}
                        />
                      </View>
                    </View>

                    {/* Close Button */}
                    <Pressable onPress={isInteractive ? handleClose : undefined} style={styles.closeButton}>
                      <Text style={styles.closeText}>Done</Text>
                    </Pressable>
                  </View>
                </Shadow>
              </Shadow>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
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
