# ElevenWinning Fast, Data-Complete, Fun MVP Plan

## Summary
Turn the current static prototype into a mobile-first football duel app where two players draft valid XIs, see stat-backed team strength instantly, and run a short arcade-style match simulation. The current build proves the loop, but it uses hardcoded players, summed ratings, native selects, no API, no cache, no season context, and no explainable model.

The plan is “Free First”: ship with a curated local Top 5 leagues dataset as the app’s source of truth, use API-Football Free only for validation/enrichment, and keep an upgrade path to API-Football Pro or Sportmonks once real coverage matters.

## Key Technical Decisions
- Keep dependencies minimal: static frontend plus Vercel serverless API routes only where secrets/caching are needed.
- Do not call any football API directly from the browser. API keys must live in Vercel env vars.
- Use API-Football first because its free plan exposes the relevant football endpoints, has 100 requests/day, and Pro is the cheapest paid upgrade at $19/month for 7,500 requests/day. Source: [API-Football pricing](https://www.api-football.com/).
- Challenge: API-Football Free cannot provide complete Top 5 league season-player coverage at runtime. Treat it as an enrichment/proof API, not the production data backbone.
- Keep Sportmonks as the quality upgrade path: richer player statistics and squad endpoints, but Starter is €29/month for 5 leagues and historical depth can require add-ons. Sources: [Sportmonks pricing](https://www.sportmonks.com/football-api/plans-pricing/), [player stats](https://docs.sportmonks.com/v3/tutorials-and-guides/tutorials/statistics/players-statistics).
- Do not use football-data.org for this MVP’s main data because it is better for fixtures/squads/person resources than full season player-stat modeling.

## Implementation Changes
- Replace the single `app.js` data blob with normalized modules: players, teams, leagues, seasons, formations, stat weights, and simulation rules.
- Add a local seed dataset for Top 5 leagues with at least: player id, name, team, league, position group, detailed role, age, nationality, image URL if available, minutes, appearances, goals, assists, cards, clean sheets, saves, goals conceded, shots, passes, tackles, season rating/proxy score, and freshness metadata.
- Add Vercel routes:
  - `/api/search?q=&position=&league=` returns cached player search.
  - `/api/player/:id` returns normalized player profile and stat card.
  - `/api/sync/api-football` is admin-only/manual for enrichment, never part of the normal user path.
- Store normalized JSON snapshots in repo for v1. Add a generated `data-meta.json` showing provider, season, last sync, missing fields, and confidence.
- Build a data validation script that fails when required fields are missing, player positions cannot map to formations, duplicate ids exist, or fewer than 11 valid players exist per major position group.
- Keep the app usable offline after first load via static JSON and browser cache; API failure must not block drafting or simulation.

## Product And UX
- Replace long native select grids with a mobile draft flow: Team A pick, Team B pick, quick filters, search, position tabs, and a compact bench-like selected XI panel.
- Use formation slots as touch targets, not form fields. Empty slot opens filtered player picker; filled slot shows player, score, form badge, and quick swap.
- Make “fun” come from the simulation layer: 10-15 second match timeline, momentum swings, key player moments, tactical mismatch callouts, and a replay/rematch button.
- Keep the result stat-backed: show win probability, expected score band, top 3 deciding factors, best player, weak link, and one “why this happened” sentence.
- Mobile-first layout: sticky score header, one-handed bottom action bar, no nested cards, fixed-size slot controls, no text overflow, no desktop-only interactions.
- Visual direction: energetic football-console interface, not an analytics dashboard. Fast, dense, tactile, with controlled motion and reduced-motion support.

## Simulation Model
- Replace simple summed ratings with position-aware team strength:
  - Attack: forwards + attacking mids, goals, assists, shots, conversion.
  - Midfield: passes, assists, tackles, minutes, rating.
  - Defense: defenders, tackles, cards penalty, clean sheets, conceded.
  - Keeper: saves, clean sheets, goals conceded.
  - Reliability: minutes and appearances prevent small-sample stars from dominating.
- Add formation effects: e.g. 4-3-3 boosts attack width, 3-5-2 boosts midfield control, 4-4-2 balances transitions.
- Add chemistry modifiers from same club/league/nationality, capped so data still matters more than stacking gimmicks.
- Probability uses a bounded logistic model with randomness only in the animated timeline, not in the displayed underlying probability.
- Store every model weight in one config object so tuning is transparent and testable.

## Performance Plan
- Target first load under 150 KB JS before images; no framework unless the UI complexity later proves it necessary.
- Lazy-load player images and defer detailed player stats until a player card opens.
- Pre-index search data into a compact JSON shape: lowercase name tokens, position, team, league, score.
- Use event delegation instead of hundreds of per-element listeners.
- Avoid runtime API calls during normal draft; all draft/search interactions must be local and instant.
- Cache Vercel API responses with long `s-maxage` for static season data and short/manual revalidation for sync endpoints.

## Test Plan
- Unit-test formation validity: exact 11 players, one GK, correct DEF/MID/FWD counts, no duplicates across a team.
- Unit-test stat normalization: missing values default safely, per-90 fields avoid divide-by-zero, position mappings are deterministic.
- Unit-test simulation: stronger team generally receives higher probability, probability stays between 5% and 95%, chemistry/formation caps cannot dominate raw stats.
- Data tests: fail build if required Top 5 seed coverage drops below agreed thresholds.
- Mobile browser tests: 375px and 430px widths for draft, picker, result timeline, reduced motion, long names, image failures, offline mode.
- API tests: Vercel routes hide provider keys, return normalized JSON, respect cache headers, and degrade to local seed data.

## Assumptions And Defaults
- First version is French UI, matching the current prototype.
- “Free First” means complete-feeling product data through curated local seed data, not complete live Top 5 coverage from a free API.
- API-Football Free is used for validation/enrichment; paid upgrade is API-Football Pro unless data quality forces Sportmonks Starter.
- Deployment target is Vercel.
- No database in v1. Use static JSON snapshots plus Vercel route caching; add a database only when user accounts, leaderboards, or live sync frequency require it.
