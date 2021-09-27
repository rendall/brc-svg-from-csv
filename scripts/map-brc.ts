import type { BMArtLocation, BMCampLocation, BMMapData } from "./types";
import {
  curry,
  compose,
  map,
  add,
  multiply,
  flatten,
  defaultTo,
  range,
  evolve,
} from "ramda";
import * as SVG from "./svg-utils";
import * as geo from "./geo-utils";

export interface BRCMap {
  svg: SVGElement;
  gpsToXY: (pt: [number, number]) => [number, number];
  artAddressToXY: (location: BMArtLocation) => [number, number] | null;
  campAddressToXY: (address: BMCampLocation) => [number, number] | null;
}

const scalePt = (f: number, a: [number, number]) =>
  <[number, number]>[a[0] * f, a[1] * f];
const scalePt10E3 = curry(scalePt)(10000);
const translatePt = (tx: number, ty: number, a: [number, number]) =>
  <[number, number]>[a[0] + tx, a[1] + ty];

const swapPt = (a: [number, number]) => <[number, number]>[a[1], a[0]];

// flip coordinates along a vertical axis
const flipV = (yAxis: number, a: [number, number]) =>
  <[number, number]>[a[0], a[1] + 2 * (yAxis - a[1])];

const mod360 = geo.nwModulo(360);
const mod12 = geo.nwModulo(12);
// take clock string of the form hh:mm and return an angle with 0° due north
export const clockToDegs = (clockCoord: string) =>
  (compose(
    mod360,
    multiply(30),
    mod12,
    parseInt
  )(clockCoord.split(":")[0]) as number) +
  compose(multiply(0.5), parseInt)(defaultTo("0", clockCoord.split(":")[1]));

// given a center point, a radius, an angle, and a coordinate rotation at center, return an x,y coordinate
export const polarToXY = (
  centerXY: [number, number],
  radius: number,
  angle: number,
  rotate: number = 0
): [number, number] => {
  const rotateAngle = add(rotate);
  return [
    radius * Math.cos(geo.DEG_TO_RADS * rotateAngle(angle)) + centerXY[0],
    radius * Math.sin(geo.DEG_TO_RADS * rotateAngle(angle)) + centerXY[1],
  ];
};

const BRC_ROTATION: number = 315; //adding 315° because that is the BRC orientation (i.e. 10:30 is due north).

// BRC polar coordinates
const brcPolarToXY = (
  centerXY: [number, number],
  radius: number,
  angle: number
) => polarToXY(centerXY, radius, angle, BRC_ROTATION);

