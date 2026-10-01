---
name: BursaIQ
description: A calm exchange command surface where governed answers, evidence, and review stay in one conversation.
colors:
  ink-primary: "#f7f8fc"
  ink-secondary: "#c7cede"
  ink-tertiary: "#909bb1"
  midnight-ground: "#070b16"
  indigo-base: "#0b1120"
  indigo-glass: "#111a2d"
  indigo-raised: "#172238"
  indigo-muted: "#1d2a43"
  hairline: "rgba(213, 224, 255, 0.10)"
  hairline-strong: "rgba(220, 230, 255, 0.17)"
  panel-glass: "rgba(17, 25, 43, 0.72)"
  control-glass: "rgba(255, 255, 255, 0.065)"
  composer-glass: "rgba(24, 34, 57, 0.82)"
  luminous-blue: "#4d9cff"
  luminous-blue-bright: "#7bb8ff"
  luminous-blue-deep: "#286bd6"
  action-blue: "#3388f3"
  action-blue-hover: "#4798fb"
  action-blue-wash: "rgba(77, 156, 255, 0.20)"
  active-blue-glass: "rgba(77, 156, 255, 0.18)"
  exchange-gold: "#f3c969"
  exchange-gold-soft: "#f8dda0"
  critical-red: "#ff7d86"
  success-green: "#67d89a"
  information-blue: "#91b9ff"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(40px, 5vw, 62px)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(30px, 2.6vw, 42px)"
    fontWeight: 680
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Helvetica Neue, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 680
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Helvetica Neue, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "0.02em"
  metric:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(42px, 5vw, 64px)"
    fontWeight: 560
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "tnum"
rounded:
  sm: "11px"
  control: "12px"
  nav: "13px"
  md: "18px"
  composer: "20px"
  panel: "22px"
  lg: "24px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "30px"
  2xl: "44px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.action-blue-hover}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.action-blue-wash}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "44px"
  button-ghost:
    backgroundColor: "{colors.control-glass}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "44px"
  navigation-active:
    backgroundColor: "{colors.active-blue-glass}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.nav}"
    padding: "0 12px"
    height: "50px"
  chip-suggestion:
    backgroundColor: "{colors.control-glass}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 13px"
    height: "44px"
  composer-input:
    backgroundColor: "{colors.composer-glass}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.composer}"
    padding: "17px 18px 10px"
  card-answer:
    backgroundColor: "{colors.control-glass}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.composer}"
    padding: "20px"
  sheet-evidence:
    backgroundColor: "{colors.panel-glass}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "22px"
    width: "438px"
---

# Design System: BursaIQ

## Overview

**Creative North Star: "The Luminous Exchange Desk"**

BursaIQ is an exchange command surface, not a dashboard of competing cards. The experience should feel like a composed decision desk after dark: precise, accountable, and spacious enough for one clear question to lead. A midnight-indigo field recedes while luminous blue reveals the next useful action.

The interface borrows Apple's restraint rather than its ornament. Deep translucent materials establish hierarchy, SF Pro system typography stays quiet and legible, and generous separation makes dense market intelligence feel manageable. Users ask first, inspect evidence only when needed, then move governed answers into review without leaving the conversation.

**Key Characteristics:**

- Midnight-indigo atmosphere with luminous blue agency.
- One conversational focal point before advanced controls.
- Deep, sparse materials with soft inset highlights rather than visible card borders.
- Evidence and analysis arrive as a spatially consistent right-side sheet.
- Governed status, synthetic-data labels, and review state remain visible at decision points.
- Tactile but restrained motion with immediate press feedback and no gratuitous bounce.

## Colors

The palette is a midnight exchange floor illuminated by cool blue action light, with gold reserved for provenance and caution and semantic colors used only when state matters.

### Primary

