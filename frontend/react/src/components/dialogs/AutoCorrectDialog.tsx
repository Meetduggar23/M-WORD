import React, { useState } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import './AutoCorrectDialog.css';

interface AutoCorrectDialogProps {
  onClose: () => void;
}

export const AutoCorrectDialog: React.FC<AutoCorrectDialogProps> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const [trigger, setTrigger] = useState('');
  const [replacement, setReplacement] = useState('');

  const handleAdd = () => {
    if (trigger.trim() && replacement.trim()) {
      engine.addAutoCorrectEntry(trigger.trim(), replacement.trim());
      setTrigger('');
      setReplacement('');
    }
  };

  const handleDelete = (t: string) => {
    engine.removeAutoCorrectEntry(t);
  };

  return (
    <div className="autocorrect-overlay" onClick={onClose}>
      <div className="autocorrect-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>AutoCorrect Options</h3>
        <p className="ac-subtitle">Automatically correct text as you type.</p>

        <div className="ac-add">
          <div className="ac-row">
            <label>Replace:</label>
            <input
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="ac-input"
              placeholder="Text to replace..."
            />
          </div>
          <div className="ac-row">
            <label>With:</label>
            <input
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              className="ac-input"
              placeholder="Replacement text..."
            />
          </div>
          <div className="ac-add-btns">
            <button className="ac-btn" onClick={handleAdd} disabled={!trigger.trim() || !replacement.trim()}>Add</button>
          </div>
        </div>

        <div className="ac-list">
          <h4>Entries ({engine.autoCorrectEntries.length})</h4>
          <div className="ac-list-scroll">
            {engine.autoCorrectEntries.map((entry, i) => (
              <div key={i} className="ac-entry">
                <span className="ac-trigger">{entry.trigger}</span>
                <span className="ac-arrow">→</span>
                <span className="ac-replacement">{entry.replacement}</span>
                <button className="ac-delete" onClick={() => handleDelete(entry.trigger)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="ac-footer">
          <button className="ac-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
