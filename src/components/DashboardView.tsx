/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, Activity, Coupon, Ingredient, Member, Staff, Promotion, Branch, OrderStatus } from '../types';
import {
  ShoppingBag,
  DollarSign,
  Loader2,
  Coffee,
  Sparkles,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ChevronRight,
  Zap,
  Ticket,
  Store,
  Package,
  CheckSquare,
  AlertTriangle,
  Briefcase,
  History,
  FileSpreadsheet,
  Download,
  Plus,
  X,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface DashboardViewProps {
  orders: Order[];
  activities: Activity[];
  coupons: Coupon[];
  ingredients: Ingredient[];
  members: Member[];
  staff: Staff[];
  promotions: Promotion[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  selectedBranch: string;
  roleMode: 'Admin' | 'Staff';
  onSelectOrder: (orderId: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export default function DashboardView({
  orders,
  activities,
  coupons,
  ingredients,
  members,
  staff,
  promotions,
  setCoupons,
  setIngredients,
  setPromotions,
  setStaff,
  setActivities,
  updateOrderStatus,
  selectedBranch,
  roleMode,
  onSelectOrder,
  onNavigateToTab
}: DashboardViewProps) {
  const { language, t, formatCurrency } = useLanguage();

  // Modal open states
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // Sales Analytics panel controls
  const [salesTimeframe, setSalesTimeframe] = useState<'Daily' | 'Monthly' | 'Yearly'>('Daily');
  const [salesBranch, setSalesBranch] = useState<string>(selectedBranch);
  const [salesHoverIdx, setSalesHoverIdx] = useState<number | null>(null);

  // Modal form states
  const [promoForm, setPromoForm] = useState({ title: '', subtitle: '', targetBranch: 'Central Plaza' as Branch });
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'fixed' as 'fixed' | 'percentage', discountValue: 50, limitGlobal: 100 });
  const [staffForm, setStaffForm] = useState({ name: '', role: 'Barista' as 'Super Admin' | 'Branch Manager' | 'Barista', branch: 'Central Plaza' as Branch, email: '' });

  // Filter orders according to branch filter
  const branchFilteredOrders = selectedBranch === 'All Branches'
    ? orders
    : orders.filter(o => o.branch === selectedBranch);

  // Dynamic stat calculators (KPI Cards validation)
  const totalOrdersCount = branchFilteredOrders.length;
  
  const revenueTotal = branchFilteredOrders
    .filter(o => o.status !== 'Cancelled' && o.status !== 'Pending Payment')
    .reduce((sum, o) => sum + o.amount, 0);

  const pendingCount = branchFilteredOrders.filter(o => o.status === 'Pending Payment').length;
  const preparingCount = branchFilteredOrders.filter(o => o.status === 'Preparing').length;
  const readyCount = branchFilteredOrders.filter(o => o.status === 'Ready For Pickup').length;
  const completedCount = branchFilteredOrders.filter(o => o.status === 'Completed').length;

  const lowStockCount = ingredients
    .filter(i => (selectedBranch === 'All Branches' ? true : i.branch === selectedBranch))
    .filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock')
    .length;

  const activeCouponsCount = coupons.filter(c => c.status === 'Active').length;
  const totalMembersCount = members.length;
  const totalBranchesCount = 4; // Central Plaza, Siam Square, Mega Bangna, The Mall Korat
  const staffOnlineCount = staff
    .filter(s => (selectedBranch === 'All Branches' ? true : s.branch === selectedBranch))
    .filter(s => s.status === 'Active')
    .length;

  // New Live Dynamic Backlog calculations
  const pendingVerificationOrders = orders.filter(o => o.status === 'Pending Payment');
  
  // Backlog size filtered by branch
  const branchPendingVerificationOrders = selectedBranch === 'All Branches'
    ? pendingVerificationOrders
    : pendingVerificationOrders.filter(o => o.branch === selectedBranch);

  const totalPendingBacklog = branchPendingVerificationOrders.length;

  // Today's count vs Carry Over count
  let todayPendingCount = 0;
  let carryOverPendingCount = 0;
  branchPendingVerificationOrders.forEach(o => {
    const isToday = o.orderTime.includes('13 Jun 2026') || o.orderTime.includes('Today');
    if (isToday) {
      todayPendingCount++;
    } else {
      carryOverPendingCount++;
    }
  });

  // Calculate oldest waiting time in minutes from simulated times
  let oldestWaitMinutes = 0;
  const todayPendings = branchPendingVerificationOrders.filter(o => o.orderTime.includes('13 Jun 2026') || o.orderTime.includes('Today'));
  if (todayPendings.length > 0) {
    const times = todayPendings.map(o => {
      const match = o.time.match(/(\d+):(\d+)/);
      if (match) {
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
      return 900; // 15:00
    });
    const minTime = Math.min(...times);
    const currentTimeMinutes = 905; // Simulate 15:05
    const diff = currentTimeMinutes - minTime;
    oldestWaitMinutes = diff > 0 ? diff : 18; // default to 18 min
  } else if (branchPendingVerificationOrders.length > 0) {
    oldestWaitMinutes = 45; // default fallback if only carry-over found
  }

  // Branch breakdown counts
  const pendingByBranch = {
    'Central Plaza': pendingVerificationOrders.filter(o => o.branch === 'Central Plaza').length,
    'Siam Square': pendingVerificationOrders.filter(o => o.branch === 'Siam Square').length,
    'Mega Bangna': pendingVerificationOrders.filter(o => o.branch === 'Mega Bangna').length,
    'The Mall Korat': pendingVerificationOrders.filter(o => o.branch === 'The Mall Korat').length,
  };

  const pendingPaymentVerificationCount = totalPendingBacklog;

  // Cancellation & refund metrics
  const cancelledCount = branchFilteredOrders.filter(o => o.status === 'Cancelled').length;
  const refundPendingCount = branchFilteredOrders.filter(o => o.refundStatus === 'Refund Pending').length;
  const refundCompletedCount = branchFilteredOrders.filter(o => o.refundStatus === 'Refund Completed').length;

  // Auto-verification metrics
  const autoApprovedCount = branchFilteredOrders.filter(o => o.verificationStatus === 'auto_approved').length;
  const failedPaymentCount = branchFilteredOrders.filter(o => o.paymentStatus === 'Failed').length;
  const totalVerified = autoApprovedCount + failedPaymentCount;
  const verificationSuccessRate = totalVerified > 0 ? Math.round((autoApprovedCount / totalVerified) * 100) : 0;
  const manualReviewCount = failedPaymentCount;

  // KPI Cards row containing exactly 6 cards
  const kpiCards = [
    {
      id: 'stat-revenue',
      title: language === 'TH' ? 'รายได้วันนี้' : 'Revenue Today',
      value: formatCurrency(revenueTotal),
      change: '+24.6%',
      isPositive: true,
      subtitle: language === 'TH' ? 'เทียบกับเมื่อวาน' : 'vs yesterday',
      icon: <DollarSign size={18} className="text-emerald-700" />,
      bgColor: 'bg-emerald-50/40 border-emerald-100'
    },
    {
      id: 'stat-orders',
      title: language === 'TH' ? 'คำสั่งซื้อวันนี้' : 'Orders Today',
      value: totalOrdersCount,
      change: '+18.2%',
      isPositive: true,
      subtitle: language === 'TH' ? 'เทียบกับเมื่อวาน' : 'vs yesterday',
      icon: <ShoppingBag size={18} className="text-[#8B6B4F]" />,
      bgColor: 'bg-[#FDF1E6]/40 border-amber-100'
    },
    {
      id: 'stat-pending-slip',
      title: language === 'TH' ? 'รอตรวจสอบสลิป' : 'Pending Slip Review',
      value: pendingPaymentVerificationCount,
      status: pendingPaymentVerificationCount > 0 ? (language === 'TH' ? 'รอดำเนินการ' : 'Awaiting action') : (language === 'TH' ? 'เคลียร์' : 'All clear'),
      isAlert: pendingPaymentVerificationCount > 0,
      icon: <AlertTriangle size={18} className={pendingPaymentVerificationCount > 0 ? 'text-amber-500' : 'text-zinc-400'} />,
      bgColor: pendingPaymentVerificationCount > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50 border-stone-200'
    },
    {
      id: 'stat-preparing',
      title: language === 'TH' ? 'กำลังเตรียมเครื่องดื่ม' : 'Preparing Orders',
      value: preparingCount,
      change: '+16.7%',
      isPositive: true,
      subtitle: language === 'TH' ? 'เทียบกับเมื่อวาน' : 'vs yesterday',
      icon: <Coffee size={18} className="text-blue-500" />,
      bgColor: 'bg-blue-50/30 border-blue-100'
    },
    {
      id: 'stat-ready',
      title: language === 'TH' ? 'พร้อมสำหรับรับบริการ' : 'Ready For Pickup',
      value: readyCount,
      change: '+11.3%',
      isPositive: true,
      subtitle: language === 'TH' ? 'เทียบกับเมื่อวาน' : 'vs yesterday',
      icon: <CheckCircle size={18} className="text-green-600" />,
      bgColor: 'bg-green-50/30 border-green-100'
    },
    {
      id: 'stat-low-stock',
      title: language === 'TH' ? 'วัตถุดิบใกล้วิกฤต' : 'Critical Stock Alerts',
      value: lowStockCount,
      status: lowStockCount > 0 ? (language === 'TH' ? 'ใกล้หมด!' : 'Low items!') : (language === 'TH' ? 'คลังสมบูรณ์' : 'Full supply'),
      isAlert: lowStockCount > 0,
      icon: <AlertTriangle size={18} className={lowStockCount > 0 ? 'text-orange-500' : 'text-zinc-400'} />,
      bgColor: lowStockCount > 0 ? 'bg-orange-50/40 border-orange-200' : 'bg-stone-50 border-stone-200'
    },
    {
      id: 'stat-cancelled',
      title: language === 'TH' ? 'ยกเลิกวันนี้' : 'Cancelled Today',
      value: cancelledCount,
      status: cancelledCount > 0 ? (language === 'TH' ? 'ตรวจสอบ' : 'Review') : (language === 'TH' ? 'ไม่มี' : 'None'),
      isAlert: cancelledCount > 0,
      icon: <X size={18} className={cancelledCount > 0 ? 'text-red-500' : 'text-zinc-400'} />,
      bgColor: cancelledCount > 0 ? 'bg-red-50/40 border-red-200' : 'bg-stone-50 border-stone-200'
    },
    {
      id: 'stat-refund-pending',
      title: language === 'TH' ? 'รอคืนเงิน' : 'Refund Pending',
      value: refundPendingCount,
      status: refundPendingCount > 0 ? (language === 'TH' ? 'ค้างอยู่' : 'Outstanding') : (language === 'TH' ? 'เคลียร์' : 'Clear'),
      isAlert: refundPendingCount > 0,
      icon: <AlertTriangle size={18} className={refundPendingCount > 0 ? 'text-amber-500' : 'text-zinc-400'} />,
      bgColor: refundPendingCount > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50 border-stone-200'
    },
  ];

  // Excel (CSV) Report Download Logic (Satisfying real reports/action workflows)
  const handleExportCSV = () => {
    const headers = [
      'Order ID', 'Queue No', 'Customer Name', 'Customer Phone', 'Branch',
      'Status', 'Amount (THB)', 'Payment Status', 'Payment Method', 'Order Time'
    ];
    const rows = branchFilteredOrders.map(ord => [
      ord.id,
      ord.queueNo,
      `"${ord.customerName.replace(/"/g, '""')}"`,
      ord.customerPhone,
      `"${ord.branch}"`,
      ord.status,
      ord.amount,
      ord.paymentStatus,
      ord.paymentMethod,
      `"${ord.orderTime}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quick_coffee_sales_report_${selectedBranch.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Add activity log of Excel Export action
    const newAct: Activity = {
      id: `ACT-${Date.now()}`,
      text: `Admin exported Excel sales ledger for branch [${selectedBranch}]`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
      type: 'order',
      status: 'Paid'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Restock handler for low stock widget
  const handleQuickRestock = (ingId: string, ingName: string) => {
    setIngredients(prev => prev.map(item => {
      if (item.id === ingId) {
        return { ...item, status: 'In Stock' as const, stockLevel: 100 };
      }
      return item;
    }));

    // Log the restock action
    const newAct: Activity = {
      id: `ACT-${Date.now()}`,
      text: `Restocked ingredient ${ingName} to 100% (In Stock)`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
      type: 'stock',
      status: 'Paid'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Toggle Coupon active/inactive
  const handleToggleCoupon = (code: string, currentStatus: string) => {
    setCoupons(prev => prev.map(c => {
      if (c.code === code) {
        return { ...c, status: currentStatus === 'Active' ? 'Inactive' as const : 'Active' as const };
      }
      return c;
    }));

    const newAct: Activity = {
      id: `ACT-${Date.now()}`,
      text: `Coupon ${code} state altered to ${currentStatus === 'Active' ? 'Inactive' : 'Active'}`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
      type: 'coupon',
      status: 'Sent'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Toggle Promotion active/inactive
  const handleTogglePromotion = (id: string, currentStatus: string) => {
    setPromotions(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: currentStatus === 'Active' ? 'Inactive' as const : 'Active' as const };
      }
      return p;
    }));
  };

  // Form submit handlers
  const handleCreatePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.title || !promoForm.subtitle) return;

    const newPromo: Promotion = {
      id: `PROMO-${Date.now().toString().slice(-4)}`,
      title: promoForm.title,
      subtitle: promoForm.subtitle,
      status: 'Active',
      startDate: new Date().toLocaleDateString('en-GB'),
      endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString('en-GB'),
      clicks: 0,
      targetBranch: promoForm.targetBranch
    };

    setPromotions(prev => [newPromo, ...prev]);
    setIsPromoModalOpen(false);
    setPromoForm({ title: '', subtitle: '', targetBranch: 'Central Plaza' });

    // Append Audit activity
    const newAct: Activity = {
      id: `ACT-${Date.now()}`,
      text: `Super Admin broadcasted new promotional campaign: "${newPromo.title}"`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
      type: 'coupon',
      status: 'Sent'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code) return;

    const newCoupon: Coupon = {
      code: couponForm.code.toUpperCase(),
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
      limitGlobal: Number(couponForm.limitGlobal),
      limitPerUser: 1,
      limitDaily: 25,
      usageCount: 0,
      status: 'Active'
    };

    setCoupons(prev => [newCoupon, ...prev]);
    setIsCouponModalOpen(false);
    setCouponForm({ code: '', discountType: 'fixed', discountValue: 50, limitGlobal: 100 });

    const newAct: Activity = {
      id: `ACT-${Date.now()}`,
      text: `Created new global coupon campaign: [${newCoupon.code}]`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
      type: 'coupon',
      status: 'Sent'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email) return;

    const newStaff: Staff = {
      id: `STF-${Date.now().toString().slice(-3)}`,
      name: staffForm.name,
      role: staffForm.role,
      branch: staffForm.branch,
      email: staffForm.email,
      status: 'Active'
    };

    setStaff(prev => [newStaff, ...prev]);
    setIsStaffModalOpen(false);
    setStaffForm({ name: '', role: 'Barista', branch: 'Central Plaza', email: '' });

    const newAct: Activity = {
      id: `ACT-${Date.now()}`,
      text: `Super Admin authorized new staff catalog entry: ${newStaff.name} (${newStaff.role})`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
      type: 'member',
      status: 'New'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Branch statistics distribution
  const branchesList = ['Central Plaza', 'Siam Square', 'Mega Bangna', 'The Mall Korat'];
  const branchCounts = branchesList.map(name => {
    const count = orders.filter(o => o.branch === name).length;
    return { name, count };
  });
  const totalAllBranches = orders.length || 1;

  // ── Sales Analytics dataset (deterministic mock series per branch / timeframe) ─
  // Daily baseline revenue per branch — All Branches sums the four.
  const BRANCH_DAILY_BASE: Record<string, number> = {
    'Central Plaza': 1300,
    'Siam Square': 980,
    'Mega Bangna': 1500,
    'The Mall Korat': 760,
  };
  const dailyBaseFor = (branch: string) =>
    branch === 'All Branches'
      ? Object.values(BRANCH_DAILY_BASE).reduce((a, b) => a + b, 0)
      : (BRANCH_DAILY_BASE[branch] ?? 1000);

  // Deterministic +/- wobble so the chart looks organic without being random per render
  const wobble = (seed: number, spread: number) =>
    1 + (Math.sin(seed * 1.7) * 0.5 + Math.cos(seed * 0.9) * 0.5) * spread;

  // Thai month names (app simulated "today" = 25 May 2026)
  const TH_MONTH_ABBR = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const TH_MONTH_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const EN_MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const EN_MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const REF_DATE = new Date(2026, 4, 25); // app's simulated current date

  interface AnalyticsPoint { label: string; fullLabel: string; revenue: number; orders: number; }
  interface AnalyticsSummary { revenue: number; orders: number; avgValue: number; }

  // Real "today" totals for a branch — SAME formula the Top KPIs use, so Daily analytics matches them.
  const computeDayTotals = (branch: string) => {
    const scoped = branch === 'All Branches' ? orders : orders.filter(o => o.branch === branch);
    const revenue = scoped
      .filter(o => o.status !== 'Cancelled' && o.status !== 'Pending Payment')
      .reduce((s, o) => s + o.amount, 0);
    return { revenue, orders: scoped.length };
  };

  const sumSummary = (pts: AnalyticsPoint[]): AnalyticsSummary => {
    const revenue = pts.reduce((a, b) => a + b.revenue, 0);
    const orders = pts.reduce((a, b) => a + b.orders, 0);
    return { revenue, orders, avgValue: orders > 0 ? Math.round(revenue / orders) : 0 };
  };

  const getSalesAnalytics = (timeframe: 'Daily' | 'Monthly' | 'Yearly', branch: string) => {
    const todayTotals = computeDayTotals(branch);
    // Per-day revenue baseline for synthetic history (fallback when a branch has no live orders)
    const dayRevenue = todayTotals.revenue > 0 ? todayTotals.revenue : (BRANCH_DAILY_BASE[branch] ?? dailyBaseFor(branch));
    const aov = todayTotals.orders > 0 ? todayTotals.revenue / todayTotals.orders : 96;
    const ordersFromRev = (rev: number) => Math.max(1, Math.round(rev / aov));
    const points: AnalyticsPoint[] = [];
    let summary: AnalyticsSummary;

    if (timeframe === 'Daily') {
      // Last 7 days ending today; the latest point IS today's real total.
      for (let d = 6; d >= 0; d--) {
        const date = new Date(REF_DATE);
        date.setDate(REF_DATE.getDate() - d);
        const i = 6 - d;
        const isToday = d === 0;
        const day = date.getDate();
        const m = date.getMonth();
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const revenue = isToday ? todayTotals.revenue : Math.round(dayRevenue * wobble(i + 1, 0.28) * (isWeekend ? 1.2 : 1));
        const ordersAtPoint = isToday ? todayTotals.orders : ordersFromRev(revenue);
        points.push({
          label: language === 'TH' ? `${day} ${TH_MONTH_ABBR[m]}` : `${day} ${EN_MONTH_ABBR[m]}`,
          fullLabel: language === 'TH'
            ? `${day} ${TH_MONTH_FULL[m]} ${date.getFullYear() + 543}`
            : `${day} ${EN_MONTH_FULL[m]} ${date.getFullYear()}`,
          revenue,
          orders: ordersAtPoint,
        });
      }
      // Daily KPI summary = TODAY only (the latest point), matching the Top KPIs.
      const last = points[points.length - 1];
      summary = { revenue: last.revenue, orders: last.orders, avgValue: last.orders > 0 ? Math.round(last.revenue / last.orders) : 0 };
    } else if (timeframe === 'Monthly') {
      // Trend WITHIN the current month (per week); KPI summary = month accumulation.
      const m = REF_DATE.getMonth();
      const weeks = 4;
      const weekBase = (dayRevenue * 30) / weeks;
      for (let w = 0; w < weeks; w++) {
        const revenue = Math.round(weekBase * wobble(w + 2, 0.18));
        points.push({
          label: language === 'TH' ? `สัปดาห์ ${w + 1}` : `Week ${w + 1}`,
          fullLabel: language === 'TH'
            ? `สัปดาห์ที่ ${w + 1} · ${TH_MONTH_FULL[m]} ${REF_DATE.getFullYear() + 543}`
            : `Week ${w + 1} · ${EN_MONTH_FULL[m]} ${REF_DATE.getFullYear()}`,
          revenue,
          orders: ordersFromRev(revenue),
        });
      }
      summary = sumSummary(points);
    } else {
      // Trend by month WITHIN the current year; KPI summary = year accumulation.
      const monthBase = dayRevenue * 30;
      for (let mo = 0; mo < 12; mo++) {
        const revenue = Math.round(monthBase * wobble(mo + 2, 0.18) * (1 + mo * 0.012));
        points.push({
          label: language === 'TH' ? TH_MONTH_ABBR[mo] : EN_MONTH_ABBR[mo],
          fullLabel: language === 'TH'
            ? `${TH_MONTH_FULL[mo]} ${REF_DATE.getFullYear() + 543}`
            : `${EN_MONTH_FULL[mo]} ${REF_DATE.getFullYear()}`,
          revenue,
          orders: ordersFromRev(revenue),
        });
      }
      summary = sumSummary(points);
    }

    return { points, summary };
  };

  // Staff are locked to their assigned branch (selectedBranch is already the staff branch);
  // Admin can freely pick the analytics branch.
  const effectiveSalesBranch = roleMode === 'Staff' ? selectedBranch : salesBranch;
  const analytics = getSalesAnalytics(salesTimeframe, effectiveSalesBranch);
  // Period qualifier shown on the analytics KPI cards
  const periodQualifier = salesTimeframe === 'Daily'
    ? (language === 'TH' ? 'วันนี้' : 'today')
    : salesTimeframe === 'Monthly'
      ? (language === 'TH' ? 'เดือนนี้' : 'this month')
      : (language === 'TH' ? 'ปีนี้' : 'this year');
  // Period-over-period deltas (latest point vs the one before it) for the KPI cards
  const pctChange = (cur: number, prev: number) => prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0;
  const _aPts = analytics.points;
  const _aLast = _aPts[_aPts.length - 1];
  const _aPrev = _aPts[_aPts.length - 2] ?? _aLast;
  const revenueDelta = pctChange(_aLast.revenue, _aPrev.revenue);
  const ordersDelta = pctChange(_aLast.orders, _aPrev.orders);
  const aovDelta = pctChange(
    _aLast.orders > 0 ? _aLast.revenue / _aLast.orders : 0,
    _aPrev.orders > 0 ? _aPrev.revenue / _aPrev.orders : 0,
  );
  const revenueMax = Math.max(...analytics.points.map(p => p.revenue), 1);
  // Build a "nice" revenue axis (rounded ceiling + evenly-spaced ticks)
  const niceAxis = (maxVal: number, divs = 4) => {
    const rough = maxVal / divs;
    const pow = Math.pow(10, Math.floor(Math.log10(rough || 1)));
    const step = [1, 2, 2.5, 5, 10].map(c => c * pow).find(c => c >= rough) ?? pow * 10;
    const max = Math.ceil(maxVal / step) * step;
    const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
    return { max, ticks };
  };
  const revAxis = niceAxis(revenueMax);
  const axisMax = revAxis.max;
  const yTicks = revAxis.ticks;
  const fmtAxis = (v: number) => v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`;
  // No default tooltip — only shows on hover (salesHoverIdx is null until the user hovers)

  // Compact inventory summary (top 3 lowest-stock items)
  const inventoryAlertItems = ingredients
    .filter(i => (selectedBranch === 'All Branches' ? true : i.branch === selectedBranch) &&
      (i.status === 'Low Stock' || i.status === 'Out of Stock'))
    .sort((a, b) => a.stockLevel - b.stockLevel);
  const topLowStock = inventoryAlertItems.slice(0, 3);

  // Compact campaign summary
  const activePromotionsCount = promotions.filter(p => p.status === 'Active').length;

  // Per-branch coupon redemption split (coupons are global; derive a deterministic branch share)
  const BRANCH_COUPON_WEIGHT: Record<string, number> = {
    'Central Plaza': 0.32, 'Siam Square': 0.26, 'Mega Bangna': 0.28, 'The Mall Korat': 0.14,
  };
  const branchCouponUsage = (usage: number, branch: string) =>
    branch === 'All Branches' ? usage : Math.round(usage * (BRANCH_COUPON_WEIGHT[branch] ?? 0.25));

  // ── KPI card renderer helper ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderKpiCard = (card: any) => (
    <div
      id={`dashboard-card-${card.id}`}
      className={`p-3.5 rounded-xl border ${card.bgColor} bg-white flex flex-col justify-between shadow-xs hover:border-[#8B6B4F] hover:shadow-sm transition-all duration-200`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-sans text-[10px] font-bold text-coffee-muted tracking-tight text-ellipsis overflow-hidden whitespace-nowrap block" title={card.title}>
          {card.title}
        </span>
        <div id={`icon-${card.id}`} className="p-1 rounded bg-[#FDF1E6]/30 border border-coffee-border/30 shrink-0">
          {card.icon}
        </div>
      </div>
      <div className="mt-2.5">
        <h3 className="font-sans font-black text-lg text-coffee tracking-tight">{card.value}</h3>
        <span className="text-[9.5px] font-mono leading-none block text-zinc-400 mt-0.5">
          {card.status ? (
            <span className={card.isAlert ? 'text-red-500 font-bold' : 'text-[#8B6B4F] font-bold'}>{card.status}</span>
          ) : (
            <span className="flex items-center gap-0.5">
              <span className={card.isPositive ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>{card.change}</span>
              <span>{card.subtitle}</span>
            </span>
          )}
        </span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">

      {/* ── PRIMARY KPIs (4 cards) — always TODAY's real-time operational data, unaffected by the analytics filters ── */}
      <div className="space-y-1.5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4 className="font-sans font-bold text-[10px] text-[#8B6B4F] uppercase tracking-wider">
            {language === 'TH' ? 'ดัชนีชี้วัดหลัก — วันนี้' : 'Primary KPIs — Today'}
          </h4>
          <span className="text-[9px] font-mono text-zinc-400">
            {language === 'TH' ? 'ข้อมูลการดำเนินงานวันนี้ (เรียลไทม์)' : 'Real-time daily operations'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {(['stat-revenue', 'stat-orders', 'stat-pending-slip', 'stat-cancelled'] as const)
            .map(id => kpiCards.find(c => c.id === id))
            .filter(Boolean)
            .map(card => <React.Fragment key={card!.id}>{renderKpiCard(card!)}</React.Fragment>)}
        </div>
      </div>

      {/* Operational Status moved to the Orders page — Dashboard is an executive summary */}

      {/* ── SALES ANALYTICS ── */}
      <div className="p-5 bg-white border border-coffee-border rounded-2xl shadow-xs space-y-5">
        {/* Header + filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-700 shrink-0" />
            <div>
              <h3 className="font-sans font-bold text-sm text-coffee">
                {language === 'TH' ? 'วิเคราะห์ยอดขายตามช่วงเวลา' : 'Sales Analytics by Period'}
              </h3>
              <p className="font-sans text-xs text-coffee-muted">
                {language === 'TH' ? 'ข้อมูลสรุปตามช่วงเวลาที่เลือกและสาขาที่เลือก' : 'Summary for the selected period and branch'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time filter segmented control */}
            <div className="inline-flex bg-stone-100 rounded-lg p-0.5">
              {(['Daily', 'Monthly', 'Yearly'] as const).map(tf => (
                <button
                  key={tf}
                  id={`sales-tf-${tf.toLowerCase()}`}
                  onClick={() => setSalesTimeframe(tf)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    salesTimeframe === tf ? 'bg-white text-coffee shadow-xs' : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {language === 'TH'
                    ? (tf === 'Daily' ? 'รายวัน' : tf === 'Monthly' ? 'รายเดือน' : 'รายปี')
                    : tf}
                </button>
              ))}
            </div>

            {/* Branch filter — Admin can switch; Staff sees their assigned branch read-only */}
            {roleMode === 'Admin' ? (
              <select
                id="sales-branch-filter"
                value={salesBranch}
                onChange={e => setSalesBranch(e.target.value)}
                className="text-[11px] font-semibold py-1.5 px-2.5 bg-stone-50 border border-coffee-border rounded-lg text-zinc-600 focus:outline-none focus:border-[#8B6B4F] cursor-pointer"
              >
                <option value="All Branches">{language === 'TH' ? 'ทุกสาขา' : 'All Branches'}</option>
                <option value="Central Plaza">Central Plaza</option>
                <option value="Siam Square">Siam Square</option>
                <option value="Mega Bangna">Mega Bangna</option>
                <option value="The Mall Korat">The Mall Korat</option>
              </select>
            ) : (
              <span className="text-[11px] font-semibold py-1.5 px-2.5 bg-stone-100 border border-coffee-border rounded-lg text-zinc-600 flex items-center gap-1.5">
                🔒 {language === 'TH' ? 'สาขา:' : 'Branch:'} {effectiveSalesBranch}
              </span>
            )}
          </div>
        </div>

        {/* 2-column: chart (70%) left on desktop | KPIs (30%) right; KPIs move to top on mobile.
            No items-start → both columns stretch to equal height (chart = KPI stack). */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">

          {/* CHART (70%) — revenue-only modern bar chart (compact height) */}
          <div className="lg:col-span-7 order-2 lg:order-1 flex flex-col rounded-2xl bg-[#F8F6F2] border border-[#EADBC8] p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9.5px] uppercase font-mono font-bold text-[#A67C52]">
                {language === 'TH' ? 'แนวโน้มรายได้' : 'Revenue Trend'}
              </span>
              <span className="text-[9.5px] font-mono text-[#A67C52]/70">
                {effectiveSalesBranch === 'All Branches' ? (language === 'TH' ? 'ทุกสาขา' : 'All Branches') : effectiveSalesBranch}
              </span>
            </div>

            {(() => {
              const W = 720, H = 248, padL = 52, padR = 20, padT = 14, padB = 28;
              const x0 = padL, x1 = W - padR, y0 = padT, y1 = H - padB;
              const plotW = x1 - x0, plotH = y1 - y0;
              const pts = analytics.points;
              const n = pts.length;
              const band = plotW / n;
              const barW = Math.min(band * 0.42, 38); // narrower bars → more breathing room
              const cx = (i: number) => x0 + band * (i + 0.5);
              const revY = (v: number) => y1 - (v / axisMax) * plotH;
              const lastIdx = n - 1;
              const hovered = salesHoverIdx; // null until hover → no default tooltip

              // Rounded-TOP-only bar path
              const barPath = (x: number, y: number, w: number, h: number, r: number) => {
                const rr = Math.min(r, w / 2, h);
                return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
              };

              // Tooltip geometry (only when hovering)
              let tip = null as null | { tx: number; ty: number; tp: typeof pts[0] };
              const TIPW = 158, TIPH = 70;
              if (hovered !== null && pts[hovered]) {
                const tp = pts[hovered];
                let tx = cx(hovered) - TIPW / 2;
                tx = Math.max(x0, Math.min(tx, x1 - TIPW));
                let ty = revY(tp.revenue) - TIPH - 12;
                if (ty < y0) ty = y0 + 4;
                tip = { tx, ty, tp };
              }

              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D9B38C" />
                      <stop offset="100%" stopColor="#A67C52" />
                    </linearGradient>
                    <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A67C52" />
                      <stop offset="100%" stopColor="#8B5E3C" />
                    </linearGradient>
                  </defs>

                  {/* Gridlines — muted ~50% */}
                  {yTicks.map(v => (
                    <line key={`grid-${v}`} x1={x0} y1={revY(v)} x2={x1} y2={revY(v)} stroke="#EADBC8" strokeWidth={1} strokeOpacity={0.5} vectorEffect="non-scaling-stroke" />
                  ))}
                  {/* Left axis (revenue) labels */}
                  {yTicks.map(v => (
                    <text key={`yl-${v}`} x={x0 - 8} y={revY(v) + 3} textAnchor="end" fontSize={11} fill="#A67C52" fontFamily="monospace">{fmtAxis(v)}</text>
                  ))}
                  <text x={x0 - 8} y={y0 - 8} textAnchor="start" fontSize={9.5} fill="#8B5E3C" fontWeight="bold" fontFamily="monospace">{language === 'TH' ? 'บาท' : 'THB'}</text>

                  {/* Revenue bars — gradient, rounded top, latest highlighted darker */}
                  {pts.map((p, i) => {
                    const isActive = hovered === i || (hovered === null && i === lastIdx);
                    const dim = hovered !== null && hovered !== i;
                    return (
                      <path
                        key={`bar-${i}`}
                        d={barPath(cx(i) - barW / 2, revY(p.revenue), barW, Math.max(y1 - revY(p.revenue), 1), 6)}
                        fill={isActive ? 'url(#barGradActive)' : 'url(#barGrad)'}
                        opacity={dim ? 0.45 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}

                  {/* X-axis labels */}
                  {pts.map((p, i) => (
                    <text key={`xl-${i}`} x={cx(i)} y={y1 + 20} textAnchor="middle" fontSize={11} fill={hovered === i ? '#8B5E3C' : '#A67C52'} fontWeight={hovered === i ? 'bold' : 'normal'} fontFamily="monospace">{p.label}</text>
                  ))}

                  {/* Hover capture columns */}
                  {pts.map((p, i) => (
                    <rect
                      key={`hit-${i}`}
                      x={x0 + band * i}
                      y={y0}
                      width={band}
                      height={plotH}
                      fill="transparent"
                      onMouseEnter={() => setSalesHoverIdx(i)}
                      onMouseLeave={() => setSalesHoverIdx(null)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}

                  {/* Tooltip — only on hover */}
                  {tip && (
                    <g pointerEvents="none">
                      <rect x={tip.tx} y={tip.ty} width={TIPW} height={TIPH} rx={9} fill="#3A2A1E" />
                      <text x={tip.tx + 13} y={tip.ty + 20} fontSize={9.5} fill="#D9B38C" fontFamily="sans-serif">{tip.tp.fullLabel}</text>
                      <text x={tip.tx + 13} y={tip.ty + 41} fontSize={9.5} fill="#EADBC8" fontFamily="sans-serif">{language === 'TH' ? 'รายได้' : 'Revenue'}</text>
                      <text x={tip.tx + TIPW - 13} y={tip.ty + 42} textAnchor="end" fontSize={12} fill="#FFFFFF" fontWeight="bold" fontFamily="monospace">{formatCurrency(tip.tp.revenue)}</text>
                      <text x={tip.tx + 13} y={tip.ty + 58} fontSize={9} fill="#B8A48E" fontFamily="sans-serif">{language === 'TH' ? 'จำนวนออเดอร์' : 'Orders'}</text>
                      <text x={tip.tx + TIPW - 13} y={tip.ty + 58} textAnchor="end" fontSize={9.5} fill="#D9B38C" fontFamily="monospace">{tip.tp.orders.toLocaleString()}</text>
                    </g>
                  )}
                </svg>
              );
            })()}

            {/* Legend — Revenue only, snug under the chart */}
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'linear-gradient(180deg,#D9B38C,#A67C52)' }} />
              <span className="text-[10px] font-mono text-[#8B5E3C]">{language === 'TH' ? 'รายได้ (บาท)' : 'Revenue (THB)'}</span>
            </div>
          </div>

          {/* KPI CARDS (30%) — right on desktop, top on mobile */}
          <div className="lg:col-span-3 order-1 lg:order-2 flex flex-col gap-3">
            {(() => {
              const DeltaPill = ({ delta }: { delta: number }) => {
                const up = delta >= 0;
                return (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold font-mono" style={{ color: up ? '#D97706' : '#DC2626' }}>
                    {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {up ? '+' : ''}{delta}%
                  </span>
                );
              };
              const cards = [
                {
                  key: 'rev', label: language === 'TH' ? 'รายได้รวม' : 'Total Revenue',
                  value: formatCurrency(analytics.summary.revenue), delta: revenueDelta,
                  icon: <DollarSign size={15} className="text-[#8B5E3C]" />,
                  bg: 'bg-[#EADBC8]/60 border-[#D9B38C]', valueCls: 'text-3xl text-[#5E3D26]',
                },
                {
                  key: 'ord', label: language === 'TH' ? 'จำนวนออเดอร์' : 'Total Orders',
                  value: analytics.summary.orders.toLocaleString(), delta: ordersDelta,
                  icon: <ShoppingBag size={15} className="text-[#A67C52]" />,
                  bg: 'bg-[#F8F6F2] border-[#EADBC8]', valueCls: 'text-2xl text-[#8B5E3C]',
                },
                {
                  key: 'aov', label: language === 'TH' ? 'ยอดขายเฉลี่ยต่อบิล' : 'Avg Order Value',
                  value: formatCurrency(analytics.summary.avgValue), delta: aovDelta,
                  icon: <TrendingUp size={15} className="text-[#A67C52]" />,
                  bg: 'bg-white border-[#EADBC8]', valueCls: 'text-2xl text-[#8B5E3C]',
                },
              ];
              return cards.map(c => (
                <div key={c.key} className={`flex-1 p-4 border rounded-xl flex flex-col justify-center ${c.bg} shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-white/70 border border-[#EADBC8]">{c.icon}</span>
                      <span className="text-[10px] uppercase font-bold text-[#A67C52] font-mono tracking-tight">{c.label}</span>
                    </div>
                    <DeltaPill delta={c.delta} />
                  </div>
                  <strong className={`font-black font-mono leading-none ${c.valueCls}`}>{c.value}</strong>
                  <span className="text-[8.5px] text-[#A67C52]/70 font-mono mt-1.5">{language === 'TH' ? `(${periodQualifier}) · เทียบช่วงก่อนหน้า` : `(${periodQualifier}) · vs previous`}</span>
                </div>
              ));
            })()}
          </div>

        </div>
      </div>

      {/* Recent Orders removed — view them on the Orders page. Dashboard is an executive summary. */}

      {/* ── ROW: CRITICAL INVENTORY | CAMPAIGN SUMMARY (both roles, 50/50, stacks on mobile) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Critical Inventory Summary (compact, read-only) */}
          <div className="p-5 bg-white border border-coffee-border rounded-2xl shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-orange-500 shrink-0" />
                <div>
                  <h3 className="font-sans font-bold text-sm text-coffee">
                    {language === 'TH' ? 'วัตถุดิบใกล้วิกฤต' : 'Critical Inventory'}
                  </h3>
                  <p className="font-sans text-xs text-coffee-muted">
                    {language === 'TH' ? 'สรุปสต็อกที่ต้องดำเนินการ' : 'Stock requiring attention'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-sm font-black font-mono ${lowStockCount > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {lowStockCount}
              </span>
            </div>

            {topLowStock.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <CheckCircle className="text-emerald-400 mb-2" size={24} />
                <p className="text-xs text-stone-400 font-medium">{language === 'TH' ? 'สต็อกทุกชนิดปกติ' : 'All stock healthy'}</p>
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                <p className="text-[9px] uppercase font-bold text-zinc-400 font-mono mb-1">
                  {language === 'TH' ? '3 อันดับสต็อกต่ำสุด' : 'Top 3 Low-Stock Items'}
                </p>
                {topLowStock.map(item => {
                  const isCritical = item.status === 'Out of Stock' || item.stockLevel === 0;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-2.5 bg-stone-50/50 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isCritical ? 'bg-red-500' : 'bg-orange-400'}`} />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-zinc-800 truncate">{item.name}</p>
                          <p className="text-[9.5px] text-zinc-400 font-sans">{item.branch}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-mono font-black text-xs ${isCritical ? 'text-red-600' : 'text-orange-600'}`}>{item.stockLevel}%</span>
                        <p className={`text-[8.5px] font-bold font-mono ${isCritical ? 'text-red-500' : 'text-orange-500'}`}>
                          {isCritical ? (language === 'TH' ? 'วิกฤต' : 'Critical') : (language === 'TH' ? 'สต็อกต่ำ' : 'Low Stock')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {inventoryAlertItems.length > 3 && (
              <button
                id="dash-nav-stock-btn"
                onClick={() => onNavigateToTab('Stock Management')}
                className="mt-4 w-full py-2 border border-coffee-border hover:bg-stone-50 text-coffee text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {language === 'TH' ? `ดูทั้งหมด (${inventoryAlertItems.length})` : `View All (${inventoryAlertItems.length})`} <ChevronRight size={13} />
              </button>
            )}
          </div>

          {/* Campaign & Coupon Summary (compact) */}
          <div className="p-5 bg-white border border-coffee-border rounded-2xl shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ticket size={16} className="text-indigo-600 shrink-0" />
                <div>
                  <h3 className="font-sans font-bold text-sm text-coffee">
                    {language === 'TH' ? 'แคมเปญและคูปอง' : 'Campaign & Coupons'}
                  </h3>
                  <p className="font-sans text-xs text-coffee-muted">
                    {language === 'TH' ? 'แคมเปญการตลาดที่กำลังทำงาน' : 'Active marketing campaigns'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-sm font-black font-mono bg-indigo-50 text-indigo-700">
                {activePromotionsCount}
              </span>
            </div>

            {/* Compact summary tiles (reduced height) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="py-2 px-3 bg-stone-50/50 border rounded-xl flex items-center justify-between">
                <p className="text-[9px] uppercase font-bold text-zinc-400 font-mono leading-tight">{language === 'TH' ? 'แคมเปญ' : 'Campaigns'}</p>
                <p className="text-lg font-black text-coffee font-mono leading-none">{activePromotionsCount}</p>
              </div>
              <div className="py-2 px-3 bg-stone-50/50 border rounded-xl flex items-center justify-between">
                <p className="text-[9px] uppercase font-bold text-zinc-400 font-mono leading-tight">{language === 'TH' ? 'คูปอง' : 'Coupons'}</p>
                <p className="text-lg font-black text-coffee font-mono leading-none">{activeCouponsCount}</p>
              </div>
            </div>

            {(() => {
              const topUsed = coupons
                .filter(c => c.status === 'Active')
                .map(c => ({ code: c.code, discountType: c.discountType, discountValue: c.discountValue, uses: branchCouponUsage(c.usageCount, selectedBranch) }))
                .sort((a, b) => b.uses - a.uses)
                .slice(0, 3);
              const maxUses = Math.max(...topUsed.map(c => c.uses), 1);
              if (topUsed.length === 0) return (
                <div className="flex-1 flex items-center justify-center p-4 text-center">
                  <p className="text-xs text-stone-400 font-medium">{language === 'TH' ? 'ไม่มีคูปองที่ใช้งาน' : 'No active coupons'}</p>
                </div>
              );
              return (
                <div className="space-y-3 flex-1">
                  <p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{language === 'TH' ? 'แคมเปญที่ถูกใช้มากที่สุด (Top 3)' : 'Top 3 Campaigns'}</p>
                  {topUsed.map(c => {
                    const percent = Math.round((c.uses / maxUses) * 100);
                    return (
                      <div key={c.code} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold bg-[#FDF1E6] text-coffee px-2 py-0.5 rounded text-[10px] truncate">{c.code}</span>
                          <span className="text-[11px] text-[#8B6B4F] font-mono font-bold shrink-0 tabular-nums">{language === 'TH' ? `${c.uses} ครั้ง` : `${c.uses} uses`}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#8B6B4F] transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <button
              id="dash-nav-coupons-btn"
              onClick={() => onNavigateToTab('Coupons')}
              className="mt-4 w-full py-2 border border-coffee-border hover:bg-stone-50 text-coffee text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {language === 'TH' ? 'ดูทั้งหมด' : 'View All'} <ChevronRight size={13} />
            </button>
          </div>

      </div>

      {/* 3. MODALS CORNER (Fully functional add/create modals) */}
      
      {/* 3.1 CREATE PROMOTION MODAL */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-coffee">{language === 'TH' ? 'สร้างประกาศโปรโมชั่นตัวใหม่' : 'Create Promotion Broadcast'}</h3>
              <button onClick={() => setIsPromoModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 shrink-0">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePromoSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">Title</label>
                <input 
                  type="text" 
                  value={promoForm.title}
                  onChange={e => setPromoForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Summer Special"
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-[#8B6B4F]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">Subtitle / Narrative Description</label>
                <textarea 
                  value={promoForm.subtitle}
                  onChange={e => setPromoForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g. Get 20% discount on every Caramel Macchiato purchase this week."
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-[#8B6B4F] h-20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">Target Branch</label>
                <select 
                  value={promoForm.targetBranch}
                  onChange={e => setPromoForm(prev => ({ ...prev, targetBranch: e.target.value as Branch }))}
                  className="w-full text-xs p-2.5 border bg-white rounded-lg focus:outline-none focus:border-[#8B6B4F]"
                >
                  <option value="Central Plaza">Central Plaza</option>
                  <option value="Siam Square">Siam Square</option>
                  <option value="Mega Bangna">Mega Bangna</option>
                  <option value="The Mall Korat">The Mall Korat</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 py-2 hover:bg-stone-50 border rounded-lg text-xs font-bold font-sans text-zinc-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Confirm Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.2 CREATE COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl font-sans">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-coffee">{language === 'TH' ? 'สร้างตั๋วคูปองแคมเปญใหม่' : 'Create Coupon Template'}</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 shrink-0">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">CODE (uppercase only)</label>
                <input 
                  type="text" 
                  value={couponForm.code}
                  onChange={e => setCouponForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g. SAVE30"
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-[#8B6B4F] font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">Discount Type</label>
                  <select 
                    value={couponForm.discountType}
                    onChange={e => setCouponForm(prev => ({ ...prev, discountType: e.target.value as 'fixed' | 'percentage' }))}
                    className="w-full text-xs p-2.5 border bg-white rounded-lg focus:outline-none focus:border-[#8B6B4F]"
                  >
                    <option value="fixed">Fixed (฿ THB)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">Discount Value</label>
                  <input 
                    type="number" 
                    value={couponForm.discountValue}
                    onChange={e => setCouponForm(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                    className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-[#8B6B4F] font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">Global Limit usage times</label>
                <input 
                  type="number" 
                  value={couponForm.limitGlobal}
                  onChange={e => setCouponForm(prev => ({ ...prev, limitGlobal: Number(e.target.value) }))}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-[#8B6B4F] font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 hover:bg-stone-50 border rounded-lg text-xs font-bold font-sans text-zinc-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.3 ADD STAFF ENTRY MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-coffee">{language === 'TH' ? 'เพิ่มพนักงานประจำการรายใหม่' : 'Authorize Staff Catalog Entry'}</h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 shrink-0">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Somsak Kaewkaon"
                  value={staffForm.name}
                  onChange={e => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-[#8B6B4F]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">Corporate Email Address</label>
                <input 
                  type="email" 
                  placeholder="somsak@quickcoffee.com"
                  value={staffForm.email}
                  onChange={e => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-[#8B6B4F]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">Access Level Role</label>
                  <select 
                    value={staffForm.role}
                    onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full text-xs p-2.5 border bg-white rounded-lg focus:outline-none focus:border-[#8B6B4F]"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Barista">Barista</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 font-mono">Assigned Branch</label>
                  <select 
                    value={staffForm.branch}
                    onChange={e => setStaffForm(prev => ({ ...prev, branch: e.target.value as any }))}
                    className="w-full text-xs p-2.5 border bg-white rounded-lg focus:outline-none focus:border-[#8B6B4F]"
                  >
                    <option value="Central Plaza">Central Plaza</option>
                    <option value="Siam Square">Siam Square</option>
                    <option value="Mega Bangna">Mega Bangna</option>
                    <option value="The Mall Korat">The Mall Korat</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 hover:bg-stone-50 border rounded-lg text-xs font-bold font-sans text-zinc-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Quick status badge reusable helper with bilingual translation
export function StatusBadge({ status }: { status: string }) {
  const { language } = useLanguage();

  const styles: Record<string, string> = {
    'Pending Payment': 'bg-amber-50 text-amber-700 border border-amber-200/60',
    'Paid': 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    'Preparing': 'bg-sky-50 text-sky-800 border border-sky-200/60',
    'Ready For Pickup': 'bg-green-50 text-green-800 border border-green-200/60',
    'Completed': 'bg-stone-100 text-stone-700 border border-stone-200/60',
    'Cancelled': 'bg-red-50 text-red-600'
  };

  const labelsTh: Record<string, string> = {
    'Pending Payment': 'รอชำระเงิน',
    'Paid': 'ชำระเงินแล้ว',
    'Preparing': 'กำลังเตรียม',
    'Ready For Pickup': 'พร้อมเสิร์ฟ',
    'Completed': 'เสร็จสิ้น',
    'Cancelled': 'ยกเลิกแล้ว'
  };

  const labelsEn: Record<string, string> = {
    'Pending Payment': 'Pending Payment',
    'Paid': 'Paid (Confirmed)',
    'Preparing': 'Preparing Coffee',
    'Ready For Pickup': 'Ready For Pickup',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled'
  };

  const label = language === 'TH' ? (labelsTh[status] || status) : (labelsEn[status] || status);

  return (
    <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded text-[10.5px] font-sans font-semibold tracking-wide ${styles[status] || 'bg-zinc-100 text-zinc-700'}`}>
      {label}
    </span>
  );
}
