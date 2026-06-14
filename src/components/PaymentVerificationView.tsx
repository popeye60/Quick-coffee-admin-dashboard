import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { 
  Check, 
  X, 
  ShieldAlert, 
  FileSearch, 
  Zap, 
  RotateCcw, 
  Layers, 
  Clock, 
  Database,
  Trash2,
  FileText,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface PaymentVerificationViewProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus, fullOrder?: Order) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  roleMode?: 'Admin' | 'Staff';
}

// 1. Initial 10 Mock records with exactly specified structures
const INITIAL_DEMO_RECORDS: Order[] = [
  {
    id: 'ORD-20260525-152',
    queueNo: '',
    customerName: 'Kanyarat S.',
    customerPhone: '081-234-5678',
    customerEmail: 'kanyarat.s@example.com',
    branch: 'Siam Square',
    status: 'Pending Payment', // Pending Verification
    amount: 180,
    time: '14:20',
    orderTime: '13 Jun 2026, 14:20',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    items: [
      { item: { id: 'c1', name: 'Hot Latte', category: 'Coffee', price: 90, status: 'Available', image: '' }, qty: 2, price: 90, total: 180 }
    ],
    timeline: [
      { status: 'Pending Payment', time: '14:20', active: true }
    ],
    note: ''
  },
  {
    id: 'ORD-20260525-153',
    queueNo: '',
    customerName: 'Natthapon J.',
    customerPhone: '089-876-5432',
    customerEmail: 'natthapon.j@example.com',
    branch: 'Central Plaza',
    status: 'Pending Payment', // Pending Verification
    amount: 165,
    time: '14:22',
    orderTime: '13 Jun 2026, 14:22',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    items: [
      { item: { id: 'c2', name: 'Iced Americano', category: 'Coffee', price: 85, status: 'Available', image: '' }, qty: 1, price: 85, total: 85 },
      { item: { id: 'b1', name: 'Croissant', category: 'Bakery', price: 80, status: 'Available', image: '' }, qty: 1, price: 80, total: 80 }
    ],
    timeline: [
      { status: 'Pending Payment', time: '14:22', active: true }
    ],
    note: 'หวานน้อยมาก / Less sweet'
  },
  {
    id: 'ORD-20260525-154',
    queueNo: '001',
    customerName: 'Supaporn M.',
    customerPhone: '085-111-2222',
    customerEmail: 'supaporn.m@example.com',
    branch: 'Mega Bangna',
    status: 'Paid', // Approved
    amount: 220,
    time: '13:58',
    orderTime: '13 Jun 2026, 13:58',
    paymentStatus: 'Paid',
    paymentMethod: 'PromptPay QR',
    items: [
      { item: { id: 'c3', name: 'Caramel Macchiato', category: 'Coffee', price: 110, status: 'Available', image: '' }, qty: 2, price: 110, total: 220 }
    ],
    timeline: [
      { status: 'Pending Payment', time: '13:58', active: true },
      { status: 'Paid', time: '14:02', active: true }
    ],
    note: ''
  },
  {
    id: 'ORD-20260525-155',
    queueNo: '',
    customerName: 'Waraporn K.',
    customerPhone: '087-333-4444',
    customerEmail: 'waraporn.k@example.com',
    branch: 'The Mall Korat',
    status: 'Cancelled', // Rejected
    amount: 195,
    time: '13:15',
    orderTime: '13 Jun 2026, 13:15',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    items: [
      { item: { id: 'c4', name: 'Matcha Latte', category: 'Beverage', price: 95, status: 'Available', image: '' }, qty: 1, price: 95, total: 95 },
      { item: { id: 'b2', name: 'Chocolate Cake', category: 'Bakery', price: 100, status: 'Available', image: '' }, qty: 1, price: 100, total: 100 }
    ],
    timeline: [
      { status: 'Pending Payment', time: '13:15', active: true },
      { status: 'Cancelled', time: '13:20', active: true }
    ],
    note: 'ขอขมเข้มข้นเขียวมัทฉะ'
  },
  {
    id: 'ORD-20260525-156',
    queueNo: '',
    customerName: 'Piti L.',
    customerPhone: '082-999-8888',
    customerEmail: 'piti.l@example.com',
    branch: 'Central Plaza',
    status: 'Pending Payment',
    amount: 95,
    time: '14:30',
    orderTime: '13 Jun 2026, 14:30',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    items: [
      { item: { id: 'c4', name: 'Matcha Latte', category: 'Beverage', price: 95, status: 'Available', image: '' }, qty: 1, price: 95, total: 95 }
    ],
    timeline: [
      { status: 'Pending Payment', time: '14:30', active: true }
    ],
    note: 'แยกน้ำแข็ง / Cup ice separate'
  },
  {
    id: 'ORD-20260525-157',
    queueNo: '',
    customerName: 'Somsak P.',
    customerPhone: '083-444-5555',
    customerEmail: 'somsak.p@example.com',
    branch: 'Siam Square',
    status: 'Pending Payment',
    amount: 270,
    time: '14:35',
    orderTime: '13 Jun 2026, 14:35',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    items: [
      { item: { id: 'c1', name: 'Hot Latte', category: 'Coffee', price: 90, status: 'Available', image: '' }, qty: 3, price: 90, total: 270 }
    ],
    timeline: [
      { status: 'Pending Payment', time: '14:35', active: true }
    ],
    note: 'แก้วกระดาษรักษ์โลก'
  },
  {
    id: 'ORD-20260525-158',
    queueNo: '001',
    customerName: 'Chaiwat S.',
    customerPhone: '084-555-6666',
    customerEmail: 'chaiwat.s@example.com',
    branch: 'Mega Bangna',
    status: 'Paid',
    amount: 180,
    time: '12:45',
    orderTime: '12 Jun 2026, 12:45',
    paymentStatus: 'Paid',
    paymentMethod: 'PromptPay QR',
    items: [
      { item: { id: 'c1', name: 'Hot Latte', category: 'Coffee', price: 90, status: 'Available', image: '' }, qty: 2, price: 90, total: 180 }
    ],
    timeline: [
      { status: 'Pending Payment', time: '12:45', active: true },
      { status: 'Paid', time: '12:46', active: true }
    ],
    note: ''
  },
  {
    id: 'ORD-20260525-159',
    queueNo: '',
    customerName: 'Kamolwan T.',
    customerPhone: '086-666-7777',
    customerEmail: 'kamolwan.t@example.com',
    branch: 'The Mall Korat',
    status: 'Pending Payment',
    amount: 345,
    time: '14:40',
    orderTime: '13 Jun 2026, 14:40',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    items: [
      { item: { id: 'c3', name: 'Caramel Macchiato', category: 'Coffee', price: 110, status: 'Available', image: '' }, qty: 2, price: 110, total: 220 },
      { item: { id: 'c2', name: 'Iced Americano', category: 'Coffee', price: 85, status: 'Available', image: '' }, qty: 1, price: 85, total: 85 },
      { item: { id: 'b1', name: 'Croissant', category: 'Bakery', price: 80, status: 'Available', image: '' }, qty: 1, price: 80, total: 80 }
    ],
    timeline: [
      { status: 'Pending Payment', time: '14:40', active: true }
    ],
    note: 'แยกวิปครีม / Keep whipped cream separate'
  },
  {
    id: 'ORD-20260525-160',
    queueNo: '',
    customerName: 'Anong N.',
    customerPhone: '088-777-8888',
    customerEmail: 'anong.n@example.com',
    branch: 'Siam Square',
    status: 'Cancelled',
    amount: 85,
    time: '11:20',
    orderTime: '13 Jun 2026, 11:20',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    items: [
      { item: { id: 'c2', name: 'Iced Americano', category: 'Coffee', price: 85, status: 'Available', image: '' }, qty: 1, price: 85, total: 85 }
    ],
    timeline: [
      { status: 'Pending Payment', time: '11:20', active: true },
      { status: 'Cancelled', time: '11:25', active: true }
    ],
    note: ''
  },
  {
    id: 'ORD-20260525-161',
    queueNo: '',
    customerName: 'Thana V.',
    customerPhone: '089-999-0000',
    customerEmail: 'thana.v@example.com',
    branch: 'Central Plaza',
    status: 'Pending Payment',
    amount: 170,
    time: '14:45',
    orderTime: '13 Jun 2026, 14:45',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    items: [
      { item: { id: 'c2', name: 'Iced Americano', category: 'Coffee', price: 85, status: 'Available', image: '' }, qty: 2, price: 85, total: 170 }
    ],
    timeline: [
      { status: 'Pending Payment', time: '14:45', active: true }
    ],
    note: 'ขอกระดาษทิชชู่เพิ่ม'
  }
];

