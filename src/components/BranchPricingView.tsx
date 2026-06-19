import { useState, Dispatch, SetStateAction } from 'react';
import { CoffeeItem, Branch, BranchPrice } from '../types';
import { Sliders, Check, HelpCircle, ArrowUpRight, DollarSign, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface BranchPricingViewProps {
  menuItems: CoffeeItem[];
  branchPrices: BranchPrice[];
  setBranchPrices: Dispatch<SetStateAction<BranchPrice[]>>;
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
}

export default function BranchPricingView({
  menuItems,
  branchPrices,
  setBranchPrices,
  selectedBranch,
  setSelectedBranch,
  roleMode,
  staffAssignedBranch
}: BranchPricingViewProps) {
  const { language, formatCurrency } = useLanguage();
  const [activeBranch, setActiveBranch] = useState<Exclude<Branch, 'All Branches'>>('Central Plaza');
  
  // States for adjusting a product's price
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Bulk adjustment states
  const [bulkPricingMode, setBulkPricingMode] = useState<'add' | 'subtract' | 'reset'>('add');
  const [bulkValue, setBulkValue] = useState<number>(10);
  const [showBulkSuccessMsg, setShowBulkSuccessMsg] = useState(false);

  // We only target specific branches
  const branchesList: Exclude<Branch, 'All Branches'>[] = ['Central Plaza', 'Siam Square', 'Mega Bangna', 'The Mall Korat'];

  // Helper to get pricing for an item in current branch
  const getBranchPriceInfo = (productId: string) => {
    const entry = branchPrices.find(bp => bp.branch === activeBranch && bp.productId === productId);
    const catalogItem = menuItems.find(item => item.id === productId);

    if (entry) {
      return {
        sellingPrice: entry.sellingPrice,
        isAvailable: entry.isAvailable,
        isOverridden: entry.sellingPrice !== (catalogItem?.price || 0) || entry.isAvailable !== (catalogItem?.status === 'Available')
      };
    }

    return {
      sellingPrice: catalogItem?.price || 0,
      isAvailable: catalogItem?.status === 'Available',
      isOverridden: false
    };
  };

  // Toggle single item availability for the branch
  const handleToggleBranchAvailability = (productId: string) => {
    setBranchPrices(prev => {
      const existingIdx = prev.findIndex(bp => bp.branch === activeBranch && bp.productId === productId);
      const catalogItem = menuItems.find(item => item.id === productId);
      const defaultPrice = catalogItem?.price || 0;

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          isAvailable: !updated[existingIdx].isAvailable
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            branch: activeBranch,
            productId,
            sellingPrice: defaultPrice,
            isAvailable: !(catalogItem?.status === 'Available')
          }
        ];
      }
    });
  };

  // Save customized item price for branch
  const handleSaveBranchPrice = (productId: string) => {
    const priceNum = parseFloat(tempPrice);
    if (isNaN(priceNum) || priceNum < 0) return;

    setBranchPrices(prev => {
      const existingIdx = prev.findIndex(bp => bp.branch === activeBranch && bp.productId === productId);
      const catalogItem = menuItems.find(item => item.id === productId);
      const defaultAvailability = catalogItem?.status === 'Available';

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          sellingPrice: priceNum
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            branch: activeBranch,
            productId,
            sellingPrice: priceNum,
            isAvailable: defaultAvailability
          }
        ];
      }
    });

    setEditingProductId(null);
    setTempPrice('');
  };

  // Execute bulk operations
  const handleBulkAssignment = () => {
    setBranchPrices(prev => {
      const updated = [...prev];
      menuItems.forEach(item => {
        const idx = updated.findIndex(bp => bp.branch === activeBranch && bp.productId === item.id);
        const currentInfo = getBranchPriceInfo(item.id);
        
        let newPrice = currentInfo.sellingPrice;
        if (bulkPricingMode === 'add') {
          newPrice += bulkValue;
        } else if (bulkPricingMode === 'subtract') {
          newPrice = Math.max(0, newPrice - bulkValue);
        } else if (bulkPricingMode === 'reset') {
          newPrice = item.price;
        }

        if (idx > -1) {
          updated[idx] = {
            ...updated[idx],
            sellingPrice: newPrice
          };
        } else {
          updated.push({
            branch: activeBranch,
            productId: item.id,
            sellingPrice: newPrice,
            isAvailable: item.status === 'Available'
          });
        }
      });
      return updated;
    });

    setShowBulkSuccessMsg(true);
    setTimeout(() => setShowBulkSuccessMsg(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Title Header bar */}
      <div className="flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-4 bg-[#FFFFFF] p-4.5 rounded-xl border border-[#dddddd] shadow-xs">
        <div>
          <h3 className="font-sans font-bold text-sm text-[#181d26]">
            {language === 'TH' ? 'ระบบตั้งราคาสินค้ารายสาขา' : 'Branch Pricing & Status Management'}
          </h3>
          <p className="font-sans text-[11px] text-zinc-500">
            {language === 'TH' ? 'ตั้งราคารายการเมนูที่สูงกว่าราคาแนะนำ สั่งวิทยุเปิด/ปิดจำหน่ายชั่วคราวแต่ละสาขาแบบองค์กร' : 'Set custom pricing, specify branch-specific catalog availability, and apply batch rules'}
          </p>
        </div>

        {/* Branch filter buttons selection */}
        <div className="flex items-center gap-1.5 overflow-x-auto self-start bg-stone-100/40 p-1 rounded-lg border">
          {branchesList.map((br) => (
            <button
              key={br}
              onClick={() => {
                setActiveBranch(br);
                setEditingProductId(null);
              }}
              className={`px-3 py-1 text-xs font-sans font-bold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeBranch === br 
                  ? 'bg-[#181d26] text-white shadow-xs' 
                  : 'text-zinc-600 hover:bg-stone-50'
              }`}
            >
              {br}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Products Pricing Sheet list within current branch */}
        <div className="lg:col-span-8 bg-white border border-[#dddddd] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 bg-[#f8fafc] border-b border-[#dddddd] flex justify-between items-center">
            <h4 className="font-sans font-bold text-xs text-[#181d26] uppercase tracking-wide">
              {language === 'TH' ? 'รายการขอบเขตขายหลัก' : 'Pricing Matrix'} - <span className="text-[#181d26]">{activeBranch}</span>
            </h4>
            <span className="font-mono text-[10px] text-zinc-400 font-bold">{menuItems.length} Products</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#dddddd] bg-stone-50/50">
                  <th className="py-2.5 px-4 font-sans text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider">{language === 'TH' ? 'สินค้า' : 'Product'}</th>
                  <th className="py-2.5 px-4 font-sans text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider text-right">{language === 'TH' ? 'ราคากลาง' : 'Default Price'}</th>
                  <th className="py-2.5 px-4 font-sans text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider text-center">{language === 'TH' ? 'ราคาขายที่สาขา' : 'Selling Price'}</th>
                  <th className="py-2.5 px-4 font-sans text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider text-center">{language === 'TH' ? 'สถานะขายสาขา' : 'Branch Status'}</th>
                  <th className="py-2.5 px-4 font-sans text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider text-center">{language === 'TH' ? 'สถานะการปรับ' : 'Custom Tag'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-sans text-xs text-zinc-600">
                {menuItems.map((item) => {
                  const pricing = getBranchPriceInfo(item.id);
                  const isEditing = editingProductId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/40 transition-colors">
                      {/* Name with icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.image}</span>
                          <div>
                            <p className="font-bold text-zinc-800 leading-snug">{item.name}</p>
                            <p className="font-mono text-[9px] text-zinc-400 uppercase">{item.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* Master catalog baseline price */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-400">
                        {formatCurrency(item.price)}
                      </td>

                      {/* Selling price for this branch */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-16 text-center border p-1 rounded font-mono font-bold text-zinc-800 text-xs focus:outline-none focus:border-[#181d26]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveBranchPrice(item.id);
                                if (e.key === 'Escape') setEditingProductId(null);
                              }}
                              autoFocus
                            />
                            <button
                              id={`save-item-price-btn-${item.id}`}
                              onClick={() => handleSaveBranchPrice(item.id)}
                              className="p-1 bg-[#181d26] text-white rounded hover:bg-[#0d1218]"
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono font-black text-sm ${pricing.isOverridden ? 'text-[#181d26]' : 'text-zinc-700'}`}>
                              {formatCurrency(pricing.sellingPrice)}
                            </span>
                            <button
                              id={`edit-item-price-btn-${item.id}`}
                              onClick={() => {
                                setEditingProductId(item.id);
                                setTempPrice(pricing.sellingPrice.toString());
                              }}
                              className="text-zinc-400 hover:text-[#181d26] p-0.5"
                              title="Modify branch selling price"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Availability status in this branch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          id={`toggle-item-branch-status-btn-${item.id}`}
                          onClick={() => handleToggleBranchAvailability(item.id)}
                          className="inline-flex items-center justify-center gap-1 text-zinc-500 cursor-pointer"
                        >
                          {pricing.isAvailable ? (
                            <>
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 font-bold px-1.5 py-0.2 rounded">{language === 'TH' ? 'เปิดบริการสาขา' : 'Selling'}</span>
                              <ToggleRight size={20} className="text-[#a8d8c4]" />
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] text-red-500 bg-red-50 font-bold px-1.5 py-0.2 rounded">{language === 'TH' ? 'ปิดจำหน่ายสาขา' : 'Disabled'}</span>
                              <ToggleLeft size={20} className="text-zinc-300" />
                            </>
                          )}
                        </button>
                      </td>

                      {/* Override status visual tag */}
                      <td className="py-3 px-4 text-center">
                        {pricing.isOverridden ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[9px] tracking-wide uppercase border border-amber-200/50">
                            {language === 'TH' ? 'ปรับแต่งค่า' : 'Customized'}
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] text-[#a8d8c4] font-medium tracking-wide uppercase">
                            {language === 'TH' ? 'ค่ามาตรฐาน' : 'Default'}
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

        {/* Bulk Pricing Overrides Tool cards (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#dddddd] rounded-xl shadow-xs self-start overflow-hidden">
          <div className="p-4 bg-[#f8fafc] border-b border-[#dddddd]">
            <h4 className="font-sans font-bold text-xs text-[#181d26] flex items-center gap-1.5">
              <Sparkles size={14} className="text-pink-500" />
              <span>{language === 'TH' ? 'เครื่องมือปรับราคาเป้ากลุ่ม' : 'Bulk Action Console'}</span>
            </h4>
            <p className="font-sans text-[11px] text-zinc-500 mt-1">
              {language === 'TH' ? 'ใช้การตั้งค่าหรือปรับขึ้นทีเดียวทั้งกลุ่มเมนูเพื่อความรวดเร็วสำหรับสาขานี้' : 'Apply bulk adjustments to all products inside this branch to scale selling operations'}
            </p>
          </div>

          <div className="p-5 space-y-4 font-sans text-xs">
            {/* Adjustment Type selection */}
            <div className="space-y-1">
              <label className="text-zinc-500 font-bold block">{language === 'TH' ? 'รูปแบบการปรับ:' : 'Adjustment Type:'}</label>
              <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-lg border">
                <button
                  onClick={() => setBulkPricingMode('add')}
                  className={`py-1 text-center font-sans font-bold rounded cursor-pointer ${bulkPricingMode === 'add' ? 'bg-[#181d26] text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  + Increase
                </button>
                <button
                  onClick={() => setBulkPricingMode('subtract')}
                  className={`py-1 text-center font-sans font-bold rounded cursor-pointer ${bulkPricingMode === 'subtract' ? 'bg-[#181d26] text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  - Decrease
                </button>
                <button
                  onClick={() => setBulkPricingMode('reset')}
                  className={`py-1 text-center font-sans font-bold rounded cursor-pointer ${bulkPricingMode === 'reset' ? 'bg-[#181d26] text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  ⚙️ Reset
                </button>
              </div>
            </div>

            {/* Value adjustment input */}
            {bulkPricingMode !== 'reset' && (
              <div className="space-y-1">
                <label className="text-zinc-500 font-bold block">{language === 'TH' ? 'อัตราราคากลางส่วนเบี่ยงเบน (฿):' : 'Cost Value Adjustment (฿):'}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#181d26] font-bold font-mono">฿</span>
                  <input
                    type="number"
                    min="1"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(Number(e.target.value))}
                    className="w-full text-xs p-2 pl-7 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#181d26] font-mono font-bold text-zinc-800 bg-stone-50/50"
                  />
                </div>
              </div>
            )}

            {/* Success message banner */}
            {showBulkSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10.5px] border border-emerald-200/50 font-medium">
                {language === 'TH' ? '✨ ปรับเรียบร้อยทั้งกลุ่มเมนูร่วมของสาขานี้สำเร็จ!' : '✨ Bulk adjustments applied to all items in current branch successfully!'}
              </div>
            )}

            {/* Submit execution button */}
            <button
              id="bulk-update-pricing-btn"
              onClick={handleBulkAssignment}
              className="w-full py-2 bg-[#181d26] hover:bg-[#0d1218] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5 font-semibold"
            >
              {language === 'TH' ? 'ยืนยันอัปเดตราคาแบบกลุ่ม' : 'Apply Branch Variations'}
            </button>

            <div className="pt-2 text-[10px] text-zinc-400 font-sans leading-relaxed border-t border-dashed flex gap-2">
              <HelpCircle size={14} className="shrink-0 text-zinc-400" />
              <span>
                {language === 'TH' ? 'ความหมายของรีเซ็ต: การเคลียร์ค่า overrides ทั้งหมดของสาขาวิทยาและกลับสู่ราคากลางต้นน้ำ' : 'Reset will purge custom branch exceptions and re-sync values directly to Master Catalog defaults.'}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
