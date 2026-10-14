---
name: d3
description: Build interactive HTML UI mockups with ticket-linked dummy states before implementation, then wire production code until the real success state survives a page reload. Use when the user invokes /d3, asks for design-driven development, wants a visual pre-implementation gate between /to-tickets and /implement, or needs to visually digest a large spec, ticket, or pull request before writing or reviewing production code.
---
# Design-Driven Development

Design-Driven Development (`/d3`) is a visual pre-implementation gate that turns a ticket, spec, or large PR into a clickable HTML mockup with ticket-linked dummy states before production code is written, then drives implementation until the real success state is reached and persists across a page reload. It sits between `/to-tickets` and `/implement` so humans can enter a complex spec through the UI rather than parsing walls of prose or massive diffs.

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

### 2. Build the Mockup with Linked Dummy States

Generate a self-contained, double-clickable HTML mockup (or sandboxed route) that runs with zero backend setup and keeps state in memory.

- **Single-screen slices:** Use a single HTML file containing all discovered states.
- **Multi-screen slices:** When a slice spans several screens, generate one HTML file per screen (linked via standard navigation) that loads a shared **D3 State Bar** script, or house the screens in a single file with explicit screen-switching tabs alongside the state bar.

Render a floating bottom **D3 State Bar** across all screens that includes:

1. **State Buttons & URL Sync:** One-click buttons (and `?d3_state=` query param support) for every state listed in Step 1, plus a "Play Happy Path" button that steps through the flow on a short timer.
2. **Live Ticket Inspector:** When a reviewer clicks a state in the bar, read the active container's `data-d3-ticket` attribute and display the linked ticket IDs and summary right inside the state bar so the reviewer sees which part of the spec that UI state satisfies.

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