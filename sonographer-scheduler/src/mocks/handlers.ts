import { delay, http, HttpResponse } from 'msw';
import { validateAppointment } from '../core/domain/scheduling';
import type { Appointment, AppointmentDraft } from '../core/domain/types';
import { db } from './db';

/** Simulated network latency so loading states are visible in the UI. */
const LATENCY_MS = 250;

/**
 * The mock server validates with the SAME domain rules as the client.
 * This mirrors a real backend (the server is the source of truth) and lets
 * us exercise optimistic-update rollbacks when a request is rejected.
 */
function validateOnServer(draft: AppointmentDraft) {
  const clinic = db.getClinic(draft.clinicId);
  if (!clinic) {
    return HttpResponse.json({ message: 'Unknown clinic.' }, { status: 400 });
  }
  const errors = validateAppointment(draft, db.listAppointments(), clinic);
  if (errors.length > 0) {
    return HttpResponse.json(
      { message: errors.map((e) => e.message).join(' '), errors },
      { status: 409 },
    );
  }
  return null;
}

const notFound = (label: string) =>
  HttpResponse.json({ message: `${label} not found.` }, { status: 404 });

const requireName = (draft: { name?: string }) =>
  draft.name?.trim()
    ? null
    : HttpResponse.json({ message: 'Name is required.' }, { status: 400 });

/**
 * Deleting something the schedule still points at would orphan appointments,
 * so the server refuses and tells the user how many are in the way.
 */
function blockIfBooked(field: keyof Appointment, id: string, label: string) {
  const count = db.listAppointments().filter((a) => a[field] === id).length;
  if (count === 0) return null;
  return HttpResponse.json(
    {
      message: `Cannot delete this ${label.toLowerCase()}: ${count} appointment${
        count === 1 ? '' : 's'
      } still ${count === 1 ? 'uses' : 'use'} it.`,
    },
    { status: 409 },
  );
}

interface Store<T extends { id: string; name: string }> {
  list: () => T[];
  create: (draft: Omit<T, 'id'>) => T;
  update: (item: T) => T | undefined;
  remove: (id: string) => boolean;
}

/** GET / POST / PUT / DELETE for one configurable collection. */
function collectionHandlers<T extends { id: string; name: string }>(
  path: string,
  store: Store<T>,
  options: { label: string; bookedBy: keyof Appointment },
) {
  return [
    http.get(path, async () => {
      await delay(LATENCY_MS);
      return HttpResponse.json(store.list());
    }),

    http.post(path, async ({ request }) => {
      await delay(LATENCY_MS);
      const draft = (await request.json()) as Omit<T, 'id'>;
      return requireName(draft) ?? HttpResponse.json(store.create(draft), { status: 201 });
    }),

    http.put(`${path}/:id`, async ({ request, params }) => {
      await delay(LATENCY_MS);
      const item = { ...((await request.json()) as T), id: String(params.id) };
      const invalid = requireName(item);
      if (invalid) return invalid;
      const updated = store.update(item);
      return updated ? HttpResponse.json(updated) : notFound(options.label);
    }),

    http.delete(`${path}/:id`, async ({ params }) => {
      await delay(LATENCY_MS);
      const id = String(params.id);
      const booked = blockIfBooked(options.bookedBy, id, options.label);
      if (booked) return booked;
      return store.remove(id) ? new HttpResponse(null, { status: 204 }) : notFound(options.label);
    }),
  ];
}

export const handlers = [
  ...collectionHandlers(
    '/api/sonographers',
    {
      list: db.listSonographers,
      create: db.createSonographer,
      update: db.updateSonographer,
      remove: db.deleteSonographer,
    },
    { label: 'Sonographer', bookedBy: 'sonographerId' },
  ),

  ...collectionHandlers(
    '/api/clinics',
    {
      list: db.listClinics,
      create: db.createClinic,
      update: db.updateClinic,
      remove: db.deleteClinic,
    },
    { label: 'Clinic', bookedBy: 'clinicId' },
  ),

  ...collectionHandlers(
    '/api/patients',
    {
      list: db.listPatients,
      create: db.createPatient,
      update: db.updatePatient,
      remove: db.deletePatient,
    },
    { label: 'Patient', bookedBy: 'patientId' },
  ),

  ...collectionHandlers(
    '/api/consultation-types',
    {
      list: db.listConsultationTypes,
      create: db.createConsultationType,
      update: db.updateConsultationType,
      remove: db.deleteConsultationType,
    },
    { label: 'Study type', bookedBy: 'consultationTypeId' },
  ),

  http.get('/api/appointments', async ({ request }) => {
    await delay(LATENCY_MS);
    const date = new URL(request.url).searchParams.get('date');
    return HttpResponse.json(db.listAppointments(date));
  }),

  http.post('/api/appointments', async ({ request }) => {
    await delay(LATENCY_MS);
    const draft = (await request.json()) as AppointmentDraft;
    const failure = validateOnServer(draft);
    if (failure) return failure;
    return HttpResponse.json(db.createAppointment(draft), { status: 201 });
  }),

  http.put('/api/appointments/:id', async ({ request, params }) => {
    await delay(LATENCY_MS);
    const id = String(params.id);
    if (!db.getAppointment(id)) {
      return notFound('Appointment');
    }
    const appointment: Appointment = { ...((await request.json()) as Appointment), id };
    const failure = validateOnServer(appointment);
    if (failure) return failure;
    return HttpResponse.json(db.updateAppointment(appointment));
  }),

  http.delete('/api/appointments/:id', async ({ params }) => {
    await delay(LATENCY_MS);
    return db.deleteAppointment(String(params.id))
      ? new HttpResponse(null, { status: 204 })
      : notFound('Appointment');
  }),
];