- **Luminous Exchange Blue** (#4d9cff): The core active-navigation, chart, and emphasis color; it identifies available agency without flooding the screen.
- **Bright Luminous Blue** (#7bb8ff): Readable active detail, focus-adjacent emphasis, and chart points.
- **Deep Action Blue** (#286bd6): A supporting blue for gradients and depth beneath luminous elements.
- **Action Blue** (#3388f3): The concentrated call-to-action color for submit, send, approve, and enabled switches.
- **Action Blue Hover** (#4798fb): The brighter primary-action state that confirms intent.
- **Action Blue Wash** (rgba(77, 156, 255, 0.20)): Secondary-action material that supports without outranking a solid primary action.
- **Active Blue Glass** (rgba(77, 156, 255, 0.18)): Active-navigation and suggestion-hover material.

### Secondary

- **Exchange Gold** (#f3c969): Marks prototype status, as-of context, pending review, and cautionary evidence. It signals stewardship rather than promotion.
- **Soft Exchange Gold** (#f8dda0): Provides readable gold-toned text on dark materials without becoming a competing action color.

### Tertiary

- **Success Green** (#67d89a): Communicates ready, granted, completed, and positive market states.
- **Critical Red** (#ff7d86): Communicates destructive review actions, denied states, and negative chart values.
- **Information Blue** (#91b9ff): Supports plot annotations and informational file treatments when action blue would imply interactivity.

### Neutral

- **Primary Ink** (#f7f8fc): Near-white for decisive content and active labels.
- **Secondary Ink** (#c7cede): Cool gray for body copy and supporting controls.
- **Tertiary Ink** (#909bb1): Receded gray for metadata, inactive navigation, and labels.
- **Midnight Ground** (#070b16): The page-level field beneath every material.
- **Indigo Base** (#0b1120): Deep structural surface and opaque fallback background.
- **Indigo Glass** (#111a2d): Material tint for primary workspace surfaces.
- **Raised Indigo** (#172238): Focused and raised control surface within the midnight field.
- **Muted Indigo** (#1d2a43): Upper tonal step for restrained control depth.
- **Cool Hairline** (rgba(213, 224, 255, 0.10)): Quiet separation used only when tone alone is insufficient.
- **Strong Cool Hairline** (rgba(220, 230, 255, 0.17)): Higher-contrast boundary for focus and accessibility fallbacks.
- **Panel Glass** (rgba(17, 25, 43, 0.72)): Primary translucent material for workspace and evidence panels.
- **Control Glass** (rgba(255, 255, 255, 0.065)): Light fill for chips, ghost actions, and nested cards.
- **Composer Glass** (rgba(24, 34, 57, 0.82)): Deep focused material for the signature assistant composer.

### Named Rules

**The Luminous Priority Rule.** Blue belongs to action, focus, active navigation, and governed visualization; body copy and passive decoration stay neutral so the command path remains obvious.

## Typography

**Display Font:** SF Pro Display through the Apple system stack

**Body Font:** SF Pro Text through the Apple system stack

**Label/Mono Font:** SF Pro Text; governed figures use tabular numerals rather than a separate monospace face

**Character:** The system stack feels native, disciplined, and operational. Optical sizing and compact negative tracking give large headings confidence, while body copy remains unstyled enough to keep evidence easy to audit.

### Hierarchy

- **Display** (700, `clamp(40px, 5vw, 62px)`, 1.02): The centered assistant invitation in the first viewport.
- **Headline** (680, `clamp(30px, 2.6vw, 42px)`, 1.08): Workspace titles and high-level page headings.
- **Title** (680, `20px`, 1.25): Answer titles, sheet headings, and modal hierarchy.
- **Body** (400, `15px`, 1.55): Default application copy; analytical answer prose narrows to roughly 72 characters per line and opens to 1.68 leading.
- **Label** (650, `11px`, `0.02em`): Navigation metadata, controls, state labels, and compact governance language; sentence case is the default.
- **Metric** (560, `clamp(42px, 5vw, 64px)`, 1): Market figures with tabular numerals and display-scale tracking.

### Named Rules

**The Optical Restraint Rule.** Use negative tracking only for display, headline, title, and major metric roles; body and small labels stay at natural spacing and avoid all-caps except unavoidable source abbreviations.

## Layout

The desktop shell reserves a 286px navigation column containing a 258px floating sidebar inset 14px from the viewport. The sticky top material is 54px high, and the main workspace uses 30px horizontal and 34px top padding. Content centers within a 1540px maximum canvas; the quiet home state narrows to 1120px and the prompt itself to 810px so the first action remains unmistakable.

Evidence expands the canvas into a flexible conversation column plus a 438px right-side sheet with an 18px gutter. Below 1170px, the sheet contracts to 370px. Below 900px, navigation becomes a reversible floating drawer and evidence enters the document flow beneath the answer. Below 620px, the top material, panel radii, prompt spacing, and horizontal padding compact without reducing core controls below 44px.

Spacing follows an airy 8 / 12 / 18 / 24 / 30 / 44px rhythm. Dense content stays inside a surface; separate tasks receive visible spatial separation rather than being divided into a field of equally weighted cards.

**The Conversation First Rule.** In an empty command surface, center one prompt and keep advanced analysis absent until a question creates a reason for it.

**The Right-Side Evidence Rule.** On wide screens, sources, governed method, plots, and full analysis use the same right-side sheet so opening evidence never changes the user's spatial model.

## Elevation & Depth

The system uses a hybrid of tonal layering, translucent blur, soft ambient shadow, and a one-pixel inset highlight. Midnight ground carries no elevation. Navigation and modal sheets are the heaviest materials; workspace panels and the composer sit one step lower; chips and controls are light translucent fills. Borders are usually absent, and depth should come from material contrast before a line is introduced.

### Shadow Vocabulary

- **Navigation Material** (`box-shadow: 0 22px 70px rgba(0, 0, 0, 0.32), inset 0 1px rgba(255, 255, 255, 0.08)`): Use only on the floating sidebar.
- **Top Material** (`box-shadow: 0 13px 38px rgba(0, 0, 0, 0.20), inset 0 1px rgba(255, 255, 255, 0.07)`): Keep the sticky header present without forming a hard bar.
- **Panel Material** (`box-shadow: 0 26px 72px rgba(0, 0, 0, 0.22), inset 0 1px rgba(255, 255, 255, 0.06)`): Use for answer, page, and evidence surfaces.
- **Action Lift** (`box-shadow: 0 8px 22px rgba(31, 108, 210, 0.30)`): Use beneath primary and send actions.
- **Composer Material** (`box-shadow: 0 25px 70px rgba(0, 0, 0, 0.30), inset 0 1px rgba(255, 255, 255, 0.095)`): Give the signature input deep ambient presence.
- **Composer Focus** (`box-shadow: 0 28px 74px rgba(0, 0, 0, 0.34), 0 0 0 3px rgba(77, 156, 255, 0.20), inset 0 1px rgba(255, 255, 255, 0.10)`): Raise the composer and add its restrained halo.
- **Dialog Material** (`box-shadow: 0 38px 110px rgba(0, 0, 0, 0.55), inset 0 1px rgba(255, 255, 255, 0.09)`): Pair the strongest depth level with background dimming and blur.

### Named Rules

**The Material Hierarchy Rule.** Use heavier translucency for navigation and governed sheets, lighter translucency for interactive surfaces, and never stack ornamental glass layers without a functional hierarchy change.

**The Grounded Motion Rule.** Press feedback is immediate and small, state transitions settle in roughly 150–160ms, sheets materialize from the right, and dialogs scale gently; reduced-motion mode removes these spatial effects.

## Shapes

The form language is softly machined: compact controls use 11–13px corners, primary materials use 18–24px corners, the composer uses 20px, and pills are fully rounded. Borders are mostly replaced by translucent fills and inset highlights. The user's question bubble is the deliberate exception, using one tighter lower-right corner to point back toward its author.

**The Soft Precision Rule.** Rounded forms should feel engineered and grounded, never bubbly: keep curves consistent with component scale and preserve straight alignment across adjacent analytical content.

## Components

### Buttons

- **Shape:** Grounded rounded rectangle with a 44px minimum touch height and 12px corners.
- **Primary:** White label over concentrated action blue, 15px horizontal padding, and a compact blue-tinted shadow.
- **Hover / Focus:** Brighten the fill, preserve the three-pixel-offset focus outline, and compress to 97% only during press.
- **Secondary:** White label over a low-alpha luminous-blue fill; use for available actions that should not outrank submit or send.
- **Ghost:** Secondary ink over a light glass fill; use for cancel, neutral navigation, and tertiary actions.
- **Danger:** Soft red text over a restrained red material; reserve for rejection and change-request decisions.

### Chips

- **Style:** Fully rounded glass control with 44px minimum height, compact label type, and generous horizontal padding.
- **State:** Suggestion chips gain a faint blue material on hover; status chips use semantic color only when a real state is present.

### Cards / Containers

- **Corner Style:** 20–22px for answer and primary workspace surfaces; 15–16px for nested evidence and table containers.
- **Background:** Indigo glass for primary surfaces and low-alpha white for nested answer or evidence groups.
- **Shadow Strategy:** Ambient depth belongs to the parent material; nested cards rely on tonal contrast and inset light.
- **Border:** None by default. Use the hairline token only for data rows, source separation, or higher-contrast fallbacks.
- **Internal Padding:** 20–22px for answer and evidence content, increasing to 26–44px for pages and dialogs.

### Inputs / Fields

- **Style:** The assistant composer is a 20px translucent indigo material with a 16px text field, 44px send control, and grounding status in its footer. Dialog fields use a darker inset surface with 13px corners.
- **Focus:** Composer focus raises the material and adds a subtle three-pixel blue halo. Standalone controls use a two-pixel light-blue outline with a three-pixel offset.
- **Error / Disabled:** Errors use clear red copy and `aria-invalid`; disabled actions mute both text and fill without disappearing.

### Navigation

- **Style:** A floating 258px translucent sidebar with 50px rows, 13px corners, 19px line icons, and two-line sentence-case labels.
- **States:** Hover adds a neutral glass wash; active state uses a restrained blue material with brighter supporting text, never a competing indicator stripe.
- **Mobile:** Below 900px, navigation becomes a floating drawer with a blurred scrim, inert background, focus transfer, and Escape dismissal.

### Assistant Composer

The composer is the signature control and the first viewport's visual anchor. It should read as one deep material rather than a field plus toolbar, keep the prompt copy dominant, expose the grounded-data status quietly, and place the blue send action at the lower right.

### Evidence Sheet

The evidence sheet is a sticky right-side material with stable Plot, Analysis, and Sources tabs. It enters from the right, keeps its own scroll context on desktop, and collapses into the page flow on narrow screens; charts, methods, source cards, and warnings share the same nested tonal vocabulary.

### Answer and Review Handoff

Assistant answers use a quiet translucent card, 72-character reading measure, visible provenance, and compact actions. “Explore” opens the evidence sheet; “Verify” and “Create PDF” move the answer forward without changing the conversation's center of gravity.

**The 44-Point Rule.** Every primary, icon, navigation, chip, send, and reviewer action must preserve at least a 44px interaction target at shipped breakpoints.

**The Governed Handoff Rule.** Evidence, synthetic-data status, and verification state stay visible wherever an answer can be exported, approved, or acted upon.

## Do's and Don'ts

### Do:

- **Do** let one centered assistant prompt own the quiet first viewport.
- **Do** use luminous blue for agency, focus, active navigation, and governed visualization.
- **Do** reveal analysis in the consistent right-side evidence sheet when the user asks for depth.
- **Do** preserve visible provenance, synthetic-data labels, access state, and human-review status at decision points.
- **Do** use generous separation and a 44px minimum interaction target across desktop and mobile.
- **Do** honor reduced motion, reduced transparency, increased contrast, keyboard focus, and Escape dismissal.

### Don't:

- **Don't** turn BursaIQ into a dashboard of equal-weight cards, KPIs, and permanent analysis panels.
- **Don't** stack glass for decoration or place translucent surfaces where no hierarchy changes.
- **Don't** spend action blue on passive ornament, long-form copy, or every icon.
- **Don't** use display tracking, all-caps metadata, or tiny dense labels as a substitute for hierarchy.
- **Don't** introduce bounce, overshoot, or motion that delays the user's next action.
- **Don't** hide evidence, review state, access boundaries, or synthetic-data disclosure behind a separate workflow.
