import React from 'react';
import type { LapItem } from '../../types';
import { formatStopwatchTime } from '../../utils/format';
import { LapList } from './LapList';
import { PlayIcon, PauseIcon, ResetIcon, LapIcon } from '../Common/Icons';

interface StopwatchViewProps {
  isRunning: boolean;
  elapsedMillis: number;
  laps: LapItem[];
  onToggle: () => void;
  onReset: () => void;
  onRecordLap: () => void;
}

export const StopwatchView: React.FC<StopwatchViewProps> = ({
  isRunning,
  elapsedMillis,
  laps,
  onToggle,
  onReset,
  onRecordLap,
}) => {
  const { mainTime, centis } = formatStopwatchTime(elapsedMillis);

  return (
    <main className="main-view-content stopwatch-view" role="region" aria-label="Stopwatch">
      <div className="stopwatch-display">
        <span className="stopwatch-main-time tabular">{mainTime}</span>
        <span className="stopwatch-centis tabular">{centis}</span>
      </div>

      <div className="controls-row">
        <button
          className="control-btn secondary"
          onClick={onReset}
          disabled={elapsedMillis === 0 && !isRunning}
          aria-label="Reset Stopwatch"
        >
          <ResetIcon size={16} />
          <span>Reset</span>
        </button>

        <button
          className={`control-btn ${isRunning ? 'running' : 'primary'}`}
          onClick={onToggle}
          aria-label={isRunning ? 'Pause Stopwatch' : 'Start Stopwatch'}
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
          onClick={onRecordLap}
          disabled={!isRunning}
          aria-label="Record Lap"
        >
          <LapIcon size={16} />
          <span>Lap</span>
        </button>
      </div>

      <LapList laps={laps} />
    </main>
  );
};
