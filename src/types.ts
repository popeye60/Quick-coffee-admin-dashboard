/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Branch = 'Central Plaza' | 'Siam Square' | 'Mega Bangna' | 'The Mall Korat' | 'All Branches';

export type OrderStatus = 'Pending Payment' | 'Paid' | 'Preparing' | 'Ready For Pickup' | 'Queue Called' | 'Completed' | 'Cancelled';

export type CancellationReason =
  | 'Customer Did Not Pay'
  | 'Customer Requested Cancellation'
  | 'Wrong Order Selected'
  | 'Out of Stock'
  | 'Store Unable to Fulfill'
  | 'Staff Error'
  | 'Other';

export type RefundStatus = 'Refund Pending' | 'Refund Completed';

export type VerificationResult = 'MATCHED' | 'MISMATCH' | 'DUPLICATE' | 'INVALID' | 'WRONG_RECEIVER';
export type VerificationStatus = 'auto_approved' | 'pending_review' | 'rejected' | 'not_submitted';

export interface AddonOption {
  id: string;
  name: string;
  price: number;       // additional price
  isDefault: boolean;
  enabled: boolean;
}

export interface AddonGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  order: number;
  options: AddonOption[];
}

export type SpecialMenuType = 'Seasonal' | 'Limited Edition' | 'New Arrival' | 'Recommended' | 'Promotion';
export interface SpecialMenuMeta {
  type: SpecialMenuType;
  description?: string;
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD
  priority: number;
  active: boolean;
  publish: 'Draft' | 'Published' | 'Expired';
  featured?: boolean;   // feature on home screen
}

export interface CoffeeItem {
  id: string;
  name: string;
  category: 'Coffee' | 'Beverage' | 'Bakery';
  price: number;
  status: 'Available' | 'Out of Stock' | 'Hidden';
  image: string;                 // emoji fallback
  coverImage?: string;           // uploaded data URL (preferred when present)
  description?: string;
  displayOrder?: number;
  archived?: boolean;
  addonGroups?: AddonGroup[];
  branchPrices?: Record<string, number>;       // per-branch price override
  branchAvailable?: Record<string, boolean>;   // per-branch availability
  special?: SpecialMenuMeta;
}

export interface OrderItem {
  item: CoffeeItem;
  qty: number;
  price: number;
  total: number;
}

export interface OrderTimeline {
  status: OrderStatus;
  time: string;
  active: boolean;
}

export interface Order {
  id: string; // e.g. ORD-20260525-152
  queueNo: string; // e.g. 0258
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  branch: Exclude<Branch, 'All Branches'>;
  status: OrderStatus;
  amount: number;
  time: string; // short time, e.g. "10:45"
  orderTime: string; // full time, e.g. "25 May 2026, 10:45"
  items: OrderItem[];
  paymentStatus: 'Pending Payment' | 'Paid' | 'Failed' | 'Refunded' | 'Rejected';
  paymentMethod: string; // "PromptPay QR" or "Credit Card"
  paymentSlipUrl?: string; // Seeded content
  note?: string;
  timeline: OrderTimeline[];
  // Auto-verification fields
  verificationStatus?: VerificationStatus;
  verificationResult?: VerificationResult;
  verificationReason?: string;
  autoVerifiedAt?: string;
  // Cancellation & refund tracking
  cancellationReason?: CancellationReason;
  cancellationNote?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  refundStatus?: RefundStatus;
  refundAmount?: number;
  refundNote?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  type: string; // "Ingredient" | "Packaging" | "Bean"
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stockLevel: number; // percentage 0 - 100
  unit: string; // "kg" | "liters" | "bags" | "boxes"
  branch: Exclude<Branch, 'All Branches'>;
}

export interface Coupon {
  code: string;
  name?: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 50 or 30 (for Baht)
  startDate?: string;
  endDate?: string;
  limitGlobal: number;
  limitPerUser: number;
  limitDaily: number;
  usageCount: number;
  status: 'Active' | 'Inactive';
}

export interface Activity {
  id: string;
  text: string;
  time: string;
  type: 'order' | 'payment' | 'stock' | 'coupon' | 'member';
  status: 'New' | 'Paid' | 'Ready' | 'Sent' | 'Alert';
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinDate: string;
  tier: 'Gold' | 'Silver' | 'Bronze';
  points: number;
  totalOrders: number;
  totalSpend: number;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Super Admin' | 'Branch Manager' | 'Barista';
  branch: Branch;
  email: string;
  status: 'Active' | 'Inactive';
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  status: 'Active' | 'Inactive';
  startDate: string;
  endDate: string;
  clicks: number;
  targetBranch: Branch;
}

export interface BranchPrice {
  branch: Exclude<Branch, 'All Branches'>;
  productId: string;
  sellingPrice: number;
  isAvailable: boolean;
}
