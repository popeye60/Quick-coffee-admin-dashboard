import { useState } from 'react';
import {
  Warehouse, Plus, Pencil, X, AlertTriangle, CheckCircle, History, PackagePlus,
  ArrowRightLeft, Boxes, AlertCircle, Save, Building2,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface CentralWarehouseViewProps {
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
}

const BRANCHES = ['Central Plaza', 'Siam Square', 'Mega Bangna', 'The Mall Korat'];

type StockState = 'normal' | 'low' | 'critical';

interface WarehouseItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  warehouseQty: number;
  lowThreshold: number;
  criticalThreshold: number;
  lastUpdated: string;
  branchStock: Record<string, number>;
}

interface Movement {
  id: string;
  itemName: string;
  action: 'Transfer' | 'Restock' | 'Create';
  qty: number;
  unit: string;
  branch?: string;
  user: string;
  timestamp: string;
  warehouseAfter: number;
}

const now = () => new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const SEED_ITEMS: WarehouseItem[] = [
  { id: 'WH-001', name: 'Caramel Syrup', category: 'Syrup', unit: 'bottle', warehouseQty: 100, lowThreshold: 30, criticalThreshold: 10, lastUpdated: '17 Jun 2026, 08:00', branchStock: { 'Central Plaza': 5, 'Siam Square': 8, 'Mega Bangna': 3, 'The Mall Korat': 4 } },
  { id: 'WH-002', name: 'Arabica Beans', category: 'Coffee Beans', unit: 'kg', warehouseQty: 24, lowThreshold: 30, criticalThreshold: 10, lastUpdated: '17 Jun 2026, 08:00', branchStock: { 'Central Plaza': 12, 'Siam Square': 9, 'Mega Bangna': 6, 'The Mall Korat': 5 } },
  { id: 'WH-003', name: 'Fresh Milk', category: 'Dairy', unit: 'liter', warehouseQty: 8, lowThreshold: 40, criticalThreshold: 10, lastUpdated: '17 Jun 2026, 07:30', branchStock: { 'Central Plaza': 20, 'Siam Square': 15, 'Mega Bangna': 10, 'The Mall Korat': 8 } },
  { id: 'WH-004', name: 'Paper Cups (16oz)', category: 'Packaging', unit: 'box', warehouseQty: 150, lowThreshold: 50, criticalThreshold: 20, lastUpdated: '16 Jun 2026, 18:00', branchStock: { 'Central Plaza': 30, 'Siam Square': 25, 'Mega Bangna': 18, 'The Mall Korat': 12 } },
  { id: 'WH-005', name: 'Sugar', category: 'Ingredient', unit: 'kg', warehouseQty: 60, lowThreshold: 25, criticalThreshold: 10, lastUpdated: '16 Jun 2026, 18:00', branchStock: { 'Central Plaza': 8, 'Siam Square': 6, 'Mega Bangna': 5, 'The Mall Korat': 4 } },
];

