/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import Sidebar, { SidebarTab } from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import OrdersView from './components/OrdersView';
import PaymentVerificationView from './components/PaymentVerificationView';
import StockManagementView, { resetDailyStockSessionRecords, type StockGateStatus } from './components/StockManagementView';
import MenuPricingView from './components/MenuPricingView';
import CouponsView from './components/CouponsView';
import OtherViews from './components/OtherViews';
import BranchPricingView from './components/BranchPricingView';
import BranchManagementView from './components/BranchManagementView';
import CentralWarehouseView from './components/CentralWarehouseView';
import QueueDisplayScreen from './components/QueueDisplayScreen';
import { 
  INITIAL_MENU_ITEMS, 
  INITIAL_ORDERS, 
  INITIAL_INGREDIENTS, 
  INITIAL_COUPONS, 
  INITIAL_ACTIVITIES, 
  INITIAL_MEMBERS, 
  INITIAL_STAFF, 
  INITIAL_PROMOTIONS 
} from './mockData';
import { Order, OrderStatus, Ingredient, CoffeeItem, Coupon, Activity, Member, Staff, Promotion, Branch, BranchPrice, BranchStatus, CancellationReason, RefundStatus } from './types';
import { verifySlip, applyVerificationResult } from './services/paymentService';

const ADMIN_ALLOWED_TABS: SidebarTab[] = ['Dashboard', 'Orders', 'Stock Management', 'Branches', 'Menu & Pricing', 'Warehouse', 'Promotions', 'Coupons', 'Members', 'Staff Management', 'Reports', 'Audit Log'];
const STAFF_ALLOWED_TABS: SidebarTab[] = ['Dashboard', 'Orders', 'Stock Management'];
const BRANCHES_FOR_PRICING: Exclude<Branch, 'All Branches'>[] = ['Central Plaza', 'Siam Square', 'Mega Bangna', 'The Mall Korat'];
const DEFAULT_BRANCH_STATUSES: Record<Exclude<Branch, 'All Branches'>, BranchStatus> = {
  'Central Plaza': 'Open',
  'Siam Square': 'Open',
  'Mega Bangna': 'Temporarily Closed',
  'The Mall Korat': 'Open',
};
const deepClone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};
const branchPricesFromMenu = (records: CoffeeItem[]): BranchPrice[] => records.flatMap(item =>
  BRANCHES_FOR_PRICING.map(branch => ({
    branch,
    productId: item.id,
    sellingPrice: item.branchPrices?.[branch] ?? item.price,
    isAvailable: item.branchAvailable?.[branch] ?? true,
  }))
);

const QUEUED_STATUSES: OrderStatus[] = ['Paid', 'Preparing', 'Ready For Pickup', 'Queue Called', 'Completed', 'Cancelled by Staff'];

const normalizeCancellationState = (order: Order): Order => {
  if (order.status === 'Cancelled by Staff') {
    const queueNo = order.queueNo || order.originalQueueNo;
    const hasCompleteAudit = !!queueNo && !!order.cancelledBy && !!order.cancellationReason && !!order.cancelledAt;

    if (!hasCompleteAudit) {
      return {
        ...order,
        status: 'Auto Cancelled',
        queueNo: '',
        paymentStatus: order.paymentStatus === 'Paid' ? 'Pending Payment' : order.paymentStatus,
        cancellationReason: order.cancellationReason || 'Payment Timeout',
        cancellationNote: order.cancellationNote || 'Payment timeout before queue generation',
        cancelledBy: 'System',
        cancelledAt: order.cancelledAt || order.orderTime,
        originalOrderStatus: order.originalOrderStatus || 'Pending Payment',
        originalQueueNo: undefined,
      };
    }

    return {
      ...order,
      queueNo,
      paymentStatus: 'Paid',
      originalQueueNo: order.originalQueueNo || queueNo,
      originalOrderStatus: order.originalOrderStatus || 'Preparing',
    };
  }

  if (order.status === 'Cancelled' && !order.queueNo && order.paymentStatus !== 'Paid') {
    return {
      ...order,
      status: 'Auto Cancelled',
      cancellationReason: order.cancellationReason || 'Payment Timeout',
      cancellationNote: order.cancellationNote || 'Payment timeout before queue generation',
      cancelledBy: 'System',
      cancelledAt: order.cancelledAt || order.orderTime,
      originalOrderStatus: order.originalOrderStatus || 'Pending Payment',
      originalQueueNo: undefined,
    };
  }

  return order;
};

