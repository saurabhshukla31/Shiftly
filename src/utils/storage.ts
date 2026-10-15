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
} as const;

// ─── Validation helpers ───────────────────────────────────────────────
// Prevent prototype-pollution by rejecting dangerous keys from parsed JSON
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val) && Object.getPrototypeOf(val) === Object.prototype;
}

function stripDangerousKeys<T extends Record<string, unknown>>(obj: T): T {
  const cleaned = {} as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!DANGEROUS_KEYS.has(key)) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned as T;
}

function safeParse(raw: string): unknown {
  const parsed = JSON.parse(raw);
  if (isPlainObject(parsed)) {
    return stripDangerousKeys(parsed);
  }
  return parsed;
}

/** Validates an "HH:mm" time string, returns the default on bad input */
function validateTimeString(val: unknown, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(val);
  return match ? val : fallback;
}

/** Clamp a number within a range, returning the fallback if input is not a finite number */
function clampNumber(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.min(max, Math.max(min, Math.round(val)));
}

/** Validate an IANA timezone string by attempting to use it with Intl */
function validateTimezone(val: unknown, fallback: string): string {
  if (typeof val !== 'string' || val.length === 0 || val.length > 64) return fallback;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: val });
    return val;
  } catch {
    return fallback;
  }
}

/** Cap localStorage value size to prevent storage quota abuse / DoS */
const MAX_STORAGE_VALUE_SIZE = 1_048_576; // 1 MB

function safeGetItem(key: string): string | null {
  const raw = localStorage.getItem(key);
  if (raw !== null && raw.length > MAX_STORAGE_VALUE_SIZE) {
    console.warn(`Storage key "${key}" exceeds size limit, ignoring.`);
    localStorage.removeItem(key);
    return null;
  }
  return raw;
}

// ─── Settings ─────────────────────────────────────────────────────────

function validateSettings(parsed: unknown): ShiftSettings {
  if (!isPlainObject(parsed)) return { ...DEFAULT_SETTINGS };
  const safe = stripDangerousKeys(parsed as Record<string, unknown>);

  const validWorkdays = Array.isArray(safe.workdays)
    ? (safe.workdays as unknown[])
        .filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 7)
        .slice(0, 7)
    : DEFAULT_SETTINGS.workdays;

  return {
    shiftStart: validateTimeString(safe.shiftStart, DEFAULT_SETTINGS.shiftStart),
    shiftEnd: validateTimeString(safe.shiftEnd, DEFAULT_SETTINGS.shiftEnd),
    timezone: validateTimezone(safe.timezone, DEFAULT_SETTINGS.timezone),
    workdays: validWorkdays.length > 0 ? validWorkdays : DEFAULT_SETTINGS.workdays,
    notificationsEnabled: typeof safe.notificationsEnabled === 'boolean' ? safe.notificationsEnabled : DEFAULT_SETTINGS.notificationsEnabled,
    defaultFocusMinutes: clampNumber(safe.defaultFocusMinutes, 1, 480, DEFAULT_SETTINGS.defaultFocusMinutes),
  };
}

