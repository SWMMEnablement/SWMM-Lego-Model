import { describe, it, expect, beforeEach } from 'vitest';
import { setGrid, emptyGrid } from '../lib/elements.js';
import { exportINP } from '../lib/exportInp.js';

describe('exportINP', () => {
  beforeEach(() => { setGrid(5); });

  const storm = { rain: [1, 2, 1, 0.5], dtRain: 300 };

  it('generates valid INP text with all required sections', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[0][1] = 'grass';
    grid[2][2] = 'manhole';
    grid[3][2] = 'pipe';
    grid[4][2] = 'outfall';
    const inp = exportINP(grid, storm, {});
    expect(inp).toContain('[OPTIONS]');
    expect(inp).toContain('[JUNCTIONS]');
    expect(inp).toContain('[OUTFALLS]');
    expect(inp).toContain('[CONDUITS]');
    expect(inp).toContain('[SUBCATCHMENTS]');
    expect(inp).toContain('[XSECTIONS]');
    expect(inp).toContain('[RAINGAGES]');
  });

  it('uses CFS for US unit system', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[2][2] = 'outfall';
    const inp = exportINP(grid, storm, {}, { unitSystem: 'us' });
    expect(inp).toContain('FLOW_UNITS           CFS');
  });

  it('uses CMS for SI unit system', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[2][2] = 'outfall';
    const inp = exportINP(grid, storm, {}, { unitSystem: 'si' });
    expect(inp).toContain('FLOW_UNITS           CMS');
  });

  it('includes STORAGE section when storage nodes present', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[1][1] = 'storage';
    grid[1][2] = 'pipe';
    grid[1][3] = 'outfall';
    const inp = exportINP(grid, storm, {});
    expect(inp).toContain('[STORAGE]');
  });

  it('includes PUMPS section when pump links present', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[1][1] = 'manhole';
    grid[1][2] = 'pump';
    grid[1][3] = 'outfall';
    const inp = exportINP(grid, storm, {});
    expect(inp).toContain('[PUMPS]');
  });

  it('includes Barrels field in XSECTIONS for conduits', () => {
    const grid = emptyGrid(5);
    grid[1][1] = 'manhole';
    grid[1][2] = 'pipe';
    grid[1][3] = 'outfall';
    const inp = exportINP(grid, storm, {});
    const xsLines = inp.split('\n').filter(l => l.includes('CIRCULAR') && !l.startsWith(';;'));
    xsLines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      expect(parts.length).toBeGreaterThanOrEqual(7);
    });
  });
});
