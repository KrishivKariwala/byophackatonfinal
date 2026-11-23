// Impact constants live in one place (P1 brief: 1 meal ≈ 0.4 kg food, 2.5 kg CO2e per kg of food).
export const IMPACT = {
  KG_PER_MEAL: 0.4,
  CO2E_PER_KG_FOOD: 2.5,
} as const;

export function kgFor(units: number): number {
  return +(units * IMPACT.KG_PER_MEAL).toFixed(2);
}
export function co2eFor(units: number): number {
  return +(kgFor(units) * IMPACT.CO2E_PER_KG_FOOD).toFixed(2);
}
