import { useState, useEffect, useCallback, useRef } from 'react';
import type { LapItem } from '../types';
import { formatLapTime } from '../utils/format';

export function useStopwatch() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMillis, setElapsedMillis] = useState(0);
  const [laps, setLaps] = useState<LapItem[]>([]);

  const startedAtRef = useRef<number | null>(null);
  const accumulatedPauseRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);
  const lastElapsedRef = useRef<number>(0);

  const calculateElapsed = useCallback(() => {
    if (!isRunning || startedAtRef.current === null) {
      return lastElapsedRef.current;
    }
    return Math.max(0, Date.now() - startedAtRef.current - accumulatedPauseRef.current);
  }, [isRunning]);

  // Tick loop while running
  useEffect(() => {
    if (!isRunning) return;

    let animFrameId: number;
    const tick = () => {
      const current = calculateElapsed();
      lastElapsedRef.current = current;
      setElapsedMillis(current);
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    const handleSync = () => {
      const current = calculateElapsed();
      lastElapsedRef.current = current;
      setElapsedMillis(current);
    };

    window.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [isRunning, calculateElapsed]);

  const start = useCallback(() => {
    if (isRunning) return;
    const now = Date.now();
    if (startedAtRef.current === null) {
      // Fresh start
      startedAtRef.current = now;
      accumulatedPauseRef.current = 0;
      pauseStartRef.current = null;
    } else if (pauseStartRef.current !== null) {
      // Resuming from pause
      accumulatedPauseRef.current += now - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setIsRunning(true);
  }, [isRunning]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    const now = Date.now();
    pauseStartRef.current = now;
    const current = calculateElapsed();
    lastElapsedRef.current = current;
    setElapsedMillis(current);
    setIsRunning(false);
  }, [isRunning, calculateElapsed]);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  const reset = useCallback(() => {
    setIsRunning(false);
    startedAtRef.current = null;
    accumulatedPauseRef.current = 0;
    pauseStartRef.current = null;
    lastElapsedRef.current = 0;
    setElapsedMillis(0);
    setLaps([]);
  }, []);

  const recordLap = useCallback(() => {
    const currentTotal = calculateElapsed();
    if (currentTotal === 0) return;

    setLaps((prevLaps) => {
      const lapNumber = prevLaps.length + 1;
      const prevTotal = prevLaps.length > 0 ? prevLaps[0].totalMillis : 0;
      const splitMillis = Math.max(0, currentTotal - prevTotal);

      const newLap: LapItem = {
        id: `lap-${lapNumber}-${Date.now()}`,
        lapNumber,
        lapTimestamp: Date.now(),
        splitMillis,
        totalMillis: currentTotal,
        splitFormatted: formatLapTime(splitMillis),
        totalFormatted: formatLapTime(currentTotal),
      };

      // Most recent lap at top of list
      return [newLap, ...prevLaps];
    });
  }, [calculateElapsed]);

  return {
    isRunning,
    elapsedMillis,
    laps,
    start,
    pause,
    toggle,
    reset,
    recordLap,
  };
}
