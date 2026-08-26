import React, { useState } from 'react';
import {
  ClipboardPaste, Scissors, Copy, Paintbrush,
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
  AArrowUp, AArrowDown, CaseSensitive, RemoveFormatting,
  Baseline, Highlighter,
  List, ListOrdered, ListTree, IndentDecrease, IndentIncrease,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  BetweenHorizontalStart, PaintBucket, Grid2x2,
  Search, Replace, TextSelect,
  FilePlus2, File, SquareSplitVertical, Table, Image as ImageIcon,
  Shapes, ChartColumnBig, Sparkles, SquareText, Heading1, Hash,
  SquareRadical, Omega, Link2, Bookmark,
  Ruler as RulerIcon, PanelLeft, Maximize, Target,
  FileText, BookOpenCheck, CircleDot, Check, X, Undo2, Redo2,
  LayoutTemplate, Droplets, Columns3, RectangleVertical, RectangleHorizontal,
  Footprints, MessageSquarePlus, MessagesSquare, CheckCheck,
  Keyboard, Info, MailPlus, Type,
  ChevronDown, ChevronUp, PenLine, Pencil, Eraser, Lasso,
  Mail, Tag, Users, Reply, Send, Database,
  Code2, FileCode2, ShieldCheck, Braces, FileDown,
  Stethoscope, Brush, FlaskConical, BarChart3, History, GitCompare,
  Command as CommandIcon,
} from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { Paragraph, Alignment, ShapeType, PageSize, QuillDocument } from '../../engine/DocumentEngine';
import { useUI } from '../../store/uiStore';
import { useToast } from '../toast/Toast';
import { exportMarkdown, parseMarkdown } from '../../features/text/markdown';
import { renumberReferences, nextNumberFor } from '../../features/intel/smartRefs';
import {
  RibbonGroup, RBRow, RBSep, RibButton, RibBigButton, RibListButton,
  RibCombo, RibDropdown, MenuItemRow, ColorPalette,
} from './primitives';
import './Ribbon.css';

type RibbonTab =
  | 'File' | 'Home' | 'Insert' | 'Draw' | 'Design' | 'Layout'
  | 'References' | 'Mailings' | 'Review' | 'View' | 'Developer' | 'Help';

interface RibbonProps {
  onOpenFileMenu?: () => void;
}

const FONTS = [
  'Calibri', 'Aptos', 'Arial', 'Times New Roman', 'Georgia', 'Verdana',
  'Courier New', 'Consolas', 'Cambria', 'Garamond', 'Palatino', 'Trebuchet MS', 'Tahoma',
];
const SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

/* Mini SVG previews for the Shapes gallery — no emoji, real geometry */
const ShapeIcon: React.FC<{ type: ShapeType; size?: number }> = ({ type, size = 18 }) => {
  const s = { width: size, height: size, viewBox: '0 0 20 20' };
  const common = { fill: 'var(--accent-soft)', stroke: 'currentColor', strokeWidth: 1.4 };
  switch (type) {
    case 'roundedRectangle':
      return <svg {...s}><rect x="2" y="4" width="16" height="12" rx="3" {...common} /></svg>;
    case 'oval':
    case 'circle':
      return <svg {...s}><circle cx="10" cy="10" r="7.5" {...common} /></svg>;
    case 'triangle':
      return <svg {...s}><polygon points="10,3 18,17 2,17" {...common} /></svg>;
    case 'diamond':
      return <svg {...s}><polygon points="10,2 18,10 10,18 2,10" {...common} /></svg>;
    case 'pentagon':
      return <svg {...s}><polygon points="10,2 18,8 15,17 5,17 2,8" {...common} /></svg>;
    case 'hexagon':
      return <svg {...s}><polygon points="6,3 14,3 18,10 14,17 6,17 2,10" {...common} /></svg>;
    case 'star5': {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? 8.5 : 3.6;
        const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        return `${10 + r * Math.cos(a)},${10 + r * Math.sin(a)}`;
      }).join(' ');
      return <svg {...s}><polygon points={pts} {...common} /></svg>;
    }
    case 'arrowRight':
    case 'arrow':
      return <svg {...s}><polygon points="2,7 12,7 12,3 18,10 12,17 12,13 2,13" {...common} /></svg>;
    case 'leftRightArrow':
      return <svg {...s}><polygon points="1,10 6,5 6,8 14,8 14,5 19,10 14,15 14,12 6,12 6,15" {...common} /></svg>;
    case 'heart':
      return <svg {...s}><path d="M10 17 C 2 11, 2 4, 7 4 C 9 4, 10 6, 10 6 C 10 6, 11 4, 13 4 C 18 4, 18 11, 10 17 Z" {...common} /></svg>;
    case 'lightning':
      return <svg {...s}><polygon points="11,2 5,11 9,11 8,18 15,8 11,8" {...common} /></svg>;
    case 'sun':
      return <svg {...s}><circle cx="10" cy="10" r="4" {...common} /><g stroke="currentColor" strokeWidth="1.3"><line x1="10" y1="1.5" x2="10" y2="4" /><line x1="10" y1="16" x2="10" y2="18.5" /><line x1="1.5" y1="10" x2="4" y2="10" /><line x1="16" y1="10" x2="18.5" y2="10" /></g></svg>;
    case 'moon':
      return <svg {...s}><path d="M15 12 A 7 7 0 1 1 8 3 A 6 6 0 0 0 15 12 Z" {...common} /></svg>;
    case 'cloud':
      return <svg {...s}><path d="M6 15 A 3.5 3.5 0 0 1 6 8 A 4.5 4.5 0 0 1 14.5 9 A 3 3 0 0 1 14 15 Z" {...common} /></svg>;
    case 'cross':
      return <svg {...s}><polygon points="8,2 12,2 12,8 18,8 18,12 12,12 12,18 8,18 8,12 2,12 2,8 8,8" {...common} /></svg>;
    case 'donut':
      return <svg {...s}><circle cx="10" cy="10" r="7.5" {...common} /><circle cx="10" cy="10" r="3.2" fill="var(--bg-primary)" stroke="currentColor" strokeWidth="1.4" /></svg>;
    case 'frame':
      return <svg {...s}><rect x="3" y="3" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" /></svg>;
    case 'rectangle':
    default:
      return <svg {...s}><rect x="2.5" y="4" width="15" height="12" {...common} /></svg>;
  }
};