export default function PaymentVerificationView({
  orders,
  updateOrderStatus,
  selectedOrderId,
  setSelectedOrderId,
  roleMode = 'Admin'
}: PaymentVerificationViewProps) {
  // Local state for demo mode, pre-populating with localstorage so we don't lose sample data during tab switching
  const [demoOrders, setDemoOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('quick_coffee_demo_payment_orders_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse local payment verification demo state', err);
      }
    }
    return INITIAL_DEMO_RECORDS;
  });

  // Current tab filter for the sidebar queue (Pending vs All vs Approved vs Rejected)
  const [filterType, setFilterType] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');
  
  // Custom interactive scenarios modifier mapping per order ID
  // Default is 'A': Amount Match, can be switched to 'B', 'C', 'D', 'E'
  const [selectedScenarioMap, setSelectedScenarioMap] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});

  const [rejectReason, setRejectReason] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<'approved' | 'rejected' | null>(null);
  const { language, formatCurrency } = useLanguage();

  // Save to localstorage whenever demoOrders changes to satisfy "Allow repeated testing of payment verification workflows without losing sample data"
  useEffect(() => {
    localStorage.setItem('quick_coffee_demo_payment_orders_v2', JSON.stringify(demoOrders));
  }, [demoOrders]);

  // Synchronize local demoOrders with parent orders when parent orders change
  useEffect(() => {
    let changed = false;
    const updated = demoOrders.map(demoOrd => {
      const parentOrd = orders.find(o => o.id === demoOrd.id);
      if (parentOrd) {
        if (
          demoOrd.status !== parentOrd.status ||
          demoOrd.paymentStatus !== parentOrd.paymentStatus ||
          JSON.stringify(demoOrd.timeline) !== JSON.stringify(parentOrd.timeline)
        ) {
          changed = true;
          return {
            ...demoOrd,
            status: parentOrd.status,
            paymentStatus: parentOrd.paymentStatus,
            timeline: parentOrd.timeline,
            queueNo: parentOrd.queueNo || demoOrd.queueNo
          };
        }
      }
      return demoOrd;
    });

    if (changed) {
      setDemoOrders(updated);
    }
  }, [orders]);

  // ── Auto-verification metrics ──────────────────────────────────────────────
  // Sync parent order verificationStatus back into demoOrders for display
  const enrichedDemoOrders = demoOrders.map(demo => {
    const parent = orders.find(o => o.id === demo.id);
    if (parent?.verificationStatus && !demo.verificationStatus) {
      return { ...demo, verificationStatus: parent.verificationStatus, verificationResult: parent.verificationResult, verificationReason: parent.verificationReason, autoVerifiedAt: parent.autoVerifiedAt };
    }
    return demo;
  });

  const autoApprovedOrders = [...orders, ...enrichedDemoOrders.filter(d => !orders.some(o => o.id === d.id))]
    .filter(o => o.verificationStatus === 'auto_approved');
  const autoApprovedCount = autoApprovedOrders.length;

  // pendingReview = Pending Payment orders that still need manual check
  // (either flagged as pending_review by auto-verifier, or have no verificationStatus yet)
  const pendingOrders = enrichedDemoOrders.filter(o =>
    o.status === 'Pending Payment' &&
    (o.verificationStatus === 'pending_review' || !o.verificationStatus)
  );
  const approvedOrders = enrichedDemoOrders.filter(o => ['Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Queue Called'].includes(o.status));
  const rejectedOrders = enrichedDemoOrders.filter(o => o.status === 'Cancelled' || o.paymentStatus === 'Rejected');

  const totalProcessed = autoApprovedCount + approvedOrders.length + rejectedOrders.length;
  const successRate = totalProcessed > 0
    ? Math.round(((autoApprovedCount + approvedOrders.length) / totalProcessed) * 100)
    : 0;

  // Compute what goes to the sidebar view depending on sidebar filter selection
  const visibleOrders = enrichedDemoOrders.filter(o => {
    if (filterType === 'Pending') return (
      o.status === 'Pending Payment' &&
      (o.verificationStatus === 'pending_review' || !o.verificationStatus)
    );
    if (filterType === 'Approved') return ['Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Queue Called'].includes(o.status);
    if (filterType === 'Rejected') return o.status === 'Cancelled' || o.paymentStatus === 'Rejected';
    return true; // "All"
  });

  // Ensure an order is selected
  // Fallback pattern: if selectedOrderId is valid and matches visible list, keep it. Otherwise, look for first record in the current filtered list.
  const activeOrderId = (selectedOrderId && visibleOrders.some(o => o.id === selectedOrderId))
    ? selectedOrderId
    : (visibleOrders[0]?.id || null);

  const selectedOrder = demoOrders.find(o => o.id === activeOrderId);

  // Quick Action: Approve
  const handleApprove = () => {
    if (!selectedOrder) return;
    
    // 1. Update local state
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Generate branch-specific 3-digit queue number if not already assigned
    let assignedQueue = selectedOrder.queueNo;
    if (!assignedQueue || assignedQueue.trim() === '') {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const parseDateFromOrderTime = (t: string): string => {
        const months: Record<string, string> = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
        const m = t.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})/);
        return m ? `${m[3]}-${months[m[2]] ?? '00'}-${m[1].padStart(2, '0')}` : '';
      };
      const branchQueues = [...demoOrders, ...orders]
        .filter(o => o.branch === selectedOrder.branch && o.queueNo !== '' && parseDateFromOrderTime(o.orderTime) === todayStr)
        .map(o => parseInt(o.queueNo, 10))
        .filter(v => !isNaN(v));
      const maxQueue = branchQueues.length > 0 ? Math.max(...branchQueues) : 0;
      assignedQueue = String(maxQueue + 1).padStart(3, '0');
    }

    const updated = demoOrders.map(o => {
      if (o.id === selectedOrder.id) {
        // Build active timeline steps
        const updatedTimeline = [...o.timeline];
        
        // Ensure paid/preparing are present and active
        const paidStepIdx = updatedTimeline.findIndex(t => t.status === 'Paid');
        if (paidStepIdx >= 0) {
          updatedTimeline[paidStepIdx] = { status: 'Paid', time: nowTime, active: true };
        } else {
          updatedTimeline.push({ status: 'Paid', time: nowTime, active: true });
        }

        const prepStepIdx = updatedTimeline.findIndex(t => t.status === 'Preparing');
        if (prepStepIdx >= 0) {
          updatedTimeline[prepStepIdx] = { status: 'Preparing', time: nowTime, active: true };
        } else {
          updatedTimeline.push({ status: 'Preparing', time: nowTime, active: true });
        }

        return {
          ...o,
          queueNo: assignedQueue,
          status: 'Preparing' as OrderStatus,
          paymentStatus: 'Paid' as const,
          timeline: updatedTimeline,
          note: o.note ? o.note.replace(/Rejected:[^|]+/g, '').trim() : ''
        };
      }
      return o;
    });
    setDemoOrders(updated);

    const resultingOrder = updated.find(o => o.id === selectedOrder.id);

    // 2. Synchronize back to parent securely
    try {
      if (resultingOrder) {
        updateOrderStatus(selectedOrder.id, 'Preparing', resultingOrder);
      } else {
        updateOrderStatus(selectedOrder.id, 'Preparing');
      }
    } catch (e) {
      console.warn('Parent sync failed', e);
    }

    const nextVisible = updated.filter(o => {
      if (filterType === 'Pending') return o.status === 'Pending Payment';
      if (filterType === 'Approved') return ['Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Queue Called'].includes(o.status);
      if (filterType === 'Rejected') return o.status === 'Cancelled' || o.paymentStatus === 'Rejected';
      return true;
    }).filter(o => o.id !== selectedOrder.id);

    setActionSuccess('approved');
    setTimeout(() => {
      setActionSuccess(null);
      // Auto-select next item in visible sidebar list from freshly updated state
      if (nextVisible.length > 0) {
        setSelectedOrderId(nextVisible[0].id);
      } else {
        setSelectedOrderId(null);
      }
    }, 1800);
  };

  // Quick Action: Reject
  const handleReject = () => {
    if (!selectedOrder) return;

    // 1. Update local state
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    const updated = demoOrders.map(o => {
      if (o.id === selectedOrder.id) {
        const updatedTimeline = [...o.timeline];
        
        // Mark Cancelled step active for visual audit
        const cancelIdx = updatedTimeline.findIndex(t => t.status === 'Cancelled');
        if (cancelIdx >= 0) {
          updatedTimeline[cancelIdx] = { status: 'Cancelled', time: nowTime, active: true };
        } else {
          updatedTimeline.push({ status: 'Cancelled', time: nowTime, active: true });
        }

        return {
          ...o,
          status: 'Pending Payment' as OrderStatus,
          paymentStatus: 'Rejected' as any,
          timeline: updatedTimeline,
          note: rejectReason ? `Rejected: ${rejectReason}` : 'Rejected'
        };
      }
      return o;
    });
    setDemoOrders(updated);

    const resultingOrder = updated.find(o => o.id === selectedOrder.id);

    // 2. Synchronize back to parent securely
    try {
      if (resultingOrder) {
        updateOrderStatus(selectedOrder.id, 'Pending Payment', resultingOrder);
      } else {
        updateOrderStatus(selectedOrder.id, 'Pending Payment');
      }
    } catch (e) {
      console.warn('Parent sync failed', e);
    }

    const nextVisible = updated.filter(o => {
      if (filterType === 'Pending') return o.status === 'Pending Payment';
      if (filterType === 'Approved') return ['Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Queue Called'].includes(o.status);
      if (filterType === 'Rejected') return o.status === 'Cancelled' || o.paymentStatus === 'Rejected';
      return true;
    }).filter(o => o.id !== selectedOrder.id);

    setShowRejectModal(false);
    setActionSuccess('rejected');
    setRejectReason('');
    setSelectedReasons([]);

    setTimeout(() => {
      setActionSuccess(null);
      if (nextVisible.length > 0) {
        setSelectedOrderId(nextVisible[0].id);
      } else {
        setSelectedOrderId(null);
      }
    }, 1800);
  };

  // Simulates standard client action: Upload a new correct slip
  const handleCustomerReupload = () => {
    if (!selectedOrder) return;
    
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const updated = demoOrders.map(o => {
      if (o.id === selectedOrder.id) {
        return {
          ...o,
          status: 'Pending Payment' as OrderStatus,
          paymentStatus: 'Pending Payment' as any,
          note: `Customer re-uploaded new correct slip at ${nowTime}`
        };
      }
      return o;
    });
    setDemoOrders(updated);
    setSelectedScenarioMap(prev => ({ ...prev, [selectedOrder.id]: 'A' })); // reset scenario to A (Match) for subsequent approve

    const resultingOrder = updated.find(o => o.id === selectedOrder.id);
    try {
      if (resultingOrder) {
        updateOrderStatus(selectedOrder.id, 'Pending Payment', resultingOrder);
      }
    } catch (e) {
      console.warn('Parent sync failed for reupload', e);
    }
  };

  // 2. Reset Demo Data handler with custom React Modal Confirmation
  const handleResetDemoData = () => {
    setDemoOrders(INITIAL_DEMO_RECORDS);
    setSelectedScenarioMap({});
    setSelectedOrderId(INITIAL_DEMO_RECORDS[0].id);
    setFilterType('Pending');
    localStorage.setItem('quick_coffee_demo_payment_orders_v2', JSON.stringify(INITIAL_DEMO_RECORDS));
    setShowResetConfirm(false);
  };

  // 4. Auto Regenerate 10 New Samples option
  const handleRegenerateRandomSamples = () => {
    const thaiNames = [
      'Kanyarat S.', 'Natthapon J.', 'Somchai K.', 'Teerapat M.', 'Chaloemchai P.', 
      'Piyanut A.', 'Varanya S.', 'Artit T.', 'Nutcha M.', 'Siriwan O.', 
      'Thongchai B.', 'Wipawee Y.', 'Kittisak R.', 'Pornpen J.', 'Yutthana N.'
    ];
    const branchList = ['Central Plaza', 'Siam Square', 'Mega Bangna', 'The Mall Korat'] as const;
    const itemMenuPresets = [
      { name: 'Hot Latte', price: 90, category: 'Coffee' },
      { name: 'Iced Americano', price: 85, category: 'Coffee' },
      { name: 'Caramel Macchiato', price: 110, category: 'Coffee' },
      { name: 'Matcha Latte', price: 95, category: 'Beverage' },
      { name: 'Croissant', price: 80, category: 'Bakery' },
      { name: 'Chocolate Cake', price: 100, category: 'Bakery' }
    ];

    const generated: Order[] = Array.from({ length: 10 }).map((_, idx) => {
      const orderNum = 162 + idx;
      const orderId = `ORD-20260525-${orderNum}`;
      const name = thaiNames[Math.floor(Math.random() * thaiNames.length)];
      const branch = branchList[Math.floor(Math.random() * branchList.length)];
      const randomItem = itemMenuPresets[Math.floor(Math.random() * itemMenuPresets.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      const amount = randomItem.price * qty;

      const randomHour = String(Math.floor(Math.random() * 5) + 10).padStart(2, '0');
      const randomMinute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const timeStr = `${randomHour}:${randomMinute}`;

      return {
        id: orderId,
        queueNo: '',
        customerName: name,
        customerPhone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
        customerEmail: `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        branch: branch,
        status: 'Pending Payment',
        amount: amount,
        time: timeStr,
        orderTime: `13 Jun 2026, ${timeStr}`,
        paymentStatus: 'Pending Payment',
        paymentMethod: 'PromptPay QR',
        items: [
          { 
            item: { id: `g${idx}`, name: randomItem.name, category: randomItem.category as any, price: randomItem.price, status: 'Available', image: '' }, 
            qty, 
            price: randomItem.price, 
            total: amount 
          }
        ],
        timeline: [
          { status: 'Pending Payment', time: timeStr, active: true }
        ],
        note: Math.random() > 0.8 ? 'ขอหวานๆ / More syrup' : ''
      };
    });

    setDemoOrders(generated);
    setSelectedScenarioMap({});
    setFilterType('Pending');
    if (generated.length > 0) {
      setSelectedOrderId(generated[0].id);
    }
  };

  // 6. Developer utility features
  const handleGenerate50Records = () => {
    const thaiNames = ['Pornchai S.', 'Wipa G.', 'Somporn K.', 'Thawat L.', 'Anchalee B.', 'Methee T.', 'Penchan W.'];
    const branchList = ['Central Plaza', 'Siam Square', 'Mega Bangna', 'The Mall Korat'] as const;
    
    const extra50: Order[] = Array.from({ length: 50 }).map((_, idx) => {
      const orderNum = 200 + idx;
      const orderId = `ORD-20260525-${orderNum}`;
      const name = thaiNames[idx % thaiNames.length] + ' ' + String.fromCharCode(65 + (idx % 26)) + '.';
      const branch = branchList[idx % branchList.length];
      const amount = 85 + (idx % 4) * 20;
      
      return {
        id: orderId,
        queueNo: '',
        customerName: name,
        customerPhone: '081-300-4752',
        customerEmail: 'volume_test@quickcoffee.com',
        branch: branch,
        status: 'Pending Payment',
        amount: amount,
        time: `11:${String(idx % 60).padStart(2, '0')}`,
        orderTime: `13 Jun 2026, 11:${String(idx % 60).padStart(2, '0')}`,
        paymentStatus: 'Pending Payment',
        paymentMethod: 'PromptPay QR',
        items: [
          { item: { id: 'temp', name: 'Signature Iced Coffee', category: 'Coffee', price: amount, status: 'Available', image: '' }, qty: 1, price: amount, total: amount }
        ],
        timeline: [
          { status: 'Pending Payment', time: `11:${String(idx % 60).padStart(2, '0')}`, active: true }
        ],
        note: 'High-Volume Queue Load Test'
      };
    });

    setDemoOrders(prev => [...prev, ...extra50]);
    setFilterType('Pending');
    setSelectedOrderId(extra50[0].id);
  };

  const handleClearDemoData = () => {
    setDemoOrders([]);
    setSelectedOrderId(null);
  };

  const handleGenerateMockSlips = () => {
    // Distribute random simulation scenarios to currently pending orders
    const scenarios: Array<'A' | 'B' | 'C' | 'D' | 'E'> = ['A', 'B', 'C', 'D', 'E'];
    const updatedMap: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'> = {};
    pendingOrders.forEach((o, index) => {
      updatedMap[o.id] = scenarios[index % scenarios.length];
    });
    setSelectedScenarioMap(updatedMap);
  };

  return (
    <div className="p-6 font-sans space-y-5">

      {/* Auto-Verification Engine Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-1.5 bg-emerald-100 rounded-lg shrink-0"><Zap size={14} className="text-emerald-700" /></div>
          <div>
            <p className="font-mono text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider">{language === 'TH' ? 'อนุมัติอัตโนมัติ' : 'Auto Approved'}</p>
            <p className="font-mono text-xl font-black text-emerald-800 leading-none mt-0.5">{autoApprovedCount}</p>
            <p className="font-sans text-[9px] text-emerald-500 mt-0.5">{language === 'TH' ? 'ไม่ต้องตรวจสอบด้วยมือ' : 'No manual review needed'}</p>
          </div>
        </div>

        <div className={`border rounded-xl p-3.5 flex items-start gap-3 ${pendingOrders.length > 0 ? 'bg-amber-50 border-amber-100' : 'bg-stone-50 border-stone-100'}`}>
          <div className={`p-1.5 rounded-lg shrink-0 ${pendingOrders.length > 0 ? 'bg-amber-100' : 'bg-stone-100'}`}>
            <ShieldAlert size={14} className={pendingOrders.length > 0 ? 'text-amber-700' : 'text-zinc-400'} />
          </div>
          <div>
            <p className="font-mono text-[9px] text-amber-600 font-extrabold uppercase tracking-wider">{language === 'TH' ? 'รอตรวจสอบ' : 'Manual Review'}</p>
            <p className={`font-mono text-xl font-black leading-none mt-0.5 ${pendingOrders.length > 0 ? 'text-amber-800' : 'text-zinc-400'}`}>{pendingOrders.length}</p>
            <p className="font-sans text-[9px] text-amber-500 mt-0.5">{language === 'TH' ? 'ต้องการการตรวจสอบ' : 'Requires staff action'}</p>
          </div>
        </div>

        <div className="bg-[#FDFBF7] border border-[#E6DFD9] rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-1.5 bg-[#F5EDE3] rounded-lg shrink-0"><FileSearch size={14} className="text-[#8B6B4F]" /></div>
          <div>
            <p className="font-mono text-[9px] text-[#8B6B4F] font-extrabold uppercase tracking-wider">{language === 'TH' ? 'อัตราสำเร็จ' : 'Success Rate'}</p>
            <p className="font-mono text-xl font-black text-[#2E2A25] leading-none mt-0.5">{successRate}%</p>
            <p className="font-sans text-[9px] text-zinc-400 mt-0.5">{language === 'TH' ? 'ยืนยันสำเร็จทั้งหมด' : 'All verifications'}</p>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-1.5 bg-sky-100 rounded-lg shrink-0"><Layers size={14} className="text-sky-700" /></div>
          <div>
            <p className="font-mono text-[9px] text-sky-600 font-extrabold uppercase tracking-wider">{language === 'TH' ? 'ผู้ให้บริการ' : 'Active Provider'}</p>
            <p className="font-sans text-[11px] font-black text-sky-800 leading-tight mt-0.5">PromptPay</p>
            <p className="font-sans text-[9px] text-sky-500 mt-0.5">K-PLUS API Mock</p>
          </div>
        </div>
      </div>

      {/* 1. LAYOUT IMPROVEMENTS: Left sidebar queue takes exactly 40% (lg:col-span-4), Right panel takes 60% (lg:col-span-6) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 animate-fade-in">
        
        {/* Left Panel: Auditing Slips Queue (40% width) */}
        <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E6DFD9] rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between h-[80vh]">
          <div>
            <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-sans font-bold text-sm text-[#2E2A25] flex items-center gap-1.5">
                  <Database size={15} className="text-[#8B6B4F]" />
                  <span>{language === 'TH' ? 'รายการคิวสลิปทั้งหมด' : 'Auditing Queue'}</span>
                </h3>
                <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest animate-pulse">
                  {pendingOrders.length} {language === 'TH' ? 'รอยืนยัน' : 'Pending'}
                </span>
              </div>

              {/* Filtering tabs inside Sidebar Queue list */}
              <div className="grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-xl text-[10.5px]">
                {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((tab) => {
                  const isActive = filterType === tab;
                  const count = tab === 'Pending' ? pendingOrders.length :
                                tab === 'Approved' ? approvedOrders.length :
                                tab === 'Rejected' ? rejectedOrders.length :
                                demoOrders.length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setFilterType(tab)}
                      className={`py-1.5 rounded-lg text-center transition-all font-bold cursor-pointer ${
                        isActive 
                          ? 'bg-white text-[#2E2A25] shadow-xs' 
                          : 'text-zinc-500 hover:text-zinc-800 hover:bg-stone-50'
                      }`}
                    >
                      <span className="block leading-none">{tab}</span>
                      <span className="font-mono text-[9px] text-[#8B6B4F] font-black">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-zinc-100 h-[52vh] overflow-y-auto custom-scrollbar">
              {visibleOrders.length === 0 ? (
                <div className="p-8 text-center font-sans space-y-3.5 flex flex-col items-center justify-center h-full">
                  <div className="text-4xl text-center">🎉</div>
                  <div>
                    <p className="font-bold text-zinc-700 text-xs">
                      {language === 'TH' 
                        ? `ไม่มีออเดอร์ในหมวด [${filterType}]`
                        : `No ${filterType} orders found`
                      }
                    </p>
                    <p className="text-[10.5px] text-zinc-400 mt-1 max-w-xs leading-normal">
                      {language === 'TH' 
                        ? 'ไม่พบคิวสติกเกอร์ชำระเงินที่ต้องการ ลองสลับฟิลเตอร์อื่นหรือสร้างข้อมูลใหม่ด่วน' 
                        : 'No records match this status. Filter dynamically of trigger the auto-regenerator below.'
                      }
                    </p>
                  </div>
                  
                  {/* 4. AUTO REGENERATE OPTION BUTTON when pending processed */}
                  {filterType === 'Pending' && pendingOrders.length === 0 && (
                    <button
                      id="regen-empty-btn"
                      onClick={handleRegenerateRandomSamples}
                      className="py-2 px-3.5 bg-[#8B6B4F] hover:bg-[#72553C] text-white text-xs font-bold rounded-xl transition-all shadow-4xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Sparkles size={11} className="fill-white" />
                      <span>{language === 'TH' ? 'สร้างข้อมูลตัวอย่างใหม่' : 'Generate New Samples'}</span>
                    </button>
                  )}
                </div>
              ) : (
                visibleOrders.map((order) => {
                  const isActive = order.id === activeOrderId;
                  
                  // Color codes for different list states
                  const isApproved = ['Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Queue Called'].includes(order.status);
                  const isRejected = !isApproved && (order.status === 'Cancelled' || order.paymentStatus === 'Rejected');

                  let statusBadgeClass = "bg-stone-100 text-stone-600";
                  let statusBadgeText = "PENDING";

                  if (isApproved) {
                    statusBadgeClass = "bg-emerald-50 text-emerald-700";
                    statusBadgeText = "VERIFIED";
                  } else if (isRejected) {
                    statusBadgeClass = "bg-red-50 text-red-700";
                    statusBadgeText = "REJECTED";
                  }

                  return (
                    <div
                      key={order.id}
                      id={`verification-item-${order.id}`}
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setActionSuccess(null);
                      }}
                      className={`p-3.5 hover:bg-stone-50/50 cursor-pointer transition-all border-l-4 ${
                        isActive 
                          ? 'bg-amber-50/20 border-[#8B6B4F] shadow-4xs' 
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-black text-zinc-800 tracking-wider font-semibold">{order.id}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded ${statusBadgeClass}`}>
                            {statusBadgeText}
                          </span>
                          <span className="font-mono text-xs font-black text-[#8B6B4F]">{formatCurrency(order.amount)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs font-sans">
                        <div>
                          <span className="text-zinc-700 font-bold block leading-tight">{order.customerName}</span>
                          <span className="text-zinc-400 text-[10px] font-medium block mt-0.5">{order.branch}</span>
                        </div>
                        <span className="font-mono text-[9px] text-zinc-400 font-bold bg-stone-100 px-1 py-0.5 rounded">{order.time}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="p-4 bg-stone-50/80 border-t text-[10.5px] text-zinc-450 font-medium">
            💡 {language === 'TH' ? 'คลิกที่รายการด้านบนเพื่อเปิดรายละเอียดสลิปและใบสั่งซื้อ' : 'Active queue is updated live when other systems publish receipts.'}
          </div>
        </div>

        {/* Right Side: Slip Inspection and Approval Center (60% width) */}
        <div className="lg:col-span-6 space-y-4 h-[80vh] flex flex-col justify-start">
          {actionSuccess ? (
            <div className="flex-1 bg-[#FFFFFF] border border-[#E6DFD9] rounded-2xl flex flex-col items-center justify-center text-center p-8 shadow-xs">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl mb-4 animate-bounce ${
                actionSuccess === 'approved' ? 'bg-[#A8BB9A]' : 'bg-red-500'
              }`}>
                {actionSuccess === 'approved' ? '✓' : '✗'}
              </div>
              <h3 className="font-sans font-extrabold text-base text-[#2E2A25]">
                {actionSuccess === 'approved' 
                  ? (language === 'TH' ? 'ยืนยันใบเสร็จโอนเงินสำเร็จ!' : 'Payment Slip Verified!')
                  : (language === 'TH' ? 'ปฏิเสธใบเสร็จโอนเงินสำเร็จ' : 'Payment Slip Rejected')
                }
              </h3>
              <p className="font-sans text-xs text-zinc-500 mt-1.5 max-w-sm leading-relaxed">
                {actionSuccess === 'approved' 
                  ? (language === 'TH' ? 'เรียบร้อย! ข้อมูลอัปเดตสถานะเป็น "ชำระเงินแล้ว" ห้องครัวบาริสต้าเริ่มปฏิบัติการชงได้ทันที' : 'The associated order has been marked as PAID/APPROVED. Kitchen staff queue updated.')
                  : (language === 'TH' ? 'จำลองยกเลิกสำเร็จ บิลหลักเปลี่ยนเป็นยกเลิกและส่งคืนข้อมูลเหตุผลความคลาดเคลื่อนกลับสู่ลูกค้า' : 'The associated order has been cancelled and safety comments posted to the transaction line.')
                }
              </p>
              <div className="mt-6 flex items-center gap-2 bg-stone-50 border px-4 py-2 rounded-lg text-xs text-zinc-500 font-mono shadow-4xs">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" /> {language === 'TH' ? 'สลับตรวจรายการข้ออื่นอัตโนมัติ...' : 'Loading next queue item for audit...'}
              </div>
            </div>
          ) : selectedOrder ? (
            <div className="bg-[#FFFFFF] border border-[#E6DFD9] rounded-2xl overflow-hidden shadow-xs flex-1 flex flex-col justify-between">
              
              <div>
                {/* Slip Audit Header */}
                <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-sans font-bold text-sm text-[#2E2A25] flex items-center gap-1.5">
                      <FileSearch size={16} className="text-[#8B6B4F]" />
                      <span>{language === 'TH' ? 'งานตรวจสอบธุรกรรมการโอน:' : 'Transaction Audit:'} {selectedOrder.id}</span>
                    </h3>
                    <p className="font-sans text-[11px] text-zinc-500 mt-0.5">{language === 'TH' ? 'สาขาการชง:' : 'Outlet point:'} <span className="font-bold text-[#8B6B4F]">{selectedOrder.branch}</span></p>
                  </div>
                  <div className="bg-amber-50 text-amber-950 px-4 py-2 rounded-lg border border-amber-200/40 text-center flex flex-col justify-center min-w-[110px] shrink-0">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase leading-tight mb-1">{language === 'TH' ? 'ยอดคำสั่งซื้อ' : 'Order Amount'}</span>
                    <strong className="font-mono text-xs font-black">{formatCurrency(selectedOrder.amount)}</strong>
                  </div>
                </div>

                {/* Main Split Layout: Slip Preview vs Verification Details */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* 2. Visual Receipt Slip Area - Allocated less space (md:col-span-4) than before */}
                  <div className="md:col-span-4 flex flex-col justify-start items-center">
                    
                    {/* The green bank receipt container with conditional scenario modifiers */}
                    {(() => {
                      const activeScenario = selectedScenarioMap[selectedOrder.id] || 'A';
                      const isApproved = ['Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Queue Called'].includes(selectedOrder.status);
                      
                      // Scenario E: Blurred receipt trigger classes
                      const isBlurred = !isApproved && activeScenario === 'E';
                      
                      // Dynamic amounts based on mismatch scenario B
                      const receiptAmount = (!isApproved && activeScenario === 'B') 
                        ? (selectedOrder.amount - 30 > 0 ? selectedOrder.amount - 30 : 150) 
                        : selectedOrder.amount;

                      // Timestamp overrides for stale date/time scenario D
                      const overrideTime = (!isApproved && activeScenario === 'D') 
                        ? '12 Jun 2026, 09:12' // Old date
                        : selectedOrder.orderTime || '13 Jun 2026';

                      return (
                        <div className="w-full max-w-[190px] bg-[#EBF9F1] p-3 rounded-2xl border border-emerald-100 shadow-xs relative overflow-hidden select-none">
                          
                          {/* Inner receipt card paper wrapper */}
                          <div className={`bg-[#FFFFFF] p-3 rounded-xl shadow-xs space-y-3 text-[10px] transition-all relative ${
                            isBlurred ? 'blur-[3.5px] opacity-40 select-none pointer-events-none' : ''
                          }`}>
                            
                            {/* Thai Kasikorn style header */}
                            <div className="flex items-center justify-between border-b pb-2 border-zinc-100">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-[#13C562] flex items-center justify-center font-bold text-white text-[9px] tracking-tighter">
                                  K
                                </div>
                                <div className="leading-tight">
                                  <p className="font-sans font-bold text-[#13C562] text-[9px] leading-none mb-0.5">K PLUS</p>
                                  <p className="text-[6.5px] text-zinc-400 font-mono">E-RECEIPT</p>
                                </div>
                              </div>
                              <Check size={11} className="text-[#13C562] stroke-[3]" />
                            </div>

                            {/* Success Check status overlay */}
                            <div className="text-center py-0.5">
                              <p className="font-sans font-bold text-[#13C562] text-[10px] uppercase tracking-wide">โอนเงินสำเร็จ</p>
                              <p className="font-mono text-[7.5px] text-zinc-400 mt-0.5">{overrideTime}</p>
                            </div>

                            {/* Transaction entries */}
                            <div className="space-y-2 font-sans text-[8.5px]">
                              
                              {/* Sender */}
                              <div className="flex items-start gap-1">
                                <span className="w-1 h-1 rounded-full bg-zinc-300 mt-1 shrink-0" />
                                <div>
                                  <span className="text-zinc-400 block text-[7.5px] leading-none mb-0.5">ผู้โอน (Sender)</span>
                                  <span className="font-bold text-zinc-800 block leading-none">{selectedOrder.customerName}</span>
                                  <p className="font-mono text-[7px] text-zinc-400">xxx-x-x6302-x</p>
                                </div>
                              </div>

                              {/* Receiver */}
                              <div className="flex items-start gap-1">
                                <span className="w-1 h-1 rounded-full bg-[#13C562] mt-1 shrink-0" />
                                <div>
                                  <span className="text-[#13C562] block text-[7.5px] leading-none mb-0.5 font-bold">ผู้รับโอน (Receiver)</span>
                                  <span className="font-bold text-zinc-800 block leading-none">Quick Coffee Co., Ltd.</span>
                                  <p className="text-[7px] text-zinc-450 font-mono">PromptPay ID 09-xx412</p>
                                </div>
                              </div>
                              
                              {/* Ref details */}
                              <div className="border-t border-dashed border-zinc-100 pt-1.5 space-y-0.5 font-mono text-[7.5px] text-zinc-400">
                                <div className="flex justify-between">
                                  <span>Ref No:</span>
                                  <span className="font-bold text-zinc-700">TXN93284752TH</span>
                                </div>
                                <div className="flex justify-between font-sans">
                                  <span>Status:</span>
                                  <span className={`font-bold px-1 rounded text-[7px] ${
                                    (isApproved || activeScenario === 'A') ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-rose-50'
                                  }`}>
                                    {isApproved ? 'VERIFIED' : activeScenario === 'A' ? 'MATCHED' : activeScenario === 'C' ? 'DUPLICATE' : 'AUDIT_WARN'}
                                  </span>
                                </div>
                              </div>

                              {/* Money block */}
                              <div className="pt-1.5 border-t border-zinc-100 text-center">
                                <span className="font-sans text-[7.5px] text-zinc-400 block uppercase font-medium">จำนวนเงิน (Amount Transferred)</span>
                                <span className="font-mono text-xs font-black text-[#13C562] tracking-tight">
                                  {formatCurrency(receiptAmount)}
                                </span>
                              </div>

                            </div>

                          </div>

                          {/* Stamp warning overlays for non-A scenarios */}
                          {!isBlurred && activeScenario !== 'A' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                              <div className="border-[2px] border-red-500 bg-white/95 text-red-600 font-mono font-black text-[9px] py-1 px-2 rounded-lg origin-center rotate-12 shadow-md uppercase text-center space-y-0.5">
                                <div>⚠️ Warning Stamp</div>
                                <div className="text-[8px] tracking-tight">{
                                  activeScenario === 'B' ? 'MISMATCH AMOUNT' :
                                  activeScenario === 'C' ? 'DUPLICATE REFERENCE' :
                                  'STALE DATE DETECTED'
                                }</div>
                              </div>
                            </div>
                          )}

                          {/* Scenario E: Blurred display notice */}
                          {isBlurred && (
                            <div className="absolute inset-x-0 top-1/3 bottom-10 flex flex-col items-center justify-center p-3 text-center bg-zinc-900/10 backdrop-blur-[1px] rounded-lg">
                              <AlertTriangle size={17} className="text-red-600 animate-bounce" />
                              <span className="font-sans font-black text-[9.5px] text-red-900 bg-white border border-red-100 py-1 px-1.5 rounded shadow-sm mt-1 uppercase">
                                Blurred Receipt
                              </span>
                            </div>
                          )}

                          {/* Security footer stamp overlay */}
                          <div className="mt-2.5 flex items-center justify-center gap-1 font-sans text-[8px] text-[#8CA27D] font-bold">
                            🛡️ Secured by K-PLUS Verification API
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 3. Verification & Order Details Area - Allocated more space (md:col-span-8) */}
                  <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                    
                    <div className="space-y-3 font-sans text-xs">
                      
                      {/* Basic Order Identifiers */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-2 bg-stone-50 border border-stone-100 rounded-xl">
                          <span className="text-zinc-400 block text-[9px] font-semibold leading-none mb-1">{language === 'TH' ? 'หมายเลขลูกค้า (Queue)' : 'Order Queue ID'}</span>
                          <strong className="text-zinc-800 text-sm font-mono font-black">Q-{selectedOrder.queueNo}</strong>
                        </div>
                        <div className="p-2 bg-stone-50 border border-stone-100 rounded-xl">
                          <span className="text-zinc-400 block text-[9px] font-semibold leading-none mb-1">{language === 'TH' ? 'เวลาขอสั่ง' : 'Order Placed Time'}</span>
                          <strong className="text-zinc-700 font-mono font-black text-xs leading-none">{selectedOrder.time}</strong>
                        </div>
                      </div>

                      {/* 3. DEDICATED AMOUNT VERIFICATION SECTION */}
                      {(() => {
                        const activeScenario = selectedScenarioMap[selectedOrder.id] || 'A';
                        const isApproved = ['Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Queue Called'].includes(selectedOrder.status);
                        
                        // Slip Amount and Verification Status depend heavily on scenario selection
                        let renderedSlipAmountLabel = formatCurrency(selectedOrder.amount);
                        let verificationBadgeLabel = 'Matched';
                        let verificationStyleClass = 'bg-emerald-50 border-emerald-100 text-emerald-800';
                        let indicatorLightClass = 'bg-emerald-500';

                        if (isApproved) {
                          verificationBadgeLabel = 'Verified';
                          verificationStyleClass = 'bg-emerald-50 border-emerald-100 text-emerald-800 font-bold';
                          indicatorLightClass = 'bg-emerald-500';
                        } else if (activeScenario === 'B') {
                          const mismatchAmount = selectedOrder.amount - 30 > 0 ? selectedOrder.amount - 30 : 150;
                          renderedSlipAmountLabel = formatCurrency(mismatchAmount);
                          verificationBadgeLabel = 'Mismatch';
                          verificationStyleClass = 'bg-red-50 border-red-100 text-red-800 font-black animate-pulse';
                          indicatorLightClass = 'bg-red-500';
                        } else if (activeScenario === 'C') {
                          verificationBadgeLabel = 'Duplicate Slip';
                          verificationStyleClass = 'bg-red-50 border-red-150 text-red-900 font-black animate-pulse';
                          indicatorLightClass = 'bg-red-500';
                        } else if (activeScenario === 'D') {
                          verificationBadgeLabel = 'Wrong Date/Time';
                          verificationStyleClass = 'bg-amber-50 border-amber-200 text-amber-950 font-black';
                          indicatorLightClass = 'bg-yellow-500';
                        } else if (activeScenario === 'E') {
                          renderedSlipAmountLabel = '฿--.--';
                          verificationBadgeLabel = 'Inv. Receipt';
                          verificationStyleClass = 'bg-stone-100 border-stone-200 text-stone-500';
                          indicatorLightClass = 'bg-stone-400';
                        }

                        return (
                          <div className="bg-[#FDFBF7] p-3.5 rounded-xl border border-[#E6DFD9] space-y-2 shadow-2xs">
                            <span className="text-[9px] uppercase font-mono font-black text-[#8B6B4F] tracking-wide block leading-none">
                              {language === 'TH' ? 'ส่วนตรวจสอบจำนวนเทียบ (Dedicated Amount Verification)' : 'Amount Verification Status'}
                            </span>
                            
                            <div className="grid grid-cols-3 gap-2">
                              {/* Expected Amount */}
                              <div className="p-2 bg-white border border-[#E6DFD9]/60 rounded-xl text-center">
                                <span className="text-zinc-400 text-[8.5px] block font-bold leading-none mb-1">{language === 'TH' ? 'ยอดที่เรียกเก็บ' : 'Expected Amount'}</span>
                                <span className="font-mono text-xs font-black text-zinc-900">
                                  {formatCurrency(selectedOrder.amount)}
                                </span>
                              </div>
                              
                              {/* Slip Amount */}
                              <div className="p-2 bg-white border border-[#E6DFD9]/60 rounded-xl text-center">
                                <span className="text-zinc-400 text-[8.5px] block font-bold leading-none mb-1">{language === 'TH' ? 'ตรวจจากสลิป' : 'Slip Amount'}</span>
                                <span className="font-mono text-xs font-black text-[#8B6B4F]">
                                  {renderedSlipAmountLabel}
                                </span>
                              </div>

                              {/* Verification Status */}
                              <div className={`p-2 border rounded-xl text-center flex flex-col justify-center items-center transition-all ${verificationStyleClass}`}>
                                <span className="text-[7.5px] block font-extrabold mb-0.5 uppercase tracking-wide opacity-75">{language === 'TH' ? 'สถานะตรวจสอบ' : 'Verify Status'}</span>
                                <span className="text-[10px] font-black flex items-center gap-1 leading-none">
                                  <span className={`w-1.5 h-1.5 rounded-full ${indicatorLightClass} shrink-0 block`} />
                                  {verificationBadgeLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Row Split: Dynamic Verification Timeline vs Items Basket */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                        
                        {/* 7. VERIFICATION TIMELINE */}
                        <div className="sm:col-span-5 p-3 border border-stone-100 rounded-xl bg-stone-50/45 space-y-2">
                          <span className="font-sans text-[9px] text-[#8B6B4F] block uppercase font-black tracking-wider leading-none">
                            {language === 'TH' ? 'ขั้นตอนตรวจสอบธุรกรรม' : 'Verification Timeline'}
                          </span>
                          
                          <div className="relative pl-3 space-y-2 before:absolute before:left-0.5 before:top-1 before:bottom-1 before:w-[2px] before:bg-zinc-200">
                            
                            {/* 1. Order Created (Always done) */}
                            <div className="relative text-[10px]">
                              <span className="absolute -left-[14px] top-0.5 w-2 h-2 rounded-full bg-[#A8BB9A] border border-white ring-1 ring-[#A8BB9A]/50" />
                              <div className="flex justify-between text-zinc-700 font-bold leading-none">
                                <span>{language === 'TH' ? 'สร้างคำสั่งออเดอร์' : 'Order Created'}</span>
                                <span className="font-mono text-[8px] text-[10px] text-zinc-400">{selectedOrder.orderTime?.split(',')[1]?.trim() || selectedOrder.time}</span>
                              </div>
                            </div>

                            {/* 2. Customer Uploaded Slip (Always done) */}
                            <div className="relative text-[10px]">
                              <span className="absolute -left-[14px] top-0.5 w-2 h-2 rounded-full bg-[#A8BB9A] border border-white ring-1 ring-[#A8BB9A]/50" />
                              <div className="flex justify-between text-zinc-700 font-bold leading-none">
                                <span>{language === 'TH' ? 'อัปโหลดสลิปแล้ว' : 'Slip Uploaded'}</span>
                                <span className="font-mono text-[8px] text-[#A8BB9A] font-extrabold">Uploaded</span>
                              </div>
                            </div>

                            {/* 3. Waiting Verification */}
                            {(() => {
                              const isPaidOrCancelled = ['Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Queue Called'].includes(selectedOrder.status) || selectedOrder.status === 'Cancelled' || selectedOrder.paymentStatus === 'Rejected';
                              return (
                                <div className="relative text-[10px]">
                                  <span className={`absolute -left-[14px] top-0.5 w-2 h-2 rounded-full border border-white ${
                                    isPaidOrCancelled ? 'bg-[#A8BB9A]' : 'bg-amber-500 animate-pulse ring-1 ring-amber-500/20'
                                  }`} />
                                  <div className="flex justify-between text-zinc-700 font-bold leading-none">
                                    <span>{language === 'TH' ? 'อยู่ระหว่างการประเมิน' : 'Waiting Verification'}</span>
                                    {!isPaidOrCancelled && <span className="font-mono text-[8px] text-amber-600 animate-pulse font-extrabold uppercase">Live</span>}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 4. Verified / Rejected */}
                            {(() => {
                              const isPaid = ['Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Queue Called'].includes(selectedOrder.status);
                              const isCancelled = selectedOrder.paymentStatus === 'Rejected' || selectedOrder.status === 'Cancelled';
                              return (
                                <div className="relative text-[10px]">
                                  <span className={`absolute -left-[14px] top-0.5 w-2 h-2 rounded-full border border-white ${
                                    isPaid ? 'bg-[#A8BB9A]' : isCancelled ? 'bg-red-500' : 'bg-zinc-200'
                                  }`} />
                                  <div className="flex justify-between text-zinc-600 font-semibold leading-none">
                                    <span className={isPaid ? 'text-emerald-700 font-bold' : isCancelled ? 'text-red-700 font-bold' : 'text-zinc-400'}>
                                      {isPaid ? (language === 'TH' ? 'อนุมัติการรับเงิน' : 'Verified (PAID)') :
                                       isCancelled ? (language === 'TH' ? 'ปฏิเสธ/ยกเลิก' : 'Rejected (CANCELLED)') :
                                       (language === 'TH' ? 'ยืนยันเสร็จและชง' : 'Verified / Rejected')}
                                    </span>
                                    {(isPaid || isCancelled) && <span className="font-mono text-[8px] font-bold text-zinc-500">Done</span>}
                                  </div>
                                </div>
                              );
                            })()}

                          </div>
                        </div>

                        {/* Items Basket list inside order */}
                        <div className="sm:col-span-7 p-3 border border-stone-100 rounded-xl bg-stone-50/50 space-y-1.5 flex flex-col justify-start">
                          <span className="font-mono text-[9px] text-zinc-400 block uppercase font-bold tracking-wider leading-none">
                            {language === 'TH' ? 'ตะกร้าเครื่องดื่มที่สั่งช็อป' : 'Order Basket'}
                          </span>
                          <div className="divide-y divide-zinc-100 max-h-24 overflow-y-auto custom-scrollbar pr-0.5 text-xs text-zinc-700">
                            {selectedOrder.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between py-1 text-xs">
                                <span className="font-sans text-zinc-800">{it.item.name} <strong className="text-[#8B6B4F]">x{it.qty}</strong></span>
                                <span className="font-mono text-zinc-500 font-bold">{formatCurrency(it.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Display Notes or failure flags if any */}
                      {selectedOrder.note && (
                        <div className="p-2.5 bg-amber-50/10 border border-amber-200/20 rounded-xl text-[10.5px] text-zinc-600 font-sans italic flex items-start gap-1">
                          <span className="font-bold text-[#8B6B4F] tracking-tight">{language === 'TH' ? 'โน้ตกำกับอ้างอิง:' : 'Audit Note:'}</span>
                          <span>"{selectedOrder.note}"</span>
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              </div>

              {/* Scenario Switcher — Staff only, pending orders */}
              {roleMode === 'Staff' && selectedOrder.status === 'Pending Payment' && (
                <div className="px-5 py-3 border-t bg-[#FDFBF7] flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[9px] text-zinc-400 uppercase font-black tracking-wider shrink-0">
                    {language === 'TH' ? 'จำลองสถานการณ์สลิป:' : 'Slip Scenario:'}
                  </span>
                  {(['A', 'B', 'C', 'D', 'E'] as const).map(s => {
                    const labels: Record<string, string> = { A: 'Match ✓', B: 'Mismatch ฿', C: 'Duplicate', D: 'Wrong Date', E: 'Blurred' };
                    const isActive = (selectedScenarioMap[selectedOrder.id] || 'A') === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedScenarioMap(prev => ({ ...prev, [selectedOrder.id]: s }))}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#8B6B4F] text-white border-[#8B6B4F]'
                            : 'bg-white text-zinc-500 border-zinc-200 hover:border-[#8B6B4F] hover:text-[#8B6B4F]'
                        }`}
                      >
                        {s}: {labels[s]}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons Bar — Staff operational actions / Admin read-only */}
              <div className="px-5 py-4 border-t bg-white flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {roleMode === 'Admin' ? (
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[10.5px] font-sans text-zinc-500">
                    <span className="text-base">🔒</span>
                    <span>
                      {language === 'TH'
                        ? 'Admin ดูข้อมูลได้อย่างเดียว — การอนุมัติ/ปฏิเสธสลิปสงวนสิทธิ์สำหรับพนักงานเท่านั้น'
                        : 'Read-only view — approving or rejecting payment slips is reserved for Staff only.'}
                    </span>
                  </div>
                ) : (
                  (() => {
                    const isRejected = selectedOrder.paymentStatus === 'Rejected';
                    const isApproved = ['Paid', 'Preparing', 'Ready For Pickup', 'Completed', 'Queue Called'].includes(selectedOrder.status);

                    if (isApproved) {
                      return (
                        <div className="flex-1 text-center py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs font-bold">
                          {language === 'TH' ? '✓ ชำระเงินได้รับการยืนยันแล้ว' : '✓ Payment Verified & Approved'}
                        </div>
                      );
                    }

                    return (
                      <>
                        <button
                          id="approve-payment-btn"
                          onClick={handleApprove}
                          className="flex-1 py-2.5 bg-[#A8BB9A] hover:bg-[#8CA27D] text-white font-sans text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Check size={14} />
                          {language === 'TH' ? 'อนุมัติและส่งเข้าคิวชง ✓' : 'Approve & Queue for Brewing'}
                        </button>

                        {isRejected ? (
                          <button
                            id="reupload-slip-btn"
                            onClick={handleCustomerReupload}
                            className="flex-1 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-amber-200"
                          >
                            <RotateCcw size={13} />
                            {language === 'TH' ? 'จำลองลูกค้าส่งสลิปใหม่' : 'Simulate Customer Re-upload'}
                          </button>
                        ) : (
                          <button
                            id="reject-payment-btn"
                            onClick={() => setShowRejectModal(true)}
                            className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <X size={13} />
                            {language === 'TH' ? 'ปฏิเสธสลิป' : 'Reject Slip'}
                          </button>
                        )}
                      </>
                    );
                  })()
                )}
              </div>

              {/* Security Warning Label footer */}
              <div className="px-5 py-3 border-t bg-stone-50/50 text-[10px] font-sans text-zinc-400 flex items-center gap-2">
                <ShieldAlert size={14} className="text-[#8B6B4F] shrink-0" />
                <span>
                  {language === 'TH'
                    ? 'สตาฟตรวจสอบความปลอดภัยอัตโนมัติ: กรุณาอนุมัติเฉพาะรายการที่มีสลิปแสดงวันเวลาและยอดตรงกับระบบจริง'
                    : 'System verification handles basic validation checks. Staff overrides must ensure actual bank transfers exist.'
                  }
                </span>
              </div>

            </div>
          ) : (
            <div className="flex-1 bg-[#FFFFFF] border border-[#E6DFD9] rounded-2xl flex flex-col items-center justify-center text-center p-8 shadow-xs text-zinc-400">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="font-sans font-bold text-sm text-zinc-700">{language === 'TH' ? 'คิวตรวจสอบสลิปเสร็จครบถ้วน' : 'Verification Completed'}</h3>
              <p className="font-sans text-xs max-w-sm mt-1 mb-4 leading-normal">
                {language === 'TH' 
                  ? 'ไม่มีรายการใบเสร็จค้างตรวจสอบในระบบชั่วคราว ดึงข้อมูลหรือใช้ออปชั่นด้านล่างเพื่อเพิ่มการทำงานทดสอบต่อ' 
                  : 'There are no pending PromptPay slip transfers left in the current list filter. Try resetting or generating new mock cases!'
                }
              </p>
              
              {/* 4. AUTO REGENERATE OPTION BUTTON when pending processed */}
              <button
                id="regenerate-sample-data-btn"
                onClick={handleRegenerateRandomSamples}
                className="px-4 py-2 bg-[#8B6B4F] hover:bg-[#72553C] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Zap size={13} className="fill-white" />
                <span>{language === 'TH' ? 'สร้างข้อมูลตัวอย่างใหม่' : 'Generate 10 New Samples'}</span>
              </button>
            </div>
          )}
        </div>
      </div>



      {/* 5. IMPROVED REJECT REASON MODAL DIALOG WITH CHECKBOXES */}
      {showRejectModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans animate-in fade-in duration-75">
          <div className="bg-white border rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-100 space-y-4">
            
            <div className="flex justify-between items-center text-zinc-850 pb-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-red-600 rounded-lg">
                  <ShieldAlert size={15} />
                </div>
                <h3 className="font-sans font-extrabold text-sm text-zinc-800">
                  {language === 'TH' ? 'ระบุสาเหตุข้อผิดพลาดของสลิป' : 'Reject Receipt Verification:'} {selectedOrder.id}
                </h3>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="p-1 rounded-full hover:bg-stone-50 text-zinc-400 transition-colors cursor-pointer">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-600">
              <p className="leading-normal">
                {language === 'TH' 
                  ? 'ระบุสาเหตุกรณีปัดตกหลักฐานโอนเงิน ระบบจะยกเลิกคิวชงและคืนสถานะแนบเอกสารให้ฝั่งลูกค้าประสานงานการชำระเงินใหม่:' 
                  : 'Choose the following reasons details for the receipt verification process cancel. The associated coffee cup queue status will swap to CANCELLED.'
                }
              </p>
              
              {/* 6. Quick Reject presets */}
              <div className="p-3 bg-red-50/10 border border-red-200/25 rounded-xl space-y-2 font-sans">
                <span className="text-[10px] uppercase font-mono font-black text-red-820 tracking-wider flex items-center gap-1.5 leading-none">
                  <Zap size={11} className="fill-red-500 text-red-500" />
                  <span>{language === 'TH' ? 'ทางลัดปฏิเสธด่วน (One-Click Quick Presets):' : 'One-Click Quick Reject Presets'}</span>
                </span>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { key: 'Amount Mismatch', label: language === 'TH' ? 'ยอดเงินไม่ตรงตามจริง' : 'Amount Mismatch' },
                    { key: 'Duplicate Slip', label: language === 'TH' ? 'สลิปถูกใช้งานซ้ำพิจารณาโกง' : 'Duplicate Slip' },
                    { key: 'Invalid Receipt', label: language === 'TH' ? 'อ้างอิงสลิปปลอม/ไม่ใช่สลิปโอน' : 'Invalid Receipt' }
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      id={`quick-reject-${preset.key.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => {
                        setSelectedReasons([preset.key]);
                        const descriptionText = language === 'TH' 
                          ? `[ยกเลิกด่วน] ${preset.label} (${preset.key}) กรุณาชำระใหม่และแก้ไขข้อมูลแนบให้ถูกต้องตามบิล`
                          : `[Quick Rejection] ${preset.key} detected. Please upload valid promptpay receipt with the correct total amount.`;
                        setRejectReason(descriptionText);
                      }}
                      className="py-1.5 px-3 bg-white hover:bg-rose-50 border border-red-200 hover:border-red-400 text-red-700 hover:text-red-800 font-bold text-[10.5px] rounded-lg transition-all shadow-4xs cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Rejection Checkboxes (Checkboxes selections instead of button chips) */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-black text-zinc-400 tracking-wider block">
                  {language === 'TH' ? 'เกณฑ์ตัวเลือกตรวจสอบข้อบกพร่อง (Checkboxes):' : 'Audit checklist criteria (Select multiple checkboxes):'}
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100 text-[11px]">
                  {[
                    { key: 'Amount Mismatch', en: 'Amount Mismatch', th: 'ยอดเงินโอนและราคาบิลไม่ตรงตระกร้าช็อป' },
                    { key: 'Duplicate Slip', en: 'Duplicate Slip', th: 'พบเลขที่รหัสธุรกรรมทางการโอนเงินซ้ำซ้อนในสาขา' },
                    { key: 'Incorrect Date/Time', en: 'Incorrect Date/Time', th: 'ช่วงระบุเวลาใน E-Receipt ล้าสมัยข้ามวัน' },
                    { key: 'Invalid Receipt', en: 'Invalid Receipt', th: 'ไม่ใช่หลักฐานทำธุรกรรมของพาร์ทเนอร์สัญชาติไทย' },
                    { key: 'Damaged Receipt', en: 'Damaged Receipt', th: 'อรรถประโยชน์รูปชำรุด มีการแชร์ตัดต่อภาพลางเลือน' }
                  ].map((item) => {
                    const isChecked = selectedReasons.includes(item.key);
                    return (
                      <label 
                        key={item.key}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer bg-white ${
                          isChecked 
                            ? 'border-red-200 bg-red-50/10 text-red-900 font-medium' 
                            : 'border-zinc-200 hover:bg-stone-50 text-zinc-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`reject-check-${item.key.replace(/\s+/g, '-').toLowerCase()}`}
                          checked={isChecked}
                          onChange={(e) => {
                            let updatedList = [...selectedReasons];
                            if (e.target.checked) {
                              updatedList.push(item.key);
                            } else {
                              updatedList = updatedList.filter(x => x !== item.key);
                            }
                            setSelectedReasons(updatedList);
                            
                            // Dynamically compile a neat customer advice message inside textbox
                            if (updatedList.length > 0) {
                              const compiledText = updatedList.map(k => {
                                const found = [
                                  { key: 'Amount Mismatch', th: 'ยอดโอนไม่ตรงกับระบบชง', en: 'amount mismatch' },
                                  { key: 'Duplicate Slip', th: 'สลิปซ้ำถูกปัดตก', en: 'duplicate slip' },
                                  { key: 'Incorrect Date/Time', th: 'วันเวลาสลิปไม่ถูกต้อง', en: 'incorrect timestamp' },
                                  { key: 'Invalid Receipt', th: 'สลิปใช้งานไม่ได้', en: 'invalid promptpay format' },
                                  { key: 'Damaged Receipt', th: 'ภาพหลักฐานไม่ชัดเจน/ชำรุด', en: 'image damaged/blurred' }
                                ].find(m => m.key === k);
                                return language === 'TH' ? found?.th : found?.en;
                              }).join(', ');
                              
                              setRejectReason(
                                language === 'TH'
                                  ? `ปฏิเสธใบโอนเนื่องจาก: ${compiledText} โปรดติดต่อสตาฟร้าน`
                                  : `Rejection notice: ${compiledText}. Please re-submit payment.`
                              );
                            } else {
                              setRejectReason('');
                            }
                          }}
                          className="mt-0.5 h-3.5 w-3.5 text-[#8B6B4F] focus:ring-[#8B6B4F] border-zinc-300 rounded cursor-pointer"
                        />
                        <div className="leading-tight">
                          <span className="font-bold text-[10px] block">{item.en}</span>
                          <span className="text-zinc-400 text-[9px] block mt-0.5 whitespace-normal pr-1 leading-normal">{language === 'TH' ? item.th : `Issues details for ${item.en.toLowerCase()}`}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Comment Text field */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-mono font-black text-zinc-400 tracking-wider block">
                  {language === 'TH' ? 'กล่องพิมพ์ระบุข้อความอธิบายความต่าง (Custom Comment Box):' : 'Rejection details to send back to client'}
                </span>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={language === 'TH' ? 'พิมพ์แจกแจงคำอธิบายหรือแอดไวซ์ชี้แนะลูกค้าเพิ่มเติมที่หน้าร้านได้...' : 'Details for why this payment proof was categorized as invalid...'}
                  className="w-full text-xs p-3 bg-stone-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#8B6B4F] h-16 resize-none text-zinc-800"
                />
              </div>
            </div>

            {/* Modal action bar */}
            <div className="flex gap-2.5 justify-end pt-2 border-t border-stone-100">
              <button 
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border hover:bg-stone-50 text-xs font-semibold rounded-xl text-zinc-500 cursor-pointer"
              >
                {language === 'TH' ? 'ยกเลิกย้อนกลับ' : 'Cancel & Back'}
              </button>
              <button 
                type="button"
                id="modal-confirm-reject-btn"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4.5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1 shadow-sm"
              >
                <X size={13} />
                <span>{language === 'TH' ? 'ปฏิเสธและปัดตกคิวออเดอร์' : 'Reject Order Queue'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CUSTOM REACT-BASED MODAL CONFIRMATION DIALOG (No window.confirm!) */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans animate-in fade-in duration-75">
          <div className="bg-white border rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in zoom-in-95 duration-100 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 pb-2 border-b border-stone-100">
              <AlertTriangle size={19} className="animate-pulse" />
              <h3 className="font-sans font-extrabold text-sm text-[#2E2A25]">
                {language === 'TH' ? 'ยืนยันรีเซ็ตข้อมูลคิวสลิป?' : 'Confirm Reset Sample Slips?'}
              </h3>
            </div>
            
            <p className="text-xs text-zinc-600 leading-relaxed">
              {language === 'TH' 
                ? 'ยืนยันต้องการรีเซ็ตข้อมูลทดสอบทั้งหมดหรือไม่? การอนุมัติ คิวสลิป หรือรายการข้อมูลที่สร้างขึ้นมาทดลองจะกลับสู่ค่าเดิมที่ติดตั้งเริ่มต้น' 
                : 'Are you sure you want to reset all simulated payment verification records? All verify statuses will return to their default pending values.'
              }
            </p>

            <div className="flex justify-end gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border bg-white hover:bg-stone-50 text-xs font-bold rounded-xl text-zinc-550 cursor-pointer"
              >
                {language === 'TH' ? 'ย้อนกลับ' : 'Cancel'}
              </button>
              <button
                type="button"
                id="confirm-reset-action-btn"
                onClick={handleResetDemoData}
                className="px-4.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
              >
                {language === 'TH' ? 'ตกลงรีเซ็ตข้อมูลสลิป' : 'Confirm Reset Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
