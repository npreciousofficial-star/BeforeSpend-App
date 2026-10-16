# 🚫 ZERO FAKE FALLBACKS, ZERO MOCKS, & REAL ERROR HANDLING

## 1. NEVER MAKE THINGS UP OR ASSUME THINGS
- All data, user accounts, authentication states, and financial transactions must represent authentic, verifiable truth from the backing database and auth provider.
- Never invent mock users, mock responses, or pretend that a failed operation succeeded.

## 2. STRICT PROHIBITION OF FAKE FALLBACKS & GHOST SESSIONS
- Never create fake fallback users (e.g. `google.user@gmail.com` or local pseudo-UUIDs) when Supabase Auth, Google OAuth, or any API fails.
- Never generate a client-side user ID to let a user bypass authentication when cloud registration fails.
- If registration, sign-in, or OAuth fails, the system must halt the flow, retain the user on the login/register screen, and display the exact, honest error to the user.

## 3. REAL ERROR TRANSPARENCY
- Never swallow errors with silent `catch (err) { console.warn(...) }` or return fake success indicators.
- Real errors from Supabase (e.g., "Email not confirmed", "User already registered", "Invalid login credentials", "Password must be at least 8 characters", "Database permission denied") must be bubbled up and presented directly to the user in a clear, readable UI notice.
- If email confirmation is required by Supabase, the user must be explicitly informed: "Registration successful. Please check your email to verify your account before logging in."

## 4. SINGLE AUTHORITATIVE SOURCE OF AUTH TRUTH
- The backing authentication provider (`supabase.auth`) is the sole authority for whether a user is logged in.
- The app must never maintain a ghost `currentUserId` in `localStorage` when no valid session exists in `supabase.auth`.
- If an auth token expires or session becomes invalid, the platform must cleanly transition to the login view with an informative message, rather than silently running with null credentials that fail database queries.

## 5. MANDATORY 4PX BORDER RADIUS SPECIFICATION
- All cards, borders, buttons, pills, toggles, badges, inputs, selects, modals, and interactive surfaces MUST have a border-radius of strictly 4px (`rounded` / `4px`).
- Never use rounded-lg (8px), rounded-xl (12px), rounded-2xl (16px), or rounded-full for cards, buttons, pills, badges, or toggle switches.
- Every container, border, button, pill, and toggle in the system must conform to this 4px standard.

