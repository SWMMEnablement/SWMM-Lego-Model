import { describe, it, expect, beforeEach } from 'vitest';
import { setGrid } from '../lib/elements.js';
import { importINP } from '../lib/importInp.js';

function makeInp(sections) {
  return Object.entries(sections).map(([sec, lines]) =>
    `[${sec}]\n${lines.join('\n')}`
  ).join('\n\n');
}

describe('importINP', () => {
  beforeEach(() => { setGrid(20); });

  it('parses junctions with coordinates and places them on grid', () => {
    const inp = makeInp({
      JUNCTIONS: ['J1  100  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      COORDINATES: ['J1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp, 20);
    expect(result.counts.nJunctions).toBe(1);
    expect(result.counts.nOutfalls).toBe(1);
    let foundManhole = false, foundOutfall = false;
    for (let r = 0; r < 20; r++)
      for (let c = 0; c < 20; c++) {
        if (result.grid[r][c] === 'manhole') foundManhole = true;
        if (result.grid[r][c] === 'outfall') foundOutfall = true;
      }
    expect(foundManhole).toBe(true);
    expect(foundOutfall).toBe(true);
  });

  it('preserves conduit cellProps (diameter, Manning n, losses)', () => {
    const inp = makeInp({
      JUNCTIONS: ['J1  100  6  0  0  0', 'J2  95  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      CONDUITS: [
        'C1  J1  J2  200  0.015  0  0  0  0',
        'C2  J2  Out1  200  0.018  0  0  0  0',
      ],
      XSECTIONS: [
        'C1  CIRCULAR  2.0  0  0  0  1  0',
        'C2  CIRCULAR  3.0  0  0  0  1  0',
      ],
      LOSSES: [
        'C1  0.5  1.0  0.3  NO',
      ],
      COORDINATES: [
        'J1  100  200',
        'J2  300  200',
        'Out1  500  200',
      ],
    });
    const result = importINP(inp, 20);
    expect(result.counts.nConduits).toBe(2);
    expect(result.counts.nCellPropsImported).toBeGreaterThan(0);
    const props = Object.values(result.cellProps);
    const hasDiam = props.some(p => p.diam === 2.0 || p.diam === 3.0);
    expect(hasDiam).toBe(true);
    const hasLoss = props.some(p => p.kEntry === 0.5);
    expect(hasLoss).toBe(true);
  });

  it('handles HORTON infiltration method', () => {
    const inp = makeInp({
      OPTIONS: ['INFILTRATION  HORTON'],
      JUNCTIONS: ['J1  100  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      SUBCATCHMENTS: ['S1  RG1  J1  5.0  50  500  0.5  0  OUTLET'],
      SUBAREAS: ['S1  0.015  0.24  0.06  0.3  0  OUTLET'],
      INFILTRATION: ['S1  3.0  0.5  4.0  7  0'],
      COORDINATES: ['J1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp, 20);
    expect(result.subcatchInfo.length).toBe(1);
    expect(result.subcatchInfo[0].infiltMethod).toBe('HORTON');
    expect(result.subcatchInfo[0].hortonMax).toBe(3.0);
    expect(result.subcatchInfo[0].hortonMin).toBe(0.5);
  });

  it('handles GREEN_AMPT infiltration method', () => {
    const inp = makeInp({
      OPTIONS: ['INFILTRATION  GREEN_AMPT'],
      JUNCTIONS: ['J1  100  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      SUBCATCHMENTS: ['S1  RG1  J1  5.0  50  500  0.5  0  OUTLET'],
      SUBAREAS: ['S1  0.015  0.24  0.06  0.3  0  OUTLET'],
      INFILTRATION: ['S1  6.0  0.3  0.25'],
      COORDINATES: ['J1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp, 20);
    expect(result.subcatchInfo[0].infiltMethod).toBe('GREEN_AMPT');
    expect(result.subcatchInfo[0].gaSuction).toBe(6.0);
    expect(result.subcatchInfo[0].gaConduct).toBe(0.3);
  });

  it('imports storage nodes', () => {
    const inp = makeInp({
      STORAGE: ['ST1  100  10  0  TABULAR  CurveST1  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      COORDINATES: ['ST1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp, 20);
    expect(result.counts.nStorage).toBe(1);
    let foundStorage = false;
    for (let r = 0; r < 20; r++)
      for (let c = 0; c < 20; c++)
        if (result.grid[r][c] === 'storage') foundStorage = true;
    expect(foundStorage).toBe(true);
  });

  it('imports pump links', () => {
    const inp = makeInp({
      JUNCTIONS: ['J1  100  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      PUMPS: ['P1  J1  Out1  CurveP1  ON  0'],
      COORDINATES: ['J1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp, 20);
    expect(result.counts.nPumps).toBe(1);
    let foundPump = false;
    for (let r = 0; r < 20; r++)
      for (let c = 0; c < 20; c++)
        if (result.grid[r][c] === 'pump') foundPump = true;
    expect(foundPump).toBe(true);
  });

  it('returns warnings for nodes with no coordinates', () => {
    const inp = makeInp({
      JUNCTIONS: ['J1  100  6  0  0  0', 'J2  95  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      COORDINATES: ['J1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp, 20);
    expect(result.warnings.some(w => w.includes('J2'))).toBe(true);
  });

  it('returns empty result for INP with no coordinates', () => {
    const inp = makeInp({
      JUNCTIONS: ['J1  100  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
    });
    const result = importINP(inp, 20);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('COORDINATES');
  });

  it('imports polygon-based subcatchments', () => {
    const inp = makeInp({
      JUNCTIONS: ['J1  100  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      SUBCATCHMENTS: ['S1  RG1  J1  5.0  10  500  0.5  0  OUTLET'],
      SUBAREAS: ['S1  0.015  0.24  0.06  0.3  0  OUTLET'],
      INFILTRATION: ['S1  75'],
      Polygons: ['S1  50  250', 'S1  150  250', 'S1  150  150', 'S1  50  150'],
      COORDINATES: ['J1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp, 20);
    expect(result.subcatchInfo.length).toBe(1);
    expect(result.subcatchInfo[0].cellsPlaced).toBeGreaterThan(0);
  });

  it('imports TRAPEZOIDAL cross-section shape', () => {
    const inp = makeInp({
      JUNCTIONS: ['J1  100  6  0  0  0', 'J2  95  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      CONDUITS: ['C1  J1  J2  200  0.013  0  0  0  0'],
      XSECTIONS: ['C1  TRAPEZOIDAL  3.0  5.0  0  0  1  0'],
      COORDINATES: ['J1  100  200', 'J2  300  200', 'Out1  500  200'],
    });
    const result = importINP(inp, 20);
    const props = Object.values(result.cellProps);
    const hasTrap = props.some(p => p.xsecShape === 'TRAPEZOIDAL');
    expect(hasTrap).toBe(true);
  });

  it('preserves junction maxDepth as cellProps', () => {
    const inp = makeInp({
      JUNCTIONS: ['J1  100  12  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      COORDINATES: ['J1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp, 20);
    const props = Object.values(result.cellProps);
    const hasDepth = props.some(p => p.maxD === 12);
    expect(hasDepth).toBe(true);
  });

  it('parses OPTIONS section', () => {
    const inp = makeInp({
      OPTIONS: ['FLOW_UNITS  CFS', 'INFILTRATION  CURVE_NUMBER', 'ROUTING_STEP  30'],
      JUNCTIONS: ['J1  100  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      COORDINATES: ['J1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp, 20);
    expect(result.options.FLOW_UNITS).toBe('CFS');
    expect(result.options.ROUTING_STEP).toBe('30');
  });

  it('auto-sizes grid based on node/link count', () => {
    const inp = makeInp({
      JUNCTIONS: ['J1  100  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      COORDINATES: ['J1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp);
    expect(result.gridSize).toBeGreaterThanOrEqual(20);
  });

  it('imports Manning roughness from correct CONDUITS column', () => {
    const inp = makeInp({
      JUNCTIONS: ['J1  100  6  0  0  0', 'J2  95  6  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      CONDUITS: [
        'C1  J1  J2  200  0.025  0  0  0  0',
      ],
      XSECTIONS: ['C1  CIRCULAR  2.0  0  0  0  1  0'],
      COORDINATES: ['J1  100  200', 'J2  300  200', 'Out1  500  200'],
    });
    const result = importINP(inp, 20);
    const props = Object.values(result.cellProps);
    const hasMann = props.some(p => p.mann === 0.025);
    expect(hasMann).toBe(true);
  });

  it('handles divider nodes', () => {
    const inp = makeInp({
      DIVIDERS: ['D1  100  J2  WEIR  1.0  0.5  0  0  0  0  0'],
      OUTFALLS: ['Out1  90  FREE  NO'],
      COORDINATES: ['D1  100  200', 'Out1  300  200'],
    });
    const result = importINP(inp, 20);
    expect(result.counts.nDividers).toBe(1);
    let foundDivider = false;
    for (let r = 0; r < 20; r++)
      for (let c = 0; c < 20; c++)
        if (result.grid[r][c] === 'divider') foundDivider = true;
    expect(foundDivider).toBe(true);
  });
});
