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

export const handlers = [
  http.get('/api/sonographers', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(db.listSonographers());
  }),

  http.get('/api/clinics', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(db.listClinics());
  }),

  http.get('/api/consultation-types', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(db.listConsultationTypes());
  }),

  http.get('/api/patients', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(db.listPatients());
  }),

  http.post('/api/patients', async ({ request }) => {
    await delay(LATENCY_MS);
    const draft = (await request.json()) as { name?: string; mrn?: string };
    const name = draft.name?.trim();
    if (!name) {
      return HttpResponse.json({ message: 'Patient name is required.' }, { status: 400 });
    }
    return HttpResponse.json(db.createPatient({ name, mrn: draft.mrn }), { status: 201 });
  }),

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
      return HttpResponse.json({ message: 'Appointment not found.' }, { status: 404 });
    }
    const appointment: Appointment = { ...((await request.json()) as Appointment), id };
    const failure = validateOnServer(appointment);
    if (failure) return failure;
    return HttpResponse.json(db.updateAppointment(appointment));
  }),

  http.delete('/api/appointments/:id', async ({ params }) => {
    await delay(LATENCY_MS);
    const deleted = db.deleteAppointment(String(params.id));
    return deleted
      ? new HttpResponse(null, { status: 204 })
      : HttpResponse.json({ message: 'Appointment not found.' }, { status: 404 });
  }),
];
