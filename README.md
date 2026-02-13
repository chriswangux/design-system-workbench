# Design System Workbench

A procedural design system workbench with 26 interactive tools across 9 areas. Every design token -- colors, typography, spacing, shadows, motion, layout -- is generated from mathematical parameters (bezier curves, modular scales, physics simulations) rather than manually picked. Built with React 19, TypeScript, and Tailwind CSS 4.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (default port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  App.tsx                          # Root shell: BrowserRouter + Sidebar + TopBar + routed tools
  main.tsx                         # React 19 entry point with StrictMode
  index.css                        # Tailwind v4 import + dark/light theme custom properties

  router/
    routes.tsx                     # 26 lazy-loaded tool routes organized into 9 sections

  components/
    controls/                      # Shared input components
      SliderWithInput.tsx          # Combined slider + number input with label/unit
      BezierCurveEditor.tsx        # Interactive SVG bezier curve editor with drag handles
      ColorSwatch.tsx              # Color swatch with tooltip (hex, oklch, gamut status)
      index.ts                     # Barrel export (also exports PaletteRow)
    shell/                         # App chrome components
      Sidebar.tsx                  # Collapsible navigation with sections and tool icons
      TopBar.tsx                   # Project name, undo/redo, save/load, theme toggle, export
      ToolLayout.tsx               # Layout primitives: ToolLayout, SplitPanel, ParameterSection
      index.ts                     # Barrel export

  core/
    engine/
      color/
        oklch.ts                   # Color creation, conversion (hex/rgb/css), gamut mapping via culori
        contrast.ts                # WCAG 2.1 contrast ratio + APCA algorithm + contrast matrix
        cvdSimulation.ts           # Color vision deficiency simulation (Brettel/Vienot matrices)
      math/
        bezier.ts                  # Cubic bezier evaluation (Newton-Raphson + bisection solver)
        scales.ts                  # Geometric, arithmetic, fibonacci scale generators
        spring.ts                  # Spring physics (velocity Verlet), spring-to-bezier approximation
      typography/
        ratios.ts                  # Line height / letter spacing calculation, type scale generation
    export/
      pipeline.ts                  # Unified export: CSS custom props | DTCG JSON | Tailwind config
      formatters/
        cssCustomProperties.ts     # Full CSS formatter with shadow, typography, alias -> var() support
        jsonDTCG.ts                # W3C DTCG JSON output (1:1 serialization)
        tailwindConfig.ts          # Tailwind v4 config with colors, spacing, motion tokens
      transforms/
        colorTransform.ts          # oklch -> hex / rgb / hsl conversion
        dimensionTransform.ts      # px <-> rem conversion
    hooks/
      useTheme.ts                  # Dark/light/system theme with media query listener
      useUndoRedo.ts               # Cmd+Z / Cmd+Shift+Z keyboard shortcuts via Zundo
    store/
      tokenStore.ts                # Zustand + Immer + Zundo store for all tokens and configs
      uiStore.ts                   # Zustand store for sidebar, theme, active tool state
    tokens/
      types.ts                     # W3C DTCG-aligned TypeScript types for all token kinds
      defaults.ts                  # Default generator configurations for each tool
      resolve.ts                   # Alias resolution, tree traversal, dependency graph builder

  tools/                           # 26 tools organized into 9 sections (see below)
    ToolPlaceholder.tsx            # Generic placeholder component (not used in production)
```

## The 26 Tools

### Visual Design (5 tools)

| Tool | Route | Description | Key Features |
|------|-------|-------------|--------------|
| **Color Lab** | `/visual/color-lab` | Procedural palette generation in OKLCH space | Bezier curves for hue/chroma/lightness, gamut mapping, multi-palette, lock points |
| **Typography Lab** | `/visual/typography-lab` | Type scale generator | Modular scale ratios (minor second through golden ratio), auto line-height tightening |
| **Spacing Lab** | `/visual/spacing-lab` | Spacing scale builder | Geometric/arithmetic/fibonacci/custom progressions from a base unit |
| **Shadow Lab** | `/visual/shadow-lab` | Shadow system from light source | 3D light position, directional + ambient layers, elevation steps |
| **Iconography** | `/visual/iconography` | Icon grid and stroke guidelines | Grid system, stroke weight, optical sizing |

### Interaction Design (2 tools)

| Tool | Route | Description |
|------|-------|-------------|
| **State Machine** | `/interaction/state-machine` | Component state diagram editor |
| **Feedback Patterns** | `/interaction/feedback-patterns` | Action feedback sequence editor |

### Motion Design (3 tools)

| Tool | Route | Description |
|------|-------|-------------|
| **Easing Curves** | `/motion/easing-editor` | Bezier and spring easing editor with visual preview |
| **Duration Scale** | `/motion/duration-scale` | Duration scale generator (geometric progression) |
| **Choreography** | `/motion/choreography` | Transition sequencing and stagger patterns |

### Content Design (2 tools)

| Tool | Route | Description |
|------|-------|-------------|
| **Voice & Tone** | `/content/voice-tone` | Brand voice positioning compass |
| **Microcopy** | `/content/microcopy` | UI copy templates and patterns |

### Accessibility (4 tools)

| Tool | Route | Description |
|------|-------|-------------|
| **Contrast Matrix** | `/accessibility/contrast-matrix` | WCAG 2.1 + APCA contrast ratio checking across all palette colors |
| **CVD Simulator** | `/accessibility/cvd-simulator` | Protanopia, deuteranopia, tritanopia, achromatopsia simulation |
| **Focus Order** | `/accessibility/focus-order` | Tab order visualization and planning |
| **Touch Targets** | `/accessibility/touch-target` | Minimum target size verification (WCAG 2.5.8) |

### Token Architecture (3 tools)

| Tool | Route | Description |
|------|-------|-------------|
| **Taxonomy Builder** | `/tokens/taxonomy` | Token naming convention and hierarchy design |
| **Relationship Graph** | `/tokens/relationship-graph` | D3 force-directed graph of token references |
| **Export Pipeline** | `/tokens/export-pipeline` | Multi-format export (CSS, DTCG JSON, Tailwind) |

### Theming (2 tools)

| Tool | Route | Description |
|------|-------|-------------|
| **Theme Derivation** | `/theming/derivation` | Algorithmic theme variant generation (dark/light/brand) |
| **Theme Compare** | `/theming/comparison` | Side-by-side theme preview |

### Layout & Responsive (3 tools)

| Tool | Route | Description |
|------|-------|-------------|
| **Grid System** | `/layout/grid-builder` | Interactive grid builder with columns, gutters, margins |
| **Breakpoints** | `/layout/breakpoint-explorer` | Breakpoint definition and responsive preview |
| **Responsive Spacing** | `/layout/responsive-spacing` | Adaptive spacing scales across breakpoints |

### Data Visualization (2 tools)

| Tool | Route | Description |
|------|-------|-------------|
| **Chart Palette** | `/data-viz/chart-palette` | Accessible data visualization color generation |
| **Data-Ink** | `/data-viz/data-ink` | Chart styling optimization (Tufte data-ink ratio) |

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 19.2 |
| Language | TypeScript | 5.9 |
| Bundler | Vite | 7.3 |
| Styling | Tailwind CSS | 4.1 |
| State | Zustand + Immer + Zundo | 5.0 / 11.1 / 2.3 |
| UI Primitives | Radix UI | Various |
| Color Science | culori | 4.0 |
| Graphs / Charts | D3 (force, interpolate, scale, shape) | 3.x / 4.x |
| Animation | Framer Motion | 12.34 |
| Icons | Lucide React | 0.564 |
| Validation | Zod | 4.3 |
| IDs | nanoid | 5.1 |

## Architecture

### Token Model

The token model follows the [W3C Design Tokens Community Group (DTCG)](https://www.designtokens.org/) specification. Key concepts:

- **Color Space**: All colors stored internally as OKLCH (`channels: [L, C, H]`, where L: 0-1, C: 0-0.4, H: 0-360)
- **Token Tiers**: `primitive` (raw values) -> `semantic` (purpose-based aliases) -> `component` (component-specific aliases)
- **Alias References**: `{color.blue.500}` syntax with recursive resolution (max depth 10)
- **Custom Extensions**: `com.dsw.generator` (source tool), `com.dsw.tier`, `com.dsw.tags`

Supported token types: `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`, `shadow`, `border`, `transition`, `gradient`, `strokeStyle`, `typography`, `spacing`, `opacity`, `lineHeight`, `letterSpacing`, `breakpoint`, `grid`.

### State Management

Two Zustand stores, both persisted to `localStorage`:

- **`tokenStore`** (`dsw-token-store`): All design tokens and generator configurations. Wrapped with Immer for immutable updates and Zundo for undo/redo (100-step history, Cmd+Z / Cmd+Shift+Z).
- **`uiStore`** (`dsw-ui-store`): Sidebar state, expanded sections, active tool path, theme preference, export panel visibility.

### Procedural Generation

Each generator tool stores a configuration object (see `GeneratorConfigMap` in `types.ts`) and produces tokens algorithmically:

- **Color Lab**: Bezier curves control hue/chroma/lightness distribution across N steps. Uses Newton-Raphson solver for bezier evaluation.
- **Typography Lab**: Modular scale ratios with auto-calculated line heights (tightening formula: `base - tightening * log2(fontSize/baseFontSize)`).
- **Spacing Lab**: Geometric, arithmetic, or Fibonacci progressions from a base unit.
- **Shadow Lab**: 3D light source position drives directional + ambient shadow layers per elevation step.
- **Motion**: Spring physics via velocity Verlet integration; bezier easing with Material Design presets.
- **Grid Builder**: Per-breakpoint column/gutter/margin definitions.

### Export Pipeline

Tokens can be exported in three formats:

1. **CSS Custom Properties** (`tokens.css`): `--color-blue-500: oklch(0.58 0.22 264);` with alias -> `var()` conversion
2. **DTCG JSON** (`tokens.json`): W3C-spec-aligned JSON, suitable for Style Dictionary or Tokens Studio
3. **Tailwind Config** (`tailwind.config.js`): Ready-to-use Tailwind v4 theme extension

Color output formats: `oklch`, `hex`, `rgb`, `hsl`. Dimension output: `px` or `rem` (base 16px).

## Design System (Workbench UI)

The workbench itself uses a custom dark/light theme defined via CSS custom properties in `index.css`:

### Colors

| Token | Dark | Light |
|-------|------|-------|
| `surface-0` | `#09090b` | `#ffffff` |
| `surface-1` | `#111113` | `#f9fafb` |
| `surface-2` | `#18181b` | `#f3f4f6` |
| `surface-3` | `#27272a` | `#e5e7eb` |
| `border` | `#3f3f46` | `#d1d5db` |
| `text-primary` | `#fafafa` | `#111827` |
| `text-secondary` | `#a1a1aa` | `#4b5563` |
| `text-tertiary` | `#71717a` | `#9ca3af` |
| `accent` | `#6366f1` | `#4f46e5` |
| `success` | `#22c55e` | `#16a34a` |
| `warning` | `#f59e0b` | `#d97706` |
| `error` | `#ef4444` | `#dc2626` |

### Typography
- Primary font: `Inter`, `system-ui`, `-apple-system`, `sans-serif`
- Font smoothing: antialiased on both webkit and moz

### Layout
- App shell: full-height flex with sidebar (224px expanded / 48px collapsed) + main content
- Sidebar: collapsible sections with Lucide icons, active tool highlighted with accent border
- TopBar: 44px height with project name, undo/redo, save/load, theme cycle, export button
- Tool layout: `ToolLayout` (header + content) and `SplitPanel` (controls left, preview right)
- Parameter sections: `ParameterSection` for grouping related sliders/inputs

## Development Notes

- **No test suite**: Project was built as a complete prototype in a single session
- **All tools fully implemented**: ~12,500 lines across 26 tool files, ~77,500 total lines
- **Lazy loading**: Every tool is code-split via `React.lazy` for fast initial load
- **Persistence**: All state survives page refreshes via localStorage
- **Project save/load**: Export as `.dsw.json` file, re-import later
- **Path alias**: `@/` resolves to `src/` (configured in `vite.config.ts`)
- **Vite plugins**: `@vitejs/plugin-react` + `@tailwindcss/vite`
- **Production build**: Available in `dist/` directory (also archived as `design-system-workbench.zip`)

## Repository

- **GitHub**: https://github.com/chriswangux/design-system-workbench.git
- **Branch**: `main`
- **Latest commit**: `b02ffe8` -- "Add credit line to sidebar footer"
