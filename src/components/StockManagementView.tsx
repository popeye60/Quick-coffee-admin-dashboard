import { useState, Dispatch, SetStateAction } from 'react';
import { Ingredient, Branch } from '../types';
import { AlertTriangle, Package, CheckCircle, ClipboardCheck, ClipboardList, X, History, Clock, Sunrise, Sunset } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface StockManagementViewProps {
  ingredients: Ingredient[];
  setIngredients: Dispatch<SetStateAction<Ingredient[]>>;
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
}

type CountRound = 'open' | 'close';
interface CheckRecord { round: CountRound; by: string; at: string; level: number; }
interface CountHistory { id: string; itemName: string; round: CountRound; level: number; user: string; timestamp: string; branch: string; }

type StockState = 'normal' | 'low' | 'critical';
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

const STATE_CFG: Record<StockState, { bar: string; badge: string; dot: string; label: string; labelTH: string }> = {
  normal:   { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', label: 'Normal',   labelTH: 'ปกติ' },
  low:      { bar: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-800 border-orange-200',    dot: 'bg-orange-500',  label: 'Low',      labelTH: 'ใกล้หมด' },
  critical: { bar: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500',     label: 'Critical', labelTH: 'วิกฤต' },
};

const typeLabelTH: Record<string, string> = {
  'Coffee Beans': 'เมล็ดกาแฟ', 'Dairy': 'นมสด', 'Syrup': 'ไซรัป', 'Packaging': 'บรรจุภัณฑ์',
};

// A few items pre-counted today (before-open round) for demo
const INITIAL_CHECKS: Record<string, CheckRecord> = {
  'STK-001': { round: 'open', by: 'Siri S.', at: '08:15, Today', level: 85 },
  'STK-002': { round: 'open', by: 'Siri S.', at: '08:18, Today', level: 92 },
};

const INITIAL_HISTORY: CountHistory[] = [
  { id: 'CNT-001', itemName: 'Espresso Beans', round: 'open', level: 85, user: 'Siri S.', timestamp: '08:15, Today', branch: 'Central Plaza' },
  { id: 'CNT-002', itemName: 'Premium Milk',   round: 'open', level: 92, user: 'Siri S.', timestamp: '08:18, Today', branch: 'Central Plaza' },
];

export default function StockManagementView({
  ingredients,
  setIngredients,
  selectedBranch,
  setSelectedBranch,
  roleMode,
  staffAssignedBranch,
}: StockManagementViewProps) {
  const [searchTerm, setSearchTerm]       = useState('');
  const [statusFilter, setStatusFilter]   = useState<'all' | 'checked' | 'unchecked' | StockState>('all');
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [checkRound, setCheckRound]       = useState<CountRound>('open');
  const [checks, setChecks]               = useState<Record<string, CheckRecord>>(INITIAL_CHECKS);
  const [history, setHistory]             = useState<CountHistory[]>(INITIAL_HISTORY);
  const [countInput, setCountInput]       = useState<string>('');
  const [showHistory, setShowHistory]     = useState(false);
  const { language } = useLanguage();

  const isStaff = roleMode === 'Staff';
  const activeBranch = isStaff ? (staffAssignedBranch as Branch) : selectedBranch;
  const currentUser  = isStaff ? 'Staff User' : 'Admin User';
  const t = (th: string, en: string) => (language === 'TH' ? th : en);
  const roundLabel = (r: CountRound) => r === 'open' ? t('ก่อนเปิดร้าน', 'Before Open') : t('ก่อนปิดร้าน', 'Before Close');

  const scoped = ingredients.filter(i => activeBranch === 'All Branches' || i.branch === activeBranch);
  const filtered = scoped.filter(ing => {
    if (statusFilter === 'checked' && !checks[ing.id]) return false;
    if (statusFilter === 'unchecked' && checks[ing.id]) return false;
    if ((statusFilter === 'normal' || statusFilter === 'low' || statusFilter === 'critical') && classify(ing.stockLevel) !== statusFilter) return false;
    if (searchTerm && !ing.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !ing.type.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const kpiChecked   = scoped.filter(i => checks[i.id]).length;
  const kpiUnchecked = scoped.length - kpiChecked;
  const kpiLow       = scoped.filter(i => classify(i.stockLevel) === 'low').length;
  const kpiCritical  = scoped.filter(i => classify(i.stockLevel) === 'critical').length;

  const topCritical = ingredients
    .filter(i => classify(i.stockLevel) !== 'normal')
    .sort((a, b) => a.stockLevel - b.stockLevel)
    .slice(0, 5);

  const scopedHistory = history.filter(h => activeBranch === 'All Branches' || h.branch === activeBranch);

  // ── Record a manual stock count (the ONLY way stock changes) ─────────────────
  const submitCount = (id: string, value: number) => {
    const item = ingredients.find(i => i.id === id);
    if (!item) return;
    const level = Math.min(100, Math.max(0, Math.round(value)));
    const at = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today';
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, stockLevel: level, status: getStatusFromLevel(level) } : i));
    setChecks(prev => ({ ...prev, [id]: { round: checkRound, by: currentUser, at, level } }));
    setHistory(prev => [{ id: `CNT-${Date.now()}`, itemName: item.name, round: checkRound, level, user: currentUser, timestamp: at, branch: item.branch }, ...prev].slice(0, 30));
  };

  const selectRow = (id: string) => {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    const item = ingredients.find(i => i.id === id);
    setCountInput(next && item ? String(item.stockLevel) : '');
  };

  const selectedItem = ingredients.find(i => i.id === selectedId) ?? null;

  const tabs: { key: typeof statusFilter; label: string; count: number }[] = [
    { key: 'all',       label: t('ทั้งหมด', 'All'),            count: scoped.length },
    { key: 'checked',   label: t('ตรวจแล้ว', 'Counted'),       count: kpiChecked },
    { key: 'unchecked', label: t('ยังไม่ได้ตรวจ', 'Not counted'), count: kpiUnchecked },
    { key: 'low',       label: t('ใกล้หมด', 'Low'),            count: kpiLow },
    { key: 'critical',  label: t('วิกฤต', 'Critical'),         count: kpiCritical },
  ];

  return (
    <div className="p-6 space-y-5 font-sans">

      {/* ── KPI Bar (clickable shortcut filters) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'checked' as const,   label: t('ตรวจแล้ววันนี้', 'Counted Today'), value: kpiChecked,   base: 'border-emerald-100 bg-emerald-50/40', ring: 'ring-emerald-400', icon: <ClipboardCheck size={16} className="text-emerald-600" /> },
          { key: 'unchecked' as const, label: t('ยังไม่ได้ตรวจ', 'Not Counted'),    value: kpiUnchecked, base: 'border-zinc-200 bg-white',            ring: 'ring-zinc-400',    icon: <Clock size={16} className="text-zinc-400" /> },
          { key: 'low' as const,       label: t('ใกล้หมด', 'Low Stock'),            value: kpiLow,       base: 'border-orange-100 bg-orange-50/40',   ring: 'ring-orange-400',  icon: <AlertTriangle size={16} className="text-orange-500" /> },
          { key: 'critical' as const,  label: t('วิกฤต', 'Critical'),               value: kpiCritical,  base: 'border-red-100 bg-red-50/40',         ring: 'ring-red-400',     icon: <AlertTriangle size={16} className="text-red-500" /> },
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

      {/* ── Toolbar ── */}
      <div className="bg-white p-4 rounded-xl border border-[#E6DFD9] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h3 className="font-sans font-bold text-sm text-[#2E2A25]">{t('ตรวจนับสต็อกประจำวัน', 'Daily Stock Count')}</h3>
            <p className="font-sans text-[11px] text-zinc-500">
              {isStaff ? t('ตรวจนับและบันทึกจำนวนคงเหลือจริงด้วยตนเอง', 'Manually count and record actual stock levels')
                       : t('ติดตามผลการตรวจนับทุกสาขา (ดูอย่างเดียว)', 'Monitor stock-count results across branches (read-only)')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Count round selector (Staff) / indicator (Admin) */}
            {isStaff ? (
              <div className="inline-flex bg-stone-100 rounded-lg p-0.5">
                {(['open', 'close'] as CountRound[]).map(r => (
                  <button
                    key={r}
                    id={`round-${r}`}
                    onClick={() => setCheckRound(r)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${checkRound === r ? 'bg-white text-coffee shadow-xs' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    {r === 'open' ? <Sunrise size={12} /> : <Sunset size={12} />}{roundLabel(r)}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              id="stock-view-history-btn"
              onClick={() => setShowHistory(true)}
              className="px-3.5 py-1.5 border border-[#E6DFD9] bg-stone-50 hover:bg-stone-100 text-zinc-600 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
            >
              <History size={13} className="text-[#8B6B4F]" /> {t('ประวัติการตรวจนับ', 'Count History')}
            </button>
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

        {/* Table */}
        <div className="lg:col-span-2 bg-white border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto min-h-64">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6DFD9] bg-stone-50/50">
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('วัตถุดิบ', 'Ingredient')}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('คงเหลือ', 'Level')}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('หน่วย', 'Unit')}</th>
                  <th className="py-2.5 px-3 font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{t('สถานะการตรวจนับ', 'Count Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-sans text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-14 text-center">
                      {statusFilter === 'unchecked' ? (
                        <div className="flex flex-col items-center gap-2 text-emerald-600">
                          <CheckCircle size={28} />
                          <p className="text-sm font-semibold text-zinc-600">{t('ตรวจนับครบทุกรายการแล้ว', 'Everything has been counted')}</p>
                        </div>
                      ) : (statusFilter === 'low' || statusFilter === 'critical') ? (
                        <div className="flex flex-col items-center gap-2 text-emerald-600">
                          <CheckCircle size={28} />
                          <p className="text-sm font-semibold text-zinc-600">{t('วัตถุดิบทุกอย่างอยู่ในระดับปกติ', 'All ingredients are at normal levels')}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400">{t('ไม่พบวัตถุดิบ', 'No ingredients found.')}</p>
                      )}
                    </td>
                  </tr>
                ) : filtered.map(ing => {
                  const s = classify(ing.stockLevel);
                  const cfg = STATE_CFG[s];
                  const chk = checks[ing.id];
                  const active = selectedId === ing.id;
                  return (
                    <tr
                      key={ing.id}
                      id={`ingredient-row-${ing.id}`}
                      onClick={() => selectRow(ing.id)}
                      className={`cursor-pointer transition-colors ${active ? 'bg-[#FDF1E6]/40' : 'hover:bg-stone-50/60'}`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <div>
                            <div className="font-bold text-zinc-800">{ing.name}</div>
                            <div className="font-mono text-[9px] text-zinc-400 mt-0.5">
                              {language === 'TH' ? (typeLabelTH[ing.type] ?? ing.type) : ing.type}
                              {activeBranch === 'All Branches' && ` · ${ing.branch}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1 w-24">
                          <div className="flex justify-between text-[10px] font-mono font-semibold text-zinc-600">
                            <span>{ing.stockLevel}%</span>
                            <span className={`px-1.5 rounded text-[8.5px] font-bold border ${cfg.badge}`}>{language === 'TH' ? cfg.labelTH : cfg.label}</span>
                          </div>
                          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${ing.stockLevel}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 font-mono text-[11px]">{ing.unit}</td>
                      <td className="py-3 px-3">
                        {chk ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200">
                              <ClipboardCheck size={11} /> {t('ตรวจแล้ว', 'Counted')}
                            </span>
                            <p className="text-[9.5px] text-zinc-400 mt-1">{chk.at} · {chk.by}</p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold border bg-zinc-50 text-zinc-500 border-zinc-200">
                            <Clock size={11} /> {t('ยังไม่ได้ตรวจวันนี้', 'Not counted today')}
                          </span>
                        )}
                      </td>
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
            const chk = checks[selectedItem.id];
            return (
              <div>
                {/* Name + type/branch */}
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
                  {/* Recorded actual level */}
                  <div className="p-3.5 bg-stone-50 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">{t('จำนวนคงเหลือจริง', 'Actual Stock on Record')}</span>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${cfg.badge}`}>{language === 'TH' ? cfg.labelTH : cfg.label}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="font-black text-3xl text-zinc-900 leading-none">{selectedItem.stockLevel}</span>
                      <span className="text-zinc-400 font-mono text-sm mb-0.5">% · {selectedItem.unit}</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${selectedItem.stockLevel}%` }} />
                    </div>
                  </div>

                  {/* Last count info */}
                  <div className="p-3 border rounded-xl bg-stone-50 space-y-1">
                    <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider">{t('การตรวจนับล่าสุด', 'Last Count')}</p>
                    {chk ? (
                      <>
                        <div className="flex items-center justify-between"><span className="text-zinc-500">{t('ตรวจล่าสุดเมื่อ', 'Last counted')}</span><span className="font-semibold text-zinc-700">{chk.at}</span></div>
                        <div className="flex items-center justify-between"><span className="text-zinc-500">{t('ผู้ตรวจล่าสุด', 'Counted by')}</span><span className="font-semibold text-zinc-700">{chk.by}</span></div>
                        <div className="flex items-center justify-between"><span className="text-zinc-500">{t('รอบ', 'Round')}</span><span className="font-semibold text-zinc-700">{roundLabel(chk.round)}</span></div>
                      </>
                    ) : (
                      <p className="text-zinc-400 text-[11px]">{t('ยังไม่ได้ตรวจวันนี้', 'Not counted today')}</p>
                    )}
                  </div>

                  {/* Count entry form (Staff) / read-only (Admin) */}
                  {isStaff ? (
                    <div className="p-3 border border-[#8B6B4F]/20 rounded-xl bg-[#FDF1E6]/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-[#8B6B4F] uppercase tracking-wider font-extrabold">{t('บันทึกผลตรวจนับ', 'Record Count')}</span>
                        <span className="text-[9.5px] font-bold text-[#8B6B4F] flex items-center gap-1">
                          {checkRound === 'open' ? <Sunrise size={11} /> : <Sunset size={11} />}{roundLabel(checkRound)}
                        </span>
                      </div>
                      <label className="block">
                        <span className="text-[10px] text-zinc-500 font-semibold">{t('กรอกจำนวนคงเหลือจริง (%)', 'Enter actual level (%)')}</span>
                        <input
                          id="count-input"
                          type="number"
                          min={0}
                          max={100}
                          value={countInput}
                          onChange={e => setCountInput(e.target.value)}
                          className="mt-1 w-full text-sm py-2 px-3 font-mono font-bold bg-white border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F]"
                          placeholder="0-100"
                        />
                      </label>
                      <button
                        id="submit-count-btn"
                        disabled={countInput === ''}
                        onClick={() => { submitCount(selectedItem.id, Number(countInput)); }}
                        className="w-full py-2.5 bg-[#8B6B4F] hover:bg-[#70533C] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ClipboardCheck size={13} /> {t('บันทึกผลตรวจนับ', 'Save Count')}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-zinc-400 text-[11px]">
                      {t('Admin: ดูผลการตรวจนับอย่างเดียว — การตรวจนับทำโดยพนักงานสาขา', 'Admin: read-only. Counts are recorded by branch staff.')}
                    </div>
                  )}
                </div>
              </div>
            );
          })() : isStaff ? (
            <div className="p-8 text-center text-zinc-400 text-xs space-y-2">
              <ClipboardCheck size={36} className="text-zinc-200 mx-auto" />
              <p className="font-semibold text-zinc-500">{t('ยังไม่ได้เลือกรายการ', 'No Item Selected')}</p>
              <p className="text-[10px] leading-relaxed text-zinc-400">{t('คลิกรายการเพื่อบันทึกผลตรวจนับ', 'Click a row to record its count.')}</p>
            </div>
          ) : (
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
                  <CheckCircle size={28} /><p className="text-sm font-semibold text-zinc-600">{t('วัตถุดิบทุกอย่างอยู่ในระดับปกติ', 'All ingredients are at normal levels')}</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {topCritical.map(item => {
                    const cfg = STATE_CFG[classify(item.stockLevel)];
                    return (
                      <button key={item.id} onClick={() => setSelectedId(item.id)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <div className="min-w-0"><p className="font-bold text-xs text-zinc-800 truncate">{item.name}</p><p className="text-[9.5px] text-zinc-400">{item.branch}</p></div>
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

      {/* ── Count History Drawer ── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#E6DFD9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-[#8B6B4F]" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-800">{t('ประวัติการตรวจนับสต็อก', 'Stock Count History')}</h3>
                  <p className="text-[11px] text-zinc-400">{isStaff ? `${t('สาขา', 'Branch')}: ${staffAssignedBranch}` : t('ทุกสาขา', 'All branches')}</p>
                </div>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 custom-scrollbar">
              {scopedHistory.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-xs">{t('ยังไม่มีการตรวจนับ', 'No counts recorded yet.')}</div>
              ) : scopedHistory.map(entry => (
                <div key={entry.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-1.5 rounded-lg border flex items-center justify-center shrink-0 text-emerald-700 bg-emerald-50 border-emerald-200"><ClipboardCheck size={11} /></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-zinc-800">{entry.itemName}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-[#FDF1E6] text-[#8B6B4F] border-[#E6DFD9]">{roundLabel(entry.round)}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{entry.branch} · {entry.timestamp} · {entry.user}</p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm text-zinc-700 shrink-0">{entry.level}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
