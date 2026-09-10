import React from 'react';
import type { PomodoroPhase } from '../../types';
import { formatPomodoroTime } from '../../utils/format';
import { PomodoroRing } from './PomodoroRing';
import { PlayIcon, PauseIcon, ResetIcon, SkipIcon } from '../Common/Icons';

interface PomodoroViewProps {
  phase: PomodoroPhase;
  remainingMillis: number;
  progressFraction: number;
  isRunning: boolean;
  sessionNumber: number;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  phase,
  remainingMillis,
  progressFraction,
  isRunning,
  sessionNumber,
  onToggle,
  onReset,
  onSkip,
}) => {
  const formattedTime = formatPomodoroTime(remainingMillis);

  const phaseLabel =
    phase === 'focus' ? 'FOCUS' : phase === 'break' ? 'BREAK' : 'LONG BREAK';

  return (
    <main className="main-view-content pomodoro-view" role="region" aria-label="Pomodoro Timer">
      <PomodoroRing progressFraction={progressFraction} phase={phase}>
        <div className="state-microlabel">{phaseLabel}</div>
        <div className="pomodoro-time tabular" aria-label={`${phaseLabel}: ${formattedTime}`}>
          {formattedTime}
        </div>
        <div className="pomodoro-session-badge">Pomodoro {sessionNumber}</div>
      </PomodoroRing>

      <div className="controls-row">
        <button
          className="control-btn secondary"
          onClick={onReset}
          aria-label="Reset Pomodoro Phase"
        >
          <ResetIcon size={16} />
          <span>Reset</span>
        </button>

        <button
          className={`control-btn ${isRunning ? 'running' : 'primary'}`}
          onClick={onToggle}
          aria-label={isRunning ? 'Pause Pomodoro' : 'Start Pomodoro'}
        >
          {isRunning ? (
            <>
              <PauseIcon size={16} />
              <span>Pause</span>
            </>
          ) : (
            <>
              <PlayIcon size={16} />
              <span>Start</span>
            </>
          )}
        </button>

        <button
          className="control-btn secondary"
          onClick={onSkip}
          aria-label="Skip to Next Phase"
        >
          <SkipIcon size={16} />
          <span>Skip</span>
        </button>
      </div>
    </main>
  );
};