const SHAPES: { type: ShapeType; label: string }[] = [
  { type: 'rectangle', label: 'Rectangle' },
  { type: 'roundedRectangle', label: 'Rounded Rectangle' },
  { type: 'oval', label: 'Oval' },
  { type: 'circle', label: 'Circle' },
  { type: 'triangle', label: 'Triangle' },
  { type: 'diamond', label: 'Diamond' },
  { type: 'pentagon', label: 'Pentagon' },
  { type: 'hexagon', label: 'Hexagon' },
  { type: 'star5', label: '5-Point Star' },
  { type: 'arrow', label: 'Arrow' },
  { type: 'arrowRight', label: 'Right Arrow' },
  { type: 'leftRightArrow', label: 'Left-Right Arrow' },
  { type: 'heart', label: 'Heart' },
  { type: 'lightning', label: 'Lightning Bolt' },
  { type: 'sun', label: 'Sun' },
  { type: 'moon', label: 'Moon' },
  { type: 'cloud', label: 'Cloud' },
  { type: 'cross', label: 'Cross' },
  { type: 'frame', label: 'Frame' },
  { type: 'donut', label: 'Donut' },
];

const CHART_TYPES = [
  { type: 'column', label: 'Column' },
  { type: 'bar', label: 'Bar' },
  { type: 'line', label: 'Line' },
  { type: 'area', label: 'Area' },
  { type: 'pie', label: 'Pie' },
  { type: 'doughnut', label: 'Doughnut' },
  { type: 'scatter', label: 'Scatter' },
  { type: 'radar', label: 'Radar' },
] as const;

const PAGE_SIZES: { value: PageSize; label: string }[] = [
  { value: 'A4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
  { value: 'A3', label: 'A3' },
  { value: 'A5', label: 'A5' },
  { value: 'tabloid', label: 'Tabloid' },
  { value: 'B4', label: 'B4' },
  { value: 'B5', label: 'B5' },
];

export const Ribbon: React.FC<RibbonProps> = ({ onOpenFileMenu }) => {
  const [activeTab, setActiveTab] = useState<RibbonTab>('Home');
  const engine = useDocumentEngine();
  const ui = useUI();

  const tabs: RibbonTab[] = [
    'File', 'Home', 'Insert', 'Draw', 'Design', 'Layout',
    'References', 'Mailings', 'Review', 'View', 'Developer', 'Help',
  ];

  return (
    <div className="ribbon-container">
      <div className="ribbon-tabs-row">
        <div className="ribbon-tabs" role="tablist" aria-label="Ribbon tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`ribbon-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => (tab === 'File' ? onOpenFileMenu?.() : setActiveTab(tab))}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          className="ribbon-palette-hint"
          onClick={() => ui.openDialog('commandPalette')}
          title="Command palette — search commands or ask in natural language (Ctrl+K)"
          aria-label="Open command palette"
          type="button"
        >
          <CommandIcon size={12} strokeWidth={2.1} />
          <span>Commands</span>
          <kbd>Ctrl+K</kbd>
        </button>
        <button
          className="ribbon-collapse"
          onClick={ui.toggleRibbonCollapsed}
          title={ui.ribbonCollapsed ? 'Pin the ribbon' : 'Collapse the ribbon'}
          aria-label={ui.ribbonCollapsed ? 'Pin the ribbon' : 'Collapse the ribbon'}
          aria-expanded={!ui.ribbonCollapsed}
          type="button"
        >
          {ui.ribbonCollapsed ? <ChevronDown size={14} strokeWidth={2.2} /> : <ChevronUp size={14} strokeWidth={2.2} />}
        </button>
      </div>

      {!ui.ribbonCollapsed && (
        <div className="ribbon-content">
          {activeTab === 'Home' && <HomeTab engine={engine} />}
          {activeTab === 'Insert' && <InsertTab engine={engine} />}
          {activeTab === 'Draw' && <DrawTab />}
          {activeTab === 'Design' && <DesignTab engine={engine} />}
          {activeTab === 'Layout' && <LayoutTab engine={engine} />}
          {activeTab === 'References' && <ReferencesTab engine={engine} />}
          {activeTab === 'Mailings' && <MailingsTab />}
          {activeTab === 'Review' && <ReviewTab engine={engine} />}
          {activeTab === 'View' && <ViewTab />}
          {activeTab === 'Developer' && <DeveloperTab />}
          {activeTab === 'Help' && <HelpTab />}
        </div>
      )}
    </div>
  );
};

type Engine = ReturnType<typeof useDocumentEngine>;

/* ─── Markdown helpers shared by Developer tab ────────────────────────────── */

function insertMarkdownBlocks(engine: Engine, md: string): void {
  const blocks = parseMarkdown(md);
  for (const b of blocks) {
    switch (b.kind) {
      case 'heading':
        engine.insertText(b.text);
        engine.applyStyle(`Heading${Math.min(3, b.level ?? 1)}`);
        engine.insertParagraph();
        break;
      case 'bullet':
        engine.insertText(b.text);
        engine.setBulletList();
        engine.insertParagraph();
        break;
      case 'numbered':
        engine.insertText(b.text);
        engine.setNumberedList();
        engine.insertParagraph();
        break;
      case 'code':
        engine.insertText(b.text);
        engine.setFontFamily('Consolas');
        engine.insertParagraph();
        break;
      case 'table':
        if (b.rows?.length) engine.insertTableWithData(b.rows);
        break;
      case 'quote':
        engine.insertText(b.text);
        engine.applyStyle('Quote');
        engine.insertParagraph();
        break;
      case 'hr':
        engine.insertHorizontalRule();
        break;
      default:
        engine.insertText(b.text);
        engine.insertParagraph();
    }
  }
}

function exportMarkdownFromDoc(doc: QuillDocument): string {
  return exportMarkdown(doc);
}

/* ─── Helpers shared across tabs ─────────────────────────────────────────── */

const insertPicture = (engine: Engine) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW = 500;
        const scale = img.width > maxW ? maxW / img.width : 1;
        engine.insertImage(src, file.name, img.width * scale, img.height * scale);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };
  input.click();
};

const pasteFromClipboard = async (engine: Engine) => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) engine.insertText(text);
  } catch {
    /* clipboard permission denied — ignore */
  }
};

/* ─── Home ────────────────────────────────────────────────────────────────── */

