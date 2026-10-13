const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = window.matchMedia('(max-width: 767px)');

export const prefersReduced = () => reduceMotionQuery.matches;

// Duración de animación: 0 si el usuario pidió menos movimiento
export const dur = (seconds) => (prefersReduced() ? 0 : seconds);

export const isMobile = () => mobileQuery.matches;
