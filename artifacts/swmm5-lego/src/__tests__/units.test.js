import { describe, it, expect } from 'vitest';
import { UNIT_SYSTEMS, convert, fmtVal } from '../lib/units.js';

describe('UNIT_SYSTEMS', () => {
  it('has US and SI systems', () => {
    expect(UNIT_SYSTEMS.us).toBeDefined();
    expect(UNIT_SYSTEMS.si).toBeDefined();
  });

  it('US system has flow units CFS', () => {
    expect(UNIT_SYSTEMS.us.flow).toBe('CFS');
  });

  it('SI system has flow units CMS', () => {
    expect(UNIT_SYSTEMS.si.flow).toBe('CMS');
  });
});

describe('convert', () => {
  it('converts feet to meters', () => {
    const result = convert(1, 'ft', 'm');
    expect(result).toBeCloseTo(0.3048, 3);
  });

  it('identity conversion returns same value', () => {
    expect(convert(5.5, 'ft', 'ft')).toBeCloseTo(5.5);
  });

  it('converts CFS to CMS', () => {
    const result = convert(1, 'CFS', 'CMS');
    expect(result).toBeCloseTo(0.02832, 3);
  });

  it('converts inches to mm', () => {
    const result = convert(1, 'in', 'mm');
    expect(result).toBeCloseTo(25.4, 1);
  });

  it('converts acres to hectares', () => {
    const result = convert(1, 'ac', 'ha');
    expect(result).toBeCloseTo(0.4047, 3);
  });

  it('round-trips correctly', () => {
    const original = 10.0;
    const toMetric = convert(original, 'ft', 'm');
    const backToUS = convert(toMetric, 'm', 'ft');
    expect(backToUS).toBeCloseTo(original, 5);
  });
});

describe('fmtVal', () => {
  it('formats a value with units', () => {
    const result = fmtVal(10.5, 'ft');
    expect(result).toBe('10.50 ft');
  });

  it('respects decimal places', () => {
    const result = fmtVal(3.14159, 'm', 3);
    expect(result).toBe('3.142 m');
  });
});
