import { MockProvider } from "./mock";
import { DunzoProvider, PorterProvider } from "./external";
import type { DeliveryProvider } from "./provider";

let override: DeliveryProvider | null = null;
/** Tests inject a spy provider here. */
export const setDeliveryProvider = (p: DeliveryProvider | null) => { override = p; };

/** DELIVERY_PROVIDER = mock (default) | dunzo | porter. An unknown value falls back to the mock so a typo can't break donations. */
export function getDeliveryProvider(): DeliveryProvider {
  if (override) return override;
  switch ((process.env.DELIVERY_PROVIDER || "mock").toLowerCase()) {
    case "dunzo": return new DunzoProvider();
    case "porter": return new PorterProvider();
    default: return new MockProvider();
  }
}
