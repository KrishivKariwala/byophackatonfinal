/**
 * Sends a browser REFRESH of the page it is placed on back to the landing page ("/").
 * It runs while the HTML is being parsed, before anything is painted, so there is no flash of the page you refreshed.
 * Only a reload triggers it: arriving normally (a click, a link, Back) is untouched, and "/" itself is never redirected.
 * location.replace swaps the history entry, so the Back button doesn't bounce you back and forth.
 */
export function ReloadToHome() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{var n=performance.getEntriesByType("navigation")[0];if(n&&n.type==="reload")location.replace("/")}catch(e){}`,
      }}
    />
  );
}
