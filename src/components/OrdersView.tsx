import { useState } from 'react';
import { Order, OrderStatus, Branch, CancellationReason, RefundStatus, Ingredient } from '../types';
import {
  Search,
  X,
  Printer,
  FileText,
  ArrowRight,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCcw,
  Coffee,
  CheckCircle,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface OrdersViewProps {
  orders: Order[];
  ingredients: Ingredient[];
  nowMin: number;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cancelOrderWithReason: (orderId: string, reason: CancellationReason, note: string) => void;
  updateRefundStatus: (orderId: string, status: RefundStatus, note: string) => void;
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  onNavigateToTab: (tab: any) => void;
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
}

// Minutes a customer has to pay before the order is auto-cancelled
const PAYMENT_TIMEOUT_MIN = 10;

const CANCELLATION_REASONS: CancellationReason[] = [
  'Ingredient Out of Stock',
  'Equipment Unavailable',
  'Store Temporarily Closed',
  'Customer Requested Cancellation',
  'Incorrect Order Information',
  'Store Unable to Fulfill',
  'Other',
];

const CANCELLATION_REASONS_TH: Record<CancellationReason, string> = {
  'Customer Did Not Pay': 'ลูกค้าไม่ชำระเงิน',
  'Customer Requested Cancellation': 'ลูกค้าขอยกเลิก',
  'Wrong Order Selected': 'สั่งผิดรายการ',
  'Out of Stock': 'วัตถุดิบหมด',
  'Ingredient Out of Stock': 'วัตถุดิบหมด',
  'Equipment Unavailable': 'อุปกรณ์ไม่พร้อมใช้งาน',
  'Store Temporarily Closed': 'ร้านปิดชั่วคราว',
  'Incorrect Order Information': 'ข้อมูลคำสั่งซื้อไม่ถูกต้อง',
  'Payment Timeout': 'หมดเวลาชำระเงิน',
  'Payment Expired': 'เซสชันชำระเงินหมดอายุ',
  'Payment Verification Failed': 'ตรวจสอบการชำระเงินไม่สำเร็จ',
  'Store Unable to Fulfill': 'ร้านไม่สามารถให้บริการได้',
  'Staff Error': 'ข้อผิดพลาดจากพนักงาน',
  'Other': 'อื่นๆ',
};

export default function OrdersView({
  orders,
  ingredients,
  nowMin,
  updateOrderStatus,
  cancelOrderWithReason,
  updateRefundStatus,
  selectedBranch,
  setSelectedBranch,
  selectedOrderId,
  setSelectedOrderId,
  onNavigateToTab,
  roleMode,
  staffAssignedBranch
}: OrdersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');
  const [queueTab, setQueueTab] = useState<'all' | 'Preparing' | 'Ready For Pickup' | 'Completed'>('all');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  // Cancellation form state
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancellationReason | ''>('');
  const [cancelNote, setCancelNote] = useState('');
  // Refund update form state
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundNote, setRefundNote] = useState('');
  const { language, formatCurrency } = useLanguage();

  const activeBranch = roleMode === 'Staff' ? staffAssignedBranch : selectedBranch;
  const isCancelledStatus = (o: Order) => ['Cancelled', 'Auto Cancelled', 'Cancelled by Staff'].includes(o.status);
  const isSystemCancelled = (o: Order) =>
    isCancelledStatus(o) && (
      o.status === 'Auto Cancelled' ||
      o.status === 'Cancelled' ||
      o.cancelledBy === 'System' ||
      o.cancellationReason === 'Customer Did Not Pay' ||
      o.cancellationReason === 'Payment Timeout' ||
      o.cancellationReason === 'Payment Expired' ||
      o.cancellationReason === 'Payment Verification Failed'
    );
  const isStaffCancelled = (o: Order) => o.status === 'Cancelled by Staff';
  const staffCancellationQueue = (o: Order) => o.queueNo || o.originalQueueNo || '';
  const hasValidQueue = (o: Order) => !!String(o.queueNo || '').trim();
  const isConfirmedQueuedOrder = (o: Order) =>
    hasValidQueue(o) &&
    o.paymentStatus === 'Paid' &&
    ['Paid', 'Preparing', 'Ready For Pickup', 'Queue Called', 'Completed'].includes(o.status);
  const workflowOrders = roleMode === 'Staff' ? orders.filter(isConfirmedQueuedOrder) : orders;

  const filteredOrders = workflowOrders.filter((order) => {
    if (activeBranch !== 'All Branches' && order.branch !== activeBranch) return false;
    if (statusFilter === 'Auto Cancelled' && !isSystemCancelled(order)) return false;
    if (statusFilter === 'Cancelled by Staff' && !isStaffCancelled(order)) return false;
    if (!['All Statuses', 'Auto Cancelled', 'Cancelled by Staff'].includes(statusFilter) && order.status !== statusFilter) return false;
    const query = searchTerm.toLowerCase();
    if (
      query &&
      !order.id.toLowerCase().includes(query) &&
      !order.queueNo.toLowerCase().includes(query) &&
      !order.customerName.toLowerCase().includes(query) &&
      !order.customerPhone.toLowerCase().includes(query)
    ) return false;
    return true;
  });

  const selectedOrder = workflowOrders.find(o => o.id === selectedOrderId);
  const tr = (th: string, en: string) => (language === 'TH' ? th : en);

  // ── SINGLE SOURCE OF TRUTH for an order's displayed status ───────────────────
  // Table badge, Staff card, and Side Panel all read from here so they never disagree.
  interface OrderDisplay { label: string; cls: string; payment: string; queue: string; }
  const deriveStatus = (o: Order): OrderDisplay => {
    if (isCancelledStatus(o)) {
      const autoCancelled = isSystemCancelled(o);
      const staffCancelled = isStaffCancelled(o);
      return {
        label: autoCancelled ? tr('ยกเลิกอัตโนมัติ', 'Auto Cancelled') : tr('ยกเลิกโดยพนักงาน', 'Cancelled by Staff'),
        cls: 'bg-red-50 text-red-600 border border-red-200/60',
        payment: staffCancelled ? tr('ชำระเงินแล้ว', 'Paid') : o.paymentStatus === 'Failed' ? tr('ล้มเหลว', 'Failed') : tr('ยกเลิก', 'Cancelled'),
        queue: staffCancelled ? tr('ยกเลิกโดยพนักงาน', 'Cancelled by Staff') : o.queueNo ? tr('สร้างคิวแล้ว', 'Created') : tr('ยังไม่สร้างคิว', 'Not created'),
      };
    }
    if (o.paymentStatus === 'Failed') {
      return { label: tr('รอชำระเงิน', 'Waiting for Payment'), cls: 'bg-amber-50 text-amber-700 border border-amber-200/60', payment: tr('รอชำระเงิน', 'Waiting for Payment'), queue: tr('ยังไม่สร้างคิว', 'Not Created') };
    }
    if (o.status === 'Pending Payment') {
      return { label: tr('รอชำระเงิน', 'Waiting for Payment'), cls: 'bg-amber-50 text-amber-700 border border-amber-200/60', payment: tr('รอชำระเงิน', 'Waiting for Payment'), queue: tr('ยังไม่สร้างคิว', 'Not Created') };
    }
    // Payment SUCCESS — Paid (and onward through the production workflow)
    const wfLabel = ({ 'Paid': tr('ชำระเงินแล้ว', 'Paid'), 'Preparing': tr('กำลังเตรียม', 'Preparing'), 'Ready For Pickup': tr('พร้อมเสิร์ฟ', 'Ready'), 'Queue Called': tr('เรียกคิวแล้ว', 'Queue Called'), 'Completed': tr('เสร็จสิ้น', 'Completed') } as Record<string, string>)[o.status] ?? o.status;
    const wfCls = ({ 'Paid': 'bg-emerald-50 text-emerald-800 border border-emerald-200/60', 'Preparing': 'bg-sky-50 text-sky-800 border border-sky-200/60', 'Ready For Pickup': 'bg-green-50 text-green-800 border border-green-200/60', 'Queue Called': 'bg-green-50 text-green-800 border border-green-200/60', 'Completed': 'bg-stone-100 text-stone-700 border border-stone-200/60' } as Record<string, string>)[o.status] ?? 'bg-zinc-100 text-zinc-700';
    return { label: wfLabel, cls: wfCls, payment: tr('สำเร็จ', 'Success'), queue: tr('สร้างคิวแล้ว', 'Created') };
  };
  const StatusPill = ({ order }: { order: Order }) => {
    const d = deriveStatus(order);
    return <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded text-[10.5px] font-sans font-semibold tracking-wide ${d.cls}`}>{d.label}</span>;
  };

  // Uniform action-button size for every status (160×48, radius 12, 14px/600, single line, centered)
  const ACTION_BTN = 'w-40 h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 px-4 whitespace-nowrap transition-all shadow-xs';

  // Priority: Paid → Preparing → Ready → Completed
  const priorityOf = (o: Order) =>
    ({ 'Paid': 1, 'Preparing': 2, 'Ready For Pickup': 3, 'Queue Called': 3, 'Completed': 4, 'Cancelled': 9, 'Auto Cancelled': 9, 'Cancelled by Staff': 9, 'Pending Payment': 9 } as Record<string, number>)[o.status] ?? 9;

  const queueTabs = [
    { key: 'all', label: language === 'TH' ? 'ทั้งหมด' : 'All' },
    { key: 'Preparing', label: language === 'TH' ? 'กำลังเตรียม' : 'Preparing' },
    { key: 'Ready For Pickup', label: language === 'TH' ? 'พร้อมเสิร์ฟ' : 'Ready' },
    { key: 'Completed', label: language === 'TH' ? 'เสร็จสิ้น' : 'Done' },
  ] as const;
  const matchesTab = (o: Order, tab: string) => {
    if (tab === 'all') return isConfirmedQueuedOrder(o);
    if (tab === 'Preparing') return o.status === 'Preparing' || o.status === 'Paid'; // Paid orders await preparation
    if (tab === 'Ready For Pickup') return o.status === 'Ready For Pickup' || o.status === 'Queue Called';
    return o.status === tab;
  };
  const tabCount = (tab: string) => filteredOrders.filter(o => matchesTab(o, tab)).length;
  const staffQueue = filteredOrders
    .filter(o => matchesTab(o, queueTab))
    .sort((a, b) => (priorityOf(a) - priorityOf(b)) || a.time.localeCompare(b.time));

  // Minutes remaining before auto-cancel (10-min payment window). nowMin is supplied by App's clock.
  const toMin = (t: string) => { const m = t.match(/(\d+):(\d+)/); return m ? +m[1] * 60 + +m[2] : 0; };
  const minutesLeft = (o: Order) => Math.max(0, Math.min(PAYMENT_TIMEOUT_MIN, PAYMENT_TIMEOUT_MIN - (nowMin - toMin(o.time))));
  const leftColor = (m: number) =>
    m <= 2 ? 'bg-orange-100 text-orange-800' : m <= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-stone-100 text-zinc-500';

  // Status colours: Pending=yellow, Paid=emerald, Preparing=sky, Ready=green, Completed=gray, Cancelled=red
  const queueStyle = (o: Order): { border: string; chip: string } => {
    switch (o.status) {
      case 'Pending Payment': return { border: 'border-l-yellow-400', chip: 'bg-yellow-100 text-yellow-900' };
      case 'Paid': return { border: 'border-l-emerald-400', chip: 'bg-emerald-100 text-emerald-900' };
      case 'Preparing': return { border: 'border-l-sky-400', chip: 'bg-sky-100 text-sky-900' };
      case 'Ready For Pickup': return { border: 'border-l-green-500', chip: 'bg-green-100 text-green-900' };
      case 'Cancelled':
      case 'Auto Cancelled':
      case 'Cancelled by Staff': return { border: 'border-l-red-500', chip: 'bg-red-100 text-red-700' };
      default: return { border: 'border-l-zinc-300', chip: 'bg-zinc-100 text-zinc-500' };
    }
  };
  const nextQueueAction = (o: Order): { label: string; to: OrderStatus; cls: string } | null => {
    if (o.status === 'Paid') return { label: language === 'TH' ? 'เริ่มเตรียม' : 'Start Preparing', to: 'Preparing', cls: 'bg-sky-600 hover:bg-sky-700 text-white' };
    if (o.status === 'Preparing') return { label: language === 'TH' ? 'พร้อมเสิร์ฟ' : 'Mark Ready', to: 'Ready For Pickup', cls: 'bg-green-600 hover:bg-green-700 text-white' };
    if (o.status === 'Ready For Pickup') return { label: language === 'TH' ? 'เรียกคิว' : 'Call Queue', to: 'Queue Called', cls: 'bg-[#8B6B4F] hover:bg-[#70533C] text-white' };
    return null;
  };
  const canStaffCancel = (o: Order) =>
    roleMode === 'Staff' &&
    hasValidQueue(o) &&
    o.paymentStatus === 'Paid' &&
    (o.status === 'Paid' || o.status === 'Preparing');

  const openQueueDisplay = () => {
    window.open('/queue-display', '_blank', 'noopener,noreferrer');
  };

  // ── Operational Status (moved here from the Dashboard) ──────────────────────
  const inBranch = (b: string) => activeBranch === 'All Branches' || b === activeBranch;
  const branchQueuedOrders = orders.filter(o => inBranch(o.branch) && isConfirmedQueuedOrder(o));
  const opActiveQueued = branchQueuedOrders.filter(o => o.status !== 'Completed').length;
  const opPreparing = branchQueuedOrders.filter(o => o.status === 'Preparing' || o.status === 'Paid').length;
  const opReady = branchQueuedOrders.filter(o => o.status === 'Ready For Pickup' || o.status === 'Queue Called').length;
  const opCompleted = branchQueuedOrders.filter(o => o.status === 'Completed').length;
  const opCards = [
    {
      title: language === 'TH' ? 'คิวที่ยืนยันแล้วทั้งหมด' : 'Total Active Queued Orders',
      value: opActiveQueued,
      icon: <CheckCircle size={18} className="text-[#8B6B4F]" />,
      bg: 'bg-[#FDF1E6]/40 border-amber-100',
    },
    {
      title: language === 'TH' ? 'กำลังเตรียมเครื่องดื่ม' : 'Preparing Orders',
      value: opPreparing,
      icon: <Coffee size={18} className="text-blue-500" />,
      bg: 'bg-blue-50/30 border-blue-100',
    },
    {
      title: language === 'TH' ? 'พร้อมสำหรับให้บริการ' : 'Ready For Pickup',
      value: opReady,
      icon: <CheckCircle size={18} className="text-green-600" />,
      bg: 'bg-green-50/30 border-green-100',
    },
    {
      title: language === 'TH' ? 'ส่งมอบสำเร็จ' : 'Completed Orders',
      value: opCompleted,
      icon: <CheckCircle size={18} className="text-zinc-500" />,
      bg: 'bg-stone-50 border-stone-200',
    },
  ];

  const handleCSVExport = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  const statusOptionsEn = ['All Statuses', 'Pending Payment', 'Preparing', 'Ready For Pickup', 'Queue Called', 'Completed', 'Auto Cancelled', 'Cancelled by Staff'];

  const statusOptionsTh: Record<string, string> = {
    'All Statuses': 'ทั้งหมดทุกสถานะ',
    'Pending Payment': 'รอชำระเงิน',
    'Paid': 'ชำระแล้ว',
    'Preparing': 'กำลังเตรียมเครื่องดื่ม',
    'Ready For Pickup': 'พร้อมให้บริการ',
    'Queue Called': 'เรียกคิวแล้ว',
    'Completed': 'ส่งมอบสำเร็จ',
    'Auto Cancelled': 'ยกเลิกอัตโนมัติ',
    'Cancelled by Staff': 'ยกเลิกโดยพนักงาน'
  };
  const statusOptionsLabelEn: Record<string, string> = {
    'Pending Payment': 'Waiting for Payment',
    'Ready For Pickup': 'Ready for Pickup',
  };

  const timelineLabelsTh: Record<string, string> = {
    'Pending Payment': 'รอชำระเงิน',
    'Paid': 'ยืนยันการชำระเงินแล้ว',
    'Preparing': 'บาริสต้าต้ม/ชง',
    'Ready For Pickup': 'เสร็จสิ้น จัดวางหิ้ง',
    'Queue Called': 'เรียกคิวแล้ว',
    'Completed': 'ส่งมอบลูกค้า'
  };

  const cancellationReasonLabel = (reason: CancellationReason) => {
    if (language === 'TH') return CANCELLATION_REASONS_TH[reason];
    return ({
      'Ingredient Out of Stock': 'Ingredient out of stock',
      'Equipment Unavailable': 'Equipment unavailable',
      'Customer Requested Cancellation': 'Customer requested cancellation',
      'Incorrect Order Information': 'Wrong order information',
      'Store Unable to Fulfill': 'Store issue',
      Other: 'Other',
    } as Partial<Record<CancellationReason, string>>)[reason] || reason;
  };

  // ─── Workflow Action Block (reused in Staff panel) ──────────────────────────
  const WorkflowActions = ({ order }: { order: Order }) => {
    // Already cancelled
    if (isCancelledStatus(order)) return null;

    // Cancellation confirmation modal — available only for cancellable queued orders.
    if (showCancelForm) {
      const paidOrder = order.paymentStatus === 'Paid';
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => { setShowCancelForm(false); setCancelReason(''); setCancelNote(''); }}>
        <div className="w-full max-w-sm space-y-3 p-4 bg-red-50 border border-red-200 rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <p className="font-sans text-[11px] font-bold text-red-800 flex items-center gap-1.5">
              <AlertCircle size={13} />
              {language === 'TH' ? 'ยืนยันการยกเลิกออเดอร์' : 'Confirm Order Cancellation'}
            </p>
            <button onClick={() => { setShowCancelForm(false); setCancelReason(''); setCancelNote(''); }} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
              <X size={13} />
            </button>
          </div>

          {paidOrder && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-sans text-amber-800 font-semibold">
              {language === 'TH'
                ? `⚠️ ออเดอร์นี้ชำระเงินแล้ว ฿${order.amount.toLocaleString()} ระบบจะบันทึกสถานะ "รอคืนเงิน" โดยอัตโนมัติ`
                : `⚠️ This order was paid ฿${order.amount.toLocaleString()}. A "Refund Pending" status will be recorded automatically.`}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-mono text-[9px] text-red-700 uppercase tracking-widest font-extrabold block">
              {language === 'TH' ? 'เหตุผลการยกเลิก *' : 'Cancellation Reason *'}
            </label>
            <select
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value as CancellationReason)}
              className="w-full text-xs py-1.5 px-2 border border-red-200 bg-white rounded-lg font-sans text-zinc-700 focus:outline-none focus:border-red-400 cursor-pointer"
            >
              <option value="">{language === 'TH' ? '— เลือกเหตุผล —' : '— Select reason —'}</option>
              {CANCELLATION_REASONS.map(r => (
                <option key={r} value={r}>{cancellationReasonLabel(r)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold block">
              {language === 'TH' ? 'หมายเหตุเพิ่มเติม (ไม่บังคับ)' : 'Additional Note (Optional)'}
            </label>
            <textarea
              value={cancelNote}
              onChange={e => setCancelNote(e.target.value)}
              rows={2}
              placeholder={language === 'TH' ? 'รายละเอียดเพิ่มเติม...' : 'Additional details...'}
              className="w-full text-xs py-1.5 px-2 border border-zinc-200 bg-white rounded-lg font-sans text-zinc-700 focus:outline-none focus:border-zinc-400 resize-none"
            />
          </div>

          <button
            id="confirm-cancel-order-btn"
            disabled={!cancelReason || (cancelReason === 'Other' && !cancelNote.trim())}
            onClick={() => {
              if (!cancelReason || (cancelReason === 'Other' && !cancelNote.trim())) return;
              cancelOrderWithReason(order.id, cancelReason as CancellationReason, cancelNote);
              setShowCancelForm(false);
              setCancelReason('');
              setCancelNote('');
            }}
            className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-lg font-sans transition-all cursor-pointer"
          >
            {language === 'TH' ? 'ยืนยันยกเลิกออเดอร์' : 'Confirm Cancellation'}
          </button>
        </div>
        </div>
      );
    }

    // Pending Payment — awaiting payment within the 10-min window; cancel goes through the reason form
    if (order.status === 'Pending Payment') {
      const left = Math.max(0, PAYMENT_TIMEOUT_MIN - (nowMin - toMin(order.time)));
      return (
        <div className="space-y-2.5">
          {/* Awaiting payment summary */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl space-y-1.5 text-[11px] font-sans">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-500 animate-ping shrink-0" />
              <p className="text-yellow-800 font-bold">{language === 'TH' ? 'รอชำระเงิน' : 'Awaiting Payment'}</p>
            </div>
            <div className="flex justify-between text-yellow-800/90">
              <span>{language === 'TH' ? 'เวลาที่สร้างออเดอร์' : 'Created at'}</span>
              <span className="font-mono font-semibold">{order.time}</span>
            </div>
            <div className="flex justify-between text-yellow-800/90">
              <span>{language === 'TH' ? 'ยกเลิกอัตโนมัติใน' : 'Auto-cancel in'}</span>
              <span className="font-mono font-bold">{language === 'TH' ? `${left} นาที` : `${left} min`}</span>
            </div>
            <div className="flex justify-between text-yellow-800/90">
              <span>{language === 'TH' ? 'ยอดที่ต้องชำระ' : 'Amount due'}</span>
              <span className="font-mono font-bold">{formatCurrency(order.amount)}</span>
            </div>
            <div className="flex justify-between text-yellow-800/90">
              <span>{language === 'TH' ? 'วิธีชำระเงิน' : 'Method'}</span>
              <span className="font-semibold">{order.paymentMethod}</span>
            </div>
          </div>
          <button
            id="workflow-recheck-btn"
            onClick={() => updateOrderStatus(order.id, 'Paid')}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-sans text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw size={13} /> {language === 'TH' ? 'ตรวจสอบการชำระเงินอีกครั้ง' : 'Re-check Payment'}
          </button>
          {/* Unpaid orders may be cancelled (with a reason) while payment is unconfirmed */}
          <button
            id="workflow-cancel-btn"
            onClick={() => setShowCancelForm(true)}
            className="w-full py-1.5 border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-[11px] font-semibold rounded-lg font-sans transition-all text-center cursor-pointer"
          >
            {language === 'TH' ? 'ยกเลิกคำสั่งซื้อนี้' : 'Cancel Order'}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Primary action */}
        {order.status === 'Paid' && (
          <button
            id="workflow-start-brewing-btn"
            onClick={() => updateOrderStatus(order.id, 'Preparing')}
            className="w-full py-2.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white font-sans text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {language === 'TH' ? '☕️ เริ่มบด/ชงกาแฟ' : '☕️ Start Brewing'} <ArrowRight size={13} />
          </button>
        )}
        {order.status === 'Preparing' && (
          <button
            id="workflow-set-ready-btn"
            onClick={() => updateOrderStatus(order.id, 'Ready For Pickup')}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-sans text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {language === 'TH' ? '🔔 ปรุงเสร็จ พร้อมส่ง' : '🔔 Ready for Pickup'} <ArrowRight size={13} />
          </button>
        )}
        {order.status === 'Ready For Pickup' && (
          <button
            id="workflow-call-queue-btn"
            onClick={() => updateOrderStatus(order.id, 'Queue Called')}
            className="w-full py-3 bg-[#8B6B4F] hover:bg-[#70533C] text-white font-sans text-sm font-black rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {language === 'TH' ? 'เรียกคิว' : 'Call Queue'} <ArrowRight size={14} />
          </button>
        )}
        {order.status === 'Queue Called' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              id="workflow-recall-queue-btn"
              onClick={() => updateOrderStatus(order.id, 'Queue Called')}
              className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-sans text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {language === 'TH' ? 'เรียกซ้ำ' : 'Recall Queue'}
            </button>
            <button
              id="workflow-complete-handover-btn"
              onClick={() => updateOrderStatus(order.id, 'Completed')}
              className="py-2.5 bg-[#A8BB9A] hover:bg-[#8CA27D] text-white font-sans text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {language === 'TH' ? 'ส่งมอบเสร็จสิ้น' : 'Complete Handover'} <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Staff can cancel only active queued preparation orders. */}
        {canStaffCancel(order) && (
          <button
            id="workflow-cancel-btn"
            onClick={() => setShowCancelForm(true)}
            className="w-full py-1.5 border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-[11px] font-semibold rounded-lg font-sans transition-all text-center cursor-pointer"
          >
            {language === 'TH' ? 'ยกเลิกคำสั่งซื้อนี้' : 'Cancel Order'}
          </button>
        )}

        {/* Re-open for testing */}
        {order.status === 'Completed' && (
          <button
            onClick={() => updateOrderStatus(order.id, 'Paid')}
            className="w-full py-1 bg-stone-100 hover:bg-stone-200 text-zinc-600 text-[10.5px] rounded border border-zinc-200 text-center cursor-pointer"
          >
            {language === 'TH' ? 'เปิดคิวใหม่ (เป็นชำระเงินแล้ว)' : 'Re-open Queue (set to Paid)'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 relative">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-sans font-black text-lg text-[#2E2A25]">{language === 'TH' ? 'จัดการออเดอร์' : 'Order Management'}</h2>
          <p className="text-xs text-zinc-500">
            {roleMode === 'Staff'
              ? (language === 'TH' ? 'จัดการคิวที่ชำระเงินแล้ว และเรียกคิวเพื่อรับสินค้า' : 'Manage paid queued orders and call queues for pickup.')
              : (language === 'TH' ? 'ตรวจสอบออเดอร์ การชำระเงิน และประวัติการยกเลิก' : 'Monitor orders, payment information, and cancellation audit history.')}
          </p>
        </div>
        {roleMode === 'Staff' && (
          <button
            id="open-queue-display-screen-btn"
            onClick={openQueueDisplay}
            className="px-4 py-2 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            {language === 'TH' ? 'เปิดหน้าจอคิว' : 'Open Queue Screen'}
          </button>
        )}
      </div>

      {/* ── Operational Status — Staff only (operators); Admin is read-only review ── */}
      {roleMode === 'Staff' && (
        <div className="mb-6 space-y-1.5">
          <h4 className="font-sans font-bold text-[10px] text-[#8B6B4F] uppercase tracking-wider">
            {language === 'TH' ? 'สถานะการดำเนินงาน' : 'Operational Status'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {opCards.map(card => (
              <div key={card.title} className={`p-3.5 rounded-xl border ${card.bg} bg-white flex items-center justify-between shadow-xs`}>
                <div>
                  <span className="font-sans text-[10px] font-bold text-zinc-500 tracking-tight block">{card.title}</span>
                  <h3 className="font-sans font-black text-lg text-[#2E2A25] tracking-tight mt-1">{card.value}</h3>
                </div>
                <div className="p-1 rounded bg-[#FDF1E6]/30 border border-[#E6DFD9]/40 shrink-0">{card.icon}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start animate-fade-in">

        {/* ── Orders Table ─────────────────────────────────────────────────── */}
        <div className={`w-full ${selectedOrder ? 'lg:w-[65%]' : 'w-full'} space-y-6`}>

          {/* Filter & Search — Admin only */}
          {roleMode === 'Admin' && (
            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E6DFD9] space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-sans font-bold text-sm text-[#2E2A25]">
                  {language === 'TH' ? 'ค้นหาและควบคุมคิวเครื่องดื่ม' : 'Filter & Search Deliveries'}
                </h3>
                <button
                  id="export-csv-btn"
                  onClick={handleCSVExport}
                  className="px-3.5 py-1.5 border border-[#E6DFD9] bg-stone-50 hover:bg-stone-100/50 rounded-lg text-xs font-semibold text-zinc-600 transition-all font-sans flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <FileText size={13} className="text-[#8B6B4F]" />
                  {exportSuccess ? (language === 'TH' ? 'ส่งออกแล้ว ✅' : 'CSV Exported ✅') : (language === 'TH' ? 'ส่งออกไฟล์ Excel / CSV' : 'Export Excel / CSV')}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Search size={14} />
                  </span>
                  <input
                    id="order-search-input"
                    type="text"
                    placeholder={language === 'TH' ? 'ค้นหารหัส, ชื่อลูกค้า, เบอร์โทร...' : 'Query Code, Name, Phone...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs py-2 pl-9 pr-3 font-sans bg-stone-50 border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F]"
                  />
                </div>
                <select
                  id="order-status-filter-dropdown"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs py-2 px-3 font-sans bg-stone-50 border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F] text-zinc-600 cursor-pointer"
                >
                  {statusOptionsEn.map(st => (
                    <option key={st} value={st}>{language === 'TH' ? (statusOptionsTh[st] || st) : (statusOptionsLabelEn[st] || st)}</option>
                  ))}
                </select>
                <select
                  id="order-branch-filter-dropdown"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value as Branch)}
                  className="w-full text-xs py-2 px-3 font-sans bg-stone-50 border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F] text-zinc-600 cursor-pointer"
                >
                  <option value="All Branches">{language === 'TH' ? 'ทุกสาขา (รวมทั้งหมด)' : 'All Branches (Global)'}</option>
                  <option value="Central Plaza">Central Plaza</option>
                  <option value="Siam Square">Siam Square</option>
                  <option value="Mega Bangna">Mega Bangna</option>
                  <option value="The Mall Korat">The Mall Korat</option>
                </select>
              </div>
            </div>
          )}

          {/* Summary count bar — Admin only */}
          {roleMode === 'Admin' && (
            <div className="flex items-center justify-between font-sans text-xs text-zinc-500 bg-stone-50 border border-[#E6DFD9] px-3.5 py-2.5 rounded-lg">
              <span>{language === 'TH' ? 'พบคิวออเดอร์ ' : 'Showing '}<strong className="text-zinc-700">{filteredOrders.length}</strong>{language === 'TH' ? ' รายการที่มีสิทธิ์แก้ไข' : ' order queues'}</span>
              <span className="font-mono text-[10px]">{language === 'TH' ? 'ยอดที่คัดสรร' : 'Filter Match Count'}</span>
            </div>
          )}

          {/* Admin: full data table | Staff: operational queue board */}
          {roleMode === 'Admin' ? (
          <div className="bg-[#FFFFFF] border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6DFD9] bg-stone-50/50 h-12">
                    <th className="py-3 px-4 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'คิวที่' : 'Queue No.'}</th>
                    <th className="py-3 px-4 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'รหัสคำสั่งซื้อ' : 'Order ID'}</th>
                    <th className="py-3 px-4 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'ลูกค้า' : 'Customer'}</th>
                    <th className="py-3 px-4 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'สาขา' : 'Branch'}</th>
                    <th className="py-3 px-4 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">{language === 'TH' ? 'สถานะ' : 'Status'}</th>
                    <th className="py-3 px-4 font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">{language === 'TH' ? 'ยอดรวม' : 'Amount'}</th>
                    <th className="py-3 px-4 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'เวลาสั่งซื้อ' : 'Order Time'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center font-sans text-xs text-zinc-400">
                        {language === 'TH' ? 'ไม่พบรายการคิวเครื่องดื่มที่ตรงกัน' : 'No orders match your selected queries.'}
                      </td>
                    </tr>
                  ) : filteredOrders.map((order) => {
                    const isSelected = order.id === selectedOrderId;
                    const displayQueueNo = isStaffCancelled(order) ? staffCancellationQueue(order) : order.queueNo;
                    return (
                      <tr
                        key={order.id}
                        id={`order-row-${order.id}`}
                        onClick={() => { setSelectedOrderId(order.id); setTimelineOpen(false); setShowCancelForm(false); setCancelReason(''); setCancelNote(''); setShowRefundForm(false); setRefundNote(''); }}
                        className={`hover:bg-amber-50/10 cursor-pointer transition-colors h-[76px] ${isSelected ? 'bg-amber-50/30' : ''}`}
                      >
                        <td className={`align-middle py-2 px-4 font-sans text-xs border-l-4 transition-all ${isSelected ? 'border-l-[#8B6B4F]' : 'border-l-transparent'}`}>
                          {displayQueueNo
                            ? <span className="text-[10.5px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold font-mono">
                                Q-{displayQueueNo}
                              </span>
                            : <span className="text-[10.5px] text-zinc-400 font-mono px-2 py-0.5">—</span>
                          }
                        </td>
                        <td className="align-middle py-2 px-4 font-mono text-xs font-semibold text-zinc-800">{order.id}</td>
                        <td className="align-middle py-2 px-4">
                          <div className="font-sans text-xs font-semibold text-zinc-800">{order.customerName}</div>
                          <div className="font-mono text-[10px] text-zinc-400 mt-0.5">{order.customerPhone}</div>
                        </td>
                        <td className="align-middle py-2 px-4 font-sans text-xs text-zinc-600 font-medium">{order.branch}</td>
                        <td className="align-middle py-2 px-4 text-center"><StatusPill order={order} /></td>
                        <td className="align-middle py-2 px-4 font-mono text-xs font-bold text-[#8B6B4F] text-right">{formatCurrency(order.amount)}</td>
                        <td className="align-middle py-2 px-4 font-mono text-xs text-zinc-500">{order.time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3.5 bg-stone-50/50 border-t border-[#E6DFD9] flex items-center justify-between text-xs text-zinc-500 font-sans">
              <span>
                {language === 'TH'
                  ? `แสดง 1 ถึง ${filteredOrders.length} จากทั้งหมด ${filteredOrders.length} ระเบียน`
                  : `Showing 1 to ${filteredOrders.length} of ${filteredOrders.length} records`}
              </span>
              <div className="flex gap-1.5">
                <button className="px-2 py-1 rounded border border-zinc-200 bg-white disabled:opacity-50 text-[10px]" disabled>{language === 'TH' ? 'ก่อนหน้า' : 'Prev'}</button>
                <button className="px-2 py-1 rounded border border-zinc-200 bg-[#8B6B4F] text-white text-[10px]">1</button>
                <button className="px-2 py-1 rounded border border-zinc-200 bg-white disabled:opacity-50 text-[10px]" disabled>{language === 'TH' ? 'ถัดไป' : 'Next'}</button>
              </div>
            </div>
          </div>
          ) : (
          /* ── STAFF: operational queue card board ── */
          <div className="space-y-4">
            {/* Tab filters by status */}
            <div className="flex flex-wrap gap-2">
              {queueTabs.map(t => {
                const active = queueTab === t.key;
                const count = tabCount(t.key);
                return (
                  <button
                    key={t.key}
                    id={`queue-tab-${t.key.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setQueueTab(t.key as typeof queueTab)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 ${active ? 'bg-[#8B6B4F] text-white shadow-xs' : 'bg-white border border-[#E6DFD9] text-zinc-600 hover:bg-stone-50'}`}
                  >
                    {t.label}
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-stone-100 text-zinc-500'}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Queue cards */}
            {staffQueue.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-[#E6DFD9] rounded-2xl">
                <p className="text-sm text-zinc-400 font-sans">{language === 'TH' ? 'ไม่มีออเดอร์ที่ยืนยันและมีหมายเลขคิวในสถานะนี้' : 'No confirmed queued orders in this status'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {staffQueue.map(order => {
                  const st = queueStyle(order);
                  const action = nextQueueAction(order);
                  const itemsText = order.items.map(i => `${i.item.name} ×${i.qty}`).join(', ');
                  const isReady = order.status === 'Ready For Pickup';
                  // Ready For Pickup gets an oversized green queue chip for at-a-glance visibility
                  const chipSize = isReady ? 'w-24 h-24' : 'w-20 h-20';
                  const numSize = isReady ? 'text-4xl' : 'text-3xl';
                  return (
                    <div
                      key={order.id}
                      id={`queue-card-${order.id}`}
                      onClick={() => { setSelectedOrderId(order.id); setTimelineOpen(false); setShowCancelForm(false); setShowRefundForm(false); }}
                      className={`bg-white border border-[#E6DFD9] border-l-4 ${st.border} ${isReady ? 'bg-green-50/40' : ''} rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer p-4 flex items-center gap-4`}
                    >
                      {/* Big queue number — created only after payment is confirmed */}
                      <div className={`shrink-0 ${chipSize} rounded-2xl flex flex-col items-center justify-center px-1 ${st.chip}`}>
                        {order.queueNo ? (
                          <>
                            <span className="text-[8.5px] font-mono font-bold uppercase opacity-70 leading-none">{language === 'TH' ? 'คิว' : 'Queue'}</span>
                            <span className={`font-mono font-black ${numSize} leading-none mt-1`}>{order.queueNo}</span>
                          </>
                        ) : (
                          <span className="text-[9.5px] font-sans font-bold leading-tight text-center opacity-80">
                            {language === 'TH' ? 'ยังไม่สร้างคิว' : 'No queue yet'}
                          </span>
                        )}
                      </div>

                      {/* Minimal info: items · amount · time · status */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-sans font-bold text-sm text-zinc-800 leading-snug line-clamp-1">{itemsText}</p>
                          <span className="font-mono font-black text-sm text-[#8B6B4F] shrink-0 whitespace-nowrap">{formatCurrency(order.amount)}</span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                          <span className="text-[11px] font-mono text-zinc-400">⏱ {order.time}</span>
                          <StatusPill order={order} />
                        </div>
                      </div>

                      {/* Single primary action — uniform size for every status */}
                      <div className="shrink-0" onClick={e => e.stopPropagation()}>
                        {order.status === 'Queue Called' ? (
                          <div className="flex flex-col gap-2">
                            <button
                              id={`queue-recall-${order.id}`}
                              onClick={() => updateOrderStatus(order.id, 'Queue Called')}
                              className={`${ACTION_BTN} bg-amber-600 hover:bg-amber-700 text-white`}
                            >
                              {language === 'TH' ? 'เรียกซ้ำ' : 'Recall Queue'}
                            </button>
                            <button
                              id={`queue-complete-${order.id}`}
                              onClick={() => updateOrderStatus(order.id, 'Completed')}
                              className={`${ACTION_BTN} bg-[#8B6B4F] hover:bg-[#70533C] text-white`}
                            >
                              {language === 'TH' ? 'ส่งมอบเสร็จสิ้น' : 'Complete Handover'}
                            </button>
                          </div>
                        ) : action ? (
                          <button
                            id={`queue-advance-${order.id}`}
                            onClick={() => updateOrderStatus(order.id, action.to)}
                            className={`${ACTION_BTN} ${action.cls}`}
                          >
                            {action.label} <ArrowRight size={15} />
                          </button>
                        ) : (
                          <span className={`${ACTION_BTN} bg-zinc-50 text-zinc-400 cursor-default`}>
                            <CheckCircle size={15} /> {language === 'TH' ? 'เสร็จสิ้น' : 'Done'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>

        {/* ── Order Detail Panel ───────────────────────────────────────────── */}
        {selectedOrder && (
          <div
            id="order-detail-drawer-panel"
            className="w-full lg:w-[35%] lg:max-w-[35%] bg-[#FFFFFF] border border-[#E6DFD9] rounded-xl self-start overflow-hidden shadow-lg shrink-0 sticky top-6 flex flex-col"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* S1: Header */}
            <div className="px-4 py-3.5 bg-[#FDFBF7] border-b border-[#E6DFD9] flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-extrabold text-zinc-900">{selectedOrder.id}</span>
                  <StatusPill order={selectedOrder} />
                </div>
                <p className="font-sans text-[10.5px] text-zinc-500 mt-0.5">
                  {language === 'TH' ? 'สาขา: ' : 'Branch: '}<strong className="text-zinc-700">{selectedOrder.branch}</strong>
                </p>
              </div>
              <button
                id="close-order-detail-btn"
                onClick={() => setSelectedOrderId(null)}
                className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* S2: Compact alert banner (failed) or queue banner (others) */}
            <div className="px-4 py-3 text-white flex items-center justify-between shrink-0 bg-amber-950">
              <div>
                <span className="font-sans text-[9px] text-[#EAD1A8] uppercase tracking-wider block font-medium">
                  {staffCancellationQueue(selectedOrder) || selectedOrder.queueNo ? (language === 'TH' ? 'หมายเลขคิวออเดอร์' : 'Order Queue No.') : (language === 'TH' ? 'ยังไม่มีหมายเลขคิว' : 'No Queue Number')}
                </span>
                <span className="font-mono text-xl font-black tracking-wide leading-none">
                  {staffCancellationQueue(selectedOrder) || selectedOrder.queueNo ? (language === 'TH' ? `คิว: Q-${staffCancellationQueue(selectedOrder) || selectedOrder.queueNo}` : `Q-${staffCancellationQueue(selectedOrder) || selectedOrder.queueNo}`) : '-'}
                </span>
                {selectedOrder.queueNo && (selectedOrder.status === 'Ready For Pickup' || selectedOrder.status === 'Queue Called') && (
                  <span className="font-sans text-[10px] text-white/75 block mt-1">
                    {language === 'TH' ? 'สถานะคิว: ' : 'Queue Status: '}
                    <strong className="text-white">{selectedOrder.status === 'Queue Called' ? (language === 'TH' ? 'เรียกคิวแล้ว' : 'Queue Called') : (language === 'TH' ? 'ยังไม่ได้เรียก' : 'Not Called Yet')}</strong>
                  </span>
                )}
              </div>
              <button className="p-1 px-2 border border-white/20 hover:border-white/50 rounded flex items-center gap-1.5 text-[10px] font-sans font-semibold shrink-0">
                <Printer size={11} /> {language === 'TH' ? 'พิมพ์ตั๋ว' : 'Print'}
              </button>
            </div>

            {/* S3: Detail exception — cancellation only before queue call */}
            {roleMode === 'Staff' && canStaffCancel(selectedOrder) && (
              <div className="px-4 py-3 border-b border-[#E6DFD9] bg-stone-50/60 shrink-0">
                <span className="font-mono text-[8.5px] text-[#8B6B4F] uppercase tracking-widest font-extrabold block mb-2">
                  {language === 'TH' ? 'ยกเลิกออเดอร์' : 'Cancellation'}
                </span>
                {showCancelForm ? (
                  <WorkflowActions order={selectedOrder} />
                ) : (
                  <button
                    id="detail-cancel-order-btn"
                    onClick={() => setShowCancelForm(true)}
                    className="w-full py-2 border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-[11px] font-semibold rounded-lg font-sans transition-all text-center cursor-pointer"
                  >
                    {language === 'TH' ? 'ยกเลิกคำสั่งซื้อนี้' : 'Cancel Order'}
                  </button>
                )}
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

              {/* S4 (Staff) / S1 (Admin): Items ordered — first thing staff needs to see */}
              <div className="px-4 pt-3.5 pb-3 border-b border-zinc-100 space-y-2">
                <h4 className="font-mono text-[9px] text-[#8B6B4F] uppercase tracking-widest font-extrabold">
                  {language === 'TH' ? 'รายการที่สั่ง' : 'Ordered Items'}
                </h4>
                <div className="divide-y divide-zinc-100 border border-[#E6DFD9] rounded-xl overflow-hidden bg-white">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="px-3 py-2.5 flex items-start gap-2.5 text-xs font-sans">
                      <span className="text-base shrink-0 leading-tight">{item.item.image}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-800 leading-normal truncate">{item.item.name}</p>
                        <p className="font-mono text-[10px] text-zinc-400 mt-0.5">{language === 'TH' ? 'จำนวน' : 'Qty'}: {item.qty} × {formatCurrency(item.price)}</p>
                      </div>
                      <span className="font-mono font-bold text-zinc-700 shrink-0">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <div className="px-3 py-2 bg-stone-50/70 flex justify-between items-center">
                    <span className="font-sans text-[10.5px] font-bold text-zinc-600">{language === 'TH' ? 'ยอดรวม' : 'Total'}</span>
                    <span className="font-mono text-sm font-black text-[#8B6B4F]">{formatCurrency(selectedOrder.amount)}</span>
                  </div>
                </div>
              </div>

              {/* S5: Note / Remarks — highlight for barista */}
              {selectedOrder.note && (
                <div className="px-4 py-3 border-b border-zinc-100">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="font-mono text-[9px] text-amber-800 block uppercase tracking-wider font-extrabold mb-1">
                      {language === 'TH' ? '⚠️ หมายเหตุจากลูกค้า' : '⚠️ Customer Notes'}
                    </span>
                    <p className="font-sans text-[12px] font-semibold text-amber-900 leading-relaxed">{selectedOrder.note}</p>
                  </div>
                </div>
              )}

              {/* S6: Billing summary (compact) */}
              <div className="px-4 py-3 border-b border-zinc-100 space-y-1.5">
                <h4 className="font-mono text-[9px] text-[#8B6B4F] uppercase tracking-widest font-extrabold">
                  {language === 'TH' ? 'สรุปการชำระเงิน' : 'Payment Summary'}
                </h4>
                <div className="space-y-1 text-xs font-sans">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>{language === 'TH' ? 'ช่องทางชำระ:' : 'Method:'}</span>
                    <span className="text-zinc-800 font-semibold text-[11px]">💳 {selectedOrder.paymentMethod}</span>
                  </div>
                  {(() => {
                    const d = deriveStatus(selectedOrder);
                    const staffCancelled = isStaffCancelled(selectedOrder);
                    const paid = selectedOrder.paymentStatus === 'Paid' || staffCancelled;
                    const failed = selectedOrder.paymentStatus === 'Failed';
                    const hasQueue = !!(selectedOrder.queueNo || (staffCancelled ? selectedOrder.originalQueueNo : ''));
                    return (
                      <>
                        <div className="flex justify-between items-center text-zinc-500">
                          <span>{language === 'TH' ? 'สถานะชำระเงิน:' : 'Payment Status:'}</span>
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${paid ? 'bg-emerald-50 text-emerald-700' : failed ? 'bg-orange-50 text-orange-700' : selectedOrder.paymentStatus === 'Refunded' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>
                            {d.payment}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-500">
                          <span>{language === 'TH' ? 'สถานะคิว:' : 'Queue Status:'}</span>
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${hasQueue ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                            {d.queue}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>{language === 'TH' ? 'คูปอง:' : 'Coupon:'}</span>
                    <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-1.5 rounded font-bold">
                      {selectedOrder.amount < 190 ? 'WELCOME50' : (language === 'TH' ? 'ไม่มี' : 'None')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-zinc-800 pt-1 border-t border-[#E6DFD9]">
                    <span className="text-xs">{language === 'TH' ? 'ยอดสุทธิ:' : 'Net Total:'}</span>
                    <span className="font-mono text-sm">{formatCurrency(selectedOrder.amount)}</span>
                  </div>
                </div>
              </div>

              {/* S6b: Cancellation & Refund info — only for cancelled orders */}
              {isCancelledStatus(selectedOrder) && (
                <div className="px-4 py-3 border-b border-zinc-100 space-y-2.5">
                  <h4 className="font-mono text-[9px] text-red-600 uppercase tracking-widest font-extrabold">
                    {isStaffCancelled(selectedOrder)
                      ? (language === 'TH' ? 'รายละเอียดการยกเลิกโดยพนักงาน' : 'Staff Cancellation Details')
                      : (language === 'TH' ? 'รายละเอียดการยกเลิกอัตโนมัติ' : 'System Cancellation Details')}
                  </h4>
                  <div className={`p-3 rounded-xl space-y-2 text-xs font-sans ${isStaffCancelled(selectedOrder) ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">{language === 'TH' ? 'ประเภทการยกเลิก:' : 'Cancellation Type:'}</span>
                      <span className="font-semibold text-red-800">{language === 'TH' ? (isSystemCancelled(selectedOrder) ? 'ระบบ' : 'ยกเลิกโดยพนักงาน') : (isSystemCancelled(selectedOrder) ? 'System' : 'Staff Cancellation')}</span>
                    </div>
                    {selectedOrder.cancellationReason && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-zinc-500 shrink-0">{language === 'TH' ? 'เหตุผล:' : 'Reason:'}</span>
                        <span className="font-semibold text-red-800 text-right">
                          {selectedOrder.cancellationReason === 'Other' && selectedOrder.cancellationNote ? selectedOrder.cancellationNote : cancellationReasonLabel(selectedOrder.cancellationReason)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.cancellationNote && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-zinc-500 shrink-0">{language === 'TH' ? 'หมายเหตุ:' : 'Note:'}</span>
                        <span className="text-zinc-700 text-right">{selectedOrder.cancellationNote}</span>
                      </div>
                    )}
                    {isStaffCancelled(selectedOrder) && selectedOrder.cancelledBy && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">{language === 'TH' ? 'ยกเลิกโดย:' : 'Cancelled By:'}</span>
                        <span className="font-semibold text-zinc-700">{selectedOrder.cancelledBy}</span>
                      </div>
                    )}
                    {isStaffCancelled(selectedOrder) && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{language === 'TH' ? 'หมายเลขคิวเดิม:' : 'Original Queue Number:'}</span>
                          <span className="font-mono font-semibold text-zinc-700">{staffCancellationQueue(selectedOrder) ? `Q-${staffCancellationQueue(selectedOrder)}` : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{language === 'TH' ? 'สถานะเดิม:' : 'Original Order Status:'}</span>
                          <span className="font-semibold text-zinc-700">{selectedOrder.originalOrderStatus || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{language === 'TH' ? 'สาขา:' : 'Branch:'}</span>
                          <span className="font-semibold text-zinc-700">{selectedOrder.branch}</span>
                        </div>
                      </>
                    )}
                    {selectedOrder.cancelledAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">{language === 'TH' ? 'เวลายกเลิก:' : 'Cancellation Time:'}</span>
                        <span className="font-mono text-[10px] text-zinc-600">{selectedOrder.cancelledAt}</span>
                      </div>
                    )}
                  </div>

                  {/* Refund tracking — only if order was paid */}
                  {selectedOrder.refundAmount !== undefined && (
                    <div className="space-y-2">
                      <h4 className="font-mono text-[9px] text-sky-700 uppercase tracking-widest font-extrabold">
                        {language === 'TH' ? 'การติดตามคืนเงิน' : 'Refund Tracking'}
                      </h4>
                      <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2 text-xs font-sans">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{language === 'TH' ? 'ยอดคืนเงิน:' : 'Refund Amount:'}</span>
                          <span className="font-mono font-black text-sky-800">{formatCurrency(selectedOrder.refundAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{language === 'TH' ? 'สถานะคืนเงิน:' : 'Refund Status:'}</span>
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            selectedOrder.refundStatus === 'Refund Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {language === 'TH'
                              ? selectedOrder.refundStatus === 'Refund Completed' ? 'คืนเงินแล้ว' : 'รอคืนเงิน'
                              : selectedOrder.refundStatus}
                          </span>
                        </div>
                        {selectedOrder.refundNote && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-zinc-500 shrink-0">{language === 'TH' ? 'หมายเหตุ:' : 'Note:'}</span>
                            <span className="text-zinc-700 text-right text-[11px]">{selectedOrder.refundNote}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-400 leading-relaxed pt-1 border-t border-sky-100">
                          {language === 'TH'
                            ? 'ระบบไม่ได้ดำเนินการคืนเงินอัตโนมัติ การคืนเงินจะดำเนินการภายนอกระบบ (โอนธนาคาร / เงินสด)'
                            : 'Refunds are processed manually outside this system (bank transfer / cash). Update status after completing.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* S7: Customer info — moved down, secondary reference */}
              <div className="px-4 py-3 border-b border-zinc-100 space-y-1.5">
                <h4 className="font-mono text-[9px] text-[#8B6B4F] uppercase tracking-widest font-extrabold">
                  {language === 'TH' ? 'ข้อมูลลูกค้า' : 'Customer'}
                </h4>
                <div className="p-3 bg-stone-50 border border-[#E6DFD9] rounded-xl text-xs font-sans space-y-1.5">
                  <p className="font-bold text-zinc-800">{selectedOrder.customerName}</p>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Phone size={11} className="text-[#8B6B4F]" />
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div className="flex items-center gap-1.5 text-zinc-500 truncate">
                      <Mail size={11} className="text-[#8B6B4F]" />
                      <span className="truncate">{selectedOrder.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin read-only banner */}
              {roleMode === 'Admin' && (
                <div className="px-4 py-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[10.5px] font-sans text-zinc-500">
                    <span className="text-base">🔒</span>
                    <span>
                      {language === 'TH'
                        ? 'Admin ดูข้อมูลได้อย่างเดียว — การเปลี่ยนสถานะสงวนสิทธิ์สำหรับพนักงานเท่านั้น'
                        : 'Read-only view — order status changes are reserved for Staff only.'}
                    </span>
                  </div>
                </div>
              )}

              {/* S8: Timeline — collapsible, always last */}
              <div className="px-4 py-3">
                <button
                  onClick={() => setTimelineOpen(v => !v)}
                  className="flex items-center justify-between w-full group"
                >
                  <span className="font-mono text-[9px] text-[#8B6B4F] uppercase tracking-widest font-extrabold">
                    {language === 'TH' ? 'ประวัติสถานะออเดอร์' : 'Order Timeline'}
                  </span>
                  <span className="text-zinc-400 group-hover:text-zinc-600 transition-colors">
                    {timelineOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </span>
                </button>

                {timelineOpen && (
                  <div className="mt-3 space-y-3.5 pl-2 relative before:absolute before:left-[5px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-zinc-100">
                    {selectedOrder.timeline.map((step, sIdx) => {
                      const isDone =
                        selectedOrder.status === step.status ||
                        (step.status === 'Pending Payment' && ['Paid', 'Preparing', 'Ready For Pickup', 'Queue Called', 'Completed'].includes(selectedOrder.status)) ||
                        (step.status === 'Paid' && ['Preparing', 'Ready For Pickup', 'Queue Called', 'Completed'].includes(selectedOrder.status)) ||
                        (step.status === 'Preparing' && ['Ready For Pickup', 'Queue Called', 'Completed'].includes(selectedOrder.status)) ||
                        (step.status === 'Ready For Pickup' && ['Queue Called', 'Completed'].includes(selectedOrder.status)) ||
                        (step.status === 'Queue Called' && selectedOrder.status === 'Completed') ||
                        (step.status === 'Completed' && selectedOrder.status === 'Completed');

                      const stepLabel = language === 'TH' ? (timelineLabelsTh[step.status] || step.status) : step.status;

                      return (
                        <div key={sIdx} className="flex gap-3 text-xs font-sans items-start relative">
                          <span className={`h-3 w-3 rounded-full mt-1 border-2 z-10 ${isDone ? 'bg-[#8B6B4F] border-[#8B6B4F]' : 'bg-white border-zinc-200'}`} />
                          <div>
                            <p className={`font-semibold ${isDone ? 'text-zinc-800' : 'text-zinc-400'}`}>{stepLabel}</p>
                            <p className="font-mono text-[9.5px] text-zinc-400 mt-0.5">
                              {isDone && step.time ? step.time : isDone ? (language === 'TH' ? 'เสร็จสมบูรณ์' : 'Done') : (language === 'TH' ? 'รอดำเนินการ' : 'Awaiting')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>{/* end scrollable */}
          </div>
        )}

      </div>
    </div>
  );
}
