import React, { useState, useCallback } from 'react';
import type { AppMode, ShiftSettings, PomodoroConfig } from './types';
import { loadSettings, saveSettings } from './utils/storage';
import { useShiftTimer } from './hooks/useShiftTimer';
import { usePomodoro } from './hooks/usePomodoro';
import { useStopwatch } from './hooks/useStopwatch';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Components
import { Header } from './components/Header/Header';
import { ModeSwitcher } from './components/ModeSwitcher';
import { ShiftView } from './components/Shift/ShiftView';
import { PomodoroView } from './components/Pomodoro/PomodoroView';
import { StopwatchView } from './components/Stopwatch/StopwatchView';
import { DeskModeView } from './components/DeskMode/DeskModeView';
import { KeyboardShortcutsModal } from './components/Common/KeyboardShortcutsModal';
import { SettingsSheet } from './components/Settings/SettingsSheet';

export const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>('shift');
  const [settings, setSettings] = useState<ShiftSettings>(loadSettings);

  // Overlay / Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  // Core Workday Hooks
  const shiftCalc = useShiftTimer(settings);
  const pomodoro = usePomodoro(settings.notificationsEnabled);
  const stopwatch = useStopwatch();

  // Timer Shortcut Handlers
  const handleToggleTimer = useCallback(() => {
    if (activeMode === 'pomodoro') {
      pomodoro.toggle();
    } else if (activeMode === 'stopwatch') {
      stopwatch.toggle();
    }
  }, [activeMode, pomodoro, stopwatch]);

  const handleResetTimer = useCallback(() => {
    if (activeMode === 'pomodoro') {
      pomodoro.reset();
    } else if (activeMode === 'stopwatch') {
      stopwatch.reset();
    }
  }, [activeMode, pomodoro, stopwatch]);

  const handleRecordLap = useCallback(() => {
    if (activeMode === 'stopwatch') {
      stopwatch.recordLap();
    }
  }, [activeMode, stopwatch]);

  const isAnyOverlayOpen = isSettingsOpen || isShortcutsHelpOpen;

  const handleCloseOverlays = useCallback(() => {
    setIsSettingsOpen(false);
    setIsShortcutsHelpOpen(false);
    if (activeMode === 'desk') {
      setActiveMode('shift');
    }
  }, [activeMode]);

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    activeMode,
    onSetMode: setActiveMode,
    onToggleTimer: handleToggleTimer,
    onResetTimer: handleResetTimer,
    onRecordLap: handleRecordLap,
    onToggleDeskMode: () => setActiveMode((prev) => (prev === 'desk' ? 'shift' : 'desk')),
    onToggleShortcutsHelp: () => setIsShortcutsHelpOpen((prev) => !prev),
    isOverlayOpen: isAnyOverlayOpen,
    onCloseOverlays: handleCloseOverlays,
  });

  const handleSaveSettings = (newSettings: ShiftSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSavePomodoroConfig = (newConfig: PomodoroConfig) => {
    pomodoro.setConfig(newConfig);
  };

  // Full Screen Desk Mode
  if (activeMode === 'desk') {
    return (
      <DeskModeView
        calculation={shiftCalc}
        onExit={() => setActiveMode('shift')}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Subtle Ambient Glow */}
      <div
        className={`ambient-glow ${activeMode === 'pomodoro' ? 'warm' : 'neutral'}`}
        aria-hidden="true"
      />

      <div className="app-container">
        {/* Minimal Header */}
        <Header
          onEnterDeskMode={() => setActiveMode('desk')}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Mode Switcher */}
        <ModeSwitcher
          currentMode={activeMode}
          onSelectMode={(mode) => setActiveMode(mode)}
        />

        {/* Mode Views */}
        {activeMode === 'shift' && (
          <ShiftView calculation={shiftCalc} />
        )}

        {activeMode === 'pomodoro' && (
          <PomodoroView
            phase={pomodoro.phase}
            remainingMillis={pomodoro.remainingMillis}
            progressFraction={pomodoro.progressFraction}
            isRunning={pomodoro.isRunning}
            sessionNumber={pomodoro.sessionNumber}
            onToggle={pomodoro.toggle}
            onReset={pomodoro.reset}
            onSkip={pomodoro.skip}
          />
        )}

        {activeMode === 'stopwatch' && (
          <StopwatchView
            isRunning={stopwatch.isRunning}
            elapsedMillis={stopwatch.elapsedMillis}
            laps={stopwatch.laps}
            onToggle={stopwatch.toggle}
            onReset={stopwatch.reset}
            onRecordLap={stopwatch.recordLap}
          />
        )}

        {/* Minimal Shortcuts Hint Footer */}
        <footer className="desktop-shortcuts-hint" aria-hidden="true">
          <div className="shortcut-item">
            <span className="kbd-badge">Space</span>
            <span>{activeMode === 'shift' ? 'Mode' : 'Start/Pause'}</span>
          </div>
          <div className="shortcut-item">
            <span className="kbd-badge">D</span>
            <span>Desk Mode</span>
          </div>
          <div className="shortcut-item">
            <span className="kbd-badge">?</span>
            <span>Shortcuts</span>
          </div>
        </footer>
      </div>

      {/* Keyboard Shortcuts Guide */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />

      {/* Settings Modal Sheet */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        settings={settings}
        pomodoroConfig={pomodoro.config}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
        onSavePomodoroConfig={handleSavePomodoroConfig}
      />
    </div>
  );
};

export default App;
