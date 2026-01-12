# Visual Guidelines

## Brand Aesthetic

Lockstep's visual identity balances **professionalism** with **approachability**. We're organizing celebrations, not corporate meetings—but we take the organizational work seriously.

### Design Principles

1. **Clarity over cleverness**: Users should instantly understand what they're looking at
2. **Delightful details**: Subtle animations and interactions that spark joy
3. **Mobile-first**: 80%+ of guests access via phone—design for thumbs
4. **Accessible by default**: WCAG AA compliance minimum

---

## Logo Usage

### Primary Logo

| File | Location | Use Case |
|------|----------|----------|
| `lockstep-logo-light.png` | `/public/` | On dark backgrounds, email templates (served from root) |
| `lockstep-logo-light.png` | `/src/assets/` | React component imports |
| `lockstep-icon.png` | `/public/` | Favicon, app icon, small spaces |

### Clear Space

Maintain minimum clear space equal to the height of the "L" in Lockstep around all sides of the logo.

### Minimum Size

- Full logo: 120px width minimum
- Icon only: 24px minimum

### Don'ts

- ❌ Don't stretch or distort
- ❌ Don't change colors
- ❌ Don't add effects (shadows, glows)
- ❌ Don't place on busy backgrounds
- ❌ Don't rotate

---

## Color Palette

### Primary Palette

| Name | HSL | Hex | Use |
|------|-----|-----|-----|
| Primary Blue-Violet | 233 100% 68% | #5B6CFF | Primary actions, buttons, links, focus states |
| Background Dark | 220 20% 7% | #0E1116 | Main background (dark charcoal) |
| Foreground Light | 216 33% 97% | #F5F7FA | Primary text (soft off-white) |
| Card Background | 220 20% 10% | #181B20 | Card/surface backgrounds |
| Button Light | 216 33% 97% | #F5F7FA | Light button backgrounds |
| Button Text Dark | 220 20% 10% | #1A1D24 | Dark text on light buttons |

### Status Colors

| Name | HSL | Hex | Use |
|------|-----|-----|-----|
| Confirmed | 156 52% 50% | #3FB984 | Success states, confirmed RSVPs |
| Maybe | 38 72% 65% | #E6B566 | Pending states, maybe RSVPs |
| Out | 0 52% 62% | #D46A6A | Error states, declined RSVPs |

### Semantic Colors

| Purpose | Token | Value |
|---------|-------|-------|
| Success | `--confirmed` | #3FB984 (muted green) |
| Warning | `--maybe` | #E6B566 (amber) |
| Error | `--destructive` | #D46A6A (restrained red) |
| Primary | `--primary` | #5B6CFF (blue-violet) |

---

## Typography

### Font Selection

**Primary**: Inter
- Clean, modern sans-serif
- Excellent readability at all sizes
- Wide character set

**Display** (future): Cal Sans or similar
- For hero headlines
- More personality than Inter

### Hierarchy Example

```
Hero Headline       48-60px  Bold
Section Title       30-36px  Bold
Card Title          20-24px  Semibold
Body Text           16px     Regular
Secondary Text      14px     Regular
Caption             12px     Regular
```

### Line Heights

| Text Type | Line Height |
|-----------|-------------|
| Headlines | 1.1 - 1.2 |
| Body | 1.5 - 1.6 |
| UI Labels | 1.25 |

---

## Iconography

### Icon Set

Using [Lucide Icons](https://lucide.dev) for consistency:

| Action | Icon |
|--------|------|
| Add | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Settings | `Settings` |
| User | `User` |
| Check | `Check` |
| Close | `X` |
| Arrow | `ChevronRight`, `ChevronLeft` |
| Calendar | `Calendar` |
| Clock | `Clock` |
| Location | `MapPin` |

### Icon Sizing

| Context | Size |
|---------|------|
| Inline with text | 16px |
| Buttons | 18-20px |
| Cards | 24px |
| Feature highlights | 32-40px |

### Icon Colors

- Default: `text-foreground`
- Muted: `text-muted-foreground`
- Interactive: `text-primary`

---

## Imagery

### Photo Style

When using photography:
- **Authentic moments**: Real celebrations, not stock
- **Warm tones**: Slightly warm color grading
- **Natural lighting**: Avoid harsh flash
- **Diverse representation**: Various event types, people

### Illustrations (Future)

- Line-art style matching logo
- Single accent color highlights
- Simple, not overly detailed
- Consistent stroke width

---

## Motion

### Timing

| Type | Duration | Use |
|------|----------|-----|
| Micro | 100-150ms | Hover states, toggles |
| Short | 200-300ms | Reveals, fades |
| Medium | 300-500ms | Page transitions |
| Long | 500-800ms | Hero animations |

### Easing

| Type | Curve | Use |
|------|-------|-----|
| Ease Out | `[0.4, 0, 0.2, 1]` | Elements entering |
| Ease In | `[0.4, 0, 1, 1]` | Elements exiting |
| Ease In Out | `[0.4, 0, 0.2, 1]` | Looped animations |
| Spring | stiffness: 300, damping: 30 | Playful interactions |

### Motion Principles

1. **Purposeful**: Animation should aid understanding
2. **Subtle**: Don't distract from content
3. **Responsive**: Respect `prefers-reduced-motion`
4. **Consistent**: Same elements animate the same way

---

## Interactive States

### Buttons

| State | Change |
|-------|--------|
| Default | Base styles |
| Hover | Slight background shift, scale(1.02) |
| Active | Darker background, scale(0.98) |
| Focus | Ring outline (2px) |
| Disabled | 50% opacity, cursor: not-allowed |

### Cards

| State | Change |
|-------|--------|
| Default | Shadow-sm |
| Hover | Shadow-md, translateY(-2px) |
| Active | Shadow-sm |
| Selected | Border-primary, shadow-md |

### Form Inputs

| State | Change |
|-------|--------|
| Default | Border-input |
| Focus | Border-ring, ring shadow |
| Error | Border-destructive, error message |
| Disabled | Background-muted, text-muted |

---

## Responsive Design

### Breakpoint Strategy

1. **Design mobile-first**: Start with smallest screen
2. **Add complexity upward**: Enhance for larger screens
3. **Test at breakpoints**: 375, 768, 1024, 1440

### Touch Targets

- Minimum touch target: 44x44px
- Adequate spacing between targets
- Larger on mobile than desktop

### Content Reflow

| Element | Mobile | Desktop |
|---------|--------|---------|
| Navigation | Hamburger menu | Horizontal bar |
| Cards | Stack vertical | Grid 2-3 columns |
| Hero | Single column | Two columns |
| Forms | Full width | Max 600px centered |

---

## Accessibility

### Contrast Requirements

- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### Focus Indicators

All interactive elements must have visible focus states:
```css
focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
```

### Screen Reader Support

- Semantic HTML (`<nav>`, `<main>`, `<button>`)
- ARIA labels where needed
- Alt text for images
- Keyboard navigation throughout
