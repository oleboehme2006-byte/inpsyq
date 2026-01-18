# Design System Principles

## Philosophy

**One Dimension → One Visual Layer.**

We avoid "fruit salad" dashboards. Every pixel must earn its place.

## Visual Language

### 1. Severity (Color)
We use color **exclusively** to denote severity or state.
- **Red/Rose**: Critical / Danger / Worsening.
- **Amber/Orange**: Warning / Caution.
- **Green/Emerald**: Good / Improving / Stable.
- **Neutral/Slate**: Context / Metadata.

*Never use arbitrary colors for categories (e.g., "Sales is Blue, Eng is Purple"). Categories use position or labels.*

### 2. Uncertainty (Opacity/Blur)
- **High Confidence**: Solid, opaque, sharp.
- **Low Confidence**: Translucent, blurred, dashed.

### 3. Importance (Size/Weight)
- **Primary Metric**: Large text, heavy weight.
- **Supporting Data**: Small text, muted color.

## Component Architecture

We use a modified Atomic Design pattern tailored for Next.js/Tailwind.

### Directory Structure
```
components/
├── ui/          # Low-level primitives (Button, Card, Badge) - Shadcn/Radix
├── shared/      # Shared domain components (UserAvatar, StatusIcon)
├── charts/      # Data visualization primitives (TrendLine, SparkBar)
├── domain/      # Business-logic components
│   ├── team/    # Team-specific views
│   └── exec/    # Executive-specific views
└── layout/      # Page shells, Navigation
```

### Key Libraries
- **Tailwind CSS**: Styling engine.
- **Shadcn UI**: Accessible primitives (Radix UI based).
- **Lucide React**: Iconography.
- **Recharts**: Charting engine (customized).

## Pattern: Data-Driven Components

Components should generally accept a *data object* rather than 20 individual props.

**Bad**:
```tsx
<TrendCard title="Score" value={85} delta={2} isGood={true} ... />
```

**Good**:
```tsx
<TrendCard metric={myMetricObject} options={{ strict: true }} />
```

This enforces consistency with the domain model.

## Responsive Behavior

- **Mobile First**: All layouts must work on 375px width.
- **Desktop**: Leverage width for denser data density, not just whitespace.
- **Touch Targets**: 44px min for interactive elements on touch devices.
