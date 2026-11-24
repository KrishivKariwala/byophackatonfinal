// Domain model. Reservation, payment, listing and donation state are kept separate on purpose.

export type Role = "customer" | "vendor" | "ngo" | "admin";
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";
export type Diet = "Vegetarian" | "Non-vegetarian";
export type Category = "Bakery" | "Meals" | "Snacks" | "Desserts";

export type ListingStatus = "Draft" | "Live" | "Paused" | "Sold Out" | "Expired" | "Cancelled";
export type RiskTag = "raw" | "seafood" | "dairy_dessert";
export type ReservationStatus = "Hold" | "Reserved" | "Ready" | "Picked up" | "Cancelled" | "Expired" | "No-show";
export type PaymentStatus =
  | "Pending"
  | "Test Payment Successful"
  | "Failed"
  | "Paid at Pickup"
  | "Refund Pending"
  | "Refunded";
export type PaymentMethod = "online" | "pay_at_pickup";
export type DonationStatus = "Open" | "Claimed" | "Collected" | "Expired" | "Cancelled";

export interface Profile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: Role;
  createdAt: string;
  demo: true;
  /** P1: reservations suspended until this ISO time (3 no-shows in 30 days, or admin action). */
  suspendedUntil?: string;
  suspendReason?: string;
  /** P1: last known location, used for "within 10 km" alerts. */
  homeLat?: number;
  homeLng?: number;
}

export interface Vendor {
  id: string;
  ownerId: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  fssaiNumber: string;
  operatingHours: string;
  payoutUpi: string;
  documents: string[];
  status: ApprovalStatus;
  rejectionReason?: string;
  ratingDemo?: number; // demo-labelled only
  createdAt: string;
  /** P1 */
  logoUrl?: string;
  ratingAvg?: number;
  ratingCount?: number;
  /** Vendor allows orders above RULES.MAX_UNITS_PER_ORDER, up to this many units. */
  maxUnitsPerOrder?: number;
  /** Hidden from customers by an admin (report action). */
  hiddenByAdmin?: boolean;
}

export interface Outlet {
  id: string;
  vendorId: string;
  address: string;
  neighbourhood: string;
  lat: number;
  lng: number;
  payAtPickup: boolean;
  /** P2 */
  name?: string;
  hours?: string;
}

export interface Ngo {
  id: string;
  ownerId: string;
  orgName: string;
  contactPerson: string;
  phone: string;
  email: string;
  registrationDocs: string[];
  address: string;
  neighbourhood: string;
  lat: number;
  lng: number;
  serviceAreaKm: number;
  capacityMeals: number;
  handlingArrangements: string;
  fssaiInfo?: string;
  status: ApprovalStatus;
  rejectionReason?: string;
  createdAt: string;
  /** P2: shown on donation receipts; a valid 80G number turns the receipt into a tax-eligible one */
  registrationNumber?: string;
  eightyG?: { number: string; validUntil: string };
}

export interface Listing {
  id: string;
  vendorId: string;
  outletId: string;
  title: string;
  description: string;
  category: Category;
  imageUrl?: string;
  imageIsRepresentative: boolean;
  surpriseBag: boolean;
  originalPrice: number; // whole rupees
  rescuePrice: number;
  qtyTotal: number;
  qtyAvailable: number; // authoritative, changed only inside a transaction
  diet: Diet;
  allergens: string[];
  preparedAt: string;
  safeUntil?: string; // vendor-supplied safe-consumption deadline
  storageNote?: string;
  safetyDeclaration: { accepted: true; acceptedAt: string; byUserId: string };
  windowStart: string;
  windowEnd: string;
  donateRest: boolean;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  cancelReason?: string;
  donationProcessedAt?: string;
  /** P1 */
  donationOnly?: boolean; // never sold; goes straight to a donation batch
  riskTag?: RiskTag; // raw / seafood / dairy dessert: pickup window capped at 2 h
  hiddenByAdmin?: boolean;
  /** P2 */
  priorityMinutes?: number; // "offer to charities first" window length (15 / 30 / 45)
  publicVisibleAt?: string; // customers can't see or reserve before this; charities see it immediately
  initialRescuePrice?: number; // price at publish; auto-markdown steps are measured against the ORIGINAL price and can only lower it
  moderationNote?: string;
  publicNotifiedAt?: string; // followers were told once the listing went public after its priority window
}

