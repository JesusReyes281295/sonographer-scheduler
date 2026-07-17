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

interface MovePayload {
  /** The appointment's day before the move ("yyyy-MM-dd"). */
  fromDate: string;
  /** The appointment with its new sonographer / day / time already applied. */
  next: Appointment;
}

interface MoveContext {
  fromKey: ReturnType<typeof scheduleKeys.appointments>;
  toKey: ReturnType<typeof scheduleKeys.appointments>;
  previousFrom?: Appointment[];
  previousTo?: Appointment[];
}

/**
 * Drag-and-drop move that can cross days. Unlike the plain `update`, it patches
 * both the source day's cache (remove) and the target day's cache (add), so the
 * day and week views react instantly, then rolls back / re-syncs both on settle.
 * Same-day moves collapse to a replace (both keys are equal).
 */
export function useMoveAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ next }: MovePayload) => appointmentsApi.update(next),
    onMutate: async ({ fromDate, next }): Promise<MoveContext> => {
      const fromKey = scheduleKeys.appointments(fromDate);
      const toKey = scheduleKeys.appointments(next.start.slice(0, 10));
      const crossDay = fromKey[1] !== toKey[1];

      await queryClient.cancelQueries({ queryKey: fromKey });
      if (crossDay) await queryClient.cancelQueries({ queryKey: toKey });

      const previousFrom = queryClient.getQueryData<Appointment[]>(fromKey);
      const previousTo = queryClient.getQueryData<Appointment[]>(toKey);

      queryClient.setQueryData<Appointment[]>(fromKey, (current = []) =>
        current.filter((a) => a.id !== next.id),
      );
      queryClient.setQueryData<Appointment[]>(toKey, (current = []) => [
        ...current.filter((a) => a.id !== next.id),
        next,
      ]);

      return { fromKey, toKey, previousFrom, previousTo };
    },
    onError: (_error, _payload, context) => {
      if (!context) return;
      queryClient.setQueryData(context.fromKey, context.previousFrom);
      queryClient.setQueryData(context.toKey, context.previousTo);
    },
    onSettled: (_data, _error, _payload, context) => {
      if (!context) return;
      queryClient.invalidateQueries({ queryKey: context.fromKey });
      if (context.fromKey[1] !== context.toKey[1]) {
        queryClient.invalidateQueries({ queryKey: context.toKey });
      }
    },
  });
}
