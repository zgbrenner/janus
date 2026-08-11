# Rendered QA branding and vocabulary correction

## Scope

- Rebranded browser fallback, static boot shell, and loopback authorization completion page to Janus.
- Replaced directly user-visible new-thread wording in the chat header and draft task title paths with task wording.
- Kept internal thread identifiers, routes, and data concepts unchanged.
- Updated the directly coupled desktop-update release URL expectations after the release owner changed concurrently.

## TDD evidence

- Red: `pnpm exec vitest run apps/web/src/branding.test.ts apps/web/src/components/ChatView.logic.test.ts` failed with 4 expected legacy-value assertions.
- Red: `pnpm exec vitest run apps/server/src/cloud/cliAuthHtml.test.ts` failed with 2 expected legacy-value assertions.
- Green: `pnpm exec vitest run apps/web/src/branding.test.ts apps/web/src/components/ChatView.logic.test.ts apps/server/src/cloud/cliAuthHtml.test.ts` passed 3 files and 50 tests.

## Final verification

- `pnpm --filter @t3tools/web exec vitest run src/components/desktopUpdate.toast.test.tsx --project unit` passed 1 file and 5 tests.
- `pnpm --filter @t3tools/web exec vitest run --project unit` passed 236 files and 2,169 tests.
- `pnpm --filter @t3tools/web exec tsgo --noEmit` passed.
- `pnpm --filter t3 exec tsgo --noEmit` passed with existing Effect suggestions in orchestration and pull-request files.
- The static entrypoint now declares `<title>Janus</title>` and its splash accessibility copy says Janus.

## Boundaries and remaining evidence

- No browser QA was performed, per lane instruction.
- The full server suite was attempted with `pnpm --filter t3 exec vitest run`; it exceeded the 120-second command boundary and terminated with exit 124/EPIPE, so it is not a passing full-server result. The scoped CLI authorization test passed.
- Web build could not be run in this environment because the repository's `vp` launcher is unavailable and neither `vite` nor `vite-plus` is exposed through pnpm. This does not affect the successful web typecheck or unit suite.
