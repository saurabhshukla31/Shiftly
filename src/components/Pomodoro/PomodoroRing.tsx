import React from 'react';
import type { PomodoroPhase } from '../../types';

interface PomodoroRingProps {
  progressFraction: number; // 0 to 1
  phase: PomodoroPhase;
  children: React.ReactNode;
}

export const PomodoroRing: React.FC<PomodoroRingProps> = ({
  progressFraction,
  children,
}) => {
  const size = 260;
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressFraction);

  return (
    <div className="pomodoro-ring-wrapper">
      <svg
        className="pomodoro-svg"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="pomodoro-bg-circle"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="pomodoro-progress-circle"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="pomodoro-center-content">{children}</div>
    </div>
  );
};
