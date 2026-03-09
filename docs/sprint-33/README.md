# Sprint 33: User Profile — Supabase-backed, localStorage Removed

## Executive Summary

Sprint 33 eliminates the last significant data persistence anti-pattern in the app: `UserProfile.tsx` was reading and writing to `localStorage` with hardcoded placeholder data ("John Doe", "john.doe@safetyhub.com"). The user profile now loads from and saves to the `profiles` table via Supabase, using the authenticated user's real identity.

---

## Changes

### `src/services/profileService.ts` — Two new methods

**`getExtendedProfile(): Promise<ExtendedProfile | null>`**
- Calls `supabase.auth.getUser()` to get the authenticated session
- Queries `profiles` table for `full_name, title, phone, location, avatar_url, role, organization_id`
- Falls back to `user.user_metadata` if the profile row doesn't exist yet (new users on first login)
- Returns null if no session

**`updateProfile(updates: ProfileUpdates): Promise<void>`**
- Calls `supabase.auth.getUser()` to validate session
- Updates the `profiles` row with snake_case columns (`full_name`, `title`, `phone`, `location`, `avatar_url`, `updated_at`)
- Throws on DB error or unauthenticated state

### `src/pages/UserProfile.tsx` — Complete rewrite

| Before | After |
|---|---|
| `localStorage.getItem('safety_suite_user_profile')` | `profileService.getExtendedProfile()` on mount |
| `localStorage.setItem(...)` on save | `profileService.updateProfile(...)` on save |
| Hardcoded "John Doe" / "john.doe@safetyhub.com" | Real user email from auth; empty defaults for editable fields |
| Email field was editable | Email field is read-only (auth-owned) |
| Hardcoded avatar URL (Unsplash) | Fallback to User icon if no avatar; supports file upload |
| No loading/saving states | Loading spinner on mount; Save button shows spinner + disabled during save |
| Title was a locked dropdown | Title is a free-text input (roles vary) |

### `src/test/profileService.test.ts` — New, 6 tests

| Test | Assertion |
|---|---|
| `getExtendedProfile` — row exists | Returns mapped profile with correct field names |
| `getExtendedProfile` — row not found | Falls back to user_metadata |
| `getExtendedProfile` — unauthenticated | Returns null |
| `updateProfile` — success | Calls `supabase.from().update()` with snake_case columns |
| `updateProfile` — DB error | Throws with error message |
| `updateProfile` — unauthenticated | Throws "Not authenticated" |

---

## Exit Criteria

- ✅ `getExtendedProfile()` and `updateProfile()` implemented in profileService
- ✅ `UserProfile.tsx` loads real data from Supabase on mount
- ✅ `UserProfile.tsx` saves to Supabase profiles table (no localStorage)
- ✅ Email is read-only (auth-owned, not editable via profile form)
- ✅ Loading and saving states communicated with spinners
- ✅ 350 unit tests pass, zero TypeScript errors in modified files
