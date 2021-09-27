export interface BMInfo extends Object {
  uid: string;
  name?: string | null;
  title?: string;
  hometown?: string | null;
  description: string | null;
  print_description?: string;
  year: number;
  url: string | null;
}

export interface BMData {
  camps: BMCamp[];
  arts: BMArt[];
  events: BMEvent[];
}

export enum DataState {
  init,
  retrieving,
  retrieveFailed,
  retrieveSuccess,
  loading,
  aborting,
  loadCanceled,
  loadFailed,
  loadSuccess,
  storing,
  storeFailed,
  storeSuccess,
  ready,
}

export interface BMCamp extends BMInfo {
  name?: string | null;
  contact_email: string | null;
  hometown?: string | null;
  location: BMCampLocation;
  location_string: string;
}

export interface BMCampView extends BMCamp {
  events: BMEvent[];
}

export interface BMCampLocation {
  string: string;
  frontage: string;
  intersection: string;
  intersection_type: string;
  dimensions: string | null;
}

export interface BMArt extends BMInfo {
  name: string | null;
  contact_email: string | null;
  hometown: string | null;
  artist: string | null;
  category: string | null;
  program: string;
  donation_link: string | null;
  guided_tours: number;
  self_guided_tour_map: number;
  location: BMArtLocation;
  location_string: string | null;
  images?: BMArtImage[];
}

export enum BMInfoType {
  art,
  camp,
  event,
}

export interface BMArtView extends BMArt {
  events: BMEvent[];
}

export interface BMArtLocation {
  string: string | null;
  hour: number | null;
  minute: number | null;
  distance: number | null;
  category: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
}

export interface BMArtImage {
  gallery_ref: number | null;
  thumbnail_url: string | null;
}

export interface BMEvent extends BMInfo {
  event_id: number;
  title: string;
  event_type: BMEventType;
  print_description: string;
  slug: string;
  hosted_by_camp: string | null;
  located_at_art: string | null;
  other_location: string;
  check_location: number;
  all_day: number | null;
  contact?: string;
  occurrence_set?: BMEventOccurrence[];
}

export interface BMEventView extends BMEvent {
  camp?: BMCamp;
  art?: BMArt;
}

export interface BMEventOccurrence {
  start_time: string;
  end_time: string;
}

export interface BMEventType {
  id: number;
  label: string;
  abbr: string;
}

export interface ResultMatches {
  indices: [number, number][];
  key: string;
}

export interface BMResultItem {
  uid: string;
  name: string;
  type: BMInfoType;
  event_type?: BMEventType;
  location?: BMCampLocation | BMArtLocation;
  matches?: ResultMatches[];
  score?: number;
  final: Date | null;
  xy?: [number, number];
}

