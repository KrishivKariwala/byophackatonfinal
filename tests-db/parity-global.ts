import { createScratch } from "../scripts/db-scratch";
export async function setup() { await createScratch(false); }
