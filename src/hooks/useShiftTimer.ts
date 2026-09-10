import { useState, useEffect, useCallback, useRef } from 'react';
import type { ShiftSettings, ShiftCalculation } from '../types';
import { calculateShift } from '../utils/timezone';
import { sendNotification } from '../utils/notifications';

export function useShiftTimer(settings: ShiftSettings) {
  const [calculation, setCalculation] = useState<ShiftCalculation>(() =>
    calculateShift(settings)
  );

  const prevPhaseRef = useRef(calculation.phase);
  const prevMilestoneRef = useRef(calculation.milestone);

  const update = useCallback(() => {
    const result = calculateShift(settings);
    setCalculation(result);

    if (prevPhaseRef.current === 'during' && result.phase === 'completed') {
      if (settings.notificationsEnabled) {
        sendNotification('Shift Complete', "Nice work! You've finished your shift for today.");
      }
    }
    prevPhaseRef.current = result.phase;

    if (
      settings.notificationsEnabled &&
      result.milestone &&
      result.milestone !== prevMilestoneRef.current
    ) {
      if (result.milestone === 'Final hour' || result.milestone === '30 minutes remaining') {
        sendNotification('Shift Milestone', result.milestone);
      }
    }
    prevMilestoneRef.current = result.milestone;
  }, [settings]);

  useEffect(() => {
    const intervalId = setInterval(update, 500);


    const handleSync = () => update();
    window.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [update]);

  return calculation;
}
