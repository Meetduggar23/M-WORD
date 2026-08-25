import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import './Ruler.css';

interface RulerProps {
  zoom: number;
}

const TWIP_TO_PX = 1 / 20; // twips to pixels at 96 DPI, approximate

export const Ruler: React.FC<RulerProps> = ({ zoom }) => {
  const { engine, pageSetup } = useDocumentEngine();
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'leftMargin' | 'rightMargin' | 'hangingIndent' | 'firstLineIndent' | 'leftIndent' | null>(null);

  const pageWidthPx = (pageSetup.pageWidth * TWIP_TO_PX * zoom) / 100;
  const marginLeftPx = (pageSetup.pageMargins.left * TWIP_TO_PX * zoom) / 100;
  const marginRightPx = (pageSetup.pageMargins.right * TWIP_TO_PX * zoom) / 100;
  const contentWidthPx = pageWidthPx - marginLeftPx - marginRightPx;



  const handleMouseDown = useCallback((type: typeof isDragging) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
  }, []);

  useEffect(() => {
    if (!isDragging || !rulerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const ruler = rulerRef.current;
      if (!ruler) return;
      const rect = ruler.getBoundingClientRect();
      const x = e.clientX - rect.left;

      if (isDragging === 'leftMargin') {
        const newMargin = Math.max(0, Math.min(x * (1 / (96 * zoom / 100)) * 20 * 10, pageSetup.pageWidth - pageSetup.pageMargins.right - 1440));
        engine.setPageMargins({ left: Math.round(newMargin) });
      } else if (isDragging === 'rightMargin') {
        const rightEdge = rect.width;
        const newMargin = Math.max(0, Math.min((rightEdge - x) * (1 / (96 * zoom / 100)) * 20 * 10, pageSetup.pageWidth - pageSetup.pageMargins.left - 1440));
        engine.setPageMargins({ right: Math.round(newMargin) });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, engine, zoom, pageSetup]);

  // Generate ruler markings
  const inchMarks = [];
  const totalInches = pageWidthPx / (96 * zoom / 100);
  for (let i = 0; i <= totalInches; i++) {
    const x = i * (96 * zoom / 100);
    inchMarks.push(
      <div key={`inch-${i}`} className="ruler-inch-mark" style={{ left: `${x}px` }}>
        <div className="ruler-mark-line ruler-mark-full" />
        <span className="ruler-mark-label">{i}</span>
      </div>
    );
    // Half-inch marks
    if (i < totalInches) {
      const halfX = x + (96 * zoom / 100) / 2;
      inchMarks.push(
        <div key={`half-${i}`} className="ruler-half-mark" style={{ left: `${halfX}px` }}>
          <div className="ruler-mark-line ruler-mark-half" />
        </div>
      );
      // Quarter-inch marks
      const q1X = x + (96 * zoom / 100) / 4;
      const q3X = x + (96 * zoom / 100) * 3 / 4;
      inchMarks.push(
        <div key={`q1-${i}`} className="ruler-quarter-mark" style={{ left: `${q1X}px` }}>
          <div className="ruler-mark-line ruler-mark-quarter" />
        </div>,
        <div key={`q3-${i}`} className="ruler-quarter-mark" style={{ left: `${q3X}px` }}>
          <div className="ruler-mark-line ruler-mark-quarter" />
        </div>
      );
    }
  }

  return (
    <div className="ruler-container" ref={rulerRef}>
      <div className="ruler-body">
        {/* Left margin area */}
        <div
          className={`ruler-margin ruler-margin-left ${isDragging === 'leftMargin' ? 'dragging' : ''}`}
          style={{ width: `${marginLeftPx}px` }}
          onMouseDown={handleMouseDown('leftMargin')}
        >
          <div className="margin-handle margin-handle-right" />
        </div>

        {/* Content area with markings */}
        <div className="ruler-content" style={{ width: `${contentWidthPx}px` }}>
          {inchMarks}
        </div>

        {/* Right margin area */}
        <div
          className={`ruler-margin ruler-margin-right ${isDragging === 'rightMargin' ? 'dragging' : ''}`}
          style={{ width: `${marginRightPx}px` }}
          onMouseDown={handleMouseDown('rightMargin')}
        >
          <div className="margin-handle margin-handle-left" />
        </div>
      </div>
    </div>
  );
};
