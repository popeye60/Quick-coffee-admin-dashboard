import { Dispatch, SetStateAction, useState } from 'react';
import { Activity, Branch, BranchStatus, Order } from '../types';
import {
  Store, Plus, Pencil, Eye, MapPin, Phone, Clock, X, Check, Send, Save, AlertCircle,
  Wifi, Car, Coffee, ShoppingBag, Dog, Armchair, Smartphone, Image as ImageIcon,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface BranchManagementViewProps {
  orders: Order[];
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
  branchStatuses: Record<Exclude<Branch, 'All Branches'>, BranchStatus>;
  setBranchStatuses: Dispatch<SetStateAction<Record<Exclude<Branch, 'All Branches'>, BranchStatus>>>;
  setActivities: Dispatch<SetStateAction<Activity[]>>;
}

type PublishState = 'Draft' | 'Published' | 'Unpublished';

interface BranchRecord {
  id: string;
  name: string;
  status: BranchStatus;
  address: string;
  phone: string;
  hours: string;
  manager: string;
  lat: string;
  lng: string;
  cover: string;          // emoji / label / url
  gallery: string[];
  services: { mobileOrder: boolean; inStore: boolean };
  facilities: { wifi: boolean; seats: boolean; coffeeMachine: boolean; parking: boolean; petFriendly: boolean; pickup: boolean };
  publish: PublishState;
}

const SEED: BranchRecord[] = [
  { id: 'BR-001', name: 'Central Plaza', status: 'Open', address: '999 Rama I Rd, Pathum Wan, Bangkok 10330', phone: '02-111-2233', hours: '07:00 - 21:00', manager: 'central.manager', lat: '13.7466', lng: '100.5347', cover: '🏬', gallery: ['☕', '🪑', '🥐'], services: { mobileOrder: true, inStore: true }, facilities: { wifi: true, seats: true, coffeeMachine: true, parking: true, petFriendly: false, pickup: true }, publish: 'Published' },
  { id: 'BR-002', name: 'Siam Square', status: 'Open', address: '254 Phaya Thai Rd, Pathum Wan, Bangkok 10330', phone: '02-444-5566', hours: '08:00 - 22:00', manager: 'siam.manager', lat: '13.7456', lng: '100.5331', cover: '🏙️', gallery: ['☕', '🛋️'], services: { mobileOrder: true, inStore: true }, facilities: { wifi: true, seats: true, coffeeMachine: true, parking: false, petFriendly: true, pickup: true }, publish: 'Published' },
  { id: 'BR-003', name: 'Mega Bangna', status: 'Temporarily Closed', address: '39 Bangna-Trad Rd, Bang Phli, Samut Prakan 10540', phone: '02-777-8899', hours: '10:00 - 22:00', manager: 'mega.manager', lat: '13.6500', lng: '100.6840', cover: '🏢', gallery: ['☕'], services: { mobileOrder: false, inStore: true }, facilities: { wifi: true, seats: true, coffeeMachine: true, parking: true, petFriendly: false, pickup: false }, publish: 'Unpublished' },
  { id: 'BR-004', name: 'The Mall Korat', status: 'Open', address: '1242/2 Mittraphap Rd, Mueang, Nakhon Ratchasima 30000', phone: '044-234-5678', hours: '09:00 - 21:00', manager: 'korat.manager', lat: '14.9799', lng: '102.0978', cover: '🏬', gallery: [], services: { mobileOrder: true, inStore: true }, facilities: { wifi: true, seats: false, coffeeMachine: true, parking: true, petFriendly: false, pickup: true }, publish: 'Draft' },
];

const cloneSeedBranches = (branchStatuses: Record<Exclude<Branch, 'All Branches'>, BranchStatus>) => SEED.map(branch => ({
  ...branch,
  status: branchStatuses[branch.name as Exclude<Branch, 'All Branches'>] ?? branch.status,
  gallery: [...branch.gallery],
  services: { ...branch.services },
  facilities: { ...branch.facilities },
}));

const blankBranch = (): BranchRecord => ({
  id: `BR-${Date.now().toString().slice(-4)}`, name: '', status: 'Open', address: '', phone: '', hours: '', manager: '', lat: '', lng: '',
  cover: '', gallery: [], services: { mobileOrder: true, inStore: true },
  facilities: { wifi: false, seats: false, coffeeMachine: false, parking: false, petFriendly: false, pickup: false }, publish: 'Draft',
});

const FACILITY_META = [
  { key: 'wifi' as const, icon: <Wifi size={14} />, th: 'Wi-Fi', en: 'Wi-Fi' },
  { key: 'seats' as const, icon: <Armchair size={14} />, th: 'ที่นั่ง', en: 'Seats' },
  { key: 'coffeeMachine' as const, icon: <Coffee size={14} />, th: 'เครื่องชงกาแฟ', en: 'Coffee Machine' },
  { key: 'parking' as const, icon: <Car size={14} />, th: 'ที่จอดรถ', en: 'Parking' },
  { key: 'petFriendly' as const, icon: <Dog size={14} />, th: 'สัตว์เลี้ยง', en: 'Pet Friendly' },
  { key: 'pickup' as const, icon: <ShoppingBag size={14} />, th: 'รับที่ร้าน', en: 'Pickup at Store' },
];

export default function BranchManagementView({ orders, roleMode, staffAssignedBranch, branchStatuses, setBranchStatuses, setActivities }: BranchManagementViewProps) {
  const { language, formatCurrency } = useLanguage();
  const t = (th: string, en: string) => (language === 'TH' ? th : en);
  const isStaff = roleMode === 'Staff';

  const [branches, setBranches] = useState<BranchRecord[]>(() => cloneSeedBranches(branchStatuses));
  const [editing, setEditing] = useState<BranchRecord | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [preview, setPreview] = useState<BranchRecord | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const visible = isStaff ? branches.filter(b => b.name === staffAssignedBranch) : branches;

  const statusStyle = (s: BranchStatus) =>
    s === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : s === 'Temporarily Closed' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-zinc-100 text-zinc-700 border-zinc-200';
  const statusSurface = (s: BranchStatus) =>
    s === 'Open' ? 'bg-emerald-50/70 border-emerald-100'
    : s === 'Temporarily Closed' ? 'bg-amber-50/80 border-amber-100'
    : 'bg-zinc-50 border-zinc-200';
  const statusLabel = (s: BranchStatus) =>
    s === 'Open' ? t('เปิดให้บริการ', 'Open') : s === 'Temporarily Closed' ? t('ปิดชั่วคราว', 'Temporarily Closed') : t('ปิดร้าน', 'Closed');
  const statusControlLabel = (s: BranchStatus) =>
    s === 'Open' ? 'Open' : s === 'Temporarily Closed' ? 'Temporary Closed' : 'Closed';
  const statusSelectStyle = (s: BranchStatus) =>
    s === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : s === 'Temporarily Closed' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-zinc-100 text-zinc-700 border-zinc-200';
  const statusOptions: BranchStatus[] = ['Open', 'Temporarily Closed', 'Closed'];

  const todayStats = (name: string) => {
    const scoped = orders.filter(o => o.branch === name);
    const sales = scoped
      .filter(o => o.paymentStatus === 'Paid' && !['Cancelled', 'Auto Cancelled', 'Cancelled by Staff', 'Pending Payment'].includes(o.status))
      .reduce((s, o) => s + o.amount, 0);
    return { count: scoped.length, sales };
  };

  const validate = (b: BranchRecord) => {
    const e: string[] = [];
    if (!b.name.trim()) e.push(t('ชื่อสาขา', 'Branch Name'));
    if (!b.address.trim()) e.push(t('ที่อยู่', 'Address'));
    if (!b.phone.trim()) e.push(t('เบอร์โทร', 'Phone Number'));
    if (!b.hours.trim()) e.push(t('เวลาเปิด-ปิด', 'Opening Hours'));
    if (!b.manager.trim()) e.push(t('ผู้จัดการสาขา', 'Assigned Branch Manager'));
    if (!b.lat.trim() || !b.lng.trim()) e.push(t('พิกัด (Lat/Lng)', 'Latitude / Longitude'));
    if (!b.cover.trim()) e.push(t('รูปหน้าปก', 'Cover Image'));
    return e;
  };

  const openCreate = () => { setEditing(blankBranch()); setIsNew(true); setErrors([]); };
  const openEdit = (b: BranchRecord) => { setEditing({ ...b, gallery: [...b.gallery], services: { ...b.services }, facilities: { ...b.facilities } }); setIsNew(false); setErrors([]); };
  const closeDrawer = () => { setEditing(null); setErrors([]); };

  const upsert = (rec: BranchRecord) => {
    setBranches(prev => {
      const idx = prev.findIndex(b => b.id === rec.id);
      if (idx === -1) return [...prev, rec];
      return prev.map(b => b.id === rec.id ? rec : b);
    });
    if (rec.name in branchStatuses) {
      setBranchStatuses(prev => ({
        ...prev,
        [rec.name as Exclude<Branch, 'All Branches'>]: rec.status,
      }));
    }
  };

  const withAvailabilityForStatus = (branch: BranchRecord, status: BranchStatus): BranchRecord => ({
    ...branch,
    status,
    services: {
      ...branch.services,
      mobileOrder: status === 'Open',
    },
    facilities: {
      ...branch.facilities,
      pickup: status === 'Open',
    },
  });

  const handleStatusChange = (branch: BranchRecord, status: BranchStatus) => {
    if (branch.status === status) return;
    const updated = withAvailabilityForStatus(branch, status);
    setBranches(prev => prev.map(b => b.id === branch.id ? updated : b));
    setBranchStatuses(prev => ({
      ...prev,
      [branch.name as Exclude<Branch, 'All Branches'>]: status,
    }));
    setPreview(prev => prev?.id === branch.id ? updated : prev);
    setEditing(prev => prev?.id === branch.id ? updated : prev);
    setActivities(prev => [{
      id: `ACT-BR-${Date.now()}`,
      text: `Admin changed ${branch.name} status to ${status}.`,
      time: 'Just now',
      type: 'branch',
      status: 'Alert',
    }, ...prev]);
  };

  const handleSaveDraft = () => {
    if (!editing) return;
    upsert({ ...editing, publish: editing.publish === 'Published' ? 'Published' : 'Draft' });
    closeDrawer();
  };
  const handlePublish = () => {
    if (!editing) return;
    const e = validate(editing);
    if (e.length) { setErrors(e); return; }
    upsert({ ...editing, publish: 'Published' });
    closeDrawer();
  };
  const handleUnpublish = (b: BranchRecord) => upsert({ ...b, publish: 'Unpublished' });

  // Controlled field helpers
  const setField = <K extends keyof BranchRecord>(k: K, v: BranchRecord[K]) => setEditing(prev => prev ? { ...prev, [k]: v } : prev);
  const setEditingStatus = (status: BranchStatus) => setEditing(prev => prev ? withAvailabilityForStatus(prev, status) : prev);
  const toggleSvc = (k: keyof BranchRecord['services']) => setEditing(prev => prev ? { ...prev, services: { ...prev.services, [k]: !prev.services[k] } } : prev);
  const toggleFac = (k: keyof BranchRecord['facilities']) => setEditing(prev => prev ? { ...prev, facilities: { ...prev.facilities, [k]: !prev.facilities[k] } } : prev);
  const canAcceptOrders = (b: BranchRecord) => b.status === 'Open' && b.publish === 'Published' && b.services.mobileOrder && b.facilities.pickup;

  const inputCls = 'w-full text-xs py-2 px-3 font-sans bg-white border border-[#dddddd] rounded-lg focus:outline-none focus:border-[#181d26]';
  const sectionTitle = (n: number, title: string) => (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 rounded-full bg-[#181d26] text-white text-[10px] font-bold flex items-center justify-center">{n}</span>
      <h4 className="font-sans font-bold text-xs text-[#181d26]">{title}</h4>
    </div>
  );

  return (
    <div className="p-6 space-y-5 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-sans font-bold text-lg text-[#181d26]">{t('จัดการสาขา', 'Branch Management')}</h2>
          <p className="text-xs text-zinc-500">
            {isStaff ? t('ดูข้อมูลสาขาของคุณ (อ่านอย่างเดียว)', 'View your branch information (read-only)')
                     : t('จัดการข้อมูลสาขาที่จะแสดงบนแอปเลือกสาขา', 'Manage branch info shown on the mobile store picker')}
          </p>
        </div>
        {!isStaff && (
          <button
            id="create-branch-btn"
            onClick={openCreate}
            className="px-4 py-2 bg-[#181d26] hover:bg-[#0d1218] text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={14} /> {t('เพิ่มสาขาใหม่', 'Add New Branch')}
          </button>
        )}
      </div>

      {/* Branch cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visible.map(b => {
          const st = todayStats(b.name);
          return (
            <div key={b.id} className={`h-full min-h-[218px] border rounded-xl shadow-xs overflow-hidden flex flex-col ${statusSurface(b.status)}`}>
              {/* 1. Branch info */}
              <div className="p-3 bg-white/75 border-b border-white/70">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-white border border-[#dddddd] flex items-center justify-center text-2xl shrink-0 shadow-xs">{b.cover || '🏬'}</div>
                    <div className="min-w-0">
                      <h3 className="font-black text-base text-zinc-950 leading-tight truncate">{b.name || t('(ยังไม่ตั้งชื่อ)', '(Untitled)')}</h3>
                      <p className="text-[10.5px] text-zinc-500 mt-1 flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0" />{b.address}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10.5px] text-zinc-500">
                        <span className="flex items-center gap-1 min-w-0"><Clock size={11} className="shrink-0" /><span className="truncate">{b.hours}</span></span>
                        <span className="text-zinc-300">|</span>
                        <span className="flex items-center gap-1 min-w-0"><Phone size={11} className="shrink-0" /><span className="truncate">{b.phone}</span></span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 truncate">{t('ผู้จัดการสาขา', 'Branch Manager')}: <span className="font-bold text-zinc-600">{b.manager}</span></p>
                    </div>
                  </div>
                  {!isStaff ? (
                    <select
                      id={`branch-status-${b.id}`}
                      value={b.status}
                      onChange={e => handleStatusChange(b, e.target.value as BranchStatus)}
                      className={`w-32 shrink-0 py-1.5 pl-2 pr-1 border rounded-lg text-[10.5px] font-black focus:outline-none focus:ring-2 focus:ring-[#181d26]/20 cursor-pointer ${statusSelectStyle(b.status)}`}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{statusControlLabel(status)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full border shrink-0 ${statusStyle(b.status)}`}>{statusLabel(b.status)}</span>
                  )}
                </div>
              </div>

              {/* 2. Today stats */}
              <div className="px-3 py-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 bg-white/80 border border-white rounded-lg">
                    <p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{t('ออเดอร์วันนี้', 'Orders Today')}</p>
                    <p className="font-black text-sm text-zinc-800">{st.count}</p>
                  </div>
                  <div className="px-3 py-2 bg-white/80 border border-white rounded-lg">
                    <p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{t('ยอดขายวันนี้', 'Sales Today')}</p>
                    <p className="font-black text-sm text-[#181d26] font-mono">{formatCurrency(st.sales)}</p>
                  </div>
                </div>
              </div>

              {/* 3. Actions */}
              <div className="p-3 pt-1 mt-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreview(b)}
                    className="flex-1 min-h-9 border border-[#dddddd] bg-white hover:bg-stone-50 text-zinc-600 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye size={13} /> {t('ดูตัวอย่างบนแอพ', 'Preview on App')}
                  </button>
                  {!isStaff && (
                    <button
                      id={`edit-branch-${b.id}`}
                      onClick={() => openEdit(b)}
                      className="flex-1 min-h-9 bg-[#181d26] hover:bg-[#0d1218] text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Pencil size={13} /> {t('แก้ไข', 'Edit')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Edit / Create Drawer ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={closeDrawer}>
          <div className="w-full max-w-lg h-full bg-stone-50 shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div className="p-4 bg-white border-b border-[#dddddd] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-[#181d26]" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-800">{isNew ? t('เพิ่มสาขาใหม่', 'Add New Branch') : t('แก้ไขข้อมูลสาขา', 'Edit Branch')}</h3>
                  <p className="text-[11px] text-zinc-400">{editing.name || t('สาขาใหม่', 'New branch')}</p>
                </div>
              </div>
              <button onClick={closeDrawer} className="text-zinc-400 hover:text-zinc-700 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">

              {/* 1. Basic info */}
              <section className="space-y-2.5">
                {sectionTitle(1, t('ข้อมูลพื้นฐาน', 'Basic Information'))}
                <label className="block"><span className="text-[10px] font-bold text-zinc-500">{t('ชื่อสาขา', 'Branch Name')} *</span>
                  <input className={inputCls} value={editing.name} onChange={e => setField('name', e.target.value)} placeholder="Central Plaza" /></label>
                <label className="block"><span className="text-[10px] font-bold text-zinc-500">{t('สถานะสาขา', 'Branch Status')}</span>
                  <select className={inputCls} value={editing.status} onChange={e => setEditingStatus(e.target.value as BranchStatus)}>
                    <option value="Open">{t('เปิดให้บริการ', 'Open')}</option>
                    <option value="Temporarily Closed">{t('ปิดชั่วคราว', 'Temporarily Closed')}</option>
                    <option value="Closed">{t('ปิด', 'Closed')}</option>
                  </select></label>
                <label className="block"><span className="text-[10px] font-bold text-zinc-500">{t('ผู้จัดการสาขา', 'Assigned Branch Manager')} *</span>
                  <input className={inputCls} value={editing.manager} onChange={e => setField('manager', e.target.value)} placeholder="central.manager" /></label>
                <label className="block"><span className="text-[10px] font-bold text-zinc-500">{t('เบอร์โทร', 'Phone Number')} *</span>
                  <input className={inputCls} value={editing.phone} onChange={e => setField('phone', e.target.value)} placeholder="02-xxx-xxxx" /></label>
                <label className="block"><span className="text-[10px] font-bold text-zinc-500">{t('ที่อยู่', 'Address')} *</span>
                  <textarea className={`${inputCls} resize-none`} rows={2} value={editing.address} onChange={e => setField('address', e.target.value)} /></label>
              </section>

              {/* 2. Hours */}
              <section className="space-y-2.5">
                {sectionTitle(2, t('เวลาเปิด-ปิด', 'Opening Hours'))}
                <label className="block"><span className="text-[10px] font-bold text-zinc-500">{t('เวลาเปิด-ปิด (ทุกวัน)', 'Daily hours')} *</span>
                  <input className={inputCls} value={editing.hours} onChange={e => setField('hours', e.target.value)} placeholder="07:00 - 21:00" /></label>
                <p className="text-[10px] text-zinc-400">{t('สามารถกำหนดรายวัน/วันหยุดพิเศษเพิ่มเติมได้ภายหลัง', 'Per-day & holiday overrides can be configured later.')}</p>
              </section>

              {/* 3. Map & location */}
              <section className="space-y-2.5">
                {sectionTitle(3, t('แผนที่และตำแหน่ง', 'Map & Location'))}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block"><span className="text-[10px] font-bold text-zinc-500">Latitude *</span>
                    <input className={inputCls} value={editing.lat} onChange={e => setField('lat', e.target.value)} placeholder="13.7466" /></label>
                  <label className="block"><span className="text-[10px] font-bold text-zinc-500">Longitude *</span>
                    <input className={inputCls} value={editing.lng} onChange={e => setField('lng', e.target.value)} placeholder="100.5347" /></label>
                </div>
                <div className="h-24 rounded-lg border border-[#dddddd] bg-[linear-gradient(135deg,#e0e2e6_25%,transparent_25%),linear-gradient(225deg,#e0e2e6_25%,transparent_25%),linear-gradient(45deg,#e0e2e6_25%,transparent_25%),linear-gradient(315deg,#e0e2e6_25%,#f8fafc_25%)] bg-[length:20px_20px] flex items-center justify-center text-[11px] font-mono text-[#181d26]">
                  <MapPin size={14} className="mr-1" />{editing.lat && editing.lng ? `${editing.lat}, ${editing.lng}` : t('ยังไม่มีพิกัด', 'No coordinates')}
                </div>
              </section>

              {/* 4. Images */}
              <section className="space-y-2.5">
                {sectionTitle(4, t('รูปภาพสาขา', 'Store Images'))}
                <label className="block"><span className="text-[10px] font-bold text-zinc-500">{t('รูปหน้าปก (อิโมจิ/URL)', 'Cover Image (emoji/URL)')} *</span>
                  <input className={inputCls} value={editing.cover} onChange={e => setField('cover', e.target.value)} placeholder="🏬" /></label>
                <label className="block"><span className="text-[10px] font-bold text-zinc-500">{t('แกลเลอรี (คั่นด้วย ,)', 'Gallery (comma-separated)')}</span>
                  <input className={inputCls} value={editing.gallery.join(', ')} onChange={e => setField('gallery', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="☕, 🪑, 🥐" /></label>
              </section>

              {/* 5. Services & facilities */}
              <section className="space-y-2.5">
                {sectionTitle(5, t('บริการและสิ่งอำนวยความสะดวก', 'Services & Facilities'))}
                <div className="flex flex-wrap gap-2">
                  {([['mobileOrder', t('สั่งผ่านแอป', 'Mobile Order'), <Smartphone size={14} />], ['inStore', t('สั่งที่ร้าน', 'In-store'), <Store size={14} />]] as const).map(([k, label, icon]) => (
                    <button key={k} onClick={() => toggleSvc(k as keyof BranchRecord['services'])}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all ${editing.services[k as keyof BranchRecord['services']] ? 'bg-[#181d26] text-white border-[#181d26]' : 'bg-white text-zinc-500 border-[#dddddd]'}`}>
                      {icon}{label}{editing.services[k as keyof BranchRecord['services']] && <Check size={12} />}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FACILITY_META.map(f => {
                    const on = editing.facilities[f.key];
                    return (
                      <button key={f.key} onClick={() => toggleFac(f.key)}
                        className={`px-3 py-2 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all ${on ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-zinc-400 border-[#dddddd]'}`}>
                        {f.icon}{language === 'TH' ? f.th : f.en}{on && <Check size={12} className="ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Validation errors */}
              {errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{t('กรอกข้อมูลไม่ครบ ไม่สามารถเผยแพร่ได้', 'Cannot publish — missing required fields:')}</p>
                    <p>{errors.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Publish footer */}
            <div className="p-4 bg-white border-t border-[#dddddd] shrink-0 space-y-2">
              {sectionTitle(6, t('การเผยแพร่', 'Publishing'))}
              <div className="flex items-center gap-2">
                <button onClick={handleSaveDraft} className="flex-1 py-2.5 border border-[#dddddd] hover:bg-stone-50 text-zinc-600 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
                  <Save size={13} /> {t('บันทึกแบบร่าง', 'Save Draft')}
                </button>
                <button onClick={handlePublish} className="flex-1 py-2.5 bg-[#181d26] hover:bg-[#0d1218] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
                  <Send size={13} /> {t('เผยแพร่ไปยังแอป', 'Publish to App')}
                </button>
              </div>
              {!isNew && editing.publish === 'Published' && (
                <button onClick={() => { handleUnpublish(editing); closeDrawer(); }} className="w-full py-1.5 text-[11px] font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                  {t('ยกเลิกการเผยแพร่ (ซ่อนจากแอป)', 'Unpublish (hide from app)')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile App Preview ── */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setPreview(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-zinc-500 hover:text-zinc-800"><X size={16} /></button>
            {/* Phone frame */}
            <div className="w-[320px] h-[640px] bg-black rounded-[2.5rem] p-2.5 shadow-2xl">
              <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden flex flex-col">
                <div className="h-6 bg-white flex items-center justify-center shrink-0"><div className="w-20 h-4 bg-black rounded-full" /></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {/* Cover */}
                  <div className="h-40 bg-gradient-to-br from-[#9297a0] to-[#181d26] flex items-center justify-center text-6xl">{preview.cover || '🏬'}</div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-lg text-zinc-900">{preview.name}</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusStyle(preview.status)}`}>{statusLabel(preview.status)}</span>
                    </div>
                    <p className="text-xs text-zinc-500 flex items-start gap-1.5"><MapPin size={13} className="shrink-0 mt-0.5" />{preview.address}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Phone size={13} />{preview.phone}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Clock size={13} />{preview.hours}</p>

                    {/* Service tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {preview.services.mobileOrder && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#f8fafc] text-[#181d26] flex items-center gap-1"><Smartphone size={11} />{t('สั่งผ่านแอป', 'Mobile Order')}</span>}
                      {preview.services.inStore && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#f8fafc] text-[#181d26] flex items-center gap-1"><Store size={11} />{t('สั่งที่ร้าน', 'In-store')}</span>}
                    </div>
                    <button
                      disabled={!canAcceptOrders(preview)}
                      className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${canAcceptOrders(preview) ? 'bg-[#181d26] text-white' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
                    >
                      {canAcceptOrders(preview)
                        ? t('เลือกสาขานี้และสั่งซื้อ', 'Select Branch & Order')
                        : preview.status === 'Temporarily Closed'
                          ? t('ปิดชั่วคราว ไม่สามารถสั่งซื้อได้', 'Temporarily Closed - Ordering Unavailable')
                          : t('ปิด ไม่สามารถสั่งซื้อได้', 'Closed - Ordering Unavailable')}
                    </button>

                    {/* Map */}
                    <div className="h-24 rounded-xl border border-[#dddddd] bg-[linear-gradient(135deg,#e0e2e6_25%,transparent_25%),linear-gradient(225deg,#e0e2e6_25%,transparent_25%),linear-gradient(45deg,#e0e2e6_25%,transparent_25%),linear-gradient(315deg,#e0e2e6_25%,#f8fafc_25%)] bg-[length:18px_18px] flex items-center justify-center text-[10px] font-mono text-[#181d26]">
                      <MapPin size={13} className="mr-1" />{preview.lat}, {preview.lng}
                    </div>

                    {/* Facilities */}
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">{t('สิ่งอำนวยความสะดวก', 'Facilities')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {FACILITY_META.filter(f => preview.facilities[f.key]).map(f => (
                          <div key={f.key} className="flex flex-col items-center gap-1 text-[9px] text-zinc-600 bg-stone-50 rounded-lg py-2">
                            <span className="text-[#181d26]">{f.icon}</span>{language === 'TH' ? f.th : f.en}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gallery */}
                    {preview.gallery.length > 0 && (
                      <div className="flex gap-2">
                        {preview.gallery.map((g, i) => <div key={i} className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center text-2xl shrink-0">{g}</div>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {preview.publish !== 'Published' && (
              <p className="text-center text-[11px] text-white/80 mt-3 flex items-center justify-center gap-1.5">
                <AlertCircle size={13} /> {t('สาขานี้ยังไม่เผยแพร่ — จะไม่แสดงบนแอปจริง', 'This branch is not published — it will not appear in the live app.')}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
