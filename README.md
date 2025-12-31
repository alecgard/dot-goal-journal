# Dots

Toy project to play with Claude development flow.

A minimalist goal-tracking app for iPhone. Track daily habits with a visual grid of dots.

## Features

- **Dot Grid**: Each day is a dot. Completed = colored, missed = grey, future = dark
- **Multiple Goals**: Track several daily habits with custom colors
- **Notes**: Add text notes to any day
- **Streaks**: Track current streak and completion percentage
- **Dark Mode**: Always-on dark theme with neon colors

## Tech Stack

- React Native + Expo SDK 54
- Expo Router (file-based routing)
- Zustand + AsyncStorage (state persistence)

## Development

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your iPhone.

## Project Structure

```
app/                  # Screens (Expo Router)
  index.tsx           # Home - goal list
  create.tsx          # Create new goal
  goal/[id].tsx       # Goal detail with dot grid
  goal/[id]/settings.tsx
src/
  components/         # UI components
  stores/             # Zustand stores
  types/              # TypeScript types
  utils/              # Helper functions
```
