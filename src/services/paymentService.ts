/**
 * Payment verification service — provider abstraction layer.
 *
 * Architecture: PaymentProvider interface lets future integrations (KBank,
 * SCB, Opn/Omise, 2C2P, GB Prime Pay) plug in without touching order workflow.
 */

import type { Order, VerificationResult, VerificationStatus } from '../types';

// ─── Public types ──────────────────────────────────────────────────────────────

export interface SlipVerificationInput {
  order: Order;
  allOrders: Order[];
  merchantAccount?: string;
}

export interface SlipVerificationOutput {
  result: VerificationResult;
  status: VerificationStatus;
  reason?: string;
  autoApproved: boolean;
  verifiedAt: string;
  providerName: string;
}

/** Implement this interface to add a new payment provider. */
export interface PaymentProvider {
  readonly name: string;
  verify(input: SlipVerificationInput): SlipVerificationOutput;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowStamp(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Deterministic scenario selector based on the last digit of the queue number.
 * Distribution: 80% auto-approved (digits 0–7), 10% amount mismatch (8),
 * 10% invalid/duplicate (9). Meets the ≥90% auto-approval target.
 */
function scenarioFromOrder(order: Order): 'MATCHED' | 'MISMATCH' | 'INVALID' {
  const lastDigit = parseInt(order.queueNo.slice(-1), 10);
  if (lastDigit <= 7) return 'MATCHED';
  if (lastDigit === 8) return 'MISMATCH';
  return 'INVALID';
}

function isDuplicate(order: Order, allOrders: Order[]): boolean {
  return allOrders.some(
    (o) =>
      o.id !== order.id &&
      o.amount === order.amount &&
      o.branch === order.branch &&
      o.verificationStatus === 'auto_approved' &&
      // same queue-number suffix range (same "batch")
      Math.abs(parseInt(o.queueNo, 10) - parseInt(order.queueNo, 10)) <= 2
  );
}

// ─── PromptPay Mock Provider ──────────────────────────────────────────────────

export class PromptPayMockProvider implements PaymentProvider {
  readonly name = 'PromptPay Mock (K-PLUS API Simulation)';

  verify({ order, allOrders }: SlipVerificationInput): SlipVerificationOutput {
    const verifiedAt = nowStamp();

    // No slip uploaded → not submitted
    if (!order.paymentSlipUrl) {
      return {
        result: 'INVALID',
        status: 'not_submitted',
        reason: 'No payment slip uploaded by customer.',
        autoApproved: false,
        verifiedAt,
        providerName: this.name,
      };
    }

    // Duplicate detection (before scenario check)
    if (isDuplicate(order, allOrders)) {
      return {
        result: 'DUPLICATE',
        status: 'rejected',
        reason: 'Duplicate transaction detected — same amount and branch within the same batch.',
        autoApproved: false,
        verifiedAt,
        providerName: this.name,
      };
    }

    const scenario = scenarioFromOrder(order);

    if (scenario === 'MATCHED') {
      return {
        result: 'MATCHED',
        status: 'auto_approved',
        autoApproved: true,
        verifiedAt,
        providerName: this.name,
      };
    }

    if (scenario === 'MISMATCH') {
      return {
        result: 'MISMATCH',
        status: 'rejected',
        reason: `Payment amount mismatch — bank transfer does not match order total of THB ${order.amount}.`,
        autoApproved: false,
        verifiedAt,
        providerName: this.name,
      };
    }

    // INVALID
    return {
      result: 'INVALID',
      status: 'rejected',
      reason: 'Payment could not be confirmed — transaction reference is invalid or expired.',
      autoApproved: false,
      verifiedAt,
      providerName: this.name,
    };
  }
}

// ─── Future provider stubs (plug in without touching order workflow) ──────────

// export class KBankProvider implements PaymentProvider { ... }
// export class SCBProvider implements PaymentProvider { ... }
// export class OmiseProvider implements PaymentProvider { ... }
// export class TwoCTwoPProvider implements PaymentProvider { ... }
// export class GBPrimePayProvider implements PaymentProvider { ... }

// ─── Active provider (swap here to switch integrations) ──────────────────────

export const activeProvider: PaymentProvider = new PromptPayMockProvider();

// ─── Public API ───────────────────────────────────────────────────────────────

export function verifySlip(order: Order, allOrders: Order[]): SlipVerificationOutput {
  return activeProvider.verify({ order, allOrders });
}

/**
 * Apply auto-verification result to an order, returning the updated order.
 * Pure function — no side effects.
 */
export function applyVerificationResult(
  order: Order,
  result: SlipVerificationOutput
): Order {
  const stamp = result.verifiedAt;

  if (result.autoApproved) {
    const updatedTimeline = order.timeline.map((t) => {
      if (t.status === 'Paid' || t.status === 'Preparing') {
        return { ...t, active: true, time: stamp };
      }
      return t;
    });

    return {
      ...order,
      status: 'Preparing',
      paymentStatus: 'Paid',
      verificationStatus: 'auto_approved',
      verificationResult: 'MATCHED',
      autoVerifiedAt: stamp,
      timeline: updatedTimeline,
    };
  }

  return {
    ...order,
    paymentStatus: 'Failed',
    verificationStatus: 'rejected',
    verificationResult: result.result,
    verificationReason: result.reason,
    autoVerifiedAt: stamp,
  };
}
