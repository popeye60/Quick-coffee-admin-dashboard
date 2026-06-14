import { useState, Dispatch, SetStateAction, FormEvent } from 'react';
import { Coupon } from '../types';
import { Plus, Ticket, ToggleLeft, ToggleRight, Trash2, X, Percent, Calendar, AlignLeft, Info } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface CouponsViewProps {
  coupons: Coupon[];
  setCoupons: Dispatch<SetStateAction<Coupon[]>>;
}

export default function CouponsView({ coupons, setCoupons }: CouponsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponName, setCouponName] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [limitGlobal, setLimitGlobal] = useState<number>(1000);
  const [limitPerUser, setLimitPerUser] = useState<number>(1);
  const [limitDaily, setLimitDaily] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-06-30');

  const { language, formatCurrency } = useLanguage();

  const handleToggleStatus = (code: string) => {
    setCoupons(prev => prev.map(coupon => {
      if (coupon.code === code) {
        return {
          ...coupon,
          status: coupon.status === 'Active' ? 'Inactive' : 'Active'
        };
      }
      return coupon;
    }));
  };

  const handleCreateCoupon = (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;

    const formattedCode = couponCode.toUpperCase().replace(/\s+/g, '');

    const newCoupon: Coupon = {
      code: formattedCode,
      name: couponName || 'Special Discount Ticket',
      description: couponDescription || 'Promotional coupon code for members',
      discountType,
      discountValue,
      limitGlobal,
      limitPerUser,
      limitDaily,
      usageCount: 0,
      status: 'Active',
      startDate,
      endDate
    };

    setCoupons(prev => [...prev, newCoupon]);
    setShowAddModal(false);

    // Reset fields
    setCouponCode('');
    setCouponName('');
    setCouponDescription('');
    setDiscountType('percentage');
    setDiscountValue(20);
    setLimitGlobal(1000);
    setLimitPerUser(1);
    setLimitDaily(1);
    setStartDate('2026-06-01');
    setEndDate('2026-06-30');
  };

  const handleDeleteCoupon = (code: string) => {
    setCoupons(prev => prev.filter(c => c.code !== code));
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Upper header action block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-4.5 rounded-xl border border-[#E6DFD9] shadow-xs">
        <div>
          <h3 className="font-sans font-bold text-sm text-[#2E2A25]">
            {language === 'TH' ? 'ระบบจัดการคูปองส่วนลดสูงสุด (Coupon Management)' : 'Campaign & Coupons Management'}
          </h3>
          <p className="font-sans text-[11px] text-zinc-500">
            {language === 'TH' ? 'สร้างคูปองใหม่ กำหนดอายุช่วงเวลา, ข้อจำกัดจำนวนการใช้งานต่อครั้ง และอัตราการใช้งานรวม' : 'Design promotional coupons, modify date rules, limit per-customer redemptions, and monitor live metrics'}
          </p>
        </div>

        <button
          id="coupon-create-new-btn"
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg font-sans shadow-xs transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={14} /> {language === 'TH' ? 'พิมพ์มอบคูปองใหม่' : 'Create Special Coupon'}
        </button>
      </div>

      {/* Coupons Table list registry */}
      <div className="bg-[#FFFFFF] border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E6DFD9] bg-stone-50/50">
                <th className="py-3 px-4 font-sans text-[11px] font-black text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'รหัสคูปอง / แคมเปญ' : 'Coupon Code & Campaign'}</th>
                <th className="py-3 px-4 font-sans text-[11px] font-black text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'อัตราสัญชาติส่วนลด' : 'Discount Rate'}</th>
                <th className="py-3 px-4 font-sans text-[11px] font-black text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'กรอบเวลาสิทธิ' : 'Validity Dates'}</th>
                <th className="py-3 px-4 font-sans text-[11px] font-black text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'ข้อจำกัดงานใช้' : 'Limitations'}</th>
                <th className="py-3 px-4 font-sans text-[11px] font-black text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'ปริมาณคิวที่ไถ่' : 'Redemption Status'}</th>
                <th className="py-3 px-4 font-sans text-[11px] font-black text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'เลื่อนใช้งาน' : 'Status'}</th>
                <th className="py-3 px-4 font-sans text-[11px] font-black text-zinc-500 uppercase tracking-wider text-center">{language === 'TH' ? 'การลบ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-sans text-xs text-zinc-700">
              {coupons.map((coupon) => {
                const percent = Math.min(100, Math.round((coupon.usageCount / coupon.limitGlobal) * 100));
                return (
                  <tr key={coupon.code} id={`coupon-row-${coupon.code}`} className="hover:bg-amber-50/5 transition-colors">
                    
                    {/* Code & Name Description */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-[#8B6B4F]/10 text-[#8B6B4F] rounded-lg mt-0.5 pointer-events-none shrink-0">
                          <Ticket size={16} />
                        </div>
                        <div>
                          <span className="font-mono font-black text-zinc-900 text-sm tracking-wide block uppercase leading-none">
                            {coupon.code}
                          </span>
                          <strong className="text-zinc-800 text-[11.5px] font-bold block mt-1.5 leading-tight">
                            {coupon.name || 'Special Promotional Code'}
                          </strong>
                          <p className="text-zinc-400 text-[10.5px] mt-1 leading-normal">
                            {coupon.description || 'Applicable across espresso and pastry item lines.'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Discount Value */}
                    <td className="py-4 px-4 font-mono font-bold text-zinc-800 text-sm">
                      {coupon.discountType === 'percentage' ? (
                        <span className="flex items-center gap-1 text-emerald-800 font-sans font-bold">
                          <Percent size={13} className="text-[#8B6B4F]" /> {coupon.discountValue}% {language === 'TH' ? 'ลดทันที' : 'Off Total'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#8B6B4F] font-sans font-bold">
                          <span>฿</span> {formatCurrency(coupon.discountValue)} {language === 'TH' ? 'หักแบนส่วนสูง' : 'Flat Cut'}
                        </span>
                      )}
                    </td>

                    {/* Validity range dates */}
                    <td className="py-4 px-4 text-[10.5px] space-y-1 text-zinc-600">
                      <div className="flex items-center gap-1 font-sans">
                        <Calendar size={12} className="text-zinc-400" />
                        <span>{coupon.startDate || '2026-06-01'}</span>
                      </div>
                      <div className="text-zinc-400 px-3 font-semibold text-[9.5px]">THRU</div>
                      <div className="flex items-center gap-1 font-sans font-semibold text-[#8B6B4F]">
                        <Calendar size={12} />
                        <span>{coupon.endDate || '2026-06-30'}</span>
                      </div>
                    </td>

                    {/* Limitations */}
                    <td className="py-4 px-4 text-[10.5px] text-zinc-600 space-y-1.5">
                      <div>
                        <span className="text-zinc-400 uppercase font-black text-[9px] block">Global limit:</span>
                        <strong className="font-mono text-zinc-800 text-xs">{coupon.limitGlobal} accounts</strong>
                      </div>
                      <div className="flex border-t pt-1 gap-2 text-[10px] text-zinc-500 font-medium">
                        <span>User max: <strong className="font-mono text-zinc-800">{coupon.limitPerUser}</strong></span>
                        <span>•</span>
                        <span>Daily max: <strong className="font-mono text-zinc-800">{coupon.limitDaily}</strong></span>
                      </div>
                    </td>

                    {/* Usage count meter */}
                    <td className="py-4 px-4 w-40">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10.5px] font-mono">
                          <span className="font-bold text-zinc-800">{coupon.usageCount} utilized</span>
                          <span className="text-zinc-400">{percent}%</span>
                        </div>
                        <div className="w-full bg-[#E6DFD9]/30 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${coupon.status === 'Active' ? 'bg-[#8B6B4F]' : 'bg-zinc-300'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Simple status toggle switch */}
                    <td className="py-4 px-4">
                      <button
                        id={`coupon-toggle-btn-${coupon.code}`}
                        onClick={() => handleToggleStatus(coupon.code)}
                        className="flex items-center gap-1 text-zinc-500 font-semibold cursor-pointer text-[10.5px]"
                      >
                        {coupon.status === 'Active' ? (
                          <>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[9.5px]">{language === 'TH' ? 'ใช้งานอยู่' : 'Active'}</span>
                            <ToggleRight size={22} className="text-[#8B6B4F]" />
                          </>
                        ) : (
                          <>
                            <span className="text-red-600 font-bold bg-rose-50 px-2 py-0.5 rounded text-[9.5px]">{language === 'TH' ? 'พักสลัก' : 'Paused'}</span>
                            <ToggleLeft size={22} className="text-zinc-300" />
                          </>
                        )}
                      </button>
                    </td>

                    {/* Delete Option */}
                    <td className="py-4 px-4 text-center">
                      <button
                        id={`coupon-delete-btn-${coupon.code}`}
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete campaign code: ${coupon.code}?`)) {
                            handleDeleteCoupon(coupon.code);
                          }
                        }}
                        className="p-1.5 border hover:bg-rose-50 hover:border-red-200 text-red-600 hover:text-red-800 rounded-md transition-colors cursor-pointer"
                        title="Delete Campaign Template"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal Form Drawer */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <form 
            onSubmit={handleCreateCoupon}
            className="bg-white border rounded-2xl w-full max-w-lg p-6.5 shadow-2xl space-y-4 font-sans text-xs"
          >
            <div className="flex justify-between items-center text-zinc-800 pb-3 border-b border-zinc-100">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-[#2E2A25]">
                <Ticket size={16} className="text-[#8B6B4F]" />
                <span>{language === 'TH' ? 'ตั้งค่าเทมเพลตคูปองสาธารณะ' : 'Configure Campaign Promo Code'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-zinc-100 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-600">
              
              {/* Promo Code Code & Name */}
              <div className="space-y-3.5 md:col-span-2">
                <div className="space-y-1">
                  <label className="font-extrabold uppercase tracking-wide text-[9.5px] block text-zinc-500">{language === 'TH' ? 'รหัสคูปอง (ตัวพิมพ์ใหญ่อัตโนมัติ):' : 'Promo Code (Auto capitalized):'}</label>
                  <input 
                    id="new-coupon-code-input"
                    type="text"
                    required
                    placeholder="e.g. MONINGBREAD40"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F] uppercase font-mono font-bold text-zinc-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold uppercase tracking-wide text-[9.5px] block text-zinc-500">{language === 'TH' ? 'ชื่อแคมเปญส่วนลด:' : 'Campaign Name:'}</label>
                  <input 
                    id="new-coupon-name-input"
                    type="text"
                    required
                    placeholder="e.g. Bread Lovers Happy Hour Special"
                    value={couponName}
                    onChange={(e) => setCouponName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F] font-semibold text-zinc-850"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold uppercase tracking-wide text-[9.5px] block text-zinc-500">{language === 'TH' ? 'คำอธิบายเงื่อนไข:' : 'Brief Description:'}</label>
                  <textarea 
                    id="new-coupon-description-input"
                    required
                    placeholder="e.g. Valid on hot bakery items and cold matcha green teas from 08:00 to 11:00 daily."
                    value={couponDescription}
                    onChange={(e) => setCouponDescription(e.target.value)}
                    className="w-full text-xs p-2 bg-[#FDFBF7] border border-[#E6DFD9] rounded-lg focus:outline-none focus:border-[#8B6B4F] font-sans text-zinc-700 min-h-14"
                  />
                </div>
              </div>

              {/* Discount selection and value line */}
              <div className="space-y-1">
                <label className="font-extrabold uppercase tracking-wide text-[9.5px] block text-zinc-500">{language === 'TH' ? 'ประเภทอัตราการลด:' : 'Discount Type:'}</label>
                <select
                  id="new-coupon-type-dropdown"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-[#E6DFD9] rounded-lg focus:outline-none text-zinc-600 cursor-pointer"
                >
                  <option value="percentage">{language === 'TH' ? 'เปอร์เซ็นต์ส่วนลด (%)' : 'Percentage (%)'}</option>
                  <option value="fixed">{language === 'TH' ? 'จำนวนเงินบาทคงที่ (฿)' : 'Fixed Baht (฿)'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase tracking-wide text-[9.5px] block text-zinc-500">{language === 'TH' ? 'ปริมาณมูลค่าลด:' : 'Rate Value:'}</label>
                <input 
                  id="new-coupon-value-input"
                  type="number"
                  min="1"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-[#E6DFD9] rounded-lg focus:outline-none font-mono"
                />
              </div>

              {/* Dates limits */}
              <div className="space-y-1">
                <label className="font-extrabold uppercase tracking-wide text-[9.5px] block text-zinc-500">{language === 'TH' ? 'วันที่เริ่มใช้งาน:' : 'Start Date:'}</label>
                <input 
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2 bg-[#FDFBF7] border border-[#E6DFD9] rounded-lg focus:outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase tracking-wide text-[9.5px] block text-zinc-500">{language === 'TH' ? 'วันที่สิ้นสุดใช้งาน:' : 'Expiration Date:'}</label>
                <input 
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-2 bg-[#FDFBF7] border border-[#E6DFD9] rounded-lg focus:outline-none cursor-pointer"
                />
              </div>

              {/* Limits and quotas */}
              <div className="md:col-span-2 border-t pt-3.5 space-y-2">
                <label className="font-extrabold uppercase tracking-wide text-[9.5px] block text-zinc-500">{language === 'TH' ? 'จำกัดความจุโควตาแอปคูปอง:' : 'Limitation Capacities:'}</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold block">{language === 'TH' ? 'ลิมิตรวมรวมท็อป:' : 'Global limit:'}</span>
                    <input 
                      id="new-coupon-global-limit"
                      type="number"
                      required
                      value={limitGlobal}
                      onChange={(e) => setLimitGlobal(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-[#E6DFD9] rounded-lg font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold block">{language === 'TH' ? 'ลิมิตลูกค้า:' : 'Per user limit:'}</span>
                    <input 
                      id="new-coupon-user-limit"
                      type="number"
                      required
                      value={limitPerUser}
                      onChange={(e) => setLimitPerUser(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-[#E6DFD9] rounded-lg font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold block">{language === 'TH' ? 'ลิมิตประจำวัน:' : 'Daily limit:'}</span>
                    <input 
                      id="new-coupon-daily-limit"
                      type="number"
                      required
                      value={limitDaily}
                      onChange={(e) => setLimitDaily(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-[#E6DFD9] rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-zinc-100">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 border hover:bg-stone-50 text-xs font-semibold rounded-lg text-zinc-500 cursor-pointer"
              >
                {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button 
                id="modal-confirm-add-coupon-btn"
                type="submit"
                className="px-4 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                {language === 'TH' ? 'บันทึกสร้างคูปอง' : 'Submit Campaign Code'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
