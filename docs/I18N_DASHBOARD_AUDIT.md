# I18N Dashboard Audit

Generated: 2026-08-07T18:56:20.110Z
Files scanned: 310
Findings: 74
Remaining (RO heuristics): 0

| Route/File | Line | String | Classification | Action |
|---|---:|---|---|---|

## Notes

- Heuristic only (not full AST).
- `intentionally-English`, `technical`, and user-generated content are out of migration scope.
- `action-fallback`: leftover RO strings in `lib/actions` returned as compat `error`/`success` alongside `errorCode` where migrated; UI should prefer `translateErrorCode` / `translateValidationMessage`.
- Success criterion: `app/` + `components/` UI chrome has **0** `remaining` findings.
- Re-run after each i18n phase.

## Summary

- UI remaining (app/components): 0
- Action/service fallbacks: 74
