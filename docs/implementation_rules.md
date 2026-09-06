# Implementation Rules

## Rule 1: Do not change existing behaviors

When making any change, all existing user-facing behaviors must be preserved unless the change explicitly requests modifying them.

This includes but is not limited to:
- Scroll behavior (auto-scroll on block selection, scroll position after filter changes)
- Data display logic (empty state vs. error state distinction)
- UI layout and spacing (spacers, fixed/sticky header offsets)
- Interaction patterns (tap targets, expand/collapse, modal dismiss)
- Data refresh intervals and cache timing
