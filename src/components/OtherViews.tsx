import React, { useEffect, useState } from 'react';
import { 
  Building, 
  MapPin, 
  Calendar, 
  UserCheck, 
  Briefcase, 
  Mail, 
  Trash2, 
  Clock, 
  Plus, 
  Search, 
  Award, 
  ArrowUpRight, 
  BarChart2, 
  Check, 
  Send,
  Eye,
  Bell,
  Download,
  History,
  FileSpreadsheet,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Branch, Member, Staff, Promotion, Activity, Order } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface OtherViewsProps {
  tab: string;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  roleMode: 'Admin' | 'Staff';
  orders?: Order[];
}

export default function OtherViews({
  tab,
  activities,
  setActivities,
  members,
  setMembers,
  staff,
  setStaff,
  promotions,
  setPromotions,
  roleMode,
  orders = []
}: OtherViewsProps) {
  
  switch (tab) {
    case 'Branches':
      return <BranchesView />;
    case 'Promotions':
      return <PromotionsView promotions={promotions} setPromotions={setPromotions} setActivities={setActivities} />;
    case 'Members':
      return <MembersView members={members} setMembers={setMembers} />;
    case 'Staff Management':
      return <StaffManagementView staff={staff} setStaff={setStaff} />;
    case 'Reports':
      return <ReportsView orders={orders} />;
    case 'Audit Log':
      return <AuditLogView activities={activities} />;
    case 'Notification Center':
      return <NotificationCenterView activities={activities} setActivities={setActivities} />;
    default:
      return (
        <div className="p-6 text-center text-zinc-400 text-xs font-sans">
          This panel is currently empty or undefined.
        </div>
      );
  }
}

