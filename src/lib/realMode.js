/**
 * Active deploy mode: local | development | production
 *
 * Inlined at build time from VITE_REAL_MODE (see vite.config.js).
 */
export const REAL_MODE = process.env.VITE_REAL_MODE ?? "local";

export const isProductionMode = () => REAL_MODE === "production";
