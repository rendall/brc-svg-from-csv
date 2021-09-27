import { addIndex, assoc, keys as Rkeys, prop as Rprop, dissoc, map } from "ramda";
import { createSVGWindow } from 'svgdom'
const window = createSVGWindow()
const document = window.document


export const createSVGElem = (tag: string, attrs?: any) => {

  var brcLayer = document.createElementNS("http://www.w3.org/2000/svg", tag);

  var parent: SVGElement | null =
    attrs === undefined ? null : Rprop("parent", attrs);
  if (parent) {
    parent.appendChild(brcLayer);
    attrs = dissoc("parent", attrs);
  }

  var id: string | null = attrs === undefined ? null : Rprop("id", attrs);
  if (id) {
    brcLayer.setAttribute("id", id);
    attrs = dissoc("id", attrs);
  }

  if (attrs)
    for (var prop in attrs!) {
      var value = attrs![prop];
      brcLayer.setAttribute(prop, value);
    }

  return brcLayer;
};

export const addAttrs = (addTo: {}, toAdd: {}): {} => {
  const keys = Rkeys(toAdd);
  if (keys.length === 0) return addTo;
  const prop = keys[0];
  const newAddTo = assoc(prop, Rprop(prop, toAdd), addTo);
  const remToAdd = dissoc(prop, toAdd);
  return addAttrs(newAddTo, remToAdd);
};

const linePath = (a: [number, number], b: [number, number]) =>
  "M " + a[0] + " " + a[1] + " L " + b[0] + " " + b[1];
export const createLine = (
  a: [number, number],
  b: [number, number],
  attrs: any
) => createSVGElem("path", addAttrs(attrs, { d: linePath(a, b) }));

export const createCircle = (
  center: [number, number],
  radius: number,
  attrs: any
) => {
  const circleAttrs = { cx: center[0], cy: center[1], r: radius };
  const sendAttrs =
    attrs === null
      ? { cx: center[0], cy: center[1], r: radius }
      : addAttrs(attrs, circleAttrs);
  return createSVGElem("circle", sendAttrs);
};
// A rx ry x-axis-rotation large-arc-flag sweep-flag x y
const arcPath = (
  a: [number, number],
  b: [number, number],
  r: number,
  largeArc: 0 | 1,
  sweep: 0 | 1
) =>
  "M " +
  a[0] +
  " " +
  a[1] +
  " A " +
  r +
  " " +
  r +
  " 0 " +
  largeArc +
  " " +
  sweep +
  " " +
  b[0] +
  " " +
  b[1];

export const createArc = (
  a: [number, number],
  b: [number, number],
  radius: number,
  largeArc: 0 | 1,
  sweep: 0 | 1,
  attrs: any
) =>
  createSVGElem(
    "path",
    addAttrs(attrs, { d: arcPath(a, b, radius, largeArc, sweep) })
  );

export const createShape = (points: [number, number][], attrs: any) => {
  const pathList = addIndex(map)(
    (p, i) => (i === 0 ? "M" : "L") + " " + p[0] + " " + p[1]
  )(points);
  const pathD = pathList.join(" ") + " z";
  const shapeAttrs = assoc("d", pathD, attrs);
  const path = createSVGElem("path", shapeAttrs);

  return path;
};
