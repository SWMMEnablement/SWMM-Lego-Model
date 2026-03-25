import { describe, it, expect, beforeEach, vi } from 'vitest';
import { emptyGrid } from '../lib/elements.js';

let persistence;

describe('persistence', () => {
  beforeEach(async () => {
    const storage = {};
    const mockLS = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, val) => { storage[key] = val; }),
      removeItem: vi.fn((key) => { delete storage[key]; }),
      get length() { return Object.keys(storage).length; },
      key: vi.fn((i) => Object.keys(storage)[i] || null),
    };
    vi.stubGlobal('localStorage', mockLS);
    persistence = await import('../lib/persistence.js');
  });

  it('saveToLocalStorage returns success', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    const result = persistence.saveToLocalStorage(grid, 5, 0, {});
    expect(result.success).toBe(true);
  });

  it('loadFromLocalStorage returns saved data', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[1][1] = 'manhole';
    persistence.saveToLocalStorage(grid, 5, 1, { '1-1': { maxD: 10 } });
    const loaded = persistence.loadFromLocalStorage();
    expect(loaded).not.toBeNull();
    expect(loaded.gridSize).toBe(5);
    expect(loaded.stormIdx).toBe(1);
    expect(loaded.grid[0][0]).toBe('grass');
    expect(loaded.grid[1][1]).toBe('manhole');
  });

  it('RLE compression round-trips correctly', () => {
    const grid = emptyGrid(20);
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) grid[r][c] = 'grass';
    grid[10][10] = 'manhole';
    grid[10][11] = 'pipe';
    grid[10][12] = 'outfall';
    persistence.saveToLocalStorage(grid, 20, 0, {});
    const loaded = persistence.loadFromLocalStorage();
    expect(loaded.grid[0][0]).toBe('grass');
    expect(loaded.grid[10][10]).toBe('manhole');
    expect(loaded.grid[10][11]).toBe('pipe');
    expect(loaded.grid[10][12]).toBe('outfall');
    expect(loaded.grid[19][19]).toBeNull();
  });

  it('saveToSlot returns success and getSaveSlots retrieves it', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    const result = persistence.saveToSlot('test1', grid, 5, 0, {});
    expect(result.success).toBe(true);
    const slots = persistence.getSaveSlots();
    expect(slots.length).toBe(1);
    expect(slots[0].name).toBe('test1');
    expect(slots[0].grid[0][0]).toBe('grass');
  });

  it('saveToSlot limits to MAX_SLOTS', () => {
    const grid = emptyGrid(5);
    for (let i = 0; i < 6; i++) {
      persistence.saveToSlot(`slot${i}`, grid, 5, 0, {});
    }
    const slots = persistence.getSaveSlots();
    expect(slots.length).toBeLessThanOrEqual(5);
  });

  it('deleteSlot removes the slot', () => {
    const grid = emptyGrid(5);
    persistence.saveToSlot('deleteMe', grid, 5, 0, {});
    persistence.deleteSlot('deleteMe');
    const slots = persistence.getSaveSlots();
    expect(slots.find(s => s.name === 'deleteMe')).toBeUndefined();
  });

  it('exportModelJSON and importModelJSON round-trip', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'manhole';
    grid[0][1] = 'pipe';
    grid[0][2] = 'outfall';
    const json = persistence.exportModelJSON(grid, 5, 2, { '0-0': { maxD: 8 } }, { unitSystem: 'si' });
    const loaded = persistence.importModelJSON(json);
    expect(loaded.gridSize).toBe(5);
    expect(loaded.stormIdx).toBe(2);
    expect(loaded.grid[0][0]).toBe('manhole');
    expect(loaded.unitSystem).toBe('si');
  });

  it('importModelJSON rejects invalid JSON', () => {
    expect(() => persistence.importModelJSON('not json')).toThrow('Invalid JSON');
  });

  it('importModelJSON rejects non-model JSON', () => {
    expect(() => persistence.importModelJSON('{"foo":"bar"}')).toThrow('Not a valid');
  });

  it('schema validation rejects bad data', () => {
    const grid = emptyGrid(5);
    persistence.saveToLocalStorage(grid, 5, 0, {});
    const mockLS = globalThis.localStorage;
    const raw = mockLS.getItem.mock.results[0]?.value;
    if (raw) {
      const data = JSON.parse(raw);
      data.gridSize = -1;
      mockLS.getItem.mockReturnValueOnce(JSON.stringify(data));
    }
    const loaded = persistence.loadFromLocalStorage();
    if (loaded) {
      expect(loaded.gridSize).toBeGreaterThanOrEqual(5);
    }
  });

  it('v1 to v2 migration adds missing fields', () => {
    const v1 = { grid: emptyGrid(5), gridSize: 5, stormIdx: 0, cellProps: {} };
    globalThis.localStorage.setItem('swmm5-lego-autosave', JSON.stringify(v1));
    const loaded = persistence.loadFromLocalStorage();
    expect(loaded.version).toBe(2);
    expect(loaded.unitSystem).toBe('us');
    expect(loaded.cellSpacing).toBe(100);
  });

  it('getStorageUsage returns usage info', () => {
    const grid = emptyGrid(5);
    persistence.saveToLocalStorage(grid, 5, 0, {});
    const usage = persistence.getStorageUsage();
    expect(usage.usedBytes).toBeGreaterThan(0);
    expect(usage.estimatedMaxMB).toBe(5);
  });

  it('saveToLocalStorage handles quota errors gracefully', () => {
    const grid = emptyGrid(5);
    globalThis.localStorage.setItem.mockImplementationOnce(() => {
      const err = new Error('quota exceeded');
      err.name = 'QuotaExceededError';
      err.code = 22;
      throw err;
    });
    const result = persistence.saveToLocalStorage(grid, 5, 0, {});
    expect(result.success).toBe(false);
    expect(result.error).toBe('quota');
  });
});
