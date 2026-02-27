# Background Orbs Fix + Remaining Refinements

> File: `app/(public)/page.tsx`. Execute all. `npx tsc --noEmit` then `npm run build`. Delete this file after build passes.

## WHY THE ORBS ARE INVISIBLE — ROOT CAUSE

The main content wrapper at the top of the JSX is:

```tsx
<div className="relative bg-black text-white min-h-screen">
```

All content sections inside have `className="relative z-10"`. The orbs container is `fixed z-0`. The `bg-black` on the main wrapper — which is a normal flow element — paints an opaque black rectangle **in front of** the fixed z-0 orbs.

Additionally, `blur-[300px]` on 80vw elements is too heavy for many GPUs and gets silently dropped.

---

## FIX 1 — Make orbs visible by fixing z-index and blur

### 1a. Change the main wrapper background to transparent

The black background must come from something BEHIND the orbs, not in front. Change:

```tsx
<div className="relative bg-black text-white min-h-screen">
```

to:

```tsx
<div className="relative text-white min-h-screen">
```

### 1b. Add a black background layer BEHIND the orbs

BEFORE the orb container `<div>`, add a pure black fill:

```tsx
{/* Black base layer */}
<div className="fixed inset-0 bg-black z-[-1]" />
```

### 1c. Reduce blur to a GPU-safe value and increase size

Change the orbs from `blur-[300px]` to `blur-[150px]`. Also separate their positions:

```tsx
{/* === BACKGROUND ORBS === */}
<div className="fixed inset-0 pointer-events-none z-[1]">
    <motion.div
        className="absolute w-[90vw] h-[90vh] rounded-full blur-[150px] bg-[#E11D48]"
        style={{ opacity: redOpacity, top: '5%', left: '5%', y: redY }}
    />
    <motion.div
        className="absolute w-[90vw] h-[90vh] rounded-full blur-[150px] bg-[#F59E0B]"
        style={{ opacity: amberOpacity, top: '5%', right: '5%', y: amberY }}
    />
    <motion.div
        className="absolute w-[90vw] h-[90vh] rounded-full blur-[150px] bg-[#10B981]"
        style={{ opacity: greenOpacity, top: '5%', left: '15%', y: greenY }}
    />
</div>
```

Note: `z-[1]` for orbs (above black bg at z-[-1], below content). Remove `z-10` from ALL section elements and replace with `z-[2]` so content sits above orbs but orbs sit above the black background.

### 1d. Update ALL section z-indices from z-10 to z-[2]

Search for every `z-10` in section/nav classNames and change to `z-[2]`. The nav should stay `z-50`. Only change `z-10` that appears on section elements.

### 1e. Fix orb opacity — make them clearly visible

Increase red initial opacity and peaks:

```tsx
const redOpacity = useTransform(scrollYProgress, [0, 0.08, 0.25, 0.35], [0.12, 0.20, 0.20, 0]);
const amberOpacity = useTransform(scrollYProgress, [0.30, 0.37, 0.50, 0.60], [0, 0.18, 0.18, 0]);
const greenOpacity = useTransform(scrollYProgress, [0.55, 0.62, 0.75, 0.85], [0, 0.20, 0.20, 0]);
```

---

## VERIFICATION

After applying these fixes:

1. `npx tsc --noEmit` — zero errors
2. `npm run build` — passes
3. On the live site: a red glow should be faintly visible on the hero section
4. Scrolling down should transition to amber, then green
5. The overall page should still be predominantly dark/black
