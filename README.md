<p align="center">
  <img src="frontend/react/public/newlogo.png" width="98" alt="WORD logo" />
</p>

<h1 align="center">WORD</h1>

<p align="center">
  <strong>An AI-native word processor built for the way people actually write.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> &nbsp;&middot;&nbsp;
  <a href="#ai--intelligence">Intelligence</a> &nbsp;&middot;&nbsp;
  <a href="#architecture">Architecture</a> &nbsp;&middot;&nbsp;
  <a href="#getting-started">Get Started</a> &nbsp;&middot;&nbsp;
  <a href="#roadmap">Roadmap</a>
</p>

---

WORD is a modern document editor that pairs a premium Microsoft Word-inspired interface with deep AI integration. It ships with 20 intelligent features, a command palette, voice control, and a full privacy model that lets you run AI entirely on your own machine.

---

## Features

### Editing & Formatting

- Rich text editing with page-based layout
- Character and paragraph formatting
- 50+ keyboard shortcuts via the command palette
- Find and replace with regex support
- Tables with merge, split, and alignment
- Headers, footers, and page numbers
- Style system with heading hierarchy

### AI & Intelligence

| Feature | What it does |
|---|---|
| **Command Palette** | `Ctrl+K` — fuzzy-search 50+ commands, or type a natural language request and route it to AI |
| **AI Inline Actions** | Rewrite, shorten, formalize, proofread, translate, simplify, expand, or change tone of selected text |
| **Suggestion Cards** | AI suggestions appear as cards with **Replace / Insert Below / Copy / Dismiss** — never auto-replaces your work |
| **Ask Document** | Retrieval-augmented Q&A over your document with clickable source citations |
| **Semantic Search** | TF-IDF indexed document brain with exact and semantic search modes |
| **Document Health** | 0–100 score across structure, style, clarity, consistency, formatting, and length with one-click fixes |
| **Cleanup Planner** | Preview and apply structural cleanup as a single undoable action |
| **Design Inspector** | Inspect typography and formatting consistency of any selection |
| **Smart Paste** | Detects web, PDF, TSV, and key-value content and suggests the best paste mode |
| **Table Intelligence** | Analyze tables for anomalies and patterns, generate charts |
| **Smart References** | Auto-renumber Figure and Table captions with in-text reference updates |
| **Document Test** | CI-style test suite that checks your document for common problems |
| **Voice Commands** | "Insert a table with four columns", "Go to heading", "Bold the selection" |

### Developer Tools

- **Code Block Dialog** — insert syntax-highlighted code in 16 languages with line numbers
- **JSON Tools** — validate, fix, format, minify, and tree-view JSON content
- **Markdown Import/Export** — round-trip between Markdown and the editor's document model
- **Word-Level Diff** — visual diff between any two text states, showing exactly what changed

### History & Focus

- **Time Machine** — snapshot history with restore and visual diff between versions
- **Focus Mode** — distraction-free writing with session timer, words-per-session, and daily writing goals
- **Analytics** — reading time, word count, paragraph count, and document structure overview

### Privacy

- **Lock / Cloud badge** in the status bar shows whether AI runs locally or in the cloud
- **On-device tools** — local provider uses rule-based heuristics, never fakes AI
- **Ollama / local servers** — connect to any OpenAI-compatible endpoint on your machine
- **Custom provider** — bring your own API key and endpoint
- **Feature flags** — toggle every AI feature on or off per device

---

## Architecture

```
WORD/
├── src/
│   ├── engine/          Core document model (3700+ lines)
│   ├── features/
│   │   ├── ai/          Provider abstraction + local/openai/custom
│   │   ├── brain/       TF-IDF document indexer + React provider
│   │   ├── commands/    50+ commands + NL intent routing
│   │   ├── history/     Snapshots + writing goals
│   │   ├── intel/       Health, cleanup, doc test, design inspector, refs, table intel
│   │   ├── speech/      Web Speech API + command grammar
│   │   └── text/        Diff, markdown, JSON tools, code tokenizer, smart paste
│   ├── components/
│   │   ├── ai/          AIPanel, inline actions, suggestion cards
│   │   ├── command/     Command palette
│   │   ├── dialogs/     12 feature dialogs
│   │   ├── editor/      Document canvas, floating toolbar, focus HUD
│   │   ├── panels/      Health panel, design inspector, nav rail, voice control
│   │   └── toolbar/     Ribbon with 10 tabs
│   ├── store/           UI state (zustand-style)
│   ├── hooks/           Document engine context
│   └── styles/          CSS variables + global design system
├── test/                52 tests (brain, features, intelligence, app)
└── public/              Static assets
```

### Design System

- **Fluent-inspired surfaces** — layered elevation, soft shadows, acrylic overlays
- **Word blue `#103f91`** — title bar and accent across the entire UI
- **10 ribbon tabs** — File, Home, Insert, Draw, Design, Layout, References, Mailings, Developer, View
- **Left navigation rail** — 7-icon rail for quick access to document sections
- **Spring-eased transitions** — with `prefers-reduced-motion` support
- **Zero emojis in code** — all icons from `lucide-react`

### Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript |
| Bundler | Vite 5 |
| Icons | lucide-react |
| AI (local) | Rule-based heuristics — honest, no fake AI |
| AI (cloud) | OpenAI-compatible API (Ollama, OpenAI, custom) |
| Testing | Vitest + Testing Library |
| Linting | ESLint with strict zero-warning config |
| Speech | Web Speech API |

---

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- A modern browser (Chrome, Edge, Firefox)

### Install & Run

```bash
# Clone
git clone https://github.com/Meetduggar23/M-WORD.git
cd M-WORD/frontend/react

# Install
npm install

# Start dev server
npm run dev
```

The app opens at `http://localhost:5173`.

### Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript compile + Vite build
npm run lint         # ESLint (zero warnings)
npm run test         # Vitest in watch mode
npm run test -- --run # Single test run
```

---

## Testing

52 tests across 4 suites:

| Suite | Tests | Coverage |
|---|---|---|
| `brain.test.ts` | TF-IDF indexing, semantic search | Feature logic |
| `features.test.ts` | Diff, JSON, Markdown, paste, voice, readability | Text & speech |
| `intelligence.test.ts` | Health, cleanup, doc test, refs, table intel, inspector | All intel modules |
| `App.test.tsx` | Core render, formatting, page-aware layout | Engine |

All pass. Build is clean. Lint has zero warnings.

---

## Roadmap

- [ ] DOCX / PDF import and export
- [ ] Real-time collaboration
- [ ] Plugin system
- [ ] Macro recording and playback
- [ ] Advanced rendering (math equations, footnotes)
- [ ] Cloud storage integration
- [ ] Mobile and tablet optimization

---

## Contributing

Contributions are welcome. Run `npm run lint` and `npm run test -- --run` before pushing. The codebase enforces zero lint warnings.

---

## License

MIT

---

<p align="center">
  <sub>Built with React, TypeScript, and a lot of Lucide icons.</sub>
</p>
