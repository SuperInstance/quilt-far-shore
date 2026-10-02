### Flow Calculus — time-as-operator toolkit
- Definition: A registered set of operations over quilt-chrono ledgers — `diff(cell, dimension, window)`, `integrate(flow, t1, t2)`, `lag(a, b)` — computed as pure reductions over append-only flow entries. Each operation emits a new derived cell whose value is the integral/derivative quantity, not a stored event.
- Unlocks: Operators gain warmth velocity and accumulated urgency as first-class objects, like d/dt made rate-of-change an object; they can intervene on acceleration or accumulated drift, not just thresholds.
- Grows from: quilt-chrono projections; the delta is from point-in-time views to closed derivative/integral/lead-lag operators over the time dimension.
- Naive failure mode: Naive discrete differencing amplifies ledger jitter and late-arriving entries; a derivative cell oscillates under small write noise and triggers false interventions.

### Moment Field — continuous vector array
- Definition: A