/** "HH:mm" → minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Minutes since midnight for a Date, in local time. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Minutes since midnight → "HH:mm". */
export function minutesToTime(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** "yyyy-MM-dd" + minutes since midnight → local ISO datetime string. */
export function buildLocalIso(date: string, minutes: number): string {
  return `${date}T${minutesToTime(minutes)}:00`;
}
