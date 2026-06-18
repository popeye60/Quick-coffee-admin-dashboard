import React from 'react';
import { 
  LayoutDashboard, 
  Coffee, 
  Package, 
  Store, 
  Tag, 
  Ticket, 
  Users, 
  UserCheck, 
  BarChart2, 
  Bell, 
  Shield,
  Briefcase,
  History,
  Warehouse
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export type SidebarTab = 
  | 'Dashboard' 
  | 'Orders' 
  | 'Payment Verification' 
  | 'Stock Management' 
  | 'Branches' 
  | 'Menu & Pricing'
  | 'Warehouse'
  | 'Branch Pricing'
  | 'Promotions' 
  | 'Coupons' 
  | 'Members' 
  | 'Staff Management' 
  | 'Reports' 
  | 'Audit Log';

interface SidebarProps {
  currentTab: SidebarTab;
  setCurrentTab: (tab: SidebarTab) => void;
  roleMode: 'Admin' | 'Staff';
  setRoleMode: (mode: 'Admin' | 'Staff') => void;
  staffAssignedBranch: string;
  setStaffAssignedBranch: (branch: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  roleMode,
  setRoleMode,
  staffAssignedBranch,
  setStaffAssignedBranch,
  isOpen,
  onClose
}: SidebarProps) {
  const { language } = useLanguage();
  
  const navigationGroups = [
    {
      title: null,
      items: [
        { name: 'Dashboard' as SidebarTab, icon: <LayoutDashboard size={17} />, label: language === 'TH' ? 'หน้าแรก สรุปภาพรวม' : 'Dashboard' }
      ]
    },
    {
      title: language === 'TH' ? 'การดำเนินงานหน้าร้าน' : 'Store Operations',
      items: [
        { name: 'Orders' as SidebarTab, icon: <Coffee size={17} />, label: language === 'TH' ? 'จัดการออเดอร์' : 'Order Management' },
        { name: 'Stock Management' as SidebarTab, icon: <Package size={17} />, label: language === 'TH' ? 'ตรวจนับสต็อกประจำวัน' : 'Daily Stock Check' }
      ]
    },
    {
      title: language === 'TH' ? 'การจัดการธุรกิจ' : 'Business Management',
      items: [
        { name: 'Branches' as SidebarTab, icon: <Store size={17} />, label: language === 'TH' ? 'จัดการสาขา' : 'Branch Management' },
        { name: 'Menu & Pricing' as SidebarTab, icon: <Tag size={17} />, label: language === 'TH' ? 'จัดการเมนูหลัก' : 'Main Menu Management' },
        { name: 'Warehouse' as SidebarTab, icon: <Warehouse size={17} />, label: language === 'TH' ? 'คลังสินค้ากลาง' : 'Central Warehouse Inventory' },
        { name: 'Promotions' as SidebarTab, icon: <Bell size={17} />, label: language === 'TH' ? 'จัดการโปรโมชัน' : 'Promotion Management' },
        { name: 'Coupons' as SidebarTab, icon: <Ticket size={17} />, label: language === 'TH' ? 'จัดการคูปองและแคมเปญ' : 'Coupon & Campaign Management' }
      ]
    },
    {
      title: language === 'TH' ? 'จัดการลูกค้า' : 'Customer Management',
      items: [
        { name: 'Members' as SidebarTab, icon: <Users size={17} />, label: language === 'TH' ? 'สมาชิก CRM' : 'CRM Members' }
      ]
    },
    {
      title: language === 'TH' ? 'จัดการแอดมิน' : 'Admin Management',
      items: [
        { name: 'Staff Management' as SidebarTab, icon: <UserCheck size={17} />, label: language === 'TH' ? 'พนักงานและสิทธิ์ใช้งาน' : 'Staff & Permissions' },
        { name: 'Reports' as SidebarTab, icon: <BarChart2 size={17} />, label: language === 'TH' ? 'รายงานยอดขาย' : 'Sales Reports' },
        { name: 'Audit Log' as SidebarTab, icon: <History size={17} />, label: language === 'TH' ? 'บันทึกกิจกรรม' : 'Activity Logs' }
      ]
    },
  ];

  const adminConsoleTitle = language === 'TH' ? 'คอนโซลผู้ดูแลระบบ (Admin)' : 'Corporate Admin Mode';
  const adminDesc = language === 'TH' 
    ? 'สิทธิ์แอดมินสูงสุด จัดการได้ทุกสาขา คูปอง เมนู และพนักงานทั้งหมด' 
    : 'Full enterprise control across all retail coffee branches.';
  
  const staffConsoleTitle = language === 'TH' ? 'สิทธิ์พนักงานประจำชุดสาขา' : 'Barista & Staff Mode';
  const staffDesc = language === 'TH' 
    ? 'ดูแลคิวสาขาที่ตนอยู่ ตรวจสลิปเงิน และควบคุมบ่อสต็อกวัตถุดิบ' 
    : 'Localized dashboard access for the assigned branch only.';

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col w-68 bg-white text-stone-600 border-r border-[#E6DFD9] transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Workspace Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#E6DFD9]">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#8B6B4F] text-white font-bold text-lg shadow-sm">
            ☕
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-[#2E2A25] tracking-wider text-base uppercase">QUICK COFFEE</h1>
            <p className="font-mono text-[9px] text-zinc-400 tracking-widest leading-none mt-1 uppercase">
              {language === 'TH' ? 'มอนิเตอร์แคชเชียร์' : 'Management Portal'}
            </p>
          </div>
        </div>

        {/* Portal Role Selector */}
        <div className="px-4 py-4.5 border-b border-[#E6DFD9] space-y-2.5 bg-stone-50/40">
          
          {/* Admin Role selector */}
          <button 
            id="role-select-admin-btn"
            onClick={() => {
              setRoleMode('Admin');
              setCurrentTab('Dashboard');
            }}
            className={`w-full flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              roleMode === 'Admin'
                ? 'bg-[#FDFBF7] border-[#8B6B4F] text-[#8B6B4F] shadow-xs'
                : 'border-transparent text-zinc-500 hover:bg-stone-100 hover:text-zinc-800'
            }`}
          >
            <div className="flex items-center gap-1.5 font-sans font-bold text-[11.5px] tracking-wide uppercase">
              <Shield size={13} className={roleMode === 'Admin' ? 'text-[#8B6B4F]' : 'text-zinc-400'} />
              <span>{adminConsoleTitle}</span>
              {roleMode === 'Admin' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
            </div>
            <span className="font-sans text-[10.5px] font-medium leading-relaxed text-zinc-400 mt-1 block">
              {adminDesc}
            </span>
          </button>

          {/* Staff Role Selector */}
          <button 
            id="role-select-staff-btn"
            onClick={() => {
              setRoleMode('Staff');
              setCurrentTab('Dashboard');
            }}
            className={`w-full flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              roleMode === 'Staff'
                ? 'bg-[#FDFBF7] border-[#8B6B4F] text-[#8B6B4F] shadow-xs'
                : 'border-transparent text-zinc-500 hover:bg-stone-100 hover:text-zinc-800'
            }`}
          >
            <div className="flex items-center gap-1.5 font-sans font-bold text-[11.5px] tracking-wide uppercase">
              <Briefcase size={13} className={roleMode === 'Staff' ? 'text-[#8B6B4F]' : 'text-zinc-400'} />
              <span>{staffConsoleTitle}</span>
              {roleMode === 'Staff' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </div>
            <div className="mt-1 w-full space-y-1.5">
              <span className="font-sans text-[10.5px] font-medium leading-relaxed text-zinc-400 block">
                {staffDesc}
              </span>
              
              {roleMode === 'Staff' && (
                <div onClick={(e) => e.stopPropagation()} className="mt-1">
                  <label className="block text-[8.5px] text-[#8B6B4F] font-mono tracking-wider font-extrabold mb-1">
                    {language === 'TH' ? 'พนักงานเวียนสาขา:' : 'ASSIGNED STORE:'}
                  </label>
                  <select 
                    id="staff-branch-assigned-selector"
                    value={staffAssignedBranch} 
                    onChange={(e) => setStaffAssignedBranch(e.target.value)}
                    className="w-full text-xs py-1 px-1.5 font-sans bg-white border border-[#E6DFD9] text-zinc-700 rounded-lg focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="Central Plaza">Central Plaza</option>
                    <option value="Siam Square">Siam Square</option>
                    <option value="Mega Bangna">Mega Bangna</option>
                    <option value="The Mall Korat">The Mall Korat</option>
                  </select>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Navigation Tabs - Scrollable Grouped Taxonomy */}
        <nav className="flex-1 overflow-y-auto py-3 px-3.5 space-y-4.5 custom-scrollbar bg-stone-50/20 text-xs">
          
          {navigationGroups.map((group, groupIdx) => {
            // Hide adminOnly groups from Staff
            if ((group as any).adminOnly && roleMode === 'Staff') return null;

            // Check if any item in this group is allowed under the current role Mode
            const allowedItemsInGroup = group.items.filter(item => {
              if (roleMode === 'Staff') {
                return [
                  'Dashboard',
                  'Orders',
                  'Stock Management'
                ].includes(item.name);
              }
              return true; // Admin has full access to absolutely everything!
            });

            if (allowedItemsInGroup.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1.5">
                {/* Group Title Header */}
                {group.title && (
                  <span className="block text-[9.5px] font-mono font-black text-zinc-400 tracking-wider uppercase pl-3">
                    {group.title}
                  </span>
                )}

                <div className="space-y-0.5">
                  {allowedItemsInGroup.map((item) => {
                    const isActive = currentTab === item.name;
                    return (
                      <button
                        key={item.name}
                        id={`sidebar-tab-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => {
                          setCurrentTab(item.name);
                          onClose();
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 text-[11.5px] font-sans font-medium transition-all duration-150 text-left rounded-lg cursor-pointer
                          ${isActive 
                            ? 'bg-[#FDF1E6] text-[#8B6B4F] font-bold shadow-2xs' 
                            : 'text-zinc-500 hover:bg-stone-50 hover:text-zinc-800'
                          }
                        `}
                      >
                        <span className={isActive ? 'text-[#8B6B4F]' : 'text-zinc-400 shrink-0'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
        </nav>

        {/* Current Logger Footer Profile */}
        <div className="p-4 border-t border-[#E6DFD9] bg-stone-50 flex items-center gap-3 shrink-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#8B6B4F] flex items-center justify-center font-bold text-white shadow-inner bg-gradient-to-tr from-[#3E2723] to-[#8B4513] border border-[#E6DFD9]">
              U
            </div>
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-[#A8BB9A] border-2 border-white" />
          </div>
          <div className="min-w-0 flex-1 font-sans text-xs">
            <h4 className="font-semibold text-zinc-800 truncate">Siri Semsak</h4>
            <div className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-[8.5px] text-zinc-400 uppercase tracking-widest font-black">
                {roleMode === 'Admin' ? (language === 'TH' ? 'ผู้ดูแลระดับสูง' : 'System Admin') : (language === 'TH' ? 'บาริสต้าสาขา' : 'Store Barista')}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 truncate leading-relaxed">Siri.coffee@quick.run</p>
          </div>
        </div>
      </aside>
    </>
  );
}
