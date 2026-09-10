import React from 'react';
import type { ShiftCalculation } from '../../types';
import { CountdownHero } from '../ShiftCountdown/CountdownHero';
import { TimelineBar } from '../ShiftCountdown/TimelineBar';
import { ShiftInfoRow } from '../ShiftCountdown/ShiftInfoRow';
import { ShiftCompleteView } from '../ShiftCountdown/ShiftCompleteView';

interface ShiftViewProps {
  calculation: ShiftCalculation;
}

export const ShiftView: React.FC<ShiftViewProps> = ({ calculation }) => {
  return (
    <main className="main-view-content shift-view" role="region" aria-label="Shift Overview">
      {calculation.phase === 'completed' ? (
        <ShiftCompleteView calculation={calculation} />
      ) : (
        <>
          <CountdownHero calculation={calculation} />
          <TimelineBar calculation={calculation} />
          <ShiftInfoRow calculation={calculation} />
        </>
      )}
    </main>
  );
};
