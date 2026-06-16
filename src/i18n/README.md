# i18n migration

This directory holds the runtime i18n config (`index.js`), locale dictionaries (`locales/sv.json`, `locales/en.json`), and the migration queue (`queue.json`).

## How the migration works

Each .jsx file in the app is converted from hardcoded Swedish strings to key-based `t()` calls one at a time. The conversion is automated by a scheduled remote agent (`i18n-nightly`) that fires every night and processes the next file from `queue.json`.

## queue.json shape

- `completed` — files already converted and merged to main.
- `inReview` — files with an open PR pending human review.
- `pending` — files waiting to be converted, in priority order. The nightly routine pops the first one each run.
- `skip` — files explicitly excluded from migration (utility files, no user-facing strings, intentionally left in Swedish).

To reorder priority, edit `pending` manually. To pause the routine, set the schedule to disabled in claude.ai/code/routines.

## Throttling

The routine refuses to start work if 3 or more i18n PRs are already open and unmerged, to keep review burden manageable. Merge a couple to unblock the queue.
