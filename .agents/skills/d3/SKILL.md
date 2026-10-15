---
name: d3
description: Build interactive HTML UI mockups with ticket-linked dummy states before implementation, then wire production code until the real success state survives a page reload. Use when the user invokes /d3, asks for design-driven development, wants a visual pre-implementation gate between /to-tickets and /implement, or needs to visually digest a large spec, ticket, or pull request before writing or reviewing production code.
---
# Design-Driven Development

Design-Driven Development (`/d3`) is a visual pre-implementation gate that turns a ticket, spec, or large PR into a clickable HTML mockup with ticket-linked dummy states before production code is written, then drives implementation until the real success state is reached and persists across a page reload. It sits between `/to-tickets` and `/implement`, letting a human enter a complex spec through the UI.

## When to Use

- After `/to-tickets` and before `/implement`, when a ticket touches UI flows, asynchronous loading, or multi-step user feedback.
- When a spec, issue, or pull request is too large to hold in your head at once and needs a concrete visual state machine linked back to ticket IDs.
- When you want UI-first acceptance criteria where dummy loading and dummy success messages act as the red-green target for implementation.
- Skip this skill for pure backend refactors, isolated utility functions, or bug fixes where `/diagnosing-bugs` or `/tdd` alone is faster.

## Steps

### 1. Load Domain Language, Map Tickets, and Enumerate States

Read `GLOSSARY.md` if present so every button label, loading message, error banner, and success toast uses the project's ubiquitous language. Check `docs/agents/issue-tracker.md` (or local ticket files) to pull the originating spec and ticket IDs.

Before writing any HTML, output a concise summary containing:

1. **User Journey:** A single sentence stating what triggers the action, what the loading state shows, and what persisted outcome proves the slice works.
2. **Discovered State List:** Must include **at least** the four baseline states (**Idle**, **Dummy Loading**, **Dummy Failure**, **Dummy Success**), plus any additional states required by the flow—such as **Empty**, **Partial / Degraded**, or **Permission-Denied**—with each state mapped to its ticket or spec ID (e.g., `T-12`, `T-13`).

**Done when:** every discovered state carries a ticket or spec ID, and the four baseline states are present.

### 2. Build the Mockup with Linked Dummy States

Generate a self-contained, double-clickable HTML mockup (or sandboxed route) that runs with zero backend setup and keeps state in memory.

- **Single-screen slices:** Use a single HTML file containing all discovered states.
- **Multi-screen slices:** When a slice spans several screens, generate one HTML file per screen (linked via standard navigation) that loads a shared **D3 State Bar** script, or house the screens in a single file with explicit screen-switching tabs alongside the state bar.

Render a floating bottom **D3 State Bar** across all screens that includes:

1. **State Buttons & URL Sync:** One-click buttons (and `?d3_state=` query param support) for every state listed in Step 1, plus a "Play Happy Path" button that steps through the flow on a short timer.
2. **Live Ticket Inspector:** When a reviewer clicks a state in the bar, read the active container's `data-d3-ticket` attribute and display the linked ticket IDs and summary right inside the state bar so the reviewer sees which part of the spec that UI state satisfies.

**Done when:** every state from Step 1 is reachable from the D3 State Bar in the running mockup.

### 3. Tag the Implementation Contract

Mark every state container, interactive trigger, and dynamic status node with three explicit `data-d3-*` attributes so `/implement` knows exactly what to wire up:

- `data-d3-state`: The state identifier controlled by the D3 State Bar.
- `data-d3-ticket`: Comma-separated ticket or spec IDs covered by that state.
- `data-d3-contract`: The real mutation, query, or persisted domain event that must replace the mock during implementation.

Follow this pattern in your HTML:

```html
<section data-d3-state="dummy-loading" data-d3-ticket="T-12,T-13" hidden>
  <button disabled data-d3-contract="submit-invoice-batch">Uploading 3 of 12 invoices...</button>
</section>
<section data-d3-state="dummy-success" data-d3-ticket="T-13" hidden>
  <p role="status" data-d3-contract="invoice-batch-persisted">12 invoices queued for settlement.</p>
</section>
```

Keep the state-transition logic separated from DOM wiring so `/implement` can carry the validated state model straight into production modules.

**Done when:** every state container, trigger, and status node carries all three `data-d3-*` attributes.

### 4. Gate on Human Sign-Off

Stop once the mockup is runnable and present it to the developer. Do not write production backend code, migrations, or real API handlers before the human reviews the visual states.

Ask the developer to verify two things:

1. Does clicking through the dummy loading and success states match what this ticket or PR is supposed to do?
2. Are any edge-case states missing from the D3 State Bar?

If the developer spots a flaw, correct the HTML mockup first. Changing a mockup takes seconds; changing a full-stack implementation takes hours.

**Done when:** the developer has answered both questions and approved the state machine.

### 5. Drive Implementation to Real Success

Transition into `/implement` (using `/tdd` at each seam) and replace every `data-d3-contract` mock with real production code, one vertical seam at a time:

1. Replace in-memory state transitions with the real domain module or API call.
2. Wire the dummy loading state to actual network or compute progress.
3. Wire the dummy success state to verified persistence or real response data, removing the dummy timer and `data-d3-contract` scaffolding as each seam goes green.

Then run `/code-review` and reuse the states captured during `/d3` as the visual summary for `/pr`.

**Done when:** driving the live application UI from a real trigger reaches the real success message **and it still shows after a full page reload**. A success state propped up by a dummy timer or a no-op route is not done.

## Gotchas

- **Cheating the success state:** Never satisfy the criteria by swapping a frontend `setTimeout` for a no-op route returning `{ ok: true }`. Real success means the underlying domain state actually changed and persisted.
- **Skipping the human gate:** Jumping straight from the mockup into full-stack implementation defeats the point of `/d3`. Pause for visual sign-off so the developer digests the scope first.
- **Inventing terminology in dummy copy:** Copy like "Operation completed successfully" hides domain bugs. Use the exact `GLOSSARY.md` terms so model mismatches surface on screen.
- **Hardening the mockup before sign-off:** Keep the mockup phase fast and disposable. Add no database connections, auth middleware, or test suites until the human confirms the state machine is right.
