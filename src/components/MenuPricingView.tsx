import { useState, Dispatch, SetStateAction, FormEvent } from 'react';
import { CoffeeItem, Branch } from '../types';
import { Plus, Tag, ToggleLeft, ToggleRight, DollarSign, Check, Edit2, X, Sparkles, Sliders } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface MenuPricingViewProps {
  menuItems: CoffeeItem[];
  setMenuItems: Dispatch<SetStateAction<CoffeeItem[]>>;
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  roleMode: 'Admin' | 'Staff';
  staffAssignedBranch: string;
}

export default function MenuPricingView({
  menuItems,
  setMenuItems,
  selectedBranch,
  setSelectedBranch,
  roleMode,
  staffAssignedBranch
}: MenuPricingViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editName, setEditName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<'Coffee' | 'Beverage' | 'Bakery'>('Coffee');
  const { language, formatCurrency } = useLanguage();

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(85);
  const [newItemCategory, setNewItemCategory] = useState<'Coffee' | 'Beverage' | 'Bakery'>('Coffee');
  const [newItemImage, setNewItemImage] = useState('☕');

  const activeBranch = roleMode === 'Staff' ? (staffAssignedBranch as Branch) : selectedBranch;

  // Filter out menu list
  const filteredItems = menuItems.filter(item => {
    if (activeCategory !== 'All') {
      if (activeCategory === 'Coffee' && item.category !== 'Coffee') return false;
      if (activeCategory === 'Beverages' && item.category !== 'Beverage') return false;
      if (activeCategory === 'Bakery' && item.category !== 'Bakery') return false;
    }
    return true;
  });

  const handleToggleAvailability = (id: string) => {
    setMenuItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: item.status === 'Available' ? 'Out of Stock' : 'Available'
        };
      }
      return item;
    }));
  };

  const handleSavePrice = () => {
    if (!editingItemId) return;
    setMenuItems(prev => prev.map(item => {
      if (item.id === editingItemId) {
        return {
          ...item,
          name: editName,
          price: editPrice,
          category: editCategory
        };
      }
      return item;
    }));
    setEditingItemId(null);
  };

  const handleAddNewItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    const newItem: CoffeeItem = {
      id: `MENU-00${menuItems.length + 1}`,
      name: newItemName,
      price: newItemPrice,
      category: newItemCategory,
      status: 'Available',
      image: newItemImage
    };

    setMenuItems(prev => [...prev, newItem]);
    setShowAddModal(false);
    // Reset form
    setNewItemName('');
    setNewItemPrice(85);
    setNewItemCategory('Coffee');
    setNewItemImage('☕');
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Search Header Banner control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-4.5 rounded-xl border border-[#E6DFD9] shadow-xs">
        <div>
          <h3 className="font-sans font-bold text-sm text-[#2E2A25]">
            {language === 'TH' ? 'ทำเนียบสูตรรสชาติและราคาเมนูกาแฟ' : 'Beverage & Bakery Catalogs'}
          </h3>
          <p className="font-sans text-[11px] text-zinc-500">
            {language === 'TH' ? 'ตั้งค่าระงับการขายเมนูชั่วคราว, ปรับราคาป้ายโฆษณา และแบ่งสัดส่วนสินค้าขึ้นสาขาหน้าร้าน' : 'Enable/disable recipes, configure pricing tags, and synchronise branches instantly'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-sans">
          {/* Active Branch Display or selection */}
          <div className="flex items-center gap-1 bg-stone-50 border px-3 py-1.5 rounded-lg text-xs text-zinc-600">
            <span className="font-mono text-[9px] text-[#8B6B4F] uppercase font-bold tracking-wider">{language === 'TH' ? 'ขอบเขตสาขา:' : 'Scope:'}</span>
            <strong className="font-semibold">{activeBranch}</strong>
          </div>

          <button
            id="add-recipe-btn"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg font-sans shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> {language === 'TH' ? 'เพิ่มดีไซน์เมนู' : 'Add Recipe'}
          </button>
        </div>
      </div>

      {/* Category Selection Tabs bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-100 p-1.5 rounded-xl border border-[#E6DFD9] animate-fade-in">
        <div className="flex bg-stone-200 p-1 rounded-lg gap-1">
          {[
            { en: 'All', th: 'เมนูทั้งหมด' },
            { en: 'Coffee', th: 'กลุ่มกาแฟ' },
            { en: 'Beverages', th: 'เครื่องดื่มอื่น ๆ' },
            { en: 'Bakery', th: 'เบเกอรี่ / ของว่าง' }
          ].map((cat) => {
            const isActive = activeCategory === cat.en;
            return (
              <button
                key={cat.en}
                id={`category-tab-${cat.en.toLowerCase()}`}
                onClick={() => setActiveCategory(cat.en)}
                className={`px-3 py-1 text-xs font-sans font-bold rounded-md transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#8B6B4F] text-white shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {language === 'TH' ? cat.th : cat.en}
              </button>
            );
          })}
        </div>
        <span className="font-mono text-[10px] text-zinc-400 mr-2 uppercase tracking-widest font-bold">
          {filteredItems.length} {language === 'TH' ? 'สูตรกาแฟพร้อมใช้' : 'RECIPES LOADED'}
        </span>
      </div>

      {/* Main Split grid structure: Recipe grid vs Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recipie Grid list cards (8 cols of grid) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const isEditing = editingItemId === item.id;
            
            return (
              <div 
                key={item.id} 
                id={`menu-card-${item.id}`}
                className={`p-4 bg-[#FFFFFF] border rounded-xl flex flex-col justify-between shadow-xs hover:shadow-md transition-all ${
                  item.status === 'Out of Stock' ? 'opacity-80 border-dashed bg-stone-50/50' : 'border-[#E6DFD9]'
                } ${isEditing ? 'ring-2 ring-[#8B6B4F] border-[#8B6B4F]' : ''}`}
              >
                <div className="space-y-3.5">
                  {/* Top Bar with Icon and availability toggle */}
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-amber-50 text-amber-900 border border-amber-150/40 rounded-xl flex items-center justify-center text-lg shadow-inner">
                      {item.image}
                    </div>
                    {/* Status badge toggle switcher as requested in wires */}
                    <button
                      id={`toggle-avail-btn-${item.id}`}
                      onClick={() => handleToggleAvailability(item.id)}
                      className="p-1 text-zinc-400 hover:text-[#8B6B4F] flex items-center gap-1 transition-all"
                      title={item.status === 'Available' ? 'Click to make Out of Stock' : 'Click to make Available'}
                    >
                      {item.status === 'Available' ? (
                        <div className="flex items-center gap-1">
                          <span className="font-sans text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">{language === 'TH' ? 'พร้อมให้บริการ' : 'Available'}</span>
                          <ToggleRight size={22} className="text-[#A8BB9A]" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="font-sans text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded">{language === 'TH' ? 'ระงับชั่วคราว' : 'Out & Blocked'}</span>
                          <ToggleLeft size={22} className="text-zinc-300" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Pricing Tags */}
                  <div>
                    <h4 className="font-sans font-extrabold text-sm text-zinc-900 leading-snug truncate">{item.name}</h4>
                    <span className="font-mono text-[9px] text-zinc-400 block mt-0.5">
                      {language === 'TH' ? (
                        item.category === 'Coffee' ? 'สูตรกาแฟพิเศษ' :
                        item.category === 'Beverage' ? 'ชา/เครื่องดื่มกลิ่นผลไม้' : 'เค้กและเบเกอรี่อบใหม่'
                      ) : item.category.toUpperCase()} // ID: {item.id}
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-100/50 flex items-center justify-between">
                  <div className="font-mono text-zinc-900 text-sm font-black">
                    {formatCurrency(item.price)}
                  </div>

                  <button
                    id={`edit-recipe-btn-${item.id}`}
                    onClick={() => {
                      setEditingItemId(item.id);
                      setEditName(item.name);
                      setEditPrice(item.price);
                      setEditCategory(item.category);
                    }}
                    className="p-1 px-2.5 rounded hover:bg-stone-50 font-sans text-[10.5px] text-[#8B6B4F] font-bold border border-[#8B6B4F]/20 flex items-center gap-1 transition-all cursor-pointer hover:border-[#8B6B4F]/50"
                  >
                    <Edit2 size={11} /> {language === 'TH' ? 'แก้ไขป้ายราคา' : 'Edit Price'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right side: Inline Quick Editor properties */}
        <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E6DFD9] rounded-xl overflow-hidden shadow-xs flex flex-col justify-between self-start animate-fade-in">
          <div className="p-4 bg-[#FDFBF7] border-b border-[#E6DFD9]">
            <h3 className="font-sans font-bold text-sm text-[#2E2A25] flex items-center gap-1.5">
              <Sliders size={16} className="text-[#8B6B4F]" />
              <span>{language === 'TH' ? 'แผงคอนโซลควบคุมเรทราคา' : 'Recipe pricing setup'}</span>
            </h3>
            <p className="font-sans text-[11px] text-zinc-500 mt-0.5">{language === 'TH' ? 'ตั้งค่าฐานดัชนีเงินชำระและประเด็นเมนู' : 'Configures the base pricing grids'}</p>
          </div>

          {editingItemId ? (
            (() => {
              const editingItem = menuItems.find(i => i.id === editingItemId);
              if (!editingItem) return null;
              return (
                <div className="p-5 space-y-4 font-sans text-xs text-zinc-700">
                  <div className="flex gap-2.5 items-center">
                    <div className="text-xl p-2 rounded-xl bg-amber-50 shadow-inner block">{editingItem.image}</div>
                    <div>
                      <h4 className="font-bold text-zinc-800">{editingItem.name}</h4>
                      <span className="font-mono text-[9px] text-zinc-400 block uppercase">ORIGIN CODE: {editingItem.id}</span>
                    </div>
                  </div>

                  <hr className="border-zinc-100" />

                  {/* Edit Name input */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-mono text-[9.5px] tracking-widest uppercase font-bold block">{language === 'TH' ? 'ชื่อรายการเครื่องดื่ม/ขนม:' : 'Recipe Name:'}</label>
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-xs p-2 bg-stone-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#8B6B4F] font-bold text-zinc-700"
                    />
                  </div>

                  {/* Edit Category selection */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-mono text-[9.5px] tracking-widest uppercase font-bold block">{language === 'TH' ? 'ระดับหมวดหมู่สูตร:' : 'Section category:'}</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full text-xs p-2 bg-stone-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#8B6B4F] text-zinc-600 cursor-pointer"
                    >
                      <option value="Coffee">{language === 'TH' ? 'สูตรหลักต้มชงกาแฟ' : 'Coffee / Espresso'}</option>
                      <option value="Beverage">{language === 'TH' ? 'กลุ่มขนมชาและช็อกโกแลต' : 'Beverages / Teas'}</option>
                      <option value="Bakery">{language === 'TH' ? 'กลุ่มเบเกอรี่อบหอม' : 'Bakery / Pastry'}</option>
                    </select>
                  </div>

                  {/* Edit item Price input */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-mono text-[9.5px] tracking-widest uppercase font-bold block">{language === 'TH' ? 'ราคาป้ายหน้าร้าน (฿):' : 'Price in Baht (฿):'}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-[#8B6B4F] text-xs font-mono">฿</span>
                      <input 
                        type="number"
                        value={editPrice === 0 ? '' : editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full text-xs py-2 pl-7 pr-3 font-sans font-mono bg-stone-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#8B6B4F] font-black text-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setEditingItemId(null)}
                      className="flex-1 py-1.5 border hover:bg-stone-50 text-[10.5px] font-semibold text-zinc-500 rounded-lg"
                    >
                      {language === 'TH' ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button
                      id="save-recipe-changes-btn"
                      onClick={handleSavePrice}
                      className="flex-1 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Check size={13} /> {language === 'TH' ? 'บันทึกแก้ไขราคา' : 'Save Pricing'}
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-8 text-center text-zinc-400 text-xs font-sans space-y-2">
              <Tag size={36} className="text-zinc-200 mx-auto" />
              <p className="font-semibold text-zinc-500">{language === 'TH' ? 'แก้ไขและปรับเป้าราคา' : 'Configure Price Tag'}</p>
              <p className="text-[10px] leading-relaxed">{language === 'TH' ? 'จิ้มเปิดกล่อง "แก้ไขป้ายราคา" ในการ์ดรายการฝั่งซ้ายเพื่อทำแผนแก้ไขและควบคุมแบบเรียลไทม์' : 'Click "Edit Price" on any individual item card to update its visual cost, change category, or rename title configurations.'}</p>
            </div>
          )}
        </div>

      </div>

      {/* Add New Recipe Popup Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <form 
            onSubmit={handleAddNewItem}
            className="bg-white border rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 font-sans text-xs text-zinc-600"
          >
            <div className="flex justify-between items-center text-zinc-800">
              <h3 className="font-sans font-extrabold text-sm flex items-center gap-1.5">
                <Sparkles size={16} className="text-pink-500 animate-pulse" />
                <span>{language === 'TH' ? 'สร้างสูตรขนมและเครื่องดื่มเพิ่มเติม' : 'Create New Beverage Recipe'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                className="p-1 rounded-full hover:bg-zinc-100"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              
              {/* Recipe Name */}
              <div className="space-y-1">
                <label className="font-bold">{language === 'TH' ? 'ชื่ออย่างเป็นทางการเมนู:' : 'Item Name:'}</label>
                <input 
                  id="new-recipe-name-input"
                  type="text"
                  required
                  placeholder={language === 'TH' ? 'เช่น คาเมลวิปเปอร์ดริปลาก...' : 'e.g. Vanilla Drip Cold Brew...'}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-zinc-200 rounded-lg focus:outline-none focus:border-[#8B6B4F]"
                />
              </div>

              {/* Price and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">{language === 'TH' ? 'สลักหมวดหมู่หลัก:' : 'Category:'}</label>
                  <select
                    id="new-recipe-category-dropdown"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-zinc-200 rounded-lg focus:outline-none text-zinc-600 cursor-pointer"
                  >
                    <option value="Coffee">{language === 'TH' ? 'Coffee / กาแฟ' : 'Coffee'}</option>
                    <option value="Beverage">{language === 'TH' ? 'Beverage / ขนมชา' : 'Beverage'}</option>
                    <option value="Bakery">{language === 'TH' ? 'Bakery / ของอบขนม' : 'Bakery'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold">{language === 'TH' ? 'ตั้งอัตราจำจริง (฿):' : 'Price (฿):'}</label>
                  <input 
                    id="new-recipe-price-input"
                    type="number"
                    min="1"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-zinc-200 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Emoji Representation picker as a quick placeholder */}
              <div className="space-y-1">
                <label className="font-bold block">{language === 'TH' ? 'เลือกไอคอนตัวแทนเมนูสดสวย:' : 'Visual Representation Icon:'}</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['☕', '🥛', '🧋', '🍵', '🥐', '🧁', '🥤', '🍰'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewItemImage(emoji)}
                      className={`w-9 h-9 border rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${newItemImage === emoji ? 'border-[#8B6B4F] bg-amber-50/20' : 'border-zinc-200 hover:bg-stone-50'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 border hover:bg-stone-50 text-xs font-semibold rounded-lg text-zinc-500"
              >
                {language === 'TH' ? 'ละทิ้ง' : 'Dismiss'}
              </button>
              <button 
                id="modal-confirm-add-recipe-btn"
                type="submit"
                className="px-4 py-1.5 bg-[#8B6B4F] hover:bg-[#70533C] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                {language === 'TH' ? 'ยืนยันขึ้นดีไซน์เมนู' : 'Add Menu Dish'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
