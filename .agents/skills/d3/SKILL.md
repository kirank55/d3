---
name: d3
description: Build interactive HTML UI mockups with dummy loading, error, and success states before implementation, then wire production code until the real success state is reached on the UI. Use when the user invokes /d3, asks for design-driven development, wants a visual pre-implementation gate between /to-tickets and /implement, or needs to visually digest a large spec, ticket, or pull request before writing or reviewing production code.
---
# Design-Driven Development

Design-Driven Development (`/d3`) is a visual pre-implementation gate that turns a ticket, spec, or large PR into a clickable HTML mockup with dummy states before production code is written, then drives implementation until the real success state is reached on the UI. It bridges the gap between `/to-tickets` and `/implement` so humans can validate behavior visually in seconds instead of parsing walls of prose or massive diffs.

## When to Use

- After `/to-tickets` and before `/implement`, when a ticket touches UI flows, asynchronous loading, or multi-step user feedback.
- When a spec, issue, or pull request is too large to hold in your head at once and needs a concrete visual state machine to review first.
- When you want UI-first acceptance criteria where dummy loading and dummy success messages act as the red-green target for implementation.
- Skip this skill for pure backend refactors, isolated utility functions, or bug fixes where `/diagnosing-bugs` or `/tdd` alone is faster.

## Steps

### 1. Load Domain Language and Scope the Slice

Read `GLOSSARY.md` if present so every button label, loading spinner message, error banner, and success toast uses the project's ubiquitous language rather than invented jargon. If given a ticket number or PR reference, check `docs/agents/issue-tracker.md` (or local ticket files) to pull the originating spec and blocking seams.

Write a single sentence at the top of your plan stating the exact user journey this mockup validates: what triggers the action, what the dummy loading state shows, and what exact success message proves the slice works.

### 2. Build the Mockup with Explicit Dummy States

Generate a self-contained, double-clickable HTML file (or a clearly marked sandboxed route matching the project's existing router) that runs with zero backend setup and keeps state in memory.

Include these four required states for the target flow:

1. **Idle / Initial:** The starting view with realistic domain data and density, never an empty placeholder page.
2. **Dummy Loading:** Simulated asynchronous feedback (spinners, optimistic rows, disabled buttons, progress text) triggered on action or via the state bar.
3. **Dummy Failure:** Validation and boundary error states showing how the UI recovers when an invariant fails.
4. **Dummy Success:** The exact target terminal UI state and confirmation message the user will see when the feature succeeds.

Add a floating bottom **D3 State Bar** that lets the reviewer jump directly to any state via one-click buttons or a `?d3_state=` URL parameter, alongside a "Play Happy Path" button that steps through Idle -> Dummy Loading -> Dummy Success with a short timer.

### 3. Tag the Implementation Contract

Mark every mocked interactive element and state container in the HTML with a `data-d3-contract` attribute describing the real seam that `/implement` must wire up later.

- Tag action triggers with the command or endpoint they will invoke, such as `data-d3-contract="submit-order-mutation"`.
- Tag the dummy loading view with the pending state source it depends on.
- Tag the dummy success message with the persisted domain event that makes it real, such as `data-d3-contract="order-persisted-success"`.

Keep pure state-transition logic separated from DOM wiring so `/implement` can carry the validated state model directly into production modules.

### 4. Gate on Human Sign-Off

Stop after the mockup is runnable and present it to the developer. Do not write production backend code, database migrations, or real API handlers before the human reviews the visual states.

Ask the developer to verify two things:

1. Does clicking through the dummy loading and success states match what this ticket or PR is supposed to do?
2. Are any edge-case states missing from the D3 State Bar?

If the developer spots a flaw in the flow, update the HTML mockup first. Changing a mockup takes seconds; changing a full-stack implementation takes hours.

### 5. Drive Implementation to Real Success

Once the developer approves the mockup, transition into `/implement` (using `/tdd` at each seam) to replace every `data-d3-contract` mock with real production code.

Work one vertical seam at a time:

1. Replace in-memory state transitions with the real domain module or API call.
2. Wire the real loading state to actual network or compute progress.
3. Wire the success state to verified persistence or real response data, removing the dummy timer and `data-d3-contract` scaffolding as each seam goes green.

Do not mark the work complete until driving the live application UI reaches the real success message through actual end-to-end execution. When finished, run `/code-review` and use the state transitions captured during `/d3` as the visual summary for `/pr`.

## Gotchas

- **Cheating the success state:** Never satisfy the success criteria by swapping a frontend `setTimeout` for a no-op API route that returns `{ ok: true }`. Real success means the underlying domain state actually changed and persisted.
- **Skipping the human gate:** Jumping straight from generating the HTML mockup into full-stack implementation defeats the purpose of `/d3`. Always pause for visual sign-off so the developer can digest the scope first.
- **Inventing new terminology in dummy copy:** Dummy messages like "Operation completed successfully" hide domain bugs. Use the exact terms from `GLOSSARY.md` so mismatches in the domain model surface immediately on screen.
- **Hardening the mockup before sign-off:** Do not add database connections, auth middleware, or test suites to the initial mockup phase. Keep Phase 2 fast and disposable until the human confirms the UI state machine is right.
EOF