import React from 'react';
import { CloseIcon, CommandIcon } from './Icons';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Pause / Resume active timer' },
  { key: 'R', desc: 'Reset current timer' },
  { key: 'L', desc: 'Record lap (Stopwatch)' },
  { key: '1', desc: 'Switch to Shift mode' },
  { key: '2', desc: 'Switch to Pomodoro mode' },
  { key: '3', desc: 'Switch to Stopwatch mode' },
  { key: 'D', desc: 'Toggle Desk Mode' },
  { key: '?', desc: 'Show this shortcuts guide' },
  { key: 'Esc', desc: 'Close overlay / Exit Desk Mode' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="settings-sheet-v2 shortcuts-sheet" style={{ maxWidth: '440px' }}>
        <div className="settings-header-v2">
          <div className="settings-title-group">
            <CommandIcon size={18} />
            <h2 id="shortcuts-title" className="settings-title">
              Keyboard Shortcuts
            </h2>
          </div>
          <button type="button" className="settings-close-btn" onClick={onClose} aria-label="Close">
            <CloseIcon size={15} />
          </button>
        </div>

        <div className="settings-scroll-content">
          <div className="settings-card">
            <div className="settings-card-rows">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="settings-row-v2">
                  <span className="kbd-badge">{s.key}</span>
                  <span className="shortcut-desc">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-footer-v2">
          <button type="button" className="control-btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