export function loadSettings(): ShiftSettings {
  try {
    const raw = safeGetItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = safeParse(raw);
    return validateSettings(parsed);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: ShiftSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings', err);
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────

const DUMMY_TASK_IDS = new Set(['t-1', 't-2', 't-3', 't-4']);
const DUMMY_SCHEDULE_IDS = new Set(['s-1', 's-2', 's-3', 's-4', 's-5']);

const MAX_ITEMS = 500; // Prevent memory abuse from gigantic arrays

function validateTask(t: unknown): TodayTask | null {
  if (!isPlainObject(t)) return null;
  const safe = stripDangerousKeys(t as Record<string, unknown>);
  if (typeof safe.id !== 'string' || safe.id.length === 0 || safe.id.length > 128) return null;
  if (typeof safe.title !== 'string' || safe.title.length > 1000) return null;
  if (DUMMY_TASK_IDS.has(safe.id) || safe.title === 'Test V2 release') return null;
  return {
    id: safe.id,
    title: safe.title,
    completed: typeof safe.completed === 'boolean' ? safe.completed : false,
    time: typeof safe.time === 'string' ? safe.time.slice(0, 32) : undefined,
    note: typeof safe.note === 'string' ? safe.note.slice(0, 5000) : undefined,
    createdAt: typeof safe.createdAt === 'number' && Number.isFinite(safe.createdAt) ? safe.createdAt : Date.now(),
    completedAt: typeof safe.completedAt === 'number' && Number.isFinite(safe.completedAt) ? safe.completedAt : undefined,
  };
}

export function loadTasks(): TodayTask[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.TASKS);
    if (!raw) return [];
    const parsed = safeParse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.slice(0, MAX_ITEMS)
      .map(validateTask)
      .filter((t): t is TodayTask => t !== null);
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

// ─── Schedule ─────────────────────────────────────────────────────────

function validateScheduleItem(s: unknown): TodayScheduleItem | null {
  if (!isPlainObject(s)) return null;
  const safe = stripDangerousKeys(s as Record<string, unknown>);
  if (typeof safe.id !== 'string' || safe.id.length === 0 || safe.id.length > 128) return null;
  if (DUMMY_SCHEDULE_IDS.has(safe.id)) return null;
  if (typeof safe.title !== 'string' || safe.title.length > 1000) return null;
  if (typeof safe.time !== 'string') return null;
  if (typeof safe.displayTime !== 'string') return null;
  return {
    id: safe.id,
    time: safe.time.slice(0, 32),
    displayTime: safe.displayTime.slice(0, 32),
    title: safe.title,
    note: typeof safe.note === 'string' ? safe.note.slice(0, 5000) : undefined,
    reminderMinutes: typeof safe.reminderMinutes === 'number' && Number.isFinite(safe.reminderMinutes) ? clampNumber(safe.reminderMinutes, 0, 60, 0) : undefined,
  };
}

export function loadSchedule(): TodayScheduleItem[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.SCHEDULE);
    if (!raw) return [];
    const parsed = safeParse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.slice(0, MAX_ITEMS)
      .map(validateScheduleItem)
      .filter((s): s is TodayScheduleItem => s !== null);
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

// ─── Focus Session ────────────────────────────────────────────────────

function validateFocusSession(parsed: unknown): FocusSession {
  if (!isPlainObject(parsed)) return { ...DEFAULT_FOCUS_SESSION };
  const safe = stripDangerousKeys(parsed as Record<string, unknown>);
  return {
    id: typeof safe.id === 'string' && safe.id.length > 0 && safe.id.length <= 128 ? safe.id : DEFAULT_FOCUS_SESSION.id,
    taskId: typeof safe.taskId === 'string' ? safe.taskId.slice(0, 128) : undefined,
    taskTitle: typeof safe.taskTitle === 'string' ? safe.taskTitle.slice(0, 1000) : undefined,
    durationMinutes: clampNumber(safe.durationMinutes, 1, 480, DEFAULT_FOCUS_SESSION.durationMinutes),
    startTimestamp: typeof safe.startTimestamp === 'number' && Number.isFinite(safe.startTimestamp) ? safe.startTimestamp : null,
    endTimestamp: typeof safe.endTimestamp === 'number' && Number.isFinite(safe.endTimestamp) ? safe.endTimestamp : null,
    isRunning: typeof safe.isRunning === 'boolean' ? safe.isRunning : false,
    pausedRemainingMillis: clampNumber(safe.pausedRemainingMillis, 0, 480 * 60 * 1000, DEFAULT_FOCUS_SESSION.pausedRemainingMillis),
    completed: typeof safe.completed === 'boolean' ? safe.completed : false,
  };
}

export function loadFocusSession(): FocusSession {
  try {
    const raw = safeGetItem(STORAGE_KEYS.FOCUS);
    if (!raw) return { ...DEFAULT_FOCUS_SESSION };
    const parsed = safeParse(raw);
    return validateFocusSession(parsed);
  } catch {
    return { ...DEFAULT_FOCUS_SESSION };
  }
}

export function saveFocusSession(focus: FocusSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FOCUS, JSON.stringify(focus));
  } catch (err) {
    console.warn('Failed to save focus session', err);
  }
}