const HomeTab: React.FC<{ engine: Engine }> = ({ engine }) => {
  const ui = useUI();
  const fmt = engine.activeFormatting;

  // Current paragraph style + alignment for gallery/button highlight
  let currentStyle = 'Normal';
  let alignment: Alignment = 'left';
  for (const section of engine.document?.sections ?? []) {
    const block = section.blocks.find((b) => b.id === engine.cursorPosition.blockId);
    if (block && block.type === 'paragraph') {
      const para = block as Paragraph;
      currentStyle = para.style ?? 'Normal';
      alignment = para.formatting?.alignment ?? 'left';
      break;
    }
  }

  const galleryStyles = engine.styles.filter(
    (s) => s.isBuiltIn && s.isVisible && ['Normal', 'Heading1', 'Heading2', 'Heading3', 'Title', 'Subtitle', 'Quote'].includes(s.name),
  );

  return (
    <div className="ribbon-groups">
      {/* Clipboard */}
      <RibbonGroup label="Clipboard">
        <RBRow>
          <RibBigButton
            icon={<ClipboardPaste size={22} strokeWidth={1.7} />}
            label="Paste"
            onClick={() => void pasteFromClipboard(engine)}
            title="Paste (Ctrl+V)"
          />
        </RBRow>
        <RBRow className="rb-col">
          <RibListButton icon={<Scissors size={15} strokeWidth={1.8} />} label="Cut" shortcut="Ctrl+X" onClick={() => { navigator.clipboard?.writeText(engine.getSelectedText()); engine.deleteBackward(); }} />
          <RibListButton icon={<Copy size={15} strokeWidth={1.8} />} label="Copy" shortcut="Ctrl+C" onClick={() => navigator.clipboard?.writeText(engine.getSelectedText())} />
          <RibListButton
            icon={<Paintbrush size={15} strokeWidth={1.8} />}
            label="Format Painter"
            onClick={() => engine.startFormatPainter()}
            disabled={engine.isFormatPainterActive}
          />
        </RBRow>
      </RibbonGroup>

      {/* Font */}
      <RibbonGroup label="Font">
        <RBRow>
          <RibCombo
            value={fmt.fontFamily || 'Calibri'}
            options={FONTS.map((f) => ({ value: f, label: f }))}
            onChange={(v) => engine.setFontFamily(v)}
            width={148}
            title="Font"
            renderValue={<span className="rib-combo-value" style={{ fontFamily: fmt.fontFamily || 'Calibri' }}>{fmt.fontFamily || 'Calibri (Body)'}</span>}
          />
          <RibCombo
            value={fmt.fontSize || 11}
            options={SIZES.map((s) => ({ value: s, label: String(s) }))}
            onChange={(v) => engine.setFontSize(Number(v))}
            width={58}
            title="Font Size"
          />
          <RibButton icon={<AArrowUp size={16} strokeWidth={1.8} />} onClick={() => engine.setFontSize(Math.min(72, (fmt.fontSize || 11) + 2))} title="Increase Font Size" />
          <RibButton icon={<AArrowDown size={16} strokeWidth={1.8} />} onClick={() => engine.setFontSize(Math.max(8, (fmt.fontSize || 11) - 2))} title="Decrease Font Size" />
          <RibDropdown
            trigger={<RibButton icon={<CaseSensitive size={16} strokeWidth={1.8} />} title="Change Case" />}
            width={190}
          >
            {(close) => (
              <>
                <MenuItemRow label="Sentence case." onClick={() => { engine.changeCase('sentenceCase'); close(); }} />
                <MenuItemRow label="lowercase" onClick={() => { engine.changeCase('lowerCase'); close(); }} />
                <MenuItemRow label="UPPERCASE" onClick={() => { engine.changeCase('upperCase'); close(); }} />
                <MenuItemRow label="Capitalize Each Word" onClick={() => { engine.changeCase('capitalizeEachWord'); close(); }} />
                <MenuItemRow label="tOGGLE cASE" onClick={() => { engine.changeCase('tOGGLEcASE'); close(); }} />
              </>
            )}
          </RibDropdown>
        </RBRow>
        <RBRow>
          <RibButton icon={<Bold size={15} strokeWidth={2.4} />} active={!!fmt.bold} shortcut="Ctrl+B" onClick={() => engine.toggleBold()} title="Bold" />
          <RibButton icon={<Italic size={15} strokeWidth={2.1} />} active={!!fmt.italic} shortcut="Ctrl+I" onClick={() => engine.toggleItalic()} title="Italic" />
          <RibButton icon={<Underline size={15} strokeWidth={2.1} />} active={!!fmt.underline} shortcut="Ctrl+U" onClick={() => engine.toggleUnderline()} title="Underline" />
          <RibButton icon={<Strikethrough size={15} strokeWidth={2.1} />} active={!!fmt.strikethrough} onClick={() => engine.toggleStrikethrough()} title="Strikethrough" />
          <RibButton icon={<Subscript size={15} strokeWidth={2.1} />} active={!!fmt.subscript} onClick={() => engine.toggleSubscript()} title="Subscript" />
          <RibButton icon={<Superscript size={15} strokeWidth={2.1} />} active={!!fmt.superscript} onClick={() => engine.toggleSuperscript()} title="Superscript" />
          <RBSep />
          <RibDropdown
            width={210}
            trigger={
              <span className="font-color-btn" title="Font Color">
                <Baseline size={15} strokeWidth={2.1} />
                <span className="color-bar" style={{ background: fmt.color || '#c00000' }} />
              </span>
            }
          >
            {(close) => (
              <ColorPalette
                allowAutomatic
                onPick={(c) => { engine.setTextColor(c || '#17191c'); close(); }}
              />
            )}
          </RibDropdown>
          <RibDropdown
            width={210}
            trigger={
              <span className="font-color-btn" title="Text Highlight Color">
                <Highlighter size={15} strokeWidth={2.1} />
                <span className="color-bar" style={{ background: fmt.highlight || '#ffe066' }} />
              </span>
            }
          >
            {(close) => (
              <ColorPalette
                allowAutomatic
                automaticLabel="No Color"
                onPick={(c) => { engine.setHighlight(c || 'transparent'); close(); }}
              />
            )}
          </RibDropdown>
          <RBSep />
          <RibButton icon={<RemoveFormatting size={15} strokeWidth={1.9} />} onClick={() => engine.clearFormatting()} title="Clear All Formatting" />
        </RBRow>
      </RibbonGroup>

      {/* Paragraph */}
      <RibbonGroup label="Paragraph">
        <RBRow>
          <RibDropdown
            trigger={<RibButton icon={<List size={16} strokeWidth={1.9} />} caret title="Bullets" />}
            width={180}
          >
            {(close) => (
              <>
                <MenuItemRow icon={<List size={15} strokeWidth={1.9} />} label="Bullet List" onClick={() => { engine.setBulletList(); close(); }} />
                <MenuItemRow icon={<ListOrdered size={15} strokeWidth={1.9} />} label="Numbered List" onClick={() => { engine.setNumberedList(); close(); }} />
                <MenuItemRow icon={<ListTree size={15} strokeWidth={1.9} />} label="Multilevel List" onClick={() => { engine.setMultilevelList(); close(); }} />
                <div className="rib-menu-sep" />
                <MenuItemRow icon={<IndentIncrease size={15} strokeWidth={1.9} />} label="Increase Level" onClick={() => { engine.increaseListLevel(); close(); }} />
                <MenuItemRow icon={<IndentDecrease size={15} strokeWidth={1.9} />} label="Decrease Level" onClick={() => { engine.decreaseListLevel(); close(); }} />
              </>
            )}
          </RibDropdown>
          <RibButton icon={<ListOrdered size={16} strokeWidth={1.9} />} onClick={() => engine.setNumberedList()} title="Numbering" />
          <RibButton icon={<ListTree size={16} strokeWidth={1.9} />} onClick={() => engine.setMultilevelList()} title="Multilevel List" />
          <RBSep />
          <RibButton icon={<IndentDecrease size={16} strokeWidth={1.9} />} onClick={() => engine.decreaseListLevel()} title="Decrease Indent" />
          <RibButton icon={<IndentIncrease size={16} strokeWidth={1.9} />} onClick={() => engine.increaseListLevel()} title="Increase Indent" />
        </RBRow>
        <RBRow>
          <RibButton icon={<AlignLeft size={16} strokeWidth={1.9} />} active={alignment === 'left'} onClick={() => engine.setAlignment('left')} title="Align Left (Ctrl+L)" />
          <RibButton icon={<AlignCenter size={16} strokeWidth={1.9} />} active={alignment === 'center'} onClick={() => engine.setAlignment('center')} title="Center (Ctrl+E)" />
          <RibButton icon={<AlignRight size={16} strokeWidth={1.9} />} active={alignment === 'right'} onClick={() => engine.setAlignment('right')} title="Align Right (Ctrl+R)" />
          <RibButton icon={<AlignJustify size={16} strokeWidth={1.9} />} active={alignment === 'justify'} onClick={() => engine.setAlignment('justify')} title="Justify (Ctrl+J)" />
          <RBSep />
          <RibDropdown
            trigger={<RibButton icon={<BetweenHorizontalStart size={16} strokeWidth={1.8} />} caret title="Line & Paragraph Spacing" />}
            width={180}
          >
            {(close) => (
              <>
                {[1.0, 1.15, 1.5, 2.0, 3.0].map((v) => (
                  <MenuItemRow
                    key={v}
                    label={v === 1 ? 'Single' : v === 1.15 ? '1.15' : v === 1.5 ? '1.5' : v === 2 ? 'Double' : 'Triple'}
                    onClick={() => { engine.setLineSpacing(v); close(); }}
                  />
                ))}
              </>
            )}
          </RibDropdown>
          <RibDropdown
            width={210}
            trigger={<RibButton icon={<PaintBucket size={16} strokeWidth={1.8} />} caret title="Shading" />}
          >
            {(close) => (
              <ColorPalette
                allowAutomatic
                automaticLabel="No Color"
                onPick={(c) => { engine.setParagraphShading(c || 'auto'); close(); }}
              />
            )}
          </RibDropdown>
          <RibDropdown
            trigger={<RibButton icon={<Grid2x2 size={16} strokeWidth={1.8} />} caret title="Borders" />}
            width={190}
          >
            {(close) => (
              <>
                <MenuItemRow label="No Border" onClick={() => { engine.setParagraphBorders({}); close(); }} />
                <MenuItemRow label="Bottom Border" onClick={() => { engine.setParagraphBorders({ bottom: { style: 'single', size: 4, color: '#000000', space: 1 } }); close(); }} />
                <MenuItemRow label="Thick Bottom" onClick={() => { engine.setParagraphBorders({ bottom: { style: 'thick', size: 8, color: '#000000', space: 1 } }); close(); }} />
                <MenuItemRow label="Dashed" onClick={() => { engine.setParagraphBorders({ bottom: { style: 'dashed', size: 4, color: '#000000', space: 1 } }); close(); }} />
                <MenuItemRow label="Dotted" onClick={() => { engine.setParagraphBorders({ bottom: { style: 'dotted', size: 4, color: '#000000', space: 1 } }); close(); }} />
                <MenuItemRow label="Double" onClick={() => { engine.setParagraphBorders({ bottom: { style: 'double', size: 4, color: '#000000', space: 1 } }); close(); }} />
              </>
            )}
          </RibDropdown>
        </RBRow>
      </RibbonGroup>

      {/* Styles */}
      <RibbonGroup label="Styles" grow>
        <div className="style-gallery-wrap">
          <div className="style-gallery">
            {galleryStyles.map((style) => (
              <button
                key={style.id}
                className={`style-card${currentStyle === style.name ? ' active' : ''}`}
                onClick={() => engine.applyStyle(style.name)}
                title={`Apply ${style.displayName}`}
                type="button"
              >
                <span
                  className="style-card-text"
                  style={{
                    fontFamily: style.runFormatting.fontFamily || 'Calibri',
                    fontSize: Math.min(style.runFormatting.fontSize || 11, 15),
                    fontWeight: style.runFormatting.bold ? 700 : 400,
                    fontStyle: style.runFormatting.italic ? 'italic' : 'normal',
                    color: style.runFormatting.color || 'var(--text-primary)',
                  }}
                >
                  {style.displayName}
                </span>
              </button>
            ))}
          </div>
          <RibDropdown
            width={210}
            align="right"
            trigger={
              <button className="style-gallery-more" title="More styles" aria-label="More styles" type="button">
                <ChevronDown size={14} strokeWidth={2.2} />
              </button>
            }
          >
            {(close) => (
              <>
                {engine.styles.filter((s) => s.isBuiltIn && s.isVisible).map((style) => (
                  <MenuItemRow
                    key={style.id}
                    label={style.displayName}
                    selected={currentStyle === style.name}
                    onClick={() => { engine.applyStyle(style.name); close(); }}
                  />
                ))}
              </>
            )}
          </RibDropdown>
        </div>
      </RibbonGroup>

      {/* Editing */}
      <RibbonGroup label="Editing">
        <RBRow className="rb-col">
          <RibListButton icon={<Search size={15} strokeWidth={1.9} />} label="Find" shortcut="Ctrl+F" onClick={() => ui.openDialog('find')} />
          <RibListButton icon={<Replace size={15} strokeWidth={1.9} />} label="Replace" shortcut="Ctrl+H" onClick={() => ui.openDialog('replace')} />
          <RibDropdown
            width={180}
            trigger={
              <span className="rib-dd-full">
                <RibListButton icon={<TextSelect size={15} strokeWidth={1.9} />} label="Select" caret />
              </span>
            }
          >
            {(close) => (
              <>
                <MenuItemRow icon={<TextSelect size={15} strokeWidth={1.9} />} label="Select All" shortcut="Ctrl+A" onClick={() => { engine.selectAll(); close(); }} />
                <MenuItemRow icon={<Type size={15} strokeWidth={1.9} />} label="Select Object" disabled />
              </>
            )}
          </RibDropdown>
        </RBRow>
      </RibbonGroup>
    </div>
  );
};

