# Design System

## Overview

Lockstep uses a design system built on Tailwind CSS with shadcn/ui components. All styling uses semantic tokens defined in CSS variables, ensuring consistency and easy theming.

## Color System

### Semantic Tokens

All colors are defined as HSL values in `src/index.css`. Lockstep uses a dark-first design system with a blue-violet primary color:

```css
:root {
  /* Core Palette - Deep, immersive dark 
     Background: #0E1116 or #111418 (near-black charcoal)
     Foreground: #F5F7FA (soft off-white)
  */
  --background: 220 20% 7%;        /* Main background - dark charcoal */
  --foreground: 216 33% 97%;        /* Primary text - soft off-white */
  
  /* Component colors */
  --card: 220 20% 10%;
  --card-foreground: 216 33% 97%;
  --popover: 220 20% 10%;
  --popover-foreground: 216 33% 97%;
  
  /* Primary - Decisive blue-violet #5B6CFF 
     Signals seriousness, works perfectly in dark mode
  */
  --primary: 233 100% 68%;          /* Primary actions - blue-violet */
  --primary-foreground: 0 0% 100%; /* White text on primary */
  --primary-glow: 233 100% 78%;    /* Glow effect variant */
  
  --secondary: 220 20% 14%;
  --secondary-foreground: 216 33% 97%;
  
  /* Status Colors - Muted, emotionally neutral */
  --confirmed: 156 52% 50%;         /* Muted green - #3FB984 */
  --maybe: 38 72% 65%;             /* Amber - #E6B566 */
  --out: 0 52% 62%;                /* Restrained red - #D46A6A */
  
  --muted: 220 15% 18%;
  --muted-foreground: 220 10% 60%;
  --accent: 233 100% 68%;
  --accent-foreground: 0 0% 100%;
  
  --destructive: 0 52% 62%;
  --destructive-foreground: 0 0% 100%;
  
  /* UI elements */
  --border: 220 15% 18%;
  --input: 220 15% 14%;
  --ring: 233 100% 68%;
  
  /* Button colors - Light #F5F7FA with dark text */
  --button-bg: 216 33% 97%;
  --button-text: 220 20% 10%;
}
```

### Dark Mode

The default theme is dark. The `.dark` class maintains similar values with slight adjustments:

```css
.dark {
  --background: 220 20% 7%;
  --foreground: 216 33% 97%;
  /* Similar structure with refined values */
}
```

### Usage Rules

| ✅ DO | ❌ DON'T |
|-------|----------|
| `bg-background` | `bg-white` |
| `text-foreground` | `text-black` |
| `text-muted-foreground` | `text-gray-500` |
| `border-border` | `border-gray-200` |
| `bg-primary` | `bg-slate-900` |

---

## Typography

### Font Stack

```css
--font-sans: "Inter", system-ui, sans-serif;
--font-display: "Cal Sans", "Inter", sans-serif;  /* For headings */
```

### Scale

| Class | Size | Use |
|-------|------|-----|
| `text-xs` | 12px | Captions, labels |
| `text-sm` | 14px | Secondary text |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Lead paragraphs |
| `text-xl` | 20px | Subheadings |
| `text-2xl` | 24px | Section headers |
| `text-3xl` | 30px | Page headers |
| `text-4xl` | 36px | Hero subheads |
| `text-5xl` | 48px | Hero headlines |
| `text-6xl` | 60px | Display text |

### Font Weights

| Class | Weight | Use |
|-------|--------|-----|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasized text |
| `font-semibold` | 600 | Subheadings |
| `font-bold` | 700 | Headlines |

---

## Spacing

### Scale

Based on 4px base unit:

| Class | Value | Pixels |
|-------|-------|--------|
| `p-1` | 0.25rem | 4px |
| `p-2` | 0.5rem | 8px |
| `p-3` | 0.75rem | 12px |
| `p-4` | 1rem | 16px |
| `p-5` | 1.25rem | 20px |
| `p-6` | 1.5rem | 24px |
| `p-8` | 2rem | 32px |
| `p-10` | 2.5rem | 40px |
| `p-12` | 3rem | 48px |
| `p-16` | 4rem | 64px |

### Component Spacing Guidelines

| Element | Padding | Gap |
|---------|---------|-----|
| Button | `px-4 py-2` | - |
| Card | `p-6` | - |
| Section | `py-16 md:py-24` | - |
| Form fields | - | `gap-4` |
| Feature grid | - | `gap-6 md:gap-8` |

---

## Components

### Button Variants

```tsx
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>
```

### Button Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

### Card Component

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input Components

```tsx
<Input placeholder="Enter text..." />
<Textarea placeholder="Enter long text..." />
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

---

## Animation

### Framer Motion Tokens

```tsx
// Standard transitions
const transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1]  // ease-out
};

// Spring for bouncy effects
const spring = {
  type: "spring",
  stiffness: 300,
  damping: 30
};
```

### Animation Components

```tsx
// Reveal on scroll
<Reveal animation="fadeUp" delay={0.1}>
  <Content />
</Reveal>

// Staggered children
<StaggerContainer>
  <StaggerItem>Item 1</StaggerItem>
  <StaggerItem>Item 2</StaggerItem>
</StaggerContainer>
```

### Motion Preferences

Always respect `prefers-reduced-motion`:

```tsx
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
```

---

## Responsive Breakpoints

| Prefix | Min Width | Target |
|--------|-----------|--------|
| (none) | 0px | Mobile first |
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

### Mobile-First Examples

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row">

// Hide on mobile, show on desktop
<div className="hidden md:block">

// Full width on mobile, contained on desktop
<div className="w-full max-w-none md:max-w-4xl">
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

Usage: `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`

---

## Border Radius

```css
--radius: 0.5rem;  /* 8px default */
```

| Class | Value |
|-------|-------|
| `rounded-sm` | 0.125rem (2px) |
| `rounded` | 0.25rem (4px) |
| `rounded-md` | 0.375rem (6px) |
| `rounded-lg` | 0.5rem (8px) |
| `rounded-xl` | 0.75rem (12px) |
| `rounded-2xl` | 1rem (16px) |
| `rounded-full` | 9999px |