export interface BMMapData {
  YEAR: number; //"""Event Year"""
  THEME: string; //"Event Theme - 2017 is ""Radical Ritual"""
  GPSUNIT: string; //"""Format of latitude and longitude:  D.DDDDD (decimal degree, 5 digits past decimal) | DD:HH:MM:SS.SSS (degrees hours minutes seconds)"""
  MRADIALUNIT: string; //"""Man Centric Unit for radial distance:  feet | meters"
  MANGULARUNIT: string; //"""Man Centric Angular Unit:   HH:MM (Hours Minutes) HH.HH (fractional hours) DDD (integer degrees), from 12:00 being 0/360 and 3:00 being 90"""
  GS_LAT: number; //Golden Spike Latitude
  GS_LON: number; //Golden Spike Longitude
  GS_ELEV: number; //Elevation Above Sea Level in feet
  P1_LAT: number; //Pentagon Point 1 Latitude
  P1_LON: number; //Pentagon Point 1 Longitude
  P2_LAT: number; //Pentagon Point 2 Latitude
  P2_LON: number; //Pentagon Point 2 Longitude
  P3_LAT: number; //Pentagon Point 3 Latitude
  P3_LON: number; //Pentagon Point 3 Longitude
  P4_LAT: number; //Pentagon Point 4 Latitude
  P4_LON: number; //Pentagon Point 4 Longitude
  P5_LAT: number; //Pentagon Point 5 Latitude
  P5_LON: number; //Pentagon Point 5 Longitude
  TNSA_DDD: string; //"True North-South Axis, Clock"
  PP1_DDD: number; //Portal at 3
  PP2_DDD: number; //Portal at 4:30
  CC_DDD: number; //Portal at 6 to center camp (aka PP3)
  PP4_DDD: number; //Portal at 7:30
  PP5_DDD: number; //Portal at 9:00
  MPC_DDD: number; //"Man Polar Coordinate True North-South Axis:string; // north is at 10:30 oclock)"
  MCCR: number; //Man - Center Camp Center Radial Distance
  RRCR: number; //Rod's Road Center Radius about center of center camp
  RRW: number; //Rod's Road Width
  RSW: number; //Regular Street Width
  PROM612_DDD: number; //Promenade 6:12 Man Angle
  PROM39_DDD: number; //Promenate 3:9 Man Angle
  PROM_WIDTH: number; //Promenade Width
  PROM_LAMP: number; //Approximate spacing between lamps along promenades
  ORR: number; //Outer Road Center Radius
  ORW: number; //Outer Road Width
  CCPR: number; //Center Camp Plaza Radius (from Center of Center camp to start of theme camp
  CTCIR: number; //Center Theme Camp Inner Radius
  CTCOR: number; //Center Theme Camp Outer Radius
  CP3DDD: number; //Civic Plaza at 3:00 clock
  CP9DDD: number;
  CP12DDD: number;
  CPR: number; //"Civic Plaza Radius, except Center Camp"
  MCPR: number; //Man to Civic Plaza Radial Distance
  AP430DDD: number; //Art Plaza at 4:30 clock
  AP730DDD: number; //Art Plaza at 7:30 clock
  APR: number; //Art Plaza Radius
  MAPR: number; //Man to Art Plaza Radial Distance
  PP3DD: number; //Public Plaza at 3:00 clock
  PP6DD: number; //Public Plaza at 6:00 clock
  PP9DD: number; //Public Plaza at 9:00 clock
  PPR: number; //Public Plaza Radius
  M3PPR: number; //Public Plaza at 3:00 radial distance
  M6PPR: number; //Public Plaza at 6:00 radial distance
  M9PPR: number; //Public Plaza at 9:00 radial distance
  DEPOT: number; //Depot to L center to center
  MGREETER: number; //Man to Greeter Area Distance
  MPP: number; //Man to Pentagon Points
  ERCR: number; //Esplanade Road Center Radius
  ERW: number; //Esplanade Road Width
  MARCR: number; //"Man to ""A"" Road Center Radius"
  MBRCR: number; //"Man to ""B"" Road Center Radius"
  MCRCR: number; //"Man to ""C"" Road Center Radius"
  MDRCR: number; //"Man to ""D"" Road Center Radius"
  MERCR: number; //"Man to ""E"" Road Center Radius"
  MFRCR: number; //"Man to ""F"" Road Center Radius"
  MGRCR: number; //"Man to ""G"" Road Center Radius"
  MHRCR: number; //"Man to ""H"" Road Center Radius"
  MIRCR: number; //"Man to ""I"" Road Center Radius"
  MJRCR: number; //"Man to ""J"" Road Center Radius"
  MKRCR: number; //"Man to ""K"" Road Center Radius"
  MLRCR: number; //"Man to ""L"" Road Center Radius"
  ARN: string; //"""A"" Road Name"
  BRN: string; //"""B"" Road Name"
  CRN: string; //"""C"" Road Name"
  DRN: string; //"""D"" Road Name"
  ERN: string; //"""E"" Road Name"
  FRN: string; //"""F"" Road Name"
  GRN: string; //"""G"" Road Name"
  HRN: string; //"""H"" Road Name"
  IRN: string; //"""I"" Road Name"
  JRN: string; //"""J"" Road Name"
  KRN: string; //"""K"" Road Name"
  LRN: string; //"""L"" Road Name"

  GS: [number, number];
  //The Golden Spike point

  GPS_FOOT: number; // distance of "GPS units" per foot, to enable distance changes during rendering.  Probably very, very small.
}
