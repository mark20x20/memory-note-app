# Phase 12.5H-6.1 Fix Transit Firestore Save — Decisions

## Root Cause (3 layers)

### Layer 1: routesClient.ts — transit throw still present
- `TRAVEL_MODE_MAP` only covered walking/driving
- Explicit `throw new Error('[computeRouteSegment] transit is not implemented yet')` blocked all transit calls
- **Fix**: Added `transit: 'TRANSIT'` to TRAVEL_MODE_MAP, removed throw block

### Layer 2: routeFunctions.ts — transit blocked at two points
1. Global mode: `throw new HttpsError('unimplemented', ...)` before premium check
2. Per-segment mode: `if (segTravelMode === 'transit') { skippedCount++; continue; }`
- **Fix**: Removed both blocks; global mode now logs transit with `console.info`

### Layer 3: Firestore save — undefined fields rejected
- `routeSummary: routeResult.routeSummary` is `undefined` for transit (API doesn't return `routes.description` for TRANSIT)
- Firestore throws: "Cannot use 'undefined' as a Firestore value (found in field 'routeSummary')"
- **Fix**: Added `removeUndefinedFields()` helper, applied to success docData
- **Also fixed**: `distanceMeters` and `durationSeconds` are now conditionally set in routesClient.ts return value

## Design Decisions

### removeUndefinedFields placement
Placed in routeFunctions.ts (not routeCache.ts) because:
- routeCache.ts is a pure utility with no Firestore write operations
- The save logic is in routeFunctions.ts
- Applied at the docData construction level, close to the `segRef.set()` call

### transit FieldMask
For TRANSIT, `routes.description` is excluded from the FieldMask:
- Reason: TRANSIT routes don't have a road name description
- Including it would return an undefined value (or cause an error)
- Result: `routeSummary` is not included in transit segments (correct behavior)

### departureTime for transit
Added `departureTime: new Date().toISOString()` for transit requests:
- Without this, Google Routes API may return ZERO_RESULTS for transit
- Current time is used as departure time (next available transit)

### failed segment cache behavior
`isRouteSegmentStale()` in routeCache.ts already returns `true` for `status === 'failed'`:
- No change needed — failed transit segments are automatically regenerated on next call
- Added `errorMessage` to failed documents for debugging

### routesClient.ts return value
Changed from direct property assignment to conditional setting:
- `distanceMeters`, `durationSeconds`: set only if not undefined
- `routeSummary`: set only if `route.description` is not undefined
- `warnings`: always `[]` if not an array
- This ensures `ComputeRouteSegmentResult` never contains `undefined` values
