import { clockToDegs, polarToXY } from "./map-brc";

describe("clockToDegs returns proper angle given clock time", () => {
  const tests: [string, number][] = [
    ["12:00", 0],
    ["1:00", 30],
    ["3:00", 90],
    ["4:30", 135],
    ["5:37", 168.5],
    ["7:30", 225],
    ["9:00", 270],
    ["11:00", 330],
    ["11", 330],
    [":43", NaN],
    ["bad-input", NaN],
  ];

  tests.forEach((t) => {
    it(`${t[0]} return ${t[1]}`, () => {
      const deg = clockToDegs(t[0]);
      expect(deg).toBe(t[1]);
    });
  });
});

interface PolarToXY {
  center: [number, number];
  radius: number;
  angle: number;
  expected: [number, number];
}
describe("polarToXY returns proper coordinates given center, radius/distance, angle", () => {
  const tests: PolarToXY[] = [
    { center: [0, 0], radius: 1, angle: 0, expected: [1, 0] },
    {
      center: [0, 0],
      radius: 5,
      angle: 45,
      expected: [3.5355339059327378, 3.5355339059327373],
    },
    {
      center: [0, 0],
      radius: 1,
      angle: 90,
      expected: [6.123233995736766e-17, 1],
    },
  ];

  tests.forEach((t) => {
    const { center, radius, angle, expected } = t;

    it(`polarToXY(${center}, ${radius}, ${angle}) is ${expected}`, () => {
      const xy = polarToXY(center, radius, angle);
      expect(xy).toMatchObject(expected);
    });
  });
});
