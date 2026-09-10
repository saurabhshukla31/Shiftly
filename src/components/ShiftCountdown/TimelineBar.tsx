import React from 'react';
import type { ShiftCalculation } from '../../types';

interface TimelineBarProps {
  calculation: ShiftCalculation;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({ calculation }) => {
  const { percentageElapsed, percentageRemaining, formattedShiftRange, phase } = calculation;

  const [startTime, endTime] = formattedShiftRange.split(' → ');

  return (
    <div className="timeline-container" aria-hidden="true">
      <div className="timeline-track">
        <div
          className="timeline-fill"
          style={{
            width: `${phase === 'completed' ? 100 : percentageElapsed}%`,
          }}
        />
      </div>
      <div className="timeline-labels">
        <span>{startTime}</span>
        <span className="timeline-now-label">
          {phase === 'during' ? `${percentageRemaining}% remaining` : ''}
        </span>
        <span>{endTime}</span>
      </div>
    </div>
  );
};
