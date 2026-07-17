import { useEffect, useState } from 'react';
import { minutesOfDay } from '../../../core/domain/time';

/**
 * Minutes since midnight for the current moment, refreshed every minute.
 * Drives the red "now" line on the grids.
 */
export function useNowMinutes(): number {
  const [minutes, setMinutes] = useState(() => minutesOfDay(new Date()));

  useEffect(() => {
    const id = setInterval(() => setMinutes(minutesOfDay(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  return minutes;
}
