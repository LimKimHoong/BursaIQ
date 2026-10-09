---
name: BursaIQ
description: A compact midnight market desk for role-aware intelligence, governed answers, and accountable action.
colors:
  ink: "#f5f7fa"
  ink-soft: "#aeb8ca"
  ink-faint: "#738099"
  midnight-ground: "#0b1221"
  decision-canvas: "#0e1a33"
  panel: "#141f38"
  active-panel: "#1b294a"
  hairline: "#27354f"
  market-teal: "#35d0ba"
  market-teal-bright: "#66e1cf"
  exchange-gold: "#f2b84b"
  exchange-gold-soft: "#f7d78f"
  critical-red: "#f27069"
  success-green: "#51d0a8"
typography:
  display:
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(29px, 3.5vw, 44px)"
    fontWeight: 760
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "0"
  label:
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "0.08em"
rounded:
  xs: "7px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "7px"
  sm: "10px"
  md: "14px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.exchange-gold}"
    textColor: "{colors.midnight-ground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.midnight-ground}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  navigation-active:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 9px"
    height: "44px"
  chip-suggestion:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 11px"
    height: "44px"
  composer:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "13px 7px 7px 16px"
  answer-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "16px"
  decision-canvas:
    backgroundColor: "{colors.decision-canvas}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: "16px"
    width: "520px"
---

# Design System: BursaIQ

## Overview

**Creative North Star: "The Midnight Market Desk"**

BursaIQ is a compact exchange workstation after dark: precise, accountable, and ready for a live demonstration. It is not a generic card dashboard or a decorative AI chat screen. The BursaIQ Assistant workspace is the entry point, giving every role a governed place to ask questions before moving into intelligence and accountable workflow panels.

The fixed navigation rail, fluid workspace, and collapsible Decision Canvas keep the operating model visible without competing for attention. Flat operational surfaces and fine blue-gray rules connect Today’s Brief, Watchlist, Decision Memory, Source Health, and Management Briefing as one system. Warm amber identifies scarce action, decisive value, and prepared-demo provenance; market teal explains analytical state, focus, and health. Density is intentional, but every interactive target remains at least 44px and compact explanatory copy stays at least 10–11px.

**Key Characteristics:**

- Midnight-navy ground with amber actions and teal analytical signals.
- The BursaIQ Assistant workspace owns the first viewport, with role-aware intelligence and workflows one navigation step away.
- Watchlist, Decision Memory, Source Health, and Management Briefing share a compact line-led ledger grammar.
- Fixed left navigation, fluid workspace, and collapsible right Decision Canvas.
- Compact rectangular controls and fine structural rules instead of decorative glass.
- Prepared questions and answers remain clearly labelled when Copilot is unavailable.
- Role gates, reviewer scope, synthetic truth, and local-only persistence are disclosed where they matter.
- Motion communicates spatial state and stops under reduced-motion preferences.

## Colors

The palette resembles an exchange floor at night: deep navy structure, restrained cool text, amber action, and teal market feedback.

### Primary

- **Exchange Gold:** Reserved for scarce actions, decisive values, attention markers, prototype and fallback provenance, and sparse chart emphasis.
- **Soft Exchange Gold:** Provides readable caution and provenance text on dark surfaces.

### Secondary

- **Market Teal:** Signals analytical links, active icons, healthy status, chart lines, focus, and hover intent.
- **Bright Market Teal:** Strengthens interactive emphasis without replacing amber as the main action color.

### Tertiary

- **Critical Red:** Marks restricted or destructive states and negative file/status treatments.
- **Success Green:** Marks loaded, approved, and available state.

### Neutral

- **Midnight Ground:** Page field and conversation background.
- **Decision Canvas:** Right-side analysis surface and its collapsed rail.
- **Panel / Active Panel:** Nested answers, composer, selected navigation, and table rows.
- **Ink / Soft Ink / Faint Ink:** Three deliberate text levels for decisions, explanation, and metadata.
- **Hairline:** The default structural boundary between zones and rows.

### Named Rules

**The Amber Acts, Teal Explains Rule.** Amber is the scarce action and emphasis color; teal communicates analytical state, navigation intent, focus, and healthy operation.

**The Structure by Line Rule.** Separate operational zones with navy tone and one-pixel blue-gray rules, not extra containers, gradients, or glass effects.

