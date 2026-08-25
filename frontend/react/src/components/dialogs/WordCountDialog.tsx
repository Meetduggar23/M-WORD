import React from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import './WordCountDialog.css';

interface WordCountDialogProps {
  onClose: () => void;
}

export const WordCountDialog: React.FC<WordCountDialogProps> = ({ onClose }) => {
  const engine = useDocumentEngine();

  const stats = {
    words: engine.getWordCount(),
    characters: engine.getCharacterCount(),
    charactersNoSpaces: engine.getCharacterCountNoSpaces(),
    paragraphs: engine.getParagraphCount(),
    lines: engine.getLineCount(),
    sentences: engine.getSentenceCount(),
    pages: Math.max(1, Math.ceil(engine.getWordCount() / 250)),
  };

  return (
    <div className="word-count-overlay" onClick={onClose}>
      <div className="word-count-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Word Count</h3>
        <div className="wc-stats">
          <div className="wc-stat">
            <span className="wc-label">Pages:</span>
            <span className="wc-value">{stats.pages}</span>
          </div>
          <div className="wc-stat">
            <span className="wc-label">Words:</span>
            <span className="wc-value">{stats.words.toLocaleString()}</span>
          </div>
          <div className="wc-stat">
            <span className="wc-label">Characters (no spaces):</span>
            <span className="wc-value">{stats.charactersNoSpaces.toLocaleString()}</span>
          </div>
          <div className="wc-stat">
            <span className="wc-label">Characters:</span>
            <span className="wc-value">{stats.characters.toLocaleString()}</span>
          </div>
          <div className="wc-stat">
            <span className="wc-label">Paragraphs:</span>
            <span className="wc-value">{stats.paragraphs}</span>
          </div>
          <div className="wc-stat">
            <span className="wc-label">Lines:</span>
            <span className="wc-value">{stats.lines}</span>
          </div>
          <div className="wc-stat">
            <span className="wc-label">Sentences:</span>
            <span className="wc-value">{stats.sentences}</span>
          </div>
        </div>
        <div className="wc-footer">
          <button className="wc-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
