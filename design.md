# Compass Design System: Refined Vibrant Compass

## Brand Personality
Friendly, Energetic, Local, and Accessible. Compass should feel like a trusted community neighbour—vibrant enough to be engaging for parents, but organised and clear enough to be highly functional.

## Visual Principles
- **Vibrancy with Purpose:** Use bold primary-inspired colours for key actions; keep backgrounds clean and high-contrast.
- **Modern Softness:** Rounded corners (8px–12px) and subtle shadows. No harsh borders.
- **Information Hierarchy:** Prioritise logistics (map, time, location) through icon-driven layouts.
- **Flexible Media:** Layouts remain attractive with missing photos — use colour blocks or icons as fallbacks.

## Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary (Action) | `#2D6AED` | Primary buttons, active states, map markers |
| Secondary (Energy) | `#FFD34E` | Accents, category badges, highlights |
| Surface | `#FAF8FF` | Main page background |
| Text | `#1A1C1E` | Body text — maximum readability |
| Success/Safe | `#34A853` | Positive indicators, library markers |

### Implementation Tokens
```css
--compass-primary: #2D6AED;
--compass-secondary: #FFD34E;
--compass-surface: #FAF8FF;
--compass-text: #1A1C1E;
--compass-success: #34A853;
--compass-border: #E8E8F0;
```

## Typography
- **Font:** Plus Jakarta Sans (Google Fonts)
- **Headings:** Bold (700), tight letter-spacing (`tracking-tighter`)
- **Body:** Regular (400), generous line-height (`leading-relaxed`)

## Component Guidelines
- **Cards:** White background, 1px border (`#E8E8F0`), 12px radius, soft shadow.
- **Buttons:** 8px radius. Primary uses brand blue.
- **Map:** High-contrast markers per category (Blue for playgroups, Green for libraries).
- **Header:** Clean, glassmorphism (`backdrop-blur`), accessible navigation.