## Typography

**Display Font:** Segoe UI through the system sans-serif stack

**Body Font:** Segoe UI through the system sans-serif stack

**Label/Mono Font:** The same system stack; figures use tabular numerals where alignment matters

**Character:** Compact, neutral, and operational. Display type is exceptional; working surfaces use a clear 10–22px hierarchy in which evidence, state, and values lead.

### Hierarchy

- **Display** (760, responsive 29–44px, 1.08): Reserved for exceptional invitation or management-narrative moments, never the default intelligence brief.
- **Headline** (700, 22px, 1.2): Briefing, page, and reviewer-workflow headings.
- **Title** (700, 16px, 1.3): Answer titles, plot titles, and panel hierarchy.
- **Body** (400, 12.5px, 1.62): Answers and analytical explanation, kept to readable card widths.
- **Label** (650, 10–11px, tracked only when compact grouping helps): Navigation, status, source metadata, table headings, signal explanations, and evidence controls.

### Named Rules

**The Workspace Leads, Work Compresses Rule.** The assistant opens with one deliberate invitation; intelligence and workflow pages switch to compact operational hierarchy.

**The Compact Copy Floor Rule.** Any compact text that explains a signal, source, action, owner, boundary, or state stays at least 10–11px and never relies on size alone to carry meaning.

## Layout

Desktop uses a fixed 250px left rail and a fluid main shell. The BursaIQ Assistant workspace fills the first viewport with the governed conversation entry point. Today’s Brief, Watchlist, Decision Memory, Source Health, and Management Briefing reuse the same hairline-separated rhythm instead of switching to card grids.

When analysis is open, the working area becomes a two-column conversation/canvas grid with a 520px canvas; collapsing it preserves a 54px labelled rail so the spatial model never disappears. On desktop, navigation rests as a 72px icon rail and reveals its full 250px labels over the workspace on hover or keyboard focus, so the working canvas never shifts. Below 980px, navigation becomes a 280px off-canvas drawer, briefing side rails stack below their main ledgers, and the attention queue keeps three counts above a full-width action. Below 760px, the Decision Canvas stacks beneath the conversation, management metrics become rows, and signal ledgers reduce to a readable two-column form. At 520px, attention counts, memory fields, and source summaries become single-column. Page padding contracts again below 620px.

Spacing follows a compact 7/10/14/16/24/32px rhythm. Working controls meet a 44px minimum target even when the visible label or icon is small. Tables may scroll horizontally rather than crushing governed source metadata.

## Elevation & Depth

The system is flat by default. Hierarchy comes from tonal navy layers and hairlines, not persistent shadows. The composer uses a restrained ambient shadow to anchor the primary input; amber controls use a small tinted lift; the mobile drawer gains a strong side shadow only while open. Focus is a teal border plus a quiet three-pixel wash.

### Shadow Vocabulary

- **Composer anchor** (`0 12px 32px rgba(0, 0, 0, .20)`): Keeps the question input legible against the continuous ground.
- **Amber action lift** (`0 8px 18px rgba(242, 184, 75, .14)`): Used only beneath the send control.
- **Mobile drawer depth** (`18px 0 50px rgba(0, 0, 0, .42)`): Appears only while the off-canvas navigation is open.

### Named Rules

**The Flat Until Spatial Rule.** Add shadow only when an element must sit above another plane—the composer, a primary action, or the open mobile drawer.

## Shapes

The form language is compact and mildly rounded. Structural panels remain square to the viewport; navigation and small controls use 7–10px corners; answer cards use 14px; the composer uses 16px; suggestion and status chips are pills. The asymmetric question bubble uses a 4px lower-right corner to communicate direction without adding a speech-tail ornament.

## Components

### Buttons

- **Shape:** Compact 8–11px corners with a 44px target.
- **Primary:** Exchange Gold on Midnight Ground; the send icon is the clearest example.
- **Hover / Focus:** Amber brightens on hover; focus is a visible teal outline/wash; active state scales briefly to 0.94–0.98.
- **Secondary:** Midnight fill, hairline border, soft ink; teal appears on hover.

### Chips

- **Style:** Pill-shaped navy controls with soft text and a hairline border.
- **State:** Hover moves border and text to teal. Provenance chips use amber for predefined fallback and teal for governed/local state.

### Cards / Containers

