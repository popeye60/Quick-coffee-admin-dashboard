import { useState, useRef, Dispatch, SetStateAction } from 'react';
import { CoffeeItem, Branch, AddonGroup, AddonOption, SpecialMenuMeta, SpecialMenuType } from '../types';
import {
  Plus, X, Check, Pencil, Trash2, Upload, ImageIcon, Sparkles,
  Star, AlertCircle, GripVertical, Save, Send,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface MenuPricingViewProps {
  menuItems: CoffeeItem[];
  setMenuItems: Dispatch<SetStateAction<CoffeeItem[]>>;
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
}

const BRANCHES = ['Central Plaza', 'Siam Square', 'Mega Bangna', 'The Mall Korat'];
const SPECIAL_TYPES: SpecialMenuType[] = ['Seasonal', 'Limited Edition', 'New Arrival', 'Recommended', 'Promotion'];

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

// Default add-on groups offered when creating customizations
const PRESET_GROUPS = (): AddonGroup[] => [
  { id: uid('grp'), name: 'Sweetness Level', type: 'single', required: true, order: 1, options: [
    { id: uid('opt'), name: '0%', price: 0, isDefault: false, enabled: true },
    { id: uid('opt'), name: '50%', price: 0, isDefault: true, enabled: true },
    { id: uid('opt'), name: '100%', price: 0, isDefault: false, enabled: true },
  ] },
  { id: uid('grp'), name: 'Cup Size', type: 'single', required: true, order: 2, options: [
    { id: uid('opt'), name: 'Small', price: 0, isDefault: true, enabled: true },
    { id: uid('opt'), name: 'Medium', price: 10, isDefault: false, enabled: true },
    { id: uid('opt'), name: 'Large', price: 20, isDefault: false, enabled: true },
  ] },
];

const blankItem = (): CoffeeItem => ({
  id: uid('MENU'), name: '', category: 'Coffee', price: 85, status: 'Available', image: '☕',
  description: '', displayOrder: 99, addonGroups: [], branchPrices: {}, branchAvailable: {},
});

export default function MenuPricingView({ menuItems, setMenuItems, roleMode }: MenuPricingViewProps) {
  const { language, formatCurrency } = useLanguage();
  const t = (th: string, en: string) => (language === 'TH' ? th : en);
  const isAdmin = roleMode === 'Admin';

  const [tab, setTab] = useState<'All' | 'Coffee' | 'Non-Coffee' | 'Bakery' | 'Special'>('All');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Out of Stock' | 'Hidden'>('All');
  const [editing, setEditing] = useState<CoffeeItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const isSpecial = (i: CoffeeItem) => !!i.special;

  const matchesTab = (i: CoffeeItem) => {
    if (tab === 'All') return true;
    if (tab === 'Special') return isSpecial(i);
    if (tab === 'Coffee') return i.category === 'Coffee';
    if (tab === 'Non-Coffee') return i.category === 'Beverage';
    if (tab === 'Bakery') return i.category === 'Bakery';
    return true;
  };
  const items = menuItems
    .filter(i => !i.archived)
    .filter(matchesTab)
    .filter(i => statusFilter === 'All' || i.status === statusFilter)
    .filter(i => branchFilter === 'All Branches' || (i.branchAvailable?.[branchFilter] ?? true))
    .sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));

  // ── Persistence helpers ─────────────────────────────────────────────────────
  const upsert = (rec: CoffeeItem) => setMenuItems(prev => {
    const idx = prev.findIndex(m => m.id === rec.id);
    return idx === -1 ? [...prev, rec] : prev.map(m => m.id === rec.id ? rec : m);
  });
  const remove = (i: CoffeeItem) => { if (confirm(t(`ลบเมนู "${i.name}" ?`, `Delete "${i.name}"?`))) setMenuItems(prev => prev.filter(m => m.id !== i.id)); };

  const openCreate = () => { setEditing(blankItem()); setIsNew(true); setErrors([]); };
  const openEdit = (i: CoffeeItem) => { setEditing(JSON.parse(JSON.stringify(i))); setIsNew(false); setErrors([]); };
  const close = () => { setEditing(null); setErrors([]); };

  const setField = <K extends keyof CoffeeItem>(k: K, v: CoffeeItem[K]) => setEditing(p => p ? { ...p, [k]: v } : p);

  const validate = (i: CoffeeItem) => {
    const e: string[] = [];
    if (!i.name.trim()) e.push(t('ชื่อเมนู', 'Menu Name'));
    if (!i.price || i.price <= 0) e.push(t('ราคา', 'Base Price'));
    if (!i.coverImage && !i.image) e.push(t('รูปภาพ', 'Product Image'));
    return e;
  };
  const saveDraft = () => { if (editing) { upsert(editing); close(); } };
  const publish = () => {
    if (!editing) return;
    const e = validate(editing);
    if (e.length) { setErrors(e); return; }
    const rec = editing.special ? { ...editing, special: { ...editing.special, publish: 'Published' as const, active: true } } : editing;
    upsert(rec); close();
  };

  // ── Image upload ────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { alert(t('รองรับเฉพาะ JPG, PNG, WEBP', 'Only JPG, PNG, WEBP supported')); return; }
    if (file.size > 5 * 1024 * 1024) { alert(t('ไฟล์ต้องไม่เกิน 5 MB', 'File must be under 5 MB')); return; }
    const reader = new FileReader();
    reader.onload = () => setField('coverImage', reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Add-on group builder ────────────────────────────────────────────────────
  const addGroup = () => setEditing(p => p ? { ...p, addonGroups: [...(p.addonGroups || []), { id: uid('grp'), name: '', type: 'single', required: false, order: (p.addonGroups?.length || 0) + 1, options: [] }] } : p);
  const usePresets = () => setEditing(p => p ? { ...p, addonGroups: [...(p.addonGroups || []), ...PRESET_GROUPS()] } : p);
  const updGroup = (gid: string, patch: Partial<AddonGroup>) => setEditing(p => p ? { ...p, addonGroups: p.addonGroups?.map(g => g.id === gid ? { ...g, ...patch } : g) } : p);
  const delGroup = (gid: string) => setEditing(p => p ? { ...p, addonGroups: p.addonGroups?.filter(g => g.id !== gid) } : p);
  const addOption = (gid: string) => updGroupOptions(gid, g => [...g.options, { id: uid('opt'), name: '', price: 0, isDefault: false, enabled: true }]);
  const updGroupOptions = (gid: string, fn: (g: AddonGroup) => AddonOption[]) => setEditing(p => p ? { ...p, addonGroups: p.addonGroups?.map(g => g.id === gid ? { ...g, options: fn(g) } : g) } : p);
  const updOption = (gid: string, oid: string, patch: Partial<AddonOption>) => updGroupOptions(gid, g => g.options.map(o => o.id === oid ? { ...o, ...patch } : o));
  const delOption = (gid: string, oid: string) => updGroupOptions(gid, g => g.options.filter(o => o.id !== oid));

  // ── Special menu toggle ─────────────────────────────────────────────────────
  const toggleSpecial = () => setEditing(p => {
    if (!p) return p;
    if (p.special) return { ...p, special: undefined };
    return { ...p, special: { type: 'Recommended', priority: 1, active: true, publish: 'Draft' } as SpecialMenuMeta };
  });
  const updSpecial = (patch: Partial<SpecialMenuMeta>) => setEditing(p => p && p.special ? { ...p, special: { ...p.special, ...patch } } : p);

  const statusStyle = (s: CoffeeItem['status']) =>
    s === 'Available' ? 'bg-emerald-50 text-emerald-700' : s === 'Out of Stock' ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-500';
  const statusLabel = (s: CoffeeItem['status']) =>
    s === 'Available' ? t('พร้อมขาย', 'Available') : s === 'Out of Stock' ? t('ของหมด', 'Out of Stock') : t('ซ่อน', 'Hidden');
  const catLabel = (c: string) => c === 'Coffee' ? t('กาแฟ', 'Coffee') : c === 'Beverage' ? t('เครื่องดื่ม', 'Non-Coffee') : t('เบเกอรี่', 'Bakery');

  const tabs = [
    { k: 'All' as const, label: t('ทั้งหมด', 'All Menus') },
    { k: 'Coffee' as const, label: t('กาแฟ', 'Coffee') },
    { k: 'Non-Coffee' as const, label: t('ไม่ใช่กาแฟ', 'Non-Coffee') },
    { k: 'Bakery' as const, label: t('เบเกอรี่', 'Bakery') },
    { k: 'Special' as const, label: t('เมนูพิเศษ', 'Special Menu') },
  ];

  const inputCls = 'w-full text-xs py-2 px-3 font-sans bg-white border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F]';

  return (
    <div className="p-6 space-y-5 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-[#2E2A25]">{t('จัดการเมนูและราคา', 'Menu & Pricing Management')}</h2>
          <p className="text-xs text-zinc-500">{t('จัดการเมนู รูปภาพ ตัวเลือกเสริม ราคาแต่ละสาขา และเมนูพิเศษ', 'Manage items, images, add-ons, branch pricing & special menus')}</p>
        </div>
        {isAdmin && (
          <button id="add-menu-btn" onClick={openCreate} className="px-4 py-2 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 self-start sm:self-auto">
            <Plus size={14} /> {t('เพิ่มเมนู', 'Add Menu')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-stone-100 p-1.5 rounded-xl border border-[#E6DFD9]">
        {tabs.map(tb => (
          <button key={tb.k} id={`menu-tab-${tb.k.toLowerCase()}`} onClick={() => setTab(tb.k)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${tab === tb.k ? 'bg-[#8B6B4F] text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}>
            {tb.k === 'Special' && <Sparkles size={12} />}{tb.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="text-[11px] font-semibold py-1.5 px-2.5 bg-white border border-[#E6DFD9] rounded-lg text-zinc-600 cursor-pointer">
          <option value="All Branches">{t('ทุกสาขา', 'All Branches')}</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="text-[11px] font-semibold py-1.5 px-2.5 bg-white border border-[#E6DFD9] rounded-lg text-zinc-600 cursor-pointer">
          <option value="All">{t('ทุกสถานะ', 'All Status')}</option>
          <option value="Available">{t('พร้อมขาย', 'Available')}</option>
          <option value="Out of Stock">{t('ของหมด', 'Out of Stock')}</option>
          <option value="Hidden">{t('ซ่อน', 'Hidden')}</option>
        </select>
        <span className="text-[10px] font-mono text-zinc-400 ml-auto uppercase tracking-wider">{items.length} {t('เมนู', 'items')}</span>
      </div>

      {/* Menu cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border border-dashed border-[#E6DFD9] rounded-2xl text-zinc-400 text-sm">{t('ไม่พบเมนู', 'No menu items found.')}</div>
        ) : items.map(item => (
          <div key={item.id} id={`menu-card-${item.id}`} className={`bg-white border rounded-2xl shadow-xs overflow-hidden flex flex-col ${item.status === 'Hidden' ? 'opacity-60' : ''} border-[#E6DFD9]`}>
            {/* Cover */}
            <div className="h-28 bg-[#FDF1E6] flex items-center justify-center text-5xl relative overflow-hidden">
              {item.coverImage ? <img src={item.coverImage} alt={item.name} className="w-full h-full object-cover" /> : <span>{item.image}</span>}
              {item.special && <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1"><Sparkles size={9} />{t('เมนูพิเศษ', 'Limited Time')}</span>}
              <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${statusStyle(item.status)}`}>{statusLabel(item.status)}</span>
            </div>
            <div className="p-3.5 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-zinc-900 truncate">{item.name}</h3>
                  <p className="text-[10px] text-zinc-400">{catLabel(item.category)}</p>
                </div>
                <span className="font-mono font-black text-sm text-[#8B6B4F] shrink-0">{formatCurrency(item.price)}</span>
              </div>
              {item.description && <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{item.description}</p>}
              <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
                {item.addonGroups && item.addonGroups.length > 0 && <span className="bg-stone-100 px-1.5 py-0.5 rounded">{item.addonGroups.length} {t('กลุ่มเสริม', 'add-on groups')}</span>}
                {item.branchPrices && Object.keys(item.branchPrices).length > 0 && <span className="bg-stone-100 px-1.5 py-0.5 rounded">{t('ราคาแยกสาขา', 'branch pricing')}</span>}
              </div>

              {/* Actions — Edit (primary) + Delete (secondary) only */}
              {isAdmin && (
                <div className="mt-3 pt-3 border-t border-[#E6DFD9] flex items-center gap-1.5">
                  <button id={`edit-menu-${item.id}`} onClick={() => openEdit(item)} className="flex-1 py-2 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5"><Pencil size={13} /> {t('แก้ไขเมนู', 'Edit Menu')}</button>
                  <button title={t('ลบ', 'Delete')} onClick={() => remove(item)} className="p-2 border border-red-200 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Edit / Create Drawer ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={close}>
          <div className="w-full max-w-lg h-full bg-stone-50 shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-white border-b border-[#E6DFD9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Pencil size={16} className="text-[#8B6B4F]" />
                <div><h3 className="font-bold text-sm text-zinc-800">{isNew ? t('เพิ่มเมนูใหม่', 'Add Menu') : t('แก้ไขเมนู', 'Edit Menu')}</h3>
                  <p className="text-[11px] text-zinc-400">{editing.name || t('เมนูใหม่', 'New item')}</p></div>
              </div>
              <button onClick={close} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">

              {/* Product image */}
              <section className="space-y-2">
                <h4 className="font-bold text-xs text-[#2E2A25] flex items-center gap-1.5"><ImageIcon size={13} className="text-[#8B6B4F]" />{t('รูปภาพสินค้า', 'Product Image')}</h4>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                  className={`relative border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center text-center transition-all ${dragOver ? 'border-[#8B6B4F] bg-[#FDF1E6]/50' : 'border-[#E6DFD9] bg-white'}`}
                >
                  {editing.coverImage ? (
                    <>
                      <img src={editing.coverImage} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-all flex items-center justify-center gap-2 rounded-xl">
                        <button onClick={() => fileRef.current?.click()} className="px-2.5 py-1 bg-white text-zinc-800 text-[10px] font-bold rounded-lg">{t('เปลี่ยนรูป', 'Replace')}</button>
                        <button onClick={() => setField('coverImage', undefined)} className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg">{t('ลบรูป', 'Remove')}</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl mb-1">{editing.image || '🖼️'}</div>
                      <Upload size={18} className="text-[#8B6B4F]" />
                      <p className="text-[11px] font-semibold text-zinc-600 mt-1">{t('ลากรูปมาวาง หรือ', 'Drag & drop or')} <button onClick={() => fileRef.current?.click()} className="text-[#8B6B4F] underline">{t('เลือกไฟล์', 'browse')}</button></p>
                      <p className="text-[9px] text-zinc-400 mt-0.5">JPG / PNG / WEBP · 1:1 · ≤ 5MB</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </div>
                <label className="block"><span className="text-[10px] text-zinc-500">{t('หรือใช้อิโมจิแทน', 'Or emoji fallback')}</span>
                  <input className={inputCls} value={editing.image} onChange={e => setField('image', e.target.value)} placeholder="☕" /></label>
              </section>

              {/* Basic detail */}
              <section className="space-y-2">
                <h4 className="font-bold text-xs text-[#2E2A25]">{t('รายละเอียดเมนู', 'Menu Detail')}</h4>
                <label className="block"><span className="text-[10px] text-zinc-500">{t('ชื่อเมนู', 'Menu Name')} *</span>
                  <input className={inputCls} value={editing.name} onChange={e => setField('name', e.target.value)} /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('หมวดหมู่', 'Category')}</span>
                    <select className={inputCls} value={editing.category} onChange={e => setField('category', e.target.value as CoffeeItem['category'])}>
                      <option value="Coffee">{t('กาแฟ', 'Coffee')}</option>
                      <option value="Beverage">{t('ไม่ใช่กาแฟ', 'Non-Coffee')}</option>
                      <option value="Bakery">{t('เบเกอรี่', 'Bakery')}</option>
                    </select></label>
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('ราคาฐาน (฿)', 'Base Price (฿)')} *</span>
                    <input type="number" className={inputCls} value={editing.price} onChange={e => setField('price', Number(e.target.value))} /></label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('สถานะ', 'Status')}</span>
                    <select className={inputCls} value={editing.status} onChange={e => setField('status', e.target.value as CoffeeItem['status'])}>
                      <option value="Available">{t('พร้อมขาย', 'Available')}</option>
                      <option value="Out of Stock">{t('ของหมด', 'Out of Stock')}</option>
                      <option value="Hidden">{t('ซ่อน', 'Hidden')}</option>
                    </select></label>
                  <label className="block"><span className="text-[10px] text-zinc-500">{t('ลำดับการแสดง', 'Display Order')}</span>
                    <input type="number" className={inputCls} value={editing.displayOrder ?? 99} onChange={e => setField('displayOrder', Number(e.target.value))} /></label>
                </div>
                <label className="block"><span className="text-[10px] text-zinc-500">{t('คำอธิบาย', 'Description')}</span>
                  <textarea className={`${inputCls} resize-none`} rows={2} value={editing.description || ''} onChange={e => setField('description', e.target.value)} /></label>
              </section>

              {/* Customization / add-ons */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#2E2A25]">{t('ตัวเลือกเสริม / ปรับแต่ง', 'Customization / Add-ons')}</h4>
                  <div className="flex gap-1.5">
                    <button onClick={usePresets} className="text-[10px] font-bold text-[#8B6B4F] hover:underline">{t('+ ชุดเริ่มต้น', '+ Presets')}</button>
                    <button onClick={addGroup} className="text-[10px] font-bold text-[#8B6B4F] hover:underline">{t('+ เพิ่มกลุ่ม', '+ Add Group')}</button>
                  </div>
                </div>
                {(editing.addonGroups || []).length === 0 && <p className="text-[10px] text-zinc-400">{t('ยังไม่มีตัวเลือกเสริม', 'No add-on groups yet.')}</p>}
                {(editing.addonGroups || []).map(g => (
                  <div key={g.id} className="border border-[#E6DFD9] rounded-xl bg-white p-2.5 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <GripVertical size={13} className="text-zinc-300 shrink-0" />
                      <input className="flex-1 text-xs font-bold py-1 px-2 border border-[#E6DFD9] rounded" value={g.name} placeholder={t('ชื่อกลุ่ม เช่น ระดับความหวาน', 'Group name')} onChange={e => updGroup(g.id, { name: e.target.value })} />
                      <button onClick={() => delGroup(g.id)} className="text-zinc-400 hover:text-red-500"><X size={14} /></button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <select className="py-1 px-1.5 border border-[#E6DFD9] rounded bg-white" value={g.type} onChange={e => updGroup(g.id, { type: e.target.value as AddonGroup['type'] })}>
                        <option value="single">{t('เลือกได้ 1', 'Single Choice')}</option>
                        <option value="multiple">{t('เลือกได้หลาย', 'Multiple Choice')}</option>
                      </select>
                      <label className="flex items-center gap-1 font-semibold text-zinc-600"><input type="checkbox" checked={g.required} onChange={e => updGroup(g.id, { required: e.target.checked })} />{t('บังคับเลือก', 'Required')}</label>
                      <span className="text-zinc-400">{t('ลำดับ', 'Order')}: {g.order}</span>
                    </div>
                    {/* options */}
                    <div className="space-y-1.5 pl-1">
                      {g.options.map(o => (
                        <div key={o.id} className="flex items-center gap-1.5">
                          <input className="flex-1 text-[11px] py-1 px-2 border border-[#E6DFD9] rounded" value={o.name} placeholder={t('ชื่อตัวเลือก', 'Option')} onChange={e => updOption(g.id, o.id, { name: e.target.value })} />
                          <div className="flex items-center gap-0.5"><span className="text-[10px] text-zinc-400">+฿</span>
                            <input type="number" className="w-14 text-[11px] py-1 px-1.5 border border-[#E6DFD9] rounded font-mono" value={o.price} onChange={e => updOption(g.id, o.id, { price: Number(e.target.value) })} /></div>
                          <button title={t('ค่าเริ่มต้น', 'Default')} onClick={() => updOption(g.id, o.id, { isDefault: !o.isDefault })} className={`p-1 rounded ${o.isDefault ? 'text-amber-500' : 'text-zinc-300'}`}><Star size={13} fill={o.isDefault ? 'currentColor' : 'none'} /></button>
                          <button title={o.enabled ? t('ปิด', 'Disable') : t('เปิด', 'Enable')} onClick={() => updOption(g.id, o.id, { enabled: !o.enabled })} className={`p-1 rounded ${o.enabled ? 'text-emerald-600' : 'text-zinc-300'}`}><Check size={13} /></button>
                          <button onClick={() => delOption(g.id, o.id)} className="text-zinc-400 hover:text-red-500"><X size={13} /></button>
                        </div>
                      ))}
                      <button onClick={() => addOption(g.id)} className="text-[10px] font-bold text-[#8B6B4F] hover:underline">{t('+ เพิ่มตัวเลือก', '+ Add Option')}</button>
                    </div>
                  </div>
                ))}
              </section>

              {/* Branch-specific settings */}
              <section className="space-y-2">
                <h4 className="font-bold text-xs text-[#2E2A25]">{t('ตั้งค่าราคา/สถานะแยกสาขา', 'Branch-specific Settings')}</h4>
                <div className="border border-[#E6DFD9] rounded-xl bg-white divide-y divide-zinc-100">
                  {BRANCHES.map(b => {
                    const avail = editing.branchAvailable?.[b] ?? true;
                    const price = editing.branchPrices?.[b];
                    return (
                      <div key={b} className="flex items-center gap-2 px-3 py-2">
                        <button onClick={() => setField('branchAvailable', { ...editing.branchAvailable, [b]: !avail })} className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${avail ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'}`}>{avail ? t('ขาย', 'On') : t('ปิด', 'Off')}</button>
                        <span className="flex-1 text-[11px] font-semibold text-zinc-700 truncate">{b}</span>
                        <div className="flex items-center gap-0.5"><span className="text-[10px] text-zinc-400">฿</span>
                          <input type="number" className="w-16 text-[11px] py-1 px-1.5 border border-[#E6DFD9] rounded font-mono" value={price ?? ''} placeholder={String(editing.price)} onChange={e => setField('branchPrices', { ...editing.branchPrices, [b]: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) })} /></div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Special menu */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#2E2A25] flex items-center gap-1.5"><Sparkles size={13} className="text-rose-500" />{t('เมนูพิเศษ', 'Special Menu')}</h4>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600"><input type="checkbox" checked={!!editing.special} onChange={toggleSpecial} />{t('ตั้งเป็นเมนูพิเศษ', 'Mark as Special')}</label>
                </div>
                {editing.special && (
                  <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-2.5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className="text-[10px] text-zinc-500">{t('ประเภท', 'Type')}</span>
                        <select className={inputCls} value={editing.special.type} onChange={e => updSpecial({ type: e.target.value as SpecialMenuType })}>
                          {SPECIAL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select></label>
                      <label className="block"><span className="text-[10px] text-zinc-500">{t('ลำดับความสำคัญ', 'Display Priority')}</span>
                        <input type="number" className={inputCls} value={editing.special.priority} onChange={e => updSpecial({ priority: Number(e.target.value) })} /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block"><span className="text-[10px] text-zinc-500">{t('วันเริ่ม', 'Start Date')}</span>
                        <input type="date" className={inputCls} value={editing.special.startDate || ''} onChange={e => updSpecial({ startDate: e.target.value })} /></label>
                      <label className="block"><span className="text-[10px] text-zinc-500">{t('วันสิ้นสุด', 'End Date')}</span>
                        <input type="date" className={inputCls} value={editing.special.endDate || ''} onChange={e => updSpecial({ endDate: e.target.value })} /></label>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-semibold text-zinc-600">
                      <label className="flex items-center gap-1"><input type="checkbox" checked={editing.special.active} onChange={e => updSpecial({ active: e.target.checked })} />{t('ใช้งาน', 'Active')}</label>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={!!editing.special.featured} onChange={e => updSpecial({ featured: e.target.checked })} />{t('โชว์หน้าแรก', 'Feature on Home')}</label>
                      <span className={`ml-auto px-2 py-0.5 rounded-full font-bold ${editing.special.publish === 'Published' ? 'bg-emerald-100 text-emerald-800' : editing.special.publish === 'Expired' ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-100 text-zinc-500'}`}>{editing.special.publish}</span>
                    </div>
                  </div>
                )}
              </section>

              {errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div><p className="font-bold">{t('กรอกข้อมูลไม่ครบ ไม่สามารถเผยแพร่ได้', 'Cannot publish — missing:')}</p><p>{errors.join(', ')}</p></div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-[#E6DFD9] shrink-0 flex items-center gap-2">
              <button onClick={saveDraft} className="flex-1 py-2.5 border border-[#E6DFD9] hover:bg-stone-50 text-zinc-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"><Save size={13} /> {t('บันทึกแบบร่าง', 'Save Draft')}</button>
              <button onClick={publish} className="flex-1 py-2.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"><Send size={13} /> {t('เผยแพร่ไปยังแอป', 'Publish to App')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
