/**
 * The main screen ("/") plays an opening animation on the first visit and a short whirl on later fresh loads. Moving to it from INSIDE the app
 * (the logo, a Back link) should just show the page, so those links call markStaticArrival() first and the main screen reads (and clears) the flag.
 * Kept in its own file so the pages that only need this one line do not load the animation library.
 */
export const SEEN_KEY = "sap-intro-seen";
export const ARRIVE_KEY = "sap-arrive-static";
export const markStaticArrival = () => { try { sessionStorage.setItem(ARRIVE_KEY, "1"); } catch { /* storage blocked: the animation may play, nothing breaks */ } };