const normalizeBranchQueueNumbers = (records: Order[]): Order[] => {
  const queueById: Record<string, string> = {};
  const prefilled = records.map(normalizeCancellationState);
  const orderDateKey = (order: Order) => order.orderTime.match(/^(\d{1,2}\s+\w+\s+\d{4})/)?.[1] || 'unknown-date';

  const queued = prefilled
    .filter(order => order.queueNo && QUEUED_STATUSES.includes(order.status))
    .sort((a, b) => a.branch.localeCompare(b.branch) || orderDateKey(a).localeCompare(orderDateKey(b)) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
  const nextByBranchDate: Record<string, number> = {};
  queued.forEach(order => {
    const groupKey = `${order.branch}:${orderDateKey(order)}`;
    const next = (nextByBranchDate[groupKey] || 0) + 1;
    nextByBranchDate[groupKey] = next;
    queueById[order.id] = String(next).padStart(3, '0');
  });

  return prefilled.map(order => {
    if (!order.queueNo || !QUEUED_STATUSES.includes(order.status)) return order;
    const queueNo = queueById[order.id] || order.queueNo;
    return {
      ...order,
      queueNo,
      originalQueueNo: order.status === 'Cancelled by Staff' ? queueNo : order.originalQueueNo,
    };
  });
};

const createDefaultDemoState = () => {
  const menuItems = deepClone(INITIAL_MENU_ITEMS);
  return {
    orders: normalizeBranchQueueNumbers(deepClone(INITIAL_ORDERS)),
    ingredients: deepClone(INITIAL_INGREDIENTS),
    menuItems,
    coupons: deepClone(INITIAL_COUPONS),
    activities: deepClone(INITIAL_ACTIVITIES),
    members: deepClone(INITIAL_MEMBERS),
    staff: deepClone(INITIAL_STAFF),
    promotions: deepClone(INITIAL_PROMOTIONS),
    branchPrices: branchPricesFromMenu(menuItems),
    branchStatuses: deepClone(DEFAULT_BRANCH_STATUSES),
  };
};

export default function App() {
  // Navigation states
  const [currentTab, setCurrentTab] = useState<SidebarTab>('Dashboard');
  const [roleMode, setRoleMode] = useState<'Admin' | 'Staff'>('Admin');
  
  // Roster variables
  const [staffAssignedBranch, setStaffAssignedBranch] = useState<string>('Central Plaza');
  const [selectedBranch, setSelectedBranch] = useState<Branch>('All Branches');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Selected sub-elements for cross-view wizard routing
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Core demo states are intentionally in-memory only. Refreshing the browser
  // rebuilds them from immutable mock data for clean repeated testing.
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<CoffeeItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [branchPrices, setBranchPrices] = useState<BranchPrice[]>([]);
  const [branchStatuses, setBranchStatuses] = useState<Record<Exclude<Branch, 'All Branches'>, BranchStatus>>(deepClone(DEFAULT_BRANCH_STATUSES));
  const [demoResetVersion, setDemoResetVersion] = useState(0);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [stockGateStatus, setStockGateStatus] = useState<StockGateStatus | null>(null);
  const staffBranchKey = (BRANCHES_FOR_PRICING.includes(staffAssignedBranch as Exclude<Branch, 'All Branches'>)
    ? staffAssignedBranch
    : 'Central Plaza') as Exclude<Branch, 'All Branches'>;
  const staffBranchMasterStatus = branchStatuses[staffBranchKey] ?? 'Closed';
  const staffOpeningConfirmed = stockGateStatus?.branch === staffAssignedBranch && stockGateStatus.openingConfirmed;
  const staffEffectiveBranchStatus: BranchStatus = staffBranchMasterStatus === 'Closed'
    ? 'Closed'
    : staffBranchMasterStatus === 'Temporarily Closed'
      ? 'Temporarily Closed'
      : staffOpeningConfirmed
        ? 'Open'
        : 'Closed';
  const headerBranchStatuses = roleMode === 'Staff'
    ? { ...branchStatuses, [staffBranchKey]: staffEffectiveBranchStatus }
    : branchStatuses;
  const staffOpeningGatePassed = roleMode !== 'Staff' || (staffBranchMasterStatus === 'Open' && staffOpeningConfirmed && staffEffectiveBranchStatus === 'Open');

  useEffect(() => {
    setStockGateStatus(null);
  }, [staffAssignedBranch, roleMode]);

  const resetDemoData = () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const demoState = createDefaultDemoState();
      setOrders(demoState.orders);
      setIngredients(demoState.ingredients);
      setMenuItems(demoState.menuItems);
      setCoupons(demoState.coupons);
      setActivities(demoState.activities);
      setMembers(demoState.members);
      setStaff(demoState.staff);
      setPromotions(demoState.promotions);
      setBranchPrices(demoState.branchPrices);
      setBranchStatuses(demoState.branchStatuses);
      setSelectedOrderId(null);
      setStockGateStatus(null);
      resetDailyStockSessionRecords();
      setDemoResetVersion(prev => prev + 1);
    } catch (err) {
      console.error('Unable to initialize demo data', err);
      setIngredients([]);
      setInventoryError('Demo inventory data could not be loaded.');
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    resetDemoData();
    // Demo mode intentionally resets from source mock data only once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Branch-specific queue number generator ──────────────────────────────────
  // Returns YYYY-MM-DD for today
  const getTodayDateStr = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Parses '25 May 2026, 10:45' → '2026-05-25'
  const parseOrderDate = (orderTime: string): string => {
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    const m = orderTime.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (!m) return '';
    return `${m[3]}-${months[m[2]] ?? '00'}-${m[1].padStart(2, '0')}`;
  };

  // Generates the next 3-digit queue number for a branch scoped to today only.
  // branchCounters accumulates increments within a single batch to handle
  // multiple orders from the same branch being approved simultaneously.
  const generateBranchQueueNo = (branch: string, allOrders: Order[], branchCounters: Record<string, number>): string => {
    if (!(branch in branchCounters)) {
      const today = getTodayDateStr();
      const maxForBranch = allOrders
        .filter(o => o.branch === branch && o.queueNo !== '' && parseOrderDate(o.orderTime) === today)
        .map(o => parseInt(o.queueNo, 10))
        .filter(n => !isNaN(n))
        .reduce((max, n) => Math.max(max, n), 0);
      branchCounters[branch] = maxForBranch;
    }
    branchCounters[branch]++;
    return String(branchCounters[branch]).padStart(3, '0');
  };

  // ─── Simulated store clock + payment auto-cancel ─────────────────────────────
  const PAYMENT_TIMEOUT_MIN = 10;
  const timeToMin = (t: string) => { const m = t.match(/(\d+):(\d+)/); return m ? +m[1] * 60 + +m[2] : 0; };
  const clockBaseRef = useRef<number | null>(null);
  const mountRealRef = useRef<number>(Date.now());
  const [nowMin, setNowMin] = useState<number>(0);

  // Set the baseline simulated "now" once orders are available (= newest order time + 3 min)
  useEffect(() => {
    if (clockBaseRef.current === null && orders.length) {
      const maxT = Math.max(0, ...orders.map(o => timeToMin(o.time)));
      clockBaseRef.current = maxT + 3;
      setNowMin(maxT + 3);
    }
  }, [orders]);

  // Advance the simulated clock with real time (1 simulated minute per real minute)
  useEffect(() => {
    const id = setInterval(() => {
      if (clockBaseRef.current === null) return;
      const elapsed = Math.floor((Date.now() - mountRealRef.current) / 60000);
      setNowMin(clockBaseRef.current + elapsed);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // Auto-cancel any order left unpaid past the 10-minute window
  useEffect(() => {
    if (clockBaseRef.current === null) return;
    const stale = orders.filter(o => o.status === 'Pending Payment' && (nowMin - timeToMin(o.time)) >= PAYMENT_TIMEOUT_MIN);
    if (stale.length === 0) return;
    const stamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
    setOrders(prev => prev.map(o =>
      (o.status === 'Pending Payment' && (nowMin - timeToMin(o.time)) >= PAYMENT_TIMEOUT_MIN)
        ? { ...o, status: 'Auto Cancelled' as OrderStatus, queueNo: '', cancellationReason: 'Payment Timeout' as const, cancellationNote: 'Payment timeout after 10 minutes', cancelledBy: 'System', cancelledAt: stamp, originalOrderStatus: o.status, originalQueueNo: o.queueNo || undefined }
        : o
    ));
    setActivities(prev => [
      ...stale.map(o => ({
        id: `ACT-AUTOCANCEL-${o.id}`,
        text: `Order Auto Cancelled — ${o.id}. Reason: Payment timeout after 10 minutes`,
        time: stamp,
        type: 'order' as const,
        status: 'Alert' as const,
      })),
      ...prev,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowMin]);

  // ─── Auto-verification engine ────────────────────────────────────────────────
  // Tracks order IDs already queued for verification so the effect is idempotent.
  const verifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const toVerify = orders.filter(
      (o) =>
        o.status === 'Pending Payment' &&
        !o.verificationStatus &&
        !verifiedRef.current.has(o.id)
    );

    if (toVerify.length === 0) return;

    // Mark as queued immediately to prevent re-entry on the next render
    toVerify.forEach((o) => verifiedRef.current.add(o.id));

    // Simulate async bank-API latency (600–1400 ms)
    const delay = 600 + Math.floor(Math.random() * 800);
    const timer = setTimeout(() => {
      setOrders((prev) => {
        const snapshot = prev;
        const branchCounters: Record<string, number> = {};
        return prev.map((order) => {
          if (!toVerify.some((v) => v.id === order.id)) return order;
          const result = verifySlip(order, snapshot);
          const updated = applyVerificationResult(order, result);
          if (result.autoApproved && (order.queueNo === '' || !order.queueNo)) {
            return { ...updated, queueNo: generateBranchQueueNo(order.branch, snapshot, branchCounters) };
          }
          return updated;
        });
      });

      // Emit activity log entries for auto-approved orders
      const stamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const newActivities: Activity[] = [];

      toVerify.forEach((order) => {
        const result = verifySlip(order, orders);
        if (result.autoApproved) {
          newActivities.push({
            id: `ACT-AV-${Date.now()}-${order.id}`,
            text: `[AUTO] Payment confirmed for #${order.id} at ${order.branch} — Queue assigned, order moved to Preparing.`,
            time: `Just now, ${stamp}`,
            type: 'payment',
            status: 'Paid',
          });
        } else {
          newActivities.push({
            id: `ACT-AV-${Date.now()}-${order.id}`,
            text: `[AUTO] Payment failed for #${order.id} (Q-${order.queueNo}) — ${result.result}. Customer notified automatically.`,
            time: `Just now, ${stamp}`,
            type: 'payment',
            status: 'Alert',
          });
        }
      });

      if (newActivities.length > 0) {
        setActivities((prev) => [...newActivities, ...prev]);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [orders]);
  // ─────────────────────────────────────────────────────────────────────────────

  // Handle workflow updates inside orders lists
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, fullOrder?: Order) => {
    setOrders(prevOrders => {
      const exists = prevOrders.some(order => order.id === orderId);
      let baseOrders = [...prevOrders];
      if (!exists && fullOrder) {
        baseOrders.push(fullOrder);
      }

      const updated = baseOrders.map(order => {
        if (order.id === orderId) {
          // Merge fullOrder fields if provided (rejection, queue notes, etc.)
          if (fullOrder) {
            return {
              ...order,
              ...fullOrder,
              status: newStatus,
              paymentStatus: fullOrder.paymentStatus,
              timeline: fullOrder.timeline || order.timeline
            };
          }

          let paymentStatus = order.paymentStatus;
          const isConfirmedState = newStatus === 'Paid' || newStatus === 'Preparing' || newStatus === 'Ready For Pickup' || newStatus === 'Completed' || newStatus === 'Queue Called';
          if (isConfirmedState) {
            paymentStatus = 'Paid';
          }

          // Generate the branch-scoped queue number the moment payment is confirmed
          // (never before). Continues the per-branch running sequence: 001, 002, 003…
          let queueNo = order.queueNo;
          if (isConfirmedState && !queueNo) {
            const maxForBranch = baseOrders
              .filter(o => o.branch === order.branch && o.queueNo)
              .map(o => parseInt(o.queueNo, 10))
              .filter(n => !isNaN(n))
              .reduce((m, n) => Math.max(m, n), 0);
            queueNo = String(maxForBranch + 1).padStart(3, '0');
          }

          // Build a copy of timeline tracking
          const updatedTimeline = order.timeline.map(step => {
            if (step.status === newStatus) {
              return { ...step, active: true, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) };
            }
            return step;
          });

          // Handle Queue Called or explicit timeline additions
          if (newStatus === 'Queue Called') {
            updatedTimeline.push({
              status: 'Queue Called',
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              active: true
            });
          }

          return {
            ...order,
            status: newStatus,
            paymentStatus,
            queueNo,
            timeline: updatedTimeline
          };
        }
        return order;
      });
      return updated;
    });

    // Also push a live Alert Event to Activities logs so feeds immediately visualizes updates!
    const currentOrder = fullOrder || orders.find(o => o.id === orderId);
    if (currentOrder) {
      const stamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const qNum = currentOrder.queueNo || '';
      const branchName = currentOrder.branch;
      
      if (newStatus === 'Preparing') {
        const act1: Activity = {
          id: `ACT-PV-${Date.now()}-1`,
          text: `Payment confirmed for #${orderId}${qNum ? ` (Q-${qNum})` : ''} at ${branchName}`,
          time: `Just now, ${stamp}`,
          type: 'payment',
          status: 'Paid'
        };
        const act2: Activity = {
          id: `ACT-PV-${Date.now()}-2`,
          text: `Order #${orderId} moved to Preparing at ${branchName}`,
          time: `Just now, ${stamp}`,
          type: 'order',
          status: 'New'
        };
        const act3: Activity = {
          id: `ACT-PV-${Date.now()}-3`,
          text: `Q-${qNum} assigned for #${orderId} at ${branchName} — moved to Preparing`,
          time: `Just now, ${stamp}`,
          type: 'order',
          status: 'New'
        };
        setActivities(prev => [act1, act2, act3, ...prev]);
      } else if (currentOrder.paymentStatus === 'Failed' || newStatus === 'Cancelled' || newStatus === 'Auto Cancelled' || newStatus === 'Cancelled by Staff') {
        const act1: Activity = {
          id: `ACT-PV-${Date.now()}-r`,
          text: `Payment failed for #${orderId} at ${branchName} — customer notified.`,
          time: `Just now, ${stamp}`,
          type: 'payment',
          status: 'Alert'
        };
        setActivities(prev => [act1, ...prev]);
      } else if (newStatus === 'Queue Called') {
        const recalled = currentOrder.status === 'Queue Called';
        const act1: Activity = {
          id: `ACT-PV-${Date.now()}-qc`,
          text: recalled
            ? `Queue Q-${qNum} recalled at ${stamp} — #${orderId} at ${branchName}`
            : `Queue Q-${qNum} called at ${stamp} — #${orderId} at ${branchName}`,
          time: `Just now, ${stamp}`,
          type: 'order',
          status: 'Ready'
        };
        setActivities(prev => [act1, ...prev]);
      } else if (newStatus === 'Completed') {
        const act1: Activity = {
          id: `ACT-PV-${Date.now()}-cp`,
          text: `Order #${orderId}${qNum ? ` (Q-${qNum})` : ''} completed at ${branchName}`,
          time: `Just now, ${stamp}`,
          type: 'order',
          status: 'Sent'
        };
        setActivities(prev => [act1, ...prev]);
      } else {
        const newAct: Activity = {
          id: `ACT-PV-sh-${Date.now()}`,
          text: `${qNum ? `Q-${qNum} ` : ''}#${orderId} status → ${newStatus} at ${branchName}`,
          time: `Just now, ${stamp}`,
          type: newStatus === 'Paid' ? 'payment' : 'order',
          status: newStatus === 'Paid' ? 'Paid' : newStatus === 'Ready For Pickup' ? 'Ready' : 'New'
        };
        setActivities(prev => [newAct, ...prev]);
      }
    }
  };

  // ─── Cancel paid order with reason ──────────────────────────────────────────
  const cancelOrderWithReason = (
    orderId: string,
    reason: CancellationReason,
    note: string
  ) => {
    const stamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const cancelledBy = 'Siri Semsak';

    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      if (!o.queueNo || o.paymentStatus !== 'Paid') return o;
      const wasPaid = o.paymentStatus === 'Paid';
      const timeline = [...o.timeline];
      const cancelIdx = timeline.findIndex(t => t.status === 'Cancelled by Staff' || t.status === 'Cancelled');
      if (cancelIdx >= 0) {
        timeline[cancelIdx] = { status: 'Cancelled by Staff', time: stamp, active: true };
      } else {
        timeline.push({ status: 'Cancelled by Staff', time: stamp, active: true });
      }
      return {
        ...o,
        status: 'Cancelled by Staff' as OrderStatus,
        cancellationReason: reason,
        cancellationNote: note || undefined,
        cancelledBy,
        cancelledAt: stamp,
        originalOrderStatus: o.status,
        originalQueueNo: o.queueNo || undefined,
        refundStatus: wasPaid ? ('Refund Pending' as RefundStatus) : undefined,
        refundAmount: wasPaid ? o.amount : undefined,
        timeline,
      };
    }));

    const order = orders.find(o => o.id === orderId);
    if (!order?.queueNo || order.paymentStatus !== 'Paid') return;
    const branchName = order?.branch ?? '';
    const queueLabel = order?.queueNo ? `Q-${order.queueNo}` : 'No Queue';
    const act: Activity = {
      id: `ACT-CX-${Date.now()}`,
      text: `Order ${orderId} was cancelled by ${cancelledBy}. Reason: ${reason}. Queue: ${queueLabel}. Branch: ${branchName}. Time: ${stamp}`,
      time: stamp,
      type: 'order',
      status: 'Alert',
    };
    setActivities(prev => [act, ...prev]);
  };

  // ─── Update refund status ─────────────────────────────────────────────────
  const updateRefundStatus = (
    orderId: string,
    refundStatus: RefundStatus,
    refundNote: string
  ) => {
    const stamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, refundStatus, refundNote: refundNote || undefined } : o
    ));

    const order = orders.find(o => o.id === orderId);
    const amt = order?.refundAmount ?? order?.amount ?? 0;
    const act: Activity = {
      id: `ACT-RF-${Date.now()}`,
      text: refundStatus === 'Refund Completed'
        ? `Refund Completed for #${orderId} — Amount: ฿${amt}`
        : `Refund status updated to Pending for #${orderId}`,
      time: `Just now, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
      type: 'payment',
      status: refundStatus === 'Refund Completed' ? 'Paid' : 'Alert',
    };
    setActivities(prev => [act, ...prev]);

    if (refundStatus === 'Refund Completed') {
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, paymentStatus: 'Refunded' } : o
      ));
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  // Nav helper for quick dashboard buttons
  const handleDashboardNavigate = (targetTab: SidebarTab) => {
    setCurrentTab(targetTab);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentTab('Orders');
  };

  const handleStockRoundConfirm = (round: 'open' | 'close', branch: string) => {
    const branchName = branch as Branch;
    const managerByBranch: Record<Exclude<Branch, 'All Branches'>, string> = {
      'Central Plaza': 'central.manager',
      'Siam Square': 'siam.manager',
      'Mega Bangna': 'mega.manager',
      'The Mall Korat': 'korat.manager',
    };
    const stamp = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    setStockGateStatus(prev => prev?.branch === branch
      ? {
          ...prev,
          openingConfirmed: round === 'open' ? true : prev.openingConfirmed,
          closingConfirmed: round === 'close' ? true : prev.closingConfirmed,
        }
      : prev
    );

    const isOpen = round === 'open';
    setActivities(prev => [{
      id: `ACT-STOCK-${round.toUpperCase()}-${Date.now()}`,
      text: isOpen
        ? `Staff confirmed store opening for ${branch}.`
        : `Staff closed store for ${branch}.`,
      time: stamp,
      type: 'inventory',
      status: isOpen ? 'Ready' : 'Sent',
      username: roleMode === 'Staff' && branch in managerByBranch ? managerByBranch[branch as Exclude<Branch, 'All Branches'>] : 'admin',
      role: roleMode === 'Staff' ? 'Branch Manager' : 'Super Admin',
      assignedBranch: branchName,
      module: 'Daily Stock Check',
      relatedRecordId: `${branch}-${round}-${stamp}`,
      action: isOpen ? 'Staff confirmed store opening' : 'Staff closed store',
    }, ...prev]);
  };

  // Safe checks for rendering
  const activeBranch = roleMode === 'Staff' ? (staffAssignedBranch as Branch) : selectedBranch;
  const allowedTabs = roleMode === 'Staff' ? STAFF_ALLOWED_TABS : ADMIN_ALLOWED_TABS;

  useEffect(() => {
    if (!allowedTabs.includes(currentTab)) {
      setCurrentTab('Dashboard');
    }
  }, [allowedTabs, currentTab]);

  useEffect(() => {
    const route = `${window.location.pathname}${window.location.hash}`.toLowerCase();
    const removedRoutes = ['queue-pickup', 'pickup-system', 'queue-display-management', 'queue-monitor', 'system-settings', 'settings'];
    if (removedRoutes.some(removed => route.includes(removed))) {
      window.history.replaceState(null, '', '/');
      setCurrentTab('Dashboard');
    }
  }, []);

  if (window.location.pathname.toLowerCase().includes('queue-display')) {
    return <QueueDisplayScreen orders={orders} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-coffee-bg flex text-coffee font-sans">
      
      {/* Sidebar navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab}
        roleMode={roleMode} 
        setRoleMode={setRoleMode}
        staffAssignedBranch={staffAssignedBranch} 
        setStaffAssignedBranch={setStaffAssignedBranch}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main viewport area */}
      <div className="flex-1 lg:pl-68 flex flex-col min-w-0 transition-all duration-200">
        
        {/* Dynamic App header */}
        <Header 
          currentTab={currentTab}
          roleMode={roleMode}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          staffAssignedBranch={staffAssignedBranch}
          branchStatuses={headerBranchStatuses}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Selected Dashboard workspace tab screen */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'Dashboard' && (
            <DashboardView 
              orders={orders}
              activities={activities}
              coupons={coupons}
              ingredients={ingredients}
              members={members}
              staff={staff}
              promotions={promotions}
              setCoupons={setCoupons}
              setIngredients={setIngredients}
              setPromotions={setPromotions}
              setStaff={setStaff}
              setActivities={setActivities}
              updateOrderStatus={updateOrderStatus}
              selectedBranch={activeBranch}
              roleMode={roleMode}
              onSelectOrder={handleSelectOrder}
              onNavigateToTab={handleDashboardNavigate}
            />
          )}

          {currentTab === 'Orders' && (
            roleMode === 'Staff' && !staffOpeningGatePassed ? (
              <div className="p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 max-w-2xl shadow-xs">
                  <h3 className="font-black text-sm text-amber-900">Opening Stock Check Required</h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Staff must complete and confirm the opening stock check before accessing Order Management.
                    {stockGateStatus ? ` Checked ${stockGateStatus.openingChecked} / ${stockGateStatus.total} required items.` : ''}
                    {staffBranchMasterStatus !== 'Open' ? ` Current branch status: ${staffBranchMasterStatus}.` : ''}
                  </p>
                  {stockGateStatus && stockGateStatus.missingOpening.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 mb-2">Missing Items</p>
                      <div className="flex flex-wrap gap-1.5">
                        {stockGateStatus.missingOpening.map(name => (
                          <span key={name} className="px-2 py-1 rounded-md bg-white border border-amber-200 text-[10px] font-bold text-amber-800">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setCurrentTab('Stock Management')}
                    className="mt-4 px-4 py-2 bg-[#181d26] hover:bg-[#0d1218] text-white text-xs font-bold rounded-lg"
                  >
                    Go to Stock Check
                  </button>
                </div>
              </div>
            ) : (
              <OrdersView
                orders={orders}
                ingredients={ingredients}
                nowMin={nowMin}
                updateOrderStatus={updateOrderStatus}
                cancelOrderWithReason={cancelOrderWithReason}
                updateRefundStatus={updateRefundStatus}
                selectedBranch={selectedBranch}
                setSelectedBranch={setSelectedBranch}
                selectedOrderId={selectedOrderId}
                setSelectedOrderId={setSelectedOrderId}
                onNavigateToTab={handleDashboardNavigate}
                roleMode={roleMode}
                staffAssignedBranch={staffAssignedBranch}
              />
            )
          )}

          {currentTab === 'Payment Verification' && (
            <div key={`payment-${demoResetVersion}`} className="contents">
              <PaymentVerificationView 
                orders={orders}
                updateOrderStatus={updateOrderStatus}
                selectedOrderId={selectedOrderId}
                setSelectedOrderId={setSelectedOrderId}
                roleMode={roleMode}
              />
            </div>
          )}

          {currentTab === 'Stock Management' && (
            <div key={`stock-${demoResetVersion}`} className="contents">
              <StockManagementView 
                ingredients={ingredients}
                setIngredients={setIngredients}
                selectedBranch={selectedBranch}
                setSelectedBranch={setSelectedBranch}
                roleMode={roleMode}
                staffAssignedBranch={staffAssignedBranch}
                isLoading={inventoryLoading}
                error={inventoryError}
              onGateChange={setStockGateStatus}
              onRoundConfirm={handleStockRoundConfirm}
            />
            </div>
          )}

          {currentTab === 'Menu & Pricing' && (
            <MenuPricingView 
              menuItems={menuItems}
              setMenuItems={setMenuItems}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              roleMode={roleMode}
              staffAssignedBranch={staffAssignedBranch}
            />
          )}

          {currentTab === 'Coupons' && (
            <CouponsView 
              coupons={coupons}
              setCoupons={setCoupons}
            />
          )}

          {currentTab === 'Branch Pricing' && (
            <BranchPricingView 
              menuItems={menuItems}
              branchPrices={branchPrices}
              setBranchPrices={setBranchPrices}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              roleMode={roleMode}
              staffAssignedBranch={staffAssignedBranch}
            />
          )}

          {currentTab === 'Branches' && (
            <div key={`branches-${demoResetVersion}`} className="contents">
              <BranchManagementView
                orders={orders}
                roleMode={roleMode}
                staffAssignedBranch={staffAssignedBranch}
                branchStatuses={branchStatuses}
                setBranchStatuses={setBranchStatuses}
                setActivities={setActivities}
              />
            </div>
          )}

          {currentTab === 'Warehouse' && (
            <div key={`warehouse-${demoResetVersion}`} className="contents">
              <CentralWarehouseView
                roleMode={roleMode}
                staffAssignedBranch={staffAssignedBranch}
              />
            </div>
          )}

          {/* Fallback auxiliary screens container */}
          {!['Dashboard', 'Orders', 'Payment Verification', 'Stock Management', 'Menu & Pricing', 'Coupons', 'Branch Pricing', 'Branches', 'Warehouse'].includes(currentTab) && (
            <OtherViews 
              tab={currentTab}
              activities={activities}
              setActivities={setActivities}
              members={members}
              setMembers={setMembers}
              staff={staff}
              setStaff={setStaff}
              promotions={promotions}
              setPromotions={setPromotions}
              roleMode={roleMode}
              orders={orders}
            />
          )}
        </main>

      </div>
    </div>
  );
}
