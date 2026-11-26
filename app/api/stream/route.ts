import { bus } from "@/lib/store";
import { sweep } from "@/lib/services";
import type { LiveEvent } from "@/lib/types";
import { pgEnabled } from "@/lib/pg/db";
import { watchDatabase } from "@/lib/pg/poll";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;   // the host's limit for one request; the stream ends itself a little earlier (below) so it never ends in a timeout error

/**
 * Server-sent events: pushes committed state changes (stock counts, order/donation status, impact).
 * Events are emitted only after the transaction is persisted, so they never run ahead of the database.
 * Payloads carry no personal data; clients re-fetch what they are allowed to see.
 */
export async function GET(req: Request) {
  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (e: LiveEvent) => {
        const safe = e.type === "reservation" ? { type: e.type, reservationId: e.reservationId, status: e.status, committedAt: e.committedAt } : e;
        controller.enqueue(enc.encode(`data: ${JSON.stringify(safe)}\n\n`));
      };
      bus().on("live", send);
      const unwatch = pgEnabled() ? watchDatabase() : () => {};   // other server instances' changes arrive through the database
      controller.enqueue(enc.encode(`: connected\n\n`));
      // Keep-alive and a lightweight window-end tick (expires holds and closes windows on time).
      const ka = setInterval(() => {
        controller.enqueue(enc.encode(`: ping\n\n`));
        sweep().catch(() => undefined);
      }, 5000);
      // End the stream cleanly after 4 minutes; the browser's EventSource reconnects by itself. (Otherwise the host kills it at its
      // limit and logs a timeout error, and a stream that never ends keeps a server busy.)
      const end = setTimeout(() => { cleanup(); try { controller.close(); } catch {} }, 240_000);
      cleanup = () => { clearInterval(ka); clearTimeout(end); bus().off("live", send); unwatch(); };
      req.signal.addEventListener("abort", () => { cleanup(); try { controller.close(); } catch {} });
    },
    cancel() { cleanup(); },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