// Consumes normalized BMMapData and uses it to render
// an SVG. Outputs an object by which the SVG data can be
// manipulated.
export const renderMap = (parsedData: BMMapData): BRCMap => {
  const tOrig = curry(translatePt)(119.2357)(-40.75); // translate upper left (P1_LON, P5_LAT) to origin
  // converts latitude and longitude to map points
  const latLon_XY = (pt: [number, number]): [number, number] =>
    compose(scalePt10E3, tOrig, swapPt)(pt);

  const normalizeData = (d: BMMapData) => {
    const gs: [number, number] = [d.GS_LAT, d.GS_LON];
    const p1: [number, number] = [d.P1_LAT, d.P1_LON];

    // distance in "GPS" units from the Man to a pentagon point
    const fDist = geo.getDistance(latLon_XY(p1), latLon_XY(gs)) / d.MPP; // this yields GPS units per foot.  Multiplying a distance in feet by this value yields a GPS unit value.


    const convertDist = multiply(fDist);

    const evolveObj = {
      GS_ELEV: convertDist,
      MCCR: convertDist,
      RRCR: convertDist,
      RRW: convertDist,
      RSW: convertDist,
      PROM_WIDTH: convertDist,
      PROM_LAMP: convertDist,
      ORR: convertDist,
      ORW: convertDist,
      CCPR: convertDist,
      CTCIR: convertDist,
      CTCOR: convertDist,
      CPR: convertDist,
      MCPR: convertDist,
      APR: convertDist,
      MAPR: convertDist,
      PPR: convertDist,
      M3PPR: convertDist,
      M6PPR: convertDist,
      M9PPR: convertDist,
      DEPOT: convertDist,
      MGREETER: convertDist,
      MPP: convertDist,
      ERCR: convertDist,
      ERW: convertDist,
      MARCR: convertDist,
      MBRCR: convertDist,
      MCRCR: convertDist,
      MDRCR: convertDist,
      MERCR: convertDist,
      MFRCR: convertDist,
      MGRCR: convertDist,
      MHRCR: convertDist,
      MIRCR: convertDist,
      MJRCR: convertDist,
      MKRCR: convertDist,
      MLRCR: convertDist,
      GPS_FOOT: () => fDist,
    };

    return evolve(evolveObj, d);
  };

  const bd = normalizeData(parsedData);

  const gsXY: [number, number] = latLon_XY([bd.GS_LAT, bd.GS_LON]);
  const flipAtMan = curry(flipV)(gsXY[1]); // equivalent of scale y = -1

  let svg = SVG.createSVGElem("svg", {
    id: "brc",
    viewBox: "0 0 700 700",
    width: "100%",
    height: "100%",
    version: "1.1",
    baseProfile: "full",
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink",
    "xmlns:ev": "http://www.w3.org/2001/xml-events",
  });

  let brcLayer = SVG.createSVGElem("g", { parent: svg });
  let rotateLayer = SVG.createSVGElem("g", {
    id: "rotateLayer",
    parent: brcLayer,
    transform: "rotate(-45 275 275)",
  });
  const outerCircleXY = curry(brcPolarToXY)(gsXY, bd.MPP);
  const pentagonXYs: [number, number][] = map(
    compose(outerCircleXY, multiply(72))
  )([2, 1, 0, 4, 3]); // these angles are in the same order as BMs official pentagon points
  const trashFenceLineAt = (
    deg: number
  ): [[number, number], [number, number]] | null =>
    deg >= 0 && deg < 72
      ? [pentagonXYs[1], pentagonXYs[2]]
      : deg < 72 * 2
        ? [pentagonXYs[0], pentagonXYs[1]]
        : deg < 72 * 3
          ? [pentagonXYs[4], pentagonXYs[0]]
          : deg < 72 * 4
            ? [pentagonXYs[3], pentagonXYs[4]]
            : deg < 72 * 5
              ? [pentagonXYs[2], pentagonXYs[3]]
              : null;

  const trashFencePtAt = (deg: number) =>
    geo.linesIntersection(
      [gsXY, brcPolarToXY(gsXY, bd.MPP, deg)],
      trashFenceLineAt(deg)!
    );
  const distanceManToFenceAt = (deg: number) =>
    geo.getDistance(gsXY, trashFencePtAt(deg));
  const trashFenceAt = (deg: number) =>
    brcPolarToXY(gsXY, distanceManToFenceAt(deg) - bd.ORW, deg);

  const playa = SVG.createShape(pentagonXYs, {
    id: "playa",
    fill: "white",
    parent: rotateLayer,
  });
  const getStandardAttrs = (p: SVGElement) => {
    return {
      stroke: "lightgray",
      "stroke-width": bd.RRW,
      fill: "white",
      parent: p,
    };
  };

  interface BMRoadInfo {
    id: string;
    name: string;
    radius: number;
  }
  const roads: BMRoadInfo[] = [
    {
      id: "Esplanade",
      name: "Esplanade",
      radius: bd.ERCR,
    },
    {
      id: "A",
      name: bd.ARN,
      radius: bd.MARCR,
    },
    {
      id: "B",
      name: bd.BRN,
      radius: bd.MBRCR,
    },
    {
      id: "C",
      name: bd.CRN,
      radius: bd.MCRCR,
    },
    {
      id: "D",
      name: bd.DRN,
      radius: bd.MDRCR,
    },
    {
      id: "E",
      name: bd.ERN,
      radius: bd.MERCR,
    },
    {
      id: "F",
      name: bd.FRN,
      radius: bd.MFRCR,
    },
    {
      id: "G",
      name: bd.GRN,
      radius: bd.MGRCR,
    },
    {
      id: "H",
      name: bd.HRN,
      radius: bd.MHRCR,
    },
    {
      id: "I",
      name: bd.IRN,
      radius: bd.MIRCR,
    },
    {
      id: "J",
      name: bd.JRN,
      radius: bd.MJRCR,
    },
    {
      id: "K",
      name: bd.KRN,
      radius: bd.MKRCR,
    },
    {
      id: "L",
      name: bd.LRN,
      radius: bd.MLRCR,
    },
  ];

  const getRoadByName = (name: string) => roads.find((r) => r.name === name);

  const cleanRoads: BMRoadInfo[] = roads.filter(
    (i: BMRoadInfo) => i.id != "A" && i.id != "F"
  ); // remove a and f as special cases.
  const roadLayer = SVG.createSVGElem("g", {
    id: "roads",
    parent: rotateLayer,
  });
  const roadAttrs = (roadInfo: BMRoadInfo) =>
    SVG.addAttrs(getStandardAttrs(roadLayer), {
      id: roadInfo.id,
      "data-name": roadInfo.name,
      fill: "none",
    });
  const creRoadHlpr = (center: [number, number], attrs: {}, radius: number) =>
    SVG.createCircle(center, radius, attrs);
  const createRoad = curry(creRoadHlpr)(gsXY)(getStandardAttrs(roadLayer));
  const createDPP = (a: [number, string]) =>
    brcPolarToXY(gsXY, a[0], clockToDegs(a[1])); // "create deep playa point"
  const createArcRoad = (roadInfo: BMRoadInfo) =>
    SVG.createArc(
      createDPP([roadInfo.radius, "2:00"]),
      createDPP([roadInfo.radius, "10:00"]),
      roadInfo.radius,
      1,
      1,
      roadAttrs(roadInfo)
    );
  map(createArcRoad)(cleanRoads);
  const createNamedRoad = (roadInfo: BMRoadInfo) =>
    creRoadHlpr(gsXY, roadAttrs(roadInfo), roadInfo.radius);

  const centerCampCenter = compose(brcPolarToXY)(gsXY, bd.MCCR, bd.CC_DDD);
  const rodsRoad = SVG.createCircle(
    centerCampCenter,
    bd.RRCR,
    SVG.addAttrs(getStandardAttrs(roadLayer), { id: "rods-road" })
  );

  // A-road needs to be placed after rod's road so that it meets centercamp.
  const aRoadInfo = roads.find((i: BMRoadInfo) => i.id == "A") as BMRoadInfo;
  const aRoad = createArcRoad(aRoadInfo);

  // F-road needs to be handled separately because it has links.
  const fRoadInfo = roads.find(
    (info: BMRoadInfo) => info.id == "F"
  ) as BMRoadInfo;
  const getFpoint = (clock: string) => createDPP([bd.MFRCR, clock]);
  const fRoadCreate = (a: [string, string]) =>
    SVG.createArc(
      getFpoint(a[0]),
      getFpoint(a[1]),
      bd.MFRCR,
      0,
      1,
      SVG.addAttrs(roadAttrs(fRoadInfo), {
        id: fRoadInfo.id + "-" + a[0].substr(0, 1),
      })
    );
  const fRoad = map(fRoadCreate)([
    ["2:30", "3:30"],
    ["4:00", "5:00"],
    ["7:00", "8:00"],
    ["8:30", "9:30"],
  ]);

  const drawRoad = curry(
    (fromRadius: number, toRadius: number, clock: string) =>
      SVG.createLine(
        createDPP([fromRadius, clock]),
        createDPP([toRadius, clock]),
        {
          stroke: "lightgray",
          "stroke-width": bd.RRW,
          parent: roadLayer,
          id: clock,
        }
      )
  );
  const drawClockRoad = (clock: string) => drawRoad(bd.ERCR, bd.ORR, clock);
  const clockRoads = map(drawClockRoad)([
    "2:00",
    "2:30",
    "3:00",
    "3:30",
    "4:00",
    "4:30",
    "5:00",
    "7:00",
    "7:30",
    "8:00",
    "8:30",
    "9:00",
    "9:30",
    "10:00",
  ]);

  const drawDepotRoad = curry(drawRoad)(bd.ERCR, bd.ORR + bd.DEPOT);
  const depotRoads = map(drawDepotRoad)(["5:30", "6:30"]);
  const greeterRoad = drawRoad(
    bd.ERCR,
    distanceManToFenceAt(clockToDegs("6:00")),
    "6:00"
  );

  const drawPromenade = (clock: string) => drawRoad(0, bd.MCPR, clock);
  const promenades = map(drawPromenade)(["12:00", "3:00", "6:00", "9:00"]);
  // add proper id
  promenades.forEach((promenade: SVGElement) =>
    promenade.setAttribute("id", promenade.id.replace(":00", "Promenade"))
  );

  const drawSuburbRoad = curry(drawRoad)(bd.MGRCR, bd.MLRCR);
  const suburbanClockRoads: any = compose(
    <any>flatten,
    map((t: number) => [t + ":15", t + ":45"])
  )(range(2, 10)); // these are roads that exist only in the suburbs
  const suburbanRoads = map(drawSuburbRoad)(suburbanClockRoads);

  const airportRoadA = createDPP([bd.ORR, "5:00"]);
  const airportRoadB = pentagonXYs[4];

  const airportRoad = SVG.createLine(airportRoadA, airportRoadB, {
    stroke: "lightgray",
    "stroke-width": bd.RRW,
    parent: roadLayer,
    id: "airport-road",
  });

  // Plazas.

  let gsLayer = SVG.createSVGElem("g", { parent: rotateLayer });
  let gsCircle = SVG.createSVGElem("circle", {
    cx: gsXY[0].toString(),
    cy: gsXY[1].toString(),
    r: bd.CCPR,
    fill: "lightgray",
    parent: gsLayer,
  });

  const getPlazaAttrs = (parent: SVGElement) => {
    return { fill: "lightgray", parent: parent };
  };

  let getPlazaCenter = curry(brcPolarToXY)(gsXY); // Just need radius-from-man and angle

  let createPlaza = curry((parent: SVGElement, centerPt: [number, number]) =>
    SVG.createCircle(centerPt, bd.CPR, getPlazaAttrs(parent))
  );

  let depot = createPlaza(roadLayer)(
    getPlazaCenter(bd.ORR + bd.DEPOT, clockToDegs("5:30"))
  );
  let sanitation = createPlaza(roadLayer)(
    getPlazaCenter(bd.ORR + bd.DEPOT, clockToDegs("6:30"))
  );

  let getArtPlazaCenter = getPlazaCenter(bd.MAPR);
  let artPlazaCenterPts = map(getArtPlazaCenter)([bd.AP430DDD, bd.AP730DDD]);
  let artPlazaLayer = SVG.createSVGElem("g", { parent: rotateLayer });
  let createArtPlaza = createPlaza(artPlazaLayer);
  const artPlazas = map(createArtPlaza)(artPlazaCenterPts);

  const ppLayer = SVG.createSVGElem("g", { parent: rotateLayer });
  const getPPCenter = (a: any) => getPlazaCenter(a.distance)(a.angle);
  const ppCenters = map(getPPCenter)([
    { angle: bd.PP3DD, distance: bd.M3PPR },
    { angle: bd.PP6DD, distance: bd.M6PPR },
    { angle: bd.PP9DD, distance: bd.M9PPR },
  ]);
  const createPP = createPlaza(ppLayer);
  const publicPlazas = map(createPP)(ppCenters);

  //Civic Plazas
  const cpLayer = SVG.createSVGElem("g", { parent: rotateLayer });
  const getCivicPlazaCenter = getPlazaCenter(bd.MCPR);
  const cpCenters = map(getCivicPlazaCenter)([
    bd.CP3DDD,
    bd.CP9DDD,
    bd.CP12DDD,
  ]);
  const civilPlazas = map(createPlaza(cpLayer))(cpCenters);

  const centerCampLayer = SVG.createSVGElem("g", { parent: rotateLayer });
  const ccAttrs = getPlazaAttrs(centerCampLayer);
  const centerCamp = SVG.createCircle(centerCampCenter, bd.CCPR, ccAttrs);

  const themeCamp = SVG.createCircle(centerCampCenter, bd.CPR, {
    fill: "white",
    parent: centerCampLayer,
  });

  let trashFence = SVG.createShape(pentagonXYs, {
    id: "trash-fence",
    stroke: "black",
    fill: "none",
    "stroke-width": bd.RRW,
    parent: rotateLayer,
  });

  let artLayer = SVG.createSVGElem("g", {
    id: "artLayer",
    parent: rotateLayer,
  });
  let campLayer = SVG.createSVGElem("g", {
    id: "campLayer",
    parent: rotateLayer,
  });
  let eventLayer = SVG.createSVGElem("g", {
    id: "eventLayer",
    parent: rotateLayer,
  });

  let markerLayer = SVG.createSVGElem("g", {
    id: "markerLayer",
    parent: rotateLayer,
  });
  let textLayer = SVG.createSVGElem("g", {
    id: "textLayer",
    parent: rotateLayer,
  });

  const GPStoXY = compose(flipAtMan, latLon_XY);

  const artToXY = (loc: BMArtLocation) => {
    const artLocation = loc;
    const rad = artLocation.distance
      ? artLocation.distance * bd.GPS_FOOT
      : null;
    const clock = artLocation.hour + ":" + artLocation.minute;

    if (!rad) {
      const artLat = artLocation.gps_latitude!;
      const artLon = artLocation.gps_longitude!;
      return GPStoXY([artLat, artLon]);
    }

    const artPt = createDPP([rad, clock]); //GPStoXY([artLat, artLon]);
    return artPt;
  };

  const randRadF = bd.RRW * 2.5;
  const randomizeRadius = (radius: number) => radius; // radius + randRadF - Math.random() * 2 * randRadF;
  const campLocToStr = (loc: BMCampLocation) =>
    `${loc.frontage} ${loc.intersection_type} ${loc.intersection}`;

  const campAddressToXY = (location: BMCampLocation) => {
    const address = campLocToStr(location); // we don't use location.string, because that may be different, particularly, it might contain street names instead of 'A' etc.

    if (!address) return null;

    const getRoad = (streetLetter: string) =>
      roads.find((road: BMRoadInfo) => road.id == streetLetter);

    // addresses of the form "hh:mm & L"
    const clkLtr = RegExp(/(\d\d?:\d\d)(?: Portal)? & (Esplanade|[A-L])/);
    if (address.match(clkLtr)) {
      let streets = clkLtr.exec(address);
      let clock = streets![1];
      let streetLetter = streets![2];
      let roadInfo: BMRoadInfo = getRoad(streetLetter)!;
      let radius = randomizeRadius(roadInfo.radius);

      return createDPP([radius, clock]);
    }

    // addresses of the form "L & hh:mm"
    const ltrClk = RegExp(/^(\D+) & (\d\d?:\d\d)/);
    if (address.match(ltrClk)) {
      let streets = ltrClk.exec(address);
      let clock = streets![2];
      let streetLetter = streets![1];
      let roadInfo: BMRoadInfo = getRoad(streetLetter)!;
      //console.log("sletter", streetLetter, streets);
      let radius = roadInfo.radius;
      return createDPP([radius, clock]);
    }

    const plazaInfos: [string, number, number, number][] =
      // [ name, distance man to plaza center, angle from man, plaza width ]
      [
        ["4:30 Plaza", bd.MAPR, bd.AP430DDD, bd.APR],
        ["7:30 Plaza", bd.MAPR, bd.AP730DDD, bd.APR],
        ["3:00 Plaza", bd.MCPR, bd.CP3DDD, bd.CPR],
        ["9:00 Plaza", bd.MCPR, bd.CP9DDD, bd.CPR],
        ["3:00 Public Plaza", bd.M3PPR, bd.PP3DD, bd.PPR],
        ["6:00 Public Plaza", bd.M6PPR, bd.PP6DD, bd.PPR],
        ["9:00 Public Plaza", bd.M9PPR, bd.PP9DD, bd.PPR],
        ["Rod's Road", bd.MCCR, bd.PP6DD, bd.RRCR - bd.RRW],
        ["Center Camp Plaza", bd.MCCR, bd.PP6DD, bd.CCPR],
      ];

    const plazaPattern = RegExp(/(.+ (?:Plaza|Road)) [@&] (\d\d?:\d\d)/); // includes rod's road addresses as in "rod's road @ 3:00"
    if (address.match(plazaPattern)) {
      const streets = plazaPattern.exec(address)!;
      const plazaName = streets[1];
      const plazaClock = streets[2];
      const plazaInfo = plazaInfos.find(
        (a: [string, number, number, number]) => a[0] == plazaName
      )!;
      const plazaRadius = plazaInfo[3];
      const radiusFromMan = plazaInfo[1];
      const angleFromMan = plazaInfo[2];
      const plazaPt = getPlazaCenter(radiusFromMan, angleFromMan);
      const campAngle = clockToDegs(plazaClock);
      const campPt = brcPolarToXY(plazaPt, plazaRadius, campAngle);

      return campPt;
    }

    const rodsRoadPattern = RegExp(/Rod's Road & ([A|B|C|D])/); // Rod's road addresses as in "Rod's Road & C"
    if (address.match(rodsRoadPattern)) {
      const streets = rodsRoadPattern.exec(address)!;
      const streetLetter = streets[1];
      const streetPt = gsXY;
      const streetR = randomizeRadius(getRoad(streetLetter)!.radius);

      const rrPt = createDPP([bd.MCCR, "6:00"]);
      const rrR = bd.RRCR - bd.RRW;

      // D intersects at just one point.
      if (streetLetter == "D") return createDPP([bd.MDRCR - bd.RRW, "6:00"]);

      const possible2xy = geo.circlesIntersection(
        streetPt[0],
        streetPt[1],
        streetR,
        rrPt[0],
        rrPt[1],
        rrR
      )!;
      if (possible2xy == null) return null;

      // An address like "Rod's Road & C" means the intersection of 2 circles, which can be at 2 points.
      // pick one at random and return it.

      const idx = Math.floor(Math.random() * possible2xy.length);

      return <[number, number]>possible2xy[idx];
    }

    const intersectRodsRoadPattern = RegExp(/(\d\d?:\d\d) & Rod's Road/); // "5:30 & Rod's Road"
    if (address.match(intersectRodsRoadPattern)) {
      // Gonna cheat, here. No need to make line-circle-intersection calculations.
      // Just put the radius from the man at some arbitrary distance between Esplanade and A.
      // and boom.  Done.
      const arbitraryRadius = (bd.MARCR - bd.ERCR) * 0.7 + bd.MARCR;
      const streets = intersectRodsRoadPattern.exec(address)!;
      const clockStreet = streets[1];

      const rrPt = createDPP([arbitraryRadius, clockStreet]);

      //console.log(address, rrPt);

      return rrPt;
    }

    if (address === "Center Camp Plaza") return createDPP([bd.MCCR, "6:00"]);
    if (address.startsWith("Airport Rd")) {
      // this address is "Airport Rd & Airport Rd" but website says "5:30 & trash fence"
      const road530 = <[[number, number], [number, number]]>[
        gsXY,
        createDPP([bd.MPP, "5:30"]),
      ];
      const fence = <[[number, number], [number, number]]>[
        pentagonXYs[4],
        pentagonXYs[0],
      ];
      const airport = geo.linesIntersection(road530, fence);
      // let's pull it off the trash fence
      const newRad = geo.getDistance(gsXY, airport) * 0.95;

      return createDPP([newRad, "5:30"]);
    }

    const portalAndPortal = RegExp(/((\d\d?:\d\d) Portal) [&@] \1/); // matches "4:30 Portal & 4:30 Portal" and such.
    if (address.match(portalAndPortal)) {
      const streets = portalAndPortal.exec(address)!;
      const clock = streets[2];

      const arbitraryRadius = (bd.MARCR - bd.ERCR) * 0.5 + bd.ERCR;
      const clockAddr = clock;

      return createDPP([arbitraryRadius, clockAddr]);
    }

    return null;
  };

  const capitalizeFirstLetter = (str: string) =>
    str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();
  const getStreetByName = (name: string) =>
    compose(getRoadByName, capitalizeFirstLetter)(name); // if there is any kind of fudging to do, especially if the street names contain spaces, this is the function to do it in.  E.g. in a year with the street name "High Renaissance", name = "High" or "Renaissance" probably means "High Renaissance" and so should return that street's info.
  const getStreetById = (id: string) =>
    compose(
      (l) => roads.find((road) => road.id == id),
      capitalizeFirstLetter
    )(id);

  return {
    gpsToXY: GPStoXY,
    artAddressToXY: artToXY,
    campAddressToXY: campAddressToXY,
    svg: svg,
  };
};

// Parse Data //////////////
/* Puts data into the BMMapData class */
export const parseCSV = (data: string) => {
  const parseString = data.substr(data.indexOf("YEAR"));
  const rawLines = parseString.split("\n");

  let dynObj: any = {};
  rawLines.forEach((line: string) => {
    const vars = line.split(",");
    const float = parseFloat(vars[1]);
    dynObj[vars[0].trim()] = Number.isNaN(float) ? vars[1].trim() : float;
  });

  dynObj.GS = [dynObj.GS_LAT, dynObj.GS_LON];
  dynObj.GPS_FOOT = 0;

  const bd: BMMapData = dynObj as BMMapData;
  return bd;
};

// export const getBRC = () => compose(renderMap, parseCSV)(Data.retrieveMapCSV());
export enum BRCMapTestFuncs {
  clockToDegs = "clockToDegs",
  polarToXY = "polarToXY",
}
export const test = (func: BRCMapTestFuncs, ...args: any[]) => {
  switch (func) {
    case BRCMapTestFuncs.clockToDegs:
      return clockToDegs(args[0]);
    case BRCMapTestFuncs.polarToXY:
      return polarToXY(args[0], args[1], args[2]);

    default:
      break;
  }
};