export interface Template {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: Category;
  originalPrice: number;
  rescuePrice: number;
  diet: Diet;
  allergens: string[];
  surpriseBag: boolean;
  storageNote?: string;
  /** P1 */
  qty?: number;
  donateRest?: boolean;
  donationOnly?: boolean;
  riskTag?: RiskTag;
  windowMinutes?: number; // pickup window length, so a repost gets fresh times of the same length
  createdAt?: string;
  priorityMinutes?: number;
}

export interface CheckoutHold {
  id: string;
  listingId: string;
  customerId: string;
  qty: number;
  amount: number;
  expiresAt: string;
  status: "Active" | "Converted" | "Released" | "Expired";
  gatewayOrderId: string;
  createdAt: string;
  /** P2: referral credit (₹) applied to this checkout; `amount` is the CASH still to pay */
  creditApplied?: number;
}

export interface Reservation {
  id: string;
  ref: string; // human order reference, e.g. SAP-4821
  listingId: string;
  vendorId: string;
  outletId: string;
  customerId: string;
  qty: number;
  unitPrice: number;
  amount: number;
  method: PaymentMethod;
  status: ReservationStatus;
  holdId?: string;
  qrToken: string; // shown only to the owning customer
  code: string; // 4-digit fallback, shown only to the owning customer
  qrTokenHash: string;
  codeHash: string;
  codeUsedAt?: string;
  createdAt: string;
  readyAt?: string;
  pickedUpAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  /** P1 */
  cancelledBy?: "customer" | "vendor" | "system" | "admin";
  reminderSentAt?: string;
  noShowAt?: string;
  /** P2: referral credit (₹) paid with; `amount` is the full order value, the payment holds only the cash part */
  creditApplied?: number;
  /** P2 live ETA: only the minutes and when they were last updated are stored, never any location */
  etaMinutes?: number;
  etaUpdatedAt?: string;
}

/** P1: every reservation state change is logged here with a timestamp. */
export interface ReservationEvent {
  id: string;
  reservationId: string;
  from?: ReservationStatus;
  to: ReservationStatus;
  at: string;
  actorId?: string;
  note?: string;
}

export interface Payment {
  id: string;
  reservationId?: string;
  holdId?: string;
  customerId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  gateway: "razorpay_test" | "demo" | "cash_at_pickup";
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: "Refund Pending" | "Refunded";
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  listingId: string;
  delta: number;
  reason: string;
  refId?: string;
  at: string;
}

export interface DonationBatch {
  id: string;
  ref: string;
  listingId: string;
  vendorId: string;
  outletId: string;
  qty: number;
  title: string;
  diet: Diet;
  allergens: string[];
  preparedAt: string;
  collectBy: string;
  status: DonationStatus;
  claimedByNgoId?: string;
  claimedAt?: string;
  collectionCode?: string;
  collectionCodeHash?: string;
  collectedAt?: string;
  createdAt: string;
  vendorInstruction: string;
  /** P1 */
  origin?: "window_end" | "no_show" | "donation_only" | "priority";
  pickupSlot?: string;
  volunteerName?: string;
  volunteerPhone?: string;
  volunteerToken?: string;
  escalatedAt?: string;
  /** P2 */
  fromPriorityListing?: boolean; // a charity claimed a priority-window listing
  deliveryRequestId?: string;
}

export type ImpactType = "sold" | "donated" | "wasted";

export interface ImpactEvent {
  id: string;
  /** "expired" rows are P1 "wasted" events and are excluded from rescued-meal totals. */
  source: "customer_pickup" | "ngo_collection" | "expired";
  refId: string;
  units: number;
  vendorId: string;
  neighbourhood: string;
  at: string;
  /** P1 impact_events fields (additive) */
  type?: ImpactType;
  listingId?: string;
  qty?: number;
  kgEst?: number;
  co2eKg?: number;
  customerId?: string;
  rupeesSaved?: number;
}

