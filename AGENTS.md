# AGENTS.md — AXIOM: AI Excel Visualizer
### The Authoritative Build Guide for AI Agents

---

> **AGENT PRIME DIRECTIVE**
> You are building **AXIOM** — a professional, production-grade, AI-powered Excel visualization web app.
> Every file you create must be complete, correct, and immediately runnable. No placeholders. No TODOs.
> No half-implementations. Every component must be wired to real data and real logic.
> Human-level professionalism is the baseline, not the goal.

---

## TABLE OF CONTENTS

1. [Project Identity](#1-project-identity)
2. [Agent Rules & Protocols](#2-agent-rules--protocols)
3. [Tech Stack — Exact Versions](#3-tech-stack--exact-versions)
4. [Repository Bootstrap](#4-repository-bootstrap)
5. [Environment Configuration](#5-environment-configuration)
6. [Design System — Glassmorphism Spec](#6-design-system--glassmorphism-spec)
7. [Global State Architecture](#7-global-state-architecture)
8. [File Parser Layer](#8-file-parser-layer)
9. [Gemini API Layer](#9-gemini-api-layer)
10. [Statistics & Math Layer](#10-statistics--math-layer)
11. [Page-by-Page Build Specification](#11-page-by-page-build-specification)
12. [Component Library Specification](#12-component-library-specification)
13. [API Routes Specification](#13-api-routes-specification)
14. [Feature Modules — Complete Implementation Order](#14-feature-modules--complete-implementation-order)
15. [Animation & Interaction Contracts](#15-animation--interaction-contracts)
16. [Error Handling Protocol](#16-error-handling-protocol)
17. [Performance Requirements](#17-performance-requirements)
18. [Build Phases — Sprint Execution Order](#18-build-phases--sprint-execution-order)
19. [Testing Contracts](#19-testing-contracts)
20. [Deployment Checklist](#20-deployment-checklist)
21. [Forbidden Patterns](#21-forbidden-patterns)
22. [Agent Communication Protocol](#22-agent-communication-protocol)

---

## 1. PROJECT IDENTITY

```
Name        : AXIOM
Tagline     : Upload. Analyze. Understand.
Type        : AI-Powered Excel Visualizer (Web App)
Framework   : Next.js 15 (App Router)
AI Engine   : Google Gemini 2.0 Flash (Free Tier)
Auth        : NONE — Zero authentication. Come in, upload, explore.
Routing     : App Router only. No Pages Router.
Styling     : Tailwind CSS v4 + Custom Glassmorphism Tokens
Deployment  : Vercel (Free Tier)
State       : Zustand v5
Charts      : Recharts + D3.js
Grid        : TanStack Table v8
Parser      : SheetJS (xlsx) + PapaParse
Animation   : Framer Motion v12
```

### Vision Statement for Agents
AXIOM is not a data tool. AXIOM is a data intelligence experience.
When a user uploads an Excel file, AXIOM should feel like hiring a world-class
data scientist who instantly understands your data, visualizes it beautifully,
detects problems, tells you a story about what it means, and answers any
question you throw at it — all in under 10 seconds.

Every design decision, every component, every API call must serve this vision.

---

## 2. AGENT RULES & PROTOCOLS

### RULE 1 — COMPLETE FILES ONLY
Never write a partial file. Every file must be fully implemented from top to bottom.
If a component has 8 props, implement all 8. If a function has 3 edge cases, handle all 3.

### RULE 2 — NO PLACEHOLDER CODE
These strings are **BANNED** in all output:
```
// TODO
// FIXME
// coming soon
// placeholder
// implement later
// add logic here
{/* ... */}
```
If you don't know the full implementation, research it, then write it.

### RULE 3 — TYPE SAFETY IS MANDATORY
Every file that touches data must have explicit TypeScript types.
No `any` types. No `as unknown`. No implicit `any`.
Define interfaces in `/types/` and import them everywhere.

### RULE 4 — IMPORTS MUST RESOLVE
Every import statement must point to a file that exists.
Before adding an import, verify: does this file exist in the project?
If not, create it first.

### RULE 5 — REAL DATA FLOW ONLY
Every component must receive and render real data.
No hardcoded mock arrays in production components.
Mocks belong only in `/lib/mockData.ts` and only used in Storybook/tests.

### RULE 6 — ZERO CONSOLE ERRORS
Before marking a task complete, mentally trace the component tree.
All required props must be passed. All async calls must be awaited.
All promises must have catch handlers.

### RULE 7 — GLASS AESTHETIC IS NON-NEGOTIABLE
Every UI element must follow the Glassmorphism Design System in Section 6.
No plain white cards. No default browser styles leaking through.
No unstyled components shipped.

### RULE 8 — MOBILE FIRST
Every component is built mobile-first.
Minimum supported width: 375px.
Test breakpoints: 375px, 768px, 1024px, 1440px.

### RULE 9 — GEMINI CALLS ARE ALWAYS GUARDED
Every Gemini API call must have:
- Loading state
- Error state with user-facing message
- Rate limit handling (429 response)
- Timeout after 30 seconds
- Fallback behavior if API is unavailable

### RULE 10 — GIT DISCIPLINE
Every completed phase gets a commit with the message format:
`feat(phase-N): [description of what was built]`
Never commit broken code. Run `npm run build` before committing.

---

## 3. TECH STACK — EXACT VERSIONS

```bash
# Core
next@15.3.0
react@19.0.0
react-dom@19.0.0
typescript@5.8.0

# Styling
tailwindcss@4.1.0
framer-motion@12.6.0

# State
zustand@5.0.3
immer@10.1.1

# Charts
recharts@2.15.0
d3@7.9.0
d3-sankey@0.12.3
d3-cloud@1.2.7

# Data Grid
@tanstack/react-table@8.21.0
react-virtualized-auto-sizer@1.0.24
react-window@1.8.10

# File Parsing
xlsx@0.18.5
papaparse@5.4.1

# Statistics
simple-statistics@7.8.8
jstat@1.9.6

# AI / API
@google/generative-ai@0.24.0

# UI Utilities
react-dropzone@14.3.8
react-hot-toast@2.5.2
react-resizable-panels@2.1.7
cmdk@1.1.1
@radix-ui/react-tooltip@1.1.8
@radix-ui/react-popover@1.1.8
@radix-ui/react-dialog@1.1.7
@radix-ui/react-tabs@1.1.4
@radix-ui/react-select@2.1.6
@radix-ui/react-slider@1.2.3
@radix-ui/react-switch@1.1.3
@radix-ui/react-checkbox@1.1.5
lucide-react@0.503.0

# Export
html2canvas@1.4.1
jspdf@2.5.2
file-saver@2.0.5

# Dev
eslint@9.0.0
prettier@3.5.0
@types/node@22.0.0
@types/react@19.0.0
@types/d3@7.4.3
@types/papaparse@5.3.15
@types/file-saver@2.0.7
```

---

## 4. REPOSITORY BOOTSTRAP

### Step 1 — Create the Project
```bash
npx create-next-app@latest axiom \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd axiom
```

### Step 2 — Install All Dependencies
```bash
npm install \
  zustand immer \
  recharts d3 d3-sankey d3-cloud \
  @tanstack/react-table react-virtualized-auto-sizer react-window \
  xlsx papaparse \
  simple-statistics jstat \
  @google/generative-ai \
  react-dropzone react-hot-toast react-resizable-panels cmdk \
  @radix-ui/react-tooltip @radix-ui/react-popover @radix-ui/react-dialog \
  @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-slider \
  @radix-ui/react-switch @radix-ui/react-checkbox \
  lucide-react framer-motion \
  html2canvas jspdf file-saver

npm install -D \
  @types/d3 @types/papaparse @types/file-saver \
  @types/react-window prettier
```

### Step 3 — Required File Structure
Create every directory and file in this exact tree before writing any logic:

```
axiom/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Landing / Upload page
│   ├── globals.css                   # Global styles + glass tokens
│   ├── workspace/
│   │   ├── page.tsx                  # Main analysis workspace
│   │   └── layout.tsx                # Workspace shell layout
│   ├── analyze/
│   │   └── page.tsx                  # Deep statistical analysis
│   ├── visualize/
│   │   └── page.tsx                  # Chart studio
│   ├── ask/
│   │   └── page.tsx                  # AI natural language chat
│   ├── report/
│   │   └── page.tsx                  # AI data story / report
│   └── api/
│       └── gemini/
│           ├── analyze/route.ts      # Dataset analysis endpoint
│           ├── query/route.ts        # NL query endpoint
│           ├── story/route.ts        # Report generation endpoint
│           └── clean/route.ts        # Cleaning suggestions endpoint
├── components/
│   ├── ui/                           # Base glass components
│   │   ├── GlassCard.tsx
│   │   ├── GlassButton.tsx
│   │   ├── GlassPanel.tsx
│   │   ├── GlassInput.tsx
│   │   ├── GlassBadge.tsx
│   │   ├── GlassModal.tsx
│   │   ├── GlassTooltip.tsx
│   │   ├── GlassSelect.tsx
│   │   ├── GlassTabs.tsx
│   │   └── GlassSlider.tsx
│   ├── layout/
│   │   ├── Topbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatusBar.tsx
│   │   └── CommandPalette.tsx
│   ├── upload/
│   │   ├── DropZone.tsx
│   │   ├── FileCard.tsx
│   │   ├── FormatBadge.tsx
│   │   └── UploadProgress.tsx
│   ├── grid/
│   │   ├── DataGrid.tsx
│   │   ├── ColumnHeader.tsx
│   │   ├── CellRenderer.tsx
│   │   ├── SheetTabs.tsx
│   │   └── GridToolbar.tsx
│   ├── charts/
│   │   ├── ChartCanvas.tsx
│   │   ├── ChartPicker.tsx
│   │   ├── ChartExporter.tsx
│   │   ├── ChartTypeIcons.tsx
│   │   └── charts/
│   │       ├── BarChartView.tsx
│   │       ├── LineChartView.tsx
│   │       ├── AreaChartView.tsx
│   │       ├── PieChartView.tsx
│   │       ├── ScatterPlotView.tsx
│   │       ├── HeatmapView.tsx
│   │       ├── TreemapView.tsx
│   │       ├── SankeyView.tsx
│   │       ├── RadarChartView.tsx
│   │       ├── WaterfallView.tsx
│   │       ├── CandlestickView.tsx
│   │       ├── GeoMapView.tsx
│   │       ├── NetworkGraphView.tsx
│   │       ├── BoxPlotView.tsx
│   │       └── GanttView.tsx
│   ├── analysis/
│   │   ├── StatSummaryPanel.tsx
│   │   ├── ColumnProfiler.tsx
│   │   ├── CorrelationMatrix.tsx
│   │   ├── DistributionExplorer.tsx
│   │   ├── AnomalyDetector.tsx
│   │   ├── PivotBuilder.tsx
│   │   ├── ClusteringView.tsx
│   │   ├── RegressionView.tsx
│   │   ├── TimeSeriesView.tsx
│   │   └── MultiSheetJoin.tsx
│   └── ai/
│       ├── AIChatPanel.tsx
│       ├── NLQBar.tsx
│       ├── InsightCard.tsx
│       ├── StoryView.tsx
│       ├── AnomalyCard.tsx
│       └── SuggestedPrompts.tsx
├── lib/
│   ├── parser.ts                     # SheetJS + PapaParse logic
│   ├── stats.ts                      # All statistical functions
│   ├── gemini.ts                     # Gemini API client
│   ├── chartConfig.ts                # Chart type registry
│   ├── anomaly.ts                    # Outlier detection algorithms
│   ├── clustering.ts                 # K-Means, PCA
│   ├── regression.ts                 # Linear, polynomial regression
│   ├── formatters.ts                 # Number, date, currency formatters
│   ├── columnInference.ts            # Semantic type detection
│   ├── export.ts                     # PDF, PNG, CSV export
│   ├── mockData.ts                   # Sample datasets for demo
│   └── utils.ts                      # General utility functions
├── store/
│   ├── dataStore.ts                  # Parsed data, active sheet
│   ├── uiStore.ts                    # Panel states, sidebar, modals
│   └── aiStore.ts                    # Chat history, AI responses
├── hooks/
│   ├── useFileUpload.ts
│   ├── useGeminiStream.ts
│   ├── useChartConfig.ts
│   ├── useColumnProfile.ts
│   ├── useKeyboardShortcuts.ts
│   └── useExport.ts
├── types/
│   ├── data.ts                       # All data-related types
│   ├── charts.ts                     # Chart config types
│   ├── analysis.ts                   # Analysis result types
│   └── gemini.ts                     # Gemini API types
├── styles/
│   └── glass.css                     # Glassmorphism class library
├── public/
│   ├── sample-data/
│   │   ├── sales-data.xlsx           # Demo file 1
│   │   └── survey-results.csv        # Demo file 2
│   └── fonts/                        # Self-hosted fonts
├── middleware.ts                      # Rate limiting, headers
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                         # GEMINI_API_KEY
└── .env.example
```

---

## 5. ENVIRONMENT CONFIGURATION

### `.env.local`
```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AXIOM
NEXT_PUBLIC_MAX_FILE_SIZE_MB=50
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.0-flash-exp
```

### `.env.example`
```env
GEMINI_API_KEY=                        # Get from: https://aistudio.google.com/apikey
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AXIOM
NEXT_PUBLIC_MAX_FILE_SIZE_MB=50
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.0-flash-exp
```

### `next.config.ts`
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['xlsx'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    }
    return config
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
  ],
}

export default nextConfig
```

### `tsconfig.json` — Strict Mode Required
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 6. DESIGN SYSTEM — GLASSMORPHISM SPEC

### Philosophy
AXIOM lives in deep space. The background is dark. Content floats on
frosted glass panels. Color comes from neon accents, not backgrounds.
Every surface has depth. Every interaction has a glow.

### `app/globals.css` — Complete Implementation
```css
@import 'tailwindcss';
@import '../styles/glass.css';

@layer base {
  :root {
    /* Background Layers */
    --bg-space: #04040f;
    --bg-deep: #080818;
    --bg-surface: #0d0d22;
    --bg-panel: rgba(13, 13, 34, 0.7);
    --bg-card: rgba(20, 20, 48, 0.6);
    --bg-hover: rgba(30, 30, 70, 0.5);

    /* Glass Tokens */
    --glass-bg: rgba(255, 255, 255, 0.04);
    --glass-bg-hover: rgba(255, 255, 255, 0.07);
    --glass-border: rgba(255, 255, 255, 0.10);
    --glass-border-strong: rgba(255, 255, 255, 0.20);
    --glass-blur: blur(24px);
    --glass-blur-heavy: blur(40px);
    --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    --glass-shadow-lg: 0 24px 64px rgba(0, 0, 0, 0.6);
    --glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.12);
    --glass-radius: 16px;
    --glass-radius-sm: 10px;
    --glass-radius-lg: 24px;

    /* Brand Accents */
    --accent-violet: #6C63FF;
    --accent-violet-glow: rgba(108, 99, 255, 0.35);
    --accent-cyan: #00D4FF;
    --accent-cyan-glow: rgba(0, 212, 255, 0.35);
    --accent-green: #39FF14;
    --accent-green-glow: rgba(57, 255, 20, 0.25);
    --accent-amber: #FFB627;
    --accent-amber-glow: rgba(255, 182, 39, 0.25);
    --accent-red: #FF4757;
    --accent-red-glow: rgba(255, 71, 87, 0.25);

    /* Text */
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.60);
    --text-tertiary: rgba(255, 255, 255, 0.35);
    --text-disabled: rgba(255, 255, 255, 0.20);

    /* Typography */
    --font-display: 'Outfit', 'SF Pro Display', sans-serif;
    --font-body: 'DM Sans', 'SF Pro Text', sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', monospace;

    /* Spacing Scale */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 40px;
    --space-2xl: 64px;

    /* Transitions */
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    height: 100%;
    scroll-behavior: smooth;
  }

  body {
    height: 100%;
    background-color: var(--bg-space);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  /* Animated Background Orbs */
  body::before {
    content: '';
    position: fixed;
    top: -40%;
    left: -20%;
    width: 80%;
    height: 80%;
    background: radial-gradient(ellipse, rgba(108, 99, 255, 0.12) 0%, transparent 70%);
    animation: orbDrift1 20s ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 0;
  }

  body::after {
    content: '';
    position: fixed;
    bottom: -30%;
    right: -10%;
    width: 70%;
    height: 70%;
    background: radial-gradient(ellipse, rgba(0, 212, 255, 0.08) 0%, transparent 70%);
    animation: orbDrift2 25s ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes orbDrift1 {
    from { transform: translate(0, 0) scale(1); }
    to { transform: translate(5%, 8%) scale(1.1); }
  }

  @keyframes orbDrift2 {
    from { transform: translate(0, 0) scale(1); }
    to { transform: translate(-8%, -5%) scale(0.95); }
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  /* Selection */
  ::selection {
    background: rgba(108, 99, 255, 0.4);
    color: white;
  }

  /* Focus ring */
  *:focus-visible {
    outline: 2px solid var(--accent-violet);
    outline-offset: 2px;
    border-radius: 4px;
  }
}
```

### `styles/glass.css` — Component Class Library
```css
/* === GLASS BASE CLASSES === */

.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), var(--glass-highlight);
  border-radius: var(--glass-radius);
}

.glass-heavy {
  background: rgba(13, 13, 34, 0.75);
  backdrop-filter: var(--glass-blur-heavy);
  -webkit-backdrop-filter: var(--glass-blur-heavy);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow-lg), var(--glass-highlight);
  border-radius: var(--glass-radius);
}

.glass-card {
  background: var(--bg-card);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), var(--glass-highlight);
  border-radius: var(--glass-radius);
  padding: var(--space-lg);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.glass-card:hover {
  border-color: var(--glass-border-strong);
  box-shadow: var(--glass-shadow-lg), var(--glass-highlight);
}

/* === GLOW VARIANTS === */
.glow-violet {
  box-shadow: var(--glass-shadow), 0 0 0 1px var(--accent-violet), 0 0 24px var(--accent-violet-glow);
}

.glow-cyan {
  box-shadow: var(--glass-shadow), 0 0 0 1px var(--accent-cyan), 0 0 24px var(--accent-cyan-glow);
}

.glow-green {
  box-shadow: var(--glass-shadow), 0 0 0 1px var(--accent-green), 0 0 24px var(--accent-green-glow);
}

/* === BUTTON VARIANTS === */
.btn-glass {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  user-select: none;
}

.btn-glass:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-strong);
  transform: translateY(-1px);
}

.btn-glass:active { transform: translateY(0) scale(0.99); }

.btn-primary {
  background: var(--accent-violet);
  border-color: transparent;
  box-shadow: 0 4px 20px var(--accent-violet-glow);
}

.btn-primary:hover {
  background: #7b74ff;
  box-shadow: 0 8px 32px var(--accent-violet-glow);
}

.btn-danger {
  background: rgba(255, 71, 87, 0.15);
  border-color: rgba(255, 71, 87, 0.3);
  color: var(--accent-red);
}

/* === INPUT VARIANTS === */
.input-glass {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input-glass::placeholder { color: var(--text-tertiary); }

.input-glass:focus {
  border-color: var(--accent-violet);
  box-shadow: 0 0 0 3px var(--accent-violet-glow);
}

/* === BADGE VARIANTS === */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge-violet { background: rgba(108,99,255,0.2); color: #a8a3ff; border: 1px solid rgba(108,99,255,0.3); }
.badge-cyan { background: rgba(0,212,255,0.15); color: #7de8ff; border: 1px solid rgba(0,212,255,0.25); }
.badge-green { background: rgba(57,255,20,0.15); color: #7aff5c; border: 1px solid rgba(57,255,20,0.25); }
.badge-amber { background: rgba(255,182,39,0.15); color: #ffd080; border: 1px solid rgba(255,182,39,0.25); }
.badge-red { background: rgba(255,71,87,0.15); color: #ff8c99; border: 1px solid rgba(255,71,87,0.25); }
.badge-gray { background: rgba(255,255,255,0.08); color: var(--text-secondary); border: 1px solid var(--glass-border); }

/* === DIVIDERS === */
.divider {
  border: none;
  border-top: 1px solid var(--glass-border);
  margin: var(--space-md) 0;
}

/* === LOADING STATES === */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}

/* === AI PULSE ANIMATION === */
@keyframes aiPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--accent-cyan-glow); }
  50% { box-shadow: 0 0 0 6px transparent; }
}

.ai-active { animation: aiPulse 2s ease-in-out infinite; }
```

### Typography — Font Loading in `app/layout.tsx`
```typescript
// Use next/font for self-hosted Google Fonts
import { Outfit, DM_Sans } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})
```

---

## 7. GLOBAL STATE ARCHITECTURE

### `types/data.ts` — Core Data Types
```typescript
export type CellValue = string | number | boolean | Date | null

export type ColumnType =
  | 'string'
  | 'number'
  | 'date'
  | 'boolean'
  | 'currency'
  | 'percentage'
  | 'email'
  | 'url'
  | 'phone'
  | 'id'
  | 'category'
  | 'mixed'
  | 'empty'

export interface Column {
  key: string
  name: string
  type: ColumnType
  index: number
  nullCount: number
  uniqueCount: number
  sampleValues: CellValue[]
  min?: number
  max?: number
  mean?: number
  median?: number
  stdDev?: number
  qualityScore: number // 0-100
}

export interface SheetData {
  name: string
  columns: Column[]
  rows: Record<string, CellValue>[]
  rowCount: number
  columnCount: number
  hasHeader: boolean
}

export interface ParsedFile {
  name: string
  size: number
  type: string
  sheets: SheetData[]
  activeSheet: string
  parsedAt: Date
}

export interface DataStats {
  totalRows: number
  totalColumns: number
  totalNulls: number
  totalDuplicates: number
  memoryUsageMB: number
  qualityScore: number
}
```

### `store/dataStore.ts`
```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ParsedFile, SheetData, Column, DataStats } from '@/types/data'

interface DataState {
  file: ParsedFile | null
  activeSheet: string | null
  selectedColumns: string[]
  highlightedRows: number[]
  stats: DataStats | null
  isLoading: boolean
  error: string | null

  // Actions
  setFile: (file: ParsedFile) => void
  setActiveSheet: (name: string) => void
  toggleColumnSelection: (key: string) => void
  clearColumnSelection: () => void
  highlightRows: (indices: number[]) => void
  clearHighlights: () => void
  setError: (error: string | null) => void
  clearFile: () => void
  getActiveSheetData: () => SheetData | null
  getColumn: (key: string) => Column | null
}

export const useDataStore = create<DataState>()(
  immer((set, get) => ({
    file: null,
    activeSheet: null,
    selectedColumns: [],
    highlightedRows: [],
    stats: null,
    isLoading: false,
    error: null,

    setFile: (file) => set((state) => {
      state.file = file
      state.activeSheet = file.sheets[0]?.name ?? null
      state.selectedColumns = []
      state.highlightedRows = []
      state.error = null
    }),

    setActiveSheet: (name) => set((state) => {
      state.activeSheet = name
      state.selectedColumns = []
      state.highlightedRows = []
    }),

    toggleColumnSelection: (key) => set((state) => {
      const idx = state.selectedColumns.indexOf(key)
      if (idx === -1) {
        state.selectedColumns.push(key)
      } else {
        state.selectedColumns.splice(idx, 1)
      }
    }),

    clearColumnSelection: () => set((state) => {
      state.selectedColumns = []
    }),

    highlightRows: (indices) => set((state) => {
      state.highlightedRows = indices
    }),

    clearHighlights: () => set((state) => {
      state.highlightedRows = []
    }),

    setError: (error) => set((state) => {
      state.error = error
    }),

    clearFile: () => set((state) => {
      state.file = null
      state.activeSheet = null
      state.selectedColumns = []
      state.highlightedRows = []
      state.stats = null
      state.error = null
    }),

    getActiveSheetData: () => {
      const { file, activeSheet } = get()
      if (!file || !activeSheet) return null
      return file.sheets.find((s) => s.name === activeSheet) ?? null
    },

    getColumn: (key) => {
      const sheet = get().getActiveSheetData()
      if (!sheet) return null
      return sheet.columns.find((c) => c.key === key) ?? null
    },
  }))
)
```

### `store/uiStore.ts`
```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type PanelId = 'sidebar' | 'aiPanel' | 'columnProfile' | 'chartConfig' | 'pivot'
type ActiveView = 'grid' | 'charts' | 'analysis' | 'ai' | 'report'
type ModalId = 'upload' | 'export' | 'settings' | 'shortcuts' | null

interface UIState {
  activeView: ActiveView
  openPanels: Set<PanelId>
  activeModal: ModalId
  commandPaletteOpen: boolean
  sidebarCollapsed: boolean
  rightPanelWidth: number
  isMobile: boolean
  theme: 'dark' // AXIOM is always dark

  setActiveView: (view: ActiveView) => void
  togglePanel: (id: PanelId) => void
  openModal: (id: ModalId) => void
  closeModal: () => void
  toggleCommandPalette: () => void
  setSidebarCollapsed: (v: boolean) => void
  setRightPanelWidth: (w: number) => void
  setIsMobile: (v: boolean) => void
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    activeView: 'grid',
    openPanels: new Set(['sidebar', 'aiPanel']),
    activeModal: null,
    commandPaletteOpen: false,
    sidebarCollapsed: false,
    rightPanelWidth: 380,
    isMobile: false,
    theme: 'dark',

    setActiveView: (view) => set((s) => { s.activeView = view }),
    togglePanel: (id) => set((s) => {
      if (s.openPanels.has(id)) { s.openPanels.delete(id) }
      else { s.openPanels.add(id) }
    }),
    openModal: (id) => set((s) => { s.activeModal = id }),
    closeModal: () => set((s) => { s.activeModal = null }),
    toggleCommandPalette: () => set((s) => { s.commandPaletteOpen = !s.commandPaletteOpen }),
    setSidebarCollapsed: (v) => set((s) => { s.sidebarCollapsed = v }),
    setRightPanelWidth: (w) => set((s) => { s.rightPanelWidth = w }),
    setIsMobile: (v) => set((s) => { s.isMobile = v }),
  }))
)
```

### `store/aiStore.ts`
```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  chartConfig?: object
  isStreaming?: boolean
  error?: string
}

export interface AIInsight {
  id: string
  type: 'summary' | 'anomaly' | 'trend' | 'recommendation' | 'cleaning'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  affectedColumns?: string[]
  affectedRows?: number[]
  generatedAt: Date
}

interface AIState {
  messages: AIMessage[]
  insights: AIInsight[]
  dataStory: string | null
  isThinking: boolean
  streamingMessageId: string | null
  suggestedPrompts: string[]
  queryHistory: string[]

  addMessage: (msg: Omit<AIMessage, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, update: Partial<AIMessage>) => void
  addInsight: (insight: Omit<AIInsight, 'id' | 'generatedAt'>) => void
  clearInsights: () => void
  setDataStory: (story: string) => void
  setIsThinking: (v: boolean) => void
  setStreamingMessageId: (id: string | null) => void
  setSuggestedPrompts: (prompts: string[]) => void
  addQueryToHistory: (query: string) => void
  clearHistory: () => void
}

export const useAIStore = create<AIState>()(
  immer((set) => ({
    messages: [],
    insights: [],
    dataStory: null,
    isThinking: false,
    streamingMessageId: null,
    suggestedPrompts: [],
    queryHistory: [],

    addMessage: (msg) => {
      const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
      set((s) => {
        s.messages.push({ ...msg, id, timestamp: new Date() })
      })
      return id
    },

    updateMessage: (id, update) => set((s) => {
      const msg = s.messages.find((m) => m.id === id)
      if (msg) Object.assign(msg, update)
    }),

    addInsight: (insight) => set((s) => {
      const id = `insight_${Date.now()}`
      s.insights.push({ ...insight, id, generatedAt: new Date() })
    }),

    clearInsights: () => set((s) => { s.insights = [] }),
    setDataStory: (story) => set((s) => { s.dataStory = story }),
    setIsThinking: (v) => set((s) => { s.isThinking = v }),
    setStreamingMessageId: (id) => set((s) => { s.streamingMessageId = id }),
    setSuggestedPrompts: (prompts) => set((s) => { s.suggestedPrompts = prompts }),

    addQueryToHistory: (query) => set((s) => {
      s.queryHistory.unshift(query)
      if (s.queryHistory.length > 50) s.queryHistory.pop()
    }),

    clearHistory: () => set((s) => {
      s.messages = []
      s.queryHistory = []
    }),
  }))
)
```

---

## 8. FILE PARSER LAYER

### `lib/parser.ts` — Complete Implementation
```typescript
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import type { ParsedFile, SheetData, Column, CellValue, ColumnType } from '@/types/data'
import { inferColumnType, computeColumnStats } from './columnInference'

const MAX_FILE_SIZE_BYTES =
  Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB ?? 50) * 1024 * 1024

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

export async function parseFile(file: File): Promise<ParsedFile> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ParseError(
      `File too large. Maximum size is ${process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB}MB.`
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase()

  if (!ext) throw new ParseError('Cannot determine file type.')

  if (ext === 'csv' || ext === 'tsv') {
    return parseCSV(file)
  }

  if (['xlsx', 'xls', 'xlsm', 'xlsb', 'ods'].includes(ext)) {
    return parseExcel(file)
  }

  throw new ParseError(`Unsupported file type: .${ext}`)
}

async function parseExcel(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: true,
    raw: false,
  })

  const sheets: SheetData[] = workbook.SheetNames.map((name) => {
    const ws = workbook.Sheets[name]
    if (!ws) throw new ParseError(`Sheet "${name}" is empty or corrupted.`)

    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      raw: false,
      defval: null,
      header: 1,
    })

    return buildSheetData(name, raw as unknown[][])
  })

  return {
    name: file.name,
    size: file.size,
    type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sheets,
    activeSheet: sheets[0]?.name ?? '',
    parsedAt: new Date(),
  }
}

async function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const rows = results.data as Record<string, unknown>[]
        const columns = buildColumns(rows)
        const typedRows = rows.map((r) =>
          Object.fromEntries(
            Object.entries(r).map(([k, v]) => [k, v as CellValue])
          )
        )

        resolve({
          name: file.name,
          size: file.size,
          type: 'text/csv',
          sheets: [{
            name: file.name.replace(/\.[^.]+$/, ''),
            columns,
            rows: typedRows,
            rowCount: typedRows.length,
            columnCount: columns.length,
            hasHeader: true,
          }],
          activeSheet: file.name.replace(/\.[^.]+$/, ''),
          parsedAt: new Date(),
        })
      },
      error: (err) => reject(new ParseError(`CSV parse error: ${err.message}`)),
    })
  })
}

