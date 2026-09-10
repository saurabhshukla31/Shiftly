import React from 'react';
import type { ShiftCalculation } from '../../types';

interface ShiftInfoRowProps {
  calculation: ShiftCalculation;
}

export const ShiftInfoRow: React.FC<ShiftInfoRowProps> = ({ calculation }) => {
  const {
    formattedShiftRange,
    formattedDuration,
    formattedRemaining,
    percentageRemaining,
    phase,
  } = calculation;

  return (
    <section className="shift-info-grid" aria-label="Shift Details">
      <div className="shift-info-cell">
        <span className="info-label">Shift</span>
        <span className="info-value">{formattedShiftRange}</span>
      </div>

      <div className="shift-info-cell">
        <span className="info-label">Duration</span>
        <span className="info-value">{formattedDuration}</span>
      </div>

      <div className="shift-info-cell">
        <span className="info-label">Time Left</span>
        <span className="info-value highlight">
          {phase === 'completed' ? '0h 00m' : formattedRemaining}
        </span>
      </div>

      <div className="shift-info-cell">
        <span className="info-label">Remaining</span>
        <span className="info-value">
          {phase === 'completed' ? '0%' : `${percentageRemaining}%`}
        </span>
      </div>
    </section>
  );
};
