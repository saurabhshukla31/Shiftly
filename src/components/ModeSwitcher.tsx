import React, { useRef, useEffect, useState } from 'react';
import type { AppMode } from '../types';

interface ModeSwitcherProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

interface TabConfig {
  id: AppMode;
  label: string;
  shortcut: string;
}

const TABS: TabConfig[] = [
  { id: 'shift', label: 'Shift', shortcut: '1' },
  { id: 'pomodoro', label: 'Pomodoro', shortcut: '2' },
  { id: 'stopwatch', label: 'Stopwatch', shortcut: '3' },
];

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(
      `button[data-mode="${currentMode}"]`
    );
    if (activeBtn) {
      setPillStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [currentMode]);

  return (
    <nav className="mode-switcher-container" aria-label="Mode Selector">
      <div className="mode-switcher" ref={containerRef} role="tablist">
        {pillStyle.width > 0 && (
          <div
            className="mode-switcher-pill"
            style={{
              transform: `translateX(${pillStyle.left - 3}px)`,
              width: `${pillStyle.width}px`,
            }}
          />
        )}
        {TABS.map((tab) => {
          const isActive = currentMode === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              data-mode={tab.id}
              className={`mode-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectMode(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="key-hint" aria-hidden="true">
                {tab.shortcut}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
