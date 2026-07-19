import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocalStorage } from './useLocalStorage';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('useLocalStorage', () => {
  it('returns the initial value on first render, matching SSR output', () => {
    const { result } = renderHook(() => useLocalStorage('nursing.test', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('syncs from a pre-seeded localStorage value after mount', async () => {
    window.localStorage.setItem('nursing.test', JSON.stringify('seeded'));
    const { result } = renderHook(() => useLocalStorage('nursing.test', 'default'));
    await act(async () => {});
    expect(result.current[0]).toBe('seeded');
  });

  it('persists a new value to localStorage and updates state', () => {
    const { result } = renderHook(() => useLocalStorage('nursing.test', 'default'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(window.localStorage.getItem('nursing.test')).toBe(JSON.stringify('updated'));
  });

  it('supports the functional updater form', () => {
    const { result } = renderHook(() => useLocalStorage('nursing.count', 1));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(2);
    expect(window.localStorage.getItem('nursing.count')).toBe('2');
  });

  it('keeps in-memory state working even when localStorage throws', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const { result } = renderHook(() => useLocalStorage('nursing.test', 'default'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
  });

  it('falls back to initialValue when stored JSON is malformed', async () => {
    window.localStorage.setItem('nursing.test', 'not-json{');
    const { result } = renderHook(() => useLocalStorage('nursing.test', 'default'));
    await act(async () => {});
    expect(result.current[0]).toBe('default');
  });
});
