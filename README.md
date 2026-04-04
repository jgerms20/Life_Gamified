# ⚔ Life Gamified — RPG Quest Journal

A fully-featured gamified task manager styled as a fantasy RPG quest journal. Built with React, styled as a weathered leather-bound tome.

## Features

- **Character System** — Name, title, class selection (Warrior/Scholar/Merchant/Diplomat/Adventurer), primary stats (Vitality/Wisdom/Fortune/Charisma), HP/MP/Gold
- **Quest System** — Create quests with categories (Health/Intelligence/Money/Relationships), difficulties (Trivial→Legendary), due dates, recurrence, bonus objectives
- **XP & Levelling** — Quadratic level curve, streak bonuses, first-quest-of-day bonus, category mastery milestones, level-up animation
- **Dopamine Reward System** — Variable-ratio reinforcement (slot machine psychology), 5 reward tiers (Common→Legendary), treasure chest animation, custom reward management
- **Talent Tree** — 5 talent paths unlocked every 5 levels
- **Achievements** — 14 achievements across Progression, Dedication, and Mastery categories
- **Statistics** — Activity heatmap, category distribution, difficulty breakdown, personal records
- **Data Persistence** — localStorage auto-save, JSON export/import backup

## Running Locally

```bash
npm install
npm run dev
```

## Tech Stack

- React 19 (functional components, Context API, useReducer)
- Vite 8 (build tool)
- Google Fonts: Cinzel Decorative, Cinzel, Cormorant Garamond, Caveat
- Pure CSS animations (no animation library dependency for core UX)
- localStorage for persistence

## Design

Medieval fantasy aesthetic: aged parchment (`#f4e4bc`), deep leather browns (`#2d1b0e`), gold leaf (`#d4af37`), faded ink, wax seals, ornamental dividers.