const SEED_MOVES: Movement[] = [
  { id: 'MV-001', itemName: 'Caramel Syrup', action: 'Transfer', qty: 6, unit: 'bottle', branch: 'Siam Square', user: 'Janejira S.', timestamp: '17 Jun 2026, 07:50', warehouseAfter: 100 },
  { id: 'MV-002', itemName: 'Arabica Beans', action: 'Restock', qty: 24, unit: 'kg', user: 'Admin User', timestamp: '17 Jun 2026, 06:30', warehouseAfter: 24 },
];

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7)}`;
const classify = (i: WarehouseItem): StockState =>
  i.warehouseQty <= i.criticalThreshold ? 'critical' : i.warehouseQty <= i.lowThreshold ? 'low' : 'normal';
const STATE_CFG: Record<StockState, { badge: string; bar: string; label: string; labelTH: string }> = {
  normal:   { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', label: 'Normal', labelTH: 'ปกติ' },
  low:      { badge: 'bg-orange-50 text-orange-700 border-orange-200', bar: 'bg-orange-500', label: 'Low Stock', labelTH: 'ใกล้หมด' },
  critical: { badge: 'bg-red-50 text-red-700 border-red-200', bar: 'bg-red-500', label: 'Critical', labelTH: 'วิกฤต' },
};

const blankItem = (): WarehouseItem => ({
  id: uid('WH'), name: '', category: 'Ingredient', unit: 'bottle', warehouseQty: 0, lowThreshold: 30, criticalThreshold: 10, lastUpdated: now(), branchStock: {},
});

export default function CentralWarehouseView({ roleMode, staffAssignedBranch }: CentralWarehouseViewProps) {
  const { language } = useLanguage();
  const t = (th: string, en: string) => (language === 'TH' ? th : en);
  const isAdmin = roleMode === 'Admin';
  const currentUser = isAdmin ? 'Admin User' : 'Siri Semsak';

  const [items, setItems] = useState<WarehouseItem[]>(SEED_ITEMS);
  const [moves, setMoves] = useState<Movement[]>(SEED_MOVES);
  const [search, setSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Admin: create/edit + add warehouse stock
  const [editing, setEditing] = useState<WarehouseItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [restockQty, setRestockQty] = useState('');

  // Staff: per-item add-to-branch input + error
  const [addQty, setAddQty] = useState<Record<string, string>>({});
  const [addErr, setAddErr] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  const kpiTotal = items.length;
  const kpiLow = items.filter(i => classify(i) === 'low').length;
  const kpiCritical = items.filter(i => classify(i) === 'critical').length;
  const kpiUnits = items.reduce((s, i) => s + i.warehouseQty, 0);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };
  const log = (m: Movement) => setMoves(prev => [m, ...prev].slice(0, 50));

  // ── Admin actions ───────────────────────────────────────────────────────────
  const openCreate = () => { setEditing(blankItem()); setIsNew(true); setRestockQty(''); };
  const openEdit = (i: WarehouseItem) => { setEditing(JSON.parse(JSON.stringify(i))); setIsNew(false); setRestockQty(''); };
  const closeDrawer = () => { setEditing(null); setRestockQty(''); };
  const setF = <K extends keyof WarehouseItem>(k: K, v: WarehouseItem[K]) => setEditing(p => p ? { ...p, [k]: v } : p);

  const saveItem = () => {
    if (!editing || !editing.name.trim()) return;
    const rec = { ...editing, lastUpdated: now() };
    setItems(prev => {
      const idx = prev.findIndex(m => m.id === rec.id);
      return idx === -1 ? [...prev, rec] : prev.map(m => m.id === rec.id ? rec : m);
    });
    if (isNew) log({ id: uid('MV'), itemName: rec.name, action: 'Create', qty: rec.warehouseQty, unit: rec.unit, user: currentUser, timestamp: now(), warehouseAfter: rec.warehouseQty });
    closeDrawer();
  };

  const addWarehouseStock = () => {
    if (!editing) return;
    const q = Number(restockQty);
    if (!q || q <= 0) return;
    const after = editing.warehouseQty + q;
    setEditing(p => p ? { ...p, warehouseQty: after, lastUpdated: now() } : p);
    setItems(prev => prev.map(m => m.id === editing.id ? { ...m, warehouseQty: after, lastUpdated: now() } : m));
    log({ id: uid('MV'), itemName: editing.name, action: 'Restock', qty: q, unit: editing.unit, user: currentUser, timestamp: now(), warehouseAfter: after });
    setRestockQty('');
    flash(t(`เติมคลังกลาง ${q} ${editing.unit} (${editing.name})`, `Restocked warehouse +${q} ${editing.unit} of ${editing.name}`));
  };

  // ── Staff action: transfer warehouse → branch ───────────────────────────────
  const addToBranch = (item: WarehouseItem) => {
    const raw = addQty[item.id] ?? '';
    const q = Number(raw);
    if (item.warehouseQty <= 0) { setAddErr(p => ({ ...p, [item.id]: t('คลังกลางไม่มีสินค้าเพียงพอ', 'Insufficient stock available in the central warehouse.') })); return; }
    if (!q || q <= 0) { setAddErr(p => ({ ...p, [item.id]: t('กรุณากรอกจำนวนที่ถูกต้อง', 'Please enter a valid quantity.') })); return; }
    if (q > item.warehouseQty) { setAddErr(p => ({ ...p, [item.id]: t('จำนวนที่ขอเกินสต็อกคลังกลาง', 'Requested quantity exceeds available warehouse stock.') })); return; }
    const after = item.warehouseQty - q;
    setItems(prev => prev.map(m => m.id === item.id ? {
      ...m, warehouseQty: after, lastUpdated: now(),
      branchStock: { ...m.branchStock, [staffAssignedBranch]: (m.branchStock[staffAssignedBranch] || 0) + q },
    } : m));
    log({ id: uid('MV'), itemName: item.name, action: 'Transfer', qty: q, unit: item.unit, branch: staffAssignedBranch, user: currentUser, timestamp: now(), warehouseAfter: after });
    setAddQty(p => ({ ...p, [item.id]: '' }));
    setAddErr(p => ({ ...p, [item.id]: '' }));
    flash(t(`${staffAssignedBranch} รับ ${q} ${item.unit} ${item.name} จากคลังกลาง`, `${staffAssignedBranch} received ${q} ${item.unit} of ${item.name}`));
  };

  const unitLabel = (u: string) => u;
  const actionLabel = (a: Movement['action']) => a === 'Transfer' ? t('โอนเข้าสาขา', 'Transfer') : a === 'Restock' ? t('เติมคลังกลาง', 'Restock') : t('สร้างรายการ', 'Created');
  const actionStyle = (a: Movement['action']) => a === 'Transfer' ? 'bg-sky-50 text-sky-700 border-sky-200' : a === 'Restock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  return (
    <div className="p-6 space-y-5 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-[#2E2A25] flex items-center gap-2"><Warehouse size={20} className="text-[#8B6B4F]" />{t('คลังสินค้ากลาง', 'Central Warehouse Inventory')}</h2>
          <p className="text-xs text-zinc-500">
            {isAdmin ? t('จัดการวัตถุดิบและสต็อกส่วนกลางของทุกสาขา', 'Manage raw materials & stock for the whole organization')
                     : t(`เบิกสต็อกจากคลังกลางเข้าสาขา ${staffAssignedBranch}`, `Replenish ${staffAssignedBranch} from the central warehouse`)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHistory(true)} className="px-3.5 py-1.5 border border-[#E6DFD9] bg-white hover:bg-stone-50 text-zinc-600 text-xs font-semibold rounded-lg flex items-center gap-1.5">
            <History size={13} className="text-[#8B6B4F]" /> {t('ประวัติการเคลื่อนไหว', 'Movement History')}
          </button>
          {isAdmin && (
            <button id="create-item-btn" onClick={openCreate} className="px-4 py-2 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5">
              <Plus size={14} /> {t('เพิ่มรายการ', 'Add Item')}
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('รายการทั้งหมด', 'Total Items'), value: kpiTotal, color: 'border-zinc-200 bg-white', icon: <Boxes size={16} className="text-zinc-400" /> },
          { label: t('หน่วยในคลัง', 'Warehouse Units'), value: kpiUnits.toLocaleString(), color: 'border-[#E6DFD9] bg-[#FDF1E6]/40', icon: <Warehouse size={16} className="text-[#8B6B4F]" /> },
          { label: t('ใกล้หมด', 'Low Stock'), value: kpiLow, color: 'border-orange-100 bg-orange-50/40', icon: <AlertTriangle size={16} className="text-orange-500" /> },
          { label: t('วิกฤต', 'Critical'), value: kpiCritical, color: 'border-red-100 bg-red-50/40', icon: <AlertTriangle size={16} className="text-red-500" /> },
        ].map(k => (
          <div key={k.label} className={`p-3.5 rounded-xl border ${k.color} flex items-center justify-between shadow-xs`}>
            <div><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{k.label}</p><p className="font-black text-xl text-zinc-800 mt-0.5">{k.value}</p></div>
            {k.icon}
          </div>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('ค้นหาวัตถุดิบ...', 'Search items...')}
        className="w-full sm:w-80 text-xs py-2 px-3 bg-white border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F]" />

      {/* ── ADMIN: warehouse table ── */}
      {isAdmin ? (
        <div className="bg-white border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6DFD9] bg-stone-50/50 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">{t('วัตถุดิบ', 'Item')}</th>
                  <th className="py-2.5 px-3">{t('หมวด', 'Category')}</th>
                  <th className="py-2.5 px-3">{t('คลังกลาง', 'Warehouse')}</th>
                  <th className="py-2.5 px-3">{t('สถานะ', 'Status')}</th>
                  <th className="py-2.5 px-3">{t('กระจายในสาขา', 'In Branches')}</th>
                  <th className="py-2.5 px-3">{t('อัปเดตล่าสุด', 'Last Updated')}</th>
                  <th className="py-2.5 px-3 text-right">{t('จัดการ', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filtered.map(i => {
                  const s = classify(i); const cfg = STATE_CFG[s];
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
                        <button id={`edit-item-${i.id}`} onClick={() => openEdit(i)} className="px-2.5 py-1 bg-[#8B6B4F]/5 border border-[#8B6B4F]/30 hover:bg-[#8B6B4F] hover:text-white text-[#8B6B4F] text-[10.5px] font-bold rounded transition-all inline-flex items-center gap-1"><Pencil size={12} /> {t('แก้ไข', 'Manage')}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── STAFF: replenish panel ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(i => {
            const branchStock = i.branchStock[staffAssignedBranch] || 0;
            const empty = i.warehouseQty <= 0;
            const err = addErr[i.id];
            return (
              <div key={i.id} id={`wh-card-${i.id}`} className="bg-white border border-[#E6DFD9] rounded-2xl shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div><h3 className="font-bold text-sm text-zinc-900">{i.name}</h3><p className="text-[10px] text-zinc-400">{i.category} · {i.unit}</p></div>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${STATE_CFG[classify(i)].badge}`}>{language === 'TH' ? STATE_CFG[classify(i)].labelTH : STATE_CFG[classify(i)].label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-stone-50 rounded-lg"><p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{t('สต็อกสาขา', 'Branch Stock')}</p><p className="font-black text-lg text-zinc-800">{branchStock} <span className="text-[10px] font-normal text-zinc-400">{i.unit}</span></p></div>
                  <div className="p-2.5 bg-[#FDF1E6]/50 rounded-lg"><p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{t('คลังกลางคงเหลือ', 'Warehouse Avail.')}</p><p className="font-black text-lg text-[#8B6B4F]">{i.warehouseQty} <span className="text-[10px] font-normal text-zinc-400">{i.unit}</span></p></div>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex-1"><span className="text-[10px] text-zinc-500">{t('จำนวนที่จะเบิก', 'Quantity to Add')}</span>
                    <input id={`qty-${i.id}`} type="number" min={1} disabled={empty} value={addQty[i.id] ?? ''} onChange={e => { setAddQty(p => ({ ...p, [i.id]: e.target.value })); setAddErr(p => ({ ...p, [i.id]: '' })); }}
                      className="mt-1 w-full text-sm py-2 px-3 font-mono font-bold bg-white border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F] disabled:bg-stone-100" placeholder="0" /></label>
                  <button id={`add-stock-${i.id}`} disabled={empty} onClick={() => addToBranch(i)}
                    className="px-4 py-2 bg-[#8B6B4F] hover:bg-[#70533C] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0"><PackagePlus size={14} /> {t('เบิกเข้าสาขา', 'Add Stock')}</button>
                </div>
                {empty && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={12} />{t('คลังกลางไม่มีสินค้าเพียงพอ', 'Insufficient stock available in the central warehouse.')}</p>}
                {err && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={12} />{err}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-[#2E2A25] text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle size={15} className="text-emerald-400" /> {toast}
        </div>
      )}

      {/* ── Admin Edit/Create drawer ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={closeDrawer}>
          <div className="w-full max-w-md h-full bg-stone-50 shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-white border-b border-[#E6DFD9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2"><Warehouse size={16} className="text-[#8B6B4F]" />
                <div><h3 className="font-bold text-sm text-zinc-800">{isNew ? t('เพิ่มวัตถุดิบ', 'Add Inventory Item') : t('จัดการวัตถุดิบ', 'Manage Item')}</h3>
                  <p className="text-[11px] text-zinc-400">{editing.name || t('รายการใหม่', 'New item')}</p></div></div>
              <button onClick={closeDrawer} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
              <section className="space-y-2">
                <h4 className="font-bold text-xs text-[#2E2A25]">{t('ข้อมูลวัตถุดิบ', 'Item Information')}</h4>
                <label className="block"><span className="text-[10px] text-zinc-500">{t('ชื่อวัตถุดิบ', 'Item Name')} *</span>
                  <input className="w-full text-xs py-2 px-3 bg-white border border-[#E6DFD9] rounded-lg" value={editing.name} onChange={e => setF('name', e.target.value)} /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('หมวดหมู่', 'Category')}</span>
                    <input className="w-full text-xs py-2 px-3 bg-white border border-[#E6DFD9] rounded-lg" value={editing.category} onChange={e => setF('category', e.target.value)} /></label>
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('หน่วย', 'Unit')}</span>
                    <select className="w-full text-xs py-2 px-3 bg-white border border-[#E6DFD9] rounded-lg" value={editing.unit} onChange={e => setF('unit', e.target.value)}>
                      {['bottle', 'bag', 'kg', 'liter', 'box', 'pcs'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select></label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('เกณฑ์ใกล้หมด', 'Low Threshold')}</span>
                    <input type="number" className="w-full text-xs py-2 px-3 bg-white border border-[#E6DFD9] rounded-lg" value={editing.lowThreshold} onChange={e => setF('lowThreshold', Number(e.target.value))} /></label>
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('เกณฑ์วิกฤต', 'Critical Threshold')}</span>
                    <input type="number" className="w-full text-xs py-2 px-3 bg-white border border-[#E6DFD9] rounded-lg" value={editing.criticalThreshold} onChange={e => setF('criticalThreshold', Number(e.target.value))} /></label>
                </div>
                {isNew && (
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('จำนวนเริ่มต้นในคลัง', 'Initial Warehouse Qty')}</span>
                    <input type="number" className="w-full text-xs py-2 px-3 bg-white border border-[#E6DFD9] rounded-lg" value={editing.warehouseQty} onChange={e => setF('warehouseQty', Number(e.target.value))} /></label>
                )}
              </section>

              {!isNew && (
                <>
                  <section className="space-y-2">
                    <h4 className="font-bold text-xs text-[#2E2A25] flex items-center gap-1.5"><PackagePlus size={13} className="text-[#8B6B4F]" />{t('เติมสต็อกคลังกลาง', 'Add Warehouse Stock')}</h4>
                    <div className="p-3 bg-[#FDF1E6]/40 border border-[#E6DFD9] rounded-xl flex items-end gap-2">
                      <div className="flex-1">
                        <p className="text-[10px] text-zinc-500">{t('คงเหลือปัจจุบัน', 'Current')}: <strong className="font-mono text-[#8B6B4F]">{editing.warehouseQty} {editing.unit}</strong></p>
                        <input type="number" min={1} value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder={t('จำนวนที่เติม', 'Qty to add')} className="mt-1 w-full text-sm py-2 px-3 font-mono font-bold bg-white border border-[#E6DFD9] rounded-lg" />
                      </div>
                      <button onClick={addWarehouseStock} disabled={!restockQty || Number(restockQty) <= 0} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 text-white text-xs font-bold rounded-lg shrink-0">{t('เติม', 'Add')}</button>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-xs text-[#2E2A25] flex items-center gap-1.5"><Building2 size={13} className="text-[#8B6B4F]" />{t('สต็อกแยกตามสาขา', 'Stock by Branch')}</h4>
                    <div className="border border-[#E6DFD9] rounded-xl bg-white divide-y divide-zinc-100">
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

            <div className="p-4 bg-white border-t border-[#E6DFD9] shrink-0">
              <button onClick={saveItem} className="w-full py-2.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"><Save size={13} /> {t('บันทึก', 'Save Item')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Movement history drawer ── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#E6DFD9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2"><ArrowRightLeft size={16} className="text-[#8B6B4F]" />
                <div><h3 className="font-bold text-sm text-zinc-800">{t('ประวัติการเคลื่อนไหวสต็อก', 'Stock Movement History')}</h3>
                  <p className="text-[11px] text-zinc-400">{isAdmin ? t('ทุกสาขา', 'All branches') : staffAssignedBranch}</p></div></div>
              <button onClick={() => setShowHistory(false)} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 custom-scrollbar">
              {(isAdmin ? moves : moves.filter(m => !m.branch || m.branch === staffAssignedBranch)).map(m => (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${actionStyle(m.action)}`}>{actionLabel(m.action)}</span>
                      <span className="font-bold text-xs text-zinc-800 truncate">{m.itemName}</span>
                    </div>
                    <span className={`font-mono font-black text-sm shrink-0 ${m.action === 'Transfer' ? 'text-sky-700' : 'text-emerald-700'}`}>{m.action === 'Transfer' ? '−' : '+'}{m.qty} {unitLabel(m.unit)}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    {m.action === 'Transfer'
                      ? t(`${m.branch} รับ ${m.qty} ${m.unit} · คลังกลางเหลือ ${m.warehouseAfter}`, `${m.branch} received ${m.qty} ${m.unit} · warehouse left ${m.warehouseAfter}`)
                      : t(`คลังกลางคงเหลือ ${m.warehouseAfter} ${m.unit}`, `Warehouse now ${m.warehouseAfter} ${m.unit}`)}
                  </p>
                  <p className="text-[9.5px] text-zinc-400 mt-0.5 font-mono">{m.user} · {m.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
