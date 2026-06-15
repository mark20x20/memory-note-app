# Phase 12.5H-6.2 Fix Mixed Route Segment Reload — Decisions

## Root Cause

Firebase callable functions serialize `{ travelMode: undefined }` differently from `JSON.stringify`:
- `JSON.stringify({ travelMode: undefined })` → `"{}"` (key dropped)
- Firebase callable SDK → `{ travelMode: null }` (undefined becomes null)

In `getNoteRouteSegments` Cloud Function:
```ts
if (data.travelMode !== undefined && !VALID_TRAVEL_MODES.includes(...)) {
  throw HttpsError('invalid-argument', ...)
}
```
`null !== undefined` → true, `!VALID_TRAVEL_MODES.includes(null)` → true → throws!

This happened because:
1. `loadRouteSegments(noteId)` was called with no `mode` argument (for mixed mode)
2. Which passed `{ noteId, travelMode: undefined }` to `getNoteRouteSegmentsCallable`
3. Firebase SDK turned `undefined` → `null` on the wire
4. Cloud Function rejected `null` as invalid travelMode

## Fixes Applied

### 1. `LoadRouteEffectiveMode` type (map.tsx)
Added explicit type: `'walking' | 'driving' | 'transit' | 'mixed'`
- Makes the intent clear and prevents passing `routeMode`, `'straight'`, `'premium'` etc.
- `loadRouteSegments` now requires `effectiveMode` (non-optional)

### 2. `loadRouteSegments` refactored (map.tsx)
- `'mixed'` → calls `getNoteRouteSegmentsCallable({ noteId })` (no travelMode key)
- Other modes → calls with `{ noteId, travelMode: effectiveMode }`
- Logs: `[map] loadRouteSegments effectiveMode=mixed`, `[map] getNoteRouteSegments final input`

### 3. Call sites updated (map.tsx)
- `handleGenerateRoutes` mixed branch: `loadRouteSegments(noteId, 'mixed')`
- `handleGenerateRoutes` single branch: `loadRouteSegments(noteId, premiumTravelMode)`
- useEffect mixed branch: `loadRouteSegments(noteId, 'mixed')`
- useEffect single branch: `loadRouteSegments(noteId, premiumTravelMode)`

### 4. Payload sanitizer (routeFunctionsClient.ts)
Added `VALID_SEGMENT_TRAVEL_MODES` constant and explicit payload building:
- Only includes `travelMode` if it's one of `['walking', 'driving', 'transit']`
- Prevents `null` / `undefined` / `'mixed'` / `'straight'` from ever reaching the function
- Added `[routeFunctionsClient] getNoteRouteSegments payload` debug log

### 5. Defensive null handling (routeFunctions.ts)
Updated validation to treat `null`, `undefined`, `''` as "no filter":
```ts
if (rawTravelMode !== undefined && rawTravelMode !== null && rawTravelMode !== '' && !VALID_TRAVEL_MODES.includes(...)) {
  throw HttpsError('invalid-argument', ...)
}
```
Defense-in-depth: even if the client sends null, it won't throw.

### 6. Log name fixed (map.tsx)
`[map] transit selected` → `[map] premium mode selected`
Reason: the log was fired for ALL modes (walking, driving, transit), making it confusing.
