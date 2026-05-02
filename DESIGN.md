---
name: Vibrant Community System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#2563EB'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#FACC15'
  on-secondary: '#0b1c30'
  secondary-container: '#fed01b'
  on-secondary-container: '#6f5900'
  tertiary: '#22C55E'
  on-tertiary: '#ffffff'
  tertiary-container: '#007e37'
  on-tertiary-container: '#c1ffc5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
typography:
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

This design system is built to foster a sense of optimism, inclusivity, and clarity for a community directory. The brand personality is welcoming and energetic, moving away from the aggressive aesthetics of neo-brutalism toward a **Soft Modernism** approach. 

The UI prioritizes high legibility and breathability to ensure accessibility for all community members. It leverages a clean, off-white foundation to let vibrant accents pop without overwhelming the user. The emotional response should be one of "digital sunshine"—a helpful, friendly environment that feels organized yet approachable.

## Colors

The palette uses a triad of bright, saturated primary colors against a neutral, airy backdrop. 

- **Primary (Blue - #2563EB):** Used for primary actions, links, and navigation anchors to signify reliability.
- **Secondary (Yellow - #FACC15):** Used for highlights, category badges, and attention-grabbing elements to inject warmth.
- **Tertiary (Green - #22C55E):** Used for success states, active community status, and growth-related metrics.
- **Neutrals:** A range of cool grays provides structure. The background is a soft off-white (`#F8F9FF`) to reduce eye strain compared to pure white, while surfaces (cards, modals) use pure white to create subtle "lift."

## Typography

This design system exclusively utilizes **Plus Jakarta Sans** for its friendly, geometric curves and exceptional readability. 

- **Headlines:** Use Bold or ExtraBold weights with slight negative letter spacing to create a modern, punchy look.
- **Body Text:** Standardized at 16px (Medium) or 18px (Large) to ensure the directory remains accessible to users of all ages.
- **Line Heights:** Generous leading (1.6x) is applied to body text to prevent visual crowding in dense information lists.

## Layout & Spacing

The design system employs a **12-column fluid grid** for desktop and a single-column layout for mobile. A strict 8px spacing scale ensures mathematical harmony across all components.

Information density should be kept "low to medium." Large margins (`48px` on desktop) and wide gutters (`24px`) provide the necessary "white space" to separate directory entries, preventing the UI from feeling cluttered. Alignment should prioritize a strong left-axis for text readability.

## Elevation & Depth

To replace the hard shadows of neo-brutalism, this system uses **Ambient Shadows** and **Tonal Layering**.

- **Depth Levels:** Use three distinct levels. Level 1 (Default cards) uses a very soft, diffused shadow with a 10% opacity of the primary blue or neutral gray. Level 2 (Hover states) increases the blur and slightly shifts the Y-axis. Level 3 (Modals) uses a large, 40px blur to create a floating effect.
- **Soft Outlines:** Elements use a thin, 1px border in a light neutral shade (`#E2E8F0`) rather than black, creating definition without visual weight.
- **Background Tinting:** Subtle blue or yellow tints are used on section backgrounds to define content areas without needing hard lines.

## Shapes

The shape language is defined by **significant roundedness** to reinforce the friendly brand personality. 

- **Small Components:** Checkboxes and small tags use a `0.5rem` radius.
- **Standard Components:** Buttons and input fields use a `1rem` (rounded-lg) radius.
- **Containers:** Large cards and section blocks use a `1.5rem` (rounded-xl) radius.
- **Pills:** Search bars and status indicators should use full pill-shaping (circular ends) to contrast against the rectangular layout.

## Components

- **Buttons:** Primary buttons feature a solid Blue fill with white text. Secondary buttons use a soft Yellow fill with dark text. All buttons have a subtle "lift" shadow on hover.
- **Directory Cards:** White surfaces with a 1px soft gray border and `rounded-xl` corners. Information is structured with a prominent `h3` title and `body-md` description.
- **Chips & Badges:** Use tertiary Green or Secondary Yellow with 10% opacity fills and 100% opacity text for high-contrast, accessible categorization.
- **Input Fields:** Large, 1rem rounded corners with 16px internal padding. Focus states are indicated by a 2px Primary Blue glow.
- **Search Bar:** A prominent, pill-shaped element at the top of the directory with a subtle shadow and an oversized search icon for ease of use.
- **Member Avatars:** Large, circular imagery with a 2px white border and a soft ambient shadow to separate them from the card background.
