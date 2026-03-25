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

  it('includes [LOSSES] section when conduits are present', () => {
    const grid = emptyGrid(5);
    grid[1][1] = 'manhole';
    grid[1][2] = 'pipe';
    grid[1][3] = 'outfall';
    const inp = exportINP(grid, storm, {});
    expect(inp).toContain('[LOSSES]');
  });

  it('includes [CURVES] section when pump is present', () => {
    const grid = emptyGrid(5);
    grid[1][1] = 'manhole';
    grid[1][2] = 'pump';
    grid[1][3] = 'outfall';
    const inp = exportINP(grid, storm, {});
    expect(inp).toContain('[CURVES]');
  });

  it('includes [MAP] section', () => {
    const grid = emptyGrid(5);
    grid[1][1] = 'manhole';
    grid[1][2] = 'pipe';
    grid[1][3] = 'outfall';
    const inp = exportINP(grid, storm, {});
    expect(inp).toContain('[MAP]');
  });

  it('includes [TAGS] section when nodes exist', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[1][1] = 'manhole';
    grid[1][2] = 'pipe';
    grid[1][3] = 'outfall';
    const inp = exportINP(grid, storm, {});
    expect(inp).toContain('[TAGS]');
  });

  it('uses cellProps diameter in XSECTIONS', () => {
    const grid = emptyGrid(5);
    grid[1][1] = 'manhole';
    grid[1][2] = 'pipe';
    grid[1][3] = 'outfall';
    const cellProps = { '1-2': { diam: 3.5 } };
    const inp = exportINP(grid, storm, cellProps);
    expect(inp).toContain('3.5');
  });

  it('uses cellProps loss coefficients in LOSSES', () => {
    const grid = emptyGrid(5);
    grid[1][1] = 'manhole';
    grid[1][2] = 'pipe';
    grid[1][3] = 'outfall';
    const cellProps = { '1-2': { kEntry: 0.8, kExit: 1.2 } };
    const inp = exportINP(grid, storm, cellProps);
    expect(inp).toContain('[LOSSES]');
    expect(inp).toContain('0.8');
    expect(inp).toContain('1.2');
  });

  it('includes TRAPEZOIDAL cross-section from cellProps', () => {
    const grid = emptyGrid(5);
    grid[1][1] = 'manhole';
    grid[1][2] = 'pipe';
    grid[1][3] = 'outfall';
    const cellProps = { '1-2': { xsecShape: 'TRAPEZOIDAL', diam: 3.0, xsecWidth: 5.0 } };
    const inp = exportINP(grid, storm, cellProps);
    expect(inp).toContain('TRAPEZOIDAL');
  });

  it('includes divider node in output', () => {
    const grid = emptyGrid(5);
    grid[1][0] = 'manhole';
    grid[1][1] = 'pipe';
    grid[1][2] = 'divider';
    grid[1][3] = 'pipe';
    grid[1][4] = 'outfall';
    const inp = exportINP(grid, storm, {});
    expect(inp).toContain('[DIVIDERS]');
  });
});
