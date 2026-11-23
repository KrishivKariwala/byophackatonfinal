import "server-only";
import { read, now as clockNow } from "./store";
import { RULES, RuleError } from "./rules";
import { write, setApproval } from "./services";
import { audit, emitRes, iso, move, notify, requireRole, setResStatus, t } from "./core";
import { issueRefundTx, isLowRated, vendorFlags } from "./p1";
import { noShowCount } from "./jobs";
import type { DB, Profile, Report, Reservation, Vendor } from "./types";

/** P1 admin console: approvals queue, reports & disputes queue, flagged vendors/customers. */

// ---------------------------------------------------------------- approvals (E1)
export function approvalsQueue(db: DB = read()) {
  const vendors = db.vendors.filter((v) => v.status !== "Approved").map((v) => {
    const o = db.outlets.find((x) => x.vendorId === v.id);
    return { key: `vendor:${v.id}`, kind: "vendor" as const, id: v.id, name: v.businessName, status: v.status, reason: v.rejectionReason, submittedAt: v.createdAt,
      fields: [["Contact", `${v.contactName} · ${v.phone}`], ["FSSAI", v.fssaiNumber], ["Address", o?.address ?? "—"], ["Hours", v.operatingHours], ["Payout UPI", v.payoutUpi]] as [string, string][],
      documents: [...v.documents, ...(v.logoUrl ? [v.logoUrl] : [])] };
  });
  const ngos = db.ngos.filter((n) => n.status !== "Approved").map((n) => ({
    key: `ngo:${n.id}`, kind: "ngo" as const, id: n.id, name: n.orgName, status: n.status, reason: n.rejectionReason, submittedAt: n.createdAt,
    fields: [["Contact", `${n.contactPerson} · ${n.phone}`], ["Address", n.address], ["Capacity", `${n.capacityMeals} meals/day`], ["Service area", `${n.serviceAreaKm} km`], ["Handling", n.handlingArrangements]] as [string, string][],
    documents: n.registrationDocs,
  }));
  const order = { Pending: 0, Rejected: 1, Approved: 2 } as const;
  return [...vendors, ...ngos].sort((a, b) => order[a.status] - order[b.status] || (a.submittedAt < b.submittedAt ? 1 : -1));
}

export function decideApproval(actor: Profile | null, key: string, decision: "Approved" | "Rejected", reason?: string) {
  const [kind, id] = key.split(":");
  if ((kind !== "vendor" && kind !== "ngo") || !id) throw new RuleError("not_found", "Application not found.", 404);
  return setApproval(actor, kind, id, decision, reason);
}

// ---------------------------------------------------------------- reports & disputes (E2)
function resolveTarget(db: DB, r: Report): { vendor?: Vendor; listingId?: string; reservation?: Reservation } {
  if (r.targetType === "vendor") return { vendor: db.vendors.find((v) => v.id === r.targetId) };
  if (r.targetType === "listing") { const l = db.listings.find((x) => x.id === r.targetId); return { listingId: l?.id, vendor: db.vendors.find((v) => v.id === l?.vendorId) }; }
  const res = db.reservations.find((x) => x.id === r.targetId);
  return { reservation: res, listingId: res?.listingId, vendor: db.vendors.find((v) => v.id === res?.vendorId) };
}

export function reportsQueue(db: DB = read()) {
  return [...db.reports].sort((a, b) => (a.status === "Open" ? 0 : 1) - (b.status === "Open" ? 0 : 1) || (a.createdAt < b.createdAt ? 1 : -1)).map((r) => {
    const tg = resolveTarget(db, r);
    const listing = db.listings.find((l) => l.id === tg.listingId);
    const pay = tg.reservation ? db.payments.find((p) => p.reservationId === tg.reservation!.id) : undefined;
    return {
      ...r,
      reporter: (db.profiles.find((p) => p.id === r.reporterId)?.name ?? "Customer").split(" ")[0],
      vendorName: tg.vendor?.businessName, listingTitle: listing?.title, reservationRef: tg.reservation?.ref,
      canRefund: !!tg.reservation && pay?.status === "Test Payment Successful", canHide: !!listing, canSuspend: !!tg.vendor,
      log: db.audit.filter((a) => a.entity === "report" && a.entityId === r.id).map((a) => ({ at: a.at, who: db.profiles.find((p) => p.id === a.actorId)?.name ?? a.actorId, action: a.action, detail: a.detail })),
    };
  });
}

export type ReportAction = "dismiss" | "warn" | "hide_listing" | "suspend_account" | "refund_order";
export const REPORT_ACTIONS: ReportAction[] = ["dismiss", "warn", "hide_listing", "suspend_account", "refund_order"];

