// Domain model. Reservation, payment, listing and donation state are kept separate on purpose.

export type Role = "customer" | "vendor" | "ngo" | "admin";
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";
export type Diet = "Vegetarian" | "Non-vegetarian";
export type Category = "Bakery" | "Meals" | "Snacks" | "Desserts";

export type ListingStatus = "Draft" | "Live" | "Paused" | "Sold Out" | "Expired" | "Cancelled";
export type ReservationStatus = "Hold" | "Reserved" | "Ready" | "Picked up" | "Cancelled" | "Expired";
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
}

export interface Outlet {
  id: string;
  vendorId: string;
  address: string;
  neighbourhood: string;
  lat: number;
  lng: number;
  payAtPickup: boolean;
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
}

export interface ImpactEvent {
  id: string;
  source: "customer_pickup" | "ngo_collection";
  refId: string;
  units: number;
  vendorId: string;
  neighbourhood: string;
  at: string;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  at: string;
  read: boolean;
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
}

export type LiveEvent =
  | { type: "listing"; listingId: string; qtyAvailable: number; status: ListingStatus; committedAt: number }
  | { type: "reservation"; reservationId: string; status: ReservationStatus; customerId: string; vendorId: string; committedAt: number }
  | { type: "donation"; batchId: string; status: DonationStatus; committedAt: number }
  | { type: "impact"; committedAt: number };
