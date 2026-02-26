# LeanLoop Design System (Draft)

_Source: Vika review (UI consistency pass)_

## Core principles
- Premium, clean aesthetic with **System / Light / Dark** support
- **No-image premium first** (typography, spacing, surfaces, shadows)
- Consistent component hierarchy and spacing
- Default accent: **Yellow**, with options **Pink / Teal / Yellow**

## Color tokens (recommended)

### Base
- `bgPrimary`: `#FFFFFF` (light), `#121212` (dark)
- `bgSecondary`: `#F8F9FA` (light), `#1E1E1E` (dark)
- `surfaceCard`: `#FFFFFF` (light), `#1E1E1E` (dark)
- `surfaceElevated`: `#FFFFFF` (light), `#2A2A2A` (dark)
- `border`: `#E0E0E0` (light), `#444444` (dark)
- `textPrimary`: `#1A1A1A` (light), `#E0E0E0` (dark)
- `textSecondary`: `#666666` (light), `#AAAAAA` (dark)
- `textMuted`: `#999999` (light), `#777777` (dark)

### Accent options
- Yellow: `#FFD700`
- Pink: `#FF69B4`
- Teal: `#20B2AA`

### Status
- Success: `#4CAF50`
- Warning: `#FF9800`
- Error: `#F44336`
- Info: `#2196F3`

## Typography scale
- h1: 32/40, 700
- h2: 28/36, 700
- h3: 24/32, 600
- h4: 20/28, 600
- body-md: 16/24, 400
- body-sm: 14/20, 400
- label: 12/16, 500

## Spacing (8px grid)
- xs 4, sm 8, md 16, lg 24, xl 32, xxl 48

## Radius
- sm 4, md 8, lg 12, xl 16, pill 9999

## Shadows
- sm: 0 2 4 rgba(0,0,0,0.05)
- md: 0 4 8 rgba(0,0,0,0.10)
- lg: 0 8 16 rgba(0,0,0,0.15)

## Implementation checklist
1. Add theme tokens + a `useAppTheme()` hook
2. Create primitives: `Screen`, `Card`, `Button`, `Chip`
3. Replace hard-coded hex values in screens with primitives/tokens
4. Ensure accent flows into:
   - tab active tint
   - primary CTAs
   - progress bars
   - active chips/pills
5. Visual regression QA (iOS + web) for contrast/spacing
