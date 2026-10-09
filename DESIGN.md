---
name: BursaIQ
description: A two-mode liquid-glass market desk for role-aware intelligence, governed answers, and accountable action.
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
  md: "13px"
  lg: "20px"
  xl: "26px"
  shell: "30px"
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
    backgroundColor: "rgba(19, 25, 46, 0.66)"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "18px 10px 11px 20px"
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

BursaIQ is a compact exchange workstation that can move between a midnight market desk and a daylight pearl exchange: precise, accountable, and ready for a live demonstration. It is not a generic card dashboard or a decorative AI chat screen. The BursaIQ Assistant workspace is the entry point, giving every role a governed place to ask questions before moving into intelligence and accountable workflow panels.

The fixed navigation rail, fluid workspace, and collapsible Decision Canvas keep the operating model visible without competing for attention. Appearance sits directly above Settings in the rail and uses the same complete 44px tile in compact mode; the demo identity remains an unboxed avatar-and-name control. A selective liquid-glass layer gives the conversational entry point, navigation chrome, and Decision Canvas a tactile sense of depth; dense ledgers remain line-led and optically quiet. Warm amber identifies scarce action, decisive value, and prepared-demo provenance; market teal explains analytical state, focus, and health. Muted violet appears only as refracted material light. Density is intentional, but every interactive target remains at least 44px and compact explanatory copy stays at least 10–11px.

**Key Characteristics:**

- A persistent Light / Dark appearance choice: violet midnight glass after dark and pearl-lilac glass in daylight.
- An animated IQ Guide pet provides local, role-aware wayfinding without becoming a second answer engine.
- The BursaIQ Assistant workspace owns the first viewport, with role-aware intelligence and workflows one navigation step away.
- Watchlist, Decision Memory, Source Health, and Management Briefing share a compact line-led ledger grammar.
- Fixed left navigation, fluid workspace, and collapsible right Decision Canvas.
- Liquid glass for floating, interactive surfaces; fine structural rules for evidence-heavy operational content.
- Prepared questions and answers remain clearly labelled when Copilot is unavailable.
- Role gates, reviewer scope, synthetic truth, and local-only persistence are disclosed where they matter.
- Motion communicates spatial state and stops under reduced-motion preferences.

## Themes & Colors

The shared accent logic resembles an exchange floor: amber action, teal market feedback, and restrained violet refraction. Dark mode uses deep navy structure and cool light ink. Light mode uses a pearl-blue ground, dark navy ink, translucent white-lilac material, and darker teal/gold variants so status and action remain readable. The choice is stored on the device, applied before first paint, and available from the navigation rail directly above Settings as well as from the Settings page.

### Dark — Midnight Market Desk

- Violet-tinted navy liquid glass sits over a continuous midnight ground.
- White and cool grey ink preserve dense analytical hierarchy.
- This is the default and retains the established BursaIQ prototype identity.

### Light — Pearl Exchange

- Pale blue-grey ground, translucent pearl surfaces, and restrained lilac refraction create daylight glass without flattening the interface into white cards.
- Dark navy ink carries hierarchy; teal and gold are deepened for accessible contrast.
- Borders use white upper rims and cool structural hairlines; shadows are softer and less black than in Dark mode.

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

**The Glass Floats, Evidence Stays Still Rule.** Use refracted glass for navigation, the composer, chat exchanges, dialogs, and the Decision Canvas. Keep dense ledgers, tables, and source metadata line-led and substantially opaque.

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

Depth follows interaction. The composer is the clearest glass object: violet-tinted navy in Dark mode and pearl-lilac with a cool teal refraction in Light mode. Both use a bright upper rim, offset shadow, and saturated background blur. Navigation chrome and the Decision Canvas use heavier glass; answer cards and compact controls use lighter refraction. Ledgers and tables stay comparatively flat. Focus is a teal border plus a quiet three-pixel wash.

### Shadow Vocabulary

- **Composer float:** Dark uses `0 28px 80px rgba(2, 5, 16, .44)`; Light uses a softer `0 28px 72px rgba(65, 62, 88, .18)` plus a white inset rim.
- **Amber action lift** (`0 8px 18px rgba(242, 184, 75, .14)`): Used only beneath the send control.
- **Mobile drawer depth** (`18px 0 50px rgba(0, 0, 0, .42)`): Appears only while the off-canvas navigation is open.

### Named Rules

**The Weight Follows Area Rule.** Large glass surfaces receive stronger blur and deeper shadows; compact controls receive lighter material and almost no independent elevation.

## Shapes

The outer application shell uses a 30px curve on desktop. Navigation and compact controls use 8–13px corners; answer cards use 22px; the composer uses 26px; suggestion and status chips remain pills. The asymmetric question bubble keeps a tighter lower-right corner to communicate direction without adding a speech-tail ornament. Mobile drops the outer-shell inset while preserving 22px composer and drawer geometry.

## Components

### IQ Guide Pet

The supplied white two-eye character sits at the bottom-left beside the compact rail. Its idle motion is a restrained three-pixel drift; hover produces one short greeting tilt, and opening the directory gives it a listening posture. The character is a transparent raster cutout rather than a redrawn icon, preserving the user-supplied expression in both themes. All looping motion stops under reduced-motion preferences.

