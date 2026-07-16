import { useQuery } from '@tanstack/react-query';
import { appointmentsApi, clinicsApi, sonographersApi } from '../services/scheduleApi';

export const scheduleKeys = {
  sonographers: ['sonographers'] as const,
  clinics: ['clinics'] as const,
  appointments: (date: string) => ['appointments', date] as const,
};

export function useSonographers() {
  // Reference data: effectively static for the session, so never refetch.
  return useQuery({
    queryKey: scheduleKeys.sonographers,
    queryFn: sonographersApi.list,
    staleTime: Infinity,
  });
}

export function useClinics() {
  return useQuery({
    queryKey: scheduleKeys.clinics,
    queryFn: clinicsApi.list,
    staleTime: Infinity,
  });
}

export function useAppointments(date: string) {
  return useQuery({
    queryKey: scheduleKeys.appointments(date),
    queryFn: () => appointmentsApi.listByDate(date),
  });
}
