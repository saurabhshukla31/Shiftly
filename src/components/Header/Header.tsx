import React from 'react';
import { SettingsIcon, DeskIcon } from '../Common/Icons';

interface HeaderProps {
  onEnterDeskMode: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onEnterDeskMode,
  onOpenSettings,
}) => {
  return (
    <header className="app-header" role="banner">
      <div className="header-left">
        <h1 className="app-wordmark">Shiftly</h1>
      </div>

      <div className="header-right">
        {/* Desk Mode Button */}
        <button
          type="button"
          id="btn-desk-mode"
          className="header-btn"
          onClick={onEnterDeskMode}
          title="Desk Mode (D)"
          aria-label="Enter Desk Mode"
        >
          <DeskIcon size={17} />
        </button>

        {/* Settings Button */}
        <button
          type="button"
          id="btn-open-settings"
          className="header-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings();
          }}
          title="Settings"
          aria-label="Open Settings"
        >
          <SettingsIcon size={17} />
        </button>
      </div>
    </header>
  );
};
