import type { ShiftCalculation, ShiftSettings } from '../types';
import { getNow } from './time';

/**
 * Gets date-time parts for a given timestamp in a specified IANA timezone
 */
export function getTimezoneParts(timestamp: number, timezone: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      weekday: 'long',
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date(timestamp));
    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }

    return {
      year: parseInt(map.year, 10),
      month: parseInt(map.month, 10),
      day: parseInt(map.day, 10),
      hour: parseInt(map.hour, 10) === 24 ? 0 : parseInt(map.hour, 10),
      minute: parseInt(map.minute, 10),
      second: parseInt(map.second, 10),
      weekday: map.weekday || '',
    };
  } catch {
    const d = new Date(timestamp);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes(),
      second: d.getSeconds(),
      weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    };
  }
}

/**
 * Converts a specific date and time in a given IANA timezone to UTC epoch milliseconds
 */
export function getUtcEpochForTimezoneDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timezone: string
): number {
  let guessUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  
  for (let i = 0; i < 3; i++) {
    const tzParts = getTimezoneParts(guessUtc, timezone);
    const tzAsUtc = Date.UTC(
      tzParts.year,
      tzParts.month - 1,
      tzParts.day,
      tzParts.hour,
      tzParts.minute,
      tzParts.second
    );
    const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    const diff = targetAsUtc - tzAsUtc;
    if (diff === 0) break;
    guessUtc += diff;
  }

  return guessUtc;
}

/**
 * Formats a 24-hour time string ("14:30") into a 12-hour display string ("2:30 PM")
 */
export function formatTime12h(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mStr = minute.toString().padStart(2, '0');
  return `${h12}:${mStr} ${period}`;
}

/**
 * Parses "HH:mm" into { hours, minutes }
 */
export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  return {
    hours: isNaN(h) ? 0 : Math.min(23, Math.max(0, h)),
    minutes: isNaN(m) ? 0 : Math.min(59, Math.max(0, m)),
  };
}

/**
 * Core shift calculator with contextual milestone detection.
 */
