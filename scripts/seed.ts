/** Re-create the demo store with fresh, time-relative seed data. Usage: npm run seed */
import fs from "node:fs";
import path from "node:path";
import { buildSeed } from "../lib/seed";

const p = path.resolve(process.env.DEMO_DB_PATH || "./data/demo-db.json");
fs.mkdirSync(path.dirname(p), { recursive: true });
const db = buildSeed(Date.now());
fs.writeFileSync(p, JSON.stringify(db));
console.log(`Seeded ${db.vendors.length} vendors, ${db.ngos.length} NGOs, ${db.listings.length} listings, ${db.reservations.length} reservations, ${db.donationBatches.length} donation batches → ${p}`);
console.log("Restart the server if it is running (it keeps the store in memory).");
