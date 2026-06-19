/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, Calendar, Bell } from 'lucide-react';
import { Branch, BranchStatus } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface HeaderProps {
  currentTab: string;
  roleMode: 'Admin' | 'Staff';
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  staffAssignedBranch: string;
  branchStatuses: Record<Exclude<Branch, 'All Branches'>, BranchStatus>;
  onOpenMobileSidebar: () => void;
}

export default function Header({
  currentTab,
  roleMode,
  selectedBranch,
  setSelectedBranch,
  staffAssignedBranch,
  branchStatuses,
  onOpenMobileSidebar
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { language, setLanguage, t, formatDate } = useLanguage();

  const notifications = [
    { id: 1, title: language === 'TH' ? 'คำสั่งซื้อใหม่ #ORD-20260525-152 รอการตรวจสอบ' : 'New order #ORD-20260525-152 requires review', time: language === 'TH' ? '2 นาทีที่แล้ว' : '2 mins ago', unread: true },
    { id: 2, title: language === 'TH' ? 'ไซรัปวานิลลากำลังจะหมด (สาขา Siam Square)' : 'Vanilla Syrup is low on stock (Siam Square)', time: language === 'TH' ? '20 นาทีที่แล้ว' : '20 mins ago', unread: true },
    { id: 3, title: language === 'TH' ? 'อนุมัติการตรวจสอบสลิปสำหรับคำสั่งซื้อ #ORD-20260525-151' : 'Slip verification approved for #ORD-20260525-151', time: language === 'TH' ? '1 ชั่วโมงที่แล้ว' : '1 hour ago', unread: false }
  ];

  // Under Staff mode, the selected branch is hardcoded and locked to their assigned branch.
  const activeBranchDisplay = roleMode === 'Staff' ? (staffAssignedBranch as Branch) : selectedBranch;
  const branchNames = Object.keys(branchStatuses) as Exclude<Branch, 'All Branches'>[];
  const branchStatusMeta: Record<BranchStatus, { dot: string; labelTH: string; labelEN: string; tooltip: string; tooltipTH: string }> = {
    Open: {
      dot: 'bg-emerald-500',
      labelTH: 'เปิดให้บริการ',
      labelEN: 'Open',
      tooltip: 'Branch is currently accepting orders.',
      tooltipTH: 'สาขากำลังรับออเดอร์อยู่',
    },
    'Temporarily Closed': {
      dot: 'bg-orange-500',
      labelTH: 'ปิดชั่วคราว',
      labelEN: 'Temporary Closed',
      tooltip: 'Branch is temporarily unavailable.',
      tooltipTH: 'สาขาปิดให้บริการชั่วคราว',
    },
    Closed: {
      dot: 'bg-red-500',
      labelTH: 'ปิดสาขา',
      labelEN: 'Closed',
      tooltip: 'Branch is currently closed.',
      tooltipTH: 'สาขาปิดให้บริการ',
    },
  };
  const selectedBranchStatus = activeBranchDisplay !== 'All Branches' ? branchStatuses[activeBranchDisplay] : null;
  const branchStatusSummary = {
    open: branchNames.filter(branch => branchStatuses[branch] === 'Open').length,
    temporary: branchNames.filter(branch => branchStatuses[branch] === 'Temporarily Closed').length,
    closed: branchNames.filter(branch => branchStatuses[branch] === 'Closed').length,
  };
  const branchStatusTitle = selectedBranchStatus
    ? (language === 'TH' ? branchStatusMeta[selectedBranchStatus].tooltipTH : branchStatusMeta[selectedBranchStatus].tooltip)
    : (language === 'TH'
        ? `สถานะสาขา: ${branchStatusSummary.open} เปิดให้บริการ, ${branchStatusSummary.temporary} ปิดชั่วคราว, ${branchStatusSummary.closed} ปิดสาขา`
        : `Branch status: ${branchStatusSummary.open} Open, ${branchStatusSummary.temporary} Temporary Closed, ${branchStatusSummary.closed} Closed`);

  // Map the current visible view tab tag to its localized counterpart
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'Dashboard': return t('nav.dashboard');
      case 'Orders': return t('nav.orders');
      case 'Payment Verification': return t('nav.payment_verification');
      case 'Stock Management': return t('nav.stock_management');
      case 'Menu & Pricing': return t('nav.menu_pricing');
      case 'Warehouse': return t('nav.warehouse');
      case 'Coupons': return t('nav.promotions') || 'Coupons';
      case 'Branches': return t('nav.branches');
      case 'Members': return t('nav.members');
      case 'Promotions': return t('nav.promotions');
      case 'Reports': return t('nav.reports');
      case 'Staff Management': return t('nav.staff_management');
      case 'Notification Center': return t('nav.notification_center');
      default: return tab;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-coffee-border px-6 py-4 flex flex-col md:flex-row flex-wrap md:items-center md:justify-between gap-4 animate-fade-in">
      {/* Mobile control & Title */}
      <div className="flex items-center gap-3">
        <button 
          id="mobile-sidebar-toggle"
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-xl hover:bg-stone-100 text-coffee lg:hidden focus:outline-none"
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 className="font-sans font-extrabold text-xl md:text-2xl text-coffee tracking-tight capitalize flex items-center gap-2">
            <span>{getTabLabel(currentTab)}</span>
            <span className="text-xs bg-coffee-light text-coffee-accent px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider">
              {roleMode.toUpperCase()} {language === 'TH' ? 'มุมมอง' : 'VIEW'}
            </span>
          </h2>
        </div>
      </div>

      {/* Control Widgets */}
      <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
        {/* Branch operating status */}
        <div
          className="flex items-center gap-2 bg-white border border-coffee-border rounded-xl px-3 py-1.5 shadow-xs"
          title={branchStatusTitle}
        >
          {selectedBranchStatus ? (
            <>
              <span className={`h-2.5 w-2.5 rounded-full ${branchStatusMeta[selectedBranchStatus].dot}`} />
              <span className="font-sans text-xs font-bold text-coffee">
                {language === 'TH' ? branchStatusMeta[selectedBranchStatus].labelTH : branchStatusMeta[selectedBranchStatus].labelEN}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2 text-[11px] font-bold text-coffee">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{branchStatusSummary.open} {language === 'TH' ? 'เปิดให้บริการ' : 'Open'}</span>
              {branchStatusSummary.temporary > 0 && <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" />{branchStatusSummary.temporary} {language === 'TH' ? 'ปิดชั่วคราว' : 'Temporary Closed'}</span>}
              {branchStatusSummary.closed > 0 && <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />{branchStatusSummary.closed} {language === 'TH' ? 'ปิดสาขา' : 'Closed'}</span>}
            </div>
          )}
        </div>
        
        {/* Branch Selector Filter (Locked for staff) */}
        <div className="flex items-center gap-1.5 bg-white border border-coffee-border rounded-xl px-3 py-1.5 shadow-xs">
          <span className="font-mono text-[9px] text-coffee-accent tracking-widest uppercase font-bold">{t('orders.branch')}:</span>
          {roleMode === 'Staff' ? (
            <span className="font-sans text-xs font-bold text-coffee bg-coffee-light px-2 py-0.5 rounded-lg border border-coffee-border/30">
              {staffAssignedBranch}
            </span>
          ) : (
            <select
              id="header-branch-selector-dropdown"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value as Branch)}
              className="font-sans text-xs font-bold text-coffee bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="All Branches">{language === 'TH' ? 'ทุกสาขา' : 'All Branches'}</option>
              <option value="Central Plaza">Central Plaza</option>
              <option value="Siam Square">Siam Square</option>
              <option value="Mega Bangna">Mega Bangna</option>
              <option value="The Mall Korat">The Mall Korat</option>
            </select>
          )}
        </div>

        {/* Calendar Selection Mock */}
        <div className="flex items-center gap-2 bg-white border border-coffee-border rounded-xl px-3 py-1.5 shadow-xs text-coffee">
          <Calendar size={14} className="text-coffee-accent" />
          <span className="font-sans text-xs font-semibold">{formatDate("25 May 2026")}</span>
        </div>

        {/* Language selector TH/EN */}
        <div className="flex bg-stone-100 rounded-xl p-0.5 border border-coffee-border" role="group" aria-label="Language selector">
          <button
            id="lang-btn-th"
            onClick={() => setLanguage('TH')}
            aria-label="เลือกภาษาไทย"
            aria-pressed={language === 'TH'}
            className={`px-2.5 py-1 text-[10px] rounded-lg font-bold font-mono tracking-wider transition-all duration-150 ${
              language === 'TH' ? 'bg-coffee text-white shadow-xs' : 'text-coffee-muted hover:text-coffee'
            }`}
          >
            TH
          </button>
          <button
            id="lang-btn-en"
            onClick={() => setLanguage('EN')}
            aria-label="Switch to English"
            aria-pressed={language === 'EN'}
            className={`px-2.5 py-1 text-[10px] rounded-lg font-bold font-mono tracking-wider transition-all duration-150 ${
              language === 'EN' ? 'bg-coffee text-white shadow-xs' : 'text-coffee-muted hover:text-coffee'
            }`}
          >
            EN
          </button>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            id="notification-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-white border border-coffee-border hover:bg-stone-50 text-coffee transition-colors shadow-xs relative"
            aria-label="Toggle notifications menu"
          >
            <Bell size={15} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-coffee-accent rounded-full ring-2 ring-white animate-bounce" />
          </button>

          {/* Notifications Dropdown Cards */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-coffee-border rounded-2xl shadow-xl z-40 overflow-hidden divide-y divide-stone-100 animate-in fade-in slide-in-from-top-3 duration-100">
              <div className="px-4 py-3 bg-stone-50 flex items-center justify-between">
                <span className="font-sans font-bold text-xs text-coffee">{language === 'TH' ? 'การแจ้งเตือนสัญกรณ์' : 'Notifications'}</span>
                <span className="font-mono text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded">{language === 'TH' ? '2 ใหม่' : '2 New'}</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-3.5 hover:bg-stone-50/50 transition-colors cursor-pointer ${notif.unread ? 'bg-coffee-light/30' : ''}`}>
                    <p className={`font-sans text-xs ${notif.unread ? 'text-coffee font-semibold' : 'text-coffee-muted'}`}>{notif.title}</p>
                    <span className="font-mono text-[9px] text-coffee-muted mt-1 block">{notif.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 bg-stone-50 text-center">
                <button className="font-sans text-[11px] font-bold text-coffee-accent hover:underline">
                  {language === 'TH' ? 'ทำเครื่องหมายว่าอ่านแล้วทั้งหมด' : 'Mark all as read'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