export function calculateShift(
  settings: ShiftSettings,
  injectedNow?: number
): ShiftCalculation {
  const now = injectedNow !== undefined ? injectedNow : getNow();
  const tz = settings.timezone || 'Asia/Kolkata';

  const startParsed = parseTimeString(settings.shiftStart || '14:30');
  const endParsed = parseTimeString(settings.shiftEnd || '23:00');

  const tzNow = getTimezoneParts(now, tz);

  const dateFormatted = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(now));

  const currentTimeFormatted = formatTime12h(tzNow.hour, tzNow.minute);

  const startMinuteOfDay = startParsed.hours * 60 + startParsed.minutes;
  const endMinuteOfDay = endParsed.hours * 60 + endParsed.minutes;
  const isOvernight = endMinuteOfDay <= startMinuteOfDay;

  const todayStartUtc = getUtcEpochForTimezoneDate(
    tzNow.year,
    tzNow.month,
    tzNow.day,
    startParsed.hours,
    startParsed.minutes,
    0,
    tz
  );

  let todayEndUtc: number;
  if (!isOvernight) {
    todayEndUtc = getUtcEpochForTimezoneDate(
      tzNow.year,
      tzNow.month,
      tzNow.day,
      endParsed.hours,
      endParsed.minutes,
      0,
      tz
    );
  } else {
    const nextDayDate = new Date(todayStartUtc + 24 * 3600 * 1000);
    const nextDayTz = getTimezoneParts(nextDayDate.getTime(), tz);
    todayEndUtc = getUtcEpochForTimezoneDate(
      nextDayTz.year,
      nextDayTz.month,
      nextDayTz.day,
      endParsed.hours,
      endParsed.minutes,
      0,
      tz
    );
  }

  let yesterdayStartUtc: number | null = null;
  let yesterdayEndUtc: number | null = null;
  if (isOvernight) {
    const prevDayDate = new Date(todayStartUtc - 24 * 3600 * 1000);
    const prevDayTz = getTimezoneParts(prevDayDate.getTime(), tz);
    yesterdayStartUtc = getUtcEpochForTimezoneDate(
      prevDayTz.year,
      prevDayTz.month,
      prevDayTz.day,
      startParsed.hours,
      startParsed.minutes,
      0,
      tz
    );
    yesterdayEndUtc = getUtcEpochForTimezoneDate(
      tzNow.year,
      tzNow.month,
      tzNow.day,
      endParsed.hours,
      endParsed.minutes,
      0,
      tz
    );
  }

  const start12h = formatTime12h(startParsed.hours, startParsed.minutes);
  const end12h = formatTime12h(endParsed.hours, endParsed.minutes);
  const formattedShiftRange = `${start12h} → ${end12h}`;

  const totalDurationMs = todayEndUtc - todayStartUtc;
  const totalDurationMinutes = Math.round(totalDurationMs / (60 * 1000));
  const durH = Math.floor(totalDurationMinutes / 60);
  const durM = totalDurationMinutes % 60;
  const formattedDuration = durM > 0 ? `${durH}h ${durM}m` : `${durH}h`;

  let activeStartUtc = todayStartUtc;
  let activeEndUtc = todayEndUtc;
  let phase: ShiftCalculation['phase'] = 'during';
  let label = 'TIME LEFT';

  if (
    isOvernight &&
    yesterdayStartUtc !== null &&
    yesterdayEndUtc !== null &&
    now >= yesterdayStartUtc &&
    now < yesterdayEndUtc
  ) {
    activeStartUtc = yesterdayStartUtc;
    activeEndUtc = yesterdayEndUtc;
    phase = 'during';
    label = 'TIME LEFT';
  } else if (now < todayStartUtc) {
    phase = 'before';
    label = 'SHIFT STARTS IN';
  } else if (now >= todayStartUtc && now < todayEndUtc) {
    phase = 'during';
    label = 'TIME LEFT';
  } else {
    phase = 'completed';
    label = 'SHIFT COMPLETE';
  }

  let elapsedMs = 0;
  let remainingMs = 0;
  let countdownRemainingSec = 0;

  if (phase === 'before') {
    remainingMs = Math.max(0, todayStartUtc - now);
    countdownRemainingSec = Math.floor(remainingMs / 1000);
    elapsedMs = 0;
  } else if (phase === 'during') {
    elapsedMs = Math.max(0, now - activeStartUtc);
    remainingMs = Math.max(0, activeEndUtc - now);
    countdownRemainingSec = Math.floor(remainingMs / 1000);
  } else {
    elapsedMs = totalDurationMs;
    remainingMs = 0;
    countdownRemainingSec = 0;
  }

  const cHours = Math.floor(countdownRemainingSec / 3600);
  const cMinutes = Math.floor((countdownRemainingSec % 3600) / 60);
  const cSeconds = countdownRemainingSec % 60;
  const countdownFormatted = `${cHours.toString().padStart(2, '0')}:${cMinutes
    .toString()
    .padStart(2, '0')}:${cSeconds.toString().padStart(2, '0')}`;

  const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
  const elH = Math.floor(elapsedMinutes / 60);
  const elM = elapsedMinutes % 60;
  const formattedElapsed = `${elH}h ${elM.toString().padStart(2, '0')}m`;

  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
  const remH = Math.floor(remainingMinutes / 60);
  const remM = remainingMinutes % 60;
  const formattedRemaining = phase === 'completed' ? '0h 00m' : `${remH}h ${remM.toString().padStart(2, '0')}m`;

  let percentageElapsed = 0;
  let percentageRemaining = 100;
  if (totalDurationMs > 0) {
    if (phase === 'before') {
      percentageElapsed = 0;
      percentageRemaining = 100;
    } else if (phase === 'completed') {
      percentageElapsed = 100;
      percentageRemaining = 0;
    } else {
      const rawElapsedFraction = elapsedMs / totalDurationMs;
      percentageElapsed = Math.min(100, Math.max(0, Number((rawElapsedFraction * 100).toFixed(1))));
      percentageRemaining = Math.min(100, Math.max(0, Number(((1 - rawElapsedFraction) * 100).toFixed(1))));
    }
  }

  // Milestone calculation
  let milestone: string | null = null;
  if (phase === 'during') {
    if (remainingMs <= 30 * 60 * 1000 && remainingMs > 0) {
      milestone = '30 minutes remaining';
    } else if (remainingMs <= 60 * 60 * 1000) {
      milestone = 'Final hour';
    } else if (remainingMs <= 2 * 60 * 60 * 1000) {
      milestone = '2 hours remaining';
    } else if (percentageElapsed >= 48 && percentageElapsed <= 55) {
      milestone = 'Halfway there';
    } else if (elapsedMs <= 15 * 60 * 1000) {
      milestone = 'Shift started';
    }
  }

  return {
    phase,
    label,
    countdownFormatted,
    countdownSeconds: countdownRemainingSec,
    percentageRemaining,
    percentageElapsed,
    formattedShiftRange,
    formattedDuration,
    formattedElapsed,
    formattedRemaining,
    formattedCurrentTime: currentTimeFormatted,
    formattedCurrentDate: dateFormatted,
    milestone,
    isOvernight,
  };
}