function buildSheetData(name: string, raw: unknown[][]): SheetData {
  if (!raw.length) {
    return { name, columns: [], rows: [], rowCount: 0, columnCount: 0, hasHeader: false }
  }

  const headers = (raw[0] as unknown[]).map((h, i) =>
    h != null && String(h).trim() !== '' ? String(h).trim() : `Column_${i + 1}`
  )

  const dataRows = raw.slice(1)
  const rows: Record<string, CellValue>[] = dataRows.map((row) => {
    const record: Record<string, CellValue> = {}
    headers.forEach((h, i) => {
      const val = (row as unknown[])[i]
      record[h] = val === undefined ? null : (val as CellValue)
    })
    return record
  })

  const columns = buildColumns(rows, headers)

  return {
    name,
    columns,
    rows,
    rowCount: rows.length,
    columnCount: columns.length,
    hasHeader: true,
  }
}

function buildColumns(
  rows: Record<string, unknown>[],
  headerOrder?: string[]
): Column[] {
  const keys = headerOrder ?? (rows[0] ? Object.keys(rows[0]) : [])

  return keys.map((key, index) => {
    const values = rows.map((r) => r[key] as CellValue)
    const type = inferColumnType(values)
    const stats = computeColumnStats(values, type)

    return {
      key,
      name: key,
      type,
      index,
      nullCount: values.filter((v) => v === null || v === undefined || v === '').length,
      uniqueCount: new Set(values.filter((v) => v != null)).size,
      sampleValues: values.slice(0, 5),
      qualityScore: computeQualityScore(values, stats),
      ...stats,
    }
  })
}