/* ─── Insert ──────────────────────────────────────────────────────────────── */

const InsertTab: React.FC<{ engine: Engine }> = ({ engine }) => (
  <div className="ribbon-groups">
    <RibbonGroup label="Pages">
      <RBRow className="rb-col">
        <RibListButton icon={<FilePlus2 size={16} strokeWidth={1.8} />} label="Blank Page" onClick={() => engine.insertPageBreak()} />
        <RibListButton icon={<File size={16} strokeWidth={1.8} />} label="Page Break" shortcut="Ctrl+Enter" onClick={() => engine.insertPageBreak()} />
      </RBRow>
    </RibbonGroup>

    <RibbonGroup label="Tables">
      <RBRow>
        <TableGridButton engine={engine} />
      </RBRow>
    </RibbonGroup>

    <RibbonGroup label="Illustrations">
      <RBRow className="rb-col">
        <RibListButton icon={<ImageIcon size={16} strokeWidth={1.8} />} label="Pictures" onClick={() => insertPicture(engine)} />
        <RibDropdown
          width={252}
          trigger={<span className="rib-dd-full"><RibListButton icon={<Shapes size={16} strokeWidth={1.8} />} label="Shapes" caret /></span>}
        >
          {(close) => (
            <div className="shapes-grid">
              {SHAPES.map((s) => (
                <button
                  key={s.type}
                  className="shape-option"
                  onClick={() => { engine.insertShape(s.type); close(); }}
                  title={s.label}
                  aria-label={s.label}
                  type="button"
                >
                  <ShapeIcon type={s.type} />
                </button>
              ))}
            </div>
          )}
        </RibDropdown>
        <RibDropdown
          width={180}
          trigger={<span className="rib-dd-full"><RibListButton icon={<ChartColumnBig size={16} strokeWidth={1.8} />} label="Chart" caret /></span>}
        >
          {(close) => (
            <>
              {CHART_TYPES.map((c) => (
                <MenuItemRow key={c.type} label={c.label} onClick={() => { engine.insertChart(c.type); close(); }} />
              ))}
            </>
          )}
        </RibDropdown>
      </RBRow>
    </RibbonGroup>

    <RibbonGroup label="Text">
      <RBRow className="rb-col">
        <RibListButton icon={<SquareText size={16} strokeWidth={1.8} />} label="Text Box" onClick={() => engine.insertShape('roundedRectangle')} />
        <RibListButton icon={<Heading1 size={16} strokeWidth={1.8} />} label="Header" onClick={() => {
          const text = prompt('Header text:');
          if (text) engine.setHeader(text);
        }} />
        <RibListButton icon={<Footprints size={16} strokeWidth={1.8} />} label="Footer" onClick={() => {
          const text = prompt('Footer text:');
          if (text) engine.setFooter(text);
        }} />
        <RibListButton icon={<Hash size={16} strokeWidth={1.8} />} label="Page Number" onClick={() => {
          const pos = prompt('Page numbers appear in the header. Header text:', 'Page 1');
          if (pos) engine.setHeader(pos);
        }} />
      </RBRow>
    </RibbonGroup>

    <RibbonGroup label="Symbols">
      <RBRow className="rb-col">
        <RibListButton icon={<SquareRadical size={16} strokeWidth={1.8} />} label="Equation" onClick={() => {
          const latex = prompt('Enter equation (LaTeX):', 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');
          if (latex) engine.insertEquation(latex);
        }} />
        <SymbolButton />
      </RBRow>
    </RibbonGroup>

    <RibbonGroup label="Links">
      <RBRow className="rb-col">
        <RibListButton icon={<Link2 size={16} strokeWidth={1.8} />} label="Hyperlink" shortcut="Ctrl+K" onClick={() => {
          const url = prompt('URL:', 'https://');
          if (url) engine.insertHyperlink(url);
        }} />
        <RibListButton icon={<Bookmark size={16} strokeWidth={1.8} />} label="Bookmark" onClick={() => {
          const name = prompt('Bookmark name:');
          if (name) engine.insertBookmark(name);
        }} />
      </RBRow>
    </RibbonGroup>
  </div>
);

const TableGridButton: React.FC<{ engine: Engine }> = () => {
  const ui = useUI();
  return <RibListButton icon={<Table size={16} strokeWidth={1.8} />} label="Table" onClick={() => ui.openDialog('tableGrid')} />;
};

const SymbolButton: React.FC = () => {
  const ui = useUI();
  return <RibListButton icon={<Omega size={16} strokeWidth={1.8} />} label="Symbol" onClick={() => ui.openDialog('symbolPicker')} />;
};

/* ─── Design ──────────────────────────────────────────────────────────────── */

const DesignTab: React.FC<{ engine: Engine }> = ({ engine }) => (
  <div className="ribbon-groups">
    <RibbonGroup label="Document Formatting" grow>
      <div className="style-gallery">
        {engine.styles.filter((s) => s.isBuiltIn && s.type === 'paragraph' && s.isVisible).slice(0, 8).map((style) => (
          <button
            key={style.id}
            className="style-card"
            onClick={() => engine.applyStyle(style.name)}
            title={`Apply ${style.displayName}`}
            type="button"
          >
            <span
              className="style-card-text"
              style={{
                fontFamily: style.runFormatting.fontFamily || 'Calibri',
                fontSize: Math.min(style.runFormatting.fontSize || 11, 15),
                fontWeight: style.runFormatting.bold ? 700 : 400,
                color: style.runFormatting.color || 'var(--text-primary)',
              }}
            >
              {style.displayName}
            </span>
          </button>
        ))}
      </div>
    </RibbonGroup>
    <RibbonGroup label="Page Background">
      <RBRow className="rb-col">
        <RibListButton icon={<Droplets size={16} strokeWidth={1.8} />} label="Watermark" onClick={() => {
          const text = prompt('Watermark text:', 'CONFIDENTIAL');
          if (text) engine.setTextWatermark(text);
        }} />
        <RibDropdown
          width={210}
          trigger={<span className="rib-dd-full"><RibListButton icon={<PaintBucket size={16} strokeWidth={1.8} />} label="Page Color" caret /></span>}
        >
          {(close) => (
            <ColorPalette onPick={(c) => { engine.setParagraphShading(c); close(); }} />
          )}
        </RibDropdown>
      </RBRow>
    </RibbonGroup>
  </div>
);

/* ─── Layout ──────────────────────────────────────────────────────────────── */

const LayoutTab: React.FC<{ engine: Engine }> = ({ engine }) => {
  const ui = useUI();
  return (
    <div className="ribbon-groups">
      <RibbonGroup label="Page Setup">
        <RBRow className="rb-col">
          <RibListButton icon={<RulerIcon size={16} strokeWidth={1.8} />} label="Margins" onClick={() => ui.openDialog('pageSetup')} />
          <RibDropdown
            trigger={<RibButton icon={<RectangleVertical size={16} strokeWidth={1.8} />} caret title="Orientation" />}
            width={170}
          >
            {(close) => (
              <>
                <MenuItemRow
                  icon={<RectangleVertical size={15} strokeWidth={1.8} />}
                  label="Portrait"
                  selected={engine.pageSetup.orientation === 'portrait'}
                  onClick={() => { engine.setOrientation('portrait'); close(); }}
                />
                <MenuItemRow
                  icon={<RectangleHorizontal size={15} strokeWidth={1.8} />}
                  label="Landscape"
                  selected={engine.pageSetup.orientation === 'landscape'}
                  onClick={() => { engine.setOrientation('landscape'); close(); }}
                />
              </>
            )}
          </RibDropdown>
          <RibDropdown
            trigger={<RibButton icon={<File size={16} strokeWidth={1.8} />} caret title="Size" />}
            width={160}
          >
            {(close) => (
              <>
                {PAGE_SIZES.map((s) => (
                  <MenuItemRow
                    key={s.value}
                    label={s.label}
                    selected={engine.pageSetup.pageSize === s.value}
                    onClick={() => { engine.setPageSize(s.value); close(); }}
                  />
                ))}
              </>
            )}
          </RibDropdown>
          <RibDropdown
            trigger={<RibButton icon={<Columns3 size={16} strokeWidth={1.8} />} caret title="Columns" />}
            width={160}
          >
            {(close) => (
              <>
                {[1, 2, 3].map((c) => (
                  <MenuItemRow
                    key={c}
                    label={c === 1 ? 'One' : c === 2 ? 'Two' : 'Three'}
                    selected={engine.pageSetup.columns === c}
                    onClick={() => { engine.setColumns(c); close(); }}
                  />
                ))}
              </>
            )}
          </RibDropdown>
          <RibListButton icon={<SquareSplitVertical size={16} strokeWidth={1.8} />} label="Breaks" onClick={() => engine.insertSectionBreak()} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="Paragraph">
        <RBRow className="rb-col">
          <RibListButton icon={<IndentIncrease size={16} strokeWidth={1.8} />} label="Increase Indent" onClick={() => engine.setLeftIndent(engine.pageSetup.pageMargins.left + 720)} />
          <RibListButton icon={<IndentDecrease size={16} strokeWidth={1.8} />} label="Decrease Indent" onClick={() => engine.setLeftIndent(Math.max(0, engine.pageSetup.pageMargins.left - 720))} />
        </RBRow>
      </RibbonGroup>
    </div>
  );
};

/* ─── References ──────────────────────────────────────────────────────────── */

const ReferencesTab: React.FC<{ engine: Engine }> = ({ engine }) => (
  <div className="ribbon-groups">
    <RibbonGroup label="Table of Contents">
      <RBRow>
        <RibListButton icon={<ListTree size={16} strokeWidth={1.8} />} label="Table of Contents" onClick={() => engine.insertTableOfContents()} />
      </RBRow>
    </RibbonGroup>
    <RibbonGroup label="Footnotes">
      <RBRow className="rb-col">
        <RibListButton icon={<Footprints size={16} strokeWidth={1.8} />} label="Insert Footnote" onClick={() => {
          const text = prompt('Footnote text:');
          if (text) engine.insertFootnote(text);
        }} />
        <RibListButton icon={<BookOpenCheck size={16} strokeWidth={1.8} />} label="Insert Endnote" onClick={() => {
          const text = prompt('Endnote text:');
          if (text) engine.insertEndnote(text);
        }} />
      </RBRow>
    </RibbonGroup>
    <RibbonGroup label="Research">
      <RBRow>
        <RibListButton icon={<MailPlus size={16} strokeWidth={1.8} />} label="Citations" disabled title="Coming in a future update" />
      </RBRow>
    </RibbonGroup>
  </div>
);

/* ─── Review ──────────────────────────────────────────────────────────────── */

const ReviewTab: React.FC<{ engine: Engine }> = ({ engine }) => {
  const ui = useUI();
  return (
    <div className="ribbon-groups">
      <RibbonGroup label="Proofing">
        <RBRow className="rb-col">
          <RibListButton icon={<SpellCheckIcon />} label="Word Count" onClick={() => ui.openDialog('wordCount')} />
          <RibListButton icon={<CaseSensitive size={16} strokeWidth={1.8} />} label="AutoCorrect" onClick={() => ui.openDialog('autoCorrect')} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="Comments">
        <RBRow className="rb-col">
          <RibListButton icon={<MessageSquarePlus size={16} strokeWidth={1.8} />} label="New Comment" onClick={() => {
            const text = prompt('Add a comment:');
            if (text) engine.addComment(text);
          }} />
          <RibListButton icon={<MessagesSquare size={16} strokeWidth={1.8} />} label="Comments Pane" onClick={() => ui.toggleRightPanel('comments')} />
          <RibListButton icon={<CheckCheck size={16} strokeWidth={1.8} />} label="Resolve Last" onClick={() => {
            const last = engine.comments[engine.comments.length - 1];
            if (last) engine.resolveComment(last.id);
          }} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="Tracking">
        <RBRow className="rb-col">
          <RibListButton
            icon={<CircleDot size={16} strokeWidth={1.8} />}
            label={engine.document?.trackChanges.enabled ? 'Tracking On' : 'Track Changes'}
            active={engine.document?.trackChanges.enabled}
            onClick={() => engine.toggleTrackChanges()}
          />
          <RibListButton icon={<Check size={16} strokeWidth={2} />} label="Accept All" onClick={() => engine.acceptAllChanges()} />
          <RibListButton icon={<X size={16} strokeWidth={2} />} label="Reject All" onClick={() => engine.rejectAllChanges()} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="History">
        <RBRow className="rb-col">
          <RibListButton icon={<Undo2 size={16} strokeWidth={1.8} />} label="Undo" shortcut="Ctrl+Z" onClick={() => engine.undo()} disabled={!engine.canUndo} />
          <RibListButton icon={<Redo2 size={16} strokeWidth={1.8} />} label="Redo" shortcut="Ctrl+Y" onClick={() => engine.redo()} disabled={!engine.canRedo} />
        </RBRow>
      </RibbonGroup>
    </div>
  );
};

const SpellCheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l4-10 4 10" />
    <path d="M5 13h4" />
    <path d="M13 7l6 10" opacity="0" />
    <path d="M14 16c1 1.2 2.4 2 4 2 2 0 3.5-1.2 3.5-2.8 0-3.4-7-2-7-5.4C14.5 8.3 15.8 7 17.7 7c1.5 0 2.7.6 3.5 1.6" />
  </svg>
);

