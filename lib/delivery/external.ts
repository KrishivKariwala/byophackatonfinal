import { DeliveryError, type DeliveryAck, type DeliveryProvider, type DeliveryUpdate } from "./provider";

/**
 * Stubs for real delivery partners. They are wired to environment variables and fail loudly and safely until a real integration is written:
 *   DELIVERY_PROVIDER=dunzo   + DUNZO_API_KEY (+ DUNZO_BASE_URL)
 *   DELIVERY_PROVIDER=porter  + PORTER_API_KEY (+ PORTER_BASE_URL)
 * The HTTP calls below are placeholders: the partner's request/response formats must be taken from their current API documentation and
 * agreed with them before going live (they were not available to build against). Nothing here sends anything until that is done.
 * Status changes from a real partner arrive through POST /api/delivery/webhook, verified with DELIVERY_WEBHOOK_SECRET (HMAC-SHA256 of the raw body).
 */
abstract class ExternalProvider implements DeliveryProvider {
  abstract readonly name: string;
  protected abstract keyVar: string;
  protected configured() { return Boolean(process.env[this.keyVar]); }
  protected notReady(): never {
    if (!this.configured()) throw new DeliveryError("not_configured", `${this.name} delivery isn't set up (${this.keyVar} is missing). The charity can arrange its own pickup.`);
    throw new DeliveryError("not_implemented", `${this.name} delivery is configured but its API integration has not been built yet. The charity can arrange its own pickup.`);
  }
  async request(): Promise<DeliveryAck> { return this.notReady(); }
  async status(): Promise<DeliveryUpdate> { return this.notReady(); }
  async cancel(): Promise<void> { return this.notReady(); }
}
export class DunzoProvider extends ExternalProvider { readonly name = "dunzo"; protected keyVar = "DUNZO_API_KEY"; }
export class PorterProvider extends ExternalProvider { readonly name = "porter"; protected keyVar = "PORTER_API_KEY"; }
