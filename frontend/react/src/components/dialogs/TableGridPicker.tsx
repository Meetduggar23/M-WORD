import React, { useState } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import './TableGridPicker.css';

interface TableGridPickerProps {
  onClose: () => void;
}

export const TableGridPicker: React.FC<TableGridPickerProps> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const [hoverRows, setHoverRows] = useState(0);
  const [hoverCols, setHoverCols] = useState(0);
  const maxRows = 10;
  const maxCols = 8;

  const handleInsert = (rows: number, cols: number) => {
    engine.insertTable(rows, cols);
    onClose();
  };

  return (
    <div className="tg-overlay" onClick={onClose}>
      <div className="tg-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="tg-header">
          <span className="tg-title">Insert Table</span>
        </div>

        <div className="tg-grid-container">
          <div className="tg-grid">
            {Array.from({ length: maxRows }).map((_, row) => (
              <div key={row} className="tg-row">
                {Array.from({ length: maxCols }).map((_, col) => (
                  <div
                    key={col}
                    className={`tg-cell ${row < hoverRows && col < hoverCols ? 'selected' : ''}`}
                    onMouseEnter={() => { setHoverRows(row + 1); setHoverCols(col + 1); }}
                    onMouseLeave={() => {}}
                    onClick={() => handleInsert(row + 1, col + 1)}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="tg-label">
            {hoverRows > 0 && hoverCols > 0
              ? `${hoverRows} x ${hoverCols} Table`
              : 'Insert Table'}
          </div>
        </div>

        <div className="tg-footer">
          <button className="tg-btn" onClick={() => {
            const rows = prompt('Number of rows:', '3');
            const cols = prompt('Number of columns:', '3');
            if (rows && cols) {
              engine.insertTable(parseInt(rows), parseInt(cols));
              onClose();
            }
          }}>
            Insert Custom Table...
          </button>
        </div>
      </div>
    </div>
  );
};
