import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Patient } from '../../../core/domain/types';
import {
  appointmentsApi,
  clinicsApi,
  consultationTypesApi,
  patientsApi,
  sonographersApi,
} from '../services/scheduleApi';

export const scheduleKeys = {
  sonographers: ['sonographers'] as const,
  clinics: ['clinics'] as const,
  consultationTypes: ['consultation-types'] as const,
  patients: ['patients'] as const,
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

export function useConsultationTypes() {
  return useQuery({
    queryKey: scheduleKeys.consultationTypes,
    queryFn: consultationTypesApi.list,
    staleTime: Infinity,
  });
}

export function usePatients() {
  return useQuery({
    queryKey: scheduleKeys.patients,
    queryFn: patientsApi.list,
    staleTime: Infinity,
  });
}

/**
 * Adds a patient on the fly when the front desk types a name that doesn't exist
 * yet. The new patient is pushed straight into the cache so the schedule can
 * resolve its name immediately, without waiting for a refetch.
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => patientsApi.create({ name }),
    onSuccess: (patient) => {
      queryClient.setQueryData<Patient[]>(scheduleKeys.patients, (current = []) => [
        ...current,
        patient,
      ]);
    },
  });
}

export function useAppointments(date: string) {
  return useQuery({
    queryKey: scheduleKeys.appointments(date),
    queryFn: () => appointmentsApi.listByDate(date),
  });
}