export type NotificationType =
  | "order_confirmed" | "order_ready" | "pickup_reminder" | "order_cancelled" | "refund_issued"
  | "new_listing_followed" | "new_donation" | "donation_escalation" | "review_prompt"
  | "approval_decision" | "report_update" | "no_show" | "suspension" | "new_order" | "generic"
  /** P2 */
  | "price_drop" | "priority_listing" | "credit_earned" | "customer_eta" | "certificate_ready" | "delivery_update" | "moderation";

export interface Notification {
  id: string;
  userId: string;
  text: string;
  at: string; // sent_at
  read: boolean;
  /** P1 */
  type?: NotificationType;
  payload?: Record<string, unknown>;
  readAt?: string;
  /** Catalog key (`notif.<key>`) and values the English `text` was built from, so each reader sees it in their own language. */
  key?: string;
  vars?: Record<string, string | number>;
}

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: "ios" | "android" | "web";
  deviceId: string;
  createdAt: string;
}

export interface Follow { id: string; customerId: string; vendorId: string; lat?: number; lng?: number; createdAt: string }

export interface Review {
  id: string;
  reservationId: string; // unique
  customerId: string;
  vendorId: string;
  rating: number;
  text?: string;
  createdAt: string;
  hidden?: boolean; // P2 moderation
}

export type ReportReason = "food_safety" | "wrong_item" | "rude_behaviour" | "other";
export type ReportTarget = "reservation" | "listing" | "vendor";
export type ReportStatus = "Open" | "Dismissed" | "Actioned";
export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTarget;
  targetId: string;
  reason: ReportReason;
  photoUrl?: string;
  text?: string;
  status: ReportStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export type FlagName =
  | "referrals" | "i18n" | "liveEta" | "autoMarkdown" | "impactCertificate" | "multiOutlet"
  | "priorityWindow" | "distributionLog" | "donationReceipts" | "delivery" | "moderation" | "platformSettings";

export interface Settings {
  /** Platform fee in basis points of order value (1000 = 10%). */
  platformFeeBps: number;
  /** P2 platform settings (all optional: anything unset uses the default in lib/p2/settings.ts) */
  holdMinutes?: number;
  freeCancelMinutes?: number;
  defaultRadiusKm?: number;
  maxActiveReservations?: number;
  maxDiscountPct?: number;
  priorityOptions?: number[];
  referralCreditInr?: number;
  creditMaxPct?: number;
  moderationKeywords?: string[];
  /** P2 feature flags. Missing = on. */
  flags?: Partial<Record<FlagName, boolean>>;
  /** internal: last month the certificate job ran for, e.g. "2026-10" */
  lastCertificateRun?: string;
}

export interface SettingChange { id: string; adminId: string; key: string; from: string; to: string; at: string }

// ---------------------------------------------------------------- P2

export type OrgRole = "owner" | "manager" | "staff";
/** The vendor record IS the organization (brand). A membership links a user to it, optionally limited to one outlet. */
export interface Membership { id: string; userId: string; vendorId: string; outletId?: string; role: OrgRole; createdAt: string; revokedAt?: string }
export interface StaffInvite {
  id: string; vendorId: string; outletId?: string; role: Exclude<OrgRole, "owner">; contact: string; token: string;
  createdBy: string; createdAt: string; expiresAt: string; acceptedBy?: string; acceptedAt?: string; revokedAt?: string;
}

export interface PriceStep { id: string; listingId: string; effectiveAt: string; discountPct: number; appliedAt?: string }