/* ─── View ────────────────────────────────────────────────────────────────── */

const ViewTab: React.FC = () => {
  const ui = useUI();

  const fitWidth = () => {
    const wrapper = document.querySelector('.document-canvas-wrapper');
    if (!wrapper) return;
    const available = wrapper.clientWidth - 72;
    const target = Math.round((available / 794) * 100 / 5) * 5;
    ui.setZoom(Math.min(200, Math.max(50, target)));
  };

  return (
    <div className="ribbon-groups">
      <RibbonGroup label="Views">
        <RBRow className="rb-col">
          <RibListButton icon={<FileText size={16} strokeWidth={1.8} />} label="Print Layout" active />
          <RibListButton icon={<Target size={16} strokeWidth={1.8} />} label="Focus Mode" active={ui.focusMode} onClick={() => ui.setFocusMode(!ui.focusMode)} />
          <RibListButton icon={<Maximize size={16} strokeWidth={1.8} />} label="Fullscreen" shortcut="F11" onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen?.();
          }} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="Show">
        <RBRow className="rb-col">
          <RibListButton icon={<RulerIcon size={16} strokeWidth={1.8} />} label="Ruler" active={ui.showRuler} onClick={() => ui.toggleRuler()} />
          <RibListButton icon={<PanelLeft size={16} strokeWidth={1.8} />} label="Navigation Pane" active={ui.navView !== null} onClick={() => ui.toggleNavView('outline')} />
          <RibListButton icon={<Sparkles size={16} strokeWidth={1.8} />} label="AI Assistant" active={ui.rightPanel === 'ai'} onClick={() => ui.toggleRightPanel('ai')} />
          <RibListButton icon={<LayoutTemplate size={16} strokeWidth={1.8} />} label="Properties" active={ui.rightPanel === 'properties'} onClick={() => ui.toggleRightPanel('properties')} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="Intelligence">
        <RBRow className="rb-col">
          <RibListButton icon={<Stethoscope size={16} strokeWidth={1.8} />} label="Document Health" active={ui.rightPanel === 'health'} onClick={() => ui.toggleRightPanel('health')} />
          <RibListButton icon={<Brush size={16} strokeWidth={1.8} />} label="Clean Up Document" onClick={() => ui.openDialog('cleanup')} />
          <RibListButton icon={<FlaskConical size={16} strokeWidth={1.8} />} label="Run Document Test" onClick={() => ui.openDialog('documentTest')} />
          <RibListButton icon={<BarChart3 size={16} strokeWidth={1.8} />} label="Analytics" onClick={() => ui.openDialog('analytics')} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="History">
        <RBRow className="rb-col">
          <RibListButton icon={<History size={16} strokeWidth={1.8} />} label="Document Timeline" onClick={() => ui.openDialog('timeline')} />
          <RibListButton icon={<GitCompare size={16} strokeWidth={1.8} />} label="Compare Versions" onClick={() => ui.openDialog('diff')} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="Zoom">
        <RBRow className="rb-col">
          <RibListButton icon={<Maximize size={16} strokeWidth={1.8} />} label="Fit Width" onClick={fitWidth} />
          <RibListButton icon={<Search size={16} strokeWidth={1.8} />} label="100%" active={ui.zoom === 100} onClick={() => ui.setZoom(100)} />
          <RibListButton icon={<Search size={16} strokeWidth={1.8} />} label="150%" active={ui.zoom === 150} onClick={() => ui.setZoom(150)} />
        </RBRow>
      </RibbonGroup>
    </div>
  );
};

