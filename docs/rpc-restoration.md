# RPC Layer Restoration — Assumptions & Design Notes

The frontend called **39 Postgres functions via `supabase.rpc(...)` that did not
exist** in the database. They failed silently behind `try/catch`, so a dozen
feature areas appeared to work but did nothing. All 39 have now been created in
the live DB (project `frnfcunzanaothuqbpkf`). This document records the
best-guess schemas and heuristics chosen, so they can be reviewed/adjusted.

Guardrail: `scripts/audit-supabase-schema.mjs` validates every `.rpc()` call
against a snapshot of real functions. The `KNOWN_MISSING_RPCS` baseline is now
**empty** — any newly-introduced missing RPC fails CI.

## Security posture (important)

| Function group | Mode | Rationale |
|---|---|---|
| **Tier B — student PII** (`get_student_profile/lifecycle/transfers/special_needs/accommodations`, disciplinary, `create_lifecycle_event`) | `security invoker` | RLS governs who sees sensitive data. No PII leak. |
| Counters, gamification, analytics, collaboration, paths, labs | `security definer`, `search_path=public`, `authenticated`-only | Non-sensitive aggregate/content data + controlled mutations. |

The Supabase advisor `authenticated_security_definer_function_executable` fires
on the definer functions — this is **by design**: the app's authenticated users
must be able to call them. `anon` execute was revoked; `search_path` is pinned.

## Tier A — Forums, Tutoring, Group Projects (tables already existed)
- `get_forum_topics/posts`, `get_tutoring_sessions`, `get_group_projects`,
  `get_project_tasks` → `SETOF <table>` with optional-param filtering.
- `update_project_progress(project)` → `progress_percentage` =
  completed tasks / total tasks (status in `completed/done/complete`).

## Tier B — Student Information System
- Added 8 columns to `student_lifecycle_events` (`term`, `from/to_school_id`,
  `from/to_grade`, `status`, `reason`, `notes`) so `create_lifecycle_event`
  drops nothing.
- Added staff/admin RLS policies to `student_lifecycle_events` and
  `student_special_needs` (both had RLS enabled with **zero policies**),
  mirroring `student_accommodations`.
- `get_student_profile` matches on `user_id` (the table's key), not `student_id`.
- Disciplinary "academic year" is derived from `extract(year from incident_date)`
  (the table has no academic_year column). Summary returns
  `total_incidents / resolved_incidents / total_suspensions / last_incident_date`.

## Tier C — Gamification (NEW tables: `badges`, `student_gamification`, `point_transactions`, `leaderboards`)
- **Level curve (ASSUMPTION):** `level = floor(xp / 100) + 1`;
  `experience_to_next_level = level * 100`. Linear.
- `award_points` upserts the per-(student, class_subject) aggregate and logs a
  `point_transactions` row. **It trusts its caller (the client app)** — a
  malicious authenticated user could inflate their own points by calling it
  directly. *To harden later: move awarding server-side / behind triggers.*
- `get_leaderboard` ranks `student_gamification` by `total_points` (scoped to the
  leaderboard's `class_subject_id`, or global if null).

## Tier C — Curriculum Analytics (NEW tables: `curriculum_coverage`, `curriculum_time_allocation`, `curriculum_analytics_snapshots`)
- **Coverage heuristic (ASSUMPTION):** no curriculum→lesson mapping is modeled,
  so coverage is derived from **lessons grouped by their free-text `topic`**:
  a topic's `coverage_percentage` = completed lessons / total lessons.
  Run `update_coverage_from_lessons(class_subject)` to (re)populate.
- **Time allocation:** planned/actual hours from lesson `start_time`/`end_time`
  (actual = completed lessons). `academic_year`/`term` are stored on the rows but
  not used to filter lessons (lessons have no such columns).
- **Gaps:** `identify_curriculum_gaps` flags topics under 50% coverage
  (`<25%`=high, `<50%`=medium) into the existing `curriculum_gaps` table.
- **`get_outcome_achievement_summary` returns an empty (correctly-shaped) set** —
  there is no SCO→grade linkage in the schema yet, so achievement can't be
  computed. This is the one feature that needs a real data model before it works.

## Tier D — Collaboration, Learning Paths, Labs/AR-VR (NEW tables: `session_participants`, `learning_path_stages`, `virtual_labs`)
- Virtual classrooms: `join_session`/`leave_session` maintain
  `session_participants` and recompute `collaboration_sessions.participant_count`.
  Join key is `collaboration_sessions.session_id` (the logical id), not `id`.
- Learning paths: `update_learning_path_progress` marks a stage complete with a
  score and sets `adaptive_learning_paths.current_stage` = count of completed
  stages. `learning_path_stages` starts empty (no seed data).
- `virtual_labs` starts empty (no seed data) — `get_virtual_labs` returns nothing
  until labs are created.
- `get_arvr_content` derives the UI fields the component reads (`location_name`,
  `platform`, `model_format`, `estimated_duration_minutes`) from
  `arvr_content.metadata` (jsonb), so no table change was needed.

## What still needs real data / product decisions
1. **Outcome achievement** needs an SCO→assessment→grade mapping.
2. **Gamification anti-cheat** — move point awarding server-side.
3. **Seed data** for `virtual_labs`, `learning_path_stages`, `badges`,
   `leaderboards` (all start empty).
4. Re-run the snapshot queries in `scripts/audit-supabase-schema.mjs` (header
   comments) whenever the schema changes.
