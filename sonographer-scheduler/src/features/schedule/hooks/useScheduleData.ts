import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Clinic, ConsultationType, Patient, Sonographer } from '../../../core/domain/types';
import type { CrudApi } from '../services/scheduleApi';
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

// Reference data: effectively static during a session, so never refetch on its own.
const referenceQuery = <T,>(queryKey: readonly unknown[], queryFn: () => Promise<T>) => ({
  queryKey,
  queryFn,
  staleTime: Infinity,
});

export function useSonographers() {
  return useQuery(referenceQuery(scheduleKeys.sonographers, sonographersApi.list));
}

export function useClinics() {
  return useQuery(referenceQuery(scheduleKeys.clinics, clinicsApi.list));
}

export function useConsultationTypes() {
  return useQuery(referenceQuery(scheduleKeys.consultationTypes, consultationTypesApi.list));
}

export function usePatients() {
  return useQuery(referenceQuery(scheduleKeys.patients, patientsApi.list));
}

export function useAppointments(date: string) {
  return useQuery({
    queryKey: scheduleKeys.appointments(date),
    queryFn: () => appointmentsApi.listByDate(date),
  });
}

/** Create/update/delete for one configurable collection, re-fetching it when done. */
function useCrudMutations<T extends { id: string }>(queryKey: readonly unknown[], api: CrudApi<T>) {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey });

  return {
    create: useMutation({ mutationFn: (draft: Omit<T, 'id'>) => api.create(draft), onSuccess }),
    update: useMutation({ mutationFn: (item: T) => api.update(item), onSuccess }),
    remove: useMutation({ mutationFn: (id: string) => api.remove(id), onSuccess }),
  };
}

export const useSonographerMutations = () =>
  useCrudMutations<Sonographer>(scheduleKeys.sonographers, sonographersApi);
export const useClinicMutations = () => useCrudMutations<Clinic>(scheduleKeys.clinics, clinicsApi);
export const usePatientMutations = () => useCrudMutations<Patient>(scheduleKeys.patients, patientsApi);
export const useConsultationTypeMutations = () =>
  useCrudMutations<ConsultationType>(scheduleKeys.consultationTypes, consultationTypesApi);

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
