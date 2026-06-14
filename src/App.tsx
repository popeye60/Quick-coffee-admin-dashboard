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
import StockManagementView from './components/StockManagementView';
import MenuPricingView from './components/MenuPricingView';
import CouponsView from './components/CouponsView';
import OtherViews from './components/OtherViews';
import BranchPricingView from './components/BranchPricingView';
import QueueDisplayView from './components/QueueDisplayView';
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
import { Order, OrderStatus, Ingredient, CoffeeItem, Coupon, Activity, Member, Staff, Promotion, Branch, BranchPrice, CancellationReason, RefundStatus } from './types';
import { verifySlip, applyVerificationResult } from './services/paymentService';

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

  // Core local states backed by Local Storage for persistent updates!
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<CoffeeItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [branchPrices, setBranchPrices] = useState<BranchPrice[]>([]);

  // Hydrate local states on load Mount
  useEffect(() => {
    // Orders
    const localOrd = localStorage.getItem('qc_orders');
    const localDemoOrd = localStorage.getItem('quick_coffee_demo_payment_orders_v2');
    let loadedOrders: Order[] = [];
    if (localOrd) {
      loadedOrders = JSON.parse(localOrd);
    } else {
      loadedOrders = [...INITIAL_ORDERS];
    }

    if (localDemoOrd) {
      try {
        const parsedDemo = JSON.parse(localDemoOrd);
        if (parsedDemo && Array.isArray(parsedDemo)) {
          parsedDemo.forEach((demoO: Order) => {
            const idx = loadedOrders.findIndex(o => o.id === demoO.id);
            if (idx >= 0) {
              loadedOrders[idx] = {
                ...loadedOrders[idx],
                status: demoO.status,
                paymentStatus: demoO.paymentStatus,
                timeline: demoO.timeline,
                queueNo: demoO.queueNo || loadedOrders[idx].queueNo,
                branch: demoO.branch || loadedOrders[idx].branch,
              };
            } else {
              loadedOrders.push(demoO);
            }
          });
        }
      } catch (err) {
        console.warn(err);
      }
    }

    setOrders(loadedOrders);
    localStorage.setItem('qc_orders', JSON.stringify(loadedOrders));

    // Ingredients
    const localIng = localStorage.getItem('qc_ingredients');
    if (localIng) {
      setIngredients(JSON.parse(localIng));
    } else {
      setIngredients(INITIAL_INGREDIENTS);
      localStorage.setItem('qc_ingredients', JSON.stringify(INITIAL_INGREDIENTS));
    }

    // MenuItems
    const localMenu = localStorage.getItem('qc_menu');
    if (localMenu) {
      setMenuItems(JSON.parse(localMenu));
    } else {
      setMenuItems(INITIAL_MENU_ITEMS);
      localStorage.setItem('qc_menu', JSON.stringify(INITIAL_MENU_ITEMS));
    }

    // Coupons
    const localCoupons = localStorage.getItem('qc_coupons');
    if (localCoupons) {
      setCoupons(JSON.parse(localCoupons));
    } else {
      setCoupons(INITIAL_COUPONS);
      localStorage.setItem('qc_coupons', JSON.stringify(INITIAL_COUPONS));
    }

    // Activities log
    const localAct = localStorage.getItem('qc_activities');
    if (localAct) {
      setActivities(JSON.parse(localAct));
    } else {
      setActivities(INITIAL_ACTIVITIES);
      localStorage.setItem('qc_activities', JSON.stringify(INITIAL_ACTIVITIES));
    }

    // CRM Members
    const localMem = localStorage.getItem('qc_members');
    if (localMem) {
      setMembers(JSON.parse(localMem));
    } else {
      setMembers(INITIAL_MEMBERS);
      localStorage.setItem('qc_members', JSON.stringify(INITIAL_MEMBERS));
    }

    // Workforce staff
    const localStaff = localStorage.getItem('qc_staff');
    if (localStaff) {
      setStaff(JSON.parse(localStaff));
    } else {
      setStaff(INITIAL_STAFF);
      localStorage.setItem('qc_staff', JSON.stringify(INITIAL_STAFF));
    }

    // Promos
    const localPromos = localStorage.getItem('qc_promotions');
    if (localPromos) {
      setPromotions(JSON.parse(localPromos));
    } else {
      setPromotions(INITIAL_PROMOTIONS);
      localStorage.setItem('qc_promotions', JSON.stringify(INITIAL_PROMOTIONS));
    }

    // Branch Prices
    const localBP = localStorage.getItem('qc_branch_prices');
    if (localBP) {
      setBranchPrices(JSON.parse(localBP));
    } else {
      setBranchPrices([]);
      localStorage.setItem('qc_branch_prices', JSON.stringify([]));
    }
  }, []);

  // Write-back updates to LocalStorage to sustain persistent edits
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('qc_orders', JSON.stringify(orders));
      
      // Multi-directional live synchronization with Payment Verification storage key
      const localDemoOrd = localStorage.getItem('quick_coffee_demo_payment_orders_v2');
      if (localDemoOrd) {
        try {
          const parsedDemo = JSON.parse(localDemoOrd) as Order[];
          if (parsedDemo && Array.isArray(parsedDemo)) {
            const updatedDemo = parsedDemo.map((demoO: Order) => {
              const matchedParent = orders.find(o => o.id === demoO.id);
              if (matchedParent) {
                return {
                  ...demoO,
                  status: matchedParent.status,
                  paymentStatus: matchedParent.paymentStatus,
                  timeline: matchedParent.timeline,
                  queueNo: matchedParent.queueNo || demoO.queueNo,
                  branch: matchedParent.branch || demoO.branch,
                };
              }
              return demoO;
            });
            localStorage.setItem('quick_coffee_demo_payment_orders_v2', JSON.stringify(updatedDemo));
          }
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }, [orders]);

  useEffect(() => {
    if (ingredients.length > 0) localStorage.setItem('qc_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    if (menuItems.length > 0) localStorage.setItem('qc_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    if (coupons.length > 0) localStorage.setItem('qc_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    if (activities.length > 0) localStorage.setItem('qc_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    if (members.length > 0) localStorage.setItem('qc_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    if (staff.length > 0) localStorage.setItem('qc_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    if (promotions.length > 0) localStorage.setItem('qc_promotions', JSON.stringify(promotions));
  }, [promotions]);

  useEffect(() => {
    localStorage.setItem('qc_branch_prices', JSON.stringify(branchPrices));
  }, [branchPrices]);

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
          if (newStatus === 'Paid' || newStatus === 'Preparing' || newStatus === 'Ready For Pickup' || newStatus === 'Completed' || newStatus === 'Queue Called') {
            paymentStatus = 'Paid';
          }

          // Build a copy of timeline tracking
          const updatedTimeline = order.timeline.map(step => {
            if (step.status === newStatus) {
              return { ...step, active: true, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) };
            }
            return step;
          });

          // Handle Queue Called or explicit timeline additions
          if (newStatus === 'Queue Called' && !updatedTimeline.some(t => t.status === 'Queue Called')) {
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
      } else if (currentOrder.paymentStatus === 'Failed' || newStatus === 'Cancelled') {
        const act1: Activity = {
          id: `ACT-PV-${Date.now()}-r`,
          text: `Payment failed for #${orderId} at ${branchName} — customer notified.`,
          time: `Just now, ${stamp}`,
          type: 'payment',
          status: 'Alert'
        };
        setActivities(prev => [act1, ...prev]);
      } else if (newStatus === 'Queue Called' || (newStatus === 'Ready For Pickup' && !currentOrder.timeline.some(t => t.status === 'Queue Called'))) {
        const act1: Activity = {
          id: `ACT-PV-${Date.now()}-qc`,
          text: `Q-${qNum} called for pickup — #${orderId} at ${branchName}`,
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
      const wasPaid = o.paymentStatus === 'Paid';
      const timeline = [...o.timeline];
      const cancelIdx = timeline.findIndex(t => t.status === 'Cancelled');
      if (cancelIdx >= 0) {
        timeline[cancelIdx] = { status: 'Cancelled', time: stamp, active: true };
      } else {
        timeline.push({ status: 'Cancelled', time: stamp, active: true });
      }
      return {
        ...o,
        status: 'Cancelled' as OrderStatus,
        cancellationReason: reason,
        cancellationNote: note || undefined,
        cancelledBy,
        cancelledAt: stamp,
        refundStatus: wasPaid ? ('Refund Pending' as RefundStatus) : undefined,
        refundAmount: wasPaid ? o.amount : undefined,
        timeline,
      };
    }));

    const order = orders.find(o => o.id === orderId);
    const branchName = order?.branch ?? '';
    const act: Activity = {
      id: `ACT-CX-${Date.now()}`,
      text: `Order #${orderId} cancelled at ${branchName} — Reason: ${reason}`,
      time: `Just now, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
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

  // Safe checks for rendering
  const activeBranch = roleMode === 'Staff' ? (staffAssignedBranch as Branch) : selectedBranch;

  return (
    <div className="min-h-screen bg-coffee-bg flex text-coffee font-sans">
      
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
            <OrdersView
              orders={orders}
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
          )}

          {currentTab === 'Payment Verification' && (
            <PaymentVerificationView 
              orders={orders}
              updateOrderStatus={updateOrderStatus}
              selectedOrderId={selectedOrderId}
              setSelectedOrderId={setSelectedOrderId}
              roleMode={roleMode}
            />
          )}

          {currentTab === 'Stock Management' && (
            <StockManagementView 
              ingredients={ingredients}
              setIngredients={setIngredients}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              roleMode={roleMode}
              staffAssignedBranch={staffAssignedBranch}
            />
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

          {currentTab === 'Queue Display' && (
            <QueueDisplayView 
              orders={orders}
              updateOrderStatus={updateOrderStatus}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              roleMode={roleMode}
              staffAssignedBranch={staffAssignedBranch}
            />
          )}

          {/* Fallback auxiliary screens container */}
          {!['Dashboard', 'Orders', 'Payment Verification', 'Stock Management', 'Menu & Pricing', 'Coupons', 'Branch Pricing', 'Queue Display'].includes(currentTab) && (
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
