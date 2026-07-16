import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../../mocks/db';
import { server } from '../../../mocks/server';
import { SchedulePage } from './SchedulePage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  db.reset();
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
});
