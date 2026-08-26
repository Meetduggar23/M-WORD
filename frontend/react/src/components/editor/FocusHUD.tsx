import React, { useEffect, useState } from 'react';
import { Target, Timer } from 'lucide-react';
import { getWordsToday, addWordsToday } from '../../features/history/writingGoal';
import './FocusHUD.css';

const FocusHUD: React.FC<{ sessionWords: number; sessionSeconds: number; dailyGoal: number }> = ({
  sessionWords, sessionSeconds, dailyGoal,
}) => {
  const [wordsToday, setWordsToday] = useState(getWordsToday());

  useEffect(() => {
    if (sessionWords > 0) setWordsToday(addWordsToday(0));
  }, [sessionWords]);

  const minutes = Math.floor(sessionSeconds / 60);
  const timeLabel = `${minutes}:${String(sessionSeconds % 60).padStart(2, '0')}`;
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round((wordsToday / dailyGoal) * 100)) : 0;
  const blocks = 14;
  const filled = Math.round((goalPct / 100) * blocks);

  return (
    <div className="focus-hud" role="status" aria-label="Writing progress">
      <div className="fh-row">
        <Timer size={12} strokeWidth={2.2} />
        <span className="fh-time">{timeLabel}</span>
        <span className="fh-words">{sessionWords.toLocaleString()} words this session</span>
      </div>
      {dailyGoal > 0 && (
        <div className="fh-goal">
          <div className="fh-goal-label">
            <Target size={12} strokeWidth={2.2} />
            {wordsToday.toLocaleString()} / {dailyGoal.toLocaleString()} today
          </div>
          <div className="fh-goal-track" aria-hidden="true">
            {Array.from({ length: blocks }, (_, i) => (
              <span key={i} className={`fh-block${i < filled ? ' filled' : ''}`} />
            ))}
          </div>
          <span className="fh-goal-pct">{goalPct}%</span>
        </div>
      )}
    </div>
  );
};

export default FocusHUD;
