import React, { useState, useCallback } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { ShapeType } from '../../engine/DocumentEngine';
import './Ribbon.css';

type RibbonTab = 'File' | 'Home' | 'Insert' | 'Design' | 'Layout' | 'References' | 'Review' | 'View' | 'Help';

interface RibbonProps {
  onOpenFindReplace?: (mode: 'find' | 'replace') => void;
  onOpenWordCount?: () => void;
  onOpenPageSetup?: () => void;
  onOpenSymbolPicker?: () => void;
  onOpenAutoCorrect?: () => void;
  onOpenTableGrid?: () => void;
  onTogglePropertiesPanel?: () => void;
  onToggleCommentsPanel?: () => void;
  propertiesPanelVisible?: boolean;
  commentsPanelVisible?: boolean;
}

export const Ribbon: React.FC<RibbonProps> = ({
  onOpenFindReplace, onOpenWordCount, onOpenPageSetup, onOpenSymbolPicker,
  onOpenAutoCorrect, onOpenTableGrid, onTogglePropertiesPanel, onToggleCommentsPanel,
  propertiesPanelVisible, commentsPanelVisible
}) => {
  const [activeTab, setActiveTab] = useState<RibbonTab>('Home');
  const engine = useDocumentEngine();

  const tabs: RibbonTab[] = ['File', 'Home', 'Insert', 'Design', 'Layout', 'References', 'Review', 'View', 'Help'];

  const handleFileTab = useCallback(() => {
    setActiveTab('File');
  }, []);

  return (
    <div className="ribbon-container">
      <div className="ribbon-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`ribbon-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => tab === 'File' ? handleFileTab() : setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ribbon-content">
        {activeTab === 'Home' && <HomeRibbon engine={engine} onOpenFindReplace={onOpenFindReplace} />}
        {activeTab === 'Insert' && <InsertRibbon engine={engine} onOpenTableGrid={onOpenTableGrid} onOpenSymbolPicker={onOpenSymbolPicker} />}
        {activeTab === 'Design' && <DesignRibbon engine={engine} />}
        {activeTab === 'Layout' && <LayoutRibbon engine={engine} onOpenPageSetup={onOpenPageSetup} />}
        {activeTab === 'References' && <ReferencesRibbon engine={engine} />}
        {activeTab === 'Review' && <ReviewRibbon engine={engine} onOpenWordCount={onOpenWordCount} onOpenAutoCorrect={onOpenAutoCorrect} onToggleCommentsPanel={onToggleCommentsPanel} commentsPanelVisible={commentsPanelVisible} />}
        {activeTab === 'View' && <ViewRibbon engine={engine} onTogglePropertiesPanel={onTogglePropertiesPanel} propertiesPanelVisible={propertiesPanelVisible} />}
        {activeTab === 'Help' && <HelpRibbon />}
      </div>
    </div>
  );
};

