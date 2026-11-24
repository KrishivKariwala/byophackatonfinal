import { DeliveryError, type DeliveryAck, type DeliveryJob, type DeliveryProvider, type DeliveryUpdate } from "./provider";
import { distanceKm } from "../geo";

/**
 * The default provider. It simulates a rider on a timer, measured on the app's own clock (so the demo clock moves it too):
 *   0 min Requested -> 2 min Rider assigned -> 6 min Picked up -> 12 min Delivered.
 * The external id encodes the start time and an outcome so no state is needed anywhere:  mock_<startMs>_<outcome>
 * Outcomes can be forced for demos and tests by putting a keyword in the pickup address: NORIDER (nobody accepts) or FAILJOB (provider error).
 */
export const MOCK_TIMELINE = { assignedAfterMin: 2, pickedUpAfterMin: 6, deliveredAfterMin: 12, noRiderAfterMin: 5 } as const;
const RIDERS = ["Manoj", "Kavya", "Irfan", "Divya", "Suresh"];

export class MockProvider implements DeliveryProvider {
  readonly name = "mock";

  async request(job: DeliveryJob, nowMs: number): Promise<DeliveryAck> {
    if (/FAILJOB/i.test(job.pickup.address)) throw new DeliveryError("provider_error", "The delivery partner could not take this job right now.");
    const outcome = /NORIDER/i.test(job.pickup.address) ? "norider" : "ok";
    const km = distanceKm(job.pickup, job.drop);
    return { externalId: `mock_${nowMs}_${outcome}`, fee: Math.round(30 + 10 * km), status: "Requested" };
  }

  statusNow(externalId: string, nowMs: number): DeliveryUpdate {
    const m = /^mock_(\d+)_(ok|norider)$/.exec(externalId);
    if (!m) return { status: "Failed" };
    const mins = (nowMs - Number(m[1])) / 60_000;
    const rider = RIDERS[Number(m[1]) % RIDERS.length];
    if (m[2] === "norider") return mins >= MOCK_TIMELINE.noRiderAfterMin ? { status: "No rider found" } : { status: "Requested" };
    if (mins >= MOCK_TIMELINE.deliveredAfterMin) return { status: "Delivered", riderName: rider };
    if (mins >= MOCK_TIMELINE.pickedUpAfterMin) return { status: "Picked up", riderName: rider };
    if (mins >= MOCK_TIMELINE.assignedAfterMin) return { status: "Rider assigned", riderName: rider };
    return { status: "Requested" };
  }
  async status(externalId: string, nowMs: number) { return this.statusNow(externalId, nowMs); }
  async cancel() { /* nothing to undo */ }
}
