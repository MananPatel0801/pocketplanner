# PocketPlanner — build phases

## Stack
- React 18 + Vite
- Tailwind CSS v3
- Chart.js 4 + react-chartjs-2
- Zustand (client state)
- Supabase JS client (direct, no Express)
- React Router v6

## Supabase tables
- profiles, accounts, categories, transactions, budgets
- RLS enabled on all tables
- System categories seeded (is_system = true, user_id = null)

## Phase status
- [ ] Phase 1 — Foundation (auth + transaction CRUD)
- [ ] Phase 2 — Dashboard (charts + summary)
- [ ] Phase 3 — Budgets (goals + progress)
- [ ] Phase 4 — History (search/filter + recurring)
- [ ] Phase 5 — Polish (dark mode + CSV import)

## Design tokens
- Primary: #6366f1 (indigo-500)
- Income: #22c55e (green-500)
- Expense: #ef4444 (red-500)
- Font: Inter
- Radius: rounded-xl cards, rounded-lg inputs