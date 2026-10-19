---
name: BursaIQ
description: A governed enterprise AI-workforce command centre for trusted research, orchestration, verification, and exchange.
colors:
  midnight-rail: "#06152c"
  deep-rail: "#081c38"
  rail-highlight: "#0d2c54"
  ink: "#0b1835"
  ink-secondary: "#2f4165"
  muted: "#6a7895"
  faint: "#91a0b8"
  canvas: "#f3f7fc"
  paper: "#ffffff"
  paper-blue: "#f7faff"
  line: "#dde6f1"
  line-strong: "#cbd8e8"
  action-blue: "#1769f5"
  action-blue-deep: "#0c54d4"
  action-blue-soft: "#e9f2ff"
  governed-teal: "#0aa486"
  governed-teal-soft: "#e5f8f2"
  agent-violet: "#7454e8"
  agent-violet-soft: "#f0edff"
  attention-amber: "#d99318"
  attention-amber-soft: "#fff4dc"
  risk-red: "#de4d5c"
  risk-red-soft: "#ffebed"
  success-green: "#14966d"
typography:
  display:
    fontFamily: "Bursa Manrope, Avenir Next, Segoe UI, -apple-system, sans-serif"
    fontSize: "clamp(35px, 4vw, 53px)"
    fontWeight: 820
    lineHeight: 0.95
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Bursa Manrope, Avenir Next, Segoe UI, -apple-system, sans-serif"
    fontSize: "clamp(25px, 2.3vw, 35px)"
    fontWeight: 770
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 740
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.48
    letterSpacing: "normal"
  label:
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  compact: "7px"
  control: "9px"
  card: "11px"
  soft-card: "12px"
  panel: "14px"
  hero: "15px"
  overlay: "16px"
  pill: "99px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "14px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 13px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.action-blue-soft}"
    textColor: "{colors.action-blue-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 13px"
    height: "40px"
  button-ghost:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 13px"
    height: "40px"
  navigation-active:
    backgroundColor: "linear-gradient(90deg, rgba(25, 105, 230, .77), rgba(17, 76, 160, .64))"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "6px 9px"
    height: "53px"
  command-composer:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "10px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "14px"
  status-governed:
    backgroundColor: "{colors.governed-teal-soft}"
    textColor: "{colors.governed-teal}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
    height: "22px"
  mission-stage-active:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    size: "22px"
  ask-bursa-lane:
    backgroundColor: "{colors.paper-blue}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "25px"
  decision-canvas-action:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.soft-card}"
    padding: "11px"
    height: "78px"
  action-record:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "11px"
---

# Design System: BursaIQ

## Overview

**Creative North Star: "The Governed Exchange Floor"**

BursaIQ is a light, high-density enterprise command centre framed by a deep Bursa navy navigation rail. The dark frame establishes institutional continuity and focus; the working field stays bright, calm, and information-rich so people can scan missions, evidence, agents, approvals, and reusable intelligence without entering a decorative dashboard world. The experience should feel precise and operational, never like a generic chatbot or consumer productivity app.

The system treats AI work as accountable movement. Blue marks the active task or next action, teal confirms governed or completed state, and supporting violet, amber, red, and green remain bounded to agent identity, attention, risk, and success. Restrained white panels, cool hairlines, compact typography, and modest shadows preserve density. In AI Assistant, the Decision Canvas turns an answer into four inspectable views—Plot, Analysis, Source, and Action—without separating the action from its evidence. Synthetic content, source state, approval state, and permission boundaries remain visible at the moment of decision, carrying forward BursaIQ's durable evidence and governance commitments.

The information architecture separates questions from follow-through. AI Assistant owns governed analysis and the Decision Canvas. Ask Bursa follows it as a direct internal Q&A-only route for HR, Group Technology, Regulations, and Market Operations; it does not launch tasks or expose a Decision Canvas. After the primary navigation and its divider, Action leads the governance group before Verification Centre and Connectors; Settings remains anchored in the footer. Action receives Decision Memory records and Email automations created from the Assistant canvas. The wider workforce retains its signature left-to-right lifecycle: **Research → Synthesis → Verification → Exchange**.

