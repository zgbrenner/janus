# Rendered QA correction, round 1

## Scope

- Replaced the remaining visible T3 Code label in the unthemed compatibility card with `Default`.
- Kept the stored `t3-chat` theme identifier while retaining its visible `Janus` label; `Grove` remains the distinct secondary palette.
- Replaced user-facing settings and archive vocabulary from thread to task without changing internal setting ids, state keys, routes, or archived-thread data handling.

## TDD evidence

- Red: `pnpm --filter @t3tools/web exec vitest run src/components/settings/settingsSearch.test.ts src/components/settings/ThemePreviewCircles.test.ts` failed on `Auto-settle inactive threads` and `T3 Code` legacy labels.
- Green: `pnpm --filter @t3tools/web exec vitest run src/components/settings/settingsSearch.test.ts src/components/settings/ThemePreviewCircles.test.ts src/themePalette.test.ts` passed 3 files and 29 tests.

## Final verification

- `pnpm --filter @t3tools/web exec vitest run --project unit` passed 237 files and 2,170 tests.
- `pnpm --filter @t3tools/web exec tsgo --noEmit` passed.
- `pnpm --filter @t3tools/web run build` passed. The generated entrypoint contains `<title>Janus</title>`.

## Boundaries

- No browser QA was performed in this implementation lane.
- Automation, release, and documentation files were not modified or staged.