- **Corner Style:** 10px for analytical cards and 14px for conversation cards.
- **Background:** Panel navy nested inside the midnight ground.
- **Shadow Strategy:** Flat by default; rely on tone and hairlines.
- **Border:** One-pixel Hairline; gold-tinted hairline for fallback or caution notes.
- **Internal Padding:** Usually 11–16px.

### Inputs / Fields

- **Style:** The signature composer is a 16px panel with a strong hairline and a 13px text field.
- **Focus:** Border shifts to Market Teal with a quiet three-pixel teal wash.
- **Error / Disabled:** Connection failures appear as explicit content, never as silent disabled controls.

### Navigation

The desktop rail is a fixed black-navy 72px icon column with 44px targets, ordered by task progression: Workspace, Intelligence, then Workflow. Thin rules distinguish the groups while compact; hovering the rail or moving keyboard focus into it reveals the full 250px names over the workspace without shifting the canvas. The top bar carries only the BursaIQ product name; the active panel name and description appear once in the page heading. BursaIQ Assistant is the default entry; Watchlist remains available to every identity, while Management Briefing and Decision Memory appear only for GCMC, Market Reviewer, and Finance identities. Verification Centre and Source Health appear only for reviewer identities, and Ask Reg remains access-controlled. Active rows use Panel navy and a teal icon. On mobile, the complete labelled rail moves fully off-screen, enters over a dimmed scrim, traps focus, closes on Escape or navigation, and restores focus to the menu trigger.

### Intelligence & Workflow Ledgers

Today’s Brief, Watchlist, Decision Memory, Source Health, and Management Briefing are variations of one ledger grammar: section heading, hairline-divided rows, a restrained marker or status, explanatory copy, and right-aligned value, owner, horizon, or action. Today’s Brief leads with counts and changed signals; Watchlist pairs monitored signals with transparent alert rules; Decision Memory preserves question, rationale, owner, workspace, status, and evidence re-entry; Source Health presents reviewer-scoped freshness and quality; Management Briefing turns the same truth into a narrative, three decisive metrics, and an owned priority ledger. Its instruction field and adjacent Print/Refresh controls regenerate the narrative through Copilot Studio, with a visibly labelled deterministic fallback when the agent cannot be reached.

Watchlist and Decision Memory writes are role-scoped in local browser storage; preferences and access requests are also device-local. Verification uses the local audit queue, and no prototype action implies an external notification. Synthetic, restricted, and proposed-production boundaries remain adjacent to the affected workflow.

### Decision Canvas

The right canvas is a persistent analytical plane with four keyboard-complete tabs: Plot, Analysis, Sources, and Actions. Plot uses teal lines or bars with sparse amber emphasis; Analysis exposes the narrative and governed method; Sources names the evidence and coverage; Actions bridges the answer into Watchlist, Decision Memory, verification, or—when the role allows—Management Briefing. It opens at 520px, reduces at narrower desktops, collapses into a 54px labelled rail, and stacks below the answer on small screens.

## Do's and Don'ts

### Do:

- **Do** use amber for scarce actions, fallback provenance, and the value that deserves immediate attention.
- **Do** use teal for analysis, focus, healthy status, and interactive intent.
- **Do** preserve the three-zone desk and the labelled collapsed-canvas rail.
- **Do** keep working controls at least 44px and support reduced motion and increased contrast.
- **Do** keep compact explanatory copy at least 10–11px, especially in ledgers, boundaries, source health, and workflow actions.
- **Do** label synthetic, predefined, and restricted content at the point of use.
- **Do** preserve role gates and distinguish local browser persistence, the local audit queue, and proposed production integrations.

### Don't:

- **Don't** reintroduce luminous-blue primary actions or decorative glass panels.
- **Don't** turn every information group into a floating card; use lines and tonal layers first.
- **Don't** use amber and teal interchangeably or flood either accent across passive surfaces.
- **Don't** place Intelligence ahead of Workspace in the navigation; BursaIQ Assistant must remain the shared entry point for every role.
- **Don't** shrink meaningful metadata or explanatory copy below 10px; compactness comes from layout, line-led grouping, and concise language.
- **Don't** hide reviewer ownership, freshness, restriction, or source provenance behind secondary interactions.
- **Don't** animate layout properties for decoration; motion must explain the drawer, canvas, or analytical plot state.
