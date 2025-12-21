# Motion and Interaction Specification

## Motion Semantics

All motion in InPsyq dashboards is **meaning-bearing**, never decorative.

### Motion Encoding Table

| State | Visual Motion |
|-------|---------------|
| High uncertainty (σ) | Larger halo radius, slower pulse |
| Low uncertainty | Tighter core, crisp edges |
| Positive trend | Slow rightward/upward drift |
| Negative trend | Slow leftward/downward drift |
| High volatility | Irregular pulse timing, faster |
| Low volatility | Steady, predictable pulse |
| Governance blocked | Frosted overlay, no motion |

### Animation Durations

| Element | Duration | Easing |
|---------|----------|--------|
| Halo pulse | 3-5s | ease-in-out |
| Trend drift | continuous | linear |
| Hover reveal | 300ms | ease-out |
| State transition | 500-700ms | ease |
| Loading skeleton | 1.5s | linear |

---

## Interaction Rules

### Allowed
- **Hover**: Reveals decomposition, highlights related elements
- **Focus**: Same as hover for keyboard navigation
- **Click on team field**: Navigate to team dashboard

### Forbidden
- Click-to-reveal critical information
- Drag interactions
- Gamification elements
- Attention-seeking notifications

---

## Reduced Motion

When `prefers-reduced-motion: reduce` is detected:

1. All pulse animations disabled
2. Drift animations disabled
3. Transitions reduced to opacity changes
4. Halos remain static at full size

---

## CSS Variables

```css
--motion-pulse-duration: 4s;
--motion-drift-speed: 8px;
--motion-transition-fast: 300ms;
--motion-transition-slow: 700ms;
```
