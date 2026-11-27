/** "12:18 pm" in India time, for messages that tell someone when something opens or closes. */
export function istClock(isoOrMs: string | number): string {
  return new Date(isoOrMs).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).replace(/\u202f/g, " ").toLowerCase();
}