export function actOnReport(actor: Profile | null, reportId: string, action: ReportAction, note?: string) {
  return write((tx) => {
    const me = requireRole(actor, "admin");
    const { db } = tx;
    const rep = db.reports.find((x) => x.id === reportId);
    if (!rep) throw new RuleError("not_found", "Report not found.", 404);
    if (rep.status !== "Open") throw new RuleError("already_resolved", `This report was already ${rep.status.toLowerCase()}.`, 409);
    if (!REPORT_ACTIONS.includes(action)) throw new RuleError("action_invalid", "Unknown action.");
    const tg = resolveTarget(db, rep);
    const text = (note ?? "").trim().slice(0, 500);
    let refund: { id: string; amount: number; gateway?: string; gatewayPaymentId?: string } | undefined;

    if (action === "warn") {
      if (!tg.vendor) throw new RuleError("no_target", "No vendor to warn.");
      notify(tx, tg.vendor.ownerId, `Warning from Save a Plate: a customer reported an issue (${rep.reason.replace("_", " ")}). ${text}`.trim(), "report_update", { reportId: rep.id });
    } else if (action === "hide_listing") {
      const l = db.listings.find((x) => x.id === tg.listingId);
      if (!l) throw new RuleError("no_target", "No listing to hide.");
      l.hiddenByAdmin = true;
      if (l.status === "Live" || l.status === "Sold Out") l.status = "Paused";
      l.updatedAt = iso(tx.now);
      tx.emit({ type: "listing", listingId: l.id, qtyAvailable: l.qtyAvailable, status: l.status });
      const v = db.vendors.find((x) => x.id === l.vendorId);
      if (v) notify(tx, v.ownerId, `Your listing "${l.title}" was hidden after a report. ${text}`.trim(), "report_update", { reportId: rep.id });
    } else if (action === "suspend_account") {
      if (!tg.vendor) throw new RuleError("no_target", "No account to suspend.");
      const owner = db.profiles.find((p) => p.id === tg.vendor!.ownerId);
      if (owner) { owner.suspendedUntil = iso(tx.now + 365 * 86400_000); owner.suspendReason = `Suspended by an administrator after a report. ${text}`.trim(); }
      tg.vendor.hiddenByAdmin = true;
      if (owner) notify(tx, owner.id, owner.suspendReason!, "suspension");
    } else if (action === "refund_order") {
      const r = tg.reservation;
      if (!r) throw new RuleError("no_target", "Refunds need an order. Open the report on an order.");
      const p = db.payments.find((x) => x.reservationId === r.id);
      if (!p || p.status !== "Test Payment Successful") throw new RuleError("not_refundable", "This order has no captured online payment to refund.", 409);
      if (r.status === "Reserved" || r.status === "Ready") {
        setResStatus(tx, r, "Cancelled", me.id, "refunded by admin");
        r.cancelledAt = iso(tx.now); r.cancelledBy = "admin"; r.cancelReason = "Refunded by an administrator";
        const l = db.listings.find((x) => x.id === r.listingId);
        if (l && ["Live", "Sold Out", "Paused"].includes(l.status) && tx.now < t(l.windowEnd)) move(tx, l, r.qty, "admin_refund", r.id);
        emitRes(tx, r);
      }
      const rf = issueRefundTx(tx, p, `Admin refund (report ${rep.id})`);
      notify(tx, r.customerId, `Refund of ₹${p.amount} issued for ${r.ref}.`, "refund_issued", { reservationId: r.id, amount: p.amount });
      refund = { id: rf.id, amount: p.amount, gateway: p.gateway, gatewayPaymentId: p.gatewayPaymentId };
    }

    rep.status = action === "dismiss" ? "Dismissed" : "Actioned";
    rep.resolution = `${action}${text ? `: ${text}` : ""}`;
    rep.resolvedBy = me.id;
    rep.resolvedAt = iso(tx.now);
    audit(tx, me.id, `report_${action}`, "report", rep.id, text || undefined);
    notify(tx, rep.reporterId, action === "dismiss" ? "We reviewed your report and didn't find a violation. Thanks for flagging it." : "We reviewed your report and took action. Thank you.", "report_update", { reportId: rep.id });
    return { report: rep, refund };
  });
}

// ---------------------------------------------------------------- flagged (E3)
export function flaggedLists(db: DB = read()) {
  const n = clockNow(db);
  const vendors = db.vendors.map((v) => ({ v, f: vendorFlags(db, v) })).filter((x) => x.f.lowRating || x.f.repeatedReports).map(({ v, f }) => ({
    id: v.id, name: v.businessName, ratingAvg: v.ratingAvg, ratingCount: v.ratingCount ?? 0, openReports: f.openReports,
    reasons: [f.lowRating ? `Rating ${v.ratingAvg?.toFixed(1)} from ${v.ratingCount} ratings (below ${RULES.FLAG_RATING_BELOW.toFixed(1)})` : null, f.repeatedReports ? `${f.openReports} open reports` : null].filter(Boolean) as string[],
  }));
  const since = n - RULES.NO_SHOW_SUSPEND_WINDOW_DAYS * 86400_000;
  const customers = db.profiles.filter((p) => p.role === "customer").map((p) => ({ p, ns: noShowCount(db, p.id, since) }))
    .filter(({ p, ns }) => ns >= RULES.NO_SHOW_FLAG_COUNT || (p.suspendedUntil && t(p.suspendedUntil) > n)).map(({ p, ns }) => ({
      id: p.id, name: p.name.split(" ")[0], noShows30d: ns, suspendedUntil: p.suspendedUntil && t(p.suspendedUntil) > n ? p.suspendedUntil : undefined,
    }));
  return { vendors, customers };
}
export { isLowRated };
