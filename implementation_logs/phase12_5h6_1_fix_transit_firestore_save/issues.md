# Phase 12.5H-6.1 Fix Transit Firestore Save — Issues

## Resolved

### Issue 1: transit still blocked in routesClient.ts
- **Symptom**: Any transit call to computeRouteSegment threw "transit is not implemented yet"
- **File**: firebase/functions/src/route/routesClient.ts:73-77
- **Fix**: Removed throw block, added `transit: 'TRANSIT'` to TRAVEL_MODE_MAP

### Issue 2: transit blocked in routeFunctions.ts (global mode)
- **Symptom**: `throw new HttpsError('unimplemented', ...)` before premium/quota checks
- **File**: firebase/functions/src/route/routeFunctions.ts:297-303
- **Fix**: Replaced with `console.info` debug log

### Issue 3: transit skipped in routeFunctions.ts (mixed mode)
- **Symptom**: `if (segTravelMode === 'transit') { skippedCount++; continue; }`
- **File**: firebase/functions/src/route/routeFunctions.ts:393-399
- **Fix**: Removed skip block

### Issue 4: routeSummary: undefined causes Firestore save failure
- **Symptom**: "Cannot use 'undefined' as a Firestore value (found in field 'routeSummary')"
- **Root cause**: Transit routes don't return `routes.description`; value is undefined
- **File**: firebase/functions/src/route/routeFunctions.ts:463
- **Fix**: `removeUndefinedFields()` applied to docData; `routes.description` excluded from transit FieldMask

### Issue 5: distanceMeters/durationSeconds could be undefined in Firestore
- **Symptom**: Latent risk — if Routes API doesn't return these, undefined would be saved
- **Fix**: routesClient.ts now only sets these in result if not undefined; removeUndefinedFields also catches any remaining cases

## Open

### Transit route quality without departure time (MITIGATED)
- Without a specific departure time, transit routing uses "now"
- Real trips happened in the past, so transit routing may not be realistic
- **Status**: Acceptable for MVP; future phase can add departure time picker

### Transit polyline may be empty for some routes
- If transit route between two points doesn't exist, API returns no routes
- **Status**: Handled by "no routes" error → falls to failed segment → gray dashed fallback
