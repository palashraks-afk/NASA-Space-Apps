// Human circadian pacemaker: Forger, Jewett and Kronauer (1999) van der Pol model with
// the parameters of Serkh and Forger (2014), as implemented in the open-source HCRSimPY
// package (Arcascope). Time is in hours, light in lux.
//
//   alpha(L) = a0 * (L / I0)^p
//   Bhat     = G * (1 - n) * alpha(L) * (1 - 0.4 x) * (1 - 0.4 xc)
//   dx/dt    = pi/12 * (xc + Bhat)
//   dxc/dt   = pi/12 * ( mu * (xc - 4/3 xc^3) - x * ((24 / (0.99669 tau))^2 + k * Bhat) )
//   dn/dt    = 60 * ( alpha(L) * (1 - n) - delta * n )

export const DEFAULTS = { tau: 24.2, mu: 0.23, G: 33.75, a0: 0.05, delta: 0.0075, p: 0.5, I0: 9500, k: 0.55 };

const PI12 = Math.PI / 12;

function deriv(t, s, light, P) {
  const [x, xc, n] = s;
  const L = Math.max(0, light(t));
  const alpha = P.a0 * Math.pow(L / P.I0, P.p);
  const B = P.G * (1 - n) * alpha * (1 - 0.4 * x) * (1 - 0.4 * xc);
  const w2 = Math.pow(24 / (0.99669 * P.tau), 2);
  return [PI12 * (xc + B), PI12 * (P.mu * (xc - (4 / 3) * xc ** 3) - x * (w2 + P.k * B)), 60 * (alpha * (1 - n) - P.delta * n)];
}

export function step(t, s, h, light, P) {
  const k1 = deriv(t, s, light, P);
  const k2 = deriv(t + h / 2, s.map((v, i) => v + (h / 2) * k1[i]), light, P);
  const k3 = deriv(t + h / 2, s.map((v, i) => v + (h / 2) * k2[i]), light, P);
  const k4 = deriv(t + h, s.map((v, i) => v + h * k3[i]), light, P);
  return s.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

// n=0 light process starts dark-adapted. Large dt for the alpha(L) switch can bite, so the
// step is small (0.02 h) whenever the light changes abruptly.
export function simulate({ light, hours, state = [0.7, 0, 0], t0 = 0, params = {}, dt = 0.02, every = 0.5 }) {
  const P = { ...DEFAULTS, ...params };
  const out = [];
  let s = state.slice();
  let t = t0;
  const steps = Math.round(hours / dt);
  const emit = Math.max(1, Math.round(every / dt));
  for (let i = 0; i <= steps; i++) {
    if (i % emit === 0) out.push({ t, x: s[0], xc: s[1], n: s[2], phase: Math.atan2(s[1], s[0]) });
    if (i < steps) { s = step(t, s, dt, light, P); t += dt; }
  }
  return { series: out, state: s, params: P };
}

// Settle onto the limit cycle for a given schedule (transients removed).
export function settle({ light, days = 120, params = {} }) {
  return simulate({ light, hours: days * 24, params, every: 24 }).state;
}

// Schedules. lights(on, off, lux): lights on from hour `on` to `off` each day.
export function lightSchedule({ on = 7, off = 23, lux = 300, period = 24 }) {
  return (t) => {
    const h = ((t % period) + period) % period;
    return on < off ? (h >= on && h < off ? lux : 0) : (h >= on || h < off ? lux : 0);
  };
}

// Phase of the oscillator, in hours on a 24 h dial, relative to a reference angle.
export const phaseHours = (s) => (((Math.atan2(s.xc, s.x) * 24) / (2 * Math.PI)) % 24 + 24) % 24;