Clicking the pet opens a non-modal liquid-glass directory anchored to the character. The guide recommends the correct BursaIQ workspace or workflow, explains role boundaries, and offers one direct navigation action. It is intentionally local and deterministic, so wayfinding remains available when Copilot Studio cannot be reached and no question is sent outside the device. `/Close` hides the entire pet; Settings → Appearance restores it. Escape closes only the panel. The saved visibility preference is applied before first paint.

The panel uses dark violet glass in Dark mode and pearl-lilac glass in Light mode. It never obscures access rules: unavailable reviewer, management, or regulatory destinations resolve to a permitted alternative with an explicit explanation.

### Buttons

- **Shape:** Compact 8–13px corners with a 44px target.
- **Primary:** Exchange Gold on Midnight Ground; the send icon is the clearest example.
- **Hover / Focus:** Amber brightens on hover; focus is a visible teal outline/wash; active state scales briefly to 0.94–0.98.
- **Secondary:** Translucent theme-aware fill, hairline border, soft ink; teal appears on hover.

### Chips

- **Style:** Pill-shaped translucent controls with soft text and a hairline border.
- **State:** Hover moves border and text to teal. Provenance chips use amber for predefined fallback and teal for governed/local state.

### Cards / Containers

- **Corner Style:** 10–12px for analytical cards and 21–22px for conversation cards.
- **Background:** Refracted violet-navy glass in Dark mode and pearl-lilac glass in Light mode; dense data remains more opaque in both.
- **Shadow Strategy:** Deep and soft only where a surface floats; ledger rows rely on tone and hairlines.
- **Border:** One-pixel Hairline; gold-tinted hairline for fallback or caution notes.
- **Internal Padding:** Usually 11–16px.

### Inputs / Fields

- **Style:** The signature composer is a 26px liquid-glass panel with a bright rim, 14px desktop text, and 16px mobile text.
- **Focus:** Border shifts to Market Teal with a quiet three-pixel teal wash.
- **Error / Disabled:** Connection failures appear as explicit content, never as silent disabled controls.

### Navigation

The desktop rail is a fixed 72px icon column with complete 44px square targets, ordered by task progression: Workspace, Intelligence, then Workflow. It uses black-violet glass in Dark mode and pearl-lilac glass in Light mode. Active and hover surfaces keep all four corners visible while compact, then widen into full rows as the rail reveals its 250px labels over the workspace. Thin rules distinguish the groups while compact. The rail begins directly with the unboxed New conversation action—there is no prototype badge—and always returns to the single landing-page composer. The top bar carries only the BursaIQ product name and service state; the matching Light / Dark and Settings tiles sit together at the foot of the rail, above the unboxed identity control. The active panel name and description appear once in the page heading. BursaIQ Assistant is the default entry; Verification Centre, Source Health, and Decision Memory are available to every identity, Management Briefing remains role-aware, and Ask Reg remains access-controlled. On mobile, the complete labelled rail moves fully off-screen, enters over a dimmed scrim, traps focus, closes on Escape or navigation, and restores focus to the menu trigger.

### Intelligence & Workflow Ledgers

Today’s Brief, Watchlist, Decision Memory, Source Health, and Management Briefing are variations of one ledger grammar: section heading, hairline-divided rows, a restrained marker or status, explanatory copy, and right-aligned value, owner, horizon, or action. Today’s Brief leads with counts and changed signals; Watchlist pairs monitored signals with transparent alert rules; Decision Memory preserves question, rationale, owner, workspace, status, and evidence re-entry; Source Health presents freshness and quality for sources permitted to the active identity; Management Briefing turns the same truth into a narrative, three decisive metrics, and an owned priority ledger. Its instruction field and adjacent Print/Refresh controls regenerate the narrative through Copilot Studio, with a visibly labelled deterministic fallback when the agent cannot be reached.

Verification Centre separates two responsibilities without mixing their authority. Every identity sees My submitted requests and the latest status of each request. Reviewer identities additionally see Pending my review, which contains only outstanding cases assigned to their review queue and is the sole surface that exposes approval or change-request actions. Both sections use the same line-led case grammar, but the reviewer panel carries an explicit access label.

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
- **Do** preserve material depth, contrast, and semantic accent meaning when switching between Light and Dark modes.
- **Do** keep IQ Guide answers about navigation, panel purpose, workflow and access boundaries; route substantive Bursa questions to BursaIQ Assistant.

### Don't:

- **Don't** apply glass indiscriminately to tables, ledgers, or every information group; material must communicate a floating or interactive plane.
- **Don't** turn every information group into a floating card; use lines and tonal layers first.
- **Don't** use amber and teal interchangeably or flood either accent across passive surfaces.
- **Don't** place Intelligence ahead of Workspace in the navigation; BursaIQ Assistant must remain the shared entry point for every role.
- **Don't** shrink meaningful metadata or explanatory copy below 10px; compactness comes from layout, line-led grouping, and concise language.
- **Don't** hide reviewer ownership, freshness, restriction, or source provenance behind secondary interactions.
- **Don't** animate layout properties for decoration; motion must explain the drawer, canvas, or analytical plot state.
- **Don't** make Light mode a flat white recolour; retain refracted violet, white rims, layered translucency, and cool structural shadows.
- **Don't** let the pet block primary work, bypass role gates, imitate Copilot Studio, or keep moving when reduced motion is requested.
