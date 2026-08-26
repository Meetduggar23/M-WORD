/* ============================================================
   Command registry — every palette action in one place.
   scoreCommand() and interpretIntent() are pure and unit-tested;
   useCommands() wires them to the live engine and UI stores.
   ============================================================ */

import React from 'react';
import {
  Sparkles, Table, FileText, Moon, Sun, ListTree, Wand2, Brush,
  Stethoscope, FlaskConical, Code2, Braces, History, GitCompare,
  BarChart3, LayoutTemplate, Search, Replace, MessageSquarePlus,
  Save, Printer, ZoomIn, ZoomOut, Maximize, Ruler, PanelLeft, Target,
  Link2, Bookmark, Footprints, ListOrdered, Image as ImageIcon,
  Shapes, ChartColumnBig, SquareRadical, Sigma, Type, Minus,
  List, Tag, Plus, Camera, Settings as SettingsIcon,
  ArrowDownWideNarrow, FileDown, FilePlus2, Lightbulb,
} from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';

export type IntentKind = 'command' | 'ai' | 'ask';

export interface Command {
  id: string;
  title: string;
  section: 'AI' | 'Document' | 'Insert' | 'Format' | 'View' | 'Developer' | 'Navigation';
  icon: React.ReactNode;
  keywords?: string;
  shortcut?: string;
  /** Voice-friendly example, shown in discovery hints */
  spoken?: string;
  action: () => void;
}

/* ─── Pure scoring (unit-tested) ──────────────────────────────────────────── */

/** Subsequence fuzzy score: higher is better; -1 means no match. */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q) return 0;
  if (t.includes(q)) return 100 - t.indexOf(q);
  let qi = 0;
  let score = 0;
  let streak = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      streak += 1;
      score += 2 + streak;
      qi++;
    } else {
      streak = 0;
    }
  }
  return qi === q.length ? score : -1;
}

export function scoreCommand(query: string, cmd: { title: string; section: string; keywords?: string }): number {
  const titleScore = fuzzyScore(query, cmd.title);
  const kwScore = cmd.keywords ? fuzzyScore(query, cmd.keywords) : -1;
  const secScore = fuzzyScore(query, cmd.section);
  return Math.max(titleScore, kwScore * 0.9, secScore * 0.5);
}

/** Decide whether natural-language input is a command, an AI edit request, or a question. */
export function interpretIntent(query: string): { kind: IntentKind; confidence: number } {
  const q = query.toLowerCase().trim();
  if (!q) return { kind: 'ask', confidence: 0 };

  const commandy = /^(show|open|toggle|insert|switch to|go to|run|export|set|turn on|turn off|start|create)\b/.test(q)
    || /^(dark mode|light mode|outline|find|replace|print|save)$/.test(q);
  if (commandy) return { kind: 'command', confidence: 0.8 };

  const edity = /\b(rewrite|improve|shorten|expand|summarize|make|fix|translate|convert|clean|polish|professional|formal|simple|academic)\b/.test(q);
  if (edity) return { kind: 'ai', confidence: 0.75 };

  return { kind: 'ask', confidence: 0.6 };
}

/* ─── Hook: build the live command list ───────────────────────────────────── */

interface UseCommandsDeps {
  toast: (kind: 'success' | 'error' | 'info', title: string, detail?: string) => void;
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  theme: 'light' | 'dark' | 'system';
  openAskAI: (question: string) => void;
  runInlineAI: (instruction: string) => void;
  insertMarkdown: (md: string) => void;
  insertSmartRef: (kind: 'figure' | 'table') => void;
  updateSmartRefs: () => void;
  takeSnapshot: () => void;
  openDiff: () => void;
}

export function useCommands(deps: UseCommandsDeps): Command[] {
  const engine = useDocumentEngine();
  const ui = useUI();
  const { toast, setTheme, theme, openAskAI, runInlineAI, insertMarkdown, insertSmartRef, updateSmartRefs, takeSnapshot, openDiff } = deps;

  return React.useMemo(() => {
    const C = (
      id: string, title: string, section: Command['section'], icon: React.ReactNode,
      action: () => void, extra?: Partial<Command>,
    ): Command => ({ id, title, section, icon, action, ...extra });

    const insertPicture = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const scale = img.width > 500 ? 500 / img.width : 1;
            engine.insertImage(reader.result as string, file.name, img.width * scale, img.height * scale);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      };
      input.click();
    };

    return [
      /* AI */
      C('ai.ask', 'Ask this document', 'AI', <Sparkles size={14} strokeWidth={2} />, () => ui.setRightPanel('ai'), { keywords: 'question answer sources brain', spoken: 'Ask this document' }),
      C('ai.rewrite', 'Rewrite selection', 'AI', <Wand2 size={14} strokeWidth={2} />, () => runInlineAI('Rewrite this'), { keywords: 'rephrase', shortcut: 'Select text first' }),
      C('ai.improve', 'Improve selection', 'AI', <Lightbulb size={14} strokeWidth={2} />, () => runInlineAI('Improve the writing'), { keywords: 'better writing' }),
      C('ai.shorten', 'Shorten selection', 'AI', <ArrowDownWideNarrow size={14} strokeWidth={2} />, () => runInlineAI('Make this more concise'), { keywords: 'concise tighten' }),
      C('ai.formal', 'Make selection professional', 'AI', <Type size={14} strokeWidth={2} />, () => runInlineAI('Make this professional'), { keywords: 'formal tone academic' }),
      C('ai.summarize', 'Summarize document', 'AI', <FileText size={14} strokeWidth={2} />, () => openAskAI('Summarize this document'), { keywords: 'tldr key points' }),
      C('ai.health', 'Analyze document health', 'AI', <Stethoscope size={14} strokeWidth={2} />, () => ui.setRightPanel('health'), { keywords: 'score issues quality' }),
      C('ai.cleanup', 'Clean up document', 'AI', <Brush size={14} strokeWidth={2} />, () => ui.openDialog('cleanup'), { keywords: 'normalize fix formatting', spoken: 'Clean document' }),
      C('ai.contradictions', 'Find contradictions', 'AI', <Search size={14} strokeWidth={2} />, () => openAskAI('Find contradictions or statements that conflict with each other in this document'), { keywords: 'conflicts' }),

      /* Document */
      C('doc.new', 'New document', 'Document', <FilePlus2 size={14} strokeWidth={2} />, () => engine.newDocument(), { shortcut: 'Ctrl+N' }),
      C('doc.open', 'Open document…', 'Document', <FileDown size={14} strokeWidth={2} />, () => engine.openDocument(), { shortcut: 'Ctrl+O' }),
      C('doc.save', 'Save document', 'Document', <Save size={14} strokeWidth={2} />, () => engine.saveDocument(), { shortcut: 'Ctrl+S' }),
      C('doc.print', 'Print / Export PDF', 'Document', <Printer size={14} strokeWidth={2} />, () => window.print(), { shortcut: 'Ctrl+P' }),
      C('doc.generator', 'Create with AI…', 'Document', <LayoutTemplate size={14} strokeWidth={2} />, () => ui.openDialog('generator'), { keywords: 'generate report paper template outline' }),
      C('doc.test', 'Run document test', 'Document', <FlaskConical size={14} strokeWidth={2} />, () => ui.openDialog('documentTest'), { keywords: 'checks qa quality ci', spoken: 'Run document test' }),
      C('doc.analytics', 'Document analytics', 'Document', <BarChart3 size={14} strokeWidth={2} />, () => ui.openDialog('analytics'), { keywords: 'stats reading time' }),
      C('doc.wordcount', 'Word count', 'Document', <Sigma size={14} strokeWidth={2} />, () => ui.openDialog('wordCount')),

      /* Insert */
      C('ins.table', 'Insert table', 'Insert', <Table size={14} strokeWidth={2} />, () => ui.openDialog('tableGrid'), { keywords: 'grid', spoken: 'Insert a table' }),
      C('ins.table.fromText', 'Convert text to table', 'Insert', <Table size={14} strokeWidth={2} />, () => {
        const sel = engine.getSelectedText().trim();
        if (!sel) {
          toast('info', 'Select text first', 'Select lines like "Name: Meet" or TSV rows, then convert.');
          return;
        }
        const lines = sel.split(/\r?\n/).filter((l) => l.trim());
        const kv = lines.map((l) => /^\s*([^:]{1,40}):\s*(.*)$/.exec(l)).filter((m): m is RegExpExecArray => !!m);
        const data = kv.length === lines.length
          ? [['Key', 'Value'], ...kv.map((m) => [m[1].trim(), m[2].trim()])]
          : lines.map((l) => l.split('\t').map((c) => c.trim()));
        engine.insertTableWithData(data);
        toast('success', 'Converted to table');
      }, { keywords: 'tsv csv key value' }),
      C('ins.image', 'Insert image…', 'Insert', <ImageIcon size={14} strokeWidth={2} />, insertPicture),
      C('ins.shape', 'Insert shape', 'Insert', <Shapes size={14} strokeWidth={2} />, () => engine.insertShape('roundedRectangle')),
      C('ins.chart', 'Insert chart', 'Insert', <ChartColumnBig size={14} strokeWidth={2} />, () => engine.insertChart('column')),
      C('ins.equation', 'Insert equation', 'Insert', <SquareRadical size={14} strokeWidth={2} />, () => ui.openDialog('symbolPicker')),
      C('ins.link', 'Insert hyperlink', 'Insert', <Link2 size={14} strokeWidth={2} />, () => {
        const url = window.prompt('URL:', 'https://');
        if (url) engine.insertHyperlink(url);
      }, { shortcut: 'Ctrl+K' }),
      C('ins.bookmark', 'Insert bookmark', 'Insert', <Bookmark size={14} strokeWidth={2} />, () => {
        const name = window.prompt('Bookmark name:');
        if (name) engine.insertBookmark(name);
      }),
      C('ins.footnote', 'Insert footnote', 'Insert', <Footprints size={14} strokeWidth={2} />, () => {
        const t = window.prompt('Footnote text:');
        if (t) engine.insertFootnote(t);
      }),
      C('ins.endnote', 'Insert endnote', 'Insert', <Footprints size={14} strokeWidth={2} />, () => {
        const t = window.prompt('Endnote text:');
        if (t) engine.insertEndnote(t);
      }),
      C('ins.pagebreak', 'Insert page break', 'Insert', <FileText size={14} strokeWidth={2} />, () => engine.insertPageBreak()),
      C('ins.hr', 'Insert horizontal line', 'Insert', <Minus size={14} strokeWidth={2} />, () => engine.insertHorizontalRule()),
      C('ins.toc', 'Insert table of contents', 'Insert', <ListTree size={14} strokeWidth={2} />, () => engine.insertTableOfContents()),
      C('ins.code', 'Insert code block', 'Insert', <Code2 size={14} strokeWidth={2} />, () => ui.openDialogWith('codeBlock', { tab: 'code' }), { keywords: 'developer programming snippet json' }),
      C('ins.jsontools', 'JSON tools', 'Insert', <Braces size={14} strokeWidth={2} />, () => ui.openDialogWith('codeBlock', { tab: 'json' }), { keywords: 'format validate fix minify tree' }),
      C('ins.mdimport', 'Import markdown…', 'Developer', <FileText size={14} strokeWidth={2} />, () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.txt';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          insertMarkdown(await file.text());
          toast('success', 'Markdown imported', `“${file.name}” converted into the document.`);
        };
        input.click();
      }, { keywords: 'md convert' }),
      C('ins.ref.fig', 'Insert figure reference', 'Insert', <Tag size={14} strokeWidth={2} />, () => insertSmartRef('figure'), { keywords: 'caption smart auto number' }),
      C('ins.ref.tab', 'Insert table reference', 'Insert', <Tag size={14} strokeWidth={2} />, () => insertSmartRef('table'), { keywords: 'caption smart auto number' }),
      C('ins.ref.update', 'Update all references', 'Developer', <Plus size={14} strokeWidth={2} />, () => updateSmartRefs(), { keywords: 'renumber figure table' }),

      /* Format */
      C('fmt.bold', 'Bold', 'Format', <Type size={14} strokeWidth={2.4} />, () => engine.toggleBold(), { shortcut: 'Ctrl+B' }),
      C('fmt.italic', 'Italic', 'Format', <Type size={14} strokeWidth={2} />, () => engine.toggleItalic(), { shortcut: 'Ctrl+I' }),
      C('fmt.underline', 'Underline', 'Format', <Type size={14} strokeWidth={2} />, () => engine.toggleUnderline(), { shortcut: 'Ctrl+U' }),
      C('fmt.h1', 'Style: Heading 1', 'Format', <ListOrdered size={14} strokeWidth={2} />, () => engine.applyStyle('Heading1')),
      C('fmt.h2', 'Style: Heading 2', 'Format', <ListOrdered size={14} strokeWidth={2} />, () => engine.applyStyle('Heading2')),
      C('fmt.title', 'Style: Title', 'Format', <ListOrdered size={14} strokeWidth={2} />, () => engine.applyStyle('Title')),
      C('fmt.bullets', 'Bullet list', 'Format', <List size={14} strokeWidth={2} />, () => engine.setBulletList()),
      C('fmt.numbered', 'Numbered list', 'Format', <ListOrdered size={14} strokeWidth={2} />, () => engine.setNumberedList()),
      C('fmt.clear', 'Clear formatting', 'Format', <Brush size={14} strokeWidth={2} />, () => engine.clearFormatting()),

      /* View */
      C('view.theme', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', 'View', theme === 'dark' ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />, () => setTheme(theme === 'dark' ? 'light' : 'dark'), { keywords: 'dark light mode theme', spoken: 'Switch to dark mode' }),
      C('view.outline', 'Show document outline', 'View', <PanelLeft size={14} strokeWidth={2} />, () => ui.setNavView('outline'), { keywords: 'navigation sidebar', spoken: 'Show outline' }),
      C('view.ruler', 'Toggle ruler', 'View', <Ruler size={14} strokeWidth={2} />, () => ui.toggleRuler()),
      C('view.focus', 'Focus mode', 'View', <Target size={14} strokeWidth={2} />, () => ui.setFocusMode(true), { keywords: 'distraction free writing goal' }),
      C('view.fullscreen', 'Fullscreen', 'View', <Maximize size={14} strokeWidth={2} />, () => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
      }, { shortcut: 'F11' }),
      C('view.zoomin', 'Zoom in', 'View', <ZoomIn size={14} strokeWidth={2} />, () => ui.zoomIn()),
      C('view.zoomout', 'Zoom out', 'View', <ZoomOut size={14} strokeWidth={2} />, () => ui.zoomOut()),
      C('view.snapshot', 'Take snapshot', 'View', <Camera size={14} strokeWidth={2} />, () => takeSnapshot(), { keywords: 'save version checkpoint' }),
      C('view.timeline', 'Document timeline', 'View', <History size={14} strokeWidth={2} />, () => ui.openDialog('timeline'), { keywords: 'history versions time machine snapshots' }),
      C('view.diff', 'Compare with snapshot', 'View', <GitCompare size={14} strokeWidth={2} />, () => openDiff(), { keywords: 'visual diff compare changes' }),
      C('view.dev', ui.devMode ? 'Disable developer mode' : 'Enable developer mode', 'Developer', <Code2 size={14} strokeWidth={2} />, () => ui.toggleDevMode(), { keywords: 'code json markdown' }),

      /* Navigation */
      C('nav.find', 'Find in document', 'Navigation', <Search size={14} strokeWidth={2} />, () => ui.openDialog('find'), { shortcut: 'Ctrl+F' }),
      C('nav.replace', 'Find and replace', 'Navigation', <Replace size={14} strokeWidth={2} />, () => ui.openDialog('replace'), { shortcut: 'Ctrl+H' }),
      C('nav.comments', 'Show comments', 'Navigation', <MessageSquarePlus size={14} strokeWidth={2} />, () => ui.setRightPanel('comments')),
      C('nav.settings', 'Settings', 'Document', <SettingsIcon size={14} strokeWidth={2} />, () => ui.openDialog('settings')),
    ];
  }, [engine, ui, toast, setTheme, theme, openAskAI, runInlineAI, insertMarkdown, insertSmartRef, updateSmartRefs, takeSnapshot, openDiff]);
}
