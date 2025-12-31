# Dots

A minimalist goal-tracking app for iPhone.

## Overview

Dots helps users stick to repeated daily goals (e.g., tracking calories, exercising, meditating) by visualizing their progress as a grid of dots. The app emphasizes clean design, satisfying interactions, and pure utility without gamification fluff.

**Tech Stack:** React Native (iPhone only, portrait orientation)

---

## Core Concepts

### Goals
- A goal is a daily commitment with a defined start date and end date
- Goals have: name (max 30 characters), color, start date, end date, optional notification time
- Goals can be fully edited after creation (name, color, dates, notifications)
- No limit on number of active goals
- Goals are never truly deleted—only archived

### Days
- Each day within a goal's duration is represented by a dot
- A day can be marked complete (green), incomplete in the past (grey), or in the future (black)
- Today's dot has an orange ring around it
- Users can add text notes to any day (past, present, or future)
- Completion can only be marked for today or past days, not future days

---

## Visual Design

### Theme
- **Always dark mode** (no light theme)
- Background: Dark grey `#1A1A1A`
- Dots: Perfect circles
- Color palette: 6-8 neon/dark-mode optimized colors (cyan, magenta, lime, orange, etc.)

### Dot States
| State | Appearance |
|-------|------------|
| Future | Black/dark fill |
| Completed | Goal's neon color (green by default) |
| Missed (past, incomplete) | Grey |
| Today | Orange ring/border around the dot |

---

## Screens & Navigation

### App Launch Behavior
- Instant restore to the last viewed screen (home or specific goal view)
- No splash screen delay or intermediate navigation

### Navigation
- Back button in header AND iOS swipe-from-left-edge gesture both supported
- No tab bar or bottom navigation

---

## Home Screen

### Layout
- No header—goals start from top for maximum space
- Goals displayed as cards in user-defined order
- Manual drag-to-reorder for goal cards
- "Add new goal" card at bottom of list
- Plus icon in navigation header (both methods to add goals)
- Archived goals section at bottom of home screen

### Goal Card
- Shows goal name
- Mini dot preview: last 30 days of dots
- Today is NOT highlighted in the mini preview (looks same as other dots)
- Tapping a card navigates to the Goal View

---

## Goal View

### Header (Sticky/Floating)
- Goal name
- Stats: Completion percentage + current streak (e.g., "73% • 12 day streak")
- Gear icon for goal settings
- Stats remain visible while scrolling through dots

### Dot Grid
- Continuous wrapped grid layout (NOT calendar-style rows)
- Dots flow left-to-right, wrap at screen edge
- Fixed dot size (scrollable if goal duration requires)
- Auto-scroll to bring today's dot into view when opening

### Dot Interactions

**Long-hold on dot (today or past):**
- Toggles completion status
- Triggers celebration animation (see below)
- Haptic feedback: strong satisfying "thunk"

**Long-hold on completed dot:**
- Unmarks the day (same gesture toggles)

**Tap on any dot:**
- Opens day detail modal

**Future dots:**
- Tappable to add notes
- Cannot be marked complete

---

## Day Detail Modal

### Appearance
- Center modal with backdrop dimming
- Swipe or tap backdrop to dismiss

### Content
- Date displayed with context (day of week, "Day 45 of 180", etc.)
- Completion toggle (for today and past days only)
- Text note field (free-form, text only—no photos)
- Notes can be added to any day including future days

---

## Goal Creation

### Flow
1. Enter goal name (max 30 characters)
2. Choose color from palette (6-8 neon options)
3. Select start date (defaults to today, can pick any date including past)
4. Select duration:
   - Presets: 30 days, 90 days, 180 days, 365 days
   - Custom: calendar date picker for end date
5. Optional: Set notification reminder time (specific hour/minute picker)

---

## Goal Settings

Accessed via gear icon in goal view header.

### Editable Fields
- Goal name
- Color
- Start date
- End date (extend or shorten)
- Notification time (enable/disable, change time)

### Actions
- Archive goal (moves to archived section on home)

---

## Celebration Animation

**Trigger:** Marking a day complete via long-hold

**Style:** Celebratory burst with ripple effect
- Confetti/particle burst from the dot
- Ripple animation affects neighboring dots briefly
- Duration: 700-1000ms
- Strong haptic feedback
- No sound

**100% Completion:** When marking the final day of a goal complete:
- Extra celebratory confetti animation
- Goal receives a "Completed" badge/state (distinct from just being archived)

---

## Notifications

- Configurable per goal
- User sets specific time (hour and minute picker)
- Push notification reminds user to complete their goal for the day

---

## Data & Sync

### Storage
- iCloud sync enabled
- Data persists across devices (iPhone only, but survives device replacement)
- Last viewed screen stored for instant restore

### Timezone Handling
- "Today" determined by device's current local timezone
- No fixed timezone per goal

---

## Loading States

- Skeleton/shimmer placeholders while loading or syncing
- Non-blocking—UI appears when ready

---

## Archive

### Behavior
- Archived goals appear in collapsed section at bottom of home screen
- Archive preserves all goal data and history
- No true delete—only archive

### Completed vs Archived
- A goal marked 100% complete gets a "Completed" badge
- Archived goals are goals the user chose to hide (may or may not be complete)

---

## Edge Cases & Details

### Retroactive Marking
- Users can mark any past day as complete (no time limit)
- Useful for catching up after forgetting to log

### Missed Days
- No guilt messaging or "welcome back" prompts
- Grey dots silently tell the story

### Single Goal
- No special behavior—app still restores to last viewed screen
- Home screen shown if that was last viewed, even with only one goal

### Goal Starting in Past
- Allowed—dots for past days before today start as grey (missed)
- User can retroactively mark them complete if desired

---

## Non-Features (Explicitly Excluded)

- No onboarding/tutorial
- No sound effects
- No motivational quotes or messages
- No gamification beyond streaks
- No iPad support
- No landscape orientation
- No light mode
- No social/sharing features
- No data export
