import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ShiftSettings, PomodoroConfig } from '../../types';
import { TimezoneSelect } from './TimezoneSelect';
import { CloseIcon, CheckIcon, SettingsIcon, TargetIcon } from '../Common/Icons';
import {
  isNotificationSupported,
  requestNotificationPermission,
} from '../../utils/notifications';

interface SettingsSheetProps {
  isOpen: boolean;
  settings: ShiftSettings;
  pomodoroConfig: PomodoroConfig;
  onClose: () => void;
  onSaveSettings: (settings: ShiftSettings) => void;
  onSavePomodoroConfig: (config: PomodoroConfig) => void;
}

const SHIFT_PRESETS = [
  { label: '9:00 AM – 5:00 PM', start: '09:00', end: '17:00' },
  { label: '10:00 AM – 6:30 PM', start: '10:00', end: '18:30' },
  { label: '12:00 PM – 8:30 PM', start: '12:00', end: '20:30' },
  { label: '2:30 PM – 11:00 PM', start: '14:30', end: '23:00' },
];

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  settings,
  pomodoroConfig,
  onClose,
  onSaveSettings,
  onSavePomodoroConfig,
}) => {
  const [localSettings, setLocalSettings] = useState<ShiftSettings>(() => ({ ...settings }));
  const [localPomodoro, setLocalPomodoro] = useState<PomodoroConfig>(() => ({ ...pomodoroConfig }));
  const [error, setError] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setLocalSettings({ ...settings });
      setLocalPomodoro({ ...pomodoroConfig });
      setError(null);
      setNotificationMsg(null);
    }
  }


  const handleSave = useCallback(() => {
    if (localSettings.shiftStart === localSettings.shiftEnd) {
      setError('Shift start and end times cannot be identical.');
      return;
    }
    setError(null);
    onSaveSettings(localSettings);
    onSavePomodoroConfig(localPomodoro);
    onClose();
  }, [localSettings, localPomodoro, onSaveSettings, onSavePomodoroConfig, onClose]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to save, Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSave]);

  if (!isOpen) return null;

  // Calculate preview duration of shift
  const calculateShiftDurationPreview = (): string => {
    if (!localSettings || !localSettings.shiftStart || !localSettings.shiftEnd) return '8h 30m';
    const [sH, sM] = localSettings.shiftStart.split(':').map(Number);
    const [eH, eM] = localSettings.shiftEnd.split(':').map(Number);
    if (isNaN(sH) || isNaN(eH)) return '';
    let startMin = sH * 60 + (sM || 0);
    let endMin = eH * 60 + (eM || 0);
    if (endMin <= startMin) endMin += 24 * 60; // Overnight
    const diff = endMin - startMin;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
  };

  const handleNotificationToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      if (!isNotificationSupported()) {
        setNotificationMsg('Notifications are not supported by your browser.');
        return;
      }
      const granted = await requestNotificationPermission();
      if (granted) {
        setLocalSettings((prev) => ({ ...prev, notificationsEnabled: true }));
        setNotificationMsg('Notifications enabled.');
      } else {
        setLocalSettings((prev) => ({ ...prev, notificationsEnabled: false }));
        setNotificationMsg('Permission was denied in browser settings.');
      }
    } else {
      setLocalSettings((prev) => ({ ...prev, notificationsEnabled: false }));
      setNotificationMsg(null);
    }
  };

  const handleApplyPreset = (start: string, end: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      shiftStart: start,
      shiftEnd: end,
    }));
  };


  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="settings-sheet-v2" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header-v2">
          <div className="settings-title-group">
            <SettingsIcon size={18} />
            <h2 id="settings-dialog-title" className="settings-title">
              Settings
            </h2>
          </div>
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {error && (
          <div className="settings-error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="settings-scroll-content">
          {/* Section 1: Shift Schedule */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-title">Shift Schedule</span>
              <span className="settings-card-badge tabular">
                {calculateShiftDurationPreview()} total
              </span>
            </div>

            {/* Quick Shift Presets Grid */}
            <div className="settings-preset-grid">
              {SHIFT_PRESETS.map((p) => {
                const isSelected =
                  localSettings.shiftStart === p.start && localSettings.shiftEnd === p.end;
                return (
                  <button
                    key={p.label}
                    type="button"
                    className={`settings-preset-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleApplyPreset(p.start, p.end)}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="settings-card-rows">
              <div className="settings-row-v2">
                <label htmlFor="shift-start" className="settings-row-label">
                  Shift Start
                </label>
                <input
                  id="shift-start"
                  type="time"
                  className="settings-time-input tabular"
                  value={localSettings.shiftStart}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, shiftStart: e.target.value })
                  }
                />
              </div>

              <div className="settings-row-v2">
                <label htmlFor="shift-end" className="settings-row-label">
                  Shift End
                </label>
                <input
                  id="shift-end"
                  type="time"
                  className="settings-time-input tabular"
                  value={localSettings.shiftEnd}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, shiftEnd: e.target.value })
                  }
                />
              </div>

              <div className="settings-row-v2">
                <label htmlFor="timezone-select" className="settings-row-label">
                  Timezone
                </label>
                <TimezoneSelect
                  value={localSettings.timezone}
                  onChange={(tz) => setLocalSettings({ ...localSettings, timezone: tz })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Focus & Pomodoro */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-header-left">
                <TargetIcon size={14} />
                <span className="settings-card-title">Focus & Pomodoro</span>
              </div>
            </div>

            <div className="settings-card-rows">
              {/* Focus Duration */}
              <div className="settings-row-v2">
                <label htmlFor="focus-dur" className="settings-row-label">
                  Default Focus Session
                </label>
                <div className="settings-stepper-control">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        defaultFocusMinutes: Math.max(5, (prev.defaultFocusMinutes || 25) - 5),
                      }))
                    }
                    aria-label="Decrease focus duration"
                  >
                    −
                  </button>
                  <span className="stepper-val tabular">
                    {localSettings.defaultFocusMinutes || 25}m
                  </span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        defaultFocusMinutes: Math.min(180, (prev.defaultFocusMinutes || 25) + 5),
                      }))
                    }
                    aria-label="Increase focus duration"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Pomodoro Focus */}
              <div className="settings-row-v2">
                <label htmlFor="pomo-focus" className="settings-row-label">
                  Pomodoro Focus Block
                </label>
                <div className="settings-stepper-control">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setLocalPomodoro((prev) => ({
                        ...prev,
                        focusMinutes: Math.max(5, (prev.focusMinutes || 25) - 5),
                      }))
                    }
                    aria-label="Decrease pomodoro focus"
                  >
                    −
                  </button>
                  <span className="stepper-val tabular">
                    {localPomodoro.focusMinutes || 25}m
                  </span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setLocalPomodoro((prev) => ({
                        ...prev,
                        focusMinutes: Math.min(120, (prev.focusMinutes || 25) + 5),
                      }))
                    }
                    aria-label="Increase pomodoro focus"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Short Break */}
              <div className="settings-row-v2">
                <label htmlFor="pomo-short" className="settings-row-label">
                  Short Break
                </label>
                <div className="settings-stepper-control">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setLocalPomodoro((prev) => ({
                        ...prev,
                        shortBreakMinutes: Math.max(1, (prev.shortBreakMinutes || 5) - 1),
                      }))
                    }
                    aria-label="Decrease short break"
                  >
                    −
                  </button>
                  <span className="stepper-val tabular">
                    {localPomodoro.shortBreakMinutes || 5}m
                  </span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setLocalPomodoro((prev) => ({
                        ...prev,
                        shortBreakMinutes: Math.min(30, (prev.shortBreakMinutes || 5) + 1),
                      }))
                    }
                    aria-label="Increase short break"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Long Break */}
              <div className="settings-row-v2">
                <label htmlFor="pomo-long" className="settings-row-label">
                  Long Break
                </label>
                <div className="settings-stepper-control">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setLocalPomodoro((prev) => ({
                        ...prev,
                        longBreakMinutes: Math.max(5, (prev.longBreakMinutes || 15) - 5),
                      }))
                    }
                    aria-label="Decrease long break"
                  >
                    −
                  </button>
                  <span className="stepper-val tabular">
                    {localPomodoro.longBreakMinutes || 15}m
                  </span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setLocalPomodoro((prev) => ({
                        ...prev,
                        longBreakMinutes: Math.min(60, (prev.longBreakMinutes || 15) + 5),
                      }))
                    }
                    aria-label="Increase long break"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cycles before Long Break */}
              <div className="settings-row-v2">
                <label htmlFor="pomo-cycles" className="settings-row-label">
                  Cycles Before Long Break
                </label>
                <div className="settings-stepper-control">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setLocalPomodoro((prev) => ({
                        ...prev,
                        sessionsBeforeLongBreak: Math.max(1, (prev.sessionsBeforeLongBreak || 4) - 1),
                      }))
                    }
                    aria-label="Decrease cycles"
                  >
                    −
                  </button>
                  <span className="stepper-val tabular">
                    {localPomodoro.sessionsBeforeLongBreak || 4}
                  </span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setLocalPomodoro((prev) => ({
                        ...prev,
                        sessionsBeforeLongBreak: Math.min(8, (prev.sessionsBeforeLongBreak || 4) + 1),
                      }))
                    }
                    aria-label="Increase cycles"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notifications */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-title">System Notifications</span>
            </div>

            <div className="settings-card-rows">
              <div className="settings-row-v2">
                <span className="settings-row-label">Shift & Phase Alerts</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={localSettings.notificationsEnabled}
                    onChange={handleNotificationToggle}
                    aria-label="Toggle notifications"
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              {notificationMsg && (
                <div className="settings-notification-status">
                  {notificationMsg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer-v2">
          <button type="button" className="control-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="control-btn primary" onClick={handleSave}>
            <CheckIcon size={15} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
