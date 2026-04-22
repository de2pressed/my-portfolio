# Hotfix: Cursor Spinning Issue

## Production Symptom
The custom cursor was spinning around continuously when moving, instead of rotating in the direction of movement as intended.

## Root Cause
The rotation calculation in `updatePosition` used `Math.atan2(dy, dx)` to calculate target rotation based on movement direction. However, this created angle discontinuities when crossing from 180° to -180°, causing the cursor to spin wildly.

## Code Change
**File:** `components/ui/GlassCursor.tsx`

**Change:** Removed the rotation-based-on-movement logic from `updatePosition` function.

**Before:**
```javascript
// Calculate rotation based on movement direction
if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
  const targetRotation = Math.atan2(dy, dx) * (180 / Math.PI);
  rotation.current += (targetRotation - rotation.current) * 0.15;
}
```

**After:**
```javascript
// Calculate velocity for spring physics
const dx = pointer.current.x - prevX;
const dy = pointer.current.y - prevY;
pointer.current.vx = dx;
pointer.current.vy = dy;
```

## Why This Resolves the Symptom
Removing the problematic rotation logic eliminates the angle discontinuity issue. The cursor now uses spring physics for movement without rotation, which restores stable behavior.

## Known Limitations
The cursor no longer rotates based on movement direction. The rotation feature was intended to add organic feel but was not working correctly. The cursor still has:
- Spring physics trail with momentum
- Press animation (scale down + rotation on click)
- Color gradient trail based on position
- Hover state changes

## Applied
2025-04-22
