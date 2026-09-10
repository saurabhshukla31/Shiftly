/**
 * Formats milliseconds into { mainTime: "00:00:00", centis: ".00" } or { mainTime: "00:00", centis: ".00" }
 */
export function formatStopwatchTime(millis: number): { mainTime: string; centis: string } {
  const totalSeconds = Math.floor(millis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((millis % 1000) / 10);

  const centisStr = `.${centiseconds.toString().padStart(2, '0')}`;

  if (hours > 0) {
    const mainTime = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return { mainTime, centis: centisStr };
  } else {
    const mainTime = `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
    return { mainTime, centis: centisStr };
  }
}

/**
 * Formats a lap time string e.g. "04:32.18" or "1:12:42.31"
 */
export function formatLapTime(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((millis % 1000) / 10);

  const centisStr = `.${centiseconds.toString().padStart(2, '0')}`;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}${centisStr}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}${centisStr}`;
}

/**
 * Formats Pomodoro remaining milliseconds into "MM:SS"
 */
export function formatPomodoroTime(millis: number): string {
  const totalSeconds = Math.max(0, Math.ceil(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
