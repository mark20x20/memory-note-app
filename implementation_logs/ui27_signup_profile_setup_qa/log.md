# UI-27: Sign-up / Profile Setup Flow QA

**Branch**: phase-ui27-signup-profile-setup-qa  
**Date**: 2026-06-27  
**Goal**: Verify new-user registration flow from account creation to Home; fix any blocking issues with minimal changes.

---

## Flow Overview

```
login.tsx 笏笏"譁ｰ隕冗匳骭ｲ"笏笏笆ｺ sign-up.tsx 笏笏signUp()笏笏笆ｺ profile-setup.tsx 笏笏createUser()笏笏笆ｺ home.tsx
```

### Full routing logic
| Screen | Auth guard |
|--------|-----------|
| `index.tsx` | `loading` 竊・spinner; `signedIn` 竊・home; `needsProfileSetup` 竊・profile-setup; else 竊・onboarding |
| `(auth)/_layout.tsx` | `signedIn` 竊・redirect home (prevents returning to auth screens) |
| `(app)/_layout.tsx` | `loading` 竊・spinner; `!signedIn` 竊・redirect onboarding |

---

## Files Reviewed

| File | Status |
|------|--------|
| `app/(auth)/sign-up.tsx` | OK 窶・errors go through `mapAuthError` (Japanese) |
| `app/(auth)/profile-setup.tsx` | **BUG FIXED** (see below) |
| `app/(auth)/login.tsx` | OK |
| `app/(auth)/_layout.tsx` | OK |
| `app/index.tsx` | OK |
| `src/core/auth/AuthContext.tsx` | **MODIFIED** 窶・added `useRefreshAuth` |
| `src/core/repositories/authRepository.ts` | OK 窶・uses `mapAuthError` |
| `src/core/repositories/userRepository.ts` | OK |
| `src/shared/errors/authErrors.ts` | OK 窶・all Firebase error codes mapped to Japanese |

---

## Critical Bug Fixed

### Problem: profile-setup 竊・home broken by auth state mismatch

**Root cause**: After `userRepository.createUser()` writes to Firestore, `onAuthStateChanged` does NOT re-fire (it only fires on Firebase Auth state changes, not Firestore writes). So `AuthContext.state` stays `needsProfileSetup`.

When `profile-setup.tsx` called `router.replace('/(app)/home')`, the app layout rendered:
```tsx
// (app)/_layout.tsx
if (authState.status !== 'signedIn') {
  return <Redirect href="/(auth)/onboarding" />;  // 竊・immediate redirect back!
}
```

The user was redirected away from home immediately, making the sign-up flow completely non-functional.

**Fix**:

1. **`src/core/auth/AuthContext.tsx`** 窶・Added `AuthRefreshContext` + `useRefreshAuth` hook:
   - `refreshUser()`: reads `auth.currentUser`, re-fetches the Firestore user doc, transitions state to `signedIn` (or `needsProfileSetup` on failure)
   - Exposed via a separate context so `useAuth()` return type (`AuthState`) is unchanged
   - `useCallback` with `[]` deps ensures stable function reference

2. **`app/(auth)/profile-setup.tsx`** 窶・Added `await refreshAuth()` before navigation:
   ```tsx
   await userRepository.createUser(uid, email, displayName.trim());
   await refreshAuth();          // transition AuthContext to signedIn
   router.replace('/(app)/home'); // (app)/_layout.tsx now allows through
   ```

**Corrected flow**:
1. sign-up.tsx 竊・`authRepository.signUp()` 竊・Firebase creates user
2. `router.replace('/(auth)/profile-setup')` 窶・explicit navigation (before onAuthStateChanged settles)
3. profile-setup.tsx renders; onAuthStateChanged eventually fires 竊・`needsProfileSetup`
4. User sets displayName 竊・`userRepository.createUser()` 竊・Firestore doc created
5. `refreshAuth()` 竊・re-fetches user doc 竊・`AuthContext.state = signedIn`
6. `router.replace('/(app)/home')` 竊・`(app)/_layout.tsx` sees `signedIn` 竊・renders home 笨・
---

## Non-blocking Observations (not fixed)

| Issue | Severity | Notes |
|-------|----------|-------|
| `SafeAreaView` from `react-native` (not `react-native-safe-area-context`) in sign-up.tsx, login.tsx, profile-setup.tsx | Minor visual | May cause inset issues on notched devices. Not a functional regression; all three auth screens are consistent with each other. |
| Auth screens use raw hex colors (`#4A90D9`) instead of warm theme `colors.primary` | Cosmetic | Auth screens have their own blue-toned branding, separate from the app's warm coral palette. Intentional design choice. |

---

## tsc Result

Exit 0 窶・no type errors.

---

## Changed Files

- `src/core/auth/AuthContext.tsx` 窶・Added `AuthRefreshContext`, `useRefreshAuth`, `refreshUser`
- `app/(auth)/profile-setup.tsx` 窶・Import `useRefreshAuth`; call `await refreshAuth()` before navigate
