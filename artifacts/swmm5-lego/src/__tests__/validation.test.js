import { describe, it, expect, beforeEach } from 'vitest';
import { setGrid, emptyGrid } from '../lib/elements.js';
import { validateModel, autoFix } from '../lib/validation.js';

describe('validateModel', () => {
  beforeEach(() => { setGrid(5); });

  it('reports empty model', () => {
    const grid = emptyGrid(5);
    const result = validateModel(grid);
    expect(result.errors).toContain('Model is empty.');
  });

  it('reports missing outfall', () => {
    const grid = emptyGrid(5);
    grid[2][2] = 'manhole';
    grid[0][0] = 'grass';
    const result = validateModel(grid);
    expect(result.errors.some(e => e.includes('outfall'))).toBe(true);
  });

  it('passes for valid simple model', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[2][2] = 'manhole';
    grid[3][2] = 'pipe';
    grid[4][2] = 'outfall';
    const result = validateModel(grid);
    expect(result.errors).toHaveLength(0);
  });

  it('reports disconnected pipe', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[0][4] = 'pipe';
    grid[4][4] = 'outfall';
    const result = validateModel(grid);
    expect(result.errors.some(e => e.includes('disconnected'))).toBe(true);
    expect(result.errCells.has('0-4')).toBe(true);
  });

  it('warns about isolated nodes', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[2][2] = 'manhole';
    grid[4][4] = 'outfall';
    const result = validateModel(grid);
    expect(result.warnings.some(w => w.includes('no connected pipes'))).toBe(true);
  });

  it('warns about storage without outlet', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[2][2] = 'storage';
    grid[4][4] = 'outfall';
    const result = validateModel(grid);
    expect(result.warnings.some(w => w.includes('Storage') && w.includes('no outlet'))).toBe(true);
  });
});

describe('autoFix', () => {
  beforeEach(() => { setGrid(5); });

  it('adds outfall to model missing one', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[2][2] = 'manhole';
    const { grid: fixedGrid, fixes } = autoFix(grid);
    let hasOutfall = false;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++)
        if (fixedGrid[r][c] === 'outfall') hasOutfall = true;
    expect(hasOutfall).toBe(true);
    expect(fixes.length).toBeGreaterThan(0);
  });
});
