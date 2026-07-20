// Framer Motion's DOM feature pack, isolated so LazyMotion can pull it in as a
// SEPARATE async chunk after first paint rather than baking every animation
// feature into the bundle that evaluates during hydration. framer's ~131KB
// chunk costs ~1.4s of bootup (evaluate, not per-component mount) on the
// homepage — the load-time gate PSI reports as 13.6s of script CPU on a real
// Moto G Power. With `m` + this lazy split, hydration evaluates only the small
// `m` core; the feature pack's parse/compile/execute is deferred out of the
// critical window.
//
// domMax (not domAnimation): the hero's floating badges use `drag` and several
// components use layout animation — both live in the `max` pack.
import { domMax } from 'framer-motion';

export default domMax;
