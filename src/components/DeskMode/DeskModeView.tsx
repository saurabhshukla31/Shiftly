import React, { useState, useEffect } from 'react';
import type { ShiftCalculation } from '../../types';
import { CloseIcon } from '../Common/Icons';

interface DeskModeViewProps {
  calculation: ShiftCalculation;
  onExit: () => void;
}

export const DeskModeView: React.FC<DeskModeViewProps> = ({
  calculation,
  onExit,
}) => {
  const [showControls, setShowControls] = useState(false);

  // Auto-hide exit button on mouse idle
  useEffect(() => {
    let timeout: number;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = window.setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const {
    phase,
    label,
    countdownFormatted,
    percentageElapsed,
    milestone,
  } = calculation;

  return (
    <div className="desk-mode-overlay" role="region" aria-label="Distraction-Free Desk Mode">
      {/* Subtle Exit Button (fades in on mouse move) */}
      <div className={`desk-mode-header ${showControls ? 'visible' : ''}`}>
        <button
          type="button"
          className="desk-exit-btn"
          onClick={onExit}
          title="Exit Desk Mode (Esc)"
        >
          <CloseIcon size={14} />
          <span>Exit Desk Mode</span>
          <span className="key-hint">Esc</span>
        </button>
      </div>

      {/* Hero Display */}
      <div className="desk-mode-content">
        <div className="state-microlabel-row">
          <span className="state-microlabel">{label}</span>
          {milestone && <span className="milestone-badge">{milestone}</span>}
        </div>

        <div className="desk-countdown-digits tabular" aria-hidden="true">
          {countdownFormatted}
        </div>

        {/* Minimal 2px Timeline */}
        <div className="desk-timeline-track">
          <div
            className="desk-timeline-fill"
            style={{ width: `${phase === 'completed' ? 100 : percentageElapsed}%` }}
          />
        </div>
      </div>
    </div>
  );
};
