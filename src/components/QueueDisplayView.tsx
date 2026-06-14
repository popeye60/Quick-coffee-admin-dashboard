import { useState, useEffect } from 'react';
import { Order, Branch } from '../types';
import { Tv, Copy, ExternalLink, RefreshCw, Volume2, HelpCircle, Check, Grid } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface QueueDisplayViewProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: any) => void;
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
}

export default function QueueDisplayView({
  orders,
  updateOrderStatus,
  selectedBranch,
  setSelectedBranch,
  roleMode,
  staffAssignedBranch
}: QueueDisplayViewProps) {
  const { language } = useLanguage();
  const activeBranch = roleMode === 'Staff' ? (staffAssignedBranch as Branch) : selectedBranch;

  // Let's filter orders that belong to the active branch or match any branch
  const getBranchOrders = () => {
    return orders.filter(o => activeBranch === 'All Branches' || o.branch === activeBranch);
  };

  // Identify queued items
  const branchOrders = getBranchOrders();
  const preparingOrders = branchOrders.filter(o => o.status === 'Preparing');
  const readyOrders = branchOrders.filter(o => o.status === 'Ready For Pickup');
  const completedOrders = branchOrders.filter(o => o.status === 'Completed');

  // Core operators state (for calling/serving)
  const [calledHistory, setCalledHistory] = useState<string[]>([]);
  const [currentCallNumber, setCurrentCallNumber] = useState<string>('Q-001');
  const [nextCallNumber, setNextCallNumber] = useState<string>('Q-002');
  const [lastAction, setLastAction] = useState<string>('Portal initialized');
  const [speechAlert, setSpeechAlert] = useState<string>('');
  
  // Simulated TV monitor fullscreen mode overlay to solve IFrame and window.open limits beautifully!
  const [showTvMonitor, setShowTvMonitor] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Sync state with orders
  useEffect(() => {
    // If there is any Preparing order, we can make its queueNo the "Preparing" candidate
    if (preparingOrders.length > 0) {
      setNextCallNumber(`Q-${preparingOrders[0].queueNo}`);
    }
    // If there is any Ready order, we can make its queueNo the "Currently Serving" candidate
    if (readyOrders.length > 0) {
      setCurrentCallNumber(`Q-${readyOrders[0].queueNo}`);
    }
  }, [orders, activeBranch]);

  // Voice announcement of called queue
  const handleCallQueue = (queueNo: string, textContext: string) => {
    const displayNo = queueNo.startsWith('Q-') ? queueNo : `Q-${queueNo}`;
    const speakText = language === 'TH'
      ? `เชิญคิว ${displayNo} ค่ะ`
      : `Calling queue ${displayNo}`;

    setSpeechAlert(speakText);
    setLastAction(`${textContext}: ${displayNo}`);
    
    // Play subtle audio beep using SpeechSynthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speakText);
      utterance.lang = language === 'TH' ? 'th-TH' : 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }

    // Add to called log history if not already there
    setCalledHistory(prev => {
      const filtered = prev.filter(q => q !== queueNo);
      return [queueNo, ...filtered].slice(0, 10);
    });
  };

  // Call Next Queue
  const handleCallNext = () => {
    // Look for the first Preparing order to put on Ready For Pickup
    if (preparingOrders.length > 0) {
      const nextOrder = preparingOrders[0];
      updateOrderStatus(nextOrder.id, 'Ready For Pickup');
      handleCallQueue(nextOrder.queueNo, 'Called queue to pickup counter');
    } else {
      // Generate a mock next queue if no actual order exists
      const nextMockNo = (Math.floor(Math.random() * 800) + 100).toString();
      handleCallQueue(nextMockNo, 'Simulated operational queue call');
    }
  };

  // Recall current queue
  const handleRecall = () => {
    const queueNoOnly = currentCallNumber.replace('Q-', '');
    handleCallQueue(queueNoOnly, 'Recalled current queue');
  };

  // Mock Reset sequence action
  const handleResetQueueSequence = () => {
    setLastAction('Sequential queue counters reset at midnight simulated');
    setCurrentCallNumber('Q-001');
    setNextCallNumber('Q-002');
    setCalledHistory([]);
  };

  // Build simulated URL for TV screen display
  const tvDisplayUrl = `https://quick-coffee.run/queue/${activeBranch.replace(/\s+/g, '-').toLowerCase()}`;

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(tvDisplayUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-4.5 rounded-xl border border-[#E6DFD9] shadow-xs">
        <div>
          <h3 className="font-sans font-bold text-sm text-[#2E2A25]">
            {language === 'TH' ? 'เครื่องมือจัดคิวและเรียกคิวพนักงาน (Queue display)' : 'Queue Display & Voice Broadcaster'}
          </h3>
          <p className="font-sans text-[11px] text-zinc-500">
            {language === 'TH' ? 'เรียกเครื่องดื่มตามหมายเลขคิวจัดระบบอัตโนมัติ ส่งสัญญาณเตือน หรือคัดลอกลิงก์จอใหญ่ทีวี' : 'Control ongoing queue numbers, trigger verbal audio broadcasts, and host secondary TV screens'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Active branch display */}
          <div className="px-3 py-1.5 bg-stone-50 border rounded-lg text-xs font-sans text-zinc-600 flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-[#8B6B4F] font-bold">BRANCH:</span>
            <strong className="font-semibold">{activeBranch}</strong>
          </div>

          <button
            id="open-tv-monitor-btn"
            onClick={() => setShowTvMonitor(true)}
            className="px-3.5 py-1.5 bg-[#8B6B4F] text-white hover:bg-[#70533C] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Tv size={14} />
            <span>{language === 'TH' ? 'เปิดจอแสดงผลหน้าร้าน (TV)' : 'Open TV Screen'}</span>
          </button>
        </div>
      </div>

      {/* Main Operations Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* operator panel (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main big numbers screen */}
          <div className="bg-[#FFFFFF] border border-[#E6DFD9] rounded-2xl shadow-xs p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#A8BB9A]/15 text-[#6B8E23] px-3.5 py-1 font-mono text-[9px] font-bold tracking-widest uppercase rounded-bl-xl border-l border-b border-[#E6DFD9]/30">
              {language === 'TH' ? 'ระบบเสียงสังเคราะห์ใช้งานอยู่' : 'Voice synthesis active'}
            </div>

            {/* Currently serving */}
            <div className="flex flex-col items-center justify-center p-6 bg-stone-50/50 rounded-xl border border-zinc-100/40 text-center space-y-3">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">{language === 'TH' ? 'คิวปัจจุบันที่เรียกเรียกแล้ว' : 'Currently Serving'}</span>
              <p className="font-mono text-5xl font-black text-[#8B6B4F] select-all animate-pulse">
                {currentCallNumber}
              </p>
              <div className="flex gap-2">
                <button
                  id="operator-recall-btn"
                  onClick={handleRecall}
                  disabled={roleMode === 'Admin'}
                  title={roleMode === 'Admin' ? (language === 'TH' ? 'เฉพาะพนักงานเท่านั้น' : 'Staff only') : 'Recall visual flashing alert again'}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border text-zinc-600 font-bold rounded-lg text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw size={12} /> {language === 'TH' ? 'เรียกซ้ำคิวเดิม' : 'Recall Queue'}
                </button>
              </div>
            </div>

            {/* Next queue waiting */}
            <div className="flex flex-col items-center justify-center p-6 bg-[#FDFBF7] rounded-xl border border-amber-100 border-dashed text-center space-y-3">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">{language === 'TH' ? 'คิวเตรียมถัดไปในคิว' : 'Next Queue Expected'}</span>
              <p className="font-mono text-5xl font-black text-zinc-800">
                {nextCallNumber}
              </p>
              <button
                id="operator-call-next-btn"
                onClick={handleCallNext}
                disabled={roleMode === 'Admin'}
                title={roleMode === 'Admin' ? (language === 'TH' ? 'เฉพาะพนักงานเท่านั้น' : 'Staff only') : undefined}
                className="px-4 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white font-bold rounded-lg text-xs shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Volume2 size={13} /> {language === 'TH' ? 'เรียกคิวถัดไป' : 'Call Next'}
              </button>
            </div>
          </div>

          {/* Quick Orders List inside branch with active action row */}
          <div className="bg-[#FFFFFF] border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9]">
              <h4 className="font-sans font-bold text-xs text-[#2E2A25] uppercase tracking-wide">
                {language === 'TH' ? 'แฟ้มลอจิสติกส์บิลหน้าร้าน' : 'Queue Management Live Deck'}
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6DFD9] bg-stone-50/50">
                    <th className="py-2.5 px-4 font-sans text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'คิวหมายเลข' : 'Queue No.'}</th>
                    <th className="py-2.5 px-4 font-sans text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'ชื่อลูกค้า' : 'Customer Name'}</th>
                    <th className="py-2.5 px-4 font-sans text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'สถานะปัจจุบัน' : 'Current Status'}</th>
                    <th className="py-2.5 px-4 font-sans text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider text-right">{language === 'TH' ? 'การจัดการสิทธิ' : 'Quick Call Trigger'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-sans text-xs text-zinc-700">
                  {branchOrders.filter(o => ['Preparing', 'Ready For Pickup'].includes(o.status)).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-400 font-sans text-xs leading-relaxed">
                        {language === 'TH' ? 'ไม่มีบิลที่ต้องจัดการเรียกหน้าร้านในขณะนี้' : 'No active orders preparing at this counter right now.'}
                      </td>
                    </tr>
                  ) : (
                    branchOrders.filter(o => ['Preparing', 'Ready For Pickup'].includes(o.status)).map((ord) => (
                      <tr key={ord.id} className="hover:bg-amber-50/5 transition-colors">
                        <td className="py-3 px-4 font-mono font-extrabold text-sm text-zinc-800">
                          Q-{ord.queueNo}
                        </td>
                        <td className="py-3 px-4 font-sans font-medium text-zinc-700">
                          {ord.customerName}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ord.status === 'Preparing' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            id={`call-order-queue-btn-${ord.id}`}
                            onClick={() => {
                              if (ord.status === 'Preparing') {
                                updateOrderStatus(ord.id, 'Ready For Pickup');
                              }
                              handleCallQueue(ord.queueNo, 'Called registered order manually');
                            }}
                            disabled={roleMode === 'Admin'}
                            title={roleMode === 'Admin' ? (language === 'TH' ? 'เฉพาะพนักงานเท่านั้น' : 'Staff only') : undefined}
                            className="px-2.5 py-1 text-[10px] font-bold font-sans bg-[#8B6B4F] text-white rounded hover:bg-[#70533C] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            🔔 {language === 'TH' ? 'เรียกคิวนี้' : 'Call Queue'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TV display controller details (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick TV Link Card */}
          <div className="bg-[#FFFFFF] border border-[#E6DFD9] rounded-xl shadow-xs p-5 space-y-4 font-sans text-xs">
            <h4 className="font-sans font-bold text-xs text-[#2E2A25] uppercase tracking-wide flex items-center gap-1">
              <Tv size={15} className="text-[#8B6B4F]" />
              <span>{language === 'TH' ? 'ทีวีคอนโซลสาขา' : 'Live Public Screen URL'}</span>
            </h4>
            
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              {language === 'TH' ? 'พนักงานสามารถโหลดที่หน้าจอทีวีหน้าร้านในการแาย เพื่อให้ลูกค้าเห็นการประมวลผลเตรียมแบบรีลไทม์' : 'Copy this public URL and paste into any browser on a display TV or tablet near your counter.'}
            </p>

            <div className="p-2.5 bg-stone-50 border rounded-lg font-mono text-[10.5px] text-zinc-600 flex items-center justify-between gap-1 select-all break-all leading-snug">
              <span>{tvDisplayUrl}</span>
              <button
                id="copy-tv-url-btn"
                onClick={copyUrlToClipboard}
                className="p-1 hover:bg-stone-200 rounded text-zinc-500 shrink-0 cursor-pointer"
                title="Copy URL"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                id="test-trigger-tv-screen"
                onClick={() => setShowTvMonitor(true)}
                className="flex-1 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white font-bold text-center rounded-lg shadow-xs flex items-center justify-center gap-1 border border-transparent cursor-pointer"
              >
                <Tv size={12} /> {language === 'TH' ? 'เปิดจอแสดงผลที่นี่' : 'Serve Here'}
              </button>
            </div>
          </div>

          {/* Stat metrics */}
          <div className="bg-[#FFFFFF] border border-[#E6DFD9] rounded-xl shadow-xs p-5 space-y-3.5 font-sans text-xs text-zinc-600">
            <h4 className="font-sans font-bold text-xs text-[#2E2A25] uppercase tracking-wide">
              {language === 'TH' ? 'สรุปสถิติคิวประจำวัน' : 'Branch Queue Analytics'}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-zinc-100/40 text-center">
                <span className="block text-[22px] font-black text-zinc-800 font-mono">{completedOrders.length}</span>
                <span className="text-[10px] text-zinc-400 block font-semibold leading-relaxed mt-0.5">{language === 'TH' ? 'เสร็จสิ้นวันนี้' : 'Served Today'}</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-zinc-100/40 text-center">
                <span className="block text-[22px] font-black text-zinc-800 font-mono">{readyOrders.length + preparingOrders.length}</span>
                <span className="text-[10px] text-zinc-400 block font-semibold leading-relaxed mt-0.5">{language === 'TH' ? 'คิวที่ค้างคา' : 'Active Wait'}</span>
              </div>
            </div>

            <div className="pt-2.5 border-t space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">{language === 'TH' ? 'ออเดอร์สาขานี้:' : 'This branch:'}</span>
                <strong className="font-mono font-bold text-zinc-800">{branchOrders.length} orders</strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">{language === 'TH' ? 'ระบบคิว:' : 'Queue system:'}</span>
                <span className="text-[#8B6B4F] font-bold">{language === 'TH' ? 'แยกตามสาขา' : 'Branch-specific'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">{language === 'TH' ? 'รีเซ็ตคิว:' : 'Queue resets:'}</span>
                <span className="text-zinc-500 font-mono">00:00 daily</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                id="reset-queue-seq-btn"
                onClick={handleResetQueueSequence}
                disabled={roleMode === 'Admin'}
                title={roleMode === 'Admin' ? (language === 'TH' ? 'เฉพาะพนักงานเท่านั้น' : 'Staff only') : undefined}
                className="text-[10px] text-red-500 hover:text-red-700 underline font-semibold bg-transparent border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
              >
                🗑️ {language === 'TH' ? 'รีเซ็ตคิวประจำวันทั้งหมด' : 'Simulate Daily Midnight Reset'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Embedded Live 1920x1080 simulated responsive screen screen overlay modal */}
      {showTvMonitor && (
        <div className="fixed inset-0 z-50 bg-[#1D1B18] overflow-hidden flex flex-col font-sans select-none animate-in fade-in duration-200">
          
          {/* TV Screen Top Controller Bar */}
          <div className="bg-[#2B2724] border-b border-[#3E2723]/30 px-6 py-4.5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-[18px]">📺</span>
              <div>
                <h2 className="font-sans font-black text-rose-50 text-sm tracking-wide">QUICK COFFEE — TV QUEUE HUB</h2>
                <p className="font-mono text-[10px] text-zinc-400">TV Monitor resolution: 1920 x 1080 (Scaling fits workspace iframe)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-sans">
              <div className="px-3 py-1 bg-stone-900 border border-zinc-700/40 text-stone-200 text-xs rounded font-bold">
                {activeBranch} Store Counter
              </div>
              <button
                id="close-tv-monitor-overlay-btn"
                onClick={() => setShowTvMonitor(false)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors font-semibold"
              >
                {language === 'TH' ? 'กลับหน้าแผงควบคุม' : 'Close Monitor View'}
              </button>
            </div>
          </div>

          {/* TV Display Canvas Area: Aesthetic Retro Dark Theme */}
          <div className="flex-1 bg-[#151311] flex flex-col lg:flex-row p-8 gap-8 items-stretch justify-between text-zinc-100">
            
            {/* Left side: Ready For Pickup (Active blinking green and big counter) */}
            <div className="flex-1 bg-[#1A1815] border border-[#2E2824] rounded-3xl p-6.5 flex flex-col justify-between items-stretch">
              <div className="flex items-center gap-3.5 pb-4 border-b border-[#2E2824]">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-sans font-extrabold text-[#A8BB9A] tracking-wider text-xl uppercase">
                  {language === 'TH' ? 'เบลเสิร์ฟแล้วพร้อมรับ (Ready to Pickup)' : 'Ready for Pickup'}
                </h3>
              </div>

              {readyOrders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-zinc-500 font-sans space-y-2">
                  <span className="text-4xl text-zinc-700">☕</span>
                  <p className="font-bold text-sm">{language === 'TH' ? 'กำลังรอจัดเตรียมเครื่องดื่มที่ท่านขอ...' : 'No orders ready yet'}</p>
                  <p className="text-[10px] max-w-xs">{language === 'TH' ? 'กรุณาสังเกตแถบตารางวิวัฒนาการเตรียมฝั่งขวา' : 'Please look at the "Preparing" board to view cooking live sequences'}</p>
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4.5 pt-8 overflow-y-auto">
                  {readyOrders.map((ro) => (
                    <div
                      key={ro.id}
                      className="bg-stone-900 border-2 border-emerald-500 text-emerald-400 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 shadow-lg shadow-[#022C22]/10"
                    >
                      <span className="text-[52px] font-mono font-black tracking-tighter leading-none">
                        Q-{ro.queueNo}
                      </span>
                      <span className="font-sans text-[11px] font-bold text-zinc-400 block tracking-wide truncate w-full uppercase">
                        {ro.customerName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right side: Preparing Coffee Board (Wait list) */}
            <div className="w-full lg:w-96 bg-[#1A1815] border border-[#2E2824] rounded-3xl p-6.5 flex flex-col justify-between items-stretch">
              <div className="flex items-center gap-3.5 pb-4 border-b border-[#2E2824]">
                <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-sans font-extrabold text-amber-300 tracking-wider text-xl uppercase">
                  {language === 'TH' ? 'กำลังเตรียมต้มกาแฟ (Preparing Coffee)' : 'Preparing Coffee'}
                </h3>
              </div>

              {preparingOrders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 font-sans space-y-1.5 py-20">
                  <span className="text-3xl text-zinc-800">🧁</span>
                  <p className="font-extrabold text-xs">{language === 'TH' ? 'ไม่มีรายการคิวดำเนินการขณะนี้' : 'No drinks in prep queue'}</p>
                </div>
              ) : (
                <div className="flex-1 pt-6 overflow-y-auto space-y-3">
                  {preparingOrders.map((po) => (
                    <div
                      key={po.id}
                      className="bg-stone-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-xs hover:border-[#2E2824]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-mono font-black text-zinc-300 tracking-widest">Q-{po.queueNo}</span>
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                      </div>
                      <span className="font-sans text-[11px] font-bold text-zinc-500 capitalize leading-relaxed truncate max-w-40">{po.customerName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Public bottom ticket alert bar info footer */}
          <div className="bg-[#23201E] px-8 py-3 text-center border-t border-[#3E2723]/20 flex justify-between items-center text-[11px] text-zinc-500 font-sans">
            <div>📍 Location: {activeBranch} Counter. Welcome back!</div>
            <div>Powered by ☕ QUICK COFFEE Real-time sequence system</div>
          </div>
        </div>
      )}

    </div>
  );
}
