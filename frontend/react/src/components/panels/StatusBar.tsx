import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, FileText, Columns2, GalleryHorizontalEnd, SpellCheck, Lock, Cloud } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI, ZOOM_STEPS } from '../../store/uiStore';
import { SaveStatus } from '../titlebar/TitleBar';
import { aiService } from '../../features/ai/aiService';
import { VoiceControl } from './VoiceControl';
import './StatusBar.css';

interface StatusBarProps {
  saveStatus?: SaveStatus;
  currentPage: number;
  pageCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ currentPage, pageCount }) => {
  const { getWordCount, getCharacterCount } = useDocumentEngine();
  const { zoom, setZoom, zoomIn, zoomOut } = useUI();

  const words = getWordCount();
  const chars = getCharacterCount();
  const sliderIndex = ZOOM_STEPS.indexOf(zoom);
  const effectiveIndex = sliderIndex >= 0 ? sliderIndex : nearestZoomIndex(zoom);

  const privacy = aiService.privacy;

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">Page {Math.min(currentPage, pageCount)} of {pageCount}</span>
        <span className="status-item">{words.toLocaleString()} words</span>
        <span className="status-item">{chars.toLocaleString()} characters</span>
        <span className="status-item status-lang status-hide-md">
          <SpellCheck size={13} strokeWidth={1.9} />
          English (US)
        </span>
        <span
          className={`status-item status-privacy${privacy === 'device' ? ' device' : ''} status-hide-md`}
          title={privacy === 'device'
            ? 'AI runs on this device — your documents never leave the machine'
            : 'A cloud AI provider is configured — excerpts are sent during AI requests'}
        >
          {privacy === 'device' ? <Lock size={11} strokeWidth={2.2} /> : <Cloud size={11} strokeWidth={2.2} />}
          {privacy === 'device' ? 'Local AI' : 'Cloud AI'}
        </span>
      </div>

      <div className="status-right">
        <VoiceControl />

        <div className="status-view-modes">
          <button className="status-button active-view" title="Print Layout" aria-label="Print Layout">
            <FileText size={13} strokeWidth={2} />
          </button>
          <button className="status-button" title="Read Mode" aria-label="Read Mode">
            <Columns2 size={13} strokeWidth={2} />
          </button>
          <button className="status-button" title="Web Layout" aria-label="Web Layout">
            <GalleryHorizontalEnd size={13} strokeWidth={2} />
          </button>
        </div>

        <div className="zoom-controls">
          <button className="zoom-button" onClick={zoomOut} disabled={zoom <= ZOOM_STEPS[0]} title="Zoom out" aria-label="Zoom out">
            <ZoomOut size={13} strokeWidth={2.2} />
          </button>
          <input
            type="range"
            className="zoom-slider"
            min={0}
            max={ZOOM_STEPS.length - 1}
            step={1}
            value={effectiveIndex}
            onChange={(e) => setZoom(ZOOM_STEPS[Number(e.target.value)])}
            title={`Zoom ${zoom}%`}
            aria-label={`Zoom level, currently ${zoom}%`}
          />
          <button className="zoom-button" onClick={zoomIn} disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} title="Zoom in" aria-label="Zoom in">
            <ZoomIn size={13} strokeWidth={2.2} />
          </button>
          <span className="status-item zoom-value">{zoom}%</span>
          <button
            className="zoom-fit"
            onClick={() => fitWidth(setZoom)}
            title="Fit page width to window"
            aria-label="Fit width"
          >
            <Maximize2 size={11} strokeWidth={2.2} />
            Fit
          </button>
        </div>
      </div>
    </div>
  );
};

function nearestZoomIndex(zoom: number): number {
  let best = 0;
  for (let i = 1; i < ZOOM_STEPS.length; i++) {
    if (Math.abs(ZOOM_STEPS[i] - zoom) < Math.abs(ZOOM_STEPS[best] - zoom)) best = i;
  }
  return best;
}

/** Estimate a zoom level that fits the A4 page width inside the canvas viewport. */
function fitWidth(setZoom: (z: number) => void): void {
  const wrapper = document.querySelector('.document-canvas-wrapper');
  if (!wrapper) return;
  const available = wrapper.clientWidth - 72;
  const pageWidthPx = 794;
  const target = Math.round((available / pageWidthPx) * 100 / 5) * 5;
  setZoom(Math.min(200, Math.max(50, target)));
}
