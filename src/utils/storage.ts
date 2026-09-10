import type {
  ShiftSettings,
  TodayTask,
  TodayScheduleItem,
  FocusSession,
  PomodoroConfig,
  PomodoroState,
} from '../types';

export const DEFAULT_SETTINGS: ShiftSettings = {
  shiftStart: '14:30',
  shiftEnd: '23:00',
  timezone: 'Asia/Kolkata',
  workdays: [1, 2, 3, 4, 5],
  notificationsEnabled: false,
  defaultFocusMinutes: 25,
};

export const DEFAULT_TASKS: TodayTask[] = [];

export const DEFAULT_SCHEDULE: TodayScheduleItem[] = [];

export const DEFAULT_FOCUS_SESSION: FocusSession = {
  id: 'focus-init',
  durationMinutes: 25,
  startTimestamp: null,
  endTimestamp: null,
  isRunning: false,
  pausedRemainingMillis: 25 * 60 * 1000,
  completed: false,
};

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

export const DEFAULT_POMODORO_STATE: PomodoroState = {
  phase: 'focus',
  phaseDurationMillis: 25 * 60 * 1000,
  phaseEndTimestamp: null,
  isRunning: false,
  pausedRemainingMillis: 25 * 60 * 1000,
  sessionNumber: 1,
};

const STORAGE_KEYS = {
  SETTINGS: 'shiftly:v2:settings',
  TASKS: 'shiftly:v2:tasks',
  SCHEDULE: 'shiftly:v2:schedule',
  FOCUS: 'shiftly:v2:focus',
  POMODORO_CONFIG: 'shiftly:v2:pomodoro-config',
  POMODORO_STATE: 'shiftly:v2:pomodoro-state',
  LAST_ACTIVE_DATE: 'shiftly:v2:last-active-date',
};

export function loadSettings(): ShiftSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ShiftSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings', err);
  }
}

const DUMMY_TASK_IDS = new Set(['t-1', 't-2', 't-3', 't-4']);
const DUMMY_SCHEDULE_IDS = new Set(['s-1', 's-2', 's-3', 's-4', 's-5']);

export function loadTasks(): TodayTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out any legacy dummy tasks or browser test tasks
    const cleaned = parsed.filter(
      (t) => t && t.id && !DUMMY_TASK_IDS.has(t.id) && t.title !== 'Test V2 release'
    );
    if (cleaned.length !== parsed.length) {
      saveTasks(cleaned);
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveTasks(tasks: TodayTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.warn('Failed to save tasks', err);
  }
}

export function loadSchedule(): TodayScheduleItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out any legacy dummy schedule items
    const cleaned = parsed.filter(
      (s) => s && s.id && !DUMMY_SCHEDULE_IDS.has(s.id)
    );
    if (cleaned.length !== parsed.length) {
      saveSchedule(cleaned);
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveSchedule(schedule: TodayScheduleItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  } catch (err) {
    console.warn('Failed to save schedule', err);
  }
}

export function loadFocusSession(): FocusSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOCUS);
    if (!raw) return DEFAULT_FOCUS_SESSION;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_FOCUS_SESSION, ...parsed };
  } catch {
    return DEFAULT_FOCUS_SESSION;
  }
}

export function saveFocusSession(focus: FocusSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FOCUS, JSON.stringify(focus));
  } catch (err) {
    console.warn('Failed to save focus session', err);
  }
}

export function loadPomodoroConfig(): PomodoroConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POMODORO_CONFIG);
    if (!raw) return DEFAULT_POMODORO_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_POMODORO_CONFIG, ...parsed };
  } catch {
    return DEFAULT_POMODORO_CONFIG;
  }
}

export function savePomodoroConfig(config: PomodoroConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POMODORO_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save pomodoro config', err);
  }
}

export function loadPomodoroState(): PomodoroState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POMODORO_STATE);
    if (!raw) return DEFAULT_POMODORO_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_POMODORO_STATE, ...parsed };
  } catch {
    return DEFAULT_POMODORO_STATE;
  }
}

export function savePomodoroState(state: PomodoroState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POMODORO_STATE, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save pomodoro state', err);
  }
}

export function getLastActiveDate(): string {
  return localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_DATE) || '';
}

export function setLastActiveDate(dateStr: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_DATE, dateStr);
}
