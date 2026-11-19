import { describe, expect, it } from 'vitest';
import { sparklineGeometry } from './sparkline';

describe('sparkline geometry', () => {
  it('returns empty paths when there is no trend', () => {
    expect(sparklineGeometry([])).toEqual({
      width: 96,
      height: 40,
      line: '',
      area: '',
    });
  });

  it('draws a flat line for a constant trend without dividing by zero', () => {
    const geometry = sparklineGeometry([5, 5, 5]);
    expect(geometry.line).toBe('M0.0,20.0 L48.0,20.0 L96.0,20.0');
    expect(geometry.area).toBe(`${geometry.line} L96,40 L0,40 Z`);
  });

  it('maps increasing values from the bottom to the top', () => {
    const geometry = sparklineGeometry([1, 2, 3], 100, 50);
    expect(geometry.line).toBe('M0.0,48.0 L50.0,25.0 L100.0,2.0');
    expect(geometry.width).toBe(100);
    expect(geometry.height).toBe(50);
  });

  it('centres a single sample', () => {
    expect(sparklineGeometry([7]).line).toBe('M48.0,20.0');
  });
});
