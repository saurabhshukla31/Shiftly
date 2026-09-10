export type AppMode = 'shift' | 'pomodoro' | 'stopwatch' | 'desk';

export interface ShiftSettings {
  shiftStart: string; // "14:30" (HH:mm)
  shiftEnd: string;   // "23:00" (HH:mm)
  timezone: string;   // "Asia/Kolkata"
  workdays: number[]; // [1, 2, 3, 4, 5] (1 = Mon, 7 = Sun)
  notificationsEnabled: boolean;
  defaultFocusMinutes: number;
}

export type ShiftPhase = 'before' | 'during' | 'completed';

export interface ShiftCalculation {
  phase: ShiftPhase;
  label: string;
  countdownFormatted: string; // "04:35:29"
  countdownSeconds: number;
  percentageRemaining: number;
  percentageElapsed: number;
  formattedShiftRange: string; // "2:30 PM → 11:00 PM"
  formattedDuration: string;   // "8h 30m"
  formattedElapsed: string;    // "4h 02m"
  formattedRemaining: string;  // "4h 28m"
  formattedCurrentTime: string; // "6:24 PM"
  formattedCurrentDate: string; // "Tuesday, September 8"
  milestone: string | null;    // e.g. "Halfway there", "Final hour"
  isOvernight: boolean;
}

export interface TodayTask {
  id: string;
  title: string;
  completed: boolean;
  time?: string; // e.g. "6:30 PM"
  note?: string;
  createdAt: number;
  completedAt?: number;
}

export interface TodayScheduleItem {
  id: string;
  time: string; // e.g. "17:00" (24h) or "5:00 PM"
  displayTime: string; // "5:00 PM"
  title: string;
  note?: string;
  reminderMinutes?: number; // 0 (off), 5, 10, 15
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  durationMinutes: number;
  startTimestamp: number | null;
  endTimestamp: number | null;
  isRunning: boolean;
  pausedRemainingMillis: number;
  completed: boolean;
}

export type PomodoroPhase = 'focus' | 'break' | 'longBreak';

export interface PomodoroConfig {
  focusMinutes: number;         // default 25
  shortBreakMinutes: number;    // default 5
  longBreakMinutes: number;     // default 15
  sessionsBeforeLongBreak: number; // default 4
}

export interface PomodoroState {
  phase: PomodoroPhase;
  phaseDurationMillis: number;
  phaseEndTimestamp: number | null;
  isRunning: boolean;
  pausedRemainingMillis: number;
  sessionNumber: number; // 1..4 cycle
}

export interface LapItem {
  id: string;
  lapNumber: number;
  lapTimestamp: number;
  splitMillis: number;
  totalMillis: number;
  splitFormatted: string;
  totalFormatted: string;
}
