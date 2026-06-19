import { useRef, useState } from 'react';
import {
  Warehouse, Plus, Pencil, X, AlertTriangle, CheckCircle, History, PackagePlus,
  ArrowRightLeft, Boxes, AlertCircle, Save, Building2, Download, Upload,
  Search, FileSpreadsheet,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface CentralWarehouseViewProps {
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
}

const BRANCHES = ['Central Plaza', 'Siam Square', 'Mega Bangna', 'The Mall Korat'];
const CATEGORY_OPTIONS = ['Coffee Beans', 'Dairy', 'Syrup', 'Ingredient', 'Packaging', 'Other'];
const STATUS_OPTIONS = ['All Statuses', 'Normal', 'Low Stock', 'Critical'];

type StockState = 'normal' | 'low' | 'critical';
type MovementAction = 'Import' | 'Manual Adjustment' | 'Distribution to Branch' | 'Stock Correction';

interface WarehouseItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  warehouseQty: number;
  lowThreshold: number;
  criticalThreshold: number;
  lastUpdated: string;
  updatedDate: string;
  branchStock: Record<string, number>;
}

interface Movement {
  id: string;
  itemName: string;
  action: MovementAction;
  qty: number;
  unit: string;
  branch?: string;
  user: string;
  timestamp: string;
  date: string;
  before: number;
  after: number;
}

