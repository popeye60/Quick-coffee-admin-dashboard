import { useState, Dispatch, SetStateAction } from 'react';
import { Ingredient, Branch } from '../types';
import { AlertTriangle, Package, CheckCircle, RefreshCw, ClipboardList, X, RotateCcw, TrendingDown, Trash2, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface StockManagementViewProps {
  ingredients: Ingredient[];
  setIngredients: Dispatch<SetStateAction<Ingredient[]>>;
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
}

interface StockActivity {
  id: string;
  itemName: string;
  action: 'Restocked' | 'Consumed' | 'Adjusted' | 'Wasted';
  fromLevel: number;
  toLevel: number;
  user: string;
  timestamp: string;
  branch: string;
}

// 4-tier stock level classification
function getStockTier(level: number): 'critical' | 'low' | 'warning' | 'normal' {
  if (level === 0) return 'critical';
  if (level <= 20) return 'low';
  if (level <= 50) return 'warning';
  return 'normal';
}

function getStatusFromLevel(level: number): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (level <= 0) return 'Out of Stock';
  if (level <= 30) return 'Low Stock';
  return 'In Stock';
}

const TIER_CONFIG = {
  normal:   { bar: 'bg-emerald-500',   badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',  dot: 'bg-emerald-500',  label: 'Normal',   labelTH: 'ปกติ' },
  warning:  { bar: 'bg-yellow-400',    badge: 'bg-yellow-50 text-yellow-800 border-yellow-200',     dot: 'bg-yellow-400',   label: 'Warning',  labelTH: 'เฝ้าระวัง' },
  low:      { bar: 'bg-orange-500',    badge: 'bg-orange-50 text-orange-800 border-orange-200',     dot: 'bg-orange-500',   label: 'Low Stock', labelTH: 'สต็อกต่ำ' },
  critical: { bar: 'bg-red-500',       badge: 'bg-red-50 text-red-800 border-red-200',              dot: 'bg-red-500',      label: 'Critical', labelTH: 'วิกฤต' },
};

const ACTIVITY_ACTION_CONFIG = {
  Restocked: { icon: <RefreshCw size={11} />, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', labelTH: 'เติมสต็อก' },
  Consumed:  { icon: <TrendingDown size={11} />, color: 'text-blue-700 bg-blue-50 border-blue-200',    labelTH: 'ใช้งาน' },
  Adjusted:  { icon: <SlidersHorizontal size={11} />, color: 'text-amber-700 bg-amber-50 border-amber-200', labelTH: 'ปรับสต็อก' },
  Wasted:    { icon: <Trash2 size={11} />, color: 'text-red-700 bg-red-50 border-red-200',             labelTH: 'สูญเสีย' },
};

const INITIAL_ACTIVITY: StockActivity[] = [
  { id: 'ACT-001', itemName: 'Arabica Beans', action: 'Restocked', fromLevel: 15, toLevel: 100, user: 'Siri S.', timestamp: '08:30, Today', branch: 'Central Plaza' },
  { id: 'ACT-002', itemName: 'Fresh Milk',    action: 'Consumed',  fromLevel: 80, toLevel: 60,  user: 'Auto',     timestamp: '09:45, Today', branch: 'Siam Square' },
  { id: 'ACT-003', itemName: 'Caramel Syrup', action: 'Adjusted',  fromLevel: 40, toLevel: 55,  user: 'Noon K.',  timestamp: '10:12, Today', branch: 'Mega Bangna' },
  { id: 'ACT-004', itemName: 'Paper Cups',    action: 'Wasted',    fromLevel: 70, toLevel: 65,  user: 'Siri S.',  timestamp: '11:00, Today', branch: 'Central Plaza' },
];

export default function StockManagementView({
  ingredients,
  setIngredients,
  selectedBranch,
  setSelectedBranch,
  roleMode,
  staffAssignedBranch,
}: StockManagementViewProps) {
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [activityLog, setActivityLog]       = useState<StockActivity[]>(INITIAL_ACTIVITY);
  const { language }                        = useLanguage();

  const activeBranch = roleMode === 'Staff' ? (staffAssignedBranch as Branch) : selectedBranch;
  const currentUser  = roleMode === 'Staff' ? 'Staff User' : 'Admin User';

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filteredIngredients = ingredients.filter(ing => {
    if (activeBranch !== 'All Branches' && ing.branch !== activeBranch) return false;
    if (searchTerm && !ing.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !ing.type.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // ── KPI counts ──────────────────────────────────────────────────────────────
  const scopedIngredients = ingredients.filter(i =>
    activeBranch === 'All Branches' || i.branch === activeBranch
  );
  const kpiTotal    = scopedIngredients.length;
  const kpiNormal   = scopedIngredients.filter(i => getStockTier(i.stockLevel) === 'normal').length;
  const kpiWarning  = scopedIngredients.filter(i => getStockTier(i.stockLevel) === 'warning').length;
  const kpiLow      = scopedIngredients.filter(i => getStockTier(i.stockLevel) === 'low').length;
  const kpiCritical = scopedIngredients.filter(i => getStockTier(i.stockLevel) === 'critical').length;

  // ── Stock update with activity log ─────────────────────────────────────────
  const applyStockChange = (id: string, newLevel: number, action: StockActivity['action']) => {
    const item = ingredients.find(i => i.id === id);
    if (!item) return;
    const fromLevel = item.stockLevel;
    const clamped   = Math.min(100, Math.max(0, newLevel));
    setIngredients(prev => prev.map(i =>
      i.id === id ? { ...i, stockLevel: clamped, status: getStatusFromLevel(clamped) } : i
    ));
    const log: StockActivity = {
      id:        `ACT-${Date.now()}`,
      itemName:  item.name,
      action,
      fromLevel,
      toLevel:   clamped,
      user:      currentUser,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
      branch:    item.branch,
    };
    setActivityLog(prev => [log, ...prev].slice(0, 20));
  };

  const handleAdjust = (id: string, delta: number) => {
    const item = ingredients.find(i => i.id === id);
    if (!item) return;
    applyStockChange(id, item.stockLevel + delta, delta > 0 ? 'Restocked' : 'Consumed');
  };

  const handleFullRestock = (id: string) => applyStockChange(id, 100, 'Restocked');

  const handleBulkRestock = () => {
    filteredIngredients.forEach(i => handleFullRestock(i.id));
  };

  const selectedItem = ingredients.find(i => i.id === selectedId) ?? null;

  // ── Helper: type label ──────────────────────────────────────────────────────
  const typeLabelTH: Record<string, string> = {
    'Coffee Beans': 'เมล็ดกาแฟ',
    'Dairy':        'นมสด',
    'Syrup':        'ไซรัป',
    'Packaging':    'บรรจุภัณฑ์',
  };

  return (
    <div className="p-6 space-y-5 font-sans">

      {/* ── KPI Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: language === 'TH' ? 'รายการทั้งหมด' : 'Total Items',    value: kpiTotal,    color: 'border-zinc-200 bg-white',              icon: <Package size={16} className="text-zinc-400" /> },
          { label: language === 'TH' ? 'สต็อกปกติ' : 'Normal Stock',       value: kpiNormal,   color: 'border-emerald-100 bg-emerald-50/40',   icon: <CheckCircle size={16} className="text-emerald-600" /> },
          { label: language === 'TH' ? 'สต็อกต่ำ' : 'Low Stock',           value: kpiLow + kpiWarning, color: 'border-amber-100 bg-amber-50/40', icon: <AlertTriangle size={16} className="text-amber-500" /> },
          { label: language === 'TH' ? 'วิกฤต' : 'Critical',               value: kpiCritical, color: 'border-red-100 bg-red-50/40',           icon: <AlertTriangle size={16} className="text-red-500" /> },
        ].map(kpi => (
          <div key={kpi.label} className={`p-3.5 rounded-xl border ${kpi.color} flex items-center justify-between shadow-xs`}>
            <div>
              <p className="font-sans text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{kpi.label}</p>
              <p className="font-black text-xl text-zinc-800 mt-0.5">{kpi.value}</p>
            </div>
            {kpi.icon}
          </div>
        ))}
      </div>

      {/* ── Alert banner ── */}
      {(kpiLow + kpiCritical) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex gap-3 items-start text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <p className="text-xs font-sans leading-relaxed">
            {language === 'TH'
              ? <span>มีวัตถุดิบ <strong>{kpiLow + kpiCritical}</strong> รายการที่ต้องการการเติมสต็อกโดยด่วน</span>
              : <span><strong>{kpiLow + kpiCritical}</strong> ingredient(s) need immediate restocking.</span>}
          </p>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white p-4 rounded-xl border border-[#E6DFD9] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-sans font-bold text-sm text-[#2E2A25]">
              {language === 'TH' ? 'จัดการสต็อกและวัตถุดิบ' : 'Stock & Ingredients'}
            </h3>
            <p className="font-sans text-[11px] text-zinc-500">
              {language === 'TH' ? 'ติดตามและเติมสต็อกวัตถุดิบแบบเรียลไทม์' : 'Real-time stock monitoring and replenishment'}
            </p>
          </div>
          {roleMode === 'Staff' && (
            <button
              onClick={handleBulkRestock}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-[#8B6B4F] text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              {language === 'TH' ? 'เติมเต็มสต็อกทั้งหมด' : 'Restock All Items'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder={language === 'TH' ? 'ค้นหาวัตถุดิบ...' : 'Search ingredients...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs py-2 px-3 font-sans bg-stone-50 border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F]"
            />
          </div>
          <div>
            {roleMode === 'Staff' ? (
              <div className="w-full text-xs py-2 px-3 bg-zinc-100 border border-[#E6DFD9] rounded-lg text-zinc-500 font-sans font-semibold">
                🔒 {language === 'TH' ? 'สาขา:' : 'Branch:'} {staffAssignedBranch}
              </div>
            ) : (
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value as Branch)}
                className="w-full text-xs py-2 px-3 font-sans bg-stone-50 border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F] text-zinc-600 cursor-pointer"
              >
                <option value="All Branches">{language === 'TH' ? 'ทุกสาขา' : 'All Branches'}</option>
                <option value="Central Plaza">Central Plaza</option>
                <option value="Siam Square">Siam Square</option>
                <option value="Mega Bangna">Mega Bangna</option>
                <option value="The Mall Korat">The Mall Korat</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── Main grid: Table + Detail Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Stock Table */}
        <div className="lg:col-span-2 bg-white border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto min-h-64">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6DFD9] bg-stone-50/50">
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'วัตถุดิบ' : 'Ingredient'}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'ประเภท' : 'Type'}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'สถานะ' : 'Status'}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'ระดับสต็อก' : 'Stock Level'}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">{language === 'TH' ? 'เติมสต็อก' : 'Restock'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-sans text-xs">
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      {language === 'TH' ? 'ไม่พบวัตถุดิบ' : 'No ingredients found.'}
                    </td>
                  </tr>
                ) : filteredIngredients.map(ing => {
                  const tier   = getStockTier(ing.stockLevel);
                  const cfg    = TIER_CONFIG[tier];
                  const active = selectedId === ing.id;

                  return (
                    <tr
                      key={ing.id}
                      id={`ingredient-row-${ing.id}`}
                      onClick={() => setSelectedId(active ? null : ing.id)}
                      className={`cursor-pointer transition-colors ${active ? 'bg-[#FDF1E6]/40' : 'hover:bg-stone-50/60'}`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <div>
                            <div className="font-bold text-zinc-800">{ing.name}</div>
                            {activeBranch === 'All Branches' && (
                              <div className="font-mono text-[9px] text-zinc-400 mt-0.5">{ing.branch}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        {language === 'TH' ? (typeLabelTH[ing.type] ?? ing.type) : ing.type}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${cfg.badge}`}>
                          {language === 'TH' ? cfg.labelTH : cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1 w-28">
                          <div className="flex justify-between text-[10px] font-mono font-semibold text-zinc-600">
                            <span>{ing.stockLevel}%</span>
                            <span className="text-zinc-400">{ing.unit}</span>
                          </div>
                          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${ing.stockLevel}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          id={`restock-btn-${ing.id}`}
                          onClick={() => handleFullRestock(ing.id)}
                          disabled={roleMode === 'Admin'}
                          title={roleMode === 'Admin' ? 'Staff only' : undefined}
                          className="px-2.5 py-1 border hover:bg-[#8B6B4F] hover:text-white rounded text-[10.5px] text-[#8B6B4F] border-[#8B6B4F]/30 bg-[#8B6B4F]/5 transition-all font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                        >
                          {language === 'TH' ? 'เติมเต็มสต็อก' : 'Restock Item'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-white border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs self-start">
          {selectedItem ? (() => {
            const tier = getStockTier(selectedItem.stockLevel);
            const cfg  = TIER_CONFIG[tier];
            return (
              <div>
                {/* Header */}
                <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9] flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">{selectedItem.name}</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {language === 'TH' ? typeLabelTH[selectedItem.type] ?? selectedItem.type : selectedItem.type}
                      {' · '}{selectedItem.branch}
                    </p>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-zinc-400 hover:text-zinc-600 shrink-0 cursor-pointer">
                    <X size={14} />
                  </button>
                </div>

                <div className="p-4 space-y-4 text-xs">
                  {/* Stock level display */}
                  <div className="p-3.5 bg-stone-50 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">{language === 'TH' ? 'ระดับสต็อกปัจจุบัน' : 'Current Stock'}</span>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${cfg.badge}`}>
                        {language === 'TH' ? cfg.labelTH : cfg.label}
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="font-black text-3xl text-zinc-900 leading-none">{selectedItem.stockLevel}</span>
                      <span className="text-zinc-400 font-mono text-sm mb-0.5">% · {selectedItem.unit}</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${selectedItem.stockLevel}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                      <span>0%</span>
                      <span className="text-amber-600 font-bold">{language === 'TH' ? '⚠ เกณฑ์ 30%' : '⚠ Alert at 30%'}</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  {roleMode === 'Staff' ? (
                    <div className="space-y-2">
                      <span className="font-mono text-[9px] text-[#8B6B4F] uppercase tracking-wider font-extrabold block">
                        {language === 'TH' ? 'เพิ่มสต็อกด่วน' : 'Quick Add'}
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[10, 25, 50].map(delta => (
                          <button
                            key={delta}
                            onClick={() => handleAdjust(selectedItem.id, delta)}
                            className="py-2 border border-[#8B6B4F]/20 hover:bg-[#8B6B4F] hover:text-white hover:border-[#8B6B4F] font-mono text-xs font-bold text-zinc-700 rounded-lg transition-all cursor-pointer"
                          >
                            +{delta}%
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleFullRestock(selectedItem.id)}
                        className="w-full py-2 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw size={12} />
                        {language === 'TH' ? 'เติมเต็มสต็อก' : 'Restock Item (100%)'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-zinc-400 text-[11px]">
                      {language === 'TH' ? 'Admin: ดูข้อมูลได้เท่านั้น การแก้ไขสต็อกเป็นสิทธิ์ของพนักงาน' : 'Admin view only. Stock updates are performed by Staff.'}
                    </div>
                  )}

                  {/* Alert threshold info */}
                  <div className="p-3 border rounded-xl bg-stone-50 space-y-1">
                    <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider">{language === 'TH' ? 'เกณฑ์แจ้งเตือน' : 'Alert Threshold'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700 font-semibold">{language === 'TH' ? 'แจ้งเตือนเมื่อต่ำกว่า' : 'Alert when below'}</span>
                      <span className="font-mono font-black text-amber-700">30%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700 font-semibold">{language === 'TH' ? 'วิกฤตเมื่อต่ำกว่า' : 'Critical when below'}</span>
                      <span className="font-mono font-black text-red-600">20%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="p-8 text-center text-zinc-400 text-xs space-y-2">
              <Package size={36} className="text-zinc-200 mx-auto" />
              <p className="font-semibold text-zinc-500">{language === 'TH' ? 'ยังไม่ได้เลือกรายการ' : 'No Item Selected'}</p>
              <p className="text-[10px] leading-relaxed text-zinc-400">
                {language === 'TH' ? 'คลิกรายการในตารางเพื่อดูรายละเอียดและเพิ่มสต็อก' : 'Click any row to view details and quick-add stock.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Activity Log ── */}
      <div className="bg-white border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E6DFD9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={15} className="text-[#8B6B4F]" />
            <div>
              <h3 className="font-bold text-sm text-zinc-800">{language === 'TH' ? 'บันทึกกิจกรรมสต็อก' : 'Inventory Activity Log'}</h3>
              <p className="text-[11px] text-zinc-400">{language === 'TH' ? 'แสดงการเคลื่อนไหวสต็อกล่าสุด 20 รายการ' : 'Last 20 stock movements'}</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-zinc-50">
          {activityLog.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              {language === 'TH' ? 'ยังไม่มีกิจกรรม' : 'No activity recorded yet.'}
            </div>
          ) : activityLog.map(entry => {
            const ac  = ACTIVITY_ACTION_CONFIG[entry.action];
            const diff = entry.toLevel - entry.fromLevel;
            return (
              <div key={entry.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${ac.color}`}>
                    {ac.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-zinc-800">{entry.itemName}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${ac.color}`}>
                        {language === 'TH' ? ac.labelTH : entry.action}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {entry.branch} · {entry.timestamp} · {entry.user}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-xs">
                    <span className="text-zinc-400">{entry.fromLevel}%</span>
                    <span className="text-zinc-300 mx-1">→</span>
                    <span className={diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-600' : 'text-zinc-500'}>
                      {entry.toLevel}%
                    </span>
                  </div>
                  <div className={`font-mono text-[10px] font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                    {diff > 0 ? `+${diff}%` : `${diff}%`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
