# Vexo Save

## Overview

Mobile app for saving and organizing video links from TikTok, Instagram, and YouTube. Built with Expo (React Native) in a pnpm monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile framework**: Expo (React Native) with expo-router
- **State management**: React Context + AsyncStorage
- **UI**: React Native StyleSheet, expo-linear-gradient, @expo/vector-icons (Feather)
- **API framework**: Express 5 (shared backend, not used yet)
- **Database**: PostgreSQL + Drizzle ORM (available, not used yet)

## App Structure

- **Home screen** — Pinterest-style 2-column grid of saved videos with search
- **Categories screen** — List of categories with item counts, create new categories
- **Category detail** — Filtered grid of videos in a category
- **Add item** — Save a new video link with URL detection, category, and notes
- **Item detail** — View video details, edit notes, open link, delete

## Design

- Dark mode with deep navy background (#0F0F1A)
- Purple (#8B5CF6), blue (#3B82F6), cyan (#06B6D4) gradient accents
- Rounded cards (16px radius)
- Floating gradient add button
- Inter font family

## Key Files

- `artifacts/mobile/contexts/SavedItemsContext.tsx` — Data layer with AsyncStorage persistence
- `artifacts/mobile/components/` — VideoCard, SearchBar, FloatingAddButton, CategoryCard
- `artifacts/mobile/app/(tabs)/index.tsx` — Home screen
- `artifacts/mobile/app/(tabs)/categories.tsx` — Categories screen
- `artifacts/mobile/app/add.tsx` — Add item screen
- `artifacts/mobile/app/item/[id].tsx` — Item detail screen
- `artifacts/mobile/app/category/[id].tsx` — Category detail screen
- `artifacts/mobile/constants/colors.ts` — Theme colors

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
