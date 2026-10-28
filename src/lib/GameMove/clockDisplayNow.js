/**
 * Wall time for in-game Fischer clock display.
 * Arena live games use session.liveClockNow (250ms tick, no get_game).
 */
export function clockDisplayNow(session) {
  if (session?.liveClockTicking) {
    return session.liveClockNow;
  }
  return Date.now();
}
