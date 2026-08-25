import React, { useState } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import './PropertiesPanel.css';

type PanelTab = 'character' | 'paragraph' | 'styles' | 'document';

export const PropertiesPanel: React.FC = () => {
  const engine = useDocumentEngine();
  const [activeTab, setActiveTab] = useState<PanelTab>('character');
  const [selectedStyle, setSelectedStyle] = useState('');

  const tabs: { id: PanelTab; label: string }[] = [
    { id: 'character', label: 'Aa' },
    { id: 'paragraph', label: '¶' },
    { id: 'styles', label: 'Styles' },
    { id: 'document', label: 'ℹ' },
  ];

  const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Helvetica', 'Calibri', 'Cambria', 'Garamond', 'Book Antiqua', 'Palatino', 'Trebuchet MS', 'Tahoma', 'Comic Sans MS', 'Impact', 'Lucida Console', 'Consolas'];
  const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

  const styleGroups = [
    { label: 'Built-in', styles: engine.styles.filter(s => s.isBuiltIn && s.isVisible) },
    { label: 'Custom', styles: engine.styles.filter(s => s.isCustom) },
  ];

  return (
    <div className="properties-panel">
      <div className="pp-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`pp-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pp-content">
        {activeTab === 'character' && (
          <div className="pp-section">
            <div className="pp-group">
              <label className="pp-label">Font</label>
              <select
                className="pp-select full"
                value={engine.activeFormatting.fontFamily || 'Arial'}
                onChange={(e) => engine.setFontFamily(e.target.value)}
              >
                {fonts.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="pp-group">
              <label className="pp-label">Size</label>
              <select
                className="pp-select"
                value={engine.activeFormatting.fontSize || 11}
                onChange={(e) => engine.setFontSize(Number(e.target.value))}
              >
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="pp-group-row">
              <label className="pp-label">Color</label>
              <input
                type="color"
                value={engine.activeFormatting.color || '#000000'}
                onChange={(e) => engine.setTextColor(e.target.value)}
                className="pp-color"
              />
            </div>

            <div className="pp-group-row">
              <label className="pp-label">Highlight</label>
              <input
                type="color"
                value={engine.activeFormatting.highlight || '#FFFF00'}
                onChange={(e) => engine.setHighlight(e.target.value)}
                className="pp-color"
              />
            </div>

            <div className="pp-group">
              <label className="pp-label">Formatting</label>
              <div className="pp-format-row">
                <button className={`pp-btn ${engine.activeFormatting.bold ? 'active' : ''}`} onClick={() => engine.toggleBold()} title="Bold">
                  <strong>B</strong>
                </button>
                <button className={`pp-btn ${engine.activeFormatting.italic ? 'active' : ''}`} onClick={() => engine.toggleItalic()} title="Italic">
                  <em>I</em>
                </button>
                <button className={`pp-btn ${engine.activeFormatting.underline ? 'active' : ''}`} onClick={() => engine.toggleUnderline()} title="Underline">
                  <u>U</u>
                </button>
                <button className={`pp-btn ${engine.activeFormatting.strikethrough ? 'active' : ''}`} onClick={() => engine.toggleStrikethrough()} title="Strikethrough">
                  <s>S</s>
                </button>
              </div>
              <div className="pp-format-row">
                <button className={`pp-btn ${engine.activeFormatting.superscript ? 'active' : ''}`} onClick={() => engine.toggleSuperscript()} title="Superscript">
                  X²
                </button>
                <button className={`pp-btn ${engine.activeFormatting.subscript ? 'active' : ''}`} onClick={() => engine.toggleSubscript()} title="Subscript">
                  X₂
                </button>
                <button className={`pp-btn ${engine.activeFormatting.smallCaps ? 'active' : ''}`} onClick={() => engine.toggleSmallCaps()} title="Small Caps">
                  <span style={{fontSize:'9px',letterSpacing:'-0.5px'}}>Sc</span>
                </button>
                <button className={`pp-btn ${engine.activeFormatting.allCaps ? 'active' : ''}`} onClick={() => engine.toggleAllCaps()} title="All Caps">
                  <span style={{fontSize:'10px'}}>AA</span>
                </button>
              </div>
            </div>

            <div className="pp-group">
              <label className="pp-label">Character Spacing</label>
              <select
                className="pp-select full"
                value={engine.activeFormatting.characterSpacing || 0}
                onChange={(e) => engine.setCharacterSpacing(Number(e.target.value))}
              >
                <option value={-20}>Very Tight</option>
                <option value={-10}>Tight</option>
                <option value={0}>Normal</option>
                <option value={5}>Loose</option>
                <option value={10}>Very Loose</option>
                <option value={15}>Expanded</option>
                <option value={20}>Expanded More</option>
              </select>
            </div>

            <div className="pp-group">
              <button className="pp-clear-btn" onClick={() => engine.clearFormatting()}>
                Clear All Formatting
              </button>
            </div>
          </div>
        )}

        {activeTab === 'paragraph' && (
          <div className="pp-section">
            <div className="pp-group">
              <label className="pp-label">Alignment</label>
              <div className="pp-format-row">
                <button className={`pp-btn ${engine.document?.sections[0].blocks[0] ? '' : ''}`} onClick={() => engine.setAlignment('left')} title="Left">≡</button>
                <button className="pp-btn" onClick={() => engine.setAlignment('center')} title="Center">≡</button>
                <button className="pp-btn" onClick={() => engine.setAlignment('right')} title="Right">≡</button>
                <button className="pp-btn" onClick={() => engine.setAlignment('justify')} title="Justify">≡</button>
              </div>
            </div>

            <div className="pp-group">
              <label className="pp-label">Indentation</label>
              <div className="pp-indent-row">
                <span className="pp-indent-label">Left:</span>
                <input
                  type="number"
                  className="pp-number"
                  value={engine.document?.sections[0].blocks.find(b => b.id === engine.cursorPosition.blockId)?.type === 'paragraph' ? (engine.document.sections[0].blocks.find(b => b.id === engine.cursorPosition.blockId) as any)?.formatting?.leftIndent || 0 : 0}
                  onChange={(e) => engine.setLeftIndent(Number(e.target.value))}
                  step={72}
                />
                <span className="pp-indent-unit">twips</span>
              </div>
              <div className="pp-indent-row">
                <span className="pp-indent-label">Right:</span>
                <input
                  type="number"
                  className="pp-number"
                  value={0}
                  onChange={(e) => engine.setRightIndent(Number(e.target.value))}
                  step={72}
                />
                <span className="pp-indent-unit">twips</span>
              </div>
              <div className="pp-indent-row">
                <span className="pp-indent-label">First:</span>
                <input
                  type="number"
                  className="pp-number"
                  value={0}
                  onChange={(e) => engine.setFirstLineIndent(Number(e.target.value))}
                  step={72}
                />
                <span className="pp-indent-unit">twips</span>
              </div>
            </div>

            <div className="pp-group">
              <label className="pp-label">Spacing</label>
              <div className="pp-indent-row">
                <span className="pp-indent-label">Before:</span>
                <input
                  type="number"
                  className="pp-number"
                  value={0}
                  onChange={(e) => engine.setSpaceBefore(Number(e.target.value))}
                  step={60}
                />
                <span className="pp-indent-unit">pt</span>
              </div>
              <div className="pp-indent-row">
                <span className="pp-indent-label">After:</span>
                <input
                  type="number"
                  className="pp-number"
                  value={0}
                  onChange={(e) => engine.setSpaceAfter(Number(e.target.value))}
                  step={60}
                />
                <span className="pp-indent-unit">pt</span>
              </div>
            </div>

            <div className="pp-group">
              <label className="pp-label">Line Spacing</label>
              <select
                className="pp-select full"
                value="1.15"
                onChange={(e) => engine.setLineSpacing(Number(e.target.value))}
              >
                <option value="1.0">Single</option>
                <option value="1.15">1.15</option>
                <option value="1.5">1.5 Lines</option>
                <option value="2.0">Double</option>
                <option value="2.5">2.5 Lines</option>
                <option value="3.0">Triple</option>
              </select>
            </div>

            <div className="pp-group">
              <label className="pp-label">Lists</label>
              <div className="pp-format-row">
                <button className="pp-btn" onClick={() => engine.setBulletList()} title="Bullet List">•≡</button>
                <button className="pp-btn" onClick={() => engine.setNumberedList()} title="Numbered List">1.≡</button>
                <button className="pp-btn" onClick={() => engine.increaseListLevel()} title="Increase Level">→</button>
                <button className="pp-btn" onClick={() => engine.decreaseListLevel()} title="Decrease Level">←</button>
              </div>
            </div>

            <div className="pp-group">
              <label className="pp-label">Borders & Shading</label>
              <div className="pp-indent-row">
                <span className="pp-indent-label">Border:</span>
                <select className="pp-select" onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'none') engine.setParagraphBorders({});
                  else engine.setParagraphBorders({ bottom: { style: val as any, size: 4, color: '#000000', space: 1 } });
                }}>
                  <option value="none">None</option>
                  <option value="single">Bottom Border</option>
                  <option value="double">Double Line</option>
                  <option value="thick">Thick Line</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
              <div className="pp-indent-row">
                <span className="pp-indent-label">Shading:</span>
                <input
                  type="color"
                  className="pp-color"
                  value="#ffffff"
                  onChange={(e) => engine.setParagraphShading(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'styles' && (
          <div className="pp-section">
            {styleGroups.map(group => (
              <div key={group.label} className="pp-style-group">
                <div className="pp-style-group-label">{group.label}</div>
                {group.styles.map(style => (
                  <button
                    key={style.id}
                    className={`pp-style-item ${selectedStyle === style.name ? 'selected' : ''}`}
                    onClick={() => { engine.applyStyle(style.name); setSelectedStyle(style.name); }}
                  >
                    <span className="style-preview" style={{
                      fontFamily: style.runFormatting.fontFamily || 'Calibri',
                      fontSize: Math.min(style.runFormatting.fontSize || 11, 20),
                      fontWeight: style.runFormatting.bold ? 'bold' : 'normal',
                      fontStyle: style.runFormatting.italic ? 'italic' : 'normal',
                      color: style.runFormatting.color || '#000',
                    }}>
                      {style.displayName}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'document' && (
          <div className="pp-section">
            <div className="pp-group">
              <label className="pp-label">Page Setup</label>
              <div className="pp-indent-row">
                <span className="pp-indent-label">Size:</span>
                <select
                  className="pp-select"
                  value={engine.pageSetup.pageSize}
                  onChange={(e) => engine.setPageSize(e.target.value as any)}
                >
                  <option value="letter">Letter</option>
                  <option value="legal">Legal</option>
                  <option value="tabloid">Tabloid</option>
                  <option value="A3">A3</option>
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="B4">B4</option>
                  <option value="B5">B5</option>
                </select>
              </div>
              <div className="pp-indent-row">
                <span className="pp-indent-label">Orientation:</span>
                <select
                  className="pp-select"
                  value={engine.pageSetup.orientation}
                  onChange={(e) => engine.setOrientation(e.target.value as 'portrait' | 'landscape')}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div className="pp-indent-row">
                <span className="pp-indent-label">Columns:</span>
                <select
                  className="pp-select"
                  value={engine.pageSetup.columns}
                  onChange={(e) => engine.setColumns(Number(e.target.value))}
                >
                  <option value={1}>One</option>
                  <option value={2}>Two</option>
                  <option value={3}>Three</option>
                </select>
              </div>
            </div>

            <div className="pp-group">
              <label className="pp-label">Document Info</label>
              <div className="pp-info-row">
                <span>Words: {engine.getWordCount()}</span>
              </div>
              <div className="pp-info-row">
                <span>Characters: {engine.getCharacterCount()}</span>
              </div>
              <div className="pp-info-row">
                <span>Paragraphs: {engine.getParagraphCount()}</span>
              </div>
              <div className="pp-info-row">
                <span>Pages: ~{Math.max(1, Math.ceil(engine.getWordCount() / 250))}</span>
              </div>
            </div>

            <div className="pp-group">
              <label className="pp-label">Watermark</label>
              <div className="pp-format-row">
                <button className="pp-btn full" onClick={() => {
                  const text = prompt('Watermark text:');
                  if (text) engine.setTextWatermark(text);
                }}>
                  Text Watermark
                </button>
                <button className="pp-btn full" onClick={() => engine.removeWatermark()}>
                  Remove
                </button>
              </div>
            </div>

            <div className="pp-group">
              <label className="pp-label">Insert</label>
              <div className="pp-format-row">
                <button className="pp-btn full" onClick={() => {
                  const text = prompt('Footnote text:');
                  if (text) engine.insertFootnote(text);
                }}>Footnote</button>
                <button className="pp-btn full" onClick={() => engine.insertTableOfContents()}>TOC</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
