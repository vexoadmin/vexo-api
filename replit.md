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

- Ultra-dark background: #060814 (deeper blue-black)
- Brand gradient: Fuchsia (#D946EF) → Violet (#8B5CF6) → Cyan (#22D3EE)
- Glass card borders: rgba(255,255,255,0.10) on rgba(255,255,255,0.04) backgrounds
- Card thumbnails: fuchsia→violet→cyan gradient with radial top-left highlight
- Category pills inside thumbnails (frosted glass, bottom-left)
- Source label in cyan (#A5F3FC) text
- Active chip: fuchsia gradient border + glow; inactive: white/10 border
- "+ Add" chip: dashed cyan border + cyan tint
- CategoryCard: even cards get fuchsia/violet/cyan gradient tint; odd get subtle white gradient
- Add Category card: dashed cyan border + cyan tint
- Item detail: hero thumbnail card with category + source frosted pills; "Edit item" border button + "Open source ↗" gradient button; AI area has dashed cyan border
- Reminder pills: 2×2 grid layout; active = gradient glow; custom = dashed cyan
- FAB: fuchsia→violet→cyan gradient with cyan glow
- Ambient glow blobs (fuchsia top-left, cyan top-right, violet bottom)
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
