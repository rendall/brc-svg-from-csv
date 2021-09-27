import { curry } from "ramda";

export const DEG_TO_RADS = Math.PI / 180;
export const nwModulo = curry<(x: number, y: number) => number>(
  (x: number, y: number) => y % x
); // non-weird modulo.  Remainder of y/x

/* Given two sets of two points (two lines), this function returns the point of intersection */
export const linesIntersection = (
  a: [[number, number], [number, number]],
  b: [[number, number], [number, number]]
): [number, number] => {
  const X0 = (a: [[number, number], [number, number]]) => a[0][0];
  const Y0 = (a: [[number, number], [number, number]]) => a[0][1];
  const X1 = (a: [[number, number], [number, number]]): number => a[1][0];
  const Y1 = (a: [[number, number], [number, number]]) => a[1][1];
  const x1 = X0(a);
  const y1 = Y0(a);
  const x2 = X1(a);
  const y2 = Y1(a);
  const x3 = X0(b);
  const y3 = Y0(b);
  const x4 = X1(b);
  const y4 = Y1(b);

  const xnum =
    (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
  const xden = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  const ynum =
    (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
  const yden = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  return [xnum / xden, ynum / yden];
};

export function circlesIntersection(
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number
) {
  var a, dx, dy, d, h, rx, ry;
  var x2, y2;

  /* dx and dy are the vertical and horizontal distances between
   * the circle centers.
   */
  dx = x1 - x0;
  dy = y1 - y0;

  /* Determine the straight-line distance between the centers. */
  d = Math.sqrt(dy * dy + dx * dx);

  /* Check for solvability. */
  if (d > r0 + r1) {
    /* no solution. circles do not intersect. */
    return null;
  }
  if (d < Math.abs(r0 - r1)) {
    /* no solution. one circle is contained in the other */
    return null;
  }

  /* 'point 2' is the point where the line through the circle
   * intersection points crosses the line between the circle
   * centers.
   */

  /* Determine the distance from point 0 to point 2. */
  a = (r0 * r0 - r1 * r1 + d * d) / (2.0 * d);

  /* Determine the coordinates of point 2. */
  x2 = x0 + (dx * a) / d;
  y2 = y0 + (dy * a) / d;

  /* Determine the distance from point 2 to either of the
   * intersection points.
   */
  h = Math.sqrt(r0 * r0 - a * a);

  /* Now determine the offsets of the intersection points from
   * point 2.
   */
  rx = -dy * (h / d);
  ry = dx * (h / d);

  /* Determine the absolute intersection points. */
  var xi = x2 + rx;
  var xi_prime = x2 - rx;
  var yi = y2 + ry;
  var yi_prime = y2 - ry;

  return [
    [xi, yi],
    [xi_prime, yi_prime],
  ];
}

export const getDistance = (a: [number, number], b: [number, number]) =>
  Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
