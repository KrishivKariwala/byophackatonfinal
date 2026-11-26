import "server-only";
import { open as unseal, seal } from "./box";
import type { PoolClient } from "pg";
import { toUuid as U } from "./uuid";

/**
 * How each collection of the app's data model (lib/types.ts DB) is stored in Postgres. The generic loader/writer in store.ts turns
 * rows into the same objects the demo store keeps, and saves changes back, so the business logic does not know which store it is on.
 * Most collections are plain: table name + camelCase field <-> snake_case column. The entries below say where that is not enough.
 */
export type Obj = Record<string, any>;
export type Raw = Record<string, Obj[]>;

export interface Spec {
  coll: string;
  table: string;
  pk?: string;                     // primary key column (default "id")
  serial?: boolean;                // bigserial id: never written, read as a string
  skipWrite?: boolean;             // a trigger writes this table; the app's own rows for it are ignored
  rename?: Record<string, string>; // object field -> column
  omit?: string[];                 // object fields that live in another table (hooks) or nowhere
  skipCols?: string[];             // columns that unpack/pack handle
  gen?: string[];                  // generated columns
  xform?: Record<string, { to?: (v: any) => any; from?: (v: any) => any }>;
  unpack?: (obj: Obj, row: Obj, raw: Raw) => void;   // extra fields from the row (and aux tables)
  pack?: (obj: Obj) => Obj;                           // extra columns from the object
  /** extra writes after rows were inserted / updated (aux tables) */
  after?: (c: PoolClient, items: { obj: Obj; old?: Obj }[]) => Promise<void>;
  /** extra reads that need other collections already built */
  link?: (objs: Obj[], built: Record<string, Obj[]>, raw: Raw) => void;
}

/** Auxiliary tables read alongside (no collection of their own). */
export const AUX_TABLES = ["vendor_applications", "ngo_applications", "listing_images", "pickup_codes", "donation_claims", "donation_handovers", "processed_webhooks", "receipt_counters", "settings"];

type InsertFn = (c: PoolClient, table: string, rows: Obj[]) => Promise<void>;
let insertMany: InsertFn;
export const bindInsert = (f: InsertFn) => { insertMany = f; };

const eightyG = (obj: Obj) => ({ eighty_g_number: obj.eightyG?.number ?? null, eighty_g_valid_until: obj.eightyG?.validUntil ?? null });
const unEightyG = (obj: Obj, row: Obj) => { if (row.eighty_g_number) obj.eightyG = { number: row.eighty_g_number, validUntil: String(row.eighty_g_valid_until).slice(0, 10) }; };
const latest = (rows: Obj[], key: string, id: string) => rows.filter((r) => r[key] === id).sort((a, b) => (a.submitted_at < b.submitted_at ? 1 : -1))[0];

