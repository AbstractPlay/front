# Play page browser zoom (manual verification)

Automated coverage lives in `src/lib/viewport.test.js`, `src/components/GameMove/MoveTreeMobileChrome.test.js`, and `src/lib/GameMove/playMobileOrder.test.js`. Before release, spot-check the play page against WCAG **1.4.4** (200% zoom) and **1.4.10** (320px-equivalent reflow) on a real in-progress game.

## When to run

After changes to play layout CSS, `viewport.js`, `MoveTreeMobileChrome`, or Classic mobile card order.

## Layouts

Exercise each URL query: `?layout=classic`, `strip`, `live`, `card`, `narrative`.

## 1.4.4 — 200% browser zoom

1. Window ~1280px wide (or a typical laptop size).
2. Set browser zoom to **200%** (or equivalent pinch on macOS Chrome).
3. Confirm without assistive technology:
   - Status / whose turn is visible (or reachable in a drawer).
   - Move entry is visible and submittable when legal.
   - Board is visible (vertical scroll OK).
   - Line navigation works (move list or mobile stepper when narrow layout width).

**Desktop pinch on a wide window:** Classic should stay on **three-column** layout (not card mode); fixed bottom stepper should **not** appear.

## 1.4.10 — reflow (~320px width)

**Method A:** 1280px viewport, **400%** zoom. **Method B:** DevTools responsive mode **320px** width at 100% zoom.

On **true narrow** width (320px), Classic uses stacked cards; stepper may appear—content above the fixed bar should remain reachable via vertical scroll (shell bottom padding).

Confirm move-entry chrome does not require horizontal scrolling; board may scroll in two dimensions inside the board area.

## Debug signals

In the console on the play page:

- `innerWidth`
- `visualViewport.width`, `visualViewport.scale`
- Layout width for play breakpoints: `readLayoutViewportWidth()` in `src/lib/viewport.js`.

**DevTools responsive mode:** `innerWidth` can stay **wider** than `visualViewport.width` (e.g. 755 vs 320). Play layout width follows **320**, so the mobile stepper **mounts**, but a plain `position: fixed; bottom: 0` bar can sit on the **layout** viewport and appear missing until pinned to the visual viewport (`src/lib/visualViewportFixedChrome.js`, used by `MoveTreeMobileStepper`).

## Related code

| Area | Location |
|------|----------|
| Layout width / page zoom | `src/lib/viewport.js` |
| Mobile stepper gate | `src/components/GameMove/MoveTreeMobileChrome.js` |
| Stepper visual-viewport pin | `src/lib/visualViewportFixedChrome.js` |
| Classic column reflow | `src/index.css` (`.game-move-classic-columns`) |
| Classic card section order | `src/lib/GameMove/playMobileOrder.js` |
