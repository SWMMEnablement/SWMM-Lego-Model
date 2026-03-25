import { describe, it, expect, beforeEach } from 'vitest';
import { setGrid, emptyGrid } from '../lib/elements.js';
import { cnInfiltration, manningPipe, manningOverland, buildModel, runSWMM5 } from '../lib/hydraulics.js';

describe('cnInfiltration', () => {
  it('returns 0 when P_cum <= Ia', () => {
    expect(cnInfiltration(0.5, 39)).toBe(0);
  });

  it('returns positive runoff when P_cum > Ia', () => {
    const result = cnInfiltration(5.0, 98);
    expect(result).toBeGreaterThan(0);
  });

  it('CN=100 returns full precipitation', () => {
    expect(cnInfiltration(3.0, 100)).toBe(3.0);
  });

  it('CN=0 returns full precipitation', () => {
    expect(cnInfiltration(3.0, 0)).toBe(3.0);
  });

  it('higher CN produces more runoff', () => {
    const low = cnInfiltration(3.0, 50);
    const high = cnInfiltration(3.0, 90);
    expect(high).toBeGreaterThan(low);
  });
});

describe('manningPipe', () => {
  it('returns 0 for zero depth', () => {
    expect(manningPipe(0, 1.5, 0.01, 0.013)).toBe(0);
  });

  it('returns positive flow for positive depth and slope', () => {
    const flow = manningPipe(0.5, 1.5, 0.01, 0.013);
    expect(flow).toBeGreaterThan(0);
  });

  it('higher slope produces more flow', () => {
    const low = manningPipe(0.5, 1.5, 0.001, 0.013);
    const high = manningPipe(0.5, 1.5, 0.01, 0.013);
    expect(high).toBeGreaterThan(low);
  });
});

describe('manningOverland', () => {
  it('returns 0 below depression storage', () => {
    expect(manningOverland(0.05, 0.1, 100, 0.5, 0.15)).toBe(0);
  });

  it('returns positive flow above depression storage', () => {
    const flow = manningOverland(1.0, 0.1, 100, 0.5, 0.15);
    expect(flow).toBeGreaterThan(0);
  });
});

describe('buildModel', () => {
  beforeEach(() => { setGrid(5); });

  it('returns empty model for empty grid', () => {
    const grid = emptyGrid(5);
    const model = buildModel(grid, {});
    expect(model.allNodes).toHaveLength(0);
    expect(model.conduits).toHaveLength(0);
    expect(model.subcatchments).toHaveLength(0);
  });

  it('finds junctions and outfalls', () => {
    const grid = emptyGrid(5);
    grid[2][2] = 'manhole';
    grid[4][2] = 'outfall';
    const model = buildModel(grid, {});
    expect(model.junctions).toHaveLength(1);
    expect(model.outfalls).toHaveLength(1);
    expect(model.allNodes).toHaveLength(2);
  });

  it('finds storage nodes separately from junctions', () => {
    const grid = emptyGrid(5);
    grid[1][1] = 'storage';
    grid[3][1] = 'outfall';
    const model = buildModel(grid, {});
    expect(model.storage).toHaveLength(1);
    expect(model.junctions).toHaveLength(0);
  });

  it('finds conduits connecting nodes', () => {
    const grid = emptyGrid(5);
    grid[1][1] = 'manhole';
    grid[1][2] = 'pipe';
    grid[1][3] = 'outfall';
    const model = buildModel(grid, {});
    expect(model.conduits.length).toBeGreaterThanOrEqual(1);
  });

  it('detects subcatchments from surface cells', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[0][1] = 'grass';
    grid[2][2] = 'manhole';
    grid[4][2] = 'outfall';
    const model = buildModel(grid, {});
    expect(model.subcatchments).toHaveLength(1);
    expect(model.subcatchments[0].cells).toHaveLength(2);
  });

  it('respects outlet override in cellProps', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[0][1] = 'grass';
    grid[2][2] = 'manhole';
    grid[4][4] = 'outfall';
    const model = buildModel(grid, {
      '0-0': { outletNode: 'outfall_4_4' }
    });
    expect(model.subcatchments[0].outlet.id).toBe('outfall_4_4');
  });

  it('classifies pumps, orifices, and weirs', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'manhole';
    grid[0][1] = 'pump';
    grid[0][2] = 'outfall';
    const model = buildModel(grid, {});
    expect(model.pumps.length).toBeGreaterThanOrEqual(1);
    expect(model.allConduitLike.length).toBeGreaterThan(model.conduits.length);
  });
});

describe('runSWMM5', () => {
  beforeEach(() => { setGrid(5); });

  it('returns null for empty model', () => {
    const grid = emptyGrid(5);
    const storm = { rain: [1, 2, 1, 0.5], dtRain: 300 };
    expect(runSWMM5(grid, storm, {})).toBeNull();
  });

  it('runs simulation and produces results', () => {
    const grid = emptyGrid(5);
    grid[0][0] = 'grass';
    grid[0][1] = 'grass';
    grid[0][2] = 'grass';
    grid[2][2] = 'manhole';
    grid[3][2] = 'pipe';
    grid[4][2] = 'outfall';
    const storm = { rain: [1, 2, 1, 0.5], dtRain: 300 };
    const result = runSWMM5(grid, storm, {});
    expect(result).not.toBeNull();
    expect(result.subcatchments).toHaveLength(1);
    expect(result.systemHistory.length).toBeGreaterThan(0);
    expect(result.allNodes.length).toBeGreaterThan(0);
  });
});
