import { useState, Dispatch, SetStateAction } from 'react';
import { Ingredient, Branch } from '../types';
import { AlertTriangle, CheckCircle, ClipboardCheck, ClipboardList, X, History, Clock, Sunrise, Sunset, PackagePlus, Warehouse, AlertCircle, CalendarDays, Download } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface StockManagementViewProps {
  ingredients: Ingredient[] | null;
  setIngredients: Dispatch<SetStateAction<Ingredient[]>>;
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
  isLoading?: boolean;
  error?: string | null;
}

type CountRound = 'open' | 'close';
interface CheckRecord { round: CountRound; by: string; at: string; qty: number; }
interface RefillRecord { qty: number; by: string; at: string; }
// Per-item daily ledger: opening = balance before today's first action; refilled = total added today
interface DailyEntry { opening: number; refilled: number; }
interface MovementLog { id: string; kind: 'count' | 'refill'; itemName: string; itemId?: string; qty: number; unit: string; round?: CountRound; user: string; timestamp: string; branch: string; date: string; }
interface WarehouseMasterItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  warehouseQty: number;
  lowThreshold: number;
  criticalThreshold: number;
}

type StockState = 'normal' | 'low' | 'critical';
const BRANCHES: Exclude<Branch, 'All Branches'>[] = ['Central Plaza', 'Siam Square', 'Mega Bangna', 'The Mall Korat'];
const isBranch = (branch: string): branch is Exclude<Branch, 'All Branches'> => BRANCHES.includes(branch as Exclude<Branch, 'All Branches'>);
const asNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function classify(i: Ingredient): StockState {
  const quantity = asNumber(i.quantity);
  const criticalThreshold = asNumber(i.criticalThreshold);
  const lowThreshold = asNumber(i.lowThreshold);
  if (quantity <= criticalThreshold) return 'critical';
  if (quantity <= lowThreshold) return 'low';
  return 'normal';
}
function statusFromQty(i: Pick<Ingredient, 'quantity' | 'lowThreshold'>): Ingredient['status'] {
  const quantity = asNumber(i.quantity);
  const lowThreshold = asNumber(i.lowThreshold);
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= lowThreshold) return 'Low Stock';
  return 'In Stock';
}
const fmtQty = (n: unknown) => {
  const qty = asNumber(n);
  return Number.isInteger(qty) ? String(qty) : qty.toFixed(1);
};

const normalizeIngredient = (item: unknown, index: number): Ingredient | null => {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Partial<Ingredient>;
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : `STK-LOCAL-${index + 1}`;
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name : 'Unnamed Ingredient';
  const type = typeof raw.type === 'string' && raw.type.trim() ? raw.type : 'Ingredient';
  const branch = typeof raw.branch === 'string' && isBranch(raw.branch) ? raw.branch : 'Central Plaza';
  const stockLevel = asNumber(raw.stockLevel);
  const quantity = asNumber(raw.quantity, stockLevel);
  const lowThreshold = asNumber(raw.lowThreshold, Math.max(1, Math.ceil(quantity * 0.25)));
  const criticalThreshold = asNumber(raw.criticalThreshold, 0);
  return {
    id,
    name,
    type,
    status: statusFromQty({ quantity, lowThreshold }),
    stockLevel,
    unit: typeof raw.unit === 'string' && raw.unit.trim() ? raw.unit : 'units',
    branch,
    quantity,
    lowThreshold,
    criticalThreshold,
    warehouseQty: asNumber(raw.warehouseQty),
    lastAdded: raw.lastAdded === undefined ? undefined : asNumber(raw.lastAdded),
  };
};

