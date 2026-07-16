import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Appointment, AppointmentDraft } from '../../../core/domain/types';
import { appointmentsApi } from '../services/scheduleApi';
import { scheduleKeys } from './useScheduleData';

interface MutationContext {
  previous?: Appointment[];
}

/**
 * Create / update / delete with optimistic updates:
 * the cache for the visible day is patched immediately, rolled back if the
 * server rejects the change, and re-synced with the server once settled.
 */
export function useAppointmentMutations(date: string) {
  const queryClient = useQueryClient();
  const key = scheduleKeys.appointments(date);

  const applyOptimistic = async (
    patch: (current: Appointment[]) => Appointment[],
  ): Promise<MutationContext> => {
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<Appointment[]>(key);
    queryClient.setQueryData<Appointment[]>(key, (current = []) => patch(current));
    return { previous };
  };

  const rollback = (_error: unknown, _variables: unknown, context?: MutationContext) => {
    if (context?.previous) {
      queryClient.setQueryData(key, context.previous);
    }
  };

  const resync = () => queryClient.invalidateQueries({ queryKey: key });

  const create = useMutation({
    mutationFn: (draft: AppointmentDraft) => appointmentsApi.create(draft),
    onMutate: (draft) =>
      applyOptimistic((current) => [...current, { ...draft, id: `optimistic-${Date.now()}` }]),
    onError: rollback,
    onSettled: resync,
  });

  const update = useMutation({
    mutationFn: (appointment: Appointment) => appointmentsApi.update(appointment),
    onMutate: (appointment) =>
      applyOptimistic((current) => current.map((a) => (a.id === appointment.id ? appointment : a))),
    onError: rollback,
    onSettled: resync,
  });

  const remove = useMutation({
    mutationFn: (id: string) => appointmentsApi.remove(id),
    onMutate: (id) => applyOptimistic((current) => current.filter((a) => a.id !== id)),
    onError: rollback,
    onSettled: resync,
  });

  return { create, update, remove };
}
