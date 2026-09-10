import { useEffect } from 'react';
import type { AppMode } from '../types';

interface KeyboardShortcutsOptions {
  activeMode: AppMode;
  onSetMode: (mode: AppMode) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onRecordLap?: () => void;
  onToggleDeskMode: () => void;
  onToggleShortcutsHelp: () => void;
  isOverlayOpen: boolean;
  onCloseOverlays: () => void;
}

export function useKeyboardShortcuts({
  activeMode,
  onSetMode,
  onToggleTimer,
  onResetTimer,
  onRecordLap,
  onToggleDeskMode,
  onToggleShortcutsHelp,
  isOverlayOpen,
  onCloseOverlays,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing inside any form input
      const target = event.target as HTMLElement | null;
      const isInputActive =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInputActive) {
        if (event.key === 'Escape') {
          target?.blur();
          if (isOverlayOpen) {
            onCloseOverlays();
          }
        }
        return;
      }

      // Handle Escape for modals & Desk Mode
      if (event.key === 'Escape') {
        if (isOverlayOpen || activeMode === 'desk') {
          event.preventDefault();
          onCloseOverlays();
        }
        return;
      }

      // If a modal/drawer is open, don't execute other single-key shortcuts
      if (isOverlayOpen) {
        return;
      }

      switch (event.key) {
        case '1':
          event.preventDefault();
          onSetMode('shift');
          break;
        case '2':
          event.preventDefault();
          onSetMode('pomodoro');
          break;
        case '3':
          event.preventDefault();
          onSetMode('stopwatch');
          break;
        case 'd':
        case 'D':
          event.preventDefault();
          onToggleDeskMode();
          break;
        case '?':
          event.preventDefault();
          onToggleShortcutsHelp();
          break;
        case ' ':
          event.preventDefault();
          onToggleTimer();
          break;
        case 'r':
        case 'R':
          if (['pomodoro', 'stopwatch'].includes(activeMode)) {
            event.preventDefault();
            onResetTimer();
          }
          break;
        case 'l':
        case 'L':
          if (activeMode === 'stopwatch' && onRecordLap) {
            event.preventDefault();
            onRecordLap();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeMode,
    onSetMode,
    onToggleTimer,
    onResetTimer,
    onRecordLap,
    onToggleDeskMode,
    onToggleShortcutsHelp,
    isOverlayOpen,
    onCloseOverlays,
  ]);
}
