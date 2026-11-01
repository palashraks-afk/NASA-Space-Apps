import { json2satrec, propagate, gstime, eciToGeodetic, sunPos } from "satellite.js";

const RE = 6378.137; // km
export const julian = (date) => date.getTime() / 86400000 + 2440587.5;

export function makeISS(gp) {
  const rec = json2satrec(gp);
  const periodMin = 1440 / gp.MEAN_MOTION;
  return { rec, periodMin, epoch: gp.EPOCH, name: gp.OBJECT_NAME };
}

export function issState(iss, date) {
  const pv = propagate(iss.rec, date);
  if (!pv || !pv.position) return null;
  const gmst = gstime(date);
  const geo = eciToGeodetic(pv.position, gmst);
  const s = sunPos(julian(date)).rsun;
  const sl = Math.hypot(s.x, s.y, s.z);
  const sun = { x: s.x / sl, y: s.y / sl, z: s.z / sl };
  const r = pv.position;
  const along = r.x * sun.x + r.y * sun.y + r.z * sun.z;
  const perp = Math.hypot(r.x - along * sun.x, r.y - along * sun.y, r.z - along * sun.z);
  const inShadow = along < 0 && perp < RE;
  // Sun direction in Earth-fixed coordinates (rotate ECI by -gmst about z)
  const c = Math.cos(gmst), si = Math.sin(gmst);
  const sunEcf = { x: c * sun.x + si * sun.y, y: -si * sun.x + c * sun.y, z: sun.z };
  return { lat: geo.latitude, lon: geo.longitude, height: geo.height, inShadow, sunEcf };
}

// Count sunrises (shadow -> sunlight transitions) over `hours` from `start`, sampling every
// `stepSec` seconds of SGP4 propagation.
export function countSunrises(iss, start, hours = 24, stepSec = 20) {
  let prev = null, n = 0;
  for (let t = 0; t <= hours * 3600; t += stepSec) {
    const s = issState(iss, new Date(start.getTime() + t * 1000));
    if (!s) continue;
    if (prev === true && s.inShadow === false) n++;
    prev = s.inShadow;
  }
  return n;
}