// ─── Home Ribbon ─────────────────────────────────────────────────────────────
const HomeRibbon: React.FC<{
  engine: ReturnType<typeof useDocumentEngine>;
  onOpenFindReplace?: (mode: 'find' | 'replace') => void;
}> = ({ engine, onOpenFindReplace }) => {
  const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Helvetica', 'Calibri', 'Cambria', 'Garamond', 'Book Antiqua', 'Palatino', 'Trebuchet MS', 'Tahoma', 'Comic Sans MS', 'Consolas', 'Lucida Console'];
  const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

  const { activeFormatting } = engine;

  return (
    <div className="ribbon-group-container">
      {/* Clipboard Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-label">Clipboard</div>
        <div className="ribbon-buttons">
          <RibbonButton icon="✂" label="Cut" shortcut="Ctrl+X" onClick={() => { navigator.clipboard?.writeText(engine.getSelectedText()); engine.deleteBackward(); }} />
          <RibbonButton icon="📋" label="Copy" shortcut="Ctrl+C" onClick={() => navigator.clipboard?.writeText(engine.getSelectedText())} />
          <RibbonButton icon="📄" label="Paste" shortcut="Ctrl+V" onClick={() => navigator.clipboard?.readText().then(t => { if (t) engine.insertText(t); })} />
          <RibbonButton icon="🖌" label="Format Painter" onClick={() => engine.startFormatPainter()} disabled={engine.isFormatPainterActive} />
        </div>
      </div>

      {/* Font Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-label">Font</div>
        <div className="ribbon-buttons font-row">
          <select className="ribbon-select font-select" value={activeFormatting.fontFamily || 'Arial'} onChange={(e) => engine.setFontFamily(e.target.value)} title="Font Family">
            {fonts.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select className="ribbon-select size-select" value={activeFormatting.fontSize || 11} onChange={(e) => engine.setFontSize(Number(e.target.value))} title="Font Size">
            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <RibbonButton icon="A↑" label="Increase" onClick={() => engine.setFontSize(Math.min(72, (activeFormatting.fontSize || 11) + 2))} title="Increase Font Size" />
          <RibbonButton icon="A↓" label="Decrease" onClick={() => engine.setFontSize(Math.max(8, (activeFormatting.fontSize || 11) - 2))} title="Decrease Font Size" />
        </div>
        <div className="ribbon-buttons">
          <RibbonToggleButton icon="B" label="" shortcut="Ctrl+B" active={!!activeFormatting.bold} onClick={() => engine.toggleBold()} />
          <RibbonToggleButton icon="I" label="" shortcut="Ctrl+I" active={!!activeFormatting.italic} onClick={() => engine.toggleItalic()} />
          <RibbonToggleButton icon="U" label="" shortcut="Ctrl+U" active={!!activeFormatting.underline} onClick={() => engine.toggleUnderline()} />
          <RibbonToggleButton icon="S̶" label="" active={!!activeFormatting.strikethrough} onClick={() => engine.toggleStrikethrough()} />
          <RibbonToggleButton icon="X̶₂" label="" active={!!activeFormatting.subscript} onClick={() => engine.toggleSubscript()} title="Subscript" />
          <RibbonToggleButton icon="X̶²" label="" active={!!activeFormatting.superscript} onClick={() => engine.toggleSuperscript()} title="Superscript" />
          <RibbonColorButton label="A" color={activeFormatting.color || '#000000'} onChange={(c) => engine.setTextColor(c)} title="Font Color" />
          <RibbonColorButton label="ab" color={activeFormatting.highlight || '#FFFF00'} onChange={(c) => engine.setHighlight(c)} title="Highlight" />
        </div>
        <div className="ribbon-buttons">
          <RibbonButton icon="Sc" label="" onClick={() => engine.toggleSmallCaps()} title="Small Caps" />
          <RibbonButton icon="AA" label="" onClick={() => engine.toggleAllCaps()} title="All Caps" />
          <RibbonButton icon="D̶̶" label="" onClick={() => engine.toggleDoubleStrikethrough()} title="Double Strikethrough" />
          <RibbonButton icon="Ab" label="" onClick={() => engine.clearFormatting()} title="Clear All Formatting" />
        </div>
        <div className="ribbon-group-label">
          <RibbonButton icon="Aa" label="Change Case" onClick={() => {
            const cases: Array<'sentenceCase' | 'lowerCase' | 'upperCase' | 'capitalizeEachWord' | 'tOGGLEcASE'> = ['sentenceCase', 'lowerCase', 'upperCase', 'capitalizeEachWord', 'tOGGLEcASE'];
            const current = prompt('Change case: sentenceCase, lowerCase, upperCase, capitalizeEachWord, tOGGLEcASE');
            if (current && cases.includes(current as any)) engine.changeCase(current as any);
          }} />
        </div>
      </div>

      {/* Paragraph Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-label">Paragraph</div>
        <div className="ribbon-buttons">
          <RibbonToggleButton icon="•≡" label="" active={false} onClick={() => engine.setBulletList()} title="Bullets" />
          <RibbonToggleButton icon="1≡" label="" active={false} onClick={() => engine.setNumberedList()} title="Numbering" />
          <RibbonButton icon="≡≡" label="" onClick={() => engine.setMultilevelList()} title="Multilevel List" />
          <RibbonButton icon="←" label="" onClick={() => engine.decreaseListLevel()} title="Decrease Indent" />
          <RibbonButton icon="→" label="" onClick={() => engine.increaseListLevel()} title="Increase Indent" />
        </div>
        <div className="ribbon-buttons">
          <RibbonButton icon="≡" label="Left" onClick={() => engine.setAlignment('left')} title="Align Left" />
          <RibbonButton icon="≡" label="Center" onClick={() => engine.setAlignment('center')} title="Center" />
          <RibbonButton icon="≡" label="Right" onClick={() => engine.setAlignment('right')} title="Align Right" />
          <RibbonButton icon="≡" label="Justify" onClick={() => engine.setAlignment('justify')} title="Justify" />
        </div>
        <div className="ribbon-buttons">
          <RibbonButton icon="↕" label="Spacing" onClick={() => {
            const val = prompt('Line spacing (e.g., 1.0, 1.15, 1.5, 2.0):', '1.15');
            if (val) engine.setLineSpacing(parseFloat(val));
          }} title="Line Spacing" />
          <RibbonButton icon="⬛" label="Shading" onClick={() => {
            const color = prompt('Shading color (hex):', '#FFFF00');
            if (color) engine.setParagraphShading(color);
          }} title="Shading" />
          <RibbonButton icon="⊞" label="Borders" onClick={() => {
            engine.setParagraphBorders({ bottom: { style: 'single', size: 4, color: '#000000', space: 1 } });
          }} title="Borders" />
        </div>
      </div>

      {/* Styles Group */}
      <div className="ribbon-group styles-group">
        <div className="ribbon-group-label">Styles</div>
        <div className="ribbon-buttons styles-gallery">
          {engine.styles.filter(s => s.isBuiltIn && s.isVisible).slice(0, 8).map(style => (
            <button
              key={style.id}
              className="style-preview-btn"
              onClick={() => engine.applyStyle(style.name)}
              title={style.displayName}
            >
              <span style={{
                fontFamily: style.runFormatting.fontFamily || 'Calibri',
                fontSize: Math.min(style.runFormatting.fontSize || 11, 14),
                fontWeight: style.runFormatting.bold ? 'bold' : 'normal',
                fontStyle: style.runFormatting.italic ? 'italic' : 'normal',
                color: style.runFormatting.color || '#000',
                lineHeight: 1.2,
              }}>
                {style.displayName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Editing Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-label">Editing</div>
        <div className="ribbon-buttons">
          <RibbonButton icon="🔍" label="Find" shortcut="Ctrl+F" onClick={() => onOpenFindReplace?.('find')} />
          <RibbonButton icon="↔" label="Replace" shortcut="Ctrl+H" onClick={() => onOpenFindReplace?.('replace')} />
          <RibbonButton icon="🔍" label="Select" onClick={() => engine.selectAll()} />
        </div>
      </div>
    </div>
  );
};

// ─── Insert Ribbon ───────────────────────────────────────────────────────────
const InsertRibbon: React.FC<{
  engine: ReturnType<typeof useDocumentEngine>;
  onOpenTableGrid?: () => void;
  onOpenSymbolPicker?: () => void;
}> = ({ engine, onOpenTableGrid, onOpenSymbolPicker }) => {

  const [showShapes, setShowShapes] = useState(false);

  const shapes: { type: ShapeType; icon: string; label: string }[] = [
    { type: 'rectangle', icon: '▭', label: 'Rectangle' },
    { type: 'roundedRectangle', icon: '▢', label: 'Rounded Rectangle' },
    { type: 'oval', icon: '⬭', label: 'Oval' },
    { type: 'circle', icon: '○', label: 'Circle' },
    { type: 'triangle', icon: '△', label: 'Triangle' },
    { type: 'diamond', icon: '◇', label: 'Diamond' },
    { type: 'pentagon', icon: '⬠', label: 'Pentagon' },
    { type: 'hexagon', icon: '⬡', label: 'Hexagon' },
    { type: 'star5', icon: '★', label: '5-Point Star' },
    { type: 'star6', icon: '✡', label: '6-Point Star' },
    { type: 'star8', icon: '✴', label: '8-Point Star' },
    { type: 'arrow', icon: '➤', label: 'Arrow' },
    { type: 'arrowRight', icon: '→', label: 'Right Arrow' },
    { type: 'leftRightArrow', icon: '↔', label: 'Left-Right Arrow' },
    { type: 'heart', icon: '♥', label: 'Heart' },
    { type: 'lightning', icon: '⚡', label: 'Lightning Bolt' },
    { type: 'sun', icon: '☀', label: 'Sun' },
    { type: 'moon', icon: '☽', label: 'Moon' },
    { type: 'cloud', icon: '☁', label: 'Cloud' },
    { type: 'cross', icon: '✚', label: 'Cross' },
    { type: 'frame', icon: '❏', label: 'Frame' },
    { type: 'donut', icon: '◎', label: 'Donut' },
  ];

  return (
    <div className="ribbon-group-container">
      {/* Pages Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-label">Pages</div>
        <div className="ribbon-buttons">
          <RibbonButton icon="📄" label="Cover Page" onClick={() => {}} />
          <RibbonButton icon="_PAGE" label="Blank Page" onClick={() => engine.insertPageBreak()} />
          <RibbonButton icon="📦" label="Page Break" shortcut="Ctrl+Enter" onClick={() => engine.insertPageBreak()} />
        </div>
      </div>

      {/* Tables Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-label">Tables</div>
        <div className="ribbon-buttons">
          <RibbonButton icon="⊞" label="Table" onClick={onOpenTableGrid} />
        </div>
      </div>

      {/* Illustrations Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-label">Illustrations</div>
        <div className="ribbon-buttons">
          <RibbonButton icon="🖼" label="Pictures" onClick={() => {
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
          }} />
          <div className="ribbon-dropdown-wrapper">
            <RibbonButton icon="⬡" label="Shapes" onClick={() => setShowShapes(!showShapes)} />
            {showShapes && (
              <div className="ribbon-dropdown shapes-dropdown">
                <div className="shapes-grid">
                  {shapes.map(s => (
                    <button key={s.type} className="shape-option" onClick={() => { engine.insertShape(s.type); setShowShapes(false); }} title={s.label}>
                      {s.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <RibbonButton icon="📊" label="Chart" onClick={() => {
            const type = prompt('Chart type (column, bar, line, pie, area, scatter, doughnut, radar):', 'column');
            if (type) engine.insertChart(type as any);
          }} />
          <RibbonButton icon="🔷" label="SmartArt" onClick={() => {
            engine.insertSmartArt('process-continuous');
          }} />
        </div>
      </div>

      {/* Text Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-label">Text</div>
        <div className="ribbon-buttons">
          <RibbonButton icon="Tx" label="Text Box" onClick={() => engine.insertShape('rectangle')} />
          <RibbonButton icon="Aa" label="WordArt" onClick={() => engine.insertShape('rectangle')} />
          <RibbonButton icon="H" label="Header" onClick={() => {
            const text = prompt('Header text:');
            if (text) engine.setHeader(text);
          }} />
          <RibbonButton icon="F" label="Footer" onClick={() => {
            const text = prompt('Footer text:');
            if (text) engine.setFooter(text);
          }} />
          <RibbonButton icon="P#" label="Page #" onClick={() => engine.setHeader('Page 1')} />
        </div>
      </div>

      {/* Symbols Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-label">Symbols</div>
        <div className="ribbon-buttons">
          <RibbonButton icon="∑" label="Equation" onClick={() => {
            const latex = prompt('Enter equation (LaTeX):', 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');
            if (latex) engine.insertEquation(latex);
          }} />
          <RibbonButton icon="Ω" label="Symbol" onClick={onOpenSymbolPicker} />
        </div>
      </div>

      {/* Links Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-label">Links</div>
        <div className="ribbon-buttons">
          <RibbonButton icon="🔗" label="Hyperlink" shortcut="Ctrl+K" onClick={() => {
            const url = prompt('URL:', 'https://');
            if (url) engine.insertHyperlink(url);
          }} />
          <RibbonButton icon="🔖" label="Bookmark" onClick={() => {
            const name = prompt('Bookmark name:');
            if (name) engine.insertBookmark(name);
          }} />
        </div>
      </div>
    </div>
  );
};

// ─── Design Ribbon ───────────────────────────────────────────────────────────
const DesignRibbon: React.FC<{ engine: ReturnType<typeof useDocumentEngine> }> = ({ engine }) => (
  <div className="ribbon-group-container">
    <div className="ribbon-group">
      <div className="ribbon-group-label">Document Formatting</div>
      <div className="ribbon-buttons">
        {engine.styles.filter(s => s.isBuiltIn && s.type === 'paragraph').slice(0, 10).map(style => (
          <button key={style.id} className="style-preview-btn" onClick={() => engine.applyStyle(style.name)} title={style.displayName}>
            <span style={{ fontFamily: style.runFormatting.fontFamily || 'Calibri', fontSize: '11px', fontWeight: style.runFormatting.bold ? 'bold' : 'normal' }}>
              {style.displayName}
            </span>
          </button>
        ))}
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Page Background</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="🖼" label="Watermark" onClick={() => {
          const text = prompt('Watermark text:', 'CONFIDENTIAL');
          if (text) engine.setTextWatermark(text);
        }} />
        <RibbonButton icon="🎨" label="Page Color" onClick={() => {
          const color = prompt('Page background color (hex):', '#FFFFFF');
          if (color) engine.setParagraphShading(color);
        }} />
        <RibbonButton icon="⊞" label="Page Borders" onClick={() => {}} />
      </div>
    </div>
  </div>
);

// ─── Layout Ribbon ───────────────────────────────────────────────────────────
const LayoutRibbon: React.FC<{
  engine: ReturnType<typeof useDocumentEngine>;
  onOpenPageSetup?: () => void;
}> = ({ engine, onOpenPageSetup }) => (
  <div className="ribbon-group-container">
    <div className="ribbon-group">
      <div className="ribbon-group-label">Page Setup</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="📐" label="Margins" onClick={onOpenPageSetup} />
        <RibbonButton icon="🔄" label="Orientation" onClick={() => {
          const o = prompt('Orientation (portrait/landscape):', engine.pageSetup.orientation);
          if (o === 'portrait' || o === 'landscape') engine.setOrientation(o);
        }} />
        <RibbonButton icon="📏" label="Size" onClick={onOpenPageSetup} />
        <RibbonButton icon="⚖" label="Columns" onClick={() => {
          const c = prompt('Number of columns:', String(engine.pageSetup.columns));
          if (c) engine.setColumns(parseInt(c));
        }} />
        <RibbonButton icon="↵" label="Breaks" onClick={() => engine.insertSectionBreak()} />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Paragraph</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="←" label="Indent" onClick={() => engine.setLeftIndent(engine.pageSetup.pageMargins.left + 720)} />
        <RibbonButton icon="→" label="Outdent" onClick={() => engine.setLeftIndent(Math.max(0, engine.pageSetup.pageMargins.left - 720))} />
        <RibbonButton icon="↕" label="Spacing" onClick={() => {
          const v = prompt('Line spacing:', '1.15');
          if (v) engine.setLineSpacing(parseFloat(v));
        }} />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Arrange</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="⬆" label="Bring Forward" onClick={() => {}} />
        <RibbonButton icon="⬇" label="Send Backward" onClick={() => {}} />
        <RibbonButton icon="🔲" label="Align" onClick={() => {}} />
        <RibbonButton icon="↔" label="Rotate" onClick={() => {}} />
      </div>
    </div>
  </div>
);

// ─── References Ribbon ───────────────────────────────────────────────────────
const ReferencesRibbon: React.FC<{ engine: ReturnType<typeof useDocumentEngine> }> = ({ engine }) => (
  <div className="ribbon-group-container">
    <div className="ribbon-group">
      <div className="ribbon-group-label">Table of Contents</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="📑" label="TOC" onClick={() => engine.insertTableOfContents()} />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Footnotes</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="¹" label="Footnote" onClick={() => {
          const text = prompt('Footnote text:');
          if (text) engine.insertFootnote(text);
        }} />
        <RibbonButton icon="†" label="Endnote" onClick={() => {
          const text = prompt('Endnote text:');
          if (text) engine.insertEndnote(text);
        }} />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Captions</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="📷" label="Caption" onClick={() => {}} />
        <RibbonButton icon="Cross" label="Cross-reference" onClick={() => {}} />
      </div>
    </div>
  </div>
);

// ─── Review Ribbon ───────────────────────────────────────────────────────────
const ReviewRibbon: React.FC<{
  engine: ReturnType<typeof useDocumentEngine>;
  onOpenWordCount?: () => void;
  onOpenAutoCorrect?: () => void;
  onToggleCommentsPanel?: () => void;
  commentsPanelVisible?: boolean;
}> = ({ engine, onOpenWordCount, onOpenAutoCorrect, onToggleCommentsPanel, commentsPanelVisible }) => (
  <div className="ribbon-group-container">
    <div className="ribbon-group">
      <div className="ribbon-group-label">Proofing</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="✅" label="Spelling" onClick={() => alert('Spell checking not yet available')} />
        <RibbonButton icon="📖" label="Thesaurus" onClick={() => alert('Thesaurus not yet available')} />
        <RibbonButton icon="ABC" label="Word Count" onClick={onOpenWordCount} />
        <RibbonButton icon="✏" label="AutoCorrect" onClick={onOpenAutoCorrect} />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Comments</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="💬" label="New Comment" onClick={() => {
          const text = prompt('Add a comment:');
          if (text) engine.addComment(text);
        }} />
        <RibbonButton icon="💬" label="Comments" onClick={onToggleCommentsPanel} active={commentsPanelVisible} />
        <RibbonButton icon="✅" label="Resolve" onClick={() => {
          const lastComment = engine.comments[engine.comments.length - 1];
          if (lastComment) engine.resolveComment(lastComment.id);
        }} />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Tracking</div>
      <div className="ribbon-buttons">
        <RibbonButton
          icon={engine.document?.trackChanges.enabled ? '🔴' : '⚪'}
          label="Track Changes"
          onClick={() => engine.toggleTrackChanges()}
          active={engine.document?.trackChanges.enabled}
        />
        <RibbonButton icon="✓" label="Accept" onClick={() => engine.acceptAllChanges()} />
        <RibbonButton icon="✗" label="Reject" onClick={() => engine.rejectAllChanges()} />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Changes</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="🔒" label="Protect" onClick={() => alert('Document protection not yet available')} />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Undo/Redo</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="↩" label="Undo" shortcut="Ctrl+Z" onClick={() => engine.undo()} disabled={!engine.canUndo} />
        <RibbonButton icon="↪" label="Redo" shortcut="Ctrl+Y" onClick={() => engine.redo()} disabled={!engine.canRedo} />
      </div>
    </div>
  </div>
);

// ─── View Ribbon ─────────────────────────────────────────────────────────────
const ViewRibbon: React.FC<{
  engine: ReturnType<typeof useDocumentEngine>;
  onTogglePropertiesPanel?: () => void;
  propertiesPanelVisible?: boolean;
}> = ({ onTogglePropertiesPanel, propertiesPanelVisible }) => (
  <div className="ribbon-group-container">
    <div className="ribbon-group">
      <div className="ribbon-group-label">Views</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="📄" label="Print Layout" active={true} />
        <RibbonButton icon="📝" label="Draft" />
        <RibbonButton icon="📖" label="Read Mode" />
        <RibbonButton icon="🌐" label="Web Layout" />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Show</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="📐" label="Ruler" />
        <RibbonButton icon="⊞" label="Gridlines" />
        <RibbonButton icon="📑" label="Navigation" />
        <RibbonButton icon="属性" label="Properties" onClick={onTogglePropertiesPanel} active={propertiesPanelVisible} />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Zoom</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="🔍" label="Zoom" onClick={() => {
          const z = prompt('Zoom level (%):', '100');
          if (z) document.querySelector('.document-canvas')?.setAttribute('style', `transform: scale(${parseInt(z)/100})`);
        }} />
        <RibbonButton icon="100" label="100%" onClick={() => {}} />
        <RibbonButton icon="BW" label="Page Width" onClick={() => {}} />
      </div>
    </div>
    <div className="ribbon-group">
      <div className="ribbon-group-label">Window</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="⊞" label="New Window" />
        <RibbonButton icon="⊞" label="Arrange All" />
        <RibbonButton icon="📋" label="Split" />
      </div>
    </div>
  </div>
);

// ─── Help Ribbon ─────────────────────────────────────────────────────────────
const HelpRibbon: React.FC = () => (
  <div className="ribbon-group-container">
    <div className="ribbon-group">
      <div className="ribbon-group-label">Help</div>
      <div className="ribbon-buttons">
        <RibbonButton icon="❓" label="Help" onClick={() => alert('WORD — Professional Document Editor\n\nKeyboard Shortcuts:\nCtrl+S - Save\nCtrl+Z - Undo\nCtrl+Y - Redo\nCtrl+B - Bold\nCtrl+I - Italic\nCtrl+U - Underline\nCtrl+F - Find\nCtrl+H - Replace\nCtrl+A - Select All\nCtrl+K - Hyperlink\nCtrl+N - New Document\nCtrl+O - Open\nCtrl+Enter - Page Break')} />
        <RibbonButton icon="📧" label="Feedback" onClick={() => {}} />
      </div>
    </div>
  </div>
);

// ─── Reusable Components ─────────────────────────────────────────────────────

interface RibbonButtonProps {
  icon: string;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
}

const RibbonButton: React.FC<RibbonButtonProps> = ({ icon, label, shortcut, onClick, disabled, title, active }) => (
  <button
    className={`ribbon-button ${active ? 'ribbon-button-active' : ''}`}
    onClick={onClick}
    disabled={disabled}
    title={title || (shortcut ? `${label} (${shortcut})` : label)}
  >
    <span className="ribbon-button-icon">{icon}</span>
    {label && <span className="ribbon-button-label">{label}</span>}
  </button>
);

interface RibbonToggleButtonProps {
  icon: string;
  label: string;
  shortcut?: string;
  active: boolean;
  onClick: () => void;
  title?: string;
}

const RibbonToggleButton: React.FC<RibbonToggleButtonProps> = ({ icon, label, shortcut, active, onClick, title }) => (
  <button
    className={`ribbon-button ${active ? 'ribbon-button-active' : ''}`}
    onClick={onClick}
    title={title || (shortcut ? `${label} (${shortcut})` : label)}
  >
    <span className="ribbon-button-icon">{icon}</span>
    {label && <span className="ribbon-button-label">{label}</span>}
  </button>
);

interface RibbonColorButtonProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  title?: string;
}

const RibbonColorButton: React.FC<RibbonColorButtonProps> = ({ label, color, onChange, title }) => (
  <div className="ribbon-color-button" title={title}>
    <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="color-input" />
    <span className="ribbon-button-label">{label}</span>
  </div>
);
