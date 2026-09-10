import { useState, useEffect, useCallback, useRef } from 'react';
import type { PomodoroConfig, PomodoroPhase, PomodoroState } from '../types';
import {
  loadPomodoroConfig,
  savePomodoroConfig,
  loadPomodoroState,
  savePomodoroState,
} from '../utils/storage';
import { sendNotification } from '../utils/notifications';

export function usePomodoro(notificationsEnabled: boolean = false) {
  const [config, setConfigState] = useState<PomodoroConfig>(loadPomodoroConfig);
  const [state, setState] = useState<PomodoroState>(loadPomodoroState);
  const [remainingMillis, setRemainingMillis] = useState<number>(() => {
    const loaded = loadPomodoroState();
    if (loaded.isRunning && loaded.phaseEndTimestamp) {
      return Math.max(0, loaded.phaseEndTimestamp - Date.now());
    }
    return loaded.pausedRemainingMillis;
  });

  const stateRef = useRef(state);
  const configRef = useRef(config);

  useEffect(() => {
    stateRef.current = state;
    configRef.current = config;
  }, [state, config]);


  const getPhaseDurationMillis = useCallback((phase: PomodoroPhase, cfg: PomodoroConfig) => {
    switch (phase) {
      case 'focus':
        return cfg.focusMinutes * 60 * 1000;
      case 'break':
        return cfg.shortBreakMinutes * 60 * 1000;
      case 'longBreak':
        return cfg.longBreakMinutes * 60 * 1000;
    }
  }, []);

  // Compute next phase and session count
  const getNextPhaseAndSession = useCallback((
    currentPhase: PomodoroPhase,
    currentSession: number,
    cfg: PomodoroConfig
  ): { nextPhase: PomodoroPhase; nextSession: number } => {
    if (currentPhase === 'focus') {
      if (currentSession % cfg.sessionsBeforeLongBreak === 0) {
        return { nextPhase: 'longBreak', nextSession: currentSession };
      }
      return { nextPhase: 'break', nextSession: currentSession };
    } else {
      // Coming from break or longBreak
      return { nextPhase: 'focus', nextSession: currentSession + 1 };
    }
  }, []);

  // Update helper that syncs to localStorage
  const updateStateAndPersist = useCallback((newState: PomodoroState) => {
    setState(newState);
    savePomodoroState(newState);
  }, []);

  // Check and process sleep catchup / completion
  const checkPhaseCompletion = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState.isRunning || !currentState.phaseEndTimestamp) {
      return;
    }

    const now = Date.now();
    if (now >= currentState.phaseEndTimestamp) {
      // Completed current phase!
      const currentConfig = configRef.current;
      const { nextPhase, nextSession } = getNextPhaseAndSession(
        currentState.phase,
        currentState.sessionNumber,
        currentConfig
      );
      const nextDuration = getPhaseDurationMillis(nextPhase, currentConfig);

      if (notificationsEnabled) {
        const title = currentState.phase === 'focus' ? 'Focus Session Complete' : 'Break Ended';
        const body =
          nextPhase === 'focus'
            ? `Ready for Pomodoro ${nextSession}?`
            : nextPhase === 'longBreak'
            ? 'Time for a well-deserved long break.'
            : 'Take a quick 5-minute break.';
        sendNotification(title, body);
      }

      // Auto-transition to next phase (paused awaiting user start, or running)
      const nextState: PomodoroState = {
        phase: nextPhase,
        phaseDurationMillis: nextDuration,
        phaseEndTimestamp: null, // pause at start of next phase for deliberate transition
        isRunning: false,
        pausedRemainingMillis: nextDuration,
        sessionNumber: nextSession,
      };

      updateStateAndPersist(nextState);
      setRemainingMillis(nextDuration);
    } else {
      setRemainingMillis(Math.max(0, currentState.phaseEndTimestamp - now));
    }
  }, [getNextPhaseAndSession, getPhaseDurationMillis, notificationsEnabled, updateStateAndPersist]);

  // Main tick loop
  useEffect(() => {
    if (!state.isRunning) return;

    checkPhaseCompletion();

    const intervalId = setInterval(checkPhaseCompletion, 250);

    const handleSync = () => {
      checkPhaseCompletion();
    };

    window.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [state.isRunning, checkPhaseCompletion]);

  const start = useCallback(() => {
    if (state.isRunning) return;
    const now = Date.now();
    const durationLeft = state.pausedRemainingMillis > 0 ? state.pausedRemainingMillis : state.phaseDurationMillis;
    const newEndTimestamp = now + durationLeft;

    const newState: PomodoroState = {
      ...state,
      isRunning: true,
      phaseEndTimestamp: newEndTimestamp,
      pausedRemainingMillis: durationLeft,
    };
    updateStateAndPersist(newState);
    setRemainingMillis(durationLeft);
  }, [state, updateStateAndPersist]);

  const pause = useCallback(() => {
    if (!state.isRunning) return;
    const now = Date.now();
    const left = state.phaseEndTimestamp ? Math.max(0, state.phaseEndTimestamp - now) : 0;

    const newState: PomodoroState = {
      ...state,
      isRunning: false,
      phaseEndTimestamp: null,
      pausedRemainingMillis: left,
    };
    updateStateAndPersist(newState);
    setRemainingMillis(left);
  }, [state, updateStateAndPersist]);

  const toggle = useCallback(() => {
    if (state.isRunning) {
      pause();
    } else {
      start();
    }
  }, [state.isRunning, pause, start]);

  const reset = useCallback(() => {
    const duration = getPhaseDurationMillis(state.phase, config);
    const newState: PomodoroState = {
      ...state,
      isRunning: false,
      phaseEndTimestamp: null,
      phaseDurationMillis: duration,
      pausedRemainingMillis: duration,
    };
    updateStateAndPersist(newState);
    setRemainingMillis(duration);
  }, [state, config, getPhaseDurationMillis, updateStateAndPersist]);

  const skip = useCallback(() => {
    const { nextPhase, nextSession } = getNextPhaseAndSession(
      state.phase,
      state.sessionNumber,
      config
    );
    const nextDuration = getPhaseDurationMillis(nextPhase, config);

    const newState: PomodoroState = {
      phase: nextPhase,
      phaseDurationMillis: nextDuration,
      phaseEndTimestamp: null,
      isRunning: false,
      pausedRemainingMillis: nextDuration,
      sessionNumber: nextSession,
    };
    updateStateAndPersist(newState);
    setRemainingMillis(nextDuration);
  }, [state, config, getNextPhaseAndSession, getPhaseDurationMillis, updateStateAndPersist]);

  const setConfig = useCallback((newConfig: PomodoroConfig) => {
    setConfigState(newConfig);
    savePomodoroConfig(newConfig);
    
    // If not running, adjust current phase remaining
    if (!stateRef.current.isRunning) {
      const dur = getPhaseDurationMillis(stateRef.current.phase, newConfig);
      setState((prev) => ({
        ...prev,
        phaseDurationMillis: dur,
        pausedRemainingMillis: dur,
      }));
      setRemainingMillis(dur);
    }
  }, [getPhaseDurationMillis]);

  const totalPhaseDuration = state.phaseDurationMillis || 1;
  const progressFraction = Math.max(0, Math.min(1, 1 - remainingMillis / totalPhaseDuration));

  return {
    state,
    config,
    remainingMillis,
    progressFraction,
    isRunning: state.isRunning,
    phase: state.phase,
    sessionNumber: state.sessionNumber,
    start,
    pause,
    toggle,
    reset,
    skip,
    setConfig,
  };
}
