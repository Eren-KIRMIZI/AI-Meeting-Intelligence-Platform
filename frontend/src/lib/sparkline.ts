/**
 * Tiny pure sparkline geometry used by the dashboard stat cards.
 *
 * A charting library on the first paint costs several hundred kilobytes even
 * when the only visual is a 96×40 trend line, so the common case is drawn with
 * one SVG path. The analytics page still uses the full chart library.
 */
export interface SparklineGeometry {
  line: string;
  area: string;
  width: number;
  height: number;
}

export function sparklineGeometry(
  values: number[],
  width = 96,
  height = 40
): SparklineGeometry {
  const box = { width, height, line: '', area: '' };
  if (values.length === 0) return box;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const inset = 2;
  const usable = height - inset * 2;

  const points = values.map((value, index) => {
    const x =
      values.length === 1
        ? width / 2
        : (index / (values.length - 1)) * width;
    // A flat trend sits in the middle instead of sinking to the baseline.
    const y =
      range === 0
        ? height / 2
        : height - inset - ((value - min) / range) * usable;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const line = `M${points.join(' L')}`;
  return {
    width,
    height,
    line,
    area: `${line} L${width},${height} L0,${height} Z`,
  };
}
