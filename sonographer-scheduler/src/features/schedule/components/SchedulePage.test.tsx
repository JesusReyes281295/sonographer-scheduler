import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { db } from '../../../mocks/db';
import { server } from '../../../mocks/server';
import { SchedulePage } from './SchedulePage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  db.reset();
  localStorage.clear(); // drop persisted view/filter prefs so tests don't leak into each other
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SchedulePage />
    </QueryClientProvider>,
  );
}

// The grids drag with pointer events and resolve the drop target via
// document.elementFromPoint, which jsdom doesn't compute — so we point it at the
// target slot. The press moves past the drag threshold to become a drag.
function dragCardOntoSlot(card: HTMLElement, slot: HTMLElement) {
  const previous = document.elementFromPoint;
  document.elementFromPoint = () => slot;
  try {
    fireEvent.pointerDown(card, { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(card, { pointerId: 1, clientX: 40, clientY: 40 });
    fireEvent.pointerUp(card, { pointerId: 1, clientX: 40, clientY: 40 });
  } finally {
    document.elementFromPoint = previous;
  }
}

/** Books a slot that is free in the seed (Carla Reyes, 11:00–12:00) for a patient. */
async function bookFor(
  user: ReturnType<typeof userEvent.setup>,
  patientName: string,
  consultationType?: RegExp,
) {
  await user.click(screen.getByRole('button', { name: /new appointment/i }));
  const dialog = await screen.findByRole('dialog');

  await user.type(within(dialog).getByLabelText(/patient name/i), patientName);
  if (consultationType) {
    await user.selectOptions(
      within(dialog).getByLabelText(/consultation type/i),
      within(dialog).getByRole('option', { name: consultationType }),
    );
  }
  await user.selectOptions(
    within(dialog).getByLabelText(/sonographer/i),
    within(dialog).getByRole('option', { name: 'Carla Reyes' }),
  );
  fireEvent.change(within(dialog).getByLabelText(/^start/i), { target: { value: '11:00' } });
  fireEvent.change(within(dialog).getByLabelText(/^end/i), { target: { value: '12:00' } });
  await user.click(within(dialog).getByRole('button', { name: /save/i }));

  // The dialog only closes once the server confirms. Waiting for it keeps the
  // request from landing after the test ends and polluting the next one — the
  // optimistic update would otherwise let assertions resolve while it's in flight.
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

describe('SchedulePage', () => {
  it('shows a loading state and then the appointments for today', async () => {
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent(/loading schedule/i);

    expect(await screen.findByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('James Field')).toBeInTheDocument();
    expect(screen.getByText('Priya Patel')).toBeInTheDocument();
  });

  it('rejects a double-booking and keeps the appointment out of the schedule', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('button', { name: /new appointment/i }));
    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByLabelText(/patient name/i), 'Test Patient');
    // Alice Chen (s1) already has 09:00–10:00 booked in the seed data.
    await user.selectOptions(
      within(dialog).getByLabelText(/sonographer/i),
      within(dialog).getByRole('option', { name: 'Alice Chen' }),
    );
    fireEvent.change(within(dialog).getByLabelText(/start/i), { target: { value: '09:30' } });
    fireEvent.change(within(dialog).getByLabelText(/end/i), { target: { value: '10:30' } });
    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/already booked/i);
    expect(screen.queryByText('Test Patient')).not.toBeInTheDocument();
  });

  it('creates a valid appointment and shows it in the schedule', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('button', { name: /new appointment/i }));
    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByLabelText(/patient name/i), 'New Patient');
    await user.selectOptions(
      within(dialog).getByLabelText(/sonographer/i),
      within(dialog).getByRole('option', { name: 'Carla Reyes' }),
    );
    fireEvent.change(within(dialog).getByLabelText(/start/i), { target: { value: '11:00' } });
    fireEvent.change(within(dialog).getByLabelText(/end/i), { target: { value: '12:00' } });
    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    expect(await screen.findByText('New Patient')).toBeInTheDocument();
    // Let the save land before the test ends, so it can't pollute the next one.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('warns when a clinic is closed on a US holiday and recommends an open one', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('button', { name: /new appointment/i }));
    const dialog = await screen.findByRole('dialog');

    // Northside Clinic (c2) observes holidays; Christmas Day 2026 is a US federal holiday.
    await user.selectOptions(
      within(dialog).getByLabelText(/clinic/i),
      within(dialog).getByRole('option', { name: /northside clinic/i }),
    );
    fireEvent.change(within(dialog).getByLabelText(/^date/i), { target: { value: '2026-12-25' } });

    expect(await within(dialog).findByText(/closed on Christmas Day/i)).toBeInTheDocument();

    // The recommendation switches the booking to a clinic that is open that day.
    await user.click(within(dialog).getByRole('button', { name: /^Downtown Imaging$/ }));
    expect((within(dialog).getByLabelText(/clinic/i) as HTMLSelectElement).value).toBe('c1');
  });

  it('shows the consultation type on the appointment card', async () => {
    renderPage();

    // Maria Lopez's seeded appointment is an OB ultrasound.
    expect(
      await screen.findByRole('button', { name: /Maria Lopez, OB ultrasound/i }),
    ).toBeInTheDocument();
  });

  it('books the consultation type chosen in the form', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Maria Lopez');

    await bookFor(user, 'Walk-in Wendy', /Thyroid ultrasound/i);

    expect(
      await screen.findByRole('button', { name: /Walk-in Wendy, Thyroid ultrasound/i }),
    ).toBeInTheDocument();
  });

  it('registers a new patient when an unknown name is typed', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Maria Lopez');

    await bookFor(user, 'Walk-in Wendy');

    expect(await screen.findByText('Walk-in Wendy')).toBeInTheDocument();
    expect(db.listPatients().some((p) => p.name === 'Walk-in Wendy')).toBe(true);
  });

  it('reuses an existing patient instead of registering a duplicate', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Maria Lopez');
    const patientsBefore = db.listPatients().length;

    // Maria Lopez is already registered and picked from the patient list.
    await bookFor(user, 'Maria Lopez');

    expect(db.listPatients()).toHaveLength(patientsBefore);
  });
});

