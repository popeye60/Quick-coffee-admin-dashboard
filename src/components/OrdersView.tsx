import { useState } from 'react';
import { Order, OrderStatus, Branch, CancellationReason, RefundStatus } from '../types';
import { StatusBadge } from './DashboardView';
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
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface OrdersViewProps {
  orders: Order[];
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

const CANCELLATION_REASONS: CancellationReason[] = [
  'Customer Requested Cancellation',
  'Wrong Order Selected',
  'Out of Stock',
  'Store Unable to Fulfill',
  'Staff Error',
  'Other',
];

const CANCELLATION_REASONS_TH: Record<CancellationReason, string> = {
  'Customer Requested Cancellation': 'ลูกค้าขอยกเลิก',
  'Wrong Order Selected': 'สั่งผิดรายการ',
  'Out of Stock': 'วัตถุดิบหมด',
  'Store Unable to Fulfill': 'ร้านไม่สามารถให้บริการได้',
  'Staff Error': 'ข้อผิดพลาดจากพนักงาน',
  'Other': 'อื่นๆ',
};

export default function OrdersView({
  orders,
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

  const filteredOrders = orders.filter((order) => {
    if (activeBranch !== 'All Branches' && order.branch !== activeBranch) return false;
    if (statusFilter !== 'All Statuses' && order.status !== statusFilter) return false;
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

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleCSVExport = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  const statusOptionsEn = ['All Statuses', 'Pending Payment', 'Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Cancelled'];

  const statusOptionsTh: Record<string, string> = {
    'All Statuses': 'ทั้งหมดทุกสถานะ',
    'Pending Payment': 'รอชำระเงิน',
    'Paid': 'ชำระแล้ว',
    'Preparing': 'กำลังเตรียมเครื่องดื่ม',
    'Ready For Pickup': 'พร้อมให้บริการ',
    'Completed': 'ส่งมอบสำเร็จ',
    'Cancelled': 'ยกเลิกสินค้า'
  };

  const timelineLabelsTh: Record<string, string> = {
    'Pending Payment': 'รอชำระเงิน',
    'Paid': 'ยืนยันการชำระเงินแล้ว',
    'Preparing': 'บาริสต้าต้ม/ชง',
    'Ready For Pickup': 'เสร็จสิ้น จัดวางหิ้ง',
    'Completed': 'ส่งมอบลูกค้า'
  };

  // ─── Workflow Action Block (reused in Staff panel) ──────────────────────────
  const WorkflowActions = ({ order }: { order: Order }) => {
    // Already cancelled
    if (order.status === 'Cancelled') return null;

    // Pending Payment — failed or waiting
    if (order.status === 'Pending Payment') {
      if (order.paymentStatus === 'Failed') {
        return (
          <div className="space-y-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">❌</span>
                <p className="font-sans text-[11px] text-red-700 font-bold">
                  {language === 'TH' ? 'การชำระเงินไม่สำเร็จ' : 'Payment Failed'}
                </p>
              </div>
              {order.verificationReason && (
                <p className="font-sans text-[10px] text-red-600 leading-relaxed">{order.verificationReason}</p>
              )}
              <button
                onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                className="w-full py-1.5 border border-red-300 hover:bg-red-100 text-red-700 text-[11px] font-semibold rounded-lg font-sans transition-all text-center cursor-pointer"
              >
                {language === 'TH' ? 'ยกเลิกคำสั่งซื้อนี้' : 'Cancel Order'}
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            <p className="font-sans text-[11px] text-amber-800 font-bold">
              {language === 'TH' ? 'กำลังรอการยืนยันการชำระเงิน' : 'Waiting for Payment Confirmation'}
            </p>
          </div>
          <p className="font-sans text-[10px] text-amber-700 leading-relaxed">
            {language === 'TH'
              ? 'ระบบกำลังตรวจสอบการชำระเงินอัตโนมัติ จะอัปเดตสถานะโดยอัตโนมัติเมื่อธนาคารยืนยัน'
              : 'Auto-confirming payment via bank API. Status will update automatically once confirmed.'
            }
          </p>
        </div>
      );
    }

    // Inline cancellation form (for paid orders)
    if (showCancelForm) {
      const isPaidOrder = order.paymentStatus === 'Paid';
      return (
        <div className="space-y-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="font-sans text-[11px] font-bold text-red-800 flex items-center gap-1.5">
              <AlertCircle size={13} />
              {language === 'TH' ? 'ยืนยันการยกเลิกออเดอร์' : 'Confirm Order Cancellation'}
            </p>
            <button onClick={() => { setShowCancelForm(false); setCancelReason(''); setCancelNote(''); }} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
              <X size={13} />
            </button>
          </div>

          {isPaidOrder && (
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
                <option key={r} value={r}>{language === 'TH' ? CANCELLATION_REASONS_TH[r] : r}</option>
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
            disabled={!cancelReason}
            onClick={() => {
              if (!cancelReason) return;
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
            id="workflow-complete-btn"
            onClick={() => updateOrderStatus(order.id, 'Completed')}
            className="w-full py-2.5 bg-[#A8BB9A] hover:bg-[#8CA27D] text-white font-sans text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {language === 'TH' ? '✅ ส่งมอบเสร็จสิ้น' : '✅ Complete Order'} <ArrowRight size={13} />
          </button>
        )}

        {/* Cancel — opens form for paid orders */}
        {order.status !== 'Completed' && (
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
                    <option key={st} value={st}>{language === 'TH' ? (statusOptionsTh[st] || st) : st}</option>
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
              <span>{language === 'TH' ? 'พบคิวคัดกรองเครื่องดื่ม ' : 'Showing '}<strong className="text-zinc-700">{filteredOrders.length}</strong>{language === 'TH' ? ' รายการที่มีสิทธิ์แก้ไข' : ' available coffee queues'}</span>
              <span className="font-mono text-[10px]">{language === 'TH' ? 'ยอดที่คัดสรร' : 'Filter Match Count'}</span>
            </div>
          )}

          {/* Table */}
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
                    return (
                      <tr
                        key={order.id}
                        id={`order-row-${order.id}`}
                        onClick={() => { setSelectedOrderId(order.id); setTimelineOpen(false); setShowCancelForm(false); setCancelReason(''); setCancelNote(''); setShowRefundForm(false); setRefundNote(''); }}
                        className={`hover:bg-amber-50/10 cursor-pointer transition-colors h-[76px] ${isSelected ? 'bg-amber-50/30' : ''}`}
                      >
                        <td className={`align-middle py-2 px-4 font-sans text-xs border-l-4 transition-all ${isSelected ? 'border-l-[#8B6B4F]' : 'border-l-transparent'}`}>
                          {order.queueNo
                            ? <span className="text-[10.5px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold font-mono">
                                Q-{order.queueNo}
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
                        <td className="align-middle py-2 px-4 text-center"><StatusBadge status={order.status} /></td>
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
                  <StatusBadge status={selectedOrder.status} />
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

            {/* S2: Queue banner */}
            <div className={`px-4 py-3 text-white flex items-center justify-between shrink-0 ${
              selectedOrder.paymentStatus === 'Failed' ? 'bg-red-900' : 'bg-amber-950'
            }`}>
              <div>
                <span className="font-sans text-[9px] text-[#EAD1A8] uppercase tracking-wider block font-medium">
                  {selectedOrder.paymentStatus === 'Failed'
                    ? (language === 'TH' ? 'ชำระเงินไม่สำเร็จ' : 'Payment Failed')
                    : selectedOrder.status === 'Pending Payment'
                      ? (language === 'TH' ? 'รอยืนยันการชำระเงิน' : 'Awaiting Payment Confirmation')
                      : (language === 'TH' ? 'หมายเลขคิวทำกาแฟ' : 'Coffee Queue No.')}
                </span>
                <span className="font-mono text-2xl font-black tracking-wide leading-none">
                  {selectedOrder.status === 'Pending Payment' && selectedOrder.paymentStatus !== 'Failed'
                    ? (language === 'TH' ? 'กำลังประมวลผล...' : 'Processing...')
                    : selectedOrder.queueNo
                      ? (language === 'TH' ? `คิว: Q-${selectedOrder.queueNo}` : `Q-${selectedOrder.queueNo}`)
                      : '—'}
                </span>
              </div>
              <button className="p-1 px-2 border border-white/20 hover:border-white/50 rounded flex items-center gap-1.5 text-[10px] font-sans font-semibold shrink-0">
                <Printer size={11} /> {language === 'TH' ? 'พิมพ์ตั๋ว' : 'Print'}
              </button>
            </div>

            {/* S3: Action area — Staff only, OUTSIDE scroll, always visible */}
            {roleMode === 'Staff' && (
              <div className="px-4 py-3 border-b border-[#E6DFD9] bg-stone-50/60 shrink-0">
                <span className="font-mono text-[8.5px] text-[#8B6B4F] uppercase tracking-widest font-extrabold block mb-2">
                  {language === 'TH' ? 'ดำเนินการ' : 'Workflow Actions'}
                </span>
                <WorkflowActions order={selectedOrder} />
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
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>{language === 'TH' ? 'สถานะชำระเงิน:' : 'Payment Status:'}</span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      selectedOrder.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700'
                      : selectedOrder.paymentStatus === 'Failed' ? 'bg-red-50 text-red-700'
                      : selectedOrder.paymentStatus === 'Refunded' ? 'bg-sky-50 text-sky-700'
                      : 'bg-amber-50 text-amber-700'
                    }`}>
                      {selectedOrder.paymentStatus === 'Pending Payment' ? (language === 'TH' ? 'รอชำระ' : 'Pending')
                        : selectedOrder.paymentStatus === 'Failed' ? (language === 'TH' ? 'ล้มเหลว' : 'Failed')
                        : selectedOrder.paymentStatus}
                    </span>
                  </div>
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
              {selectedOrder.status === 'Cancelled' && selectedOrder.cancellationReason && (
                <div className="px-4 py-3 border-b border-zinc-100 space-y-2.5">
                  <h4 className="font-mono text-[9px] text-red-600 uppercase tracking-widest font-extrabold">
                    {language === 'TH' ? 'รายละเอียดการยกเลิก' : 'Cancellation Details'}
                  </h4>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs font-sans">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-zinc-500 shrink-0">{language === 'TH' ? 'เหตุผล:' : 'Reason:'}</span>
                      <span className="font-semibold text-red-800 text-right">
                        {language === 'TH' ? CANCELLATION_REASONS_TH[selectedOrder.cancellationReason] : selectedOrder.cancellationReason}
                      </span>
                    </div>
                    {selectedOrder.cancellationNote && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-zinc-500 shrink-0">{language === 'TH' ? 'หมายเหตุ:' : 'Note:'}</span>
                        <span className="text-zinc-700 text-right">{selectedOrder.cancellationNote}</span>
                      </div>
                    )}
                    {selectedOrder.cancelledBy && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">{language === 'TH' ? 'ยกเลิกโดย:' : 'Cancelled by:'}</span>
                        <span className="font-semibold text-zinc-700">{selectedOrder.cancelledBy}</span>
                      </div>
                    )}
                    {selectedOrder.cancelledAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">{language === 'TH' ? 'วันเวลา:' : 'Date & Time:'}</span>
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

                      {/* Staff: update refund status */}
                      {roleMode === 'Staff' && selectedOrder.refundStatus === 'Refund Pending' && (
                        <div className="space-y-2">
                          {!showRefundForm ? (
                            <button
                              id="open-refund-form-btn"
                              onClick={() => setShowRefundForm(true)}
                              className="w-full py-1.5 border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-lg font-sans transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <RotateCcw size={11} />
                              {language === 'TH' ? 'อัปเดตสถานะคืนเงิน' : 'Update Refund Status'}
                            </button>
                          ) : (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5">
                              <div className="flex items-center justify-between">
                                <p className="font-sans text-[11px] font-bold text-emerald-800">
                                  {language === 'TH' ? 'ยืนยันการคืนเงิน' : 'Confirm Refund Completed'}
                                </p>
                                <button onClick={() => { setShowRefundForm(false); setRefundNote(''); }} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                                  <X size={13} />
                                </button>
                              </div>
                              <textarea
                                value={refundNote}
                                onChange={e => setRefundNote(e.target.value)}
                                rows={2}
                                placeholder={language === 'TH' ? 'วิธีคืนเงิน เช่น โอนธนาคาร xxxxxxx หรือ จ่ายเงินสด...' : 'e.g. Bank transfer to account ending 1234, or cash refund given...'}
                                className="w-full text-xs py-1.5 px-2 border border-emerald-200 bg-white rounded-lg font-sans text-zinc-700 focus:outline-none resize-none"
                              />
                              <button
                                id="confirm-refund-complete-btn"
                                onClick={() => {
                                  updateRefundStatus(selectedOrder.id, 'Refund Completed', refundNote);
                                  setShowRefundForm(false);
                                  setRefundNote('');
                                }}
                                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all"
                              >
                                {language === 'TH' ? 'ยืนยัน: คืนเงินเสร็จสิ้น' : 'Mark as Refund Completed'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
                        (step.status === 'Pending Payment' && ['Paid', 'Preparing', 'Ready For Pickup', 'Completed'].includes(selectedOrder.status)) ||
                        (step.status === 'Paid' && ['Preparing', 'Ready For Pickup', 'Completed'].includes(selectedOrder.status)) ||
                        (step.status === 'Preparing' && ['Ready For Pickup', 'Completed'].includes(selectedOrder.status)) ||
                        (step.status === 'Ready For Pickup' && selectedOrder.status === 'Completed') ||
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
