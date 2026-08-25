import React, { useState } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import './SymbolPicker.css';

interface SymbolPickerProps {
  onClose: () => void;
}

const SYMBOL_CATEGORIES: Record<string, string[]> = {
  'General': ['\u00A3','\u00A5','\u00A9','\u00AE','\u2122','\u00B1','\u00D7','\u00F7','\u2260','\u2264','\u2265','\u221E','\u00B5','\u2202','\u2211','\u220F','\u03C0','\u222B','\u221A','\u2248','\u25B3'],
  'Arrows': ['\u2190','\u2192','\u2191','\u2193','\u2194','\u2195','\u21D0','\u21D1','\u21D3','\u21B5','\u21BA','\u21BB','\u2197','\u2198','\u2199','\u2196'],
  'Math': ['\u2200','\u2203','\u2205','\u2208','\u2209','\u220B','\u222A','\u2229','\u2282','\u2283','\u2286','\u2287','\u2227','\u2228','\u00AC','\u2295','\u2297','\u22A5','\u2016','\u221D'],
  'Greek': ['\u03B1','\u03B2','\u03B3','\u03B4','\u03B5','\u03B6','\u03B7','\u03B8','\u03B9','\u03BA','\u03BB','\u03BC','\u03BD','\u03BE','\u03C0','\u03C1','\u03C3','\u03C4','\u03C5','\u03C6','\u03C7','\u03C8','\u03C9','\u0393','\u0394','\u0398','\u039B','\u039E','\u03A0','\u03A3','\u03A6','\u03A8','\u03A9'],
  'Punctuation': ['\u2013','\u2014','\u2026','\u2018','\u2019','\u201E','\u2039','\u203A','\u00AB','\u00BB'],
  'Currency': ['$','\u20AC','\u00A3','\u00A5','\u20B9','\u20BA','\u20BC','\u20BF','\u20A9','\u20AA','\u20AB','\u20AD','\u20AE','\u20AF'],
  'Diacritics': ['\u00C0','\u00C1','\u00C2','\u00C3','\u00C4','\u00C5','\u00C6','\u00C7','\u00C8','\u00C9','\u00CA','\u00CB','\u00CC','\u00CD','\u00CE','\u00CF','\u00D0','\u00D1','\u00D2','\u00D3','\u00D4','\u00D5','\u00D6','\u00D8','\u00D9','\u00DA','\u00DB','\u00DC','\u00DD','\u00DE','\u00DF','\u00E0','\u00E1','\u00E2','\u00E3','\u00E4','\u00E5','\u00E6','\u00E7','\u00E8','\u00E9','\u00EA','\u00EB','\u00EC','\u00ED','\u00EE','\u00EF','\u00F0','\u00F1','\u00F2','\u00F3','\u00F4','\u00F5','\u00F6','\u00F8','\u00F9','\u00FA','\u00FB','\u00FC','\u00FD','\u00FE','\u00FF'],
  'Box Drawing': ['\u250C','\u252C','\u2510','\u251C','\u253C','\u2524','\u2514','\u2534','\u2518','\u2550','\u2551','\u2500','\u2502'],
};

export const SymbolPicker: React.FC<SymbolPickerProps> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const [activeCategory, setActiveCategory] = useState('General');
  const [search, setSearch] = useState('');
  const [recentSymbols, setRecentSymbols] = useState<string[]>([]);

  const symbols = SYMBOL_CATEGORIES[activeCategory] || [];
  const filteredSymbols = search
    ? Object.values(SYMBOL_CATEGORIES).flat().filter(s => s.includes(search))
    : symbols;

  const handleInsert = (symbol: string) => {
    engine.insertSymbol(symbol);
    setRecentSymbols(prev => [symbol, ...prev.filter(s => s !== symbol)].slice(0, 20));
  };

  return (
    <div className="symbol-overlay" onClick={onClose}>
      <div className="symbol-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="symbol-header">
          <h3>Symbol</h3>
          <button className="symbol-close" onClick={onClose}>{'\u2715'}</button>
        </div>
        <div className="symbol-body">
          <div className="symbol-sidebar">
            {Object.keys(SYMBOL_CATEGORIES).map(cat => (
              <button
                key={cat}
                className={`symbol-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat); setSearch(''); }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="symbol-main">
            <input
              className="symbol-search"
              placeholder="Search symbols..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="symbol-grid">
              {filteredSymbols.map((s, i) => (
                <button key={`${s}-${i}`} className="symbol-cell" onClick={() => handleInsert(s)} title={s}>
                  {s}
                </button>
              ))}
            </div>
            {recentSymbols.length > 0 && !search && (
              <div className="symbol-recent">
                <h4>Recently Used</h4>
                <div className="symbol-grid small">
                  {recentSymbols.map((s, i) => (
                    <button key={`r-${i}`} className="symbol-cell" onClick={() => handleInsert(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="symbol-footer">
          <button className="symbol-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
