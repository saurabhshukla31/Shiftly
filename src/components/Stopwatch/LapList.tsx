import React from 'react';
import type { LapItem } from '../../types';

interface LapListProps {
  laps: LapItem[];
}

export const LapList: React.FC<LapListProps> = ({ laps }) => {
  if (laps.length === 0) return null;

  return (
    <div className="laps-container" role="region" aria-label="Stopwatch Laps">
      {laps.map((lap) => (
        <div key={lap.id} className="lap-row">
          <span className="lap-index">Lap {lap.lapNumber}</span>
          <div>
            <span className="lap-split">{lap.splitFormatted}</span>
            {lap.lapNumber > 1 && (
              <span className="lap-total">({lap.totalFormatted})</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
