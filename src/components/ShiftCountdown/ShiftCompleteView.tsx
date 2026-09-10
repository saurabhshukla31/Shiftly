import React, { useState } from 'react';
import type { ShiftCalculation } from '../../types';

interface ShiftCompleteViewProps {
  calculation: ShiftCalculation;
}

export const ShiftCompleteView: React.FC<ShiftCompleteViewProps> = ({ calculation }) => {
  const [dayRating, setDayRating] = useState<'good' | 'okay' | 'rough' | null>(null);

  return (
    <div className="completed-state" aria-label="Shift complete. You made it through today.">
      <div className="state-microlabel">SHIFT COMPLETE</div>
      <div className="completed-digits tabular">00:00:00</div>
      <div className="completed-duration">{calculation.formattedDuration} completed</div>
      <div className="completed-subtext">You made it through today.</div>

      {/* Gentle Optional End-of-Shift Check-in */}
      <div className="completion-ritual">
        <span className="ritual-title">How was today?</span>
        <div className="ritual-buttons">
          <button
            className={`ritual-btn ${dayRating === 'good' ? 'selected' : ''}`}
            onClick={() => setDayRating('good')}
          >
            Good
          </button>
          <button
            className={`ritual-btn ${dayRating === 'okay' ? 'selected' : ''}`}
            onClick={() => setDayRating('okay')}
          >
            Okay
          </button>
          <button
            className={`ritual-btn ${dayRating === 'rough' ? 'selected' : ''}`}
            onClick={() => setDayRating('rough')}
          >
            Rough
          </button>
        </div>
        {dayRating && (
          <span className="ritual-response">Take some rest. See you tomorrow.</span>
        )}
      </div>
    </div>
  );
};