// The order matters: parents before children (inserts), children before parents (deletes).
export const SPECS: Spec[] = [
  { coll: "profiles", table: "profiles", rename: { demo: "is_demo" } },
  {
    coll: "vendors", table: "vendors", omit: ["documents", "ratingDemo"],
    unpack: (o, r, raw) => { o.documents = latest(raw.vendor_applications, "vendor_id", r.id)?.documents ?? []; },
    after: async (c, items) => {
      const fresh = items.filter((i) => !i.old);
      if (fresh.length) await insertMany(c, "vendor_applications", fresh.map((i) => ({ vendor_id: i.obj.id, documents: i.obj.documents ?? [] })));
      for (const i of items.filter((x) => x.old && JSON.stringify(x.old.documents) !== JSON.stringify(x.obj.documents)))
        await c.query("update vendor_applications set documents = $2 where id = (select id from vendor_applications where vendor_id = $1 order by submitted_at desc limit 1)", [U(i.obj.id), i.obj.documents ?? []]);
    },
  },
  { coll: "outlets", table: "outlets", gen: ["location"] },
  {
    coll: "ngos", table: "ngos", gen: ["location"], omit: ["registrationDocs", "eightyG"], skipCols: ["eighty_g_number", "eighty_g_valid_until"],
    unpack: (o, r, raw) => { o.registrationDocs = latest(raw.ngo_applications, "ngo_id", r.id)?.registration_docs ?? []; unEightyG(o, r); },
    pack: eightyG,
    after: async (c, items) => {
      const fresh = items.filter((i) => !i.old);
      if (fresh.length) await insertMany(c, "ngo_applications", fresh.map((i) => ({ ngo_id: i.obj.id, registration_docs: i.obj.registrationDocs ?? [] })));
      for (const i of items.filter((x) => x.old && JSON.stringify(x.old.registrationDocs) !== JSON.stringify(x.obj.registrationDocs)))
        await c.query("update ngo_applications set registration_docs = $2 where id = (select id from ngo_applications where ngo_id = $1 order by submitted_at desc limit 1)", [U(i.obj.id), i.obj.registrationDocs ?? []]);
    },
  },
  {
    coll: "listings", table: "listings", omit: ["safetyDeclaration", "imageUrl", "imageIsRepresentative"], skipCols: ["safety_declared_at", "safety_declared_by"],
    unpack: (o, r, raw) => {
      o.safetyDeclaration = { accepted: true, acceptedAt: new Date(r.safety_declared_at).toISOString(), byUserId: r.safety_declared_by };
      const img = raw.listing_images.find((x) => x.listing_id === r.id);
      o.imageIsRepresentative = img ? img.is_representative : true;
      if (img) o.imageUrl = img.storage_path;
    },
    pack: (o) => ({ safety_declared_at: o.safetyDeclaration?.acceptedAt, safety_declared_by: o.safetyDeclaration?.byUserId }),
    after: async (c, items) => {
      const fresh = items.filter((i) => !i.old && i.obj.imageUrl);
      if (fresh.length) await insertMany(c, "listing_images", fresh.map((i) => ({ listing_id: i.obj.id, storage_path: i.obj.imageUrl, is_representative: i.obj.imageIsRepresentative !== false })));
      for (const i of items.filter((x) => x.old && (x.old.imageUrl !== x.obj.imageUrl || x.old.imageIsRepresentative !== x.obj.imageIsRepresentative))) {
        await c.query("delete from listing_images where listing_id = $1", [U(i.obj.id)]);
        if (i.obj.imageUrl) await insertMany(c, "listing_images", [{ listing_id: i.obj.id, storage_path: i.obj.imageUrl, is_representative: i.obj.imageIsRepresentative !== false }]);
      }
    },
  },
  { coll: "templates", table: "listing_templates" },
  {
    coll: "schedules", table: "recurring_schedules", omit: ["declaration"], skipCols: ["declaration_at", "declaration_by"],
    unpack: (o, r) => { o.declaration = { acceptedAt: new Date(r.declaration_at).toISOString(), byUserId: r.declaration_by }; },
    pack: (o) => ({ declaration_at: o.declaration?.acceptedAt, declaration_by: o.declaration?.byUserId }),
  },
  { coll: "holds", table: "checkout_holds" },
  {
    coll: "reservations", table: "reservations", omit: ["qrToken", "code", "qrTokenHash", "codeHash", "codeUsedAt"],
    unpack: (o, r, raw) => {
      const pc = raw.pickup_codes.find((x) => x.reservation_id === r.id);
      o.qrToken = unseal(pc?.qr_token_enc) ?? ""; o.code = unseal(pc?.code_enc) ?? "";
      o.qrTokenHash = pc?.qr_token_hash ?? ""; o.codeHash = pc?.code_hash ?? "";
      if (pc?.used_at) o.codeUsedAt = new Date(pc.used_at).toISOString();
    },
    after: async (c, items) => {
      const fresh = items.filter((i) => !i.old && i.obj.codeHash);
      if (fresh.length) await insertMany(c, "pickup_codes", fresh.map((i) => ({
        reservation_id: i.obj.id, vendor_id: i.obj.vendorId, qr_token_hash: i.obj.qrTokenHash, code_hash: i.obj.codeHash,
        code_enc: i.obj.code ? seal(i.obj.code) : null, qr_token_enc: i.obj.qrToken ? seal(i.obj.qrToken) : null,
        used_at: i.obj.codeUsedAt ?? null, voided_at: ["Cancelled", "Expired", "No-show"].includes(i.obj.status) ? i.obj.cancelledAt ?? new Date().toISOString() : null,
      })));
      for (const i of items.filter((x) => x.old && x.old.codeUsedAt !== x.obj.codeUsedAt)) await c.query("update pickup_codes set used_at = $2 where reservation_id = $1", [U(i.obj.id), i.obj.codeUsedAt ?? null]);
    },
  },
  { coll: "payments", table: "payments" },
  { coll: "refunds", table: "refunds" },
  { coll: "inventory", table: "inventory_movements", serial: true },
  {
    coll: "donationBatches", table: "donation_batches",
    omit: ["title", "diet", "allergens", "preparedAt", "claimedByNgoId", "claimedAt", "collectionCode", "collectionCodeHash", "collectedAt"],
    link: (objs, built, raw) => {
      const listings = new Map(built.listings.map((l) => [l.id, l]));
      for (const b of objs) {
        const l = listings.get(b.listingId);
        if (l) { b.title = l.title; b.diet = l.diet; b.allergens = l.allergens; b.preparedAt = l.preparedAt; }
        const cl = raw.donation_claims.find((x) => x.batch_id === b.id && !x.released_at);
        if (cl) { b.claimedByNgoId = cl.ngo_id; b.claimedAt = new Date(cl.claimed_at).toISOString(); b.collectionCodeHash = cl.collection_code_hash; const code = unseal(cl.collection_code_enc); if (code) b.collectionCode = code; }
        const h = raw.donation_handovers.find((x) => x.batch_id === b.id);
        if (h) b.collectedAt = new Date(h.at).toISOString();
      }
    },
    after: async (c, items) => {
      for (const { obj: b, old } of items) {
        if (b.claimedByNgoId !== old?.claimedByNgoId || b.collectionCodeHash !== old?.collectionCodeHash) {
          await c.query("update donation_claims set released_at = now() where batch_id = $1 and released_at is null", [U(b.id)]);
          if (b.claimedByNgoId) await insertMany(c, "donation_claims", [{ batch_id: b.id, ngo_id: b.claimedByNgoId, collection_code_hash: b.collectionCodeHash ?? "", collection_code_enc: b.collectionCode ? seal(b.collectionCode) : null, claimed_at: b.claimedAt ?? new Date().toISOString() }]);
        }
        if (b.collectedAt && !old?.collectedAt)
          await c.query("insert into donation_handovers (batch_id, vendor_user, at) select $1, v.owner_id, $2 from vendors v where v.id = $3", [U(b.id), b.collectedAt, U(b.vendorId)]);
      }
    },
  },
  { coll: "impact", table: "impact_events", serial: true },
  { coll: "notifications", table: "notifications", serial: true, gen: ["sent_at"] },
  { coll: "audit", table: "audit_logs", serial: true, xform: { actorId: { to: (v) => (v === "system" ? null : v), from: (v) => v ?? "system" } } },
  { coll: "reservationEvents", table: "reservation_events", serial: true, skipWrite: true, rename: { from: "from_status", to: "to_status" } },
  { coll: "pushTokens", table: "push_tokens" },
  { coll: "follows", table: "follows" },
  { coll: "reviews", table: "reviews" },
  { coll: "reports", table: "reports" },
  { coll: "settingsAudit", table: "settings_audit", rename: { from: "from_value", to: "to_value" } },
  { coll: "memberships", table: "memberships" },
  { coll: "invites", table: "staff_invites", rename: { token: "token_hash" } },
  { coll: "priceSteps", table: "listing_price_steps" },
  { coll: "referralCodes", table: "referral_codes", pk: "user_id" },
  { coll: "referrals", table: "referrals" },
  { coll: "creditLedger", table: "credit_ledger" },
  { coll: "distributionLogs", table: "distribution_logs" },
  { coll: "receipts", table: "donation_receipts", omit: ["eightyG"], skipCols: ["eighty_g_number", "eighty_g_valid_until"], unpack: (o, r) => unEightyG(o, r), pack: eightyG },
  { coll: "deliveryRequests", table: "delivery_requests" },
  { coll: "certificates", table: "impact_certificates" },
  { coll: "moderationActions", table: "moderation_actions" },
];

/** Settings: the app's `settings` object <-> rows of key / jsonb value (snake_case keys, as the SQL functions read them). */
export const SETTINGS_TABLE = "settings";
