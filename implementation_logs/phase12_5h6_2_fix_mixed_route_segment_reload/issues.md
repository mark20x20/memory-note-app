# Phase 12.5H-6.2 Fix Mixed Route Segment Reload — Issues

## Resolved

### Issue 1: Firebase callable serializes undefined as null
- **Symptom**: `WARN [map] loadRouteSegments error: {"code":"functions/invalid-argument","message":"travelMode が不正です"}`
- **Root cause**: `{ travelMode: undefined }` → Firebase SDK → `{ travelMode: null }` on the wire
- **Fix**: `routeFunctionsClient.ts` now builds payload without `travelMode` key for mixed mode; `routeFunctions.ts` handles null defensively

### Issue 2: loadRouteSegments signature allowed ambiguous call
- **Symptom**: `loadRouteSegments(noteId)` (no mode arg) looked like "mixed mode" but was ambiguous
- **Root cause**: `mode?: PremiumRouteTravelMode` — omitting = undefined = serialized as null
- **Fix**: Changed to required `effectiveMode: LoadRouteEffectiveMode` — 'mixed' is explicit

### Issue 3: Misleading log name
- **Symptom**: `[map] transit selected {"mode": "driving"}` in logs
- **Root cause**: Log was named "transit selected" but fired for all premium mode selections
- **Fix**: Renamed to `[map] premium mode selected`

## Open

None known.