function computeQualityScore(
  values: CellValue[],
  stats: Partial<Column>
): number {
  const total = values.length
  if (total === 0) return 0

  const nullRatio = (stats.nullCount ?? 0) / total
  const uniqueRatio = Math.min((stats.uniqueCount ?? 0) / total, 1)
  const completenessScore = (1 - nullRatio) * 60
  const diversityScore = uniqueRatio > 0.01 ? 40 : 10

  return Math.round(completenessScore + diversityScore)
}
```

---

## 9. GEMINI API LAYER

### `lib/gemini.ts` — Client Implementation
```typescript
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import type { SheetData } from '@/types/data'

const MODEL_NAME = process.env.NEXT_PUBLIC_GEMINI_MODEL ?? 'gemini-2.0-flash-exp'

function getClient(): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment.')
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: MODEL_NAME })
}

// Truncate rows to max sample for API efficiency
export function buildDataContext(sheet: SheetData, maxRows = 100): string {
  const sample = sheet.rows.slice(0, maxRows)
  const columnSummary = sheet.columns.map((c) =>
    `${c.name} (${c.type}, nulls: ${c.nullCount}, unique: ${c.uniqueCount})`
  ).join(', ')

  return [
    `Dataset: "${sheet.name}"`,
    `Dimensions: ${sheet.rowCount} rows × ${sheet.columnCount} columns`,
    `Columns: ${columnSummary}`,
    `Sample rows (${sample.length}):`,
    JSON.stringify(sample, null, 0),
  ].join('\n')
}

