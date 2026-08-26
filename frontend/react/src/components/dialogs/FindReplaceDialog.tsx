import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { CursorPosition } from '../../engine/DocumentEngine';
import './FindReplaceDialog.css';

interface FindReplaceDialogProps {
  mode: 'find' | 'replace';
  onClose: () => void;
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({ mode: initialMode, onClose }) => {
  const engine = useDocumentEngine();
  const [mode, setMode] = useState(initialMode);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useWildcard, setUseWildcard] = useState(false);
  const [matchAllWordForms, setMatchAllWordForms] = useState(false);
  const [results, setResults] = useState<CursorPosition[]>([]);
  const [currentResult, setCurrentResult] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleFind = useCallback(() => {
    if (!findText) { setResults([]); return; }
    const found = engine.findText(findText, matchCase, wholeWord, useWildcard);
    setResults(found);
    setCurrentResult(found.length > 0 ? 0 : -1);
    if (found.length > 0) {
      engine.setSelection(found[0], {
        blockId: found[0].blockId,
        runIndex: found[0].runIndex,
        offset: found[0].offset + findText.length,
      });
    }
  }, [findText, matchCase, wholeWord, useWildcard, engine]);

  const handleFindNext = useCallback(() => {
    if (results.length === 0) return;
    const next = (currentResult + 1) % results.length;
    setCurrentResult(next);
    engine.setSelection(results[next], {
      blockId: results[next].blockId,
      runIndex: results[next].runIndex,
      offset: results[next].offset + findText.length,
    });
  }, [results, currentResult, findText, engine]);

  const handleFindPrev = useCallback(() => {
    if (results.length === 0) return;
    const prev = (currentResult - 1 + results.length) % results.length;
    setCurrentResult(prev);
    engine.setSelection(results[prev], {
      blockId: results[prev].blockId,
      runIndex: results[prev].runIndex,
      offset: results[prev].offset + findText.length,
    });
  }, [results, currentResult, findText, engine]);

  const handleReplace = useCallback(() => {
    if (results.length === 0 || currentResult < 0) return;
    engine.replaceText(findText, replaceText, matchCase, wholeWord);
    handleFind();
  }, [findText, replaceText, matchCase, wholeWord, engine, results, currentResult, handleFind]);

  const handleReplaceAll = useCallback(() => {
    if (!findText) return;
    const count = engine.replaceAllText(findText, replaceText, matchCase, wholeWord);
    setResults([]);
    setCurrentResult(-1);
    alert(`Replaced ${count} occurrence(s).`);
  }, [findText, replaceText, matchCase, wholeWord, engine]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'find') handleFindNext();
      else handleFind();
    }
  }, [onClose, mode, handleFindNext, handleFind]);

  return (
    <div className="find-replace-overlay" onClick={onClose}>
      <div className="find-replace-dialog" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="fr-header">
          <div className="fr-tabs">
            <button
              className={`fr-tab ${mode === 'find' ? 'active' : ''}`}
              onClick={() => setMode('find')}
            >
              Find
            </button>
            <button
              className={`fr-tab ${mode === 'replace' ? 'active' : ''}`}
              onClick={() => setMode('replace')}
            >
              Replace
            </button>
          </div>
          <button className="fr-close" onClick={onClose}>✕</button>
        </div>

        <div className="fr-body">
          <div className="fr-row">
            <label className="fr-label">Find:</label>
            <input
              ref={inputRef}
              className="fr-input"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Enter search text..."
            />
            {results.length > 0 && (
              <span className="fr-result-count">
                {currentResult + 1} of {results.length}
              </span>
            )}
          </div>

          {mode === 'replace' && (
            <div className="fr-row">
              <label className="fr-label">Replace:</label>
              <input
                className="fr-input"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace with..."
              />
            </div>
          )}

          <div className="fr-options">
            <label className="fr-option">
              <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} />
              <span>Match Case</span>
            </label>
            <label className="fr-option">
              <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} />
              <span>Whole Words</span>
            </label>
            <label className="fr-option">
              <input type="checkbox" checked={useWildcard} onChange={(e) => setUseWildcard(e.target.checked)} />
              <span>Use Wildcards</span>
            </label>
            <label className="fr-option">
              <input type="checkbox" checked={matchAllWordForms} onChange={(e) => setMatchAllWordForms(e.target.checked)} />
              <span>Match All Word Forms</span>
            </label>
          </div>

          <div className="fr-buttons">
            <button className="fr-btn" onClick={handleFind} disabled={!findText}>
              Find Next
            </button>
            <button className="fr-btn" onClick={handleFindPrev} disabled={results.length === 0}>
              Find Previous
            </button>
            {mode === 'replace' && (
              <>
                <button className="fr-btn" onClick={handleReplace} disabled={results.length === 0 || currentResult < 0}>
                  Replace
                </button>
                <button className="fr-btn" onClick={handleReplaceAll} disabled={!findText}>
                  Replace All
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