**Key Characteristics:**

- A persistent deep-navy rail frames a predominantly light workspace.
- A sticky white top bar unifies global search, demo provenance, creation, notifications, apps, and identity.
- Dense white panels use cool borders and compact rows instead of oversized floating cards.
- Blue drives action and current state; teal confirms completed or governed state.
- Manrope gives brand and major headings a distinctive voice; Segoe UI and the system stack carry operational detail.
- Home behaves as an AI-workforce command centre, not a chat landing page.
- AI Assistant pairs governed answers with Plot, Analysis, Source, and Action canvas views.
- Ask Bursa follows AI Assistant as a Q&A-only internal knowledge route with no Decision Canvas.
- Action leads the post-divider governance group before Verification Centre and Connectors; Settings remains in the footer.
- The mission lifecycle always reads left to right: Research, Synthesis, Verification, Exchange.
- Responsive layouts preserve task order by collapsing rails and grids rather than hiding governance context.
- Synthetic demo state, evidence, approvals, and access boundaries are labelled honestly.
- Motion is brief, directional, and removed when reduced motion is requested.

## Colors

The palette separates the institutional frame from the working surface: dark Bursa navy contains navigation, cool whites hold the work, and blue/teal make progression legible at a glance.

### Primary

- **Exchange Blue:** The principal action and current-state color for creation, active navigation, progress, selected tabs, focus emphasis, and primary controls.
- **Deep Exchange Blue:** The hover and high-contrast partner for Exchange Blue.
- **Blue Wash:** A quiet selection, focus-halo, and secondary-action surface that keeps dense controls readable.

### Secondary

- **Governed Teal:** Marks completed lifecycle stages, verified or healthy state, approved services, and selected analytical accents.
- **Teal Wash:** Carries governed state behind icons and compact status treatments without competing with primary actions.

### Tertiary

- **Agent Violet / Violet Wash:** Distinguishes agentic or orchestration-related objects.
- **Attention Amber / Amber Wash:** Identifies approvals, deadlines, pending review, and items requiring human attention.
- **Risk Red / Red Wash:** Marks risk, compliance concern, failure, or negative notification state.
- **Success Green:** Confirms positive operational state where completion is not specifically part of the mission handoff.

### Neutral

- **Midnight Rail, Deep Rail, and Rail Highlight:** Build the permanent institutional frame and its tonal variation.
- **Ink and Secondary Ink:** Carry headings, primary content, and dense supporting copy.
- **Muted and Faint:** Support metadata, descriptions, placeholders, and low-priority context.
- **Canvas, Paper, and Paper Blue:** Separate the application field, primary panels, and quieter internal regions.
- **Line and Strong Line:** Structure panels, fields, rows, and zones without heavy elevation.

### Named Rules

**The Navy Frames, Paper Works Rule.** Persistent navigation may be deeply dark; the primary working field stays light, cool, and legible.

**The Blue Moves, Teal Confirms Rule.** Use blue for the present action or current stage and teal for completed, governed, or healthy state.

**The Status Has Two Signals Rule.** Pair every semantic color with text, an icon, a position, or a shape; color never carries status alone.

## Typography

**Display Font:** Bursa Manrope, bundled as a variable font, with Avenir Next and Segoe UI fallbacks

**Body Font:** Segoe UI through the native system sans-serif stack

**Label/Mono Font:** The body stack; aligned figures use tabular numerals rather than a separate mono face

**Character:** Manrope gives BursaIQ's brand and major moments a broad, contemporary confidence. Segoe UI keeps tables, navigation, statuses, controls, and evidence comfortably familiar at enterprise density.

### Hierarchy

- **Display** (820, responsive 35–53px, 0.95): Home hero branding and the rare highest-emphasis statement.
- **Headline** (770, responsive 25–35px, 1.06): Workspace titles and major invitations.
- **Title** (740, 13px, 1.35): Panel headings, answer titles, and compact structural anchors.
- **Body** (400, 13px, 1.48): Interface copy, descriptions, and working content; longer analytical prose may open to roughly 1.6 line-height.
- **Label** (700, 10px, 1.4): Statuses, table headings, action labels, metadata, lifecycle stages, and compact controls.

### Named Rules

**The Manrope Declares, Segoe Operates Rule.** Use Manrope for identity and high-level orientation; use the system body stack for the dense work itself.

**The Ten-Pixel Floor Rule.** Operational labels and metadata do not fall below 10px, and small type must retain contrast, spacing, and a clear role.

## Layout

Desktop is organized around a fixed 232px left rail and a 64px sticky top bar. The main page may expand to 1700px and uses 20px side padding, with a compact 13–14px rhythm between working regions. The home surface prioritizes the command field and mission brief in a fluid main column, then reserves a narrow 286px right rail for active agents, pending approvals, and recommendations. Other workspaces reuse a similar main-plus-284px-rail pattern.

The composition is intentionally dense. Panels commonly use 49px headers, 42–67px rows, 8–14px internal gaps, and 10–14px padding. Repeated collections use even grids, while tables and the full mission journey scroll horizontally rather than compressing governed details into illegibility. The hero is the one broad branded interruption; subsequent content returns immediately to the compact operating cadence.

AI Assistant divides its working area into a fluid answer column and a minimum-370px Decision Canvas at a 1.42/0.88 ratio. Ask Bursa deliberately returns to a clean, centered 920px Q&A lane: a welcome prompt and two-column suggestion grid open the empty state, the conversation occupies the same thread, and the composer remains anchored below. Action uses a 1.12/0.88 Decision Memory and Email automation split, preceded by a compact governed-summary band and four accountability metrics.

At 1280px, six-column collections reduce to three columns and identity metadata contracts. At 1080px, the rail becomes a 78px icon strip, contextual labels appear on hover or keyboard focus, right rails stack below the main field, the Action columns stack, and AI Assistant places the Decision Canvas below the conversation with a visible mobile entry control. At 820px, navigation becomes a 270px off-canvas drawer, page padding reduces to 12px, paired regions stack, and dense tables remain horizontally scrollable. At 580px, cards and secondary rails become single-column, quick actions remain a two-column launcher, Ask Bursa suggestions collapse to one column, and its composer preserves the Internal sources and Q&A only indicators while global search and creation controls compress without changing their function.

**The Work Before Chrome Rule.** Responsive collapse may shorten labels and move secondary rails, but it must preserve the active work, provenance, approvals, and the mission's ordered handoff.

## Elevation & Depth

Depth is restrained and structural. Most panels are white with a cool one-pixel border and a low ambient shadow; many compact rail panels omit shadow entirely. Strong elevation is reserved for overlays, menus, toasts, the floating assistant composer, and the branded home hero. The sticky top bar uses slight translucency and blur only to maintain separation while scrolling, not to introduce a glass aesthetic.

### Shadow Vocabulary

- **Panel ambient** (`0 7px 24px rgba(30, 61, 104, .075)`): Low separation for cards against the pale canvas.
- **Overlay lift** (`0 24px 70px rgba(30, 61, 104, .17)`): Menus, tooltips, and transient surfaces that must clearly sit above the workspace.
- **Hero anchor** (`0 20px 55px rgba(13, 39, 76, .2)`): Used only by the deep-navy home hero.
- **Composer lift** (`0 15px 45px rgba(32, 71, 122, .12)`): Keeps the assistant input available above a scrolling thread.

### Named Rules

**The Flat Until It Floats Rule.** Default work surfaces rely on tone and hairlines; only transient, anchored, or signature surfaces receive noticeable shadow.

## Shapes

The form language is softly squared and compact. Dense actions and metadata controls use 7–9px corners; cards use 10–12px; primary panels use 14px; the hero uses 15px; and command or overlay surfaces may reach 16px. Pills are reserved for statuses, counts, and tiny service indicators. Avatars and lifecycle nodes are circular. The rail's active marker remains a slim vertical stroke, creating directional emphasis without adding another container.

**The Radius Follows Scope Rule.** Small controls use small corners, panels use medium corners, and only statuses or identities become fully round.

## Components

### Buttons

Buttons are compact, direct, and visually subordinate to the information they operate on.

- **Shape:** Gently squared controls, usually 9px, with 40–42px height for primary workspace actions and 28–36px for dense inline data actions.
- **Primary:** Exchange Blue with white text and a small blue-tinted lift.
- **Secondary:** Blue Wash with Deep Exchange Blue text and a blue-tinted border.
- **Ghost:** White with Secondary Ink and a cool structural border.
- **Hover / Focus:** Hover darkens or shifts the border and may rise by one pixel. Keyboard focus uses a visible three-pixel translucent blue outline with a two-pixel offset.

### Chips

- **Style:** Compact pills use tinted semantic backgrounds with darker text; a short label is mandatory.
- **State:** Teal means governed or completed, amber means pending attention, red means risk, blue means active or informational, and violet means agentic or orchestration context.

### Cards / Containers

- **Corner Style:** 10–12px for cards and 14px for primary panels.
- **Background:** Paper on Canvas; quiet subregions may use Paper Blue.
- **Shadow Strategy:** Low ambient shadow where separation is needed; dense side-rail panels may remain border-only.
- **Border:** A one-pixel cool hairline, strengthened on controls and focus-adjacent surfaces.
- **Internal Padding:** Usually 9–14px for cards and 12–17px for panels.

### Inputs / Fields

- **Style:** White or Paper Blue, one-pixel Strong Line border, 8–12px corners, and compact 10–13px text.
- **Focus:** Border shifts toward blue with a quiet three-pixel blue wash; native outline remains visible for global keyboard focus.
- **Composer:** The universal work composer is a white, softly raised panel with tool actions aligned along its lower edge and a square blue send action.
- **Error / Disabled:** Explain unavailable or demo-only behavior in text. Never imply a real external action when the prototype only simulates it.

### Navigation

The deep-navy left rail is the product's persistent frame. Its canonical primary order is Home, AI Assistant, Ask Bursa, My Workforce, and Intelligence Exchange; Action, Verification Centre, and Connectors follow after the divider in that order. Today's Brief, Automation Studio, Collaborative Rooms, and Projects & Workspace are not sidebar destinations. Settings remains anchored in the footer, while Action stays visible beside the governance tools it supports.

Full desktop items use a 53px row with icon, title, supporting line, and optional count. The active row uses a left-to-right blue gradient plus a narrow luminous marker. At 1080px the rail collapses to icons with hover/focus labels; at 820px it becomes an off-canvas labelled drawer over a dimmed scrim. Global search remains the first control in the sticky top bar.

### Ask Bursa

Ask Bursa is the direct internal knowledge lane, placed immediately after AI Assistant. Its empty state is intentionally spare: a welcoming “Ask anything inside Bursa” prompt, four department-aware suggestion cards, and a focused composer create a familiar internal-chat flow without a separate permission or department strip. Governance remains visible but unobtrusive through the “Internal knowledge only” header state, “Internal sources” composer action, and “Q&A only” mode indicator. It answers from permitted internal guidance and never launches a task, opens a Decision Canvas, or creates an Action record.

### Decision Canvas and Action

AI Assistant's right canvas uses four equal tabs in the fixed order **Plot, Analysis, Source, Action**. Plot makes the trend visible; Analysis explains reasoning and calculation method; Source exposes coverage and exact evidence; Action preserves the governed answer as either a Decision Memory record or an Email automation. Completed actions turn to a quiet teal confirmation state and remain linked to the original question and evidence.

Action is a review-and-management workspace, not a blank creation studio. Decision Memory records preserve the question, rationale, owner, date, and evidence context. Email automations preserve the question, schedule, recipient, source snapshot, and active/paused state. Both originate from the AI Assistant Decision Canvas; the workspace can send users back to Assistant, but it does not create evidence-free records. Browser-session storage and the absence of external email are disclosed on the surface.

**The Answer Carries Its Evidence Rule.** Decision memories and scheduled follow-ups are created only from a governed AI Assistant answer, so question, source, and rationale stay attached.

**The Q&A Stays Q&A Rule.** Ask Bursa answers permitted internal questions directly and never inherits the Decision Canvas or Action-creation affordances.

### Mission Lifecycle

The signature component always uses the exact order **Research → Synthesis → Verification → Exchange**. Compact instances are inline labels separated by arrows: completed stages are teal, the active stage is blue, and future stages are muted. Expanded instances use four connected nodes: teal checkmarks trace completed links from left to right, the active blue node receives a soft arrival halo, and future nodes remain white with cool borders. The trace and arrival animation must be disabled under reduced-motion preferences.

### Panels, Rows, and Tables

Panel headers use a 49px structural band with a compact title and optional right-aligned text action. Repeated items favor hairline-separated rows over separately floating cards. Tables retain uppercase 10px headers, tabular numerals, and horizontal scrolling on narrow viewports. Evidence, reviewer, source, freshness, and approval state stay in the row where the decision happens.

### Overlays and Feedback

Create menus, the command palette, and toasts are white, strongly elevated, and bounded by cool borders. The command palette opens over a navy scrim with light blur; toasts enter from the lower right and disappear after a short confirmation interval. Modal or transient motion is brief and directional, and all animations collapse under reduced-motion settings.

## Do's and Don'ts

### Do:

- **Do** keep the deep-navy rail as the persistent institutional frame and the main workspace light.
- **Do** use blue for primary action and current state, then teal for completed or governed state.
- **Do** preserve the exact Research → Synthesis → Verification → Exchange order wherever mission progress appears.
- **Do** keep panels dense, white, and line-led, with low shadow and concise 10–13px working type.
- **Do** pair semantic color with labels, icons, stage order, or shape.
- **Do** label synthetic data, simulated actions, evidence state, permissions, and human approvals at the point of use.
- **Do** keep the home surface focused on work initiation, active missions, approvals, and reusable intelligence.
- **Do** keep Ask Bursa immediately after AI Assistant as a clean internal Q&A lane with a welcome prompt, department-aware suggestion cards, a focused composer, and unobtrusive Internal knowledge only, Internal sources, and Q&A only indicators.
- **Do** preserve the Decision Canvas order Plot, Analysis, Source, Action and create Action records only from its Action tab.
- **Do** keep Action immediately after the divider and before Verification Centre and Connectors; keep Settings in the footer and disclose that Decision Memory and Email automation records are browser-session demo data.
- **Do** retain visible keyboard focus, reduced-motion behavior, responsive reflow, and horizontal scrolling for dense governed data.

### Don't:

- **Don't** revert the workforce shell to an all-dark, liquid-glass, or card-glow aesthetic.
- **Don't** use amber as the primary action color; amber is reserved for attention and pending review.
- **Don't** turn BursaIQ into a generic chat landing page or a sparse marketing site.
- **Don't** split the mission lifecycle into unrelated tiles or reorder its four stages.
- **Don't** add a Decision Canvas, agent delegation, or Action creation to Ask Bursa; it is Q&A only.
- **Don't** restore Automation Studio, Collaborative Rooms, or Projects & Workspace to the sidebar without a new information-architecture decision.
- **Don't** let Action become an independent automation builder or create Decision Memory without an Assistant answer and evidence trail.
- **Don't** float every information group; repeated work belongs in rows, tables, and restrained panels.
- **Don't** over-round controls, overuse pills, or apply overlay shadows to ordinary content cards.
- **Don't** shrink operational labels below the established 10px floor or hide governance context to make a mobile layout look cleaner.
- **Don't** imply live production behavior, external delivery, or unrestricted access when the implementation is a synthetic governed demo.
