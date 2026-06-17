import { useState, Dispatch, SetStateAction } from 'react';
import { Ingredient, Branch } from '../types';
import { AlertTriangle, Package, CheckCircle, RefreshCw, ClipboardList, X, RotateCcw, TrendingDown, Trash2, SlidersHorizontal, History, Download } from 'lucide-react';
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

type StockState = 'normal' | 'low' | 'critical';

// 3-state classification: critical (empty) → low (≤30%) → normal
function classify(level: number): StockState {
  if (level <= 0) return 'critical';
  if (level <= 30) return 'low';
  return 'normal';
}

function getStatusFromLevel(level: number): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (level <= 0) return 'Out of Stock';
  if (level <= 30) return 'Low Stock';
  return 'In Stock';
}

// Colours: normal = green, low = orange, critical = red
const STATE_CFG: Record<StockState, { bar: string; badge: string; dot: string; label: string; labelTH: string }> = {
  normal:   { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', label: 'Normal',   labelTH: 'ปกติ' },
  low:      { bar: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-800 border-orange-200',    dot: 'bg-orange-500',  label: 'Low',      labelTH: 'ใกล้หมด' },
  critical: { bar: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500',     label: 'Critical', labelTH: 'วิกฤต' },
};

const ACTIVITY_ACTION_CONFIG = {
  Restocked: { icon: <RefreshCw size={11} />, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', labelTH: 'เติมสต็อก' },
  Consumed:  { icon: <TrendingDown size={11} />, color: 'text-blue-700 bg-blue-50 border-blue-200', labelTH: 'ใช้งาน' },
  Adjusted:  { icon: <SlidersHorizontal size={11} />, color: 'text-amber-700 bg-amber-50 border-amber-200', labelTH: 'ปรับสต็อก' },
  Wasted:    { icon: <Trash2 size={11} />, color: 'text-red-700 bg-red-50 border-red-200', labelTH: 'สูญเสีย' },
};

const INITIAL_ACTIVITY: StockActivity[] = [
  { id: 'ACT-001', itemName: 'Arabica Beans', action: 'Restocked', fromLevel: 15, toLevel: 100, user: 'Siri S.', timestamp: '08:30, Today', branch: 'Central Plaza' },
  { id: 'ACT-002', itemName: 'Fresh Milk',    action: 'Consumed',  fromLevel: 80, toLevel: 60,  user: 'Auto',     timestamp: '09:45, Today', branch: 'Siam Square' },
  { id: 'ACT-003', itemName: 'Caramel Syrup', action: 'Adjusted',  fromLevel: 40, toLevel: 55,  user: 'Noon K.',  timestamp: '10:12, Today', branch: 'Mega Bangna' },
  { id: 'ACT-004', itemName: 'Paper Cups',    action: 'Wasted',    fromLevel: 70, toLevel: 65,  user: 'Siri S.',  timestamp: '11:00, Today', branch: 'Central Plaza' },
];

const typeLabelTH: Record<string, string> = {
  'Coffee Beans': 'เมล็ดกาแฟ', 'Dairy': 'นมสด', 'Syrup': 'ไซรัป', 'Packaging': 'บรรจุภัณฑ์',
};

export default function StockManagementView({
  ingredients,
  setIngredients,
  selectedBranch,
  setSelectedBranch,
  roleMode,
  staffAssignedBranch,
}: StockManagementViewProps) {
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StockState>('all');
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [activityLog, setActivityLog]   = useState<StockActivity[]>(INITIAL_ACTIVITY);
  const [showActivity, setShowActivity] = useState(false);
  const { language } = useLanguage();

  const isStaff = roleMode === 'Staff';
  const activeBranch = isStaff ? (staffAssignedBranch as Branch) : selectedBranch;
  const currentUser  = isStaff ? 'Staff User' : 'Admin User';
  const t = (th: string, en: string) => (language === 'TH' ? th : en);

  // ── Scoped + filtered lists ─────────────────────────────────────────────────
  const scoped = ingredients.filter(i => activeBranch === 'All Branches' || i.branch === activeBranch);
  const filteredIngredients = scoped.filter(ing => {
    if (statusFilter !== 'all' && classify(ing.stockLevel) !== statusFilter) return false;
    if (searchTerm && !ing.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !ing.type.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const kpiTotal    = scoped.length;
  const kpiNormal   = scoped.filter(i => classify(i.stockLevel) === 'normal').length;
  const kpiLow      = scoped.filter(i => classify(i.stockLevel) === 'low').length;
  const kpiCritical = scoped.filter(i => classify(i.stockLevel) === 'critical').length;

  // Top critical items across ALL branches (Admin monitoring)
  const topCritical = ingredients
    .filter(i => classify(i.stockLevel) !== 'normal')
    .sort((a, b) => a.stockLevel - b.stockLevel)
    .slice(0, 5);

  // Activity scoped to branch for staff
  const scopedActivity = activityLog.filter(a => activeBranch === 'All Branches' || a.branch === activeBranch);

  // ── Stock mutations (Staff only) ────────────────────────────────────────────
  const applyStockChange = (id: string, newLevel: number, action: StockActivity['action']) => {
    const item = ingredients.find(i => i.id === id);
    if (!item) return;
    const fromLevel = item.stockLevel;
    const clamped = Math.min(100, Math.max(0, newLevel));
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, stockLevel: clamped, status: getStatusFromLevel(clamped) } : i));
    setActivityLog(prev => [{
      id: `ACT-${Date.now()}`, itemName: item.name, action, fromLevel, toLevel: clamped,
      user: currentUser, timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today',
      branch: item.branch,
    }, ...prev].slice(0, 30));
  };
  const handleAdjust = (id: string, delta: number) => {
    const item = ingredients.find(i => i.id === id);
    if (item) applyStockChange(id, item.stockLevel + delta, 'Restocked');
  };
  const handleFullRestock = (id: string) => applyStockChange(id, 100, 'Restocked');

  const handleExportCSV = () => {
    const headers = ['Ingredient', 'Type', 'Branch', 'Status', 'Stock Level (%)', 'Unit'];
    const rows = scoped.map(i => [i.name, i.type, i.branch, i.status, i.stockLevel, i.unit]);
    const csv = 'data:text/csv;charset=utf-8,﻿' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `stock_report_${activeBranch.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const selectedItem = ingredients.find(i => i.id === selectedId) ?? null;

  // ── Quick filter tabs ───────────────────────────────────────────────────────
  const tabs: { key: 'all' | StockState; label: string; count: number }[] = [
    { key: 'all',      label: t('ทั้งหมด', 'All'),       count: kpiTotal },
    { key: 'normal',   label: t('ปกติ', 'Normal'),       count: kpiNormal },
    { key: 'low',      label: t('ใกล้หมด', 'Low'),       count: kpiLow },
    { key: 'critical', label: t('วิกฤต', 'Critical'),    count: kpiCritical },
  ];

  return (
    <div className="p-6 space-y-5 font-sans">

      {/* ── Clickable KPI Bar (shortcut filters) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'all' as const,      label: t('รายการทั้งหมด', 'Total Items'), value: kpiTotal,    base: 'border-zinc-200 bg-white',            ring: 'ring-zinc-400',    icon: <Package size={16} className="text-zinc-400" /> },
          { key: 'normal' as const,   label: t('สต็อกปกติ', 'Normal Stock'),   value: kpiNormal,   base: 'border-emerald-100 bg-emerald-50/40', ring: 'ring-emerald-400', icon: <CheckCircle size={16} className="text-emerald-600" /> },
          { key: 'low' as const,      label: t('สต็อกต่ำ', 'Low Stock'),       value: kpiLow,      base: 'border-orange-100 bg-orange-50/40',   ring: 'ring-orange-400',  icon: <AlertTriangle size={16} className="text-orange-500" /> },
          { key: 'critical' as const, label: t('วิกฤต', 'Critical'),           value: kpiCritical, base: 'border-red-100 bg-red-50/40',         ring: 'ring-red-400',     icon: <AlertTriangle size={16} className="text-red-500" /> },
        ].map(kpi => {
          const active = statusFilter === kpi.key;
          return (
            <button
              key={kpi.key}
              id={`stock-kpi-${kpi.key}`}
              onClick={() => setStatusFilter(kpi.key)}
              className={`text-left p-3.5 rounded-xl border ${kpi.base} flex items-center justify-between shadow-xs transition-all hover:shadow-md cursor-pointer ${active ? `ring-2 ${kpi.ring}` : ''}`}
            >
              <div>
                <p className="font-sans text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{kpi.label}</p>
                <p className="font-black text-xl text-zinc-800 mt-0.5">{kpi.value}</p>
              </div>
              {kpi.icon}
            </button>
          );
        })}
      </div>

      {/* ── Toolbar: title, search, branch, quick-filter tabs ── */}
      <div className="bg-white p-4 rounded-xl border border-[#E6DFD9] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-sans font-bold text-sm text-[#2E2A25]">{t('จัดการสต็อกและวัตถุดิบ', 'Stock & Ingredients')}</h3>
            <p className="font-sans text-[11px] text-zinc-500">
              {isStaff ? t('เติมและปรับสต็อกวัตถุดิบประจำสาขา', 'Replenish and adjust your branch stock')
                       : t('ติดตามภาพรวมสต็อกทุกสาขา (ดูอย่างเดียว)', 'Monitor stock across all branches (read-only)')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="stock-view-history-btn"
              onClick={() => setShowActivity(true)}
              className="px-3.5 py-1.5 border border-[#E6DFD9] bg-stone-50 hover:bg-stone-100 text-zinc-600 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
            >
              <History size={13} className="text-[#8B6B4F]" /> {t('ดูประวัติการเคลื่อนไหว', 'View History')}
            </button>
            {isStaff ? (
              <button
                onClick={() => filteredIngredients.forEach(i => handleFullRestock(i.id))}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-[#8B6B4F] text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={12} /> {t('เติมเต็มสต็อกทั้งหมด', 'Restock All')}
              </button>
            ) : (
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-[#8B6B4F] text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
              >
                <Download size={12} /> {t('ส่งออกรายงาน', 'Export Report')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder={t('ค้นหาวัตถุดิบ...', 'Search ingredients...')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs py-2 px-3 font-sans bg-stone-50 border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F]"
            />
          </div>
          <div>
            {isStaff ? (
              <div className="w-full text-xs py-2 px-3 bg-zinc-100 border border-[#E6DFD9] rounded-lg text-zinc-600 font-sans font-semibold flex items-center gap-1.5">
                🔒 {t('สาขา:', 'Branch:')} {staffAssignedBranch}
              </div>
            ) : (
              <select
                id="stock-branch-filter"
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value as Branch)}
                className="w-full text-xs py-2 px-3 font-sans bg-stone-50 border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F] text-zinc-600 cursor-pointer"
              >
                <option value="All Branches">{t('ทุกสาขา', 'All Branches')}</option>
                <option value="Central Plaza">Central Plaza</option>
                <option value="Siam Square">Siam Square</option>
                <option value="Mega Bangna">Mega Bangna</option>
                <option value="The Mall Korat">The Mall Korat</option>
              </select>
            )}
          </div>
        </div>

        {/* Quick filter tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                id={`stock-tab-${tab.key}`}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-1.5 ${active ? 'bg-[#8B6B4F] text-white shadow-xs' : 'bg-stone-50 border border-[#E6DFD9] text-zinc-600 hover:bg-stone-100'}`}
              >
                {tab.label}
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-stone-200 text-zinc-500'}`}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main grid: Table + Side Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Stock Table */}
        <div className="lg:col-span-2 bg-white border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto min-h-64">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6DFD9] bg-stone-50/50">
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('วัตถุดิบ', 'Ingredient')}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('ประเภท', 'Type')}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('สถานะ', 'Status')}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('ระดับคงเหลือ', 'Stock Level')}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('หน่วย', 'Unit')}</th>
                  {isStaff && <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">{t('การจัดการ', 'Action')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-sans text-xs">
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={isStaff ? 6 : 5} className="py-14 text-center">
                      {(statusFilter === 'low' || statusFilter === 'critical') ? (
                        <div className="flex flex-col items-center gap-2 text-emerald-600">
                          <CheckCircle size={28} />
                          <p className="text-sm font-semibold text-zinc-600">{t('วัตถุดิบทุกอย่างอยู่ในระดับปกติ', 'All ingredients are at normal levels')}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400">{t('ไม่พบวัตถุดิบ', 'No ingredients found.')}</p>
                      )}
                    </td>
                  </tr>
                ) : filteredIngredients.map(ing => {
                  const s = classify(ing.stockLevel);
                  const cfg = STATE_CFG[s];
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
                            {activeBranch === 'All Branches' && <div className="font-mono text-[9px] text-zinc-400 mt-0.5">{ing.branch}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-500">{language === 'TH' ? (typeLabelTH[ing.type] ?? ing.type) : ing.type}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${cfg.badge}`}>{language === 'TH' ? cfg.labelTH : cfg.label}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1 w-28">
                          <div className="text-[10px] font-mono font-semibold text-zinc-600">{ing.stockLevel}%</div>
                          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${ing.stockLevel}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 font-mono text-[11px]">{ing.unit}</td>
                      {isStaff && (
                        <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            id={`restock-btn-${ing.id}`}
                            onClick={() => handleFullRestock(ing.id)}
                            className="px-2.5 py-1 border hover:bg-[#8B6B4F] hover:text-white rounded text-[10.5px] text-[#8B6B4F] border-[#8B6B4F]/30 bg-[#8B6B4F]/5 transition-all font-semibold cursor-pointer whitespace-nowrap"
                          >
                            {t('เติมเต็มสต็อก', 'Restock Full')}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel */}
        <div className="bg-white border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs self-start">
          {selectedItem ? (() => {
            const s = classify(selectedItem.stockLevel);
            const cfg = STATE_CFG[s];
            return (
              <div>
                {/* 1. Name + 2. Type / Branch */}
                <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9] flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">{selectedItem.name}</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {language === 'TH' ? typeLabelTH[selectedItem.type] ?? selectedItem.type : selectedItem.type}{' · '}{selectedItem.branch}
                    </p>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-zinc-400 hover:text-zinc-600 shrink-0 cursor-pointer"><X size={14} /></button>
                </div>

                <div className="p-4 space-y-4 text-xs">
                  {/* 3. Current level + 4. Status */}
                  <div className="p-3.5 bg-stone-50 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">{t('ระดับคงเหลือปัจจุบัน', 'Current Stock')}</span>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${cfg.badge}`}>{language === 'TH' ? cfg.labelTH : cfg.label}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="font-black text-3xl text-zinc-900 leading-none">{selectedItem.stockLevel}</span>
                      <span className="text-zinc-400 font-mono text-sm mb-0.5">% · {selectedItem.unit}</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${selectedItem.stockLevel}%` }} />
                    </div>
                  </div>

                  {/* 5. Restock buttons (Staff) / read-only (Admin) */}
                  {isStaff ? (
                    <div className="space-y-2">
                      <span className="font-mono text-[9px] text-[#8B6B4F] uppercase tracking-wider font-extrabold block">{t('เติมสต็อก', 'Replenish')}</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[{ d: 10, th: 'เติมเล็กน้อย', en: 'Small' }, { d: 25, th: 'เติมปกติ', en: 'Normal' }].map(opt => (
                          <button
                            key={opt.d}
                            id={`sidepanel-add-${opt.d}`}
                            onClick={() => handleAdjust(selectedItem.id, opt.d)}
                            className="py-2 border border-[#8B6B4F]/20 hover:bg-[#8B6B4F] hover:text-white hover:border-[#8B6B4F] font-bold text-zinc-700 rounded-lg transition-all cursor-pointer flex flex-col items-center leading-none gap-0.5"
                          >
                            <span className="font-mono text-xs">+{opt.d}%</span>
                            <span className="text-[8.5px] font-sans opacity-80">{language === 'TH' ? opt.th : opt.en}</span>
                          </button>
                        ))}
                        <button
                          id="sidepanel-add-full"
                          onClick={() => handleFullRestock(selectedItem.id)}
                          className="py-2 border border-[#8B6B4F]/20 hover:bg-[#8B6B4F] hover:text-white hover:border-[#8B6B4F] font-bold text-zinc-700 rounded-lg transition-all cursor-pointer flex flex-col items-center leading-none gap-0.5"
                        >
                          <span className="font-mono text-xs">100%</span>
                          <span className="text-[8.5px] font-sans opacity-80">{t('เติมเต็ม', 'Full')}</span>
                        </button>
                      </div>
                      <button
                        id="sidepanel-restock-primary"
                        onClick={() => handleFullRestock(selectedItem.id)}
                        className="w-full py-2.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw size={13} /> {t('เติมเต็มสต็อก', 'Restock to Full')}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-zinc-400 text-[11px]">
                      {t('Admin: ดูข้อมูลอย่างเดียว — การเติมสต็อกเป็นหน้าที่ของพนักงานสาขา', 'Admin: read-only. Restocking is performed by branch staff.')}
                    </div>
                  )}

                  {/* 6. Threshold / Rule */}
                  <div className="p-3 border rounded-xl bg-stone-50 space-y-1">
                    <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider">{t('เกณฑ์แจ้งเตือน', 'Alert Threshold')}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700 font-semibold">{t('ใกล้หมดเมื่อต่ำกว่า', 'Low when below')}</span>
                      <span className="font-mono font-black text-orange-600">30%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-700 font-semibold">{t('วิกฤตเมื่อหมด', 'Critical when empty')}</span>
                      <span className="font-mono font-black text-red-600">0%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : isStaff ? (
            <div className="p-8 text-center text-zinc-400 text-xs space-y-2">
              <Package size={36} className="text-zinc-200 mx-auto" />
              <p className="font-semibold text-zinc-500">{t('ยังไม่ได้เลือกรายการ', 'No Item Selected')}</p>
              <p className="text-[10px] leading-relaxed text-zinc-400">{t('คลิกรายการในตารางเพื่อเติมสต็อก', 'Click any row to replenish stock.')}</p>
            </div>
          ) : (
            /* Admin monitoring default: Top Critical Items across all branches */
            <div>
              <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9] flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">{t('รายการวิกฤตทุกสาขา', 'Top Critical Items')}</h3>
                  <p className="text-[10px] text-zinc-400">{t('สต็อกต่ำสุดทั้งระบบ', 'Lowest stock across all branches')}</p>
                </div>
              </div>
              {topCritical.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2 text-emerald-600">
                  <CheckCircle size={28} />
                  <p className="text-sm font-semibold text-zinc-600">{t('วัตถุดิบทุกอย่างอยู่ในระดับปกติ', 'All ingredients are at normal levels')}</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {topCritical.map(item => {
                    const cfg = STATE_CFG[classify(item.stockLevel)];
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-zinc-800 truncate">{item.name}</p>
                            <p className="text-[9.5px] text-zinc-400">{item.branch}</p>
                          </div>
                        </div>
                        <span className={`font-mono font-black text-sm shrink-0 ${classify(item.stockLevel) === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>{item.stockLevel}%</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Activity History Drawer/Modal ── */}
      {showActivity && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={() => setShowActivity(false)}>
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#E6DFD9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-[#8B6B4F]" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-800">{t('ประวัติการเคลื่อนไหวสต็อก', 'Stock Movement History')}</h3>
                  <p className="text-[11px] text-zinc-400">{isStaff ? `${t('สาขา', 'Branch')}: ${staffAssignedBranch}` : t('ทุกสาขา', 'All branches')}</p>
                </div>
              </div>
              <button onClick={() => setShowActivity(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 custom-scrollbar">
              {scopedActivity.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-xs">{t('ยังไม่มีกิจกรรม', 'No activity recorded yet.')}</div>
              ) : scopedActivity.map(entry => {
                const ac = ACTIVITY_ACTION_CONFIG[entry.action];
                const diff = entry.toLevel - entry.fromLevel;
                return (
                  <div key={entry.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${ac.color}`}>{ac.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-zinc-800">{entry.itemName}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${ac.color}`}>{language === 'TH' ? ac.labelTH : entry.action}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{entry.branch} · {entry.timestamp} · {entry.user}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-xs">
                        <span className="text-zinc-400">{entry.fromLevel}%</span>
                        <span className="text-zinc-300 mx-1">→</span>
                        <span className={diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-600' : 'text-zinc-500'}>{entry.toLevel}%</span>
                      </div>
                      <div className={`font-mono text-[10px] font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-zinc-400'}`}>{diff > 0 ? `+${diff}%` : `${diff}%`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