export interface ReferralCode { userId: string; code: string; /** device the owner last opened their referral page on; a referee on the same device is refused */ deviceId?: string }
export type ReferralStatus = "pending" | "rewarded" | "rejected";
export interface Referral {
  id: string; referrerId: string; refereeId: string; code: string; status: ReferralStatus;
  deviceId?: string; phoneKey: string; createdAt: string; rewardedAt?: string; rejectReason?: string;
}
export interface CreditEntry {
  id: string; userId: string; amount: number; type: "earned" | "spent" | "expired"; refId?: string; note?: string;
  createdAt: string; expiresAt?: string;
  /** earned lots only: what is still unspent (FIFO by expiry) */
  remaining?: number;
}

export interface DistributionLog {
  id: string; batchId: string; ngoId: string; vendorId: string; servings: number; beneficiaries: number;
  centreName: string; notes?: string; photoUrls: string[]; createdAt: string;
}
export interface DonationReceipt {
  id: string; number: string; batchId: string; vendorId: string; ngoId: string; createdAt: string;
  item: string; qty: number; servings: number; estimatedValue: number; eightyG?: { number: string; validUntil: string };
}

export type DeliveryStatus = "Requested" | "Rider assigned" | "Picked up" | "Delivered" | "No rider found" | "Failed" | "Cancelled";
export interface DeliveryRequest {
  id: string; batchId: string; ngoId: string; vendorId: string; provider: string; externalId: string;
  status: DeliveryStatus; fee: number; pickupAddress: string; dropAddress: string; riderName?: string;
  createdAt: string; updatedAt: string; error?: string;
}

export interface ImpactCertificate {
  id: string; vendorId: string; month: string; createdAt: string;
  mealsSold: number; mealsDonated: number; kgRescued: number; rupeesRecovered: number; co2eKg: number; charitiesServed: number;
  /** people reached, from the distribution logs charities filed for this vendor's donations in the month */
  peopleServed: number;
  /** generated before the month ended: figures are month-to-date and will be replaced (same id) once the month closes */
  partial?: boolean;
}

export type ModerationTarget = "listing" | "review" | "vendor";
export type ModerationActionType = "hide" | "restore" | "edit" | "warn" | "suspend" | "dismiss";
export interface ModerationAction {
  id: string; adminId: string; targetType: ModerationTarget; targetId: string; action: ModerationActionType; reason: string; createdAt: string;
  /** fingerprint of the text the admin looked at, so a dismissed item only returns when its wording changes */
  contentHash?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  detail?: string;
  at: string;
}

export interface DB {
  version: 1;
  clockOffsetMs: number; // demo fast-forward only
  seq: number;
  profiles: Profile[];
  vendors: Vendor[];
  outlets: Outlet[];
  ngos: Ngo[];
  listings: Listing[];
  templates: Template[];
  holds: CheckoutHold[];
  reservations: Reservation[];
  payments: Payment[];
  refunds: Refund[];
  inventory: InventoryMovement[];
  donationBatches: DonationBatch[];
  impact: ImpactEvent[];
  notifications: Notification[];
  audit: AuditLog[];
  processedWebhooks: string[];
  /** P1 (optional so older persisted stores still load; see store.load) */
  reservationEvents: ReservationEvent[];
  pushTokens: PushToken[];
  follows: Follow[];
  reviews: Review[];
  reports: Report[];
  settings: Settings;
  /** P2 (optional so older persisted stores still load; see store.migrate) */
  settingsAudit: SettingChange[];
  memberships: Membership[];
  invites: StaffInvite[];
  priceSteps: PriceStep[];
  referralCodes: ReferralCode[];
  referrals: Referral[];
  creditLedger: CreditEntry[];
  distributionLogs: DistributionLog[];
  receipts: DonationReceipt[];
  receiptSeq: Record<string, number>; // per year
  deliveryRequests: DeliveryRequest[];
  certificates: ImpactCertificate[];
  moderationActions: ModerationAction[];
}

export type LiveEvent =
  | { type: "listing"; listingId: string; qtyAvailable: number; status: ListingStatus; committedAt: number }
  | { type: "reservation"; reservationId: string; status: ReservationStatus; customerId: string; vendorId: string; committedAt: number }
  | { type: "donation"; batchId: string; status: DonationStatus; committedAt: number }
  | { type: "impact"; committedAt: number };
