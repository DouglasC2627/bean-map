import type { Transition, Variants } from "framer-motion";

/**
 * Shared Framer Motion presets used across Bean Map.
 *
 * Reduced-motion handling lives at the root via <MotionProvider> which sets
 * `MotionConfig reducedMotion="user"` — when the user prefers reduced motion,
 * Framer drops transform/layout animations to instant. (The global CSS rule in
 * globals.css only covers CSS transitions/animations, not JS-driven ones.)
 */

export const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

export const springSoft: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

/** Container that staggers its direct children's entrance. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

/** Child item: fades and rises into place. Pairs with `staggerContainer`. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOut },
  },
};

/** Chip / tag entrance & exit — scale + fade, for AnimatePresence lists. */
export const chipPop: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: springSoft },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};