const now = () => new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7)}`;

const SEED_ITEMS: WarehouseItem[] = [
  { id: 'WH-001', name: 'Espresso Beans', category: 'Coffee Beans', unit: 'kg', warehouseQty: 40, lowThreshold: 5, criticalThreshold: 2, lastUpdated: '25 May 2026, 08:00', updatedDate: '2026-05-25', branchStock: { 'Central Plaza': 9, 'Siam Square': 7, 'Mega Bangna': 6, 'The Mall Korat': 5 } },
  { id: 'WH-002', name: 'Premium Milk', category: 'Dairy', unit: 'liters', warehouseQty: 60, lowThreshold: 8, criticalThreshold: 3, lastUpdated: '25 May 2026, 08:05', updatedDate: '2026-05-25', branchStock: { 'Central Plaza': 13, 'Siam Square': 15, 'Mega Bangna': 10, 'The Mall Korat': 8 } },
  { id: 'WH-003', name: 'Caramel Syrup', category: 'Syrup', unit: 'bottle', warehouseQty: 120, lowThreshold: 8, criticalThreshold: 3, lastUpdated: '25 May 2026, 08:10', updatedDate: '2026-05-25', branchStock: { 'Central Plaza': 10, 'Siam Square': 6, 'Mega Bangna': 3, 'The Mall Korat': 4 } },
  { id: 'WH-004', name: 'Vanilla Syrup', category: 'Syrup', unit: 'bottle', warehouseQty: 80, lowThreshold: 6, criticalThreshold: 2, lastUpdated: '25 May 2026, 08:15', updatedDate: '2026-05-25', branchStock: { 'Central Plaza': 7, 'Siam Square': 7, 'Mega Bangna': 9, 'The Mall Korat': 5 } },
  { id: 'WH-005', name: 'Paper Cups (Hot)', category: 'Packaging', unit: 'boxes', warehouseQty: 150, lowThreshold: 40, criticalThreshold: 15, lastUpdated: '25 May 2026, 08:20', updatedDate: '2026-05-25', branchStock: { 'Central Plaza': 140, 'Siam Square': 42, 'Mega Bangna': 35, 'The Mall Korat': 30 } },
  { id: 'WH-006', name: 'Paper Cups (Cold)', category: 'Packaging', unit: 'boxes', warehouseQty: 150, lowThreshold: 40, criticalThreshold: 15, lastUpdated: '25 May 2026, 08:20', updatedDate: '2026-05-25', branchStock: { 'Central Plaza': 60, 'Siam Square': 18, 'Mega Bangna': 28, 'The Mall Korat': 22 } },
  { id: 'WH-007', name: 'Whipped Cream', category: 'Ingredient', unit: 'liters', warehouseQty: 50, lowThreshold: 8, criticalThreshold: 3, lastUpdated: '25 May 2026, 08:25', updatedDate: '2026-05-25', branchStock: { 'Central Plaza': 6, 'Siam Square': 8, 'Mega Bangna': 14, 'The Mall Korat': 5 } },
];

const SEED_MOVES: Movement[] = [
  { id: 'MV-001', itemName: 'Paper Cups (Hot)', action: 'Distribution to Branch', qty: -20, unit: 'boxes', branch: 'Central Plaza', user: 'central.manager', timestamp: '25 May 2026, 10:01', date: '2026-05-25', before: 170, after: 150 },
  { id: 'MV-002', itemName: 'Premium Milk', action: 'Distribution to Branch', qty: -2, unit: 'liters', branch: 'Central Plaza', user: 'central.manager', timestamp: '25 May 2026, 08:05', date: '2026-05-25', before: 62, after: 60 },
  { id: 'MV-003', itemName: 'Espresso Beans', action: 'Import', qty: 40, unit: 'kg', user: 'admin', timestamp: '24 May 2026, 18:00', date: '2026-05-24', before: 0, after: 40 },
  { id: 'MV-004', itemName: 'Caramel Syrup', action: 'Manual Adjustment', qty: 120, unit: 'bottle', user: 'admin', timestamp: '24 May 2026, 18:10', date: '2026-05-24', before: 0, after: 120 },
];

const cloneWarehouseItems = () => SEED_ITEMS.map(item => ({
  ...item,
  branchStock: { ...item.branchStock },
}));
const cloneMovementHistory = () => SEED_MOVES.map(move => ({ ...move }));

const classify = (i: WarehouseItem): StockState =>
  i.warehouseQty <= i.criticalThreshold ? 'critical' : i.warehouseQty <= i.lowThreshold ? 'low' : 'normal';

const STATE_CFG: Record<StockState, { badge: string; bar: string; label: string; labelTH: string }> = {
  normal: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', label: 'Normal', labelTH: 'ปกติ' },
  low: { badge: 'bg-orange-50 text-orange-700 border-orange-200', bar: 'bg-orange-500', label: 'Low Stock', labelTH: 'ใกล้หมด' },
  critical: { badge: 'bg-red-50 text-red-700 border-red-200', bar: 'bg-red-500', label: 'Critical', labelTH: 'วิกฤต' },
};

const blankItem = (): WarehouseItem => ({
  id: uid('WH'),
  name: '',
  category: 'Ingredient',
  unit: 'bottle',
  warehouseQty: 0,
  lowThreshold: 30,
  criticalThreshold: 10,
  lastUpdated: now(),
  updatedDate: todayISO(),
  branchStock: {},
});

const inRange = (date: string, start: string, end: string) => (!start || date >= start) && (!end || date <= end);
const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const csvEscape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export default function CentralWarehouseView({ roleMode, staffAssignedBranch }: CentralWarehouseViewProps) {
  const { language } = useLanguage();
  const t = (th: string, en: string) => (language === 'TH' ? th : en);
  const isAdmin = roleMode === 'Admin';
  const branchManagerByBranch: Record<string, string> = {
    'Central Plaza': 'central.manager',
    'Siam Square': 'siam.manager',
    'Mega Bangna': 'mega.manager',
    'The Mall Korat': 'korat.manager',
  };
  const currentUser = isAdmin ? 'admin' : branchManagerByBranch[staffAssignedBranch] || 'central.manager';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<WarehouseItem[]>(cloneWarehouseItems);
  const [moves, setMoves] = useState<Movement[]>(cloneMovementHistory);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [startDate, setStartDate] = useState('2026-05-24');
  const [endDate, setEndDate] = useState(todayISO());
  const [showHistory, setShowHistory] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const [editing, setEditing] = useState<WarehouseItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [restockQty, setRestockQty] = useState('');

  const [addQty, setAddQty] = useState<Record<string, string>>({});
  const [addErr, setAddErr] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const filtered = items.filter(i => {
    const stateLabel = STATE_CFG[classify(i)].label;
    const textMatched = !search || [i.name, i.category, i.unit].some(value => value.toLowerCase().includes(search.toLowerCase()));
    const categoryMatched = categoryFilter === 'All' || i.category === categoryFilter;
    const statusMatched = statusFilter === 'All Statuses' || stateLabel === statusFilter;
    const dateMatched = inRange(i.updatedDate, startDate, endDate);
    return textMatched && categoryMatched && statusMatched && dateMatched;
  });

  const movementFiltered = moves.filter(m => {
    const textMatched = !search || [m.itemName, m.action, m.unit, m.user, m.branch || ''].some(value => value.toLowerCase().includes(search.toLowerCase()));
    return textMatched && inRange(m.date, startDate, endDate);
  });

  const kpiTotal = filtered.length;
  const kpiLow = filtered.filter(i => classify(i) === 'low').length;
  const kpiCritical = filtered.filter(i => classify(i) === 'critical').length;
  const kpiUnits = filtered.reduce((s, i) => s + i.warehouseQty, 0);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };
  const log = (m: Movement) => setMoves(prev => [m, ...prev].slice(0, 100));

  const openCreate = () => { setEditing(blankItem()); setIsNew(true); setRestockQty(''); };
  const openEdit = (i: WarehouseItem) => { setEditing(JSON.parse(JSON.stringify(i))); setIsNew(false); setRestockQty(''); };
  const closeDrawer = () => { setEditing(null); setRestockQty(''); };
  const setF = <K extends keyof WarehouseItem>(k: K, v: WarehouseItem[K]) => setEditing(p => p ? { ...p, [k]: v } : p);

  const saveItem = () => {
    if (!editing || !editing.name.trim() || !isAdmin) return;
    const existing = items.find(m => m.id === editing.id);
    const rec = { ...editing, lastUpdated: now(), updatedDate: todayISO() };
    setItems(prev => existing ? prev.map(m => m.id === rec.id ? rec : m) : [...prev, rec]);
    log({
      id: uid('MV'),
      itemName: rec.name,
      action: existing ? 'Stock Correction' : 'Manual Adjustment',
      qty: rec.warehouseQty - (existing?.warehouseQty || 0),
      unit: rec.unit,
      user: currentUser,
      timestamp: now(),
      date: todayISO(),
      before: existing?.warehouseQty || 0,
      after: rec.warehouseQty,
    });
    closeDrawer();
  };

  const addWarehouseStock = () => {
    if (!editing || !isAdmin) return;
    const q = Number(restockQty);
    if (!q || q <= 0) return;
    const before = editing.warehouseQty;
    const after = before + q;
    const stamp = now();
    setEditing(p => p ? { ...p, warehouseQty: after, lastUpdated: stamp, updatedDate: todayISO() } : p);
    setItems(prev => prev.map(m => m.id === editing.id ? { ...m, warehouseQty: after, lastUpdated: stamp, updatedDate: todayISO() } : m));
    log({ id: uid('MV'), itemName: editing.name, action: 'Manual Adjustment', qty: q, unit: editing.unit, user: currentUser, timestamp: stamp, date: todayISO(), before, after });
    setRestockQty('');
    flash(t(`เติมคลังกลาง ${q} ${editing.unit} (${editing.name})`, `Restocked warehouse +${q} ${editing.unit} of ${editing.name}`));
  };

  const addToBranch = (item: WarehouseItem) => {
    const raw = addQty[item.id] ?? '';
    const q = Number(raw);
    if (item.warehouseQty <= 0) { setAddErr(p => ({ ...p, [item.id]: t('คลังกลางไม่มีสินค้าเพียงพอ', 'Insufficient stock available in the central warehouse.') })); return; }
    if (!q || q <= 0) { setAddErr(p => ({ ...p, [item.id]: t('กรุณากรอกจำนวนที่ถูกต้อง', 'Please enter a valid quantity.') })); return; }
    if (q > item.warehouseQty) { setAddErr(p => ({ ...p, [item.id]: t('จำนวนที่ขอเกินสต็อกคลังกลาง', 'Requested quantity exceeds available warehouse stock.') })); return; }
    const after = item.warehouseQty - q;
    const stamp = now();
    setItems(prev => prev.map(m => m.id === item.id ? {
      ...m, warehouseQty: after, lastUpdated: stamp, updatedDate: todayISO(),
      branchStock: { ...m.branchStock, [staffAssignedBranch]: (m.branchStock[staffAssignedBranch] || 0) + q },
    } : m));
    log({ id: uid('MV'), itemName: item.name, action: 'Distribution to Branch', qty: -q, unit: item.unit, branch: staffAssignedBranch, user: currentUser, timestamp: stamp, date: todayISO(), before: item.warehouseQty, after });
    setAddQty(p => ({ ...p, [item.id]: '' }));
    setAddErr(p => ({ ...p, [item.id]: '' }));
    flash(t(`${staffAssignedBranch} รับ ${q} ${item.unit} ${item.name} จากคลังกลาง`, `${staffAssignedBranch} received ${q} ${item.unit} of ${item.name}`));
  };

  const handleImportFile = (file: File | null) => {
    if (!file || !isAdmin) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (lines.length < 2) {
        setImportSummary(t('นำเข้าไม่สำเร็จ: ไม่พบข้อมูลในไฟล์', 'Import failed: no rows found in the file.'));
        return;
      }

      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(delimiter).map(normalizeHeader);
      const col = (label: string) => headers.indexOf(label);
      const required = ['item name', 'category', 'unit', 'quantity', 'reorder threshold'];
      const missing = required.filter(label => col(label) === -1);
      if (missing.length) {
        setImportSummary(t(`นำเข้าไม่สำเร็จ: ขาดคอลัมน์ ${missing.join(', ')}`, `Import failed: missing columns ${missing.join(', ')}`));
        return;
      }

      const seen = new Set<string>();
      const errors: string[] = [];
      let created = 0;
      let updated = 0;
      const importMoves: Movement[] = [];
      const stamp = now();

      setItems(prev => {
        let next = [...prev];
        lines.slice(1).forEach((line, rowIndex) => {
          const cells = line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''));
          const name = cells[col('item name')] || '';
          const category = cells[col('category')] || 'Other';
          const unit = cells[col('unit')] || 'pcs';
          const qty = Number(cells[col('quantity')]);
          const threshold = Number(cells[col('reorder threshold')]);
          const key = name.toLowerCase();
          if (!name || Number.isNaN(qty) || Number.isNaN(threshold)) {
            errors.push(`Row ${rowIndex + 2}: invalid required data`);
            return;
          }
          if (seen.has(key)) {
            errors.push(`Row ${rowIndex + 2}: duplicate item "${name}" in import file`);
            return;
          }
          seen.add(key);

          const idx = next.findIndex(item => item.name.toLowerCase() === key);
          const before = idx >= 0 ? next[idx].warehouseQty : 0;
          const rec: WarehouseItem = idx >= 0
            ? { ...next[idx], category, unit, warehouseQty: qty, lowThreshold: threshold, lastUpdated: stamp, updatedDate: todayISO() }
            : { id: uid('WH'), name, category, unit, warehouseQty: qty, lowThreshold: threshold, criticalThreshold: Math.max(1, Math.floor(threshold / 3)), lastUpdated: stamp, updatedDate: todayISO(), branchStock: {} };

          if (idx >= 0) {
            next[idx] = rec;
            updated += 1;
          } else {
            next = [...next, rec];
            created += 1;
          }

          importMoves.push({ id: uid('MV'), itemName: rec.name, action: 'Import', qty: qty - before, unit: rec.unit, user: currentUser, timestamp: stamp, date: todayISO(), before, after: qty });
        });
        return next;
      });

      setMoves(prev => [...importMoves, ...prev].slice(0, 100));
      const summary = t(
        `นำเข้า Excel สำเร็จ: เพิ่ม ${created} รายการ, อัปเดต ${updated} รายการ${errors.length ? `, พบข้อผิดพลาด ${errors.length} รายการ` : ''}`,
        `Import complete: ${created} created, ${updated} updated${errors.length ? `, ${errors.length} error(s)` : ''}`
      );
      setImportSummary(errors.length ? `${summary}. ${errors.slice(0, 2).join(' | ')}` : summary);
      flash(summary);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    if (!isAdmin) return;
    const rows = filtered.map(i => {
      const inBranches = Object.values(i.branchStock).reduce((a: number, b: number) => a + b, 0);
      return [
        i.name,
        i.category,
        i.warehouseQty,
        i.unit,
        STATE_CFG[classify(i)].label,
        inBranches,
        i.lastUpdated,
      ];
    });
    const headers = ['Item Name', 'Category', 'Current Stock', 'Unit', 'Status', 'Distributed to Branches', 'Last Updated'];
    const movementHeaders = ['Date & Time', 'Inventory Item', 'Action Type', 'Quantity Before', 'Quantity Changed', 'Quantity After', 'Performed By'];
    const movementRows = movementFiltered.map(m => [m.timestamp, m.itemName, m.action, m.before, m.qty, m.after, m.user]);
    const csv = [
      ['Current / Filtered Warehouse Inventory'],
      headers,
      ...rows,
      [],
      [`Stock Movement History (${startDate || 'Any'} to ${endDate || 'Any'})`],
      movementHeaders,
      ...movementRows,
    ].map(row => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `central_warehouse_report_${todayISO()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const unitLabel = (u: string) => u;
  const actionLabel = (a: MovementAction) => ({
    Import: t('นำเข้า', 'Import'),
    'Manual Adjustment': t('ปรับด้วยตนเอง', 'Manual Adjustment'),
    'Distribution to Branch': t('กระจายเข้าสาขา', 'Distribution to Branch'),
    'Stock Correction': t('แก้ไขสต็อก', 'Stock Correction'),
  }[a]);
  const actionStyle = (a: MovementAction) => ({
    Import: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Manual Adjustment': 'bg-amber-50 text-amber-700 border-amber-200',
    'Distribution to Branch': 'bg-sky-50 text-sky-700 border-sky-200',
    'Stock Correction': 'bg-purple-50 text-purple-700 border-purple-200',
  }[a]);

  return (
    <div className="p-6 space-y-5 font-sans">
      <div className="bg-white border border-[#dddddd] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col xl:flex-row flex-wrap xl:items-center justify-between gap-4">
          <div>
            <h2 className="font-black text-lg text-[#181d26] flex items-center gap-2"><Warehouse size={20} className="text-[#181d26]" />{t('คลังสินค้ากลาง', 'Central Warehouse Inventory')}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isAdmin ? t('จัดการวัตถุดิบ รายงานย้อนหลัง และประวัติการเคลื่อนไหวสต็อก', 'Manage inventory, historical reports, and stock movement history')
                : t(`เบิกสต็อกจากคลังกลางเข้าสาขา ${staffAssignedBranch}`, `Replenish ${staffAssignedBranch} from the central warehouse`)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
              <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.xlsx" className="hidden" onChange={e => handleImportFile(e.target.files?.[0] || null)} />
              <button onClick={() => fileInputRef.current?.click()} className="h-11 px-4 border border-[#dddddd] bg-white hover:bg-stone-50 text-zinc-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Upload size={14} className="text-[#181d26]" /> {t('นำเข้า Excel', 'Import Excel')}
              </button>
              <button onClick={handleExport} className="h-11 px-4 bg-[#181d26] hover:bg-[#0d1218] text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Download size={14} /> {t('ส่งออก Excel', 'Export Excel')}
              </button>
              <button onClick={() => setShowHistory(true)} className="h-11 px-4 border border-[#dddddd] bg-white hover:bg-stone-50 text-zinc-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <History size={14} className="text-[#181d26]" /> {t('ประวัติการเคลื่อนไหว', 'Movement History')}
              </button>
              <button id="create-item-btn" onClick={openCreate} className="h-11 px-4 bg-[#181d26] hover:bg-[#0d1218] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5">
                <Plus size={14} /> {t('เพิ่มรายการ', 'Add Item')}
              </button>
              </>
            )}
          </div>
        </div>

        {isAdmin ? (
          <>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="relative md:col-span-5">
              <Search className="absolute left-3.5 top-3.5 text-zinc-400" size={14} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('ค้นหาคลังสินค้า...', 'Search Inventory...')}
                className="w-full h-11 text-xs pl-10 pr-3 bg-stone-50 border border-[#dddddd] rounded-xl focus:outline-none focus:border-[#181d26]" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="md:col-span-2 h-11 text-xs px-3 bg-stone-50 border border-[#dddddd] rounded-xl focus:outline-none focus:border-[#181d26]">
              <option value="All">{t('ทุกหมวดหมู่', 'All Categories')}</option>
              {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="md:col-span-2 h-11 text-xs px-3 bg-stone-50 border border-[#dddddd] rounded-xl focus:outline-none focus:border-[#181d26]">
              {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <div className="md:col-span-3 grid grid-cols-2 gap-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-11 text-xs px-2 bg-stone-50 border border-[#dddddd] rounded-xl" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-11 text-xs px-2 bg-stone-50 border border-[#dddddd] rounded-xl" />
            </div>
          </div>
          {importSummary && (
            <div className="text-[11px] bg-emerald-50 border border-emerald-100 text-emerald-800 px-3 py-2 rounded-xl flex items-center gap-2">
              <FileSpreadsheet size={13} /> {importSummary}
            </div>
          )}
          </>
        ) : (
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3.5 text-zinc-400" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('ค้นหาวัตถุดิบ...', 'Search items...')}
              className="w-full h-11 text-xs pl-10 pr-3 bg-stone-50 border border-[#dddddd] rounded-xl focus:outline-none focus:border-[#181d26]" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('รายการทั้งหมด', 'Total Inventory Items'), value: kpiTotal, color: 'border-zinc-200 bg-white', icon: <Boxes size={16} className="text-zinc-400" /> },
          { label: t('หน่วยในคลัง', 'Total Units in Warehouse'), value: kpiUnits.toLocaleString(), color: 'border-[#dddddd] bg-[#f8fafc]/40', icon: <Warehouse size={16} className="text-[#181d26]" /> },
          { label: t('ใกล้หมด', 'Low Stock Items'), value: kpiLow, color: 'border-orange-100 bg-orange-50/40', icon: <AlertTriangle size={16} className="text-orange-500" /> },
          { label: t('วิกฤต', 'Critical Stock Items'), value: kpiCritical, color: 'border-red-100 bg-red-50/40', icon: <AlertTriangle size={16} className="text-red-500" /> },
        ].map(k => (
          <div key={k.label} className={`p-3.5 rounded-xl border ${k.color} flex items-center justify-between shadow-xs`}>
            <div><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{k.label}</p><p className="font-black text-xl text-zinc-800 mt-0.5">{k.value}</p></div>
            {k.icon}
          </div>
        ))}
      </div>

      {isAdmin ? (
        <div className="bg-white border border-[#dddddd] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#dddddd] bg-stone-50/50 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">{t('วัตถุดิบ', 'Item')}</th>
                  <th className="py-2.5 px-3">{t('หมวด', 'Category')}</th>
                  <th className="py-2.5 px-3">{t('คลังกลาง', 'Current Stock')}</th>
                  <th className="py-2.5 px-3">{t('สถานะ', 'Status')}</th>
                  <th className="py-2.5 px-3">{t('กระจายในสาขา', 'Distributed to Branches')}</th>
                  <th className="py-2.5 px-3">{t('อัปเดตล่าสุด', 'Last Updated')}</th>
                  <th className="py-2.5 px-3 text-right">{t('จัดการ', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-zinc-400">{t('ไม่พบรายการตามตัวกรอง', 'No inventory records match the current filters.')}</td></tr>
                ) : filtered.map(i => {
                  const s = classify(i);
                  const cfg = STATE_CFG[s];
                  const inBranches = Object.values(i.branchStock).reduce((a: number, b: number) => a + b, 0);
                  return (
                    <tr key={i.id} id={`wh-row-${i.id}`} className="hover:bg-stone-50/60">
                      <td className="py-3 px-3"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${cfg.bar}`} /><span className="font-bold text-zinc-800">{i.name}</span></div></td>
                      <td className="py-3 px-3 text-zinc-500">{i.category}</td>
                      <td className="py-3 px-3"><span className="font-mono font-black text-zinc-800">{i.warehouseQty}</span> <span className="text-[10px] text-zinc-400">{i.unit}</span></td>
                      <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${cfg.badge}`}>{language === 'TH' ? cfg.labelTH : cfg.label}</span></td>
                      <td className="py-3 px-3 text-zinc-500 font-mono">{inBranches} {i.unit}</td>
                      <td className="py-3 px-3 text-[10px] text-zinc-400 font-mono">{i.lastUpdated}</td>
                      <td className="py-3 px-3 text-right">
                        <button id={`edit-item-${i.id}`} onClick={() => openEdit(i)} className="px-2.5 py-1 bg-[#181d26]/5 border border-[#181d26]/30 hover:bg-[#181d26] hover:text-white text-[#181d26] text-[10.5px] font-bold rounded transition-all inline-flex items-center gap-1"><Pencil size={12} /> {t('แก้ไข', 'Manage')}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(i => {
            const branchStock = i.branchStock[staffAssignedBranch] || 0;
            const empty = i.warehouseQty <= 0;
            const err = addErr[i.id];
            return (
              <div key={i.id} id={`wh-card-${i.id}`} className="bg-white border border-[#dddddd] rounded-2xl shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div><h3 className="font-bold text-sm text-zinc-900">{i.name}</h3><p className="text-[10px] text-zinc-400">{i.category} · {i.unit}</p></div>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${STATE_CFG[classify(i)].badge}`}>{language === 'TH' ? STATE_CFG[classify(i)].labelTH : STATE_CFG[classify(i)].label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-stone-50 rounded-lg"><p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{t('สต็อกสาขา', 'Branch Stock')}</p><p className="font-black text-lg text-zinc-800">{branchStock} <span className="text-[10px] font-normal text-zinc-400">{i.unit}</span></p></div>
                  <div className="p-2.5 bg-[#f8fafc]/50 rounded-lg"><p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{t('คลังกลางคงเหลือ', 'Warehouse Avail.')}</p><p className="font-black text-lg text-[#181d26]">{i.warehouseQty} <span className="text-[10px] font-normal text-zinc-400">{i.unit}</span></p></div>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex-1"><span className="text-[10px] text-zinc-500">{t('จำนวนที่จะเบิก', 'Quantity to Add')}</span>
                    <input id={`qty-${i.id}`} type="number" min={1} disabled={empty} value={addQty[i.id] ?? ''} onChange={e => { setAddQty(p => ({ ...p, [i.id]: e.target.value })); setAddErr(p => ({ ...p, [i.id]: '' })); }}
                      className="mt-1 w-full text-sm py-2 px-3 font-mono font-bold bg-white border border-[#dddddd] rounded-lg focus:outline-none focus:border-[#181d26] disabled:bg-stone-100" placeholder="0" /></label>
                  <button id={`add-stock-${i.id}`} disabled={empty} onClick={() => addToBranch(i)}
                    className="px-4 py-2 bg-[#181d26] hover:bg-[#0d1218] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0"><PackagePlus size={14} /> {t('เบิกเข้าสาขา', 'Add Stock')}</button>
                </div>
                {empty && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={12} />{t('คลังกลางไม่มีสินค้าเพียงพอ', 'Insufficient stock available in the central warehouse.')}</p>}
                {err && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={12} />{err}</p>}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-[#181d26] text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle size={15} className="text-emerald-400" /> {toast}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={closeDrawer}>
          <div className="w-full max-w-md h-full bg-stone-50 shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-white border-b border-[#dddddd] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2"><Warehouse size={16} className="text-[#181d26]" />
                <div><h3 className="font-bold text-sm text-zinc-800">{isNew ? t('เพิ่มวัตถุดิบ', 'Add Inventory Item') : t('จัดการวัตถุดิบ', 'Manage Item')}</h3>
                  <p className="text-[11px] text-zinc-400">{editing.name || t('รายการใหม่', 'New item')}</p></div></div>
              <button onClick={closeDrawer} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
              <section className="space-y-2">
                <h4 className="font-bold text-xs text-[#181d26]">{t('ข้อมูลวัตถุดิบ', 'Item Information')}</h4>
                <label className="block"><span className="text-[10px] text-zinc-500">{t('ชื่อวัตถุดิบ', 'Item Name')} *</span>
                  <input className="w-full text-xs py-2 px-3 bg-white border border-[#dddddd] rounded-lg" value={editing.name} onChange={e => setF('name', e.target.value)} /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('หมวดหมู่', 'Category')}</span>
                    <select className="w-full text-xs py-2 px-3 bg-white border border-[#dddddd] rounded-lg" value={editing.category} onChange={e => setF('category', e.target.value)}>
                      {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select></label>
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('หน่วย', 'Unit')}</span>
                    <select className="w-full text-xs py-2 px-3 bg-white border border-[#dddddd] rounded-lg" value={editing.unit} onChange={e => setF('unit', e.target.value)}>
                      {['bottle', 'bag', 'kg', 'liter', 'box', 'pcs'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select></label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('เกณฑ์ใกล้หมด', 'Reorder Threshold')}</span>
                    <input type="number" className="w-full text-xs py-2 px-3 bg-white border border-[#dddddd] rounded-lg" value={editing.lowThreshold} onChange={e => setF('lowThreshold', Number(e.target.value))} /></label>
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('เกณฑ์วิกฤต', 'Critical Threshold')}</span>
                    <input type="number" className="w-full text-xs py-2 px-3 bg-white border border-[#dddddd] rounded-lg" value={editing.criticalThreshold} onChange={e => setF('criticalThreshold', Number(e.target.value))} /></label>
                </div>
                {isNew && (
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('จำนวนเริ่มต้นในคลัง', 'Initial Warehouse Qty')}</span>
                    <input type="number" className="w-full text-xs py-2 px-3 bg-white border border-[#dddddd] rounded-lg" value={editing.warehouseQty} onChange={e => setF('warehouseQty', Number(e.target.value))} /></label>
                )}
              </section>

              {!isNew && (
                <>
                  <section className="space-y-2">
                    <h4 className="font-bold text-xs text-[#181d26] flex items-center gap-1.5"><PackagePlus size={13} className="text-[#181d26]" />{t('เติมสต็อกคลังกลาง', 'Add Warehouse Stock')}</h4>
                    <div className="p-3 bg-[#f8fafc]/40 border border-[#dddddd] rounded-xl flex items-end gap-2">
                      <div className="flex-1">
                        <p className="text-[10px] text-zinc-500">{t('คงเหลือปัจจุบัน', 'Current')}: <strong className="font-mono text-[#181d26]">{editing.warehouseQty} {editing.unit}</strong></p>
                        <input type="number" min={1} value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder={t('จำนวนที่เติม', 'Qty to add')} className="mt-1 w-full text-sm py-2 px-3 font-mono font-bold bg-white border border-[#dddddd] rounded-lg" />
                      </div>
                      <button onClick={addWarehouseStock} disabled={!restockQty || Number(restockQty) <= 0} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 text-white text-xs font-bold rounded-lg shrink-0">{t('เติม', 'Add')}</button>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-xs text-[#181d26] flex items-center gap-1.5"><Building2 size={13} className="text-[#181d26]" />{t('สต็อกแยกตามสาขา', 'Stock by Branch')}</h4>
                    <div className="border border-[#dddddd] rounded-xl bg-white divide-y divide-zinc-100">
                      {BRANCHES.map(b => (
                        <div key={b} className="flex items-center justify-between px-3 py-2 text-[11px]">
                          <span className="text-zinc-600 font-semibold">{b}</span>
                          <span className="font-mono font-bold text-zinc-800">{editing.branchStock[b] || 0} {editing.unit}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className="p-4 bg-white border-t border-[#dddddd] shrink-0">
              <button onClick={saveItem} className="w-full py-2.5 bg-[#181d26] hover:bg-[#0d1218] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"><Save size={13} /> {t('บันทึก', 'Save Item')}</button>
            </div>
          </div>
        </div>
      )}

      {showHistory && isAdmin && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#dddddd] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2"><ArrowRightLeft size={16} className="text-[#181d26]" />
                <div><h3 className="font-bold text-sm text-zinc-800">{t('ประวัติการเคลื่อนไหวสต็อก', 'Stock Movement History')}</h3>
                  <p className="text-[11px] text-zinc-400">{startDate || t('ไม่จำกัดวันเริ่มต้น', 'Any start date')} - {endDate || t('ไม่จำกัดวันสิ้นสุด', 'Any end date')}</p></div></div>
              <button onClick={() => setShowHistory(false)} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-stone-50 text-[10px] uppercase text-zinc-500 font-bold border-b border-[#dddddd]">
                  <tr>
                    <th className="px-4 py-2">{t('วันเวลา', 'Date & Time')}</th>
                    <th className="px-4 py-2">{t('รายการ', 'Inventory Item')}</th>
                    <th className="px-4 py-2">{t('ประเภท', 'Action Type')}</th>
                    <th className="px-4 py-2 text-right">{t('ก่อนหน้า', 'Before')}</th>
                    <th className="px-4 py-2 text-right">{t('เปลี่ยนแปลง', 'Changed')}</th>
                    <th className="px-4 py-2 text-right">{t('หลัง', 'After')}</th>
                    <th className="px-4 py-2">{t('ผู้ดำเนินการ', 'Performed By')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {movementFiltered.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-zinc-400">{t('ไม่พบประวัติในช่วงวันที่เลือก', 'No movement history found for the selected date range.')}</td></tr>
                  ) : movementFiltered.map(m => (
                    <tr key={m.id} className="hover:bg-stone-50/60">
                      <td className="px-4 py-3 font-mono text-zinc-500">{m.timestamp}</td>
                      <td className="px-4 py-3 font-bold text-zinc-800">{m.itemName}</td>
                      <td className="px-4 py-3"><span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${actionStyle(m.action)}`}>{actionLabel(m.action)}</span></td>
                      <td className="px-4 py-3 text-right font-mono">{m.before} {unitLabel(m.unit)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-black ${m.qty < 0 ? 'text-sky-700' : 'text-emerald-700'}`}>{m.qty > 0 ? '+' : ''}{m.qty} {unitLabel(m.unit)}</td>
                      <td className="px-4 py-3 text-right font-mono">{m.after} {unitLabel(m.unit)}</td>
                      <td className="px-4 py-3 text-zinc-600">{m.user}{m.branch ? <span className="block text-[10px] text-zinc-400">{m.branch}</span> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