/* ─── Draw ────────────────────────────────────────────────────────────────── */

const DrawTab: React.FC = () => {
  const ui = useUI();

  const tools = [
    { icon: <PenLine size={16} strokeWidth={1.8} />, label: 'Pen', hint: 'Freehand ink pen' },
    { icon: <Pencil size={16} strokeWidth={1.8} />, label: 'Pencil', hint: 'Textured pencil strokes' },
    { icon: <Highlighter size={16} strokeWidth={1.8} />, label: 'Highlighter', hint: 'Thick translucent strokes' },
    { icon: <Eraser size={16} strokeWidth={1.8} />, label: 'Eraser', hint: 'Remove ink strokes' },
    { icon: <Lasso size={16} strokeWidth={1.8} />, label: 'Lasso Select', hint: 'Select ink objects' },
  ];

  return (
    <div className="ribbon-groups">
      <RibbonGroup label="Tools">
        <div className="draw-tools-row">
          {tools.map((t) => (
            <button
              key={t.label}
              className="draw-tool"
              onClick={() => ui.setFocusMode(true)}
              title={`${t.hint} — opens Focus Mode`}
              type="button"
            >
              <span className="draw-tool-icon">{t.icon}</span>
              <span className="draw-tool-label">{t.label}</span>
            </button>
          ))}
        </div>
      </RibbonGroup>
      <RibbonGroup label="Ink Canvas">
        <RBRow>
          <RibListButton
            icon={<Maximize size={16} strokeWidth={1.8} />}
            label="Distraction-free canvas"
            onClick={() => ui.setFocusMode(true)}
          />
        </RBRow>
      </RibbonGroup>
      <div className="ai-ribbon-note">
        <Sparkles size={13} strokeWidth={2} />
        Inking is on the roadmap — Focus Mode gives a clean writing surface today.
      </div>
    </div>
  );
};