// === API Route Handlers (used in /app/api/gemini/*/route.ts) ===

export async function streamAnalysis(
  sheet: SheetData,
  onChunk: (text: string) => void
): Promise<void> {
  const model = getClient()
  const context = buildDataContext(sheet, 100)

  const prompt = `You are a world-class data scientist analyzing a dataset.
Given this dataset context:

${context}

Provide a comprehensive analysis in JSON format with exactly these fields:
{
  "summary": "2-3 sentence executive summary of what this dataset contains",
  "keyInsights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"],
  "suggestedCharts": [
    {
      "type": "bar|line|scatter|pie|heatmap|area",
      "xColumn": "column_name",
      "yColumn": "column_name",
      "title": "descriptive chart title",
      "reason": "why this chart is useful"
    }
  ],
  "dataQualityIssues": [
    {
      "column": "column_name",
      "issue": "description of the issue",
      "severity": "low|medium|high",
      "suggestion": "how to fix it"
    }
  ],
  "overallQualityScore": 85,
  "suggestedNextSteps": ["step 1", "step 2", "step 3"]
}
Respond with ONLY valid JSON. No markdown, no explanation outside the JSON.`

  const result = await model.generateContentStream(prompt)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) onChunk(text)
  }
}

export async function queryDataset(
  sheet: SheetData,
  question: string,
  history: Array<{ role: 'user' | 'model'; parts: string[] }>
): Promise<{ answer: string; chartConfig?: object }> {
  const model = getClient()
  const context = buildDataContext(sheet, 200)

  const systemPrompt = `You are AXIOM's AI analyst. You have access to this dataset:

${context}

Answer questions about this data clearly and accurately.
If the answer would be better shown as a chart, include a "chartConfig" in your response.
Always respond in this JSON format:
{
  "answer": "your natural language answer",
  "chartConfig": null | {
    "type": "bar|line|scatter|pie|area",
    "title": "chart title",
    "xColumn": "col",
    "yColumn": "col",
    "data": []
  }
}
Respond with ONLY valid JSON.`

  const chat = model.startChat({
    history: history.map((h) => ({
      role: h.role,
      parts: [{ text: h.parts.join('') }],
    })),
    systemInstruction: systemPrompt,
  })

  const result = await chat.sendMessage(question)
  const text = result.response.text()

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return parsed as { answer: string; chartConfig?: object }
  } catch {
    return { answer: text }
  }
}

