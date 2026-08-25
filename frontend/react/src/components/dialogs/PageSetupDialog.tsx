import React, { useState } from 'react';
import { useDocumentEngine, PageSize, PageMargins } from '../../hooks/useDocumentEngine';
import './PageSetupDialog.css';
interface PageSetupDialogProps {
  onClose: () => void;
}
export const PageSetupDialog: React.FC<PageSetupDialogProps> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const [pageSize, setPageSize] = useState<PageSize>(engine.pageSetup.pageSize);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(engine.pageSetup.orientation);
  const [margins, setMargins] = useState<PageMargins>({ ...engine.pageSetup.pageMargins });
  const [columns, setColumns] = useState(engine.pageSetup.columns);
  const [gutter, setGutter] = useState(engine.pageSetup.gutter);
  const [headerDist, setHeaderDist] = useState(engine.pageSetup.headerDistance);
  const [footerDist, setFooterDist] = useState(engine.pageSetup.footerDistance);

  const marginPresets: Record<string, Partial<PageMargins>> = {
    normal: { top: 1440, bottom: 1440, left: 1800, right: 1800 },
    narrow: { top: 720, bottom: 720, left: 720, right: 720 },
    moderate: { top: 1440, bottom: 1440, left: 1080, right: 1080 },
    wide: { top: 1440, bottom: 1440, left: 1800, right: 1800 },
  };
  const handleApply = () => {
    engine.setPageSize(pageSize);
    engine.setOrientation(orientation);
    engine.setPageMargins(margins);
    engine.setColumns(columns);
    onClose();
  };
  return (
    <div className="page-setup-overlay" onClick={onClose}>
      <div className="page-setup-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ps-tabs">
          <button className="ps-tab active">Margins</button>
          <button className="ps-tab">Paper</button>
          <button className="ps-tab">Layout</button>
        </div>
        <div className="ps-body">
          <div className="ps-preview">
            <div className="ps-page-preview" style={{
              width: orientation === 'portrait' ? '80px' : '120px',
              height: orientation === 'portrait' ? '120px' : '80px',
              margin: '16px auto',
              border: '1px solid #999',
              background: 'white',
              position: 'relative',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                border: '1px dashed #ccc',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                color: '#999',
              }}>
                Page
              </div>
            </div>
            <div className="ps-preview-info">
              {orientation === 'portrait' ? 'Portrait' : 'Landscape'} • {pageSize.toUpperCase()}
            </div>
          </div>
          <div className="ps-settings">
            <div className="ps-section">
              <h4>Margins</h4>
              <div className="ps-margin-presets">
                <select className="ps-select" onChange={(e) => {
                  const preset = marginPresets[e.target.value];
                  if (preset) setMargins(m => ({ ...m, ...preset }));
                }}>
                  <option value="normal">Normal (1" All)</option>
                  <option value="narrow">Narrow (0.5" All)</option>
                  <option value="moderate">Moderate</option>
                  <option value="wide">Wide</option>
                </select>
              </div>
              <div className="ps-grid">
                <div className="ps-field">
                  <label>Top:</label>
                  <input type="number" value={margins.top} onChange={(e) => setMargins(m => ({ ...m, top: Number(e.target.value) }))} step={72} />
                  <span className="ps-unit">twips</span>
                </div>
                <div className="ps-field">
                  <label>Bottom:</label>
                  <input type="number" value={margins.bottom} onChange={(e) => setMargins(m => ({ ...m, bottom: Number(e.target.value) }))} step={72} />
                  <span className="ps-unit">twips</span>
                </div>
                <div className="ps-field">
                  <label>Left:</label>
                  <input type="number" value={margins.left} onChange={(e) => setMargins(m => ({ ...m, left: Number(e.target.value) }))} step={72} />
                  <span className="ps-unit">twips</span>
                </div>
                <div className="ps-field">
                  <label>Right:</label>
                  <input type="number" value={margins.right} onChange={(e) => setMargins(m => ({ ...m, right: Number(e.target.value) }))} step={72} />
                  <span className="ps-unit">twips</span>
                </div>
                <div className="ps-field">
                  <label>Gutter:</label>
                  <input type="number" value={gutter} onChange={(e) => setGutter(Number(e.target.value))} step={72} />
                  <span className="ps-unit">twips</span>
                </div>
              </div>
            </div>
            <div className="ps-section">
              <h4>Orientation</h4>
              <div className="ps-orientation-btns">
                <button className={`ps-orient-btn ${orientation === 'portrait' ? 'active' : ''}`} onClick={() => setOrientation('portrait')}>
                  <div className="orient-icon portrait" />
                  <span>Portrait</span>
                </button>
                <button className={`ps-orient-btn ${orientation === 'landscape' ? 'active' : ''}`} onClick={() => setOrientation('landscape')}>
                  <div className="orient-icon landscape" />
                  <span>Landscape</span>
                </button>
              </div>
            </div>
            <div className="ps-section">
              <h4>Paper Size</h4>
              <select className="ps-select full" value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)}>
                <option value="letter">Letter (8.5" × 11")</option>
                <option value="legal">Legal (8.5" × 14")</option>
                <option value="tabloid">Tabloid (11" × 17")</option>
                <option value="A3">A3 (297mm × 420mm)</option>
                <option value="A4">A4 (210mm × 297mm)</option>
                <option value="A5">A5 (148mm × 210mm)</option>
                <option value="B4">B4 (250mm × 353mm)</option>
                <option value="B5">B5 (176mm × 250mm)</option>
                <option value="executive">Executive (7.25" × 10.5")</option>
                <option value="statement">Statement (5.5" × 8.5")</option>
              </select>
            </div>
            <div className="ps-section">
              <h4>Columns</h4>
              <div className="ps-field">
                <label>Number:</label>
                <input type="number" value={columns} onChange={(e) => setColumns(Number(e.target.value))} min={1} max={3} />
              </div>
            </div>
            <div className="ps-section">
              <h4>Header & Footer</h4>
              <div className="ps-grid">
                <div className="ps-field">
                  <label>Header from edge:</label>
                  <input type="number" value={headerDist} onChange={(e) => setHeaderDist(Number(e.target.value))} step={72} />
                  <span className="ps-unit">twips</span>
                </div>
                <div className="ps-field">
                  <label>Footer from edge:</label>
                  <input type="number" value={footerDist} onChange={(e) => setFooterDist(Number(e.target.value))} step={72} />
                  <span className="ps-unit">twips</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="ps-footer">
          <button className="ps-btn" onClick={onClose}>Cancel</button>
          <button className="ps-btn primary" onClick={handleApply}>OK</button>
        </div>
      </div>
    </div>
  );
};