describe('Moving an appointment by drag-and-drop', () => {

  it('moves an appointment to another sonographer, keeping its duration', async () => {
    renderPage();
    // Seed a1: Maria Lopez, Alice Chen (s1), Downtown Imaging, 09:00–10:00.
    const card = await screen.findByRole('button', { name: /Maria Lopez, OB ultrasound/i });
    const target = screen.getByRole('button', {
      name: /Create appointment for Carla Reyes at 09:00/i,
    });

    dragCardOntoSlot(card, target);

    // Optimistically re-homed under Carla Reyes, still 09:00–10:00 at the same clinic.
    expect(
      await screen.findByRole('button', {
        name: /Maria Lopez, OB ultrasound.*Downtown Imaging, with Carla Reyes/i,
      }),
    ).toBeInTheDocument();

    // Wait for the PUT to land so it can't pollute the next test, and prove the move stuck.
    await waitFor(() => {
      const moved = db.getAppointment('a1');
      expect(moved?.sonographerId).toBe('s3');
      expect(moved?.start).toMatch(/T09:00:00$/);
      expect(moved?.end).toMatch(/T10:00:00$/);
    });
  });

  it('refuses a drop that would double-book the sonographer and leaves it in place', async () => {
    renderPage();
    // Seed a3: Alice Chen (s1) is already booked 13:00–14:00.
    const card = await screen.findByRole('button', { name: /Maria Lopez, OB ultrasound/i });
    const target = screen.getByRole('button', {
      name: /Create appointment for Alice Chen at 13:00/i,
    });

    dragCardOntoSlot(card, target);

    expect(await screen.findByRole('alert')).toHaveTextContent(/already booked/i);
    // Untouched: still 09:00–10:00 with Alice Chen, and the store never changed.
    expect(
      screen.getByRole('button', { name: /Maria Lopez, OB ultrasound.*with Alice Chen/i }),
    ).toBeInTheDocument();
    expect(db.getAppointment('a1')?.start).toMatch(/T09:00:00$/);
    expect(db.getAppointment('a1')?.sonographerId).toBe('s1');
  });
});

