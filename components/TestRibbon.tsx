/**
 * A small label that appears ONLY on Vercel preview deployments (every branch except `main`), so nobody mistakes a test version of the
 * app for the live site. It never renders in production or on a developer's machine.
 */
export function TestRibbon() {
  if (process.env.VERCEL_ENV !== "preview") return null;
  return (
    <div role="note" className="pointer-events-none fixed bottom-2 left-2 z-[9999] rounded-md bg-ink/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-cream shadow">
      Test version · not the live site
    </div>
  );
}