// ─── Pomodoro Config ──────────────────────────────────────────────────

function validatePomodoroConfig(parsed: unknown): PomodoroConfig {
  if (!isPlainObject(parsed)) return { ...DEFAULT_POMODORO_CONFIG };
  const safe = stripDangerousKeys(parsed as Record<string, unknown>);
  return {
    focusMinutes: clampNumber(safe.focusMinutes, 1, 120, DEFAULT_POMODORO_CONFIG.focusMinutes),
    shortBreakMinutes: clampNumber(safe.shortBreakMinutes, 1, 30, DEFAULT_POMODORO_CONFIG.shortBreakMinutes),
    longBreakMinutes: clampNumber(safe.longBreakMinutes, 1, 60, DEFAULT_POMODORO_CONFIG.longBreakMinutes),
    sessionsBeforeLongBreak: clampNumber(safe.sessionsBeforeLongBreak, 1, 12, DEFAULT_POMODORO_CONFIG.sessionsBeforeLongBreak),
  };
}

export function loadPomodoroConfig(): PomodoroConfig {
  try {
    const raw = safeGetItem(STORAGE_KEYS.POMODORO_CONFIG);
    if (!raw) return { ...DEFAULT_POMODORO_CONFIG };
    const parsed = safeParse(raw);
    return validatePomodoroConfig(parsed);
  } catch {
    return { ...DEFAULT_POMODORO_CONFIG };
  }
}

export function savePomodoroConfig(config: PomodoroConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POMODORO_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save pomodoro config', err);
  }
}

// ─── Pomodoro State ───────────────────────────────────────────────────

const VALID_POMODORO_PHASES = new Set(['focus', 'break', 'longBreak']);

function validatePomodoroState(parsed: unknown): PomodoroState {
  if (!isPlainObject(parsed)) return { ...DEFAULT_POMODORO_STATE };
  const safe = stripDangerousKeys(parsed as Record<string, unknown>);

  const phase = typeof safe.phase === 'string' && VALID_POMODORO_PHASES.has(safe.phase)
    ? (safe.phase as PomodoroState['phase'])
    : DEFAULT_POMODORO_STATE.phase;

  return {
    phase,
    phaseDurationMillis: clampNumber(safe.phaseDurationMillis, 0, 120 * 60 * 1000, DEFAULT_POMODORO_STATE.phaseDurationMillis),
    phaseEndTimestamp: typeof safe.phaseEndTimestamp === 'number' && Number.isFinite(safe.phaseEndTimestamp) ? safe.phaseEndTimestamp : null,
    isRunning: typeof safe.isRunning === 'boolean' ? safe.isRunning : false,
    pausedRemainingMillis: clampNumber(safe.pausedRemainingMillis, 0, 120 * 60 * 1000, DEFAULT_POMODORO_STATE.pausedRemainingMillis),
    sessionNumber: clampNumber(safe.sessionNumber, 1, 9999, DEFAULT_POMODORO_STATE.sessionNumber),
  };
}

export function loadPomodoroState(): PomodoroState {
  try {
    const raw = safeGetItem(STORAGE_KEYS.POMODORO_STATE);
    if (!raw) return { ...DEFAULT_POMODORO_STATE };
    const parsed = safeParse(raw);
    return validatePomodoroState(parsed);
  } catch {
    return { ...DEFAULT_POMODORO_STATE };
  }
}

export function savePomodoroState(state: PomodoroState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POMODORO_STATE, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save pomodoro state', err);
  }
}

// ─── Last Active Date ─────────────────────────────────────────────────

/** Validates a date string (YYYY-MM-DD) */
function validateDateString(val: string | null): string {
  if (!val || typeof val !== 'string') return '';
  // Only allow reasonable date-like strings (YYYY-MM-DD)
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(val);
  return match ? val : '';
}

export function getLastActiveDate(): string {
  return validateDateString(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_DATE));
}

export function setLastActiveDate(dateStr: string): void {
  const validated = validateDateString(dateStr);
  if (validated) {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_DATE, validated);
  }
}