export async function generateStory(
  sheet: SheetData,
  tone: 'executive' | 'technical' | 'casual' = 'executive'
): Promise<string> {
  const model = getClient()
  const context = buildDataContext(sheet, 150)

  const toneGuide = {
    executive: 'Write for a C-suite audience. Be concise, action-oriented, and ROI-focused.',
    technical: 'Write for data scientists. Include statistical context and methodology notes.',
    casual: 'Write in plain English. Avoid jargon. Make insights accessible to anyone.',
  }

  const prompt = `You are a data storyteller. Analyze this dataset and write a professional narrative report.

${context}

${toneGuide[tone]}

Write a structured report with:
1. Executive Summary (3-4 sentences)
2. Key Findings (5-7 bullet points with specific numbers)
3. Data Quality Assessment (brief paragraph)
4. Recommendations (3-5 actionable recommendations)
5. Conclusion (2-3 sentences)

Use markdown formatting. Be specific — cite actual column names and values from the data.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function getCleaningRecommendations(
  sheet: SheetData
): Promise<Array<{
  column: string
  action: 'fill_mean' | 'fill_median' | 'fill_mode' | 'drop_column' | 'normalize' | 'flag_review'
  reason: string
  affectedRows: number
}>> {
  const model = getClient()
  const context = buildDataContext(sheet, 50)

  const prompt = `You are a data cleaning expert. Analyze this dataset and suggest specific cleaning actions.

${context}

Respond with ONLY a JSON array of cleaning recommendations:
[
  {
    "column": "column_name",
    "action": "fill_mean|fill_median|fill_mode|drop_column|normalize|flag_review",
    "reason": "why this action is needed",
    "affectedRows": 42
  }
]
Only include columns that genuinely need cleaning. Respond with ONLY valid JSON array.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(text) as ReturnType<typeof getCleaningRecommendations> extends Promise<infer T> ? T : never
  } catch {
    return []
  }
}
```

### API Route Pattern — `app/api/gemini/analyze/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { streamAnalysis } from '@/lib/gemini'
import type { SheetData } from '@/types/data'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json() as { sheet: SheetData }

    if (!body.sheet) {
      return NextResponse.json({ error: 'Missing sheet data' }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamAnalysis(body.sheet, (chunk) => {
            controller.enqueue(encoder.encode(chunk))
          })
          controller.close()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Analysis failed'
          controller.enqueue(encoder.encode(`{"error":"${message}"}`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

### `hooks/useGeminiStream.ts`
```typescript
import { useState, useCallback, useRef } from 'react'

interface UseGeminiStreamOptions {
  endpoint: string
  onComplete?: (result: string) => void
  onError?: (error: string) => void
}

export function useGeminiStream({ endpoint, onComplete, onError }: UseGeminiStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const stream = useCallback(async (body: object) => {
    if (isStreaming) return

    abortRef.current = new AbortController()
    setIsStreaming(true)
    setContent('')
    setError(null)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`)
      }

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setContent(accumulated)
      }

      onComplete?.(accumulated)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Stream failed'
      setError(msg)
      onError?.(msg)
    } finally {
      setIsStreaming(false)
    }
  }, [endpoint, isStreaming, onComplete, onError])

  const abort = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return { stream, abort, isStreaming, content, error }
}
```

---

## 10. STATISTICS & MATH LAYER

### `lib/stats.ts` — Core Statistical Functions
```typescript
import * as ss from 'simple-statistics'
import type { CellValue } from '@/types/data'

export function extractNumbers(values: CellValue[]): number[] {
  return values
    .filter((v): v is number => typeof v === 'number' && isFinite(v))
}

export interface DescriptiveStats {
  count: number
  mean: number
  median: number
  mode: number | null
  stdDev: number
  variance: number
  min: number
  max: number
  range: number
  q1: number
  q3: number
  iqr: number
  skewness: number
  kurtosis: number
  cv: number // coefficient of variation
}

export function describeColumn(values: CellValue[]): DescriptiveStats | null {
  const nums = extractNumbers(values)
  if (nums.length < 2) return null

  const sorted = [...nums].sort((a, b) => a - b)
  const mean = ss.mean(nums)
  const stdDev = ss.standardDeviation(nums)
  const q1 = ss.quantile(sorted, 0.25)
  const q3 = ss.quantile(sorted, 0.75)

  return {
    count: nums.length,
    mean,
    median: ss.median(nums),
    mode: nums.length > 0 ? ss.mode(nums) : null,
    stdDev,
    variance: ss.variance(nums),
    min: ss.min(nums),
    max: ss.max(nums),
    range: ss.max(nums) - ss.min(nums),
    q1,
    q3,
    iqr: q3 - q1,
    skewness: ss.sampleSkewness(nums),
    kurtosis: ss.sampleKurtosis(nums),
    cv: mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0,
  }
}

export function computeCorrelation(
  colA: CellValue[],
  colB: CellValue[]
): number | null {
  const pairs: [number, number][] = []
  for (let i = 0; i < Math.min(colA.length, colB.length); i++) {
    const a = colA[i]
    const b = colB[i]
    if (typeof a === 'number' && typeof b === 'number' && isFinite(a) && isFinite(b)) {
      pairs.push([a, b])
    }
  }
  if (pairs.length < 3) return null
  return ss.sampleCorrelation(
    pairs.map(([a]) => a),
    pairs.map(([, b]) => b)
  )
}

export interface OutlierResult {
  rowIndex: number
  value: number
  zScore: number
  method: 'zscore' | 'iqr'
}

export function detectOutliers(
  values: CellValue[],
  method: 'zscore' | 'iqr' = 'iqr'
): OutlierResult[] {
  const nums = extractNumbers(values)
  if (nums.length < 4) return []

  const outliers: OutlierResult[] = []

  if (method === 'zscore') {
    const mean = ss.mean(nums)
    const std = ss.standardDeviation(nums)
    if (std === 0) return []

    values.forEach((v, i) => {
      if (typeof v === 'number' && isFinite(v)) {
        const z = Math.abs((v - mean) / std)
        if (z > 3) outliers.push({ rowIndex: i, value: v, zScore: z, method: 'zscore' })
      }
    })
  } else {
    const sorted = [...nums].sort((a, b) => a - b)
    const q1 = ss.quantile(sorted, 0.25)
    const q3 = ss.quantile(sorted, 0.75)
    const iqr = q3 - q1
    const lower = q1 - 1.5 * iqr
    const upper = q3 + 1.5 * iqr

    values.forEach((v, i) => {
      if (typeof v === 'number' && isFinite(v) && (v < lower || v > upper)) {
        const mean = ss.mean(nums)
        const std = ss.standardDeviation(nums)
        const z = std > 0 ? Math.abs((v - mean) / std) : 0
        outliers.push({ rowIndex: i, value: v, zScore: z, method: 'iqr' })
      }
    })
  }

  return outliers.sort((a, b) => b.zScore - a.zScore)
}

export function linearRegression(
  xValues: CellValue[],
  yValues: CellValue[]
): { slope: number; intercept: number; r2: number; predictions: number[] } | null {
  const pairs: [number, number][] = []
  for (let i = 0; i < Math.min(xValues.length, yValues.length); i++) {
    const x = xValues[i]
    const y = yValues[i]
    if (typeof x === 'number' && typeof y === 'number' && isFinite(x) && isFinite(y)) {
      pairs.push([x, y])
    }
  }
  if (pairs.length < 3) return null

  const xArr = pairs.map(([x]) => x)
  const yArr = pairs.map(([, y]) => y)
  const reg = ss.linearRegression(pairs)
  const lineFunc = ss.linearRegressionLine(reg)
  const r2 = ss.rSquared(pairs, lineFunc)

  return {
    slope: reg.m,
    intercept: reg.b,
    r2,
    predictions: xArr.map((x) => lineFunc(x)),
  }
}