/* ─── Mailings ────────────────────────────────────────────────────────────── */

const MailingsTab: React.FC = () => (
  <div className="ribbon-groups">
    <RibbonGroup label="Create">
      <RBRow className="rb-col">
        <RibListButton icon={<Mail size={16} strokeWidth={1.8} />} label="Envelopes" disabled title="Coming in a future update" />
        <RibListButton icon={<Tag size={16} strokeWidth={1.8} />} label="Labels" disabled title="Coming in a future update" />
      </RBRow>
    </RibbonGroup>

    <RibbonGroup label="Start Mail Merge">
      <RBRow className="rb-col">
        <RibDropdown
          width={200}
          trigger={<span className="rib-dd-full"><RibListButton icon={<Database size={16} strokeWidth={1.8} />} label="Start Mail Merge" caret /></span>}
        >
          {(close) => (
            <>
              <MenuItemRow label="Letters" onClick={close} />
              <MenuItemRow label="E-mail Messages" onClick={close} />
              <MenuItemRow label="Directory" onClick={close} />
              <div className="rib-menu-sep" />
              <MenuItemRow label="Step-by-Step Wizard…" disabled />
            </>
          )}
        </RibDropdown>
        <RibListButton icon={<Users size={16} strokeWidth={1.8} />} label="Select Recipients" disabled title="Coming in a future update" />
      </RBRow>
    </RibbonGroup>

    <RibbonGroup label="Write & Insert Fields">
      <RBRow className="rb-col">
        <RibListButton icon={<SquareText size={16} strokeWidth={1.8} />} label="Address Block" disabled title="Coming in a future update" />
        <RibListButton icon={<Reply size={16} strokeWidth={1.8} />} label="Greeting Line" disabled title="Coming in a future update" />
        <RibListButton icon={<Type size={16} strokeWidth={1.8} />} label="Insert Merge Field" disabled title="Coming in a future update" />
      </RBRow>
    </RibbonGroup>

    <RibbonGroup label="Finish">
      <RBRow>
        <RibListButton icon={<Send size={16} strokeWidth={1.8} />} label="Finish & Merge" disabled title="Coming in a future update" />
      </RBRow>
    </RibbonGroup>
  </div>
);