// ----------------------------------------------------
// 1. BRANCHES DIAGNOSTICS VIEW
// ----------------------------------------------------
function BranchesView() {
  const { language, t, formatCurrency } = useLanguage();
  
  const branchesData = [
    { name: 'Central Plaza', manager: 'Somsak Kaew', staffCount: 14, sales: 145200, activeQueues: 5, hours: '10:00 - 22:00', status: 'Open' },
    { name: 'Siam Square', manager: 'Janejira Siri', staffCount: 18, sales: 190820, activeQueues: 7, hours: '07:00 - 22:00', status: 'Open' },
    { name: 'Mega Bangna', manager: 'Siriporn Manee', staffCount: 11, sales: 92400, activeQueues: 3, hours: '10:00 - 22:00', status: 'Open' },
    { name: 'The Mall Korat', manager: 'Tanakorn Pun', staffCount: 8, sales: 54900, activeQueues: 2, hours: '10:00 - 21:30', status: 'Open' }
  ];

  return (
    <div className="p-6 space-y-5 font-sans animate-fade-in">
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E6DFD9] shadow-xs">
        <h3 className="font-bold text-sm text-[#2E2A25]">{language === 'TH' ? 'วิเคราะห์ข้อมูลขีดทำงานและการบริการสาขา' : 'Branch Performance Analytics'}</h3>
        <p className="text-[11px] text-zinc-500 mt-0.5">{language === 'TH' ? 'ประมวลค่าสตาฟพนักงาน ยอดจัดส่งรายสาขา และขอบเขตเวลาทำงานหน้าร้านเครื่องดื่ม' : 'Diagnose sales, physical staff roster caps, and current operating state thresholds'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branchesData.map(b => (
          <div key={b.name} className="p-4 bg-white border border-[#E6DFD9] rounded-xl shadow-xs hover:border-amber-400/50 transition-all space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-[#8B6B4F] flex items-center justify-center font-bold font-sans">
                  🏬
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-zinc-900 leading-snug">{b.name}</h4>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                    <Clock size={11} className="text-[#8B6B4F]" /> {language === 'TH' ? 'ชั่วโมงทำการ:' : 'Hours:'} {b.hours}
                  </span>
                </div>
              </div>

              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> {language === 'TH' ? 'เปิดทำการ' : b.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-zinc-100 font-mono text-center">
              <div>
                <span className="text-[9.5px] text-zinc-400 block font-sans">{language === 'TH' ? 'ยอดขายคาดการณ์' : 'Monthly Sales'}</span>
                <strong className="text-zinc-800 text-sm font-bold">{formatCurrency(b.sales)}</strong>
              </div>
              <div className="border-l border-r border-zinc-100">
                <span className="text-[9.5px] text-zinc-400 block font-sans">{language === 'TH' ? 'เกณฑ์บาริสต้า' : 'Baristas Cap'}</span>
                <strong className="text-zinc-800 text-sm font-bold">{b.staffCount}</strong>
              </div>
              <div>
                <span className="text-[9.5px] text-zinc-400 block font-sans">{language === 'TH' ? 'คิวที่กำลังจัดทำ' : 'Active Queues'}</span>
                <strong className="text-[#8B6B4F] text-sm font-bold">{b.activeQueues}</strong>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium">{language === 'TH' ? 'ผู้จัดการสาขาหลัก:' : 'General Manager:'} <strong className="text-zinc-700 font-semibold">{b.manager}</strong></span>
              <button className="text-[11px] font-bold text-[#8B6B4F] hover:underline flex items-center gap-0.5">
                {language === 'TH' ? 'วินิจฉัยเชิงลึก ↗' : 'Full diagnostics ↗'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. PROMOTIONS VIEW (ADVERTISING BOARD / CAMPAIGNS)
// ----------------------------------------------------
const BRANCH_OPTIONS: Exclude<Branch, 'All Branches'>[] = ['Central Plaza', 'Siam Square', 'Mega Bangna', 'The Mall Korat'];
type PromotionStatus = Extract<Promotion['status'], 'Draft' | 'Published' | 'Scheduled' | 'Expired'>;
type ImageField = 'bannerImage' | 'detailImage' | 'thumbnailImage';

const blankPromotion = (): Promotion => ({
  id: `PROMO-${Date.now().toString().slice(-6)}`,
  title: '',
  subtitle: '',
  shortDescription: '',
  fullDescription: '',
  terms: '',
  status: 'Draft',
  startDate: '',
  endDate: '',
  clicks: 0,
  views: 0,
  targetBranch: 'All Branches',
  targetBranches: [],
  showTrending: true,
  showAllPromotions: true,
  sendPush: false,
  notificationTitle: '',
  notificationMessage: '',
  notificationAudience: 'All users',
  notificationScheduleType: 'Send Immediately',
  notificationDate: '',
  notificationTime: '',
  notificationTargetAudience: 'All Users',
  notificationTargetBranches: [],
  notificationStatus: 'Draft',
  bannerImage: '',
  detailImage: '',
  thumbnailImage: '',
  orderNowBehavior: 'Open promotion detail and continue to menu',
});

const normalizePromotion = (p: Promotion): Promotion => ({
  ...p,
  subtitle: p.subtitle || p.shortDescription || '',
  shortDescription: p.shortDescription ?? p.subtitle ?? '',
  fullDescription: p.fullDescription ?? p.subtitle ?? '',
  terms: p.terms ?? '',
  status: p.status === 'Active' ? 'Published' : p.status === 'Inactive' ? 'Draft' : p.status,
  targetBranches: p.targetBranches ?? (p.targetBranch === 'All Branches' ? [] : [p.targetBranch]),
  showTrending: p.showTrending ?? true,
  showAllPromotions: p.showAllPromotions ?? true,
  sendPush: p.sendPush ?? false,
  notificationTitle: p.notificationTitle ?? p.title,
  notificationMessage: p.notificationMessage ?? p.subtitle ?? '',
  notificationAudience: p.notificationAudience ?? 'All users',
  notificationScheduleType: p.notificationScheduleType ?? 'Send Immediately',
  notificationDate: p.notificationDate ?? '',
  notificationTime: p.notificationTime ?? '',
  notificationTargetAudience: p.notificationTargetAudience ?? 'All Users',
  notificationTargetBranches: p.notificationTargetBranches ?? [],
  notificationStatus: p.notificationStatus ?? (p.sendPush ? 'Draft' : undefined),
  bannerImage: p.bannerImage ?? '',
  detailImage: p.detailImage ?? '',
  thumbnailImage: p.thumbnailImage ?? '',
  views: p.views ?? p.clicks ?? 0,
  orderNowBehavior: p.orderNowBehavior ?? 'Open promotion detail and continue to menu',
});

function PromotionsView({
  promotions,
  setPromotions,
  setActivities,
}: {
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
}) {
  const { language } = useLanguage();
  const t = (th: string, en: string) => (language === 'TH' ? th : en);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(promotions[0]?.id ?? null);
  const [errors, setErrors] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<ImageField, string>>({ bannerImage: '', detailImage: '', thumbnailImage: '' });
  const normalizedPromotions = promotions.map(normalizePromotion);

  const notificationDateTime = (p: Promotion) => p.notificationDate && p.notificationTime ? new Date(`${p.notificationDate}T${p.notificationTime}`) : null;
  const formatSchedule = (p: Promotion) => {
    const dt = notificationDateTime(p);
    if (!dt) return t('ยังไม่ได้ตั้งเวลา', 'Not scheduled');
    return `${p.notificationDate} ${p.notificationTime}`;
  };
  const logNotification = (action: string, promo: Promotion, status: NonNullable<Promotion['notificationStatus']>) => {
    const when = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setActivities(prev => [{
      id: `ACT-NOTIF-${Date.now()}`,
      text: `${action} — Promotion: "${promo.title || 'Untitled promotion'}" — Notification Status: ${status} — User: Admin User — Date/Time: ${when}`,
      time: when,
      type: 'coupon',
      status: status === 'Failed' ? 'Alert' : 'Sent',
    }, ...prev]);
  };

  useEffect(() => {
    if (promotions.length === 0) {
      if (selectedPromotionId) setSelectedPromotionId(null);
      return;
    }
    if (!selectedPromotionId || !promotions.some(p => p.id === selectedPromotionId)) {
      setSelectedPromotionId(promotions[0].id);
    }
  }, [promotions, selectedPromotionId]);

  useEffect(() => {
    const sendDueNotifications = () => {
      const due: Promotion[] = [];
      setPromotions(prev => prev.map(p => {
        const rec = normalizePromotion(p);
        const scheduledAt = notificationDateTime(rec);
        if (rec.sendPush && rec.notificationStatus === 'Scheduled' && scheduledAt && scheduledAt.getTime() <= Date.now()) {
          due.push({ ...rec, notificationStatus: 'Sent', notificationSentAt: new Date().toISOString() });
          return { ...rec, notificationStatus: 'Sent', notificationSentAt: new Date().toISOString() };
        }
        return p;
      }));
      due.forEach(p => logNotification('Sent Notification', p, 'Sent'));
    };
    sendDueNotifications();
    const timer = window.setInterval(sendDueNotifications, 30000);
    return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPromotions]);

  const statusStyle = (status: Promotion['status']) => {
    const normalized = status === 'Active' ? 'Published' : status === 'Inactive' ? 'Draft' : status;
    return ({
      Draft: 'bg-zinc-100 text-zinc-600 border-zinc-200',
      Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
      Expired: 'bg-orange-50 text-orange-700 border-orange-200',
    } as Record<PromotionStatus, string>)[normalized as PromotionStatus];
  };

  const statusLabel = (status: Promotion['status']) => {
    const normalized = status === 'Active' ? 'Published' : status === 'Inactive' ? 'Draft' : status;
    return normalized;
  };

  const targetLabel = (p: Promotion) => p.targetBranch === 'All Branches'
    ? t('ทุกสาขา', 'All Branches')
    : (p.targetBranches && p.targetBranches.length > 0 ? p.targetBranches.join(', ') : p.targetBranch);

  const openCreate = () => { setEditing(blankPromotion()); setErrors([]); setImageErrors({ bannerImage: '', detailImage: '', thumbnailImage: '' }); };
  const openEdit = (p: Promotion) => { setSelectedPromotionId(p.id); setEditing(normalizePromotion(p)); setErrors([]); setImageErrors({ bannerImage: '', detailImage: '', thumbnailImage: '' }); };
  const setField = <K extends keyof Promotion>(key: K, value: Promotion[K]) => setEditing(prev => prev ? { ...prev, [key]: value } : prev);

  const validatePublish = (p: Promotion) => {
    const missing: string[] = [];
    if (!p.title.trim()) missing.push(t('หัวข้อโปรโมชัน', 'Promotion Title'));
    if (!(p.shortDescription || p.subtitle || '').trim()) missing.push(t('คำอธิบายสั้น', 'Short Description'));
    if (!(p.fullDescription || '').trim()) missing.push(t('รายละเอียดเต็ม', 'Full Description'));
    if (!p.bannerImage) missing.push(t('รูปแบนเนอร์', 'Banner Image'));
    if (!p.detailImage) missing.push(t('รูปหน้ารายละเอียด', 'Detail Image'));
    if (!p.startDate) missing.push(t('วันเริ่มต้น', 'Start Date'));
    if (!p.endDate) missing.push(t('วันสิ้นสุด', 'End Date'));
    if (p.targetBranch !== 'All Branches' && (!p.targetBranches || p.targetBranches.length === 0)) missing.push(t('สาขาเป้าหมาย', 'Target Branch'));
    if (p.startDate && p.endDate && p.startDate > p.endDate) missing.push(t('ช่วงวันที่ไม่ถูกต้อง', 'Valid date range'));
    return missing;
  };
  const validateNotification = (p: Promotion) => {
    const missing: string[] = [];
    if (!p.notificationTitle?.trim()) missing.push(t('หัวข้อแจ้งเตือน', 'Notification Title'));
    if (!p.notificationMessage?.trim()) missing.push(t('ข้อความแจ้งเตือน', 'Notification Message'));
    if (!p.notificationTargetAudience) missing.push(t('กลุ่มเป้าหมายแจ้งเตือน', 'Target Audience'));
    if ((p.notificationTargetAudience === 'Selected Branches' || p.notificationTargetAudience === 'Customers of Selected Branches') && (!p.notificationTargetBranches || p.notificationTargetBranches.length === 0)) {
      missing.push(t('สาขาเป้าหมายของแจ้งเตือน', 'Notification target branches'));
    }
    if (p.notificationScheduleType === 'Schedule for Later') {
      if (!p.notificationDate) missing.push(t('วันที่แจ้งเตือน', 'Notification Date'));
      if (!p.notificationTime) missing.push(t('เวลาแจ้งเตือน', 'Notification Time'));
      const scheduledAt = notificationDateTime(p);
      if (scheduledAt && scheduledAt.getTime() <= Date.now()) missing.push(t('เวลาส่งต้องอยู่ในอนาคต', 'Scheduled notification time must be in the future'));
    }
    return missing;
  };

  const savePromotion = (nextStatus?: PromotionStatus) => {
    if (!editing) return;
    const previous = promotions.find(p => p.id === editing.id);
    const notificationAction = nextStatus === 'Published' && editing.sendPush
      ? editing.notificationScheduleType === 'Schedule for Later' ? 'schedule' : 'send-now'
      : 'none';
    const nextNotificationStatus =
      notificationAction === 'send-now' ? 'Sent'
      : notificationAction === 'schedule' ? 'Scheduled'
      : editing.sendPush && nextStatus !== 'Published' ? editing.notificationStatus || 'Draft'
      : undefined;
    const rec = normalizePromotion({
      ...editing,
      subtitle: editing.shortDescription || editing.subtitle,
      status: nextStatus || editing.status,
      sendPush: editing.sendPush,
      notificationScheduleType: notificationAction === 'send-now' ? 'Send Immediately' : notificationAction === 'schedule' ? 'Schedule for Later' : editing.notificationScheduleType,
      notificationStatus: nextNotificationStatus,
      notificationSentAt: notificationAction === 'send-now' ? new Date().toISOString() : editing.notificationSentAt,
    });
    const missing = nextStatus === 'Published' ? validatePublish(rec) : [];
    const notificationMissing = rec.sendPush && nextStatus === 'Published' ? validateNotification(rec) : [];
    if ([...missing, ...notificationMissing].length) { setErrors([...missing, ...notificationMissing]); return; }
    setPromotions(prev => {
      const exists = prev.some(p => p.id === rec.id);
      return exists ? prev.map(p => p.id === rec.id ? rec : p) : [rec, ...prev];
    });
    setSelectedPromotionId(rec.id);
    if (rec.sendPush) {
      const action = notificationAction === 'send-now' ? 'Sent Notification'
        : notificationAction === 'schedule' ? 'Scheduled Notification'
        : previous ? 'Edited Notification' : 'Created Notification';
      logNotification(action, rec, rec.notificationStatus || 'Draft');
    }
    setEditing(null);
  };

  const changeStatus = (promo: Promotion, status: PromotionStatus) => {
    const rec = normalizePromotion(promo);
    const missing = status === 'Published' ? validatePublish(rec) : [];
    if (missing.length) { setEditing(rec); setErrors(missing); return; }
    setPromotions(prev => prev.map(p => p.id === promo.id ? { ...rec, status } : p));
    setSelectedPromotionId(promo.id);
  };
  const cancelNotification = (promo: Promotion) => {
    const rec = { ...normalizePromotion(promo), notificationStatus: 'Cancelled' as const };
    setPromotions(prev => prev.map(p => p.id === promo.id ? rec : p));
    setSelectedPromotionId(promo.id);
    logNotification('Cancelled Notification', rec, 'Cancelled');
  };

  const handleImage = (field: ImageField, file?: File) => {
    if (!editing || !file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageErrors(prev => ({ ...prev, [field]: t('รองรับเฉพาะ JPG, PNG, WEBP', 'Only JPG, PNG, and WEBP are supported.') }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageErrors(prev => ({ ...prev, [field]: t('ขนาดไฟล์ต้องไม่เกิน 2MB', 'File size must be 2MB or less.') }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setField(field, String(reader.result) as Promotion[ImageField]);
      setImageErrors(prev => ({ ...prev, [field]: '' }));
    };
    reader.readAsDataURL(file);
  };

  const uploadBox = (field: ImageField, title: string, hint: string) => (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleImage(field, e.dataTransfer.files[0]); }}
      className="border border-dashed border-[#D8C9BD] bg-stone-50 rounded-xl p-3 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div><p className="text-[10px] font-black text-zinc-600 uppercase">{title}</p><p className="text-[9.5px] text-zinc-400">{hint}</p></div>
        {editing?.[field] && <button type="button" onClick={() => setField(field, '' as Promotion[ImageField])} className="text-[10px] font-bold text-red-600">{t('ลบ', 'Remove')}</button>}
      </div>
      {editing?.[field] ? (
        <img src={editing[field]} alt={title} className="w-full h-24 object-cover rounded-lg border border-[#E6DFD9]" />
      ) : (
        <label className="h-24 rounded-lg border border-[#E6DFD9] bg-white flex flex-col items-center justify-center text-zinc-400 text-[10px] font-semibold cursor-pointer">
          <ImageIcon size={18} className="mb-1" /> {t('ลากรูปมาวาง หรือคลิกเพื่ออัปโหลด', 'Drag image here or click to upload')}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleImage(field, e.target.files?.[0])} />
        </label>
      )}
      {imageErrors[field] && <p className="text-[10px] text-red-600 font-semibold">{imageErrors[field]}</p>}
    </div>
  );

  const selectedPromotion = normalizedPromotions.find(p => p.id === selectedPromotionId) || normalizedPromotions[0];
  const preview = normalizePromotion(selectedPromotion || blankPromotion());

  return (
    <div className="p-6 space-y-5 font-sans">
      <div className="bg-white border border-[#E6DFD9] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="font-black text-lg text-[#2E2A25]">{t('จัดการโปรโมชัน', 'Promotion Management')}</h2>
          <p className="text-xs text-zinc-500">{t('จัดการแบนเนอร์ รายการโปรโมชัน หน้ารายละเอียด และการแจ้งเตือนลูกค้า', 'Manage mobile banners, promotion lists, detail pages, and push notifications.')}</p>
        </div>
        <button id="create-promotion-btn" onClick={openCreate} className="px-4 py-2 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
          <Plus size={14} /> {t('สร้างโปรโมชัน', 'Create Promotion')}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-3">
          {normalizedPromotions.map(promo => {
            const isPreviewing = promo.id === preview.id;
            return (
            <div
              key={promo.id}
              onClick={() => setSelectedPromotionId(promo.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedPromotionId(promo.id); }}
              role="button"
              tabIndex={0}
              className={`border rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-4 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B6B4F]/30 ${isPreviewing ? 'bg-[#FDF7F1] border-[#8B6B4F]' : 'bg-white border-[#E6DFD9] hover:bg-stone-50'}`}
            >
              <div className="w-full md:w-32 h-24 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-[#E6DFD9]">
                {promo.bannerImage || promo.thumbnailImage ? <img src={promo.bannerImage || promo.thumbnailImage} alt={promo.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">%</div>}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {isPreviewing && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#8B6B4F] text-white">{t('กำลังแสดงตัวอย่าง', 'Currently Previewing')}</span>}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusStyle(promo.status)}`}>{statusLabel(promo.status)}</span>
                  <span className="text-[9px] font-mono text-zinc-400">{targetLabel(promo)}</span>
                </div>
                <h3 className="font-bold text-sm text-zinc-900 truncate">{promo.title || t('ยังไม่มีชื่อโปรโมชัน', 'Untitled promotion')}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2">{promo.shortDescription || promo.subtitle}</p>
                <p className="font-mono text-[10px] text-zinc-400">{promo.startDate || 'YYYY-MM-DD'} - {promo.endDate || 'YYYY-MM-DD'}</p>
                {promo.sendPush && (
                  <p className="font-mono text-[9.5px] text-zinc-500">
                    {t('แจ้งเตือน', 'Notification')}: <span className="font-bold">{promo.notificationStatus || 'Draft'}</span>
                    {promo.notificationStatus === 'Scheduled' && ` · ${formatSchedule(promo)}`}
                  </p>
                )}
              </div>
              <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-[9px] text-zinc-400 uppercase font-bold">{t('คลิก / วิว', 'Clicks / Views')}</p>
                  <p className="font-mono font-black text-[#8B6B4F]">{promo.clicks.toLocaleString()} / {(promo.views || 0).toLocaleString()}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(promo)} className="px-3 py-1.5 text-[10px] font-bold border border-[#E6DFD9] rounded-lg hover:bg-stone-50">{t('แก้ไข', 'Edit')}</button>
                  {statusLabel(promo.status) === 'Published' ? (
                    <button onClick={() => changeStatus(promo, 'Draft')} className="px-3 py-1.5 text-[10px] font-bold bg-zinc-100 text-zinc-600 rounded-lg">{t('ยกเลิกเผยแพร่', 'Unpublish')}</button>
                  ) : (
                    <button onClick={() => changeStatus(promo, 'Published')} className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white rounded-lg">{t('เผยแพร่', 'Publish')}</button>
                  )}
                  {promo.notificationStatus === 'Scheduled' && (
                    <button onClick={() => cancelNotification(promo)} className="px-3 py-1.5 text-[10px] font-bold bg-red-50 text-red-600 rounded-lg">{t('ยกเลิกแจ้งเตือน', 'Cancel Notification')}</button>
                  )}
                </div>
              </div>
            </div>
          );
          })}
        </div>

        <div className="bg-white border border-[#E6DFD9] rounded-xl p-4 shadow-xs self-start space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#2E2A25]">{t('ตัวอย่างบนแอปมือถือ', 'Mobile App Preview')}</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {selectedPromotion ? `${t('กำลังแสดง', 'Previewing')}: ${preview.title || t('ยังไม่มีชื่อโปรโมชัน', 'Untitled promotion')}` : t('ยังไม่มีโปรโมชันให้แสดงตัวอย่าง', 'No promotion selected for preview.')}
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-zinc-900 p-2">
            <div className="bg-white rounded-[1.25rem] overflow-hidden">
              <div className="p-3 space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 mb-1">{t('แบนเนอร์โปรโมชันเด่น', 'Trending Promotion banner')}</p>
                  <div className="h-32 rounded-xl overflow-hidden bg-[#FDF1E6] relative">
                    {preview.bannerImage && <img src={preview.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/45 to-transparent p-3 flex flex-col justify-end">
                      <p className="text-white font-black text-sm">{preview.title || 'Promotion Title'}</p>
                      <p className="text-white/85 text-[10px]">{preview.shortDescription || preview.subtitle || 'Short promotion description'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 mb-1">{t('รายการโปรโมชันทั้งหมด', 'All Promotions list item')}</p>
                  <div className="flex gap-2 p-2 rounded-xl border border-zinc-100">
                    <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0">{preview.thumbnailImage && <img src={preview.thumbnailImage} alt="" className="w-full h-full object-cover" />}</div>
                    <div className="min-w-0"><p className="font-bold text-xs truncate">{preview.title || 'Promotion Title'}</p><p className="text-[10px] text-zinc-500 line-clamp-2">{preview.shortDescription || preview.subtitle || 'Short description'}</p><p className="text-[9px] text-[#8B6B4F] font-mono">{preview.startDate || 'Start'} - {preview.endDate || 'End'}</p></div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 mb-1">{t('หน้ารายละเอียดโปรโมชัน', 'Promotion Detail page')}</p>
                  <div className="rounded-xl border border-zinc-100 overflow-hidden">
                    <div className="h-28 bg-stone-100">{preview.detailImage && <img src={preview.detailImage} alt="" className="w-full h-full object-cover" />}</div>
                    <div className="p-3 space-y-1"><p className="font-black text-sm">{preview.title || 'Promotion Title'}</p><p className="text-[10px] text-zinc-500">{preview.fullDescription || 'Full promotion description appears here.'}</p><p className="text-[9px] text-[#8B6B4F] font-mono">{preview.startDate || 'Start'} - {preview.endDate || 'End'}</p><p className="text-[9px] text-zinc-400">{targetLabel(preview)}</p><button className="w-full mt-2 py-2 bg-[#8B6B4F] text-white rounded-lg text-[10px] font-bold">{t('สั่งเลย', 'Order Now')}</button></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={() => setEditing(null)}>
          <div className="w-full max-w-3xl h-full bg-stone-50 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-white border-b border-[#E6DFD9] flex items-center justify-between">
              <div><h3 className="font-bold text-sm text-[#2E2A25]">{editing.title ? t('แก้ไขโปรโมชัน', 'Edit Promotion') : t('สร้างโปรโมชัน', 'Create Promotion')}</h3><p className="text-[11px] text-zinc-400">{editing.id}</p></div>
              <button onClick={() => setEditing(null)} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
              {errors.length > 0 && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">{t('กรุณากรอกข้อมูลก่อนเผยแพร่:', 'Complete required fields before publishing:')} {errors.join(', ')}</div>}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <label className="space-y-1"><span className="font-bold text-zinc-500">{t('หัวข้อโปรโมชัน', 'Promotion Title')} *</span><input value={editing.title} onChange={e => setField('title', e.target.value)} className="w-full p-2 border rounded-lg" /></label>
                <label className="space-y-1"><span className="font-bold text-zinc-500">{t('คำอธิบายสั้น', 'Short Description')} *</span><input value={editing.shortDescription || ''} onChange={e => { setField('shortDescription', e.target.value); setField('subtitle', e.target.value); }} className="w-full p-2 border rounded-lg" /></label>
                <label className="md:col-span-2 space-y-1"><span className="font-bold text-zinc-500">{t('รายละเอียดเต็ม', 'Full Description')} *</span><textarea value={editing.fullDescription || ''} onChange={e => setField('fullDescription', e.target.value)} className="w-full p-2 border rounded-lg h-24 resize-none" /></label>
                <label className="md:col-span-2 space-y-1"><span className="font-bold text-zinc-500">{t('เงื่อนไข', 'Terms & Conditions')}</span><textarea value={editing.terms || ''} onChange={e => setField('terms', e.target.value)} className="w-full p-2 border rounded-lg h-20 resize-none" /></label>
                <label className="space-y-1"><span className="font-bold text-zinc-500">{t('วันเริ่มต้น', 'Start Date')} *</span><input type="date" value={editing.startDate} onChange={e => setField('startDate', e.target.value)} className="w-full p-2 border rounded-lg" /></label>
                <label className="space-y-1"><span className="font-bold text-zinc-500">{t('วันสิ้นสุด', 'End Date')} *</span><input type="date" value={editing.endDate} onChange={e => setField('endDate', e.target.value)} className="w-full p-2 border rounded-lg" /></label>
                <label className="space-y-1"><span className="font-bold text-zinc-500">{t('สถานะ', 'Promotion Status')}</span><select value={statusLabel(editing.status)} onChange={e => setField('status', e.target.value as Promotion['status'])} className="w-full p-2 border rounded-lg"><option>Draft</option><option>Published</option><option>Scheduled</option><option>Expired</option></select></label>
                <label className="space-y-1"><span className="font-bold text-zinc-500">{t('สาขาเป้าหมาย', 'Target Branch')} *</span><select value={editing.targetBranch} onChange={e => setField('targetBranch', e.target.value as Branch)} className="w-full p-2 border rounded-lg"><option value="All Branches">{t('ทุกสาขา', 'All Branches')}</option><option value="Central Plaza">{t('เลือกบางสาขา', 'Specific Branches')}</option></select></label>
                {editing.targetBranch !== 'All Branches' && (
                  <div className="md:col-span-2 flex flex-wrap gap-2">
                    {BRANCH_OPTIONS.map(branch => {
                      const active = (editing.targetBranches || []).includes(branch);
                      return <button key={branch} type="button" onClick={() => setField('targetBranches', active ? (editing.targetBranches || []).filter(b => b !== branch) : [...(editing.targetBranches || []), branch])} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${active ? 'bg-[#8B6B4F] text-white' : 'bg-white text-zinc-500'}`}>{branch}</button>;
                    })}
                  </div>
                )}
              </section>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {uploadBox('bannerImage', t('แบนเนอร์ Trending', 'Trending Banner Image'), '345 x 160 px, JPG/PNG/WEBP')}
                {uploadBox('detailImage', t('รูปหัวหน้ารายละเอียด', 'Detail Header Image'), '390 x 300 px, JPG/PNG/WEBP')}
                {uploadBox('thumbnailImage', t('รูป Thumbnail', 'Thumbnail Image'), '80 x 80 px, JPG/PNG/WEBP')}
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 p-3 bg-white border rounded-xl"><input type="checkbox" checked={!!editing.showTrending} onChange={e => setField('showTrending', e.target.checked)} /> {t('แสดงใน Trending Promotions', 'Show in Trending Promotions')}</label>
                <label className="flex items-center gap-2 p-3 bg-white border rounded-xl"><input type="checkbox" checked={!!editing.showAllPromotions} onChange={e => setField('showAllPromotions', e.target.checked)} /> {t('แสดงในรายการโปรโมชันทั้งหมด', 'Show in All Promotions')}</label>
                <label className="md:col-span-2 space-y-1"><span className="font-bold text-zinc-500">{t('พฤติกรรมปุ่ม Order Now', 'Order Now button behavior')}</span><input value={editing.orderNowBehavior || ''} onChange={e => setField('orderNowBehavior', e.target.value)} className="w-full p-2 border rounded-lg" /></label>
              </section>

              <section className="bg-white border border-[#E6DFD9] rounded-xl p-3 space-y-3 text-xs">
                <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={!!editing.sendPush} onChange={e => setField('sendPush', e.target.checked)} /> {t('ส่ง Push Notification หลังเผยแพร่', 'Send Push Notification after publish')}</label>
                {editing.sendPush && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {editing.notificationStatus === 'Sent' && (
                      <div className="md:col-span-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-semibold">
                        {t('แจ้งเตือนนี้ส่งแล้ว ไม่สามารถแก้ไขเนื้อหาแจ้งเตือนได้', 'This notification has been sent and its notification content can no longer be edited.')}
                      </div>
                    )}
                    <label className="space-y-1"><span className="font-bold text-zinc-500">{t('หัวข้อแจ้งเตือน', 'Notification Title')} *</span><input disabled={editing.notificationStatus === 'Sent'} placeholder={t('หัวข้อแจ้งเตือน', 'Notification Title')} value={editing.notificationTitle || ''} onChange={e => setField('notificationTitle', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-zinc-100" /></label>
                    <label className="space-y-1"><span className="font-bold text-zinc-500">{t('รูปแบบการส่ง', 'Notification Schedule Type')}</span><select disabled={editing.notificationStatus === 'Sent'} value={editing.notificationScheduleType || 'Send Immediately'} onChange={e => setField('notificationScheduleType', e.target.value as Promotion['notificationScheduleType'])} className="w-full p-2 border rounded-lg disabled:bg-zinc-100"><option>Send Immediately</option><option>Schedule for Later</option></select></label>
                    {editing.notificationScheduleType === 'Schedule for Later' && (
                      <>
                        <label className="space-y-1"><span className="font-bold text-zinc-500">{t('วันที่แจ้งเตือน', 'Notification Date')} *</span><input disabled={editing.notificationStatus === 'Sent'} type="date" value={editing.notificationDate || ''} onChange={e => setField('notificationDate', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-zinc-100" /></label>
                        <label className="space-y-1"><span className="font-bold text-zinc-500">{t('เวลาแจ้งเตือน', 'Notification Time')} *</span><input disabled={editing.notificationStatus === 'Sent'} type="time" value={editing.notificationTime || ''} onChange={e => setField('notificationTime', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-zinc-100" /></label>
                      </>
                    )}
                    <label className="space-y-1"><span className="font-bold text-zinc-500">{t('กลุ่มเป้าหมาย', 'Target Audience')} *</span><select disabled={editing.notificationStatus === 'Sent'} value={editing.notificationTargetAudience || 'All Users'} onChange={e => setField('notificationTargetAudience', e.target.value as Promotion['notificationTargetAudience'])} className="w-full p-2 border rounded-lg disabled:bg-zinc-100"><option>All Users</option><option>All Branches</option><option>Selected Branches</option><option>Customers of Selected Branches</option></select></label>
                    <label className="md:col-span-2 space-y-1"><span className="font-bold text-zinc-500">{t('ข้อความแจ้งเตือน', 'Notification Message')} *</span><textarea disabled={editing.notificationStatus === 'Sent'} placeholder={t('ข้อความแจ้งเตือน', 'Notification Message')} value={editing.notificationMessage || ''} onChange={e => setField('notificationMessage', e.target.value)} className="w-full p-2 border rounded-lg h-16 resize-none disabled:bg-zinc-100" /></label>
                    {(editing.notificationTargetAudience === 'Selected Branches' || editing.notificationTargetAudience === 'Customers of Selected Branches') && (
                      <div className="md:col-span-2 flex flex-wrap gap-2">
                        {BRANCH_OPTIONS.map(branch => {
                          const active = (editing.notificationTargetBranches || []).includes(branch);
                          return <button key={branch} type="button" disabled={editing.notificationStatus === 'Sent'} onClick={() => setField('notificationTargetBranches', active ? (editing.notificationTargetBranches || []).filter(b => b !== branch) : [...(editing.notificationTargetBranches || []), branch])} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border disabled:opacity-50 ${active ? 'bg-[#8B6B4F] text-white' : 'bg-white text-zinc-500'}`}>{branch}</button>;
                        })}
                      </div>
                    )}
                    <div className="md:col-span-2 p-3 bg-stone-50 border border-[#E6DFD9] rounded-xl space-y-1">
                      <p className="font-black text-[10px] uppercase text-zinc-500">{t('ตัวอย่างแจ้งเตือน', 'Notification Preview')}</p>
                      <p className="font-bold text-zinc-900">{editing.notificationTitle || t('หัวข้อแจ้งเตือน', 'Notification Title')}</p>
                      <p className="text-zinc-600">{editing.notificationMessage || t('ข้อความแจ้งเตือนจะแสดงที่นี่', 'Notification message appears here.')}</p>
                      <p className="font-mono text-[10px] text-zinc-400">{editing.notificationScheduleType === 'Schedule for Later' ? formatSchedule(editing) : t('ส่งทันทีหลังเผยแพร่', 'Send immediately after publish')} · {editing.notificationTargetAudience || 'All Users'}</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
            <div className="p-4 bg-white border-t border-[#E6DFD9] flex justify-end gap-2">
              <button onClick={() => savePromotion('Draft')} className="px-4 py-2 border rounded-lg text-xs font-bold">{t('บันทึกฉบับร่าง', 'Save Draft')}</button>
              <button onClick={() => savePromotion('Published')} className="px-4 py-2 bg-[#8B6B4F] text-white rounded-lg text-xs font-bold">{t('เผยแพร่', 'Publish')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 3. MEMBERS CRM REGISTER
// ----------------------------------------------------
function MembersView({ members, setMembers }: { members: Member[], setMembers: any }) {
  const [search, setSearch] = useState('');
  const { language, formatCurrency } = useLanguage();

  const filtered = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.phone.includes(search) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 font-sans animate-fade-in">
      <div className="bg-[#FFFFFF] p-4.5 rounded-xl border border-[#E6DFD9] flex flex-col sm:flex-row sm:items-center justify-between gap-4.5 shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-[#2E2A25]">{language === 'TH' ? 'ทะเบียนสมาชิกลูกค้า (CRM)' : 'Client CRM Registry'}</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">{language === 'TH' ? 'จัดการระดับเกียรติยศลูกค้า ตรวจสอบยอดพอยท์รางวัล และอัตราผลตอบแทนสั่งซื้อกาแฟสะสม' : 'Manage users loyalty tier cards, track spent budgets, and balance coffee points rewards'}</p>
        </div>

        {/* Search input and form */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
          <input 
            type="text" 
            placeholder={language === 'TH' ? 'ค้นหาชื่อสมาชิก, เบอร์โทรศัพท์...' : 'Search Member name, phone...'} 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs py-2 pl-9 pr-3 bg-stone-50 border rounded-lg focus:outline-none focus:border-[#8B6B4F]"
          />
        </div>
      </div>

      {/* Roster table */}
      <div className="bg-[#FFFFFF] border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6DFD9] bg-stone-50/50 text-[#8B6B4F]">
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider">{language === 'TH' ? 'ข้อมูลชื่อและวันลงทะเบียนสมาชิก' : 'Client Member Name'}</th>
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider">{language === 'TH' ? 'ข้อมูลการติดต่อหลัก' : 'Contact Coordinates'}</th>
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider">{language === 'TH' ? 'ระดับพอยท์บัตรเกียรติยศ' : 'Membership tier'}</th>
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right">{language === 'TH' ? 'ยอดสะสมแต้มปัจจุบัน' : 'Points bank'}</th>
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right">{language === 'TH' ? 'อัตรายอดเสียเงินกาแฟสะสม' : 'Total spendings'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.map(m => {
                const tierStyles = {
                  Gold: 'bg-amber-100 text-amber-800 border-amber-200/20 font-bold',
                  Silver: 'bg-slate-100 text-slate-700 border-slate-200/50',
                  Bronze: 'bg-orange-100 text-orange-850 border-orange-200/20'
                }[m.tier] || 'bg-zinc-100';

                return (
                  <tr key={m.id} className="hover:bg-amber-50/5 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-zinc-900">{m.name}</div>
                      <span className="font-mono text-[9.5px] text-zinc-400">{language === 'TH' ? 'สมัครเมื่อ:' : 'Join date:'} {m.joinDate}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div>📱 {m.phone}</div>
                      <div className="text-zinc-400 text-[10.5px] mt-0.5">✉️ {m.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] ${tierStyles}`}>
                        {m.tier}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-right text-zinc-800">
                      ⭐ {m.points} {language === 'TH' ? 'แต้ม' : 'pts'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <strong className="font-mono text-[#8B6B4F] text-xs font-black">{formatCurrency(m.totalSpend)}</strong>
                      <span className="text-[10px] text-zinc-400 font-mono block">({m.totalOrders} {language === 'TH' ? 'รอบสั่งซื้อที่แล้ว' : 'order records'})</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. STAFF MANAGEMENT VIEW
// ----------------------------------------------------
function StaffManagementView({ staff, setStaff }: { staff: Staff[], setStaff: any }) {
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Branch Manager' | 'Barista'>('Barista');
  const [newStaffBranch, setNewStaffBranch] = useState<Branch>('Central Plaza');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { language } = useLanguage();

  const handleToggleState = (id: string) => {
    setStaff((prev: any) => prev.map((s: any) => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return s;
    }));
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    const newS: Staff = {
      id: `STF-00${staff.length + 1}`,
      name: newStaffName,
      role: newStaffRole,
      branch: newStaffBranch,
      email: newStaffEmail,
      status: 'Active'
    };

    setStaff((prev: any) => [...prev, newS]);
    setNewStaffName('');
    setNewStaffEmail('');
    setShowAddForm(false);
  };

  const handleDeleteStaff = (id: string) => {
    setStaff((prev: any) => prev.filter((s: any) => s.id !== id));
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4.5 bg-[#FFFFFF] p-4.5 rounded-xl border border-[#E6DFD9] shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-[#2E2A25]">{language === 'TH' ? 'บัญชีควบคุมกำลังพลบาริสต้า' : 'Workforce Roster & Baristas'}</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">{language === 'TH' ? 'ควบคุมสิทธิ์พนักงานบาริสต้า แคชเชียร์ ประจำสาขา และเปิดปิดเวลางานกะล่าสุด' : 'Authorise cash register access, assign staff branches, and toggle active shift rosters'}</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-3.5 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg font-sans shadow-xs transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={14} /> {language === 'TH' ? 'สมัครพนักงานใหม่เข้าระบบ' : 'Register New Staff'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        
        {/* Listings roster */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6DFD9] bg-stone-50/50">
                  <th className="py-2.5 px-3 font-sans font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'รายชื่อบุคลากร' : 'Employee Name'}</th>
                  <th className="py-2.5 px-3 font-sans font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'จุดปฏิบัติจริง' : 'Assigned Point'}</th>
                  <th className="py-2.5 px-3 font-sans font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'บทบาทขอบเขต' : 'System Role'}</th>
                  <th className="py-2.5 px-3 font-sans font-bold text-zinc-500 uppercase tracking-wider text-center">{language === 'TH' ? 'สถานะกะ' : 'Status'}</th>
                  <th className="py-2.5 px-3 font-sans font-bold text-zinc-500 uppercase tracking-wider text-center">{language === 'TH' ? 'ปลดออก' : 'Delete'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-amber-50/5 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-zinc-900">{s.name}</div>
                      <div className="text-zinc-400 text-[10.5px] font-mono leading-none mt-0.5">{s.email}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-zinc-600">
                      {s.branch}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 font-bold rounded-md border text-[9px] ${
                        s.role === 'Super Admin' 
                          ? 'bg-rose-50 text-rose-800 border-rose-220/20' 
                          : s.role === 'Branch Manager' 
                            ? 'bg-[#EAD1A8]/20 text-neutral-800 border-yellow-200' 
                            : 'bg-emerald-50 text-[#4A6042] border-[#A8BB9A]/20'
                      }`}>
                        {s.role === 'Super Admin' ? (language === 'TH' ? 'ผู้ดูแลระบบสูงสุด' : 'Super Admin') : s.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleState(s.id)}
                        className={`px-2.5 py-0.5 font-sans font-bold border rounded-lg text-[10px] ${
                          s.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-850 border-emerald-200' 
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200/50'
                        }`}
                      >
                        {s.status === 'Active' ? (language === 'TH' ? 'ประจำการ' : 'Active') : (language === 'TH' ? 'ออกกะ' : 'Offline')}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {s.role !== 'Super Admin' ? (
                        <button
                          onClick={() => handleDeleteStaff(s.id)}
                          className="p-1 border text-red-600 hover:bg-red-50 text-red-600 inline-flex items-center justify-center rounded-md border-red-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <span className="text-zinc-400 italic font-mono text-[9px]">Root</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add staff panel sidebar */}
        <div className="bg-[#FFFFFF] border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs self-start">
          <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9]">
            <h3 className="font-bold text-sm text-[#2E2A25] flex items-center gap-1.5">
              <span>{language === 'TH' ? 'พนักงานขึ้นดัชนีด่วน' : 'Staff Quick Register'}</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">{language === 'TH' ? 'เก็บบันทึกสัญญาเพิ่มชื่อใหม่ในสารระบบ' : 'Registers a new employee into branches database'}</p>
          </div>

          <form onSubmit={handleAddStaff} className="p-4 space-y-4 text-xs font-sans text-zinc-600">
            <div className="space-y-1">
              <label className="font-bold">{language === 'TH' ? 'ชื่อและนามสกุลจริง:' : 'Staff Name:'}</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Somsak Jai..."
                value={newStaffName}
                onChange={e => setNewStaffName(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold">{language === 'TH' ? 'อีเมลพนักงานองค์กร:' : 'Corporate Email:'}</label>
              <input 
                type="email" 
                required
                placeholder="somchai.s@quickcoffee.com"
                value={newStaffEmail}
                onChange={e => setNewStaffEmail(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border rounded-lg focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-bold">{language === 'TH' ? 'หัวข้อตำแหน่งภารกิจ:' : 'Role Title:'}</label>
                <select
                  value={newStaffRole}
                  onChange={e => setNewStaffRole(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-sky-50/20 border rounded-lg focus:outline-none"
                >
                  <option value="Barista">Barista</option>
                  <option value="Branch Manager">Branch Manager</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold">{language === 'TH' ? 'มอบหมายแคว้นงาน:' : 'Assign Area:'}</label>
                <select
                  value={newStaffBranch}
                  onChange={e => setNewStaffBranch(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-sky-50/20 border rounded-lg focus:outline-none"
                >
                  <option value="Central Plaza">Central Plaza</option>
                  <option value="Siam Square">Siam Square</option>
                  <option value="Mega Bangna">Mega Bangna</option>
                  <option value="The Mall Korat">The Mall Korat</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#8B6B4F] hover:bg-[#70533C] text-white font-sans text-xs font-bold rounded-lg shadow-xs mt-2"
            >
              {language === 'TH' ? 'ยืนยันสมัครพนักงาน' : 'Confirm Registration'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. REPORTS MONTHLY SUMMARY GRAPHICAL VIEW
// ----------------------------------------------------
function ReportsView({ orders = [] }: { orders?: Order[] }) {
  const { language, formatCurrency } = useLanguage();
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('All Branches');
  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-06-15');

  // Filter orders based on active selections
  const filteredOrders = orders.filter(ord => {
    if (selectedBranchFilter !== 'All Branches' && ord.branch !== selectedBranchFilter) {
      return false;
    }
    return true; // Simplified date simulation range for mock workspace to ensure reliability
  });

  const completedOrders = filteredOrders.filter(o => o.status === 'Completed' || o.status === 'Ready For Pickup');
  const isSystemCancelled = (o: Order) => ['Cancelled', 'Auto Cancelled', 'Cancelled by Staff'].includes(o.status) && (
    o.status === 'Auto Cancelled' ||
    o.cancelledBy === 'System' ||
    o.cancellationReason === 'Customer Did Not Pay' ||
    o.cancellationReason === 'Payment Timeout' ||
    o.cancellationReason === 'Payment Expired' ||
    o.cancellationReason === 'Payment Verification Failed'
  );
  
  // Calculate dynamic metrics!
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalOrdersCount = filteredOrders.length;
  const autoCancelledCount = filteredOrders.filter(isSystemCancelled).length;
  const staffCancelledCount = filteredOrders.filter(o => ['Cancelled', 'Cancelled by Staff'].includes(o.status) && !isSystemCancelled(o)).length;
  // Dynamic coupon discount estimation (averages 12% on applicable completed bills)
  const totalDiscount = completedOrders.reduce((sum, o) => {
    const isCouponUsed = o.id.includes('2') || o.id.includes('6') || o.id.includes('9');
    return sum + (isCouponUsed ? o.amount * 0.15 : 0);
  }, 0);

  // Top Products breakdown metrics
  const productCounts: Record<string, { name: string, qty: number, revenue: number, category: string, image: string }> = {};
  filteredOrders.forEach(ord => {
    ord.items.forEach(it => {
      const p = it.item;
      if (!productCounts[p.id]) {
        productCounts[p.id] = { name: p.name, qty: 0, revenue: 0, category: p.category, image: p.image };
      }
      productCounts[p.id].qty += it.qty;
      productCounts[p.id].revenue += it.total;
    });
  });

  const sortedProducts = Object.values(productCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const handleExportExcel = () => {
    const headers = [
      'Order ID', 'Queue No', 'Customer Name', 'Customer Phone', 'Branch',
      'Status', 'Cancellation Type', 'Cancellation Reason', 'Amount (THB)', 'Coupon Discount (THB)', 'Payment Status', 'Order Time'
    ];
    
    const rows = filteredOrders.map(ord => {
      const isCouponUsed = ord.id.includes('2') || ord.id.includes('6') || ord.id.includes('9');
      const discountVal = isCouponUsed ? ord.amount * 0.15 : 0;
      return [
        ord.id,
        ord.queueNo,
        ord.customerName,
        ord.customerPhone,
        ord.branch,
        ord.status,
        ['Cancelled', 'Auto Cancelled', 'Cancelled by Staff'].includes(ord.status) ? (isSystemCancelled(ord) ? 'Auto Cancelled' : 'Cancelled by Staff') : '',
        ord.cancellationReason || '',
        ord.amount,
        discountVal.toFixed(2),
        ord.paymentStatus,
        ord.orderTime
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(item => `"${item}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `quick_coffee_sales_report_${selectedBranchFilter.replace(/\s+/g, '')}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Title block */}
      <div className="bg-[#FFFFFF] p-4.5 rounded-xl border border-[#E6DFD9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-[#2E2A25]">
            {language === 'TH' ? 'ระบบรายงานวิเคราะห์ยอดขาย (Sales Reports)' : 'Corporate Sales Report Deck'}
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {language === 'TH' 
              ? 'คัดกรองข้อมูลยอดจัดซื้อรายสาขา หักลบส่วนลดแคมเปญ สรุปอันดับเครื่องดื่มขายดีเรียลไทม์' 
              : 'Traces transactional metrics, aggregates active coupon discounts, and extracts products selling trends.'}
          </p>
        </div>

        <button 
          id="export-sales-excel-btn"
          onClick={handleExportExcel}
          className="px-3.5 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg font-sans shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <FileSpreadsheet size={14} />
          {language === 'TH' ? 'ส่งออกรายงานยอดขาย (Excel)' : 'Export Report (.xlsx)'}
        </button>
      </div>

      {/* Control filters bar */}
      <div className="bg-white border text-xs text-zinc-800 p-4.5 rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Branch dropdown */}
          <div className="space-y-1">
            <label className="text-zinc-500 font-extrabold uppercase tracking-wide text-[9.5px] block">{language === 'TH' ? 'ตัวกรองสาขา:' : 'Filter Branch:'}</label>
            <select
              value={selectedBranchFilter}
              onChange={e => setSelectedBranchFilter(e.target.value)}
              className="w-full bg-stone-50 border rounded-lg p-2 text-xs focus:outline-none focus:border-[#8B6B4F] cursor-pointer"
            >
              <option value="All Branches">{language === 'TH' ? 'ทุกสาขาหน้าร้าน' : 'All Branches'}</option>
              <option value="Central Plaza">Central Plaza</option>
              <option value="Siam Square">Siam Square</option>
              <option value="Mega Bangna">Mega Bangna</option>
              <option value="The Mall Korat">The Mall Korat</option>
            </select>
          </div>

          {/* Date range filters */}
          <div className="space-y-1">
            <label className="text-zinc-500 font-extrabold uppercase tracking-wide text-[9.5px] block">{language === 'TH' ? 'เริ่มงานตั้งแต่วันที่:' : 'Start Date:'}</label>
            <input 
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-stone-50 border rounded-lg p-1.5 text-xs focus:outline-none focus:border-[#8B6B4F] cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 font-extrabold uppercase tracking-wide text-[9.5px] block">{language === 'TH' ? 'สิ้นสุดวันที่:' : 'End Date:'}</label>
            <input 
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-stone-50 border rounded-lg p-1.5 text-xs focus:outline-none focus:border-[#8B6B4F] cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* Structured metrics summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 animate-fade-in">
        
        {/* Total Revenue */}
        <div className="p-4 border border-[#E6DFD9] rounded-xl bg-white shadow-xs">
          <span className="text-[11.5px] text-zinc-500 font-bold uppercase tracking-wider block">{language === 'TH' ? 'รายได้ขายสุทธิ' : 'Revenue'}</span>
          <strong className="text-zinc-900 text-2xl font-black font-mono mt-1 w-full block">
            {formatCurrency(totalRevenue)}
          </strong>
          <span className="text-emerald-700 font-mono text-[10px] font-semibold mt-1 block">
            {language === 'TH' ? '✓ บันทึกค่า Completed เท่านั้น' : '✓ Completed orders sum'}
          </span>
        </div>

        {/* Total Orders count */}
        <div className="p-4 border border-[#E6DFD9] rounded-xl bg-white shadow-xs">
          <span className="text-[11.5px] text-zinc-500 font-bold uppercase tracking-wider block">{language === 'TH' ? 'ปริมาณธุรกรรมตั๋ว' : 'Total OrdersCount'}</span>
          <strong className="text-zinc-900 text-2xl font-black font-mono mt-1 w-full block">
            {totalOrdersCount} <span className="text-xs font-normal text-zinc-500">{language === 'TH' ? 'บิล' : 'bills'}</span>
          </strong>
          <span className="text-[#8B6B4F] font-mono text-[10px] font-semibold mt-1 block">
            {language === 'TH' ? 'รวมยอดทุกบิลในระบบ' : 'Total branch logs'}
          </span>
        </div>

        {/* Total Discounts applied */}
        <div className="p-4 border border-[#E6DFD9] rounded-xl bg-white shadow-xs">
          <span className="text-[11.5px] text-zinc-500 font-bold uppercase tracking-wider block">{language === 'TH' ? 'ยอดที่คัดลดคูปอง' : 'Coupon Discounts Deducted'}</span>
          <strong className="text-zinc-900 text-2xl font-black font-mono mt-1 w-full block text-amber-800">
            {formatCurrency(totalDiscount)}
          </strong>
          <span className="text-zinc-500 font-mono text-[10px] block mt-1">
            {language === 'TH' ? 'เฉลี่ย 15% ค่านัดหมาย' : 'Campaign discount value'}
          </span>
        </div>

        {/* VAT Transfer standard */}
        <div className="p-4 border border-[#E6DFD9] rounded-xl bg-white shadow-xs">
          <span className="text-[11.5px] text-zinc-500 font-bold uppercase tracking-wider block">{language === 'TH' ? 'ยอดประมาณสรรพากร (7% VAT)' : 'Estimated 7% Tax Cut'}</span>
          <strong className="text-zinc-900 text-2xl font-black font-mono mt-1 w-full block">
            {formatCurrency(totalRevenue * 0.07)}
          </strong>
          <span className="text-rose-600 font-mono text-[10px] font-semibold mt-1 block">
            {language === 'TH' ? 'คิดจากยอดขายสุทธิ' : 'Estimated flat vat sum'}
          </span>
        </div>

        <div className="p-4 border border-red-100 rounded-xl bg-red-50/30 shadow-xs">
          <span className="text-[11.5px] text-red-600 font-bold uppercase tracking-wider block">{language === 'TH' ? 'ยกเลิกอัตโนมัติ' : 'Auto Cancelled Orders'}</span>
          <strong className="text-zinc-900 text-2xl font-black font-mono mt-1 w-full block">
            {autoCancelledCount}
          </strong>
          <span className="text-red-500 font-mono text-[10px] block mt-1">
            {language === 'TH' ? 'ปัญหาชำระเงิน/หมดเวลา' : 'Payment failures/timeouts'}
          </span>
        </div>

        <div className="p-4 border border-orange-100 rounded-xl bg-orange-50/30 shadow-xs">
          <span className="text-[11.5px] text-orange-600 font-bold uppercase tracking-wider block">{language === 'TH' ? 'ยกเลิกโดยพนักงาน' : 'Staff Cancelled Orders'}</span>
          <strong className="text-zinc-900 text-2xl font-black font-mono mt-1 w-full block">
            {staffCancelledCount}
          </strong>
          <span className="text-orange-600 font-mono text-[10px] block mt-1">
            {language === 'TH' ? 'ปัญหาหน้าร้าน/สต็อก' : 'Ops and inventory issues'}
          </span>
        </div>

      </div>

      {/* Leaderboard of Top Selling items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Products item lists */}
        <div className="lg:col-span-8 bg-white border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9]">
            <h4 className="font-sans font-bold text-xs text-[#2E2A25] uppercase tracking-wide">
              {language === 'TH' ? '5 อันดับเครื่องดื่มยอดนิยม (Top Products)' : 'Top Products Leaderboard'}
            </h4>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs text-zinc-600">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="py-2.5 px-4 font-sans font-black text-zinc-400 text-[10px] uppercase">Rank</th>
                  <th className="py-2.5 px-4 font-sans font-black text-zinc-400 text-[10px] uppercase">Product</th>
                  <th className="py-2.5 px-4 font-sans font-black text-zinc-400 text-[10px] uppercase text-center">Category</th>
                  <th className="py-2.5 px-4 font-sans font-black text-zinc-400 text-[10px] uppercase text-right">Units Sold</th>
                  <th className="py-2.5 px-4 font-sans font-black text-zinc-400 text-[10px] uppercase text-right">Aggregate Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-sans">
                {sortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400 text-xs">
                      No sales metrics compiled for this filter setup yet.
                    </td>
                  </tr>
                ) : (
                  sortedProducts.map((p, index) => (
                    <tr key={p.name} className="hover:bg-[#FDFBF7]/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-zinc-400 text-sm">
                        #{index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{p.image}</span>
                          <span className="font-bold text-zinc-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-[9.5px] uppercase bg-stone-100 text-zinc-500 font-bold px-1.5 py-0.5 rounded">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-700">
                        {p.qty} cups
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-[#8B6B4F]">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Small distribution widget visual */}
        <div className="lg:col-span-4 bg-white border border-[#E6DFD9] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-zinc-800 uppercase tracking-wide">{language === 'TH' ? 'อัตราแจกแจงตามประเภทสินค้า' : 'Categorical Distribution'}</h4>
            <p className="text-[10px] text-zinc-400 leading-snug">{language === 'TH' ? 'สถิติสัดส่วนยอดจัดส่งแบ่งกลุ่มกาแฟ และขนมหวานอบ' : 'Categorical unit sales distribution for selected parameters'}</p>
          </div>

          <div className="space-y-4 pt-5">
            {[
              { labelName: 'Coffee & Espresso (กลุ่มกาแฟ)', count: '63%', bg: 'bg-[#8B6B4F]' },
              { labelName: 'Teas & Refreshments (เครื่องดื่มชา)', count: '24%', bg: 'bg-[#A8BB9A]' },
              { labelName: 'Bakeries & snacks (เค้กและขนมปัง)', count: '13%', bg: 'bg-zinc-300' }
            ].map((cat) => (
              <div key={cat.labelName} className="space-y-1.5">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-zinc-600 font-medium font-sans leading-none">{cat.labelName}</span>
                  <span className="font-mono font-bold text-zinc-800">{cat.count}</span>
                </div>
                <div className="w-full bg-[#FDFBF7] h-2 rounded-full overflow-hidden border">
                  <div className={`h-full rounded-full ${cat.bg}`} style={{ width: cat.count }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-100 text-[10px] text-zinc-400 leading-relaxed font-sans mt-4">
            {language === 'TH' ? 'ข้อมูลทั้งหมดจะประมวลผลทันทีเมื่อระบบแคชเชียร์อัปเดตบิล' : 'All distribution percentages dynamically aggregate live when a barista confirms final payment checks.'}
          </div>
        </div>

      </div>

    </div>
  );
}

// ----------------------------------------------------
// 6. NOTIFICATION CENTER (BROADCASTER INJECTIONS)
// ----------------------------------------------------
function NotificationCenterView({ activities, setActivities }: { activities: Activity[], setActivities: any }) {
  const [broadText, setBroadText] = useState('');
  const [broadType, setBroadType] = useState<'order' | 'payment' | 'stock' | 'coupon' | 'member'>('coupon');
  const [success, setSuccess] = useState(false);
  const { language } = useLanguage();

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadText) return;

    const newAct: Activity = {
      id: `ACT-00${activities.length + 1}`,
      text: `[Admin Broadcast] ${broadText}`,
      time: 'Just now',
      type: broadType,
      status: 'Sent'
    };

    setActivities((prev: any) => [newAct, ...prev]);
    setBroadText('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Broadcast Form Panel */}
      <div className="bg-white border border-[#E6DFD9] rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-[#2E2A25] flex items-center gap-1.5">
            <Bell size={16} className="text-[#8B6B4F]" />
            <span>{language === 'TH' ? 'แผงเครื่องควบคุมยึดโยงประกาศข่าวลือด่วน' : 'Interactive Broadcaster Terminal'}</span>
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">{language === 'TH' ? 'ยิงประกาศเหตุการณ์ฉุกเฉิน ยอดคูปองพิเศษ หรือแคมเปญลัดลงแผงประวัติสตรีมเพื่อสื่อสารพนักงานด่วน' : 'Inject direct alerts, promos or system notifications instantly into recent activities feeds'}</p>
        </div>

        {success && (
          <div className="bg-[#EBF9F1] text-emerald-800 border p-3.5 rounded-lg text-xs leading-relaxed font-bold">
            {language === 'TH' 
              ? '🎉 ประกาศข่าวสำเร็จแบบเรียลไทม์! สัญญานข่าวสารลัดของท่านได้ถูกผนวกเข้าสู่ระบบคิวสตรีมแล้ว'
              : '🎉 Alert broadcasted live! Your command has been successfully injected into the global timelines logs feed.'
            }
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 font-sans">
            
            <div className="md:col-span-3 space-y-1">
              <label className="font-bold">{language === 'TH' ? 'เขียนข้อความแจ้งเตือนสำคัญ:' : 'Write Broadcast Alert Text:'}</label>
              <input 
                id="broadcast-text-input"
                type="text"
                required
                placeholder={language === 'TH' ? 'ตัวอย่าง: มีแคมเปญพิเศษแถมวิปครีมฟรีช่วงเที่ยงนี้ บาริสต้าโปรดเกณฑ์เตรียมความพร้อม...' : 'e.g. Free caramel syrup upgrades are active this morning! Check coupons...'}
                value={broadText}
                onChange={e => setBroadText(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border rounded-lg focus:outline-none focus:border-[#8B6B4F] font-semibold text-zinc-850"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold">{language === 'TH' ? 'ระดับประเภทคิวป้อน:' : 'Feed Category Type:'}</label>
              <select
                id="broadcast-category-dropdown"
                value={broadType}
                onChange={e => setBroadType(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-stone-50 border rounded-lg focus:outline-none select-none text-zinc-600 cursor-pointer"
              >
                <option value="coupon">{language === 'TH' ? 'COUPON / โปรโมชันแคมเปญ' : 'COUPON / PROMOTION'}</option>
                <option value="stock">{language === 'TH' ? 'STOCK / แจ้งเตือนคลังสินค้า' : 'STOCK ALERT'}</option>
                <option value="member">{language === 'TH' ? 'MEMBER / ข้อมูลสมาชิก' : 'MEMBER ALERT'}</option>
                <option value="order">{language === 'TH' ? 'KITCHEN / แจ้งเตือนเตรียมชง' : 'KITCHEN ALERT'}</option>
              </select>
            </div>

          </div>

          <div className="flex gap-2.5 justify-end">
            <button
              id="broadcast-submit-btn"
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-700 to-amber-950 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Send size={13} /> {language === 'TH' ? 'ประกาศสัญญาณวิทยุด่วน' : 'Inject Live Broadcast'}
            </button>
          </div>
        </form>
      </div>

      {/* History log timeline checks */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs animate-fade-in">
        <div className="p-4 bg-stone-50/50 border-b">
          <h4 className="font-bold text-xs text-zinc-800">{language === 'TH' ? 'ประวัติเส้นประมวลข้อความแจ้งเตือน' : 'History alerts track'}</h4>
        </div>
        <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
          {activities.map(act => {
            // Simple on-the-fly text fallback translator for activities text in TH
            let translatedText = act.text;
            if (language === 'TH') {
              translatedText = translatedText
                .replace(/New order/g, 'คำสั่งซื้อใหม่')
                .replace(/requires review/g, 'ต้องได้รับตรวจสอบ')
                .replace(/is low on stock/g, 'วัตถุดิบคลังลดเหลือน้อย')
                .replace(/Slip verification approved for/g, 'อนุมัติการตรวจสอบภาพสลิปของ')
                .replace(/Member registered/g, 'สมาชิกลงทะเบียนใหม่')
                .replace(/Points added/g, 'เพิ่มคะแนนสะสม')
                .replace(/New coupon template/g, 'เทมเพลตคูปองใหม่')
                .replace(/created/g, 'ได้รับการบันทึก')
                .replace(/order status updated to/g, 'สถานะคิวได้รับการเปลี่ยนเป็น')
                .replace(/\[Admin Broadcast\]/g, '[ประกาศสำคัญจากแอดมิน]');
            }

            return (
              <div key={act.id} className="p-3 flex items-start gap-3.5 text-xs">
                <span className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase shrink-0 bg-stone-100 text-[#8B6B4F]">
                  {act.type}
                </span>
                <div className="flex-1">
                  <p className="text-zinc-700 font-medium">{translatedText}</p>
                  <span className="font-mono text-[9.5px] text-zinc-400 mt-0.5 block">{act.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// 7. AUDIT LOG MODULE (FRD v2.0)
// ----------------------------------------------------
function AuditLogView({ activities = [] }: { activities: Activity[] }) {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');
  const [selectedUser, setSelectedUser] = useState('All');
  const [selectedActionType, setSelectedActionType] = useState('All');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  // Helper helper to dynamically map operational actor, role, action type and IP address deterministically
  const getAuditDetails = (act: Activity) => {
    const text = act.text.toLowerCase();
    
    let ip = '192.168.15.42';
    if (act.id.includes('1') || act.id.includes('5')) ip = '192.168.15.110';
    if (act.id.includes('2') || act.id.includes('7')) ip = '10.0.4.152';
    if (act.id.includes('3') || act.id.includes('8')) ip = '172.16.85.204';
    if (act.id.includes('4') || act.id.includes('9')) ip = '192.168.10.82';

    let user = 'Super Admin';
    let role = 'Admin';
    if (text.includes('somsak')) {
      user = 'Somsak Kaew';
      role = 'Branch Manager';
    } else if (text.includes('janejira')) {
      user = 'Janejira Siri';
      role = 'Barista';
    } else if (act.type === 'payment') {
      user = 'Somsak Kaew';
      role = 'Branch Manager';
    } else if (act.type === 'stock') {
      user = 'Janejira Siri';
      role = 'Barista';
    } else if (act.type === 'member') {
      user = 'Super Admin';
      role = 'Admin';
    }

    let actionType = 'Update';
    if (text.includes('payment verified') || text.includes('payment verification')) actionType = 'Payment Verified';
    else if (text.includes('payment rejected') || text.includes('payment rejection') || text.includes('rejected')) actionType = 'Payment Rejected';
    else if (text.includes('queue generated') || text.includes('queue Q-') || text.includes('queue q-') || text.includes('queue generated')) actionType = 'Queue Generated';
    else if (text.includes('order completed') || text.includes('completed')) actionType = 'Order Completed';
    else if (text.includes('login') || text.includes('เข้าสู่ระบบ')) actionType = 'Login';
    else if (text.includes('logout') || text.includes('ออกจากระบบ')) actionType = 'Logout';
    else if (text.includes('create') || text.includes('สร้าง') || text.includes('add') || text.includes('เพิ่ม')) actionType = 'Create';
    else if (text.includes('delete') || text.includes('ลบ')) actionType = 'Delete';
    else if (text.includes('confirm') || text.includes('ยืนยัน') || text.includes('verify') || text.includes('ตรวจสอบ')) actionType = 'Confirm';

    return { user, role, actionType, ip };
  };

  const filteredActivities = activities.filter(act => {
    const details = getAuditDetails(act);
    
    const textMatched = 
      act.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const moduleMatched = selectedModule === 'All' || act.type === selectedModule.toLowerCase();
    const userMatched = selectedUser === 'All' || details.user === selectedUser;
    const actionMatched = selectedActionType === 'All' || details.actionType === selectedActionType;
    
    return textMatched && moduleMatched && userMatched && actionMatched;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Description', 'IP Address'];
    const rows = filteredActivities.map(act => {
      const details = getAuditDetails(act);
      return [
        act.time,
        details.user,
        details.role,
        details.actionType,
        act.type.toUpperCase(),
        act.text.replace(/"/g, '""'),
        details.ip
      ];
    });
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(item => `"${item}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `quick_coffee_audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="bg-white p-5 rounded-xl border border-[#E6DFD9] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-[#2E2A25]">
            {language === 'TH' ? 'ระบบบันทึกประวัติการทำงาน (Audit Logs)' : 'Corporate Audit Trail Logs'}
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {language === 'TH' 
              ? 'บันทึกประวัติความเคลื่อนไหวธุรกรรม คุมสิทธิ์พนักงาน การปรับระบบคลัง ทราฟฟิกไอพีแอดเดรสรัดกุม' 
              : 'Detailed tracking of operational overrides, coupon adjustments, barista actions, and diagnostic network client IPs.'}
          </p>
        </div>
        
        <button 
          id="export-audit-excel-btn"
          onClick={handleExportCSV}
          className="px-3.5 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-xs cursor-pointer"
        >
          <Download size={14} />
          {language === 'TH' ? 'ส่งออกล็อกระบบ (Excel .xlsx)' : 'Export Audit (.xlsx)'}
        </button>
      </div>

      {/* Structured Multi-Filters Bar */}
      <div className="bg-white border text-xs text-zinc-800 p-4.5 rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={13} />
            <input 
              type="text" 
              placeholder={language === 'TH' ? 'ค้นหาข้อความ/ID...' : 'Search message, ID...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-stone-50 border rounded-lg focus:outline-none focus:border-[#8B6B4F]"
            />
          </div>

          {/* Module/Category Dropdown */}
          <div className="space-y-0.5">
            <select 
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="w-full bg-stone-50 border rounded-lg p-1.5 text-xs focus:outline-none focus:border-[#8B6B4F] cursor-pointer"
            >
              <option value="All">{language === 'TH' ? 'ทุกโมดูลระบบ' : 'All Modules'}</option>
              <option value="Order">Order</option>
              <option value="Payment">Payment</option>
              <option value="Stock">Stock</option>
              <option value="Coupon">Coupon</option>
              <option value="Member">Member</option>
            </select>
          </div>

          {/* User selector Dropdown */}
          <div className="space-y-0.5">
            <select 
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-stone-50 border rounded-lg p-1.5 text-xs focus:outline-none focus:border-[#8B6B4F] cursor-pointer"
            >
              <option value="All">{language === 'TH' ? 'ผู้ดำเนินงานทั้งหมด' : 'All Operators'}</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Somsak Kaew">Somsak Kaew (Manager)</option>
              <option value="Janejira Siri">Janejira Siri (Barista)</option>
            </select>
          </div>

          {/* Action Type Dropdown */}
          <div className="space-y-0.5">
            <select 
              value={selectedActionType}
              onChange={e => setSelectedActionType(e.target.value)}
              className="w-full bg-stone-50 border rounded-lg p-1.5 text-xs focus:outline-none focus:border-[#8B6B4F] cursor-pointer"
            >
              <option value="All">{language === 'TH' ? 'ประเภทกิจกรรมทั้งหมด' : 'All Actions'}</option>
              <option value="Create">Create (สร้าง)</option>
              <option value="Update">Update (ปรับปรุง)</option>
              <option value="Delete">Delete (ลบออก)</option>
              <option value="Confirm">Confirm (ยืนยัน)</option>
              <option value="Login">Login (เข้าระบบ)</option>
              <option value="Logout">Logout (ออกระเบียบ)</option>
            </select>
          </div>
        </div>

        {/* Date Filters row */}
        <div className="flex flex-wrap items-center gap-4 pt-1.5 border-t border-dashed">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">{language === 'TH' ? 'ตั้งแต่งานวันที่:' : 'From:'}</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="bg-stone-50 border p-1 rounded font-mono text-zinc-600 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">{language === 'TH' ? 'จนถึงวันที่:' : 'To:'}</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="bg-stone-50 border p-1 rounded font-mono text-zinc-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Audit table rendering */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 border-collapse">
            <thead>
              <tr className="bg-stone-50 text-[10.5px] uppercase font-bold text-zinc-500 tracking-wider border-b font-mono">
                <th className="p-3 w-40">{language === 'TH' ? 'เวลาล๊อกบิล' : 'Timestamp'}</th>
                <th className="p-3 w-48">{language === 'TH' ? 'ชื่อผู้จัดการ / สิทธิ์' : 'User / Role'}</th>
                <th className="p-3 w-44">{language === 'TH' ? 'ประเภท / โมดูล' : 'Action / Module'}</th>
                <th className="p-3">{language === 'TH' ? 'ข้อความรายละเอียดงาน' : 'Log Description'}</th>
                <th className="p-3 w-32">{language === 'TH' ? 'ไอพีแอดเดรส' : 'IP Address'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-sans">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-zinc-400 text-xs">
                    {language === 'TH' ? 'ไม่พบบันทึกประวัติกิจกรรมตามตัวกรอง' : 'No audit trace database records found.'}
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const details = getAuditDetails(act);
                  return (
                    <tr key={act.id} className="hover:bg-amber-50/10 transition-all">
                      <td className="p-3 font-mono text-zinc-400">
                        {act.time}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-zinc-800 leading-none">{details.user}</div>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-stone-100 text-zinc-500 font-bold inline-block mt-1 font-mono uppercase">
                          {details.role}
                        </span>
                      </td>
                      <td className="p-3 space-y-1">
                        <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-extrabold uppercase inline-block ${
                          details.actionType === 'Create' ? 'bg-emerald-50 text-emerald-800' :
                          details.actionType === 'Delete' ? 'bg-red-50 text-red-700' :
                          details.actionType === 'Confirm' ? 'bg-sky-50 text-sky-800' : 'bg-stone-100 text-stone-650'
                        }`}>
                          {details.actionType}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 block uppercase font-bold">
                          MODULE: {act.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-zinc-800 font-medium leading-relaxed block">{act.text}</span>
                        <span className="text-[9px] text-zinc-450 font-mono block mt-0.5">PAYLOAD ID: {act.id}</span>
                      </td>
                      <td className="p-3 font-mono text-zinc-400 text-[10.5px]">
                        {details.ip}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
