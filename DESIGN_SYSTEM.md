# ReactorMap Design System

**Version:** 1.0.0
**Theme:** VOLCANIC - Dark Luxe Nuclear Observatory

---

## Brand Identity

ReactorMap is an interactive 3D visualization of global nuclear power infrastructure. The design language combines:
- **Scientific precision** - Data-driven, technical aesthetic
- **Dark luxury** - Premium feel with volcanic/obsidian palette
- **Nuclear energy themes** - Radioactive greens, warning colors, glow effects

---

## Color Palette

### Core Colors

| Name | Variable | Hex | Usage |
|------|----------|-----|-------|
| **Obsidian** | `--obsidian` | `#050505` | Primary background |
| **Charcoal** | `--charcoal` | `#111111` | Secondary background, panels |
| **Cream** | `--cream` | `#f5f0e8` | Primary text |
| **Silver** | `--silver` | `#a0a0a0` | Secondary text, muted content |
| **Muted** | `--muted` | `#666666` | Disabled states, subtle text |

### Accent Colors

| Name | Variable | Hex | Usage |
|------|----------|-----|-------|
| **Lava** | `--lava` | `#e85d04` | Primary accent, CTAs, links |
| **Lava Light** | `--lava-light` | `#ff7b29` | Hover states |
| **Reactor Green** | `--reactor-green` | `#22ff66` | Operational status, success |

### Status Colors

| Status | Color | Hex |
|--------|-------|-----|
| Operational | Green | `#22ff66` |
| Under Construction | Yellow | `#ffee00` |
| Planned | Blue | `#00aaff` |
| Suspended | Orange | `#ff9900` |
| Shutdown | Gray | `#888888` |
| Cancelled | Red | `#ff4444` |

### Tailwind Classes

```tsx
// Background
bg-obsidian      // #050505
bg-charcoal      // #111111

// Text
text-cream       // #f5f0e8
text-silver      // #a0a0a0
text-muted       // #666666
text-lava        // #e85d04
text-lava-light  // #ff7b29

// Accents
bg-lava/20       // Semi-transparent orange
text-[#22ff66]   // Reactor green (operational)
```

---

## Typography

### Font Families

| Type | Font | Variable | Fallbacks |
|------|------|----------|-----------|
| Display | Cormorant Garamond | `--font-display` | Georgia, serif |
| Body | IBM Plex Sans | `--font-body` | system-ui, sans-serif |
| Mono | JetBrains Mono | `--font-mono` | Fira Code, monospace |

### Type Scale

| Element | Classes | Size |
|---------|---------|------|
| Page Title | `text-4xl md:text-6xl font-display font-bold` | 36px → 60px |
| Section Title | `text-2xl font-semibold` | 24px |
| Card Title | `text-xl font-semibold` | 20px |
| Body | `text-base` | 16px |
| Small | `text-sm` | 14px |
| Caption | `text-xs` | 12px |

### Usage Examples

```tsx
// Page title
<h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
  Page Title
</h1>

// Section heading
<h2 className="text-2xl font-semibold mb-4 text-cream">
  Section Title
</h2>

// Monospace numbers/data
<span className="font-mono font-bold text-[#22ff66]">
  441
</span>
```

---

## Components

### Hero Section

Standard hero with glow effect for index pages.

```tsx
<div className="relative overflow-hidden">
  {/* Glow Effect */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#22ff66]/10 rounded-full blur-[100px]" />
  </div>

  <div className="max-w-6xl mx-auto px-4 py-12 relative">
    <div className="text-center mb-8">
      <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
        Page Title
      </h1>
      <p className="text-xl text-silver">
        Subtitle text
      </p>
    </div>

    {/* Stats Row */}
    <div className="flex flex-wrap justify-center gap-6 text-center">
      <div>
        <div className="text-2xl font-mono font-bold text-[#22ff66]">123</div>
        <div className="text-sm text-silver">Label</div>
      </div>
      <div className="w-px bg-white/20" />
      <div>
        <div className="text-2xl font-mono font-bold text-cream">456</div>
        <div className="text-sm text-silver">Label</div>
      </div>
    </div>
  </div>
</div>
```

### Glass Panel

Frosted glass effect for cards and containers.

```tsx
<div className="glass-panel rounded-xl p-6">
  {/* Content */}
</div>
```

CSS Definition:
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Page Header

Standard header with back navigation and CTA.

```tsx
<header className="border-b border-white/10 bg-charcoal/50 backdrop-blur-xl">
  <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <Link href="/" className="flex items-center gap-2 text-silver hover:text-cream transition-colors">
      <ArrowLeftIcon className="w-5 h-5" />
      <span className="font-medium">ReactorMap</span>
    </Link>

    <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-lava/20 hover:bg-lava/30 text-lava-light rounded-lg transition-colors">
      <MapIcon className="w-4 h-4" />
      View on Map
    </Link>
  </div>
</header>
```

### Breadcrumb

Simple breadcrumb navigation.

```tsx
<nav className="max-w-6xl mx-auto px-4 py-3 text-sm text-silver">
  <ol className="flex items-center gap-2">
    <li>
      <Link href="/" className="hover:text-cream transition-colors">Home</Link>
    </li>
    <li>/</li>
    <li className="text-cream">Current Page</li>
  </ol>
</nav>
```

### Stat Card

For displaying key metrics.

```tsx
<div className="text-center">
  <div className="text-2xl font-mono font-bold text-[#22ff66]">
    {value}
  </div>
  <div className="text-sm text-silver">{label}</div>
</div>
```

### Status Badge

Colored indicator for reactor status.

```tsx
<span className="flex items-center gap-2">
  <span
    className="w-3 h-3 rounded-full"
    style={{ backgroundColor: statusColor }}
  />
  <span>{statusLabel}</span>
</span>
```

### Buttons

#### Primary Button
```tsx
<button className="btn-primary">
  Primary Action
</button>

// Or with Tailwind
<button className="px-6 py-3 bg-lava hover:bg-lava-light text-cream rounded-lg font-medium transition-colors">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="btn-secondary">
  Secondary Action
</button>

// Or with Tailwind
<button className="px-6 py-3 border border-white/20 hover:bg-white/5 text-cream rounded-lg transition-colors">
  Secondary Action
</button>
```

#### Ghost Button (Links)
```tsx
<Link className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors">
  Browse by Country →
</Link>
```

### Progress Bar

Horizontal progress indicator.

```tsx
<div className="h-2 bg-white/10 rounded-full overflow-hidden">
  <div
    className="h-full bg-lava rounded-full transition-all"
    style={{ width: `${percentage}%` }}
  />
</div>
```

### Data Table

Standard table styling.

```tsx
<div className="glass-panel rounded-xl overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-white/5 border-b border-white/10">
        <tr>
          <th className="text-left px-4 py-3 font-medium text-silver">Header</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
          <td className="px-4 py-3">Cell</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Layout Patterns

### Page Structure

```tsx
<main className="min-h-screen bg-obsidian text-cream">
  {/* Header */}
  <PageHeader />

  {/* Breadcrumb */}
  <Breadcrumb items={[...]} />

  {/* Hero Section */}
  <Hero title="..." subtitle="..." stats={[...]} />

  {/* Main Content */}
  <div className="max-w-6xl mx-auto px-4 py-8">
    {/* Content sections */}
  </div>

  {/* Footer/Data Source */}
  <p className="mt-12 text-sm text-muted text-center">
    Data source: IAEA PRIS database • Updated regularly
  </p>
</main>
```

### Container Widths

| Width | Class | Usage |
|-------|-------|-------|
| Small | `max-w-4xl` | About page, text-heavy content |
| Standard | `max-w-6xl` | Index pages, grids |
| Full | `max-w-7xl` | Wide layouts |

### Grid Patterns

```tsx
// 3-column responsive grid
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>

// 2-column grid
<div className="grid gap-4 md:grid-cols-2">
  {/* Cards */}
</div>
```

---

## Spacing Scale

Using Tailwind's default scale with common patterns:

| Token | Value | Usage |
|-------|-------|-------|
| `gap-2` | 8px | Inline elements |
| `gap-4` | 16px | Card grid gaps |
| `gap-6` | 24px | Section gaps |
| `py-3` | 12px | Nav/breadcrumb padding |
| `py-4` | 16px | Header padding |
| `py-8` | 32px | Content section padding |
| `py-12` | 48px | Hero section padding |
| `mb-4` | 16px | Heading bottom margin |
| `mb-8` | 32px | Section bottom margin |

---

## Effects & Animations

### Glow Effect

```tsx
// Green glow (default for heroes)
<div className="absolute ... w-[600px] h-[300px] bg-[#22ff66]/10 rounded-full blur-[100px]" />

// Orange/lava glow (alternative)
<div className="absolute ... bg-lava/10 rounded-full blur-[100px]" />
```

### Transitions

```css
/* Standard transition for interactive elements */
transition-colors  /* For color changes */
transition-all     /* For complex animations */

/* Duration: 150ms (Tailwind default) */
```

### Hover States

```tsx
// Links
hover:text-cream
hover:text-lava

// Buttons/Cards
hover:bg-white/5
hover:bg-white/10
hover:bg-lava/30
```

---

## Accessibility

### Color Contrast

- Primary text (`cream` on `obsidian`): 15.4:1 ratio
- Secondary text (`silver` on `obsidian`): 7.2:1 ratio
- Accent links (`lava` on `obsidian`): 5.1:1 ratio

### Focus States

```css
focus:outline-none
focus:ring-2
focus:ring-lava
focus:ring-offset-2
focus:ring-offset-obsidian
```

### Touch Targets

Minimum 44x44px for interactive elements on mobile.

---

## Icons

Using inline SVG with Heroicons patterns:

```tsx
// Standard icon size
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
</svg>

// Small icon size
<svg className="w-4 h-4" ... />
```

---

## Dark Mode

ReactorMap is dark-mode only. The obsidian/charcoal palette provides:
- Reduced eye strain for data-heavy viewing
- Premium, observatory-like aesthetic
- Better contrast for colorful status indicators
- Optimal viewing of the 3D globe visualization

---

## Code Style

### Component Structure

```tsx
/**
 * Component description
 */
export default function ComponentName({ prop1, prop2 }: Props) {
  // JSON-LD structured data (if needed)
  const jsonLd = { ... };

  return (
    <>
      {/* Structured data */}
      <script type="application/ld+json" ... />

      {/* Main content */}
      <main className="min-h-screen bg-obsidian text-cream">
        ...
      </main>
    </>
  );
}
```

### File Organization

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Shared UI components
│   │   ├── Hero.tsx
│   │   ├── GlassPanel.tsx
│   │   ├── PageHeader.tsx
│   │   └── ...
│   └── v3/                 # Globe/3D components
├── lib/                    # Utilities and types
└── styles/                 # Global styles
```
