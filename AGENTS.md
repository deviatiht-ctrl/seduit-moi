# Project verification

- This is a static HTML/CSS/JavaScript site using the Supabase browser SDK. There is no package manifest or build step.
- Run multiplayer regression tests and changed-script syntax checks from the repository root with `node --test tests/online.test.cjs`. Tests use built-in Node modules and mocked Supabase clients; they do not connect to the live database.
- Run `git diff --check` before finishing changes.
- After deploying multiplayer changes, verify with two separate browser profiles/accounts: invite and join, host game selection, a guest arriving after game selection, refresh/reconnection, and partner presence during page navigation.
- Database scripts are in `supabase/`. Review migrations before applying them; local mock tests do not validate the live Supabase schema, permissions, or Realtime configuration.
- `sw.js` caches JavaScript assets cache-first. Bump `CACHE_NAME` when shipping updated scripts so clients replace cached assets.
