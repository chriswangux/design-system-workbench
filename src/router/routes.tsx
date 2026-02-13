import { lazy, Suspense, type ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Palette,
  Droplets,
  Type,
  Space,
  Layers,
  Grid3x3,
  MousePointerClick,
  GitBranch,
  Activity,
  Zap,
  TrendingUp,
  Clock,
  ListMusic,
  MessageSquare,
  Compass,
  PenTool,
  Eye,
  Table2,
  ScanEye,
  Navigation,
  Maximize,
  Database,
  TreePine,
  Share2,
  Download,
  Sun,
  Wand2,
  Columns,
  LayoutGrid,
  Grid2x2,
  Monitor,
  MoveHorizontal,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react';

// Lazy-loaded tool components
const ColorLab = lazy(() => import('@/tools/visual/color-lab'));
const TypographyLab = lazy(() => import('@/tools/visual/typography-lab'));
const SpacingLab = lazy(() => import('@/tools/visual/spacing-lab'));
const ShadowLab = lazy(() => import('@/tools/visual/shadow-lab'));
const Iconography = lazy(() => import('@/tools/visual/iconography'));
const StateMachine = lazy(() => import('@/tools/interaction/state-machine'));
const FeedbackPatterns = lazy(() => import('@/tools/interaction/feedback-patterns'));
const EasingEditor = lazy(() => import('@/tools/motion/easing-editor'));
const DurationScale = lazy(() => import('@/tools/motion/duration-scale'));
const Choreography = lazy(() => import('@/tools/motion/choreography'));
const VoiceTone = lazy(() => import('@/tools/content/voice-tone'));
const Microcopy = lazy(() => import('@/tools/content/microcopy'));
const ContrastMatrix = lazy(() => import('@/tools/accessibility/contrast-matrix'));
const CVDSimulator = lazy(() => import('@/tools/accessibility/cvd-simulator'));
const FocusOrder = lazy(() => import('@/tools/accessibility/focus-order'));
const TouchTarget = lazy(() => import('@/tools/accessibility/touch-target'));
const Taxonomy = lazy(() => import('@/tools/tokens/taxonomy'));
const RelationshipGraph = lazy(() => import('@/tools/tokens/relationship-graph'));
const ExportPipeline = lazy(() => import('@/tools/tokens/export-pipeline'));
const ThemeDerivation = lazy(() => import('@/tools/theming/derivation'));
const ThemeComparison = lazy(() => import('@/tools/theming/comparison'));
const GridBuilder = lazy(() => import('@/tools/layout/grid-builder'));
const BreakpointExplorer = lazy(() => import('@/tools/layout/breakpoint-explorer'));
const ResponsiveSpacing = lazy(() => import('@/tools/layout/responsive-spacing'));
const ChartPalette = lazy(() => import('@/tools/data-viz/chart-palette'));
const DataInk = lazy(() => import('@/tools/data-viz/data-ink'));

export interface ToolRoute {
  path: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
  description: string;
}

export interface ToolSection {
  section: string;
  icon: LucideIcon;
  tools: ToolRoute[];
}

export const toolSections: ToolSection[] = [
  {
    section: 'Visual Design',
    icon: Palette,
    tools: [
      { path: '/visual/color-lab', label: 'Color Lab', icon: Droplets, component: ColorLab, description: 'Procedural color palette generation using bezier curves' },
      { path: '/visual/typography-lab', label: 'Typography Lab', icon: Type, component: TypographyLab, description: 'Type scale generator with mathematical ratios' },
      { path: '/visual/spacing-lab', label: 'Spacing Lab', icon: Space, component: SpacingLab, description: 'Spacing scale from base unit progressions' },
      { path: '/visual/shadow-lab', label: 'Shadow Lab', icon: Layers, component: ShadowLab, description: 'Shadow system from light source parameters' },
      { path: '/visual/iconography', label: 'Iconography', icon: Grid3x3, component: Iconography, description: 'Icon grid and stroke weight guidelines' },
    ],
  },
  {
    section: 'Interaction Design',
    icon: MousePointerClick,
    tools: [
      { path: '/interaction/state-machine', label: 'State Machine', icon: GitBranch, component: StateMachine, description: 'Component state diagram editor' },
      { path: '/interaction/feedback-patterns', label: 'Feedback Patterns', icon: Activity, component: FeedbackPatterns, description: 'Action feedback sequence editor' },
    ],
  },
  {
    section: 'Motion Design',
    icon: Zap,
    tools: [
      { path: '/motion/easing-editor', label: 'Easing Curves', icon: TrendingUp, component: EasingEditor, description: 'Bezier and spring easing editor' },
      { path: '/motion/duration-scale', label: 'Duration Scale', icon: Clock, component: DurationScale, description: 'Duration scale generator' },
      { path: '/motion/choreography', label: 'Choreography', icon: ListMusic, component: Choreography, description: 'Transition sequencing and stagger patterns' },
    ],
  },
  {
    section: 'Content Design',
    icon: MessageSquare,
    tools: [
      { path: '/content/voice-tone', label: 'Voice & Tone', icon: Compass, component: VoiceTone, description: 'Brand voice positioning compass' },
      { path: '/content/microcopy', label: 'Microcopy', icon: PenTool, component: Microcopy, description: 'UI copy templates and patterns' },
    ],
  },
  {
    section: 'Accessibility',
    icon: Eye,
    tools: [
      { path: '/accessibility/contrast-matrix', label: 'Contrast Matrix', icon: Table2, component: ContrastMatrix, description: 'Automatic contrast ratio checking' },
      { path: '/accessibility/cvd-simulator', label: 'CVD Simulator', icon: ScanEye, component: CVDSimulator, description: 'Color blindness simulation' },
      { path: '/accessibility/focus-order', label: 'Focus Order', icon: Navigation, component: FocusOrder, description: 'Tab order visualization' },
      { path: '/accessibility/touch-target', label: 'Touch Targets', icon: Maximize, component: TouchTarget, description: 'Minimum target size verification' },
    ],
  },
  {
    section: 'Token Architecture',
    icon: Database,
    tools: [
      { path: '/tokens/taxonomy', label: 'Taxonomy Builder', icon: TreePine, component: Taxonomy, description: 'Token naming and hierarchy design' },
      { path: '/tokens/relationship-graph', label: 'Relationship Graph', icon: Share2, component: RelationshipGraph, description: 'Token reference visualization' },
      { path: '/tokens/export-pipeline', label: 'Export Pipeline', icon: Download, component: ExportPipeline, description: 'Multi-format token export' },
    ],
  },
  {
    section: 'Theming',
    icon: Sun,
    tools: [
      { path: '/theming/derivation', label: 'Theme Derivation', icon: Wand2, component: ThemeDerivation, description: 'Algorithmic theme variant generation' },
      { path: '/theming/comparison', label: 'Theme Compare', icon: Columns, component: ThemeComparison, description: 'Side-by-side theme preview' },
    ],
  },
  {
    section: 'Layout & Responsive',
    icon: LayoutGrid,
    tools: [
      { path: '/layout/grid-builder', label: 'Grid System', icon: Grid2x2, component: GridBuilder, description: 'Interactive grid system builder' },
      { path: '/layout/breakpoint-explorer', label: 'Breakpoints', icon: Monitor, component: BreakpointExplorer, description: 'Breakpoint definition and preview' },
      { path: '/layout/responsive-spacing', label: 'Responsive Spacing', icon: MoveHorizontal, component: ResponsiveSpacing, description: 'Adaptive spacing scales' },
    ],
  },
  {
    section: 'Data Visualization',
    icon: BarChart3,
    tools: [
      { path: '/data-viz/chart-palette', label: 'Chart Palette', icon: PieChart, component: ChartPalette, description: 'Accessible data visualization colors' },
      { path: '/data-viz/data-ink', label: 'Data-Ink', icon: LineChart, component: DataInk, description: 'Chart styling optimization' },
    ],
  },
];

// Flatten for router registration
export const allRoutes = toolSections.flatMap((s) => s.tools);

// Loading fallback
export function ToolLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse text-text-secondary">Loading tool...</div>
    </div>
  );
}

export function LazyTool({ component: Component }: { component: ComponentType }) {
  return (
    <Suspense fallback={<ToolLoading />}>
      <Component />
    </Suspense>
  );
}