describe('Week view and filters', () => {
  it('switches to the week view and still shows the appointments', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('button', { name: /^week$/i }));

    expect(await screen.findByRole('region', { name: /weekly schedule/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Maria Lopez, OB ultrasound/i })).toBeInTheDocument();
  });

  it('filters the day view down to the chosen sonographer', async () => {
    renderPage();
    await screen.findByText('Maria Lopez'); // Alice Chen's patient
    expect(screen.getByText('James Field')).toBeInTheDocument(); // Brian Osei's patient

    // The filter checkbox is in the DOM even while the panel is collapsed.
    fireEvent.click(screen.getByLabelText('Alice Chen'));

    await waitFor(() => expect(screen.queryByText('James Field')).not.toBeInTheDocument());
    expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
  });

  it('persists the chosen view', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('button', { name: /^week$/i }));

    await waitFor(() => expect(localStorage.getItem('scheduler.view')).toBe('"week"'));
  });

  it('moves an appointment to another day by dragging it in the week view', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('button', { name: /^week$/i }));
    await screen.findByRole('region', { name: /weekly schedule/i });

    // a1 (Maria Lopez, Alice Chen, 09:00–10:00) sits on today's column.
    const card = await screen.findByRole('button', { name: /Maria Lopez, OB ultrasound/i });
    const today = format(new Date(), 'yyyy-MM-dd');
    const target = Array.from(
      document.querySelectorAll<HTMLElement>('[data-slot][data-minutes="540"]'),
    ).find((slot) => slot.dataset.date && slot.dataset.date !== today);
    expect(target).toBeTruthy();
    const targetDate = target!.dataset.date!;

    dragCardOntoSlot(card, target!);

    // Landed on the new day at 09:00, same sonographer — and the move persisted.
    await waitFor(() => {
      const moved = db.getAppointment('a1');
      expect(moved?.start.startsWith(targetDate)).toBe(true);
      expect(moved?.start).toMatch(/T09:00:00$/);
      expect(moved?.sonographerId).toBe('s1');
    });
  });
});

describe('Managing the hospital', () => {
  async function openManagement(user: ReturnType<typeof userEvent.setup>) {
    renderPage();
    await screen.findByText('Maria Lopez');
    await user.click(screen.getByRole('button', { name: /^manage$/i }));
    return screen.findByRole('dialog', { name: /manage your hospital/i });
  }

  it('adds a sonographer and shows it in the schedule right away', async () => {
    const user = userEvent.setup();
    const manage = await openManagement(user);

    await user.click(within(manage).getByRole('button', { name: /^sonographers$/i }));
    await user.click(within(manage).getByRole('button', { name: /add sonographer/i }));
    await user.type(within(manage).getByLabelText(/name/i), 'Hugo Silva');
    await user.click(within(manage).getByRole('button', { name: /^save$/i }));

    await user.click(within(manage).getByRole('button', { name: /^close$/i }));

    // A real column in the grid (scoped so it doesn't match the filter checkbox).
    const grid = screen.getByRole('region', { name: /daily schedule/i });
    expect(await within(grid).findByText('Hugo Silva')).toBeInTheDocument();
  });

  it('refuses to delete a clinic that still has appointments', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    const manage = await openManagement(user);

    // Downtown Imaging is used by the seeded appointments.
    const row = within(manage).getByText('Downtown Imaging').closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /delete/i }));

    expect(await within(manage).findByRole('alert')).toHaveTextContent(/still use/i);
    expect(db.listClinics().some((c) => c.name === 'Downtown Imaging')).toBe(true);

    confirm.mockRestore();
  });

  it('renames a study type and the schedule picks it up', async () => {
    const user = userEvent.setup();
    const manage = await openManagement(user);

    await user.click(within(manage).getByRole('button', { name: /^study types$/i }));
    const row = within(manage).getByText('OB ultrasound').closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /edit/i }));

    const nameInput = within(manage).getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Obstetric scan');
    await user.click(within(manage).getByRole('button', { name: /^save$/i }));

    await user.click(within(manage).getByRole('button', { name: /^close$/i }));

    expect(
      await screen.findByRole('button', { name: /Maria Lopez, Obstetric scan/i }),
    ).toBeInTheDocument();
  });
});
