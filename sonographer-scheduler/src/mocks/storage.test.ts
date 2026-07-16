import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY, clearState, loadState, saveState } from './storage';

describe('local storage adapter', () => {
  beforeEach(() => {
    localStorage.clear();
    clearState();
  });

  it('returns null when nothing is stored', () => {
    expect(loadState()).toBeNull();
  });

  it('round-trips saved data', () => {
    saveState({ appointments: ['a1', 'a2'] });
    expect(loadState()).toEqual({ appointments: ['a1', 'a2'] });
  });

  it('clears stored data', () => {
    saveState({ appointments: [] });
    clearState();
    expect(loadState()).toBeNull();
  });

  it('ignores corrupt JSON and resets the key', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(loadState()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    warn.mockRestore();
  });

  it('discards data from an older schema version', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 0, data: { appointments: [] } }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(loadState()).toBeNull();

    warn.mockRestore();
  });
});