export function kMeansClustering(
  data: number[][],
  k: number,
  maxIter = 300
): { labels: number[]; centroids: number[][]; inertia: number } {
  if (data.length < k) throw new Error('More clusters than data points.')

  // Initialize centroids using k-means++
  const centroids: number[][] = [data[Math.floor(Math.random() * data.length)]!]

  while (centroids.length < k) {
    const distances = data.map((point) => {
      const minDist = Math.min(...centroids.map((c) => euclideanDistance(point, c)))
      return minDist * minDist
    })
    const totalDist = distances.reduce((a, b) => a + b, 0)
    let rand = Math.random() * totalDist
    for (let i = 0; i < distances.length; i++) {
      rand -= distances[i] ?? 0
      if (rand <= 0) {
        centroids.push(data[i]!)
        break
      }
    }
  }

  let labels: number[] = new Array(data.length).fill(0) as number[]

  for (let iter = 0; iter < maxIter; iter++) {
    const newLabels = data.map((point) => {
      let minDist = Infinity
      let label = 0
      centroids.forEach((centroid, ci) => {
        const dist = euclideanDistance(point, centroid)
        if (dist < minDist) { minDist = dist; label = ci }
      })
      return label
    })

    const changed = newLabels.some((l, i) => l !== labels[i])
    labels = newLabels
    if (!changed) break

    // Update centroids
    centroids.forEach((_, ci) => {
      const clusterPoints = data.filter((_, i) => labels[i] === ci)
      if (clusterPoints.length === 0) return
      for (let d = 0; d < (centroids[0]?.length ?? 0); d++) {
        centroids[ci]![d] = clusterPoints.reduce((s, p) => s + (p[d] ?? 0), 0) / clusterPoints.length
      }
    })
  }

  const inertia = data.reduce((sum, point, i) => {
    const centroid = centroids[labels[i] ?? 0]!
    return sum + euclideanDistance(point, centroid) ** 2
  }, 0)

  return { labels, centroids, inertia }
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, ai, i) => sum + (ai - (b[i] ?? 0)) ** 2, 0)
  )
}
```

---

## 11. PAGE-BY-PAGE BUILD SPECIFICATION

### Page 1 — Landing (`app/page.tsx`)
**Purpose:** First impression. Converts visitor into user. Zero friction.

**Required Sections (in order):**
1. **Topbar** — Logo (AXIOM wordmark), nav links (Workspace, Features, About), "Try Demo" CTA
2. **Hero Section** — Large headline, sub-headline, animated upload drop zone (primary CTA)
3. **Feature Grid** — 6 feature cards with icons, titles, one-line descriptions
4. **Stats Bar** — "15+ Chart Types", "30+ Analysis Tools", "0 Sign-ups Required", "<3s AI Response"
5. **Demo Section** — Live embedded workspace with sample data pre-loaded
6. **Supported Formats** — Badge row for .xlsx .xls .csv .tsv .ods .xlsm
7. **Footer** — Links, tagline

**Critical behaviors:**
- Drop zone accepts files via drag-and-drop AND click-to-browse
- On successful file drop → parse → redirect to `/workspace` (no page reload; use router.push)
- Show parsing progress with animated progress bar
- Display file type error inline (not toast) when wrong format dropped
- "Try Demo" loads `/public/sample-data/sales-data.xlsx` automatically

### Page 2 — Workspace (`app/workspace/page.tsx`)
**Purpose:** The heart of the app. All analysis happens here.

**Layout (Resizable 3-panel):**
```
┌──────────────────────────────────────────────────────────┐
│ TOPBAR: Logo | View Switcher | File Name | Actions        │
├────────┬─────────────────────────────────┬───────────────┤
│SIDEBAR │     MAIN CONTENT AREA            │  AI PANEL     │
│        │                                  │               │
│Sheet 1 │  [Grid | Charts | Analysis]      │ Chat / Insights│
│Sheet 2 │                                  │               │
│Stats   │                                  │ NLQ Bar       │
│Columns │                                  │               │
└────────┴─────────────────────────────────┴───────────────┘
│ STATUS BAR: Rows | Cols | Selected | Memory | Gemini Status│
└──────────────────────────────────────────────────────────┘
```

**Required features:**
- Panel resizing via `react-resizable-panels` — widths persist in localStorage
- View mode tabs: Grid / Charts / Analysis (top of main area)
- Sidebar: sheet list, column list with type icons and quality dots, quick stats
- AI Panel: always visible by default, collapsible, shows streaming insights
- Keyboard shortcut: `Cmd/Ctrl + K` opens CommandPalette
- `Cmd/Ctrl + \` toggles sidebar
- Right-click on column header → context menu with: Sort, Filter, Profile, Chart from column, Ask AI about this column

### Page 3 — Analyze (`app/analyze/page.tsx`)
**Grid layout with 4 main sections:**
1. Descriptive Statistics Dashboard (all columns summary table)
2. Column Profiler (select column → see full distribution, stats, quality)
3. Correlation Matrix (heatmap — only numeric columns)
4. Anomaly Report (table of detected outliers with severity badges)

### Page 4 — Visualize (`app/visualize/page.tsx`)
**Two-panel layout:**
- Left: Chart type picker + axis configuration
- Right: Live chart preview with export toolbar
- Below picker: AI chart recommendation ("Based on your data, try...")
- Export options: PNG (high-res), SVG, PDF, copy as image

### Page 5 — Ask (`app/ask/page.tsx`)
**Chat interface:**
- Full conversation history with user/AI bubbles
- Input bar at bottom (always focused)
- Suggested prompts when chat is empty
- Charts render inline within AI messages
- "Copy answer", "Create chart from this" action buttons on each AI response

### Page 6 — Report (`app/report/page.tsx`)
**Three sections:**
- Tone selector: Executive / Technical / Casual
- "Generate Report" button → streams Gemini response
- Rendered markdown with AXIOM styling
- Export as PDF / copy as HTML

---

## 12. COMPONENT LIBRARY SPECIFICATION

### `components/ui/GlassCard.tsx`
```typescript
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'heavy' | 'subtle'
  glow?: 'none' | 'violet' | 'cyan' | 'green'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', glow = 'none', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          variant === 'default' && 'glass-card',
          variant === 'heavy' && 'glass-heavy',
          variant === 'subtle' && 'glass',
          glow === 'violet' && 'glow-violet',
          glow === 'cyan' && 'glow-cyan',
          glow === 'green' && 'glow-green',
          padding === 'none' && 'p-0',
          padding === 'sm' && 'p-3',
          padding === 'md' && 'p-4',
          padding === 'lg' && 'p-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassCard.displayName = 'GlassCard'
