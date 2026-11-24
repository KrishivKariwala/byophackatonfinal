import type { DeliveryStatus } from "../types";

/**
 * Last-mile delivery hand-off for donations (P2 feature 10).
 *
 * PRIVACY CONTRACT: a delivery job describes ONE donation going from a vendor outlet to a charity. It contains the two business
 * addresses, the item, and a reference. It never contains anything about a customer: no names, phones or orders.
 * `DeliveryJob` is the only thing handed to a provider and its fields are all business or food information; the service layer
 * builds it from the batch, the outlet and the NGO and from nothing else.
 */
export interface DeliveryJob {
  reference: string; // donation batch ref, e.g. DON-1042
  item: string; // "12 × Veg Biryani"
  pickup: { businessName: string; address: string; lat: number; lng: number; phone: string };
  drop: { organisation: string; address: string; lat: number; lng: number; phone: string };
  /** Pickup must happen by this time (the donation's collect-by deadline). */
  pickupBy: string;
}

export interface DeliveryAck { externalId: string; fee: number; status: DeliveryStatus; riderName?: string }
export interface DeliveryUpdate { status: DeliveryStatus; riderName?: string }

export class DeliveryError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}

export interface DeliveryProvider {
  readonly name: string;
  /** Ask the provider for a rider. Throws DeliveryError when the provider is unavailable or rejects the job. */
  request(job: DeliveryJob, nowMs: number): Promise<DeliveryAck>;
  /** Ask where a job stands (providers that push webhooks may not need this). */
  status(externalId: string, nowMs: number): Promise<DeliveryUpdate>;
  cancel(externalId: string): Promise<void>;
  /**
   * Optional synchronous status, for providers that can answer without I/O (the mock). The scheduled job uses it inside the store
   * transaction; real providers report through the signed webhook or the poll route instead.
   */
  statusNow?(externalId: string, nowMs: number): DeliveryUpdate;
}

export const ACTIVE: DeliveryStatus[] = ["Requested", "Rider assigned", "Picked up"];
export const TERMINAL: DeliveryStatus[] = ["Delivered", "No rider found", "Failed", "Cancelled"];
export const isActive = (s: DeliveryStatus) => ACTIVE.includes(s);

/** Statuses only move forward; a late or replayed event can never move one backwards. */
const RANK: Record<DeliveryStatus, number> = { Requested: 0, "Rider assigned": 1, "Picked up": 2, Delivered: 3, "No rider found": 3, Failed: 3, Cancelled: 3 };
export const canAdvance = (from: DeliveryStatus, to: DeliveryStatus) => from !== to && !TERMINAL.includes(from) && RANK[to] > RANK[from];
