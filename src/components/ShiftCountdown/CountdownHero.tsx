import React from 'react';
import type { ShiftCalculation } from '../../types';

interface CountdownHeroProps {
  calculation: ShiftCalculation;
}

export const CountdownHero: React.FC<CountdownHeroProps> = ({ calculation }) => {
  const {
    phase,
    label,
    countdownFormatted,
    formattedRemaining,
    milestone,
  } = calculation;

  if (phase === 'completed') {
    return null; // Rendered by ShiftCompleteView
  }

  const captionText =
    phase === 'during' ? 'left in your shift' : 'until your shift begins';

  const accessibleSummary =
    phase === 'during'
      ? `${formattedRemaining} left in your shift`
      : `Shift starts in ${countdownFormatted}`;

  return (
    <div className="countdown-container" aria-label={accessibleSummary}>
      <div className="state-microlabel-row">
        <span className="state-microlabel">{label}</span>
        {milestone && <span className="milestone-badge">{milestone}</span>}
      </div>

      <div className="countdown-digits tabular" aria-hidden="true">
        {countdownFormatted}
      </div>

      <div className="countdown-caption">{captionText}</div>
    </div>
  );
};
