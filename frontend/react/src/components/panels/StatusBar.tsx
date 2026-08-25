import React from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import './StatusBar.css';

interface StatusBarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onToggleNavigation: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ zoom, onZoomChange, onToggleNavigation }) => {
  const { getWordCount, getCharacterCount, getLineCount, canUndo, canRedo } = useDocumentEngine();
  const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300];

  const handleZoomIn = () => {
    const idx = zoomLevels.indexOf(zoom);
    if (idx < zoomLevels.length - 1) onZoomChange(zoomLevels[idx + 1]);
  };

  const handleZoomOut = () => {
    const idx = zoomLevels.indexOf(zoom);
    if (idx > 0) onZoomChange(zoomLevels[idx - 1]);
  };

  const words = getWordCount();
  const chars = getCharacterCount();
  const lines = getLineCount();

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">
          Page 1 of 1
        </span>
        <span className="status-separator">|</span>
        <span className="status-item">
          Words: {words.toLocaleString()}
        </span>
        <span className="status-separator">|</span>
        <span className="status-item">
          Characters: {chars.toLocaleString()}
        </span>
        <span className="status-separator">|</span>
        <span className="status-item">
          Lines: {lines}
        </span>
      </div>

      <div className="status-right">
        <span className="status-item" title={canUndo ? 'Undo available' : 'Nothing to undo'}>
          ↩ {canUndo ? '•' : '○'}
        </span>
        <span className="status-item" title={canRedo ? 'Redo available' : 'Nothing to redo'}>
          ↪ {canRedo ? '•' : '○'}
        </span>

        <button className="status-button" onClick={onToggleNavigation} title="Toggle Navigation Pane">
          📑
        </button>

        <div className="zoom-controls">
          <button className="zoom-button" onClick={handleZoomOut} disabled={zoom <= 25} title="Zoom Out">
            −
          </button>
          <select
            className="zoom-select"
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
          >
            {zoomLevels.map(level => (
              <option key={level} value={level}>{level}%</option>
            ))}
          </select>
          <button className="zoom-button" onClick={handleZoomIn} disabled={zoom >= 300} title="Zoom In">
            +
          </button>
        </div>
      </div>
    </div>
  );
};
