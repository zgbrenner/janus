# Rendered QA correction, round 2

## Scope

- Replaced the theme import empty-state prompt with `Drop Janus or VS Code .json theme files`.
- Kept the JSON parsing and VS Code compatibility pipeline unchanged; the helper only selects the rendered prompt when no file is selected.
- No other visible legacy T3 Code wording remains in the owned import dialog.

## TDD evidence

- Red: `pnpm --filter @t3tools/web exec vitest run src/components/settings/ThemeImportDialog.test.ts` failed because the Janus-first prompt helper was absent.
- Green: the same focused test passed 4 tests after the helper was wired into the rendered dialog.

## Final verification

- `pnpm --filter @t3tools/web exec vitest run --project unit` passed 237 files and 2,171 tests.
- `pnpm --filter @t3tools/web exec tsgo --noEmit` passed.

## Boundary

- No browser QA was performed in this implementation lane.
