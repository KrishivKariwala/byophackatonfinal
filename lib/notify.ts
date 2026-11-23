import type { TxContext } from "./store";
import type { DB, NotificationType } from "./types";
import { newId } from "./crypto";

/**
 * The single entry point every feature uses to notify a user.
 *  - Always writes a row to `notifications` (user_id, type, payload, sent_at, read_at) inside the caller's transaction.
 *  - After the transaction commits, best-effort Expo push to the user's registered devices (EXPO_PUSH_ENABLED=true).
 *  - SMS is optional and behind SMS_ENABLED=true (a webhook adapter; off by default).
 * Delivery failures never roll back or fail the business operation.
 */
export function sendNotification(
  tx: TxContext,
  userId: string,
  type: NotificationType,
  text: string,
  payload: Record<string, unknown> = {},
) {
  const at = new Date(tx.now).toISOString();
  tx.db.notifications.push({ id: newId("nt"), userId, type, text, payload, at, read: false });
  const tokens = tx.db.pushTokens.filter((p) => p.userId === userId).map((p) => p.token);
  const phone = tx.db.profiles.find((p) => p.id === userId)?.phone;
  if (tokens.length && process.env.EXPO_PUSH_ENABLED === "true") tx.afterCommit(() => deliverPush(tokens, text, { type, ...payload }));
  if (phone && process.env.SMS_ENABLED === "true") tx.afterCommit(() => deliverSms(phone, text));
}

async function deliverPush(tokens: string[], body: string, data: Record<string, unknown>) {
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(tokens.map((to) => ({ to, title: "Save a Plate", body, data, sound: "default" }))),
  });
  if (!res.ok) console.error("Expo push failed", res.status);
}

async function deliverSms(phone: string, text: string) {
  const url = process.env.SMS_WEBHOOK_URL;
  if (!url) { console.log(`[sms:disabled-no-webhook] ${phone}: ${text}`); return; }
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: phone, text }) });
  if (!res.ok) console.error("SMS webhook failed", res.status);
}

/** Read-side helper (no mutation). */
export function unreadCount(db: DB, userId: string) {
  return db.notifications.filter((n) => n.userId === userId && !n.read).length;
}