```

### `components/ui/GlassButton.tsx`
```typescript
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'btn-glass',
          variant === 'primary' && 'btn-primary',
          variant === 'danger' && 'btn-danger',
          variant === 'ghost' && 'border-transparent bg-transparent hover:bg-white/5',
          size === 'sm' && 'px-3 py-1.5 text-xs',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          size === 'icon' && 'p-2 aspect-square',
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)
GlassButton.displayName = 'GlassButton'
```

### `components/grid/DataGrid.tsx` — Specification
- Use `@tanstack/react-table` for column management
- Use `react-window` FixedSizeList for virtual row rendering
- Row height: 36px
- Column min-width: 120px, max-width: 400px (resizable)
- Pinned first column (row numbers)
- Column type icons in headers (# for number, T for text, 📅 for date, etc.)
- Null cells: render as dash "—" with muted style
- Outlier cells: highlight with amber background and warning icon
- Selected columns: header glow in violet
- Click column header → select column (highlights in sidebar)
- Shift+click → multi-select
- Right-click → context menu (sort asc/desc, filter, profile, chart)
- Scroll performance: virtualize rows AND columns if >50 cols

### `components/charts/ChartCanvas.tsx` — Specification
- Master chart container component
- Accepts `chartType`, `xColumn`, `yColumn`, `data`, `options`
- Renders the correct chart sub-component based on `chartType`
- All charts use the AXIOM color palette (glass-compatible)
- Chart colors: `['#6C63FF', '#00D4FF', '#39FF14', '#FFB627', '#FF4757', '#A855F7', '#F97316']`
- Every chart has a title, subtitle (row count), and export button
- Responsive via `ResponsiveContainer` from Recharts
- Loading state: skeleton shimmer
- Empty state: centered message with suggestion

### `components/analysis/CorrelationMatrix.tsx` — Specification
- Input: array of numeric columns with their values
- Build n×n correlation matrix using `computeCorrelation` from `lib/stats.ts`
- Render as SVG heatmap (use D3 color scale)
- Color scale: negative correlations = red, zero = gray, positive = violet
- Cell tooltip: show r value on hover
- Click cell → opens scatter plot of the two columns
- Exportable as PNG

---

## 13. API ROUTES SPECIFICATION

### Rate Limiting Strategy (implement in `middleware.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30 // requests per window
const WINDOW_MS = 60 * 1000 // 1 minute

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api/gemini')) {
    return NextResponse.next()
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return NextResponse.next()
  }

  if (entry.count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait 60 seconds.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  entry.count++
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

---

## 14. FEATURE MODULES — COMPLETE IMPLEMENTATION ORDER

### Module Build Order (strictly follow this sequence):

```
M01 → File Upload & Parsing (DropZone + parser.ts)
M02 → Data Grid (DataGrid.tsx with virtual scroll)
M03 → Column Type Detection (columnInference.ts)
M04 → Sheet Navigation (SheetTabs.tsx)
M05 → Statistical Summary (StatSummaryPanel.tsx + stats.ts)
M06 → Gemini API Setup (lib/gemini.ts + all route.ts files)
M07 → AI Insight Panel (InsightCard.tsx + streaming)
M08 → Basic Charts (Bar, Line, Pie, Area, Scatter via Recharts)
M09 → Chart Picker (ChartPicker.tsx with axis mapper)
M10 → Column Profiler (ColumnProfiler.tsx with distribution chart)
M11 → Correlation Matrix (CorrelationMatrix.tsx)
M12 → Anomaly Detection (anomaly.ts + AnomalyDetector.tsx)
M13 → Data Cleaning Engine (with undo/redo stack)
M14 → NLQ Chat Interface (/ask page + useGeminiStream.ts)
M15 → Pivot Table Builder (PivotBuilder.tsx)
M16 → Advanced Charts (Heatmap, Treemap, Sankey, Radar via D3)
M17 → K-Means Clustering (clustering.ts + ClusteringView.tsx)
M18 → Regression & Forecast (regression.ts + RegressionView.tsx)
M19 → Time Series (TimeSeriesView.tsx with decomposition)
M20 → Multi-Sheet Join (MultiSheetJoin.tsx)
M21 → Geo Map (GeoMapView.tsx with D3 + topojson)
M22 → AI Data Story (/report page)
M23 → Export Engine (PDF, PNG, CSV via export.ts)
M24 → Command Palette (cmdk + CommandPalette.tsx)
M25 → Keyboard Shortcuts (useKeyboardShortcuts.ts)
M26 → Mobile Responsive Polish
M27 → Performance Audit & Optimization
M28 → Accessibility Pass (ARIA labels, keyboard nav)
```

---

## 15. ANIMATION & INTERACTION CONTRACTS

### Framer Motion Usage Patterns
```typescript
// Page entrance — use on every main section
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }
}

// Card hover
const cardHover = {
  scale: 1.01,
  transition: { duration: 0.2, ease: 'easeOut' }
}

// Panel slide-in (right panel)
const panelVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.25 } }
}

// AI response streaming — text appears with cursor
// Use AnimatePresence + motion.span for each word
```

### Required Micro-Interactions
| Interaction | Behavior |
|-------------|----------|
| Column header click | Glow pulse + sidebar scroll to column |
| Chart render | Bars animate up from baseline on mount |
| File drop on zone | Zone border pulses, background brightens |
| AI thinking | Dot animation (3 dots bouncing) |
| Outlier cell hover | Tooltip with z-score and severity |
| Insight card expand | Smooth height animation |
| Success toast | Slides in from top-right, glow-green variant |
| Error toast | Slides in from top-right, glow-red variant |

---

## 16. ERROR HANDLING PROTOCOL

### Error Boundaries
Every page must be wrapped in an `ErrorBoundary` component.
```typescript
// components/ErrorBoundary.tsx
'use client'
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="glass-card p-8 text-center">
          <p className="text-red-400 font-medium mb-2">Something went wrong</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {this.state.error?.message}
          </p>
          <button
            className="btn-glass mt-4"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

### User-Facing Error Messages
| Error Condition | Message to Show |
|----------------|----------------|
| File too large | "File exceeds 50MB limit. Try compressing or splitting the file." |
| Unsupported format | "AXIOM supports .xlsx, .xls, .csv, .tsv, .ods files only." |
| Gemini 429 rate limit | "AI quota reached. Your analysis is still available. Try again in 60 seconds." |
| Gemini 500 error | "AI service temporarily unavailable. Core analysis tools still work." |
| Empty sheet | "This sheet appears to be empty. Please check the file." |
| Parse error | "Could not read this file. It may be corrupted or password-protected." |
| No numeric columns | "No numeric columns found. Correlation and regression require numbers." |

---

## 17. PERFORMANCE REQUIREMENTS

### Hard Limits
| Metric | Requirement |
|--------|-------------|
| Initial page load (LCP) | < 2.5 seconds |
| File parse time (10MB xlsx) | < 3 seconds |
| Time to first chart render | < 1 second after parse |
| Gemini stream first token | < 3 seconds |
| Grid scroll FPS (100k rows) | 60 FPS (virtual scroll) |
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 85 |
| Bundle size (initial JS) | < 500KB gzipped |

### Optimization Rules
1. **Dynamic imports** for all D3 components, correlation matrix, clustering — they're heavy
2. **Web Worker** for file parsing if file > 5MB (use `useWorker` pattern)
3. **Memoize** all statistical computations with `useMemo`
4. **Never re-parse** the file; store parsed result in Zustand permanently
5. **Row virtualization** is mandatory — never render more than 100 DOM rows
6. **Debounce** all Gemini calls (NLQ bar: 600ms debounce)
7. **Cache** Gemini responses in `sessionStorage` by `hash(sheet.name + question)`
8. **Code split** every page with `next/dynamic`

```typescript
// Example: lazy load heavy chart components
import dynamic from 'next/dynamic'

const SankeyView = dynamic(() => import('@/components/charts/charts/SankeyView'), {
  loading: () => <div className="skeleton h-64 w-full" />,
  ssr: false,
})

const CorrelationMatrix = dynamic(
  () => import('@/components/analysis/CorrelationMatrix'),
  { loading: () => <div className="skeleton h-96 w-full" />, ssr: false }
)
```

---

## 18. BUILD PHASES — SPRINT EXECUTION ORDER

### Phase 1 — Foundation (Complete before moving on)
**Exit criteria: User can upload a file and see their data in the grid.**

```
✓ Next.js project initialized with all deps
✓ globals.css and glass.css complete
✓ Font loading configured
✓ Zustand stores created (all 3)
✓ TypeScript types defined in /types/
✓ lib/parser.ts complete and tested
✓ lib/columnInference.ts complete
✓ DropZone component with drag-drop + click
✓ UploadProgress component
✓ DataGrid with TanStack + react-window
✓ SheetTabs navigation
✓ Sidebar with column list
✓ Topbar component
✓ StatusBar component
✓ Landing page (app/page.tsx) complete
✓ Workspace layout (app/workspace/layout.tsx) complete
✓ File → parse → redirect to /workspace flow works
✓ npm run build passes with zero errors
```

### Phase 2 — Core Analysis (Exit: Statistical analysis works end-to-end)
```
✓ lib/stats.ts complete
✓ StatSummaryPanel.tsx renders all descriptive stats
✓ ColumnProfiler.tsx with histogram + stats
✓ lib/gemini.ts API client complete
✓ All 4 Gemini API routes created
✓ middleware.ts rate limiting active
✓ useGeminiStream.ts hook working
✓ AI Insight Panel shows streamed analysis
✓ Basic Recharts integration (Bar, Line, Pie, Area, Scatter)
✓ ChartPicker.tsx with axis configuration
✓ ChartCanvas.tsx routing to correct chart
✓ Correlation Matrix with heatmap
✓ Anomaly detection overlay on grid
✓ npm run build passes
```

### Phase 3 — AI Brain (Exit: NLQ chat works, cleaning works)
```
✓ /ask page fully functional
✓ NLQ bar with debounce + streaming
✓ Chat history with user/AI bubbles
✓ Charts render inside AI chat messages
✓ SuggestedPrompts component when chat is empty
✓ Cleaning recommendations from Gemini
✓ Data cleaning engine (apply/undo/redo)
✓ AnomalyCard with contextual Gemini explanations
✓ Smart column profiler with semantic type labels
✓ Query history persisted in aiStore
✓ npm run build passes
```

### Phase 4 — Advanced (Exit: All 30+ analysis tools working)
```
✓ D3 Sankey diagram
✓ D3 Treemap
✓ D3 Network graph
✓ D3 Geo choropleth map
✓ Box plot view
✓ Waterfall chart
✓ Radar chart
✓ K-Means clustering with elbow chart
✓ Linear & polynomial regression with forecast
✓ Time series decomposition
✓ Multi-sheet JOIN wizard
✓ Pivot table builder with multi-aggregation
✓ /report page with AI story generator
✓ npm run build passes
```

### Phase 5 — Polish (Exit: Ship-ready)
```
✓ Framer Motion animations on all pages
✓ Command palette (⌘K) with all actions indexed
✓ Keyboard shortcuts (useKeyboardShortcuts.ts)
✓ Export engine: PNG, PDF, CSV, SVG
✓ Mobile responsive (375px breakpoint)
✓ Error boundaries on all pages
✓ Toast notifications (react-hot-toast)
✓ Loading skeletons on all async operations
✓ Right-click context menus on grid
✓ Demo mode with sample data
✓ SEO metadata in all layouts
✓ Lighthouse audit ≥ 90 performance
✓ Zero TypeScript errors (tsc --noEmit)
✓ Zero ESLint errors
✓ All console.errors resolved
✓ Vercel deployment working
```

---

## 19. TESTING CONTRACTS

### Before Any PR/Commit — Manual Test Checklist
```
□ Upload an xlsx file with multiple sheets
□ Upload a csv file
□ Upload a file > 50MB → verify error message
□ Upload a .pdf → verify "unsupported format" error
□ Switch between sheets → data updates correctly
□ Sort a column ascending and descending
□ Select two numeric columns → see correlation value
□ Click "Ask AI" → type a question → see streaming response
□ Generate a bar chart from a categorical + numeric column
□ Open correlation matrix → verify all values are -1 to 1
□ Trigger anomaly detection → see highlighted rows
□ Generate data story → verify it completes without error
□ Open command palette (⌘K) → search for "correlation" → navigate to it
□ Resize the right panel → verify it snaps back on refresh
□ Test on 375px wide viewport → verify layout doesn't break
□ Verify "Clear / Upload New" resets all state
□ Test keyboard shortcuts: ⌘K, ⌘/, ⌘\
```

---

## 20. DEPLOYMENT CHECKLIST

### Vercel Deployment
```bash
# 1. Verify build passes locally
npm run build

# 2. Check TypeScript
npx tsc --noEmit

# 3. Check lint
npm run lint

# 4. Install Vercel CLI
npm i -g vercel

# 5. Deploy
vercel --prod

# 6. Set environment variables in Vercel Dashboard:
#    GEMINI_API_KEY = [your key]
#    NEXT_PUBLIC_APP_URL = https://axiom-[your-id].vercel.app
```

### `vercel.json`
```json
{
  "functions": {
    "app/api/gemini/**": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## 21. FORBIDDEN PATTERNS

The following patterns are **NEVER** acceptable in this codebase:

```typescript
// ❌ FORBIDDEN: Any type
const data: any = parseFile(f)

// ❌ FORBIDDEN: Type casting to silence errors
const row = data as unknown as MyType

// ❌ FORBIDDEN: Uncaught async
useEffect(() => { fetchData() }, []) // missing .catch()

// ❌ FORBIDDEN: Inline styles for glass effects (use CSS classes)
<div style={{ backdropFilter: 'blur(20px)' }}>

// ❌ FORBIDDEN: Storing entire dataset in component state (use Zustand)
const [rows, setRows] = useState<Row[]>([])

// ❌ FORBIDDEN: Blocking the main thread for file parsing
const parsed = XLSX.read(bigBuffer) // no await, no worker

// ❌ FORBIDDEN: Sending full dataset to Gemini
body: JSON.stringify({ rows: allRows }) // could be 100k rows

// ❌ FORBIDDEN: Hardcoded API key in any client file
const API_KEY = 'AIza...' // NEVER

// ❌ FORBIDDEN: Rendering 100k rows without virtualization
{rows.map(r => <tr key={r.id}>...</tr>)} // will crash browser

// ❌ FORBIDDEN: console.log in production code
console.log('debug:', data) // use proper error logging

// ❌ FORBIDDEN: Non-null assertion on data access
const val = row.values[0]! // use optional chaining

// ❌ FORBIDDEN: Index access without bounds check
const col = columns[index] // use columns[index] ?? defaultColumn

// ❌ FORBIDDEN: Missing loading/error states on Gemini calls
const result = await gemini.analyze(sheet) // no try/catch, no loading
```

---

## 22. AGENT COMMUNICATION PROTOCOL

### When Starting a New Module
Before writing any code for a module, output this header:

```
## Building: [Module Name]
### Dependencies: [list modules this depends on]
### Files to create: [list all files]
### Files to modify: [list existing files that change]
### Estimated complexity: [Low | Medium | High]
```

### When Completing a Module
After implementing a module, output this footer:

```
## Completed: [Module Name]
### Files created: [list]
### Files modified: [list]
### Known edge cases handled: [list]
### Manual test: [one-line description of how to verify]
### Next recommended module: [module name]
```

### When Encountering an Ambiguity
If requirements are unclear for a sub-task:
1. State the assumption you're making
2. Implement based on the assumption
3. Flag it for human review with: `// AGENT_ASSUMPTION: [description]`

### Context Window Management for Large Files
If implementing a large file (>200 lines), build it in sections:
1. Types and imports
2. Core logic functions
3. React component/hook
4. Export statement

Always ensure each section is complete before moving to the next.
Never output "continued in next response" — complete the file in full.

---

## APPENDIX A — SAMPLE DATA SPECIFICATION

### `/public/sample-data/sales-data.xlsx`
Create a realistic dataset with these columns:
- `Order ID` (string, unique)
- `Date` (date, 2023-01-01 to 2024-12-31)
- `Region` (category: North, South, East, West, International)
- `Product` (category: 8 product names)
- `Category` (category: Electronics, Clothing, Food, Home, Sports)
- `Units Sold` (integer, 1-500)
- `Unit Price` (currency, $5-$2000)
- `Revenue` (currency = Units * Price)
- `Cost` (currency, 60-80% of Revenue)
- `Profit` (currency = Revenue - Cost)
- `Customer Rating` (float, 1.0-5.0)
- `Returns` (integer, 0-50)
- `Salesperson` (string, 10 names)
- `Shipping Days` (integer, 1-14)
Minimum 500 rows. Intentionally include 5-10 null values and 3-5 outliers for demo purposes.

---

## APPENDIX B — CHART TYPE REGISTRY

```typescript
// lib/chartConfig.ts
export const CHART_TYPES = {
  bar: {
    label: 'Bar Chart',
    icon: 'BarChart2',
    requiresX: true,
    requiresY: true,
    bestFor: ['comparison', 'ranking', 'category vs numeric'],
    minColumns: 2,
  },
  line: {
    label: 'Line Chart',
    icon: 'LineChart',
    requiresX: true,
    requiresY: true,
    bestFor: ['trends over time', 'continuous data'],
    minColumns: 2,
  },
  area: {
    label: 'Area Chart',
    icon: 'AreaChart',
    requiresX: true,
    requiresY: true,
    bestFor: ['cumulative trends', 'volume over time'],
    minColumns: 2,
  },
  pie: {
    label: 'Pie Chart',
    icon: 'PieChart',
    requiresX: true,
    requiresY: true,
    bestFor: ['part-to-whole', 'proportions', 'max 8 categories'],
    minColumns: 2,
  },
  scatter: {
    label: 'Scatter Plot',
    icon: 'ScatterChart',
    requiresX: true,
    requiresY: true,
    bestFor: ['correlation', 'distribution', 'two numeric columns'],
    minColumns: 2,
  },
  heatmap: {
    label: 'Heatmap',
    icon: 'Grid3X3',
    requiresX: true,
    requiresY: true,
    bestFor: ['correlation matrix', 'frequency matrix', 'time patterns'],
    minColumns: 2,
  },
  treemap: {
    label: 'Treemap',
    icon: 'SquareStack',
    requiresX: true,
    requiresY: true,
    bestFor: ['hierarchical data', 'proportional areas'],
    minColumns: 2,
  },
  radar: {
    label: 'Radar Chart',
    icon: 'Radar',
    requiresX: false,
    requiresY: true,
    bestFor: ['multi-attribute comparison', 'performance profiling'],
    minColumns: 3,
  },
  waterfall: {
    label: 'Waterfall',
    icon: 'BarChartHorizontal',
    requiresX: true,
    requiresY: true,
    bestFor: ['cumulative effect', 'profit/loss breakdown'],
    minColumns: 2,
  },
  sankey: {
    label: 'Sankey Diagram',
    icon: 'Workflow',
    requiresX: true,
    requiresY: true,
    bestFor: ['flow between categories', 'funnel analysis'],
    minColumns: 3,
  },
  boxplot: {
    label: 'Box Plot',
    icon: 'BoxSelect',
    requiresX: true,
    requiresY: true,
    bestFor: ['distribution', 'outlier visualization', 'quartile analysis'],
    minColumns: 2,
  },
  candlestick: {
    label: 'Candlestick',
    icon: 'CandlestickChart',
    requiresX: true,
    requiresY: false,
    bestFor: ['financial data', 'OHLC data'],
    minColumns: 5,
  },
  geo: {
    label: 'Geo Map',
    icon: 'Map',
    requiresX: true,
    requiresY: true,
    bestFor: ['geographic distribution', 'country/state data'],
    minColumns: 2,
  },
  network: {
    label: 'Network Graph',
    icon: 'Network',
    requiresX: true,
    requiresY: true,
    bestFor: ['relationships', 'connections', 'node-edge data'],
    minColumns: 2,
  },
} as const

export type ChartType = keyof typeof CHART_TYPES
```

---

## APPENDIX C — `lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number, decimals = 2): string {
  if (!isFinite(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str
}

export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export function deepEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyFn(item)
    if (!acc[key]) acc[key] = []
    acc[key]!.push(item)
    return acc
  }, {})
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
```

---

*AGENTS.md — AXIOM Project*
*Version: 1.0.0*
*Last Updated: 2026*
*Maintained by: AXIOM Engineering*
*Total Modules: 28 | Total Pages: 6 | Total API Routes: 4*