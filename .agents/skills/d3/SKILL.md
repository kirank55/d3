---
name: d3
description: Build interactive HTML UI mockups with ticket-linked dummy states before implementation, then wire production code until the real success state survives a page reload. Use when the user invokes /d3, asks for design-driven development, wants a visual pre-implementation gate between /to-tickets and /implement, or needs to visually digest a large spec, ticket, or pull request before writing or reviewing production code. Not the D3.js visualization library.
---
# Design-Driven Development

Design-Driven Development (`/d3`) is a visual pre-implementation gate that turns a ticket, spec, or large PR into a clickable HTML mockup with ticket-linked dummy states before production code is written, then drives implementation until the real success state is reached and persists across a page reload. It sits between `/to-tickets` and `/implement`, letting a human enter a complex spec through the UI.

A slice is one user-facing outcome. Steps 1–4 build an in-memory mockup of that slice. Step 5 is the only step that persists data; the reload check belongs there.

## When to Use

- After `/to-tickets` and before `/implement`, when a ticket touches UI flows, asynchronous loading, or multi-step user feedback.
- When a spec, issue, or pull request is too large to hold in your head at once and needs a concrete visual state machine linked back to ticket IDs.
- When you want UI-first acceptance criteria where dummy loading and dummy success messages act as the red-green target for implementation.
- Skip this skill for pure backend refactors, isolated utility functions, or bug fixes where `/diagnosing-bugs` or `/tdd` alone is faster.
- Skip this skill for D3.js charts and other data-visualization work.

## Files

- Write the mockup to `mockups/<slice-slug>.html`. Use one file. When the slice has several screens, wrap each screen in `<section data-d3-screen="kebab-name">` inside that file. The copied script adds one tab per screen; do not add a second tab strip. State ids may repeat across screens (each screen can have its own `idle`); do not repeat a state id within one screen.
- Copy [state-bar.js](state-bar.js) to `mockups/state-bar.js` unchanged and load it with `<script src="state-bar.js"></script>` at the end of `<body>`. Do not rewrite the bar, and do not add a second state switcher.
- Use a sandboxed app route only when the user asks to review the mockup inside the existing app.
- The mockup is a reference spec, not code that grows into production. Keep `mockups/` until the PR merges so `/pr` can reuse it. Neither the mockup nor the state bar ships.

## Steps

### 1. Load Domain Language, Map Tickets, and Enumerate States

Read `GLOSSARY.md` if present so every button label, loading message, error banner, and success toast uses the project's ubiquitous language. If it is absent, use the nouns already written in the ticket. Check `docs/agents/issue-tracker.md` (or local ticket files) to pull the originating spec and ticket IDs. When the source has no ticket IDs, use an existing reference instead: the PR number (`PR-482`) for a pull request, or the spec heading anchor (`spec#retry-policy`) for a spec. If none of these exist, ask before writing HTML. Do not invent IDs.

Before writing any HTML, output a concise summary containing:

1. **User Journey:** A single sentence stating what triggers the action, what the loading state shows, and what durable outcome proves the slice works: the persisted record for a write, or, for a read-only slice (search, filter, report), the result reproduced from real data by reloading the same URL.
2. **Discovered State List:** Must include **at least** the four baseline states (**Idle**, **Dummy Loading**, **Dummy Failure**, **Dummy Success**), plus any additional states required by the flow—such as **Empty**, **Partial / Degraded**, or **Permission-Denied**—with each state mapped to its ticket, PR, or spec ID (e.g., `T-12`, `PR-482`) and a one-line summary copied from that source.

State ids are kebab-case: `idle`, `dummy-loading`, `dummy-failure`, `dummy-success`. Write happy-path containers in that journey order.

**Done when:** every discovered state carries a real ticket, PR, or spec ID and a one-line summary, and the four baseline states are present.

### 2. Build the Mockup with Linked Dummy States

Generate one self-contained HTML file that runs with zero backend setup. Dummy state stays in memory for this phase. Persistence is step 5.

The copied state bar:

1. Renders one button per distinct `data-d3-state` id, plus **Play Happy Path**. When the mockup has screens, it also renders one tab per `data-d3-screen`.
2. Syncs the visible state to `?d3_state=<id>` (plus `&d3_screen=<name>` when the mockup has screens) on load and on click. A state button prefers the current screen's container and switches screens only when the current screen lacks that state.
3. Plays the happy path at 800ms per step, in document order: `idle`, then `dummy-loading`, then `dummy-success`, plus any other container marked `data-d3-happy`. With screens, it walks each screen's happy path in turn. It skips `dummy-failure` unless that container is explicitly marked `data-d3-happy`.
4. Fills the ticket inspector from the active container's `data-d3-ticket` and `data-d3-summary`.

**Done when:** every state from Step 1 is reachable from the bar and from its `?d3_state=` URL (with `d3_screen` when screens exist), every screen tab opens its own screen, Play Happy Path walks the happy path in order and does not stop on Dummy Failure, and the inspector shows that state's ticket IDs and summary.

### 3. Tag the Implementation Contract

State metadata goes on the state container. The contract goes on the inner trigger or status node that `/implement` must replace. Never put `data-d3-contract` on a state container.

On each state container:

- `data-d3-state`: kebab-case id from Step 1. Do not nest this attribute.
- `data-d3-ticket`: comma-separated ticket or spec IDs.
- `data-d3-summary`: the one-line summary from Step 1.
- `data-d3-happy`: only on extra happy-path states. Leave it off `dummy-failure`.

On each trigger or status node that implementation must replace:

- `data-d3-contract`: kebab-case name of the real mutation, query, or persisted domain event (`submit-invoice-batch`, `invoice-batch-persisted`).

Follow this pattern. The ticket IDs in it are a pattern; generated mockups use real IDs only.

```html
<section data-d3-state="idle" data-d3-ticket="T-12" data-d3-summary="Submit a batch of invoices." hidden>
  <button data-d3-contract="submit-invoice-batch">Submit 12 invoices</button>
</section>
<section data-d3-state="dummy-loading" data-d3-ticket="T-12,T-13" data-d3-summary="Show upload progress while the batch is accepted." hidden>
  <p role="status" data-d3-contract="invoice-batch-progress">Uploading 3 of 12 invoices...</p>
</section>
<section data-d3-state="dummy-failure" data-d3-ticket="T-14" data-d3-summary="Reject a batch that fails validation." hidden>
  <p role="alert" data-d3-contract="invoice-batch-rejected">Invoice 4 is missing a supplier.</p>
</section>
<section data-d3-state="dummy-success" data-d3-ticket="T-13" data-d3-summary="Queue the batch for settlement." hidden>
  <p role="status" data-d3-contract="invoice-batch-persisted">12 invoices queued for settlement.</p>
</section>
<script src="state-bar.js"></script>
```

**Done when:** every state container has `data-d3-state`, `data-d3-ticket`, and `data-d3-summary`, and every trigger or status node that implementation must replace has its own `data-d3-contract`.

### 4. Gate on Human Sign-Off

Stop once the mockup is runnable and present it to the developer. Do not write production backend code, migrations, or real API handlers before the human reviews the visual states.

Ask the developer to verify two things:

1. Does clicking through the dummy loading and success states match what this ticket or PR is supposed to do?
2. Are any edge-case states missing from the D3 State Bar?

If the developer spots a flaw, correct the HTML mockup first. Changing a mockup takes seconds; changing a full-stack implementation takes hours.

**Done when:** the developer has answered both questions and approved the state machine.

### 5. Drive Implementation to Real Success

Transition into `/implement` (using `/tdd` at each seam) and build the slice in the app's own stack and components, one vertical seam at a time. Do not copy mockup HTML into production; match its states, copy, and ticket mapping.

1. Implement each `data-d3-contract` as a real production symbol with the same name in the codebase's casing: the mutation, query handler, or persisted domain event (`submit-invoice-batch` becomes `submitInvoiceBatch`).
2. Drive the loading state from actual network or compute progress.
3. Drive the success state from verified persistence or real response data.
4. Grep the production code for every contract name in the mockup. Each one must resolve to a real symbol.

Prove it in the running app, not in the mockup. Perform the user-journey trigger through the real controls, confirm the real success copy, then reload the page without repeating the trigger:

- **Write slices:** the persisted outcome (the saved record, updated list, or new status) is still visible. A transient toast that disappears on reload is expected; it does not count as the outcome.
- **Read-only slices:** reloading the same URL reproduces the same result from real data, so the query state must live in the URL or in persisted preferences.

Then run `/code-review` and reuse the states captured during `/d3` as the visual summary for `/pr`.

**Done when:** driving the live application UI from a real trigger reaches the real success message, every contract name maps to a production symbol, **and the durable outcome still shows after a full page reload**. A success state propped up by a dummy timer or a no-op route is not done.

## Gotchas

- **Cheating the success state:** Never satisfy the criteria by swapping a frontend `setTimeout` for a no-op route returning `{ ok: true }`. Real success means the underlying domain state actually changed and persisted.
- **Proving success in the mockup:** The mockup's in-memory success does not satisfy the reload check. Only the live app after step 5 does.
- **Growing the mockup into production:** The mockup HTML is a spec. Rebuild the slice in the app's components and keep the mockup as the visual reference for `/pr`.
- **Skipping the human gate:** Jumping straight from the mockup into full-stack implementation defeats the point of `/d3`. Pause for visual sign-off so the developer digests the scope first.
- **Forking the state bar:** A second switcher, or an edited copy of `state-bar.js`, drifts from the ticket inspector and the URL contract. Copy the skill script unchanged.
- **Inventing terminology in dummy copy:** Copy like "Operation completed successfully" hides domain bugs. Use the exact `GLOSSARY.md` terms so model mismatches surface on screen.
- **Hardening the mockup before sign-off:** Keep the mockup phase fast and disposable. Add no database connections, auth middleware, or test suites until the human confirms the state machine is right.
