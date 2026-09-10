import React from 'react';

interface TimezoneSelectProps {
  value: string;
  onChange: (tz: string) => void;
}

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST · UTC+5:30)' },
  { value: 'America/New_York', label: 'America/New_York (ET · UTC-5/UTC-4)' },
  { value: 'America/Chicago', label: 'America/Chicago (CT · UTC-6/UTC-5)' },
  { value: 'America/Denver', label: 'America/Denver (MT · UTC-7/UTC-6)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT · UTC-8/UTC-7)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST · UTC+0/UTC+1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST · UTC+1/UTC+2)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST · UTC+1/UTC+2)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST · UTC+4)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT · UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST · UTC+9)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST · UTC+10/UTC+11)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST · UTC+12/UTC+13)' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
];

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({ value, onChange }) => {
  return (
    <div className="timezone-select-wrapper">
      <select
        id="timezone-select"
        className="settings-select-v2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select Timezone"
      >
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
        {!COMMON_TIMEZONES.some((tz) => tz.value === value) && (
          <option value={value}>{value}</option>
        )}
      </select>
    </div>
  );
};