const STATE_CFG: Record<StockState, { bar: string; badge: string; dot: string; label: string; labelTH: string }> = {
  normal:   { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', label: 'Normal',   labelTH: 'ปกติ' },
  low:      { bar: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-800 border-orange-200',    dot: 'bg-orange-500',  label: 'Low',      labelTH: 'ใกล้หมด' },
  critical: { bar: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500',     label: 'Critical', labelTH: 'วิกฤต' },
};

const WAREHOUSE_MASTER_ITEMS: WarehouseMasterItem[] = [
  { id: 'WHM-001', name: 'Espresso Beans', category: 'Bean', unit: 'kg', warehouseQty: 40, lowThreshold: 5, criticalThreshold: 2 },
  { id: 'WHM-002', name: 'Premium Milk', category: 'Ingredient', unit: 'liters', warehouseQty: 60, lowThreshold: 8, criticalThreshold: 3 },
  { id: 'WHM-003', name: 'Paper Cups (Hot)', category: 'Packaging', unit: 'boxes', warehouseQty: 150, lowThreshold: 40, criticalThreshold: 15 },
  { id: 'WHM-004', name: 'Paper Cups (Cold)', category: 'Packaging', unit: 'boxes', warehouseQty: 150, lowThreshold: 40, criticalThreshold: 15 },
  { id: 'WHM-005', name: 'Caramel Syrup', category: 'Ingredient', unit: 'bottle', warehouseQty: 120, lowThreshold: 8, criticalThreshold: 3 },
  { id: 'WHM-006', name: 'Vanilla Syrup', category: 'Ingredient', unit: 'bottle', warehouseQty: 80, lowThreshold: 6, criticalThreshold: 2 },
  { id: 'WHM-007', name: 'Chocolate Sauce', category: 'Ingredient', unit: 'bottle', warehouseQty: 45, lowThreshold: 6, criticalThreshold: 2 },
  { id: 'WHM-008', name: 'Whipped Cream', category: 'Ingredient', unit: 'liters', warehouseQty: 50, lowThreshold: 8, criticalThreshold: 3 },
  { id: 'WHM-009', name: 'Sugar', category: 'Ingredient', unit: 'kg', warehouseQty: 60, lowThreshold: 25, criticalThreshold: 10 },
  { id: 'WHM-010', name: 'Brown Sugar', category: 'Ingredient', unit: 'kg', warehouseQty: 35, lowThreshold: 12, criticalThreshold: 5 },
  { id: 'WHM-011', name: 'Oat Milk', category: 'Dairy Alternative', unit: 'liters', warehouseQty: 42, lowThreshold: 10, criticalThreshold: 4 },
  { id: 'WHM-012', name: 'Almond Milk', category: 'Dairy Alternative', unit: 'liters', warehouseQty: 38, lowThreshold: 10, criticalThreshold: 4 },
  { id: 'WHM-013', name: 'Matcha Powder', category: 'Powder', unit: 'kg', warehouseQty: 18, lowThreshold: 5, criticalThreshold: 2 },
  { id: 'WHM-014', name: 'Cocoa Powder', category: 'Powder', unit: 'kg', warehouseQty: 22, lowThreshold: 5, criticalThreshold: 2 },
];

const itemKey = (name: string, unit: string) => `${name.trim().toLowerCase()}__${unit.trim().toLowerCase()}`;

// App's simulated "today" (matches the dashboard reference date)
const TODAY = '2026-05-25';
const YESTERDAY = '2026-05-24';

const INITIAL_CHECKS: Record<string, CheckRecord> = {
  'STK-001': { round: 'open', by: 'Siri S.', at: '08:15, Today', qty: 8.5 },
  'STK-002': { round: 'open', by: 'Siri S.', at: '08:18, Today', qty: 12 },
};
// Per-item daily ledger seeded for the two pre-counted items
const INITIAL_DAILY: Record<string, DailyEntry> = {
  'STK-001': { opening: 8.5, refilled: 0 },
  'STK-002': { opening: 10, refilled: 2 },
};
const INITIAL_HISTORY: MovementLog[] = [
  { id: 'CNT-001', kind: 'count', itemName: 'Espresso Beans', itemId: 'STK-001', qty: 8.5, unit: 'kg', round: 'open', user: 'Siri S.', timestamp: '08:15, Today', branch: 'Central Plaza', date: TODAY },
  { id: 'CNT-002', kind: 'count', itemName: 'Premium Milk', itemId: 'STK-002', qty: 12, unit: 'liters', round: 'open', user: 'Siri S.', timestamp: '08:18, Today', branch: 'Central Plaza', date: TODAY },
  { id: 'RF-Y01', kind: 'refill', itemName: 'Premium Milk', itemId: 'STK-002', qty: 2, unit: 'liters', user: 'Siri S.', timestamp: '08:05, 24 May', branch: 'Central Plaza', date: YESTERDAY },
  { id: 'CNT-Y01', kind: 'count', itemName: 'Espresso Beans', itemId: 'STK-001', qty: 9, unit: 'kg', round: 'close', user: 'Siri S.', timestamp: '20:10, 24 May', branch: 'Central Plaza', date: YESTERDAY },
  { id: 'CNT-Y02', kind: 'count', itemName: 'Premium Milk', itemId: 'STK-002', qty: 11, unit: 'liters', round: 'close', user: 'Siri S.', timestamp: '20:12, 24 May', branch: 'Central Plaza', date: YESTERDAY },
];

export default function StockManagementView({
  ingredients, setIngredients, selectedBranch, setSelectedBranch, roleMode, staffAssignedBranch, isLoading = false, error = null,
}: StockManagementViewProps) {
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked' | 'unchecked' | StockState>('all');
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [checkRound, setCheckRound]     = useState<CountRound>('open');
  const [checks, setChecks]             = useState<Record<string, CheckRecord>>(INITIAL_CHECKS);
  const [refills, setRefills]           = useState<Record<string, RefillRecord>>({});
  const [dailyLog, setDailyLog]         = useState<Record<string, DailyEntry>>(INITIAL_DAILY);
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);
  const [history, setHistory]           = useState<MovementLog[]>(INITIAL_HISTORY);
  const [countInput, setCountInput]     = useState<string>('');
  const [refillInput, setRefillInput]   = useState<string>('');
  const [refillErr, setRefillErr]       = useState<string>('');
  const [showHistory, setShowHistory]   = useState(false);
  // Add-ingredient-to-branch modal
  const [showAdd, setShowAdd]           = useState(false);
  const [addItemId, setAddItemId]       = useState<string>('');
  const [addSearch, setAddSearch]       = useState<string>('');
  const [addQty, setAddQty]             = useState<string>('');
  const [addErr, setAddErr]             = useState<string>('');
  const { language } = useLanguage();

  const isStaff = roleMode === 'Staff';
  const hasInventoryList = Array.isArray(ingredients);
  const safeIngredients = hasInventoryList ? ingredients.map(normalizeIngredient).filter((item): item is Ingredient => Boolean(item)) : [];
  const safeStaffBranch = isBranch(staffAssignedBranch) ? staffAssignedBranch : 'Central Plaza';
  const activeBranch = isStaff ? safeStaffBranch : selectedBranch;
  const currentUser  = isStaff ? 'Siri Semsak' : 'Admin User';
  const t = (th: string, en: string) => (language === 'TH' ? th : en);
  const roundLabel = (r: CountRound) => r === 'open' ? t('รอบเปิดร้าน', 'Opening Check') : t('รอบปิดร้าน', 'Closing Check');
  const stamp = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
  const loadError = error || (!hasInventoryList ? t('ข้อมูลสต็อกไม่พร้อมใช้งาน', 'Inventory data is unavailable.') : null);
  const isToday = selectedDate === TODAY;
  const canEdit = isStaff && isToday; // staff edit only the current day; past dates are read-only

  // Per-row daily figures. For TODAY we use the live ledger; for past dates we reconstruct
  // the day's figures from the movement history (counts + refills recorded that date).
  const rowMetrics = (ing: Ingredient) => {
    if (isToday) {
      const log = dailyLog[ing.id];
      return {
        previous: log ? log.opening : asNumber(ing.quantity),
        refilled: log ? log.refilled : 0,
        current: asNumber(ing.quantity),
        counted: Boolean(checks[ing.id]),
        check: checks[ing.id] ?? null,
      };
    }
    const dayLogs = history.filter(h => h.date === selectedDate && h.branch === ing.branch && (h.itemId === ing.id || h.itemName === ing.name));
    const refilled = dayLogs.filter(h => h.kind === 'refill').reduce((s, h) => s + asNumber(h.qty), 0);
    const counts = dayLogs.filter(h => h.kind === 'count');
    const lastCount = counts[0] ?? null; // history is prepended newest-first
    const current = lastCount ? asNumber(lastCount.qty) : NaN;
    return {
      previous: Number.isFinite(current) ? current - refilled : NaN,
      refilled,
      current,
      counted: Boolean(lastCount),
      check: lastCount ? { round: (lastCount.round ?? 'open') as CountRound, by: lastCount.user, at: lastCount.timestamp, qty: asNumber(lastCount.qty) } as CheckRecord : null,
    };
  };

  // ── CSV (Excel) export — Admin only ───────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Ingredient', 'Branch', 'Previous Stock Balance', 'Refilled Today', 'Current Stock Balance', 'Unit', 'Status', 'Daily Check Status', 'Date'];
    const rows = scoped.map(ing => {
      const m = rowMetrics(ing);
      const cfg = STATE_CFG[classify(ing)];
      return [
        `"${ing.name}"`, `"${ing.branch}"`,
        Number.isFinite(m.previous) ? m.previous : '-',
        m.refilled,
        Number.isFinite(m.current) ? m.current : '-',
        ing.unit, cfg.label,
        m.counted ? `Counted (${m.check?.at ?? ''})` : 'Not counted',
        selectedDate,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-report_${activeBranch === 'All Branches' ? 'all-branches' : activeBranch}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scoped = safeIngredients.filter(i => activeBranch === 'All Branches' || i.branch === activeBranch);
  const filtered = scoped.filter(ing => {
    if (statusFilter === 'checked' && !checks[ing.id]) return false;
    if (statusFilter === 'unchecked' && checks[ing.id]) return false;
    if ((statusFilter === 'normal' || statusFilter === 'low' || statusFilter === 'critical') && classify(ing) !== statusFilter) return false;
    if (searchTerm && !ing.name.toLowerCase().includes(searchTerm.toLowerCase()) && !ing.type.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const kpiChecked   = scoped.filter(i => checks[i.id]).length;
  const kpiUnchecked = scoped.length - kpiChecked;
  const kpiLow       = scoped.filter(i => classify(i) === 'low').length;
  const kpiCritical  = scoped.filter(i => classify(i) === 'critical').length;

  const topCritical = safeIngredients.filter(i => classify(i) !== 'normal').sort((a, b) => asNumber(a.quantity) - asNumber(b.quantity)).slice(0, 5);
  const scopedHistory = history.filter(h => activeBranch === 'All Branches' || h.branch === activeBranch);
  const warehouseMasterItems = WAREHOUSE_MASTER_ITEMS.reduce<WarehouseMasterItem[]>((items, master) => {
    const key = itemKey(master.name, master.unit);
    if (items.some(item => itemKey(item.name, item.unit) === key)) return items;
    const inventoryMatch = safeIngredients.find(item => itemKey(item.name, item.unit) === key);
    items.push({
      ...master,
      warehouseQty: inventoryMatch ? asNumber(inventoryMatch.warehouseQty, master.warehouseQty) : master.warehouseQty,
      lowThreshold: inventoryMatch ? asNumber(inventoryMatch.lowThreshold, master.lowThreshold) : master.lowThreshold,
      criticalThreshold: inventoryMatch ? asNumber(inventoryMatch.criticalThreshold, master.criticalThreshold) : master.criticalThreshold,
    });
    return items;
  }, []);
  const filteredWarehouseItems = warehouseMasterItems.filter(item => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.unit.toLowerCase().includes(q);
  });

  // ── Daily stock count (records counted quantity in real units) ──────────────
  const submitCount = (id: string, value: number) => {
    const item = safeIngredients.find(i => i.id === id);
    if (!item || isNaN(value) || value < 0) return;
    const qty = value;
    const at = stamp();
    setDailyLog(prev => prev[id] ? prev : { ...prev, [id]: { opening: asNumber(item.quantity), refilled: 0 } });
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, quantity: qty, status: statusFromQty({ quantity: qty, lowThreshold: i.lowThreshold }) } : i));
    setChecks(prev => ({ ...prev, [id]: { round: checkRound, by: currentUser, at, qty } }));
    setHistory(prev => [{ id: `CNT-${Date.now()}`, kind: 'count', itemName: item.name, itemId: id, qty, unit: item.unit, round: checkRound, user: currentUser, timestamp: at, branch: item.branch, date: TODAY }, ...prev].slice(0, 40));
  };

  // ── Refill branch stock from central warehouse (in-card action) ─────────────
  const submitRefill = (id: string) => {
    const item = safeIngredients.find(i => i.id === id);
    if (!item) return;
    const qty = Number(refillInput);
    const warehouseAvail = asNumber(item.warehouseQty);
    if (!qty || qty <= 0) { setRefillErr(t('กรุณากรอกจำนวนที่มากกว่า 0', 'Refill quantity must be greater than 0.')); return; }
    if (qty > warehouseAvail) { setRefillErr(t('จำนวนเกินสต็อกคลังกลาง', 'Cannot refill more than central warehouse stock.')); return; }
    const at = stamp();
    const newQty = asNumber(item.quantity) + qty;
    setIngredients(prev => prev.map(i => i.id === id ? {
      ...i,
      quantity: newQty,
      warehouseQty: asNumber(i.warehouseQty) - qty,
      lastAdded: qty,
      status: statusFromQty({ quantity: newQty, lowThreshold: i.lowThreshold }),
    } : i));
    setRefills(prev => ({ ...prev, [id]: { qty, by: currentUser, at } }));
    setDailyLog(prev => {
      const existing = prev[id];
      return { ...prev, [id]: { opening: existing ? existing.opening : asNumber(item.quantity), refilled: (existing?.refilled ?? 0) + qty } };
    });
    setHistory(prev => [{ id: `RF-${Date.now()}`, kind: 'refill', itemName: item.name, itemId: id, qty, unit: item.unit, user: currentUser, timestamp: at, branch: item.branch, date: TODAY }, ...prev].slice(0, 40));
    setRefillInput(''); setRefillErr('');
  };

  // ── Add existing ingredient from central warehouse to branch ────────────────
  const submitAdd = () => {
    const item = warehouseMasterItems.find(i => i.id === addItemId);
    if (!item) { setAddErr(t('กรุณาเลือกวัตถุดิบจากคลังกลาง', 'Please select an ingredient from the central warehouse.')); return; }
    const branchMatch = scoped.find(i => itemKey(i.name, i.unit) === itemKey(item.name, item.unit));
    if (branchMatch) { setAddErr(t('วัตถุดิบนี้มีอยู่ในสต็อกสาขาแล้ว', 'This ingredient already exists in the branch inventory.')); return; }
    if (item.warehouseQty <= 0) { setAddErr(t('คลังกลางไม่มีสินค้าเพียงพอ', 'No stock available in central warehouse.')); return; }
    const q = Number(addQty);
    if (!q || q <= 0) { setAddErr(t('กรุณากรอกจำนวนที่ถูกต้อง', 'Please enter a valid quantity.')); return; }
    if (q > item.warehouseQty) { setAddErr(t('จำนวนเกินสต็อกคลังกลาง', 'Quantity exceeds available central warehouse stock.')); return; }
    const at = stamp();
    const branchItemId = `STK-${Date.now()}`;
    const newItem: Ingredient = {
      id: branchItemId,
      name: item.name,
      type: item.category,
      status: statusFromQty({ quantity: q, lowThreshold: item.lowThreshold }),
      stockLevel: 0,
      unit: item.unit,
      branch: activeBranch === 'All Branches' ? safeStaffBranch : activeBranch,
      quantity: q,
      lowThreshold: item.lowThreshold,
      criticalThreshold: item.criticalThreshold,
      warehouseQty: item.warehouseQty - q,
      lastAdded: q,
    };
    setIngredients(prev => [...prev, newItem]);
    setDailyLog(prev => ({ ...prev, [branchItemId]: { opening: 0, refilled: q } }));
    setHistory(prev => [{ id: `RF-${Date.now()}`, kind: 'refill', itemName: item.name, itemId: branchItemId, qty: q, unit: item.unit, user: currentUser, timestamp: at, branch: newItem.branch, date: TODAY }, ...prev].slice(0, 40));
    setShowAdd(false); setAddItemId(''); setAddSearch(''); setAddQty(''); setAddErr('');
    setSelectedId(branchItemId);
  };

  const selectRow = (id: string) => {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    const item = safeIngredients.find(i => i.id === id);
    setCountInput(next && item ? String(item.quantity) : '');
    setRefillInput(''); setRefillErr('');
  };
  const selectedItem = safeIngredients.find(i => i.id === selectedId) ?? null;
  const addItem = warehouseMasterItems.find(i => i.id === addItemId) ?? null;
  const addBranchItem = addItem ? scoped.find(i => itemKey(i.name, i.unit) === itemKey(addItem.name, addItem.unit)) ?? null : null;
  const addBranchQty = addBranchItem?.quantity ?? 0;
  const addIsDuplicate = Boolean(addBranchItem);

  const tabs: { key: typeof statusFilter; label: string; count: number }[] = [
    { key: 'all',       label: t('ทั้งหมด', 'All'),               count: scoped.length },
    { key: 'checked',   label: t('ตรวจแล้ว', 'Counted'),          count: kpiChecked },
    { key: 'unchecked', label: t('ยังไม่ได้ตรวจ', 'Not counted'), count: kpiUnchecked },
    { key: 'low',       label: t('ใกล้หมด', 'Low'),               count: kpiLow },
    { key: 'critical',  label: t('วิกฤต', 'Critical'),            count: kpiCritical },
  ];

  return (
    <div className="p-6 space-y-5 font-sans">
      {isLoading && (
        <div className="bg-white border border-[#E6DFD9] rounded-xl p-4 text-xs font-semibold text-zinc-500 flex items-center gap-2">
          <Clock size={14} className="text-[#8B6B4F]" /> {t('กำลังโหลดข้อมูลสต็อก...', 'Loading stock records...')}
        </div>
      )}

      {loadError && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs font-semibold text-red-700 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <div>
            <p>{t('ไม่สามารถโหลดข้อมูลสต็อกได้', 'Unable to load inventory data')}</p>
            <p className="font-medium text-red-600/80 mt-0.5">{loadError}</p>
          </div>
        </div>
      )}

      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'checked' as const,   label: t('ตรวจแล้ววันนี้', 'Counted Today'), value: kpiChecked,   base: 'border-emerald-100 bg-emerald-50/40', ring: 'ring-emerald-400', icon: <ClipboardCheck size={16} className="text-emerald-600" /> },
          { key: 'unchecked' as const, label: t('ยังไม่ได้ตรวจ', 'Not Counted'),    value: kpiUnchecked, base: 'border-zinc-200 bg-white',            ring: 'ring-zinc-400',    icon: <Clock size={16} className="text-zinc-400" /> },
          { key: 'low' as const,       label: t('ใกล้หมด', 'Low Stock'),            value: kpiLow,       base: 'border-orange-100 bg-orange-50/40',   ring: 'ring-orange-400',  icon: <AlertTriangle size={16} className="text-orange-500" /> },
          { key: 'critical' as const,  label: t('วิกฤต', 'Critical'),               value: kpiCritical,  base: 'border-red-100 bg-red-50/40',         ring: 'ring-red-400',     icon: <AlertTriangle size={16} className="text-red-500" /> },
        ].map(kpi => {
          const active = statusFilter === kpi.key;
          return (
            <button key={kpi.key} id={`stock-kpi-${kpi.key}`} onClick={() => setStatusFilter(kpi.key)}
              className={`text-left p-3.5 rounded-xl border ${kpi.base} flex items-center justify-between shadow-xs transition-all hover:shadow-md cursor-pointer ${active ? `ring-2 ${kpi.ring}` : ''}`}>
              <div><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{kpi.label}</p><p className="font-black text-xl text-zinc-800 mt-0.5">{kpi.value}</p></div>
              {kpi.icon}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E6DFD9] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-[#2E2A25]">{t('ตรวจนับสต็อกประจำวัน', 'Daily Stock Count')}</h3>
            <p className="text-[11px] text-zinc-500">
              {isStaff ? t('ตรวจนับและเติมสต็อกประจำสาขาด้วยหน่วยจริง', 'Count & refill your branch stock in real units')
                       : t('ติดตามสต็อกทุกสาขา (ดูอย่างเดียว)', 'Monitor branch stock (read-only)')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date history picker — both roles can browse past daily records */}
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[#E6DFD9] bg-stone-50 rounded-lg text-xs font-semibold text-zinc-600">
              <CalendarDays size={13} className="text-[#8B6B4F]" />
              <input id="stock-date-picker" type="date" max={TODAY} value={selectedDate} onChange={e => { setSelectedDate(e.target.value || TODAY); setSelectedId(null); }}
                className="bg-transparent focus:outline-none text-zinc-700 cursor-pointer" />
            </label>
            {canEdit && (
              <div className="inline-flex bg-stone-100 rounded-lg p-0.5">
                {(['open', 'close'] as CountRound[]).map(r => (
                  <button key={r} id={`round-${r}`} onClick={() => setCheckRound(r)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${checkRound === r ? 'bg-white text-coffee shadow-xs' : 'text-zinc-500 hover:text-zinc-700'}`}>
                    {r === 'open' ? <Sunrise size={12} /> : <Sunset size={12} />}{roundLabel(r)}
                  </button>
                ))}
              </div>
            )}
            <button id="stock-view-history-btn" onClick={() => setShowHistory(true)}
              className="px-3.5 py-1.5 border border-[#E6DFD9] bg-stone-50 hover:bg-stone-100 text-zinc-600 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <History size={13} className="text-[#8B6B4F]" /> {t('ประวัติการเคลื่อนไหว', 'Movement History')}
            </button>
            {/* Export — Admin only */}
            {!isStaff && (
              <button id="stock-export-btn" onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                <Download size={14} /> {t('ส่งออก Excel', 'Export Excel')}
              </button>
            )}
            {canEdit && (
              <button id="add-ingredient-btn" onClick={() => { setShowAdd(true); setAddItemId(warehouseMasterItems[0]?.id || ''); setAddSearch(''); setAddQty(''); setAddErr(''); }}
                className="px-3.5 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                <PackagePlus size={14} /> {t('เพิ่มวัตถุดิบเข้าสาขา', 'Add Ingredient to Branch')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input type="text" placeholder={t('ค้นหาวัตถุดิบ...', 'Search ingredients...')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-stone-50 border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F]" />
          </div>
          <div>
            {isStaff ? (
              <div className="w-full text-xs py-2 px-3 bg-zinc-100 border border-[#E6DFD9] rounded-lg text-zinc-600 font-semibold flex items-center gap-1.5">{t('สาขา:', 'Branch:')} {safeStaffBranch}</div>
            ) : (
              <select id="stock-branch-filter" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value as Branch)}
                className="w-full text-xs py-2 px-3 bg-stone-50 border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F] text-zinc-600 cursor-pointer">
                <option value="All Branches">{t('ทุกสาขา', 'All Branches')}</option>
                <option value="Central Plaza">Central Plaza</option>
                <option value="Siam Square">Siam Square</option>
                <option value="Mega Bangna">Mega Bangna</option>
                <option value="The Mall Korat">The Mall Korat</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const active = statusFilter === tab.key;
            return (
              <button key={tab.key} id={`stock-tab-${tab.key}`} onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${active ? 'bg-[#8B6B4F] text-white shadow-xs' : 'bg-stone-50 border border-[#E6DFD9] text-zinc-600 hover:bg-stone-100'}`}>
                {tab.label}<span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-stone-200 text-zinc-500'}`}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Historical (read-only) banner */}
      {!isToday && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-semibold text-amber-800 flex items-center gap-2">
          <CalendarDays size={15} className="shrink-0" />
          {t(`กำลังดูบันทึกย้อนหลังของวันที่ ${selectedDate} (ดูอย่างเดียว)`, `Viewing historical records for ${selectedDate} (read-only)`)}
        </div>
      )}

      {/* Table + Side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto min-h-64">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6DFD9] bg-stone-50/50 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">{t('วัตถุดิบ', 'Ingredient')}</th>
                  <th className="py-2.5 px-3 text-right">{t('ยอดยกมา', 'Previous Balance')}</th>
                  <th className="py-2.5 px-3 text-right">{t('เติมวันนี้', 'Refilled Today')}</th>
                  <th className="py-2.5 px-3 text-right">{t('คงเหลือปัจจุบัน', 'Current Balance')}</th>
                  <th className="py-2.5 px-3">{t('หน่วย', 'Unit')}</th>
                  <th className="py-2.5 px-3">{t('สถานะ', 'Status')}</th>
                  <th className="py-2.5 px-3">{t('การตรวจนับ', 'Daily Check Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-zinc-400"><Clock size={28} /><p className="text-sm font-semibold text-zinc-500">{t('กำลังโหลดข้อมูลสต็อก...', 'Loading stock records...')}</p></div>
                  </td></tr>
                ) : loadError ? (
                  <tr><td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-red-600"><AlertCircle size={28} /><p className="text-sm font-semibold text-zinc-600">{t('เกิดข้อผิดพลาดในการโหลดข้อมูลสต็อก', 'Stock records could not be loaded')}</p></div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-14 text-center">
                    {scoped.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 text-zinc-400"><PackagePlus size={28} /><p className="text-sm font-semibold text-zinc-600">{t('ยังไม่มีรายการสต็อกสำหรับสาขานี้', 'No stock records for this branch yet')}</p><p className="text-[11px] text-zinc-400">{t('หน้านี้ยังใช้งานได้แม้ไม่มีข้อมูลสต็อก', 'This page is ready when stock records are added.')}</p></div>
                    ) : (statusFilter === 'low' || statusFilter === 'critical') ? (
                      <div className="flex flex-col items-center gap-2 text-emerald-600"><CheckCircle size={28} /><p className="text-sm font-semibold text-zinc-600">{t('วัตถุดิบทุกอย่างอยู่ในระดับปกติ', 'All ingredients are at normal levels')}</p></div>
                    ) : statusFilter === 'unchecked' ? (
                      <div className="flex flex-col items-center gap-2 text-emerald-600"><CheckCircle size={28} /><p className="text-sm font-semibold text-zinc-600">{t('ตรวจนับครบทุกรายการแล้ว', 'Everything has been counted')}</p></div>
                    ) : <p className="text-xs text-zinc-400">{t('ไม่พบวัตถุดิบ', 'No ingredients found.')}</p>}
                  </td></tr>
                ) : filtered.map(ing => {
                  const cfg = STATE_CFG[classify(ing)];
                  const m = rowMetrics(ing);
                  const chk = m.check;
                  const active = selectedId === ing.id;
                  const dash = (v: number) => Number.isFinite(v) ? fmtQty(v) : '—';
                  return (
                    <tr key={ing.id} id={`ingredient-row-${ing.id}`} onClick={() => selectRow(ing.id)}
                      className={`cursor-pointer transition-colors ${active ? 'bg-[#FDF1E6]/40' : 'hover:bg-stone-50/60'}`}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <div><div className="font-bold text-zinc-800">{ing.name}</div>
                            <div className="font-mono text-[9px] text-zinc-400 mt-0.5">{ing.type}{activeBranch === 'All Branches' && ` · ${ing.branch}`}</div></div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right"><span className="font-mono text-sm text-zinc-500">{dash(m.previous)}</span></td>
                      <td className="py-3 px-3 text-right"><span className={`font-mono text-sm font-bold ${m.refilled > 0 ? 'text-emerald-700' : 'text-zinc-400'}`}>{m.refilled > 0 ? `+${fmtQty(m.refilled)}` : '—'}</span></td>
                      <td className="py-3 px-3 text-right"><span className="font-mono font-black text-sm text-zinc-800">{dash(m.current)}</span></td>
                      <td className="py-3 px-3"><span className="text-[10px] text-zinc-400">{ing.unit}</span></td>
                      <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${cfg.badge}`}>{language === 'TH' ? cfg.labelTH : cfg.label}</span></td>
                      <td className="py-3 px-3">
                        {chk ? (
                          <div><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200"><ClipboardCheck size={11} /> {t('ตรวจแล้ว', 'Counted')}</span>
                            <p className="text-[9.5px] text-zinc-400 mt-1">{chk.at} · {chk.by}</p></div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold border bg-zinc-50 text-zinc-500 border-zinc-200"><Clock size={11} /> {isToday ? t('ยังไม่ได้ตรวจวันนี้', 'Not counted today') : t('ไม่มีบันทึก', 'No record')}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panel */}
        <div className="bg-white border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs self-start">
          {selectedItem ? (() => {
            const cfg = STATE_CFG[classify(selectedItem)];
            const chk = checks[selectedItem.id];
            const rfl = refills[selectedItem.id];
            const warehouseAvail = asNumber(selectedItem.warehouseQty);
            const warehouseEmpty = warehouseAvail <= 0;
            return (
              <div>
                <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9] flex items-start justify-between gap-2">
                  <div><h3 className="font-bold text-sm text-zinc-900">{selectedItem.name}</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{selectedItem.type}{' · '}{selectedItem.branch}</p></div>
                  <button onClick={() => setSelectedId(null)} className="text-zinc-400 hover:text-zinc-600 shrink-0"><X size={14} /></button>
                </div>

                <div className="p-4 space-y-4 text-xs">
                  {/* Detail card — stock & warehouse info */}
                  <div className="p-3.5 bg-stone-50 border rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">{t('ยอดคงเหลือปัจจุบัน', 'Current Stock Balance')}</span>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${cfg.badge}`}>{language === 'TH' ? cfg.labelTH : cfg.label}</span>
                    </div>
                    <div className="flex items-end gap-2"><span className="font-black text-3xl text-zinc-900 leading-none">{fmtQty(selectedItem.quantity)}</span><span className="text-zinc-400 font-mono text-sm mb-0.5">{selectedItem.unit}</span></div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-200/70">
                      <span className="text-zinc-500 flex items-center gap-1"><Warehouse size={11} />{t('คลังกลางคงเหลือ', 'Central Warehouse Available')}</span>
                      <span className={`font-mono font-bold ${warehouseEmpty ? 'text-red-600' : 'text-[#8B6B4F]'}`}>{fmtQty(selectedItem.warehouseQty)} {selectedItem.unit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">{t('จำนวนเติมล่าสุด', 'Last Refill Quantity')}</span>
                      <span className="font-mono font-bold text-emerald-700">{rfl ? `+${fmtQty(rfl.qty)} ${selectedItem.unit}` : (selectedItem.lastAdded ? `+${fmtQty(selectedItem.lastAdded)} ${selectedItem.unit}` : '—')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">{t('เติมล่าสุดเมื่อ', 'Last Refill Date/Time')}</span>
                      <span className="font-semibold text-zinc-700">{rfl ? rfl.at : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">{t('เติมโดย', 'Refilled By')}</span>
                      <span className="font-semibold text-zinc-700">{rfl ? rfl.by : '—'}</span>
                    </div>
                  </div>

                  {/* Last count info */}
                  <div className="p-3 border rounded-xl bg-stone-50 space-y-1">
                    <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider">{t('การตรวจนับล่าสุด', 'Last Count')}</p>
                    {chk ? (<>
                      <div className="flex items-center justify-between"><span className="text-zinc-500">{t('ตรวจล่าสุดเมื่อ', 'Last checked')}</span><span className="font-semibold text-zinc-700">{chk.at}</span></div>
                      <div className="flex items-center justify-between"><span className="text-zinc-500">{t('ผู้ตรวจล่าสุด', 'Checked by')}</span><span className="font-semibold text-zinc-700">{chk.by}</span></div>
                      <div className="flex items-center justify-between"><span className="text-zinc-500">{t('รอบ', 'Session')}</span><span className="font-semibold text-zinc-700">{roundLabel(chk.round)}</span></div>
                    </>) : <p className="text-zinc-400 text-[11px]">{t('ยังไม่ได้ตรวจวันนี้', 'Not counted today')}</p>}
                  </div>

                  {/* Action sections */}
                  {canEdit ? (<>
                    {/* Daily Count Result */}
                    <div className="p-3 border border-[#8B6B4F]/20 rounded-xl bg-[#FDF1E6]/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-[#8B6B4F] uppercase tracking-wider font-extrabold">{t('บันทึกผลตรวจนับ', 'Daily Count Result')}</span>
                        <span className="text-[9.5px] font-bold text-[#8B6B4F] flex items-center gap-1">{checkRound === 'open' ? <Sunrise size={11} /> : <Sunset size={11} />}{roundLabel(checkRound)}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-snug">{t('บันทึกจำนวนสต็อกที่นับได้จริง', 'Record the current counted stock.')}</p>
                      <label className="block"><span className="text-[10px] text-zinc-500 font-semibold">{t('จำนวนที่นับได้', 'Counted Quantity')}</span>
                        <div className="mt-1 flex items-center gap-2">
                          <input id="count-input" type="number" min={0} step="any" value={countInput} onChange={e => setCountInput(e.target.value)}
                            className="flex-1 text-sm py-2 px-3 font-mono font-bold bg-white border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F]" placeholder="0" />
                          <span className="text-xs font-bold text-zinc-500 shrink-0 w-14">{selectedItem.unit}</span>
                        </div>
                      </label>
                      <button id="submit-count-btn" disabled={countInput === ''} onClick={() => submitCount(selectedItem.id, Number(countInput))}
                        className="w-full py-2.5 bg-[#8B6B4F] hover:bg-[#70533C] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5">
                        <ClipboardCheck size={13} /> {t('บันทึกผลตรวจนับ', 'Save Count Result')}
                      </button>
                    </div>

                    {/* Refill Stock */}
                    <div className="p-3 border border-sky-200 rounded-xl bg-sky-50/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-sky-700 uppercase tracking-wider font-extrabold">{t('เติมสต็อก', 'Refill Stock')}</span>
                        <span className="text-[9.5px] font-bold text-sky-700 flex items-center gap-1"><Warehouse size={11} />{fmtQty(selectedItem.warehouseQty)} {selectedItem.unit}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-snug">{t('เพิ่มสต็อกจากคลังกลางเข้าสาขา', 'Add stock from the central warehouse.')}</p>
                      <label className="block"><span className="text-[10px] text-zinc-500 font-semibold">{t('จำนวนที่จะเติม', 'Refill Quantity')}</span>
                        <div className="mt-1 flex items-center gap-2">
                          <input id="refill-input" type="number" min={1} step="any" disabled={warehouseEmpty} value={refillInput} onChange={e => { setRefillInput(e.target.value); setRefillErr(''); }}
                            className="flex-1 text-sm py-2 px-3 font-mono font-bold bg-white border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-sky-500 disabled:bg-stone-100" placeholder="0" />
                          <span className="text-xs font-bold text-zinc-500 shrink-0 w-14">{selectedItem.unit}</span>
                        </div>
                      </label>
                      {warehouseEmpty && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={12} />{t('คลังกลางไม่มีสินค้าคงเหลือ', 'Central warehouse stock is empty.')}</p>}
                      {refillErr && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={12} />{refillErr}</p>}
                      <button id="submit-refill-btn" disabled={warehouseEmpty || refillInput === ''} onClick={() => submitRefill(selectedItem.id)}
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5">
                        <PackagePlus size={13} /> {t('เติมสต็อก', 'Refill Stock')}
                      </button>
                    </div>
                  </>) : (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-zinc-400 text-[11px]">
                      {!isToday
                        ? t('ดูข้อมูลย้อนหลัง (แก้ไขไม่ได้)', 'Historical view — editing is disabled.')
                        : t('Admin: ดูอย่างเดียว — การตรวจนับทำโดยพนักงานสาขา', 'Admin: read-only. Counts are recorded by branch staff.')}
                    </div>
                  )}
                </div>
              </div>
            );
          })() : isStaff ? (
            <div className="p-8 text-center text-zinc-400 text-xs space-y-2"><ClipboardCheck size={36} className="text-zinc-200 mx-auto" />
              <p className="font-semibold text-zinc-500">{t('ยังไม่ได้เลือกรายการ', 'No Item Selected')}</p>
              <p className="text-[10px] text-zinc-400">{scoped.length === 0 ? t('ยังไม่มีรายการสต็อกสำหรับสาขานี้', 'No stock records for this branch yet.') : t('คลิกรายการเพื่อตรวจนับหรือเติมสต็อก', 'Click a row to count or refill stock.')}</p></div>
          ) : (
            <div>
              <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9] flex items-center gap-2"><AlertTriangle size={15} className="text-red-500 shrink-0" />
                <div><h3 className="font-bold text-sm text-zinc-900">{t('รายการวิกฤตทุกสาขา', 'Top Critical Items')}</h3><p className="text-[10px] text-zinc-400">{t('สต็อกต่ำสุดทั้งระบบ', 'Lowest stock across all branches')}</p></div></div>
              {topCritical.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2 text-emerald-600"><CheckCircle size={28} /><p className="text-sm font-semibold text-zinc-600">{t('วัตถุดิบทุกอย่างอยู่ในระดับปกติ', 'All ingredients are at normal levels')}</p></div>
              ) : (
                <div className="divide-y divide-zinc-50">{topCritical.map(item => {
                  const cfg = STATE_CFG[classify(item)];
                  return (
                    <button key={item.id} onClick={() => setSelectedId(item.id)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-stone-50">
                      <div className="flex items-center gap-2 min-w-0"><span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <div className="min-w-0"><p className="font-bold text-xs text-zinc-800 truncate">{item.name}</p><p className="text-[9.5px] text-zinc-400">{item.branch}</p></div></div>
                      <span className={`font-mono font-black text-sm shrink-0 ${classify(item) === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>{fmtQty(item.quantity)} {item.unit}</span>
                    </button>
                  );
                })}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Ingredient to Branch modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#E6DFD9] flex items-center justify-between">
              <div className="flex items-center gap-2"><PackagePlus size={16} className="text-[#8B6B4F]" /><h3 className="font-bold text-sm text-zinc-800">{t('เพิ่มวัตถุดิบเข้าสาขา', 'Add Ingredient to Branch')}</h3></div>
              <button onClick={() => setShowAdd(false)} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <label className="block"><span className="text-[10px] text-zinc-500 font-semibold">{t('ค้นหาจากชื่อ หมวด หรือหน่วย', 'Search by name, category, or unit')}</span>
                <input value={addSearch} onChange={e => {
                  const q = e.target.value;
                  setAddSearch(q);
                  setAddErr('');
                  const normalized = q.trim().toLowerCase();
                  const next = warehouseMasterItems.find(item =>
                    !normalized || item.name.toLowerCase().includes(normalized) || item.category.toLowerCase().includes(normalized) || item.unit.toLowerCase().includes(normalized)
                  );
                  setAddItemId(next?.id || '');
                }}
                  placeholder={t('ค้นหาวัตถุดิบในคลังกลาง...', 'Search central warehouse inventory...')}
                  className="mt-1 w-full text-xs py-2 px-3 bg-stone-50 border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F]" />
              </label>
              <label className="block"><span className="text-[10px] text-zinc-500 font-semibold">{t('วัตถุดิบจากคลังกลาง', 'Central warehouse ingredient')}</span>
                <select value={addItemId} onChange={e => { setAddItemId(e.target.value); setAddErr(''); }} className="mt-1 w-full text-xs py-2 px-3 bg-white border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F]">
                  {filteredWarehouseItems.length === 0 ? (
                    <option value="">{t('ไม่พบวัตถุดิบในคลังกลาง', 'No warehouse items found')}</option>
                  ) : filteredWarehouseItems.map(i => <option key={i.id} value={i.id}>{i.name} · {i.category} · {i.unit}</option>)}
                </select></label>
              {addItem && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-stone-50 rounded-lg"><p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{t('ชื่อวัตถุดิบ', 'Ingredient')}</p><p className="font-bold text-sm text-zinc-800">{addItem.name}</p></div>
                  <div className="p-2.5 bg-stone-50 rounded-lg"><p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{t('หมวด', 'Category')}</p><p className="font-bold text-sm text-zinc-800">{addItem.category}</p></div>
                  <div className="p-2.5 bg-stone-50 rounded-lg"><p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{t('หน่วย', 'Unit')}</p><p className="font-bold text-sm text-zinc-800">{addItem.unit}</p></div>
                  <div className="p-2.5 bg-[#FDF1E6]/50 rounded-lg"><p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{t('คลังกลางคงเหลือ', 'Warehouse Avail.')}</p><p className="font-black text-sm text-[#8B6B4F]">{fmtQty(addItem.warehouseQty)} {addItem.unit}</p></div>
                  <div className="col-span-2 p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100"><p className="text-[9px] uppercase font-bold text-emerald-700 font-mono">{t('สต็อกสาขาปัจจุบัน', 'Current Branch Quantity')}</p><p className="font-black text-sm text-emerald-800">{fmtQty(addBranchQty)} {addItem.unit}</p></div>
                </div>
              )}
              {addIsDuplicate && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={12} />{t('วัตถุดิบนี้มีอยู่ในสต็อกสาขาแล้ว', 'This ingredient already exists in the branch inventory.')}</p>}
              <label className="block"><span className="text-[10px] text-zinc-500 font-semibold">{t('จำนวนที่จะเพิ่มเข้าสาขา', 'Quantity to Add to Branch')}</span>
                <div className="mt-1 flex items-center gap-2">
                  <input type="number" min={1} step="any" disabled={!addItem || addIsDuplicate || addItem.warehouseQty <= 0} value={addQty} onChange={e => { setAddQty(e.target.value); setAddErr(''); }}
                    className="flex-1 text-sm py-2 px-3 font-mono font-bold bg-white border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F] disabled:bg-stone-100" placeholder="0" />
                  <span className="text-xs font-bold text-zinc-500 shrink-0 w-14">{addItem?.unit}</span>
                </div></label>
              {addItem && addItem.warehouseQty <= 0 && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={12} />{t('คลังกลางไม่มีสินค้าเพียงพอ', 'No stock available in central warehouse.')}</p>}
              {addErr && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={12} />{addErr}</p>}
            </div>
            <div className="p-4 border-t border-[#E6DFD9]">
              <button id="confirm-add-btn" disabled={!addItem || addIsDuplicate || addItem.warehouseQty <= 0} onClick={submitAdd}
                className="w-full py-2.5 bg-[#8B6B4F] hover:bg-[#70533C] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5">
                <PackagePlus size={13} /> {t('เพิ่มเข้าสต็อกสาขา', 'Add to Branch Stock')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Movement history drawer ── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#E6DFD9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2"><ClipboardList size={16} className="text-[#8B6B4F]" />
                <div><h3 className="font-bold text-sm text-zinc-800">{t('ประวัติการเคลื่อนไหวสต็อก', 'Stock Movement History')}</h3>
                  <p className="text-[11px] text-zinc-400">{isStaff ? `${t('สาขา', 'Branch')}: ${staffAssignedBranch}` : t('ทุกสาขา', 'All branches')}</p></div></div>
              <button onClick={() => setShowHistory(false)} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 custom-scrollbar">
              {scopedHistory.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-xs">{t('ยังไม่มีรายการ', 'No movements yet.')}</div>
              ) : scopedHistory.map(e => (
                <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${e.kind === 'refill' ? 'text-sky-700 bg-sky-50 border-sky-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>
                      {e.kind === 'refill' ? <PackagePlus size={11} /> : <ClipboardCheck size={11} />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-zinc-800">{e.itemName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${e.kind === 'refill' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-[#FDF1E6] text-[#8B6B4F] border-[#E6DFD9]'}`}>{e.kind === 'refill' ? t('เติมจากคลัง', 'Refill') : roundLabel(e.round!)}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{e.branch} · {e.timestamp} · {e.user}</p>
                    </div>
                  </div>
                  <span className={`font-mono font-black text-sm shrink-0 ${e.kind === 'refill' ? 'text-sky-700' : 'text-zinc-700'}`}>{e.kind === 'refill' ? `+${fmtQty(e.qty)}` : fmtQty(e.qty)} {e.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