/* ─── Developer ───────────────────────────────────────────────────────────── */

const DeveloperTab: React.FC = () => {
  const ui = useUI();
  const engine = useDocumentEngine();
  const { toast } = useToast();

  const exportMarkdown = () => {
    if (!engine.document) return;
    const md = exportMarkdownFromDoc(engine.document);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${engine.document.metadata.title || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast('success', 'Markdown exported', 'Headings, lists, tables and links were preserved.');
  };

  const updateRefs = () => {
    if (!engine.document) return;
    const changed = engine.transformDocument((doc) => {
      const r = renumberReferences(doc);
      return r.refsUpdated > 0;
    });
    if (changed) toast('success', 'References updated', 'Captions and in-text references were renumbered.');
    else toast('info', 'Nothing to update', 'No stale references found.');
  };

  return (
    <div className="ribbon-groups">
      <RibbonGroup label="Code">
        <RBRow className="rb-col">
          <RibListButton icon={<Code2 size={16} strokeWidth={1.8} />} label="Code Block" onClick={() => ui.openDialogWith('codeBlock', { tab: 'code' })} />
          <RibListButton icon={<Braces size={16} strokeWidth={1.8} />} label="JSON Tools" onClick={() => ui.openDialogWith('codeBlock', { tab: 'json' })} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="Markdown">
        <RBRow className="rb-col">
          <RibListButton icon={<FileCode2 size={16} strokeWidth={1.8} />} label="Import Markdown" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.md,.markdown,.txt';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              insertMarkdownBlocks(engine, await file.text());
              toast('success', 'Markdown imported', `“${file.name}” converted into the document.`);
            };
            input.click();
          }} />
          <RibListButton icon={<FileDown size={16} strokeWidth={1.8} />} label="Export Markdown" onClick={exportMarkdown} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="References">
        <RBRow className="rb-col">
          <RibListButton icon={<Tag size={16} strokeWidth={1.8} />} label="Insert Figure Ref" onClick={() => {
            if (!engine.document) return;
            engine.insertText(`Figure ${nextNumberFor(engine.document, 'figure')}`);
          }} />
          <RibListButton icon={<Tag size={16} strokeWidth={1.8} />} label="Insert Table Ref" onClick={() => {
            if (!engine.document) return;
            engine.insertText(`Table ${nextNumberFor(engine.document, 'table')}`);
          }} />
          <RibListButton icon={<CheckCheck size={16} strokeWidth={1.8} />} label="Update All References" onClick={updateRefs} />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="Mode">
        <RBRow>
          <RibListButton
            icon={<ShieldCheck size={16} strokeWidth={1.8} />}
            label={ui.devMode ? 'Developer Mode: On' : 'Developer Mode: Off'}
            active={ui.devMode}
            onClick={() => ui.toggleDevMode()}
          />
        </RBRow>
      </RibbonGroup>

      <RibbonGroup label="Document QA">
        <RBRow className="rb-col">
          <RibListButton icon={<FlaskConical size={16} strokeWidth={1.8} />} label="Run Document Test" onClick={() => ui.openDialog('documentTest')} />
          <RibListButton icon={<Stethoscope size={16} strokeWidth={1.8} />} label="Document Health" onClick={() => ui.toggleRightPanel('health')} />
        </RBRow>
      </RibbonGroup>
    </div>
  );
};

/* ─── Help ────────────────────────────────────────────────────────────────── */

const HelpTab: React.FC = () => {
  const ui = useUI();
  return (
    <div className="ribbon-groups">
      <RibbonGroup label="Help">
        <RBRow className="rb-col">
          <RibListButton icon={<Keyboard size={16} strokeWidth={1.8} />} label="Keyboard Shortcuts" onClick={() => ui.openDialog('settings')} />
          <RibListButton icon={<Info size={16} strokeWidth={1.8} />} label="About WORD" onClick={() => ui.openDialog('settings')} />
        </RBRow>
      </RibbonGroup>
    </div>
  );
};
