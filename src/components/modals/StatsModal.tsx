import React, { memo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import { Goal } from '../../types';
import { useStats } from '../../hooks/useStats';
import { COLORS, SPACING, FONT_SIZE, FONTS, RADIUS } from '../../constants/theme';

interface StatsModalProps {
  visible: boolean;
  goal: Goal;
  onClose: () => void;
}

interface StatRowProps {
  label: string;
  value: string | number;
  color?: string;
  isHighlight?: boolean;
}

const StatRow = memo(function StatRow({ label, value, color, isHighlight }: StatRowProps) {
  return (
    <View style={[styles.statRow, isHighlight && styles.statRowHighlight]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]}>
        {value}
      </Text>
    </View>
  );
});

/**
 * StatsModal - Neumorphic modal displaying detailed goal statistics
 */
export const StatsModal = memo(function StatsModal({
  visible,
  goal,
  onClose,
}: StatsModalProps) {
  const stats = useStats(goal);

  // Animation value: 0 = hidden, 1 = fully visible
  const animationProgress = useSharedValue(0);
  const [showModal, setShowModal] = useState(false);
  const [closePressed, setClosePressed] = useState(false);

  // Handle visibility changes with fade animation
  useEffect(() => {
    if (visible) {
      setShowModal(true);
      animationProgress.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animationProgress.value = withTiming(0, {
        duration: 150,
        easing: Easing.in(Easing.cubic),
      }, () => {
        runOnJS(setShowModal)(false);
      });
    }
  }, [visible, animationProgress]);

  // Animated style for the modal container
  const animatedModalStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animationProgress.value,
      [0, 1],
      [0.95, 1]
    );
    return {
      opacity: animationProgress.value,
      transform: [{ scale }],
    };
  });

  // Animated style for backdrop opacity
  const animatedBackdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 0.3]
    );
    return {
      backgroundColor: `rgba(0, 0, 0, ${opacity})`,
    };
  });

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!showModal) return null;

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
          onPress={handleClose}
        />
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
                    <Text style={styles.title}>Statistics</Text>
                    <Text style={styles.goalName}>{goal.name}</Text>
                  </View>

                  {/* Stats Content */}
                  <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Progress Section */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Progress</Text>
                      <View style={styles.sectionContent}>
                        <StatRow
                          label="Time Elapsed"
                          value={`${stats.timeElapsedPercentage}%`}
                          color={COLORS.accent}
                        />
                        <StatRow
                          label="Completion Rate"
                          value={`${stats.completionRate}%`}
                          color={stats.completionRate >= 80 ? COLORS.dotCompleted : COLORS.textSecondary}
                        />
                        <StatRow
                          label="Days Elapsed"
                          value={`${stats.daysElapsed} / ${stats.totalDays}`}
                        />
                        <StatRow
                          label="Days Remaining"
                          value={stats.daysRemaining}
                        />
                      </View>
                    </View>

                    {/* Streaks Section */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Streaks</Text>
                      <View style={styles.sectionContent}>
                        <StatRow
                          label="Current Streak"
                          value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`}
                          color={stats.currentStreak > 0 ? COLORS.dotCompleted : COLORS.textSecondary}
                          isHighlight={stats.currentStreak > 0}
                        />
                        <StatRow
                          label="Longest Streak"
                          value={`${stats.longestStreak} day${stats.longestStreak !== 1 ? 's' : ''}`}
                          color={stats.longestStreak > 0 ? COLORS.neon.amber : COLORS.textSecondary}
                          isHighlight={stats.longestStreak > 0}
                        />
                      </View>
                    </View>

                    {/* Completion Section */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Completions</Text>
                      <View style={styles.sectionContent}>
                        <StatRow
                          label="Total Completed"
                          value={stats.totalCompleted}
                          color={COLORS.dotCompleted}
                        />
                        <StatRow
                          label="Total Missed"
                          value={stats.totalMissed}
                          color={stats.totalMissed > 0 ? COLORS.dotMissed : COLORS.textSecondary}
                        />
                      </View>
                    </View>

                    {/* Weekly Stats Section */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Weekly</Text>
                      <View style={styles.sectionContent}>
                        <StatRow
                          label="Avg. per Week"
                          value={`${stats.averageCompletionsPerWeek} days`}
                        />
                        {stats.bestWeekCompletions > 0 && (
                          <StatRow
                            label={`Best Week (${stats.bestWeekLabel})`}
                            value={`${stats.bestWeekCompletions} day${stats.bestWeekCompletions !== 1 ? 's' : ''}`}
                            color={COLORS.neon.violet}
                            isHighlight
                          />
                        )}
                      </View>
                    </View>
                  </ScrollView>

                  {/* Close Button */}
                  <Pressable
                    onPress={handleClose}
                    onPressIn={() => setClosePressed(true)}
                    onPressOut={() => setClosePressed(false)}
                    style={[styles.closeButton, closePressed && styles.closeButtonPressed]}
                  >
                    <Text style={styles.closeText}>Done</Text>
                  </Pressable>
                </View>
              </Shadow>
            </Shadow>
          </Pressable>
        </Animated.View>
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
  modal: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: 340,
    maxWidth: '100%',
    maxHeight: 500,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  goalName: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  scrollView: {
    maxHeight: 320,
  },
  scrollContent: {
    paddingBottom: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  sectionContent: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    // Inset effect
    borderWidth: 1,
    borderTopColor: 'rgba(163, 177, 198, 0.3)',
    borderLeftColor: 'rgba(163, 177, 198, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163, 177, 198, 0.15)',
  },
  statRowHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statLabel: {
    fontFamily: FONTS.body.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    // Extruded effect
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomColor: 'rgba(163, 177, 198, 0.4)',
    borderRightColor: 'rgba(163, 177, 198, 0.4)',
  },
  closeButtonPressed: {
    borderTopColor: 'rgba(163, 177, 198, 0.4)',
    borderLeftColor: 'rgba(163, 177, 198, 0.4)',
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ scale: 0.98 }],
  },
  closeText: {
    fontFamily: FONTS.body.medium,
    fontSize: FONT_SIZE.md,
    color: COLORS.accent,
  },
});
