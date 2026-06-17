/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoffeeItem, Order, Ingredient, Coupon, Activity, Member, Staff, Promotion } from './types';

export const INITIAL_MENU_ITEMS: CoffeeItem[] = [
  {
    id: 'MENU-001',
    name: 'Caramel Macchiato',
    category: 'Coffee',
    price: 120,
    status: 'Available',
    image: '☕'
  },
  {
    id: 'MENU-002',
    name: 'Americano',
    category: 'Coffee',
    price: 75,
    status: 'Available',
    image: '☕'
  },
  {
    id: 'MENU-003',
    name: 'Latte',
    category: 'Coffee',
    price: 90,
    status: 'Available',
    image: '🥛'
  },
  {
    id: 'MENU-004',
    name: 'Thai Milk Tea',
    category: 'Beverage',
    price: 80,
    status: 'Available',
    image: '🧋'
  },
  {
    id: 'MENU-005',
    name: 'Chocolate Croissant',
    category: 'Bakery',
    price: 85,
    status: 'Available',
    image: '🥐'
  },
  {
    id: 'MENU-006',
    name: 'Espresso',
    category: 'Coffee',
    price: 65,
    status: 'Available',
    image: '☕'
  },
  {
    id: 'MENU-007',
    name: 'Cappuccino',
    category: 'Coffee',
    price: 85,
    status: 'Available',
    image: '☕'
  },
  {
    id: 'MENU-008',
    name: 'Matcha Latte',
    category: 'Beverage',
    price: 95,
    status: 'Available',
    image: '🍵'
  },
  {
    id: 'MENU-009',
    name: 'Blueberry Muffin',
    category: 'Bakery',
    price: 70,
    status: 'Available',
    image: '🧁'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-20260525-152',
    queueNo: '',
    customerName: 'Kanyarat S.',
    customerPhone: '081-234-5678',
    customerEmail: 'kanyarat@gmail.com',
    branch: 'Central Plaza',
    status: 'Pending Payment',
    amount: 180,
    time: '10:45',
    orderTime: '25 May 2026, 10:45',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    paymentSlipUrl: 'slip_sample_01',
    note: 'หวานน้อย แก้วใหญ่ (Less sweet, large cup)',
    items: [
      {
        item: INITIAL_MENU_ITEMS[0], // Caramel Macchiato
        qty: 1,
        price: 120,
        total: 120
      },
      {
        item: INITIAL_MENU_ITEMS[4], // Chocolate Croissant
        qty: 1,
        price: 85,
        total: 85
      }
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:45', active: true },
      { status: 'Paid', time: '', active: false },
      { status: 'Preparing', time: '', active: false },
      { status: 'Ready For Pickup', time: '', active: false },
      { status: 'Completed', time: '', active: false }
    ]
  },
  {
    id: 'ORD-20260525-156',
    queueNo: '',
    customerName: 'Pakorn W.',
    customerPhone: '086-321-7788',
    customerEmail: 'pakorn.w@gmail.com',
    branch: 'Central Plaza',
    status: 'Pending Payment',
    amount: 90,
    time: '10:48',
    orderTime: '25 May 2026, 10:48',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    verificationStatus: 'pending_review',
    note: 'ไม่หวาน (No sugar)',
    items: [
      { item: INITIAL_MENU_ITEMS[2], qty: 1, price: 90, total: 90 } // Latte
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:48', active: true },
      { status: 'Paid', time: '', active: false },
      { status: 'Preparing', time: '', active: false },
      { status: 'Ready For Pickup', time: '', active: false },
      { status: 'Completed', time: '', active: false }
    ]
  },
  {
    id: 'ORD-20260525-155',
    queueNo: '',
    customerName: 'Nicha T.',
    customerPhone: '094-552-3311',
    customerEmail: 'nicha.t@outlook.com',
    branch: 'Siam Square',
    status: 'Pending Payment',
    amount: 160,
    time: '10:47',
    orderTime: '25 May 2026, 10:47',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    verificationStatus: 'pending_review',
    items: [
      { item: INITIAL_MENU_ITEMS[1], qty: 1, price: 75, total: 75 }, // Americano
      { item: INITIAL_MENU_ITEMS[4], qty: 1, price: 85, total: 85 }  // Chocolate Croissant
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:47', active: true },
      { status: 'Paid', time: '', active: false },
      { status: 'Preparing', time: '', active: false },
      { status: 'Ready For Pickup', time: '', active: false },
      { status: 'Completed', time: '', active: false }
    ]
  },
  {
    id: 'ORD-20260525-154',
    queueNo: '',
    customerName: 'Theerapat S.',
    customerPhone: '081-770-4422',
    customerEmail: 'theerapat.s@gmail.com',
    branch: 'Mega Bangna',
    status: 'Pending Payment',
    amount: 240,
    time: '10:46',
    orderTime: '25 May 2026, 10:46',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    verificationStatus: 'pending_review',
    note: 'แยกถุง 2 ใบ (2 separate bags)',
    items: [
      { item: INITIAL_MENU_ITEMS[0], qty: 2, price: 120, total: 240 } // Caramel Macchiato
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:46', active: true },
      { status: 'Paid', time: '', active: false },
      { status: 'Preparing', time: '', active: false },
      { status: 'Ready For Pickup', time: '', active: false },
      { status: 'Completed', time: '', active: false }
    ]
  },
  {
    id: 'ORD-20260525-151',
    queueNo: '002',
    customerName: 'Piyawat T.',
    customerPhone: '095-888-1234',
    customerEmail: 'piyawat.t@outlook.com',
    branch: 'Siam Square',
    status: 'Paid',
    amount: 245,
    time: '10:42',
    orderTime: '25 May 2026, 10:42',
    paymentStatus: 'Paid',
    paymentMethod: 'PromptPay QR',
    note: 'ขอหลอดกระดาษด้วยครับ (Paper straws please)',
    items: [
      {
        item: INITIAL_MENU_ITEMS[1], // Americano
        qty: 2,
        price: 75,
        total: 150
      },
      {
        item: INITIAL_MENU_ITEMS[4], // Chocolate Croissant
        qty: 1,
        price: 85,
        total: 85
      }
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:42', active: true },
      { status: 'Paid', time: '25 May 2026, 10:43', active: true },
      { status: 'Preparing', time: '', active: false },
      { status: 'Ready For Pickup', time: '', active: false },
      { status: 'Completed', time: '', active: false }
    ]
  },
  {
    id: 'ORD-20260525-150',
    queueNo: '002',
    customerName: 'Supaporn M.',
    customerPhone: '062-111-9988',
    customerEmail: 'supaporn.mega@gmail.com',
    branch: 'Mega Bangna',
    status: 'Preparing',
    amount: 165,
    time: '10:38',
    orderTime: '25 May 2026, 10:38',
    paymentStatus: 'Paid',
    paymentMethod: 'PromptPay QR',
    items: [
      {
        item: INITIAL_MENU_ITEMS[2], // Latte
        qty: 1,
        price: 90,
        total: 90
      },
      {
        item: INITIAL_MENU_ITEMS[3], // Thai Milk Tea
        qty: 1,
        price: 80,
        total: 80
      }
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:38', active: true },
      { status: 'Paid', time: '25 May 2026, 10:39', active: true },
      { status: 'Preparing', time: '25 May 2026, 10:40', active: true },
      { status: 'Ready For Pickup', time: '', active: false },
      { status: 'Completed', time: '', active: false }
    ]
  },
  {
    id: 'ORD-20260525-149',
    queueNo: '002',
    customerName: 'Natthapon P.',
    customerPhone: '089-776-5544',
    customerEmail: 'natthapon@central.co.th',
    branch: 'Central Plaza',
    status: 'Ready For Pickup',
    amount: 220,
    time: '10:35',
    orderTime: '25 May 2026, 10:35',
    paymentStatus: 'Paid',
    paymentMethod: 'Credit Card',
    note: 'แยกน้ำแข็ง (Separate ice please)',
    items: [
      {
        item: INITIAL_MENU_ITEMS[0], // Caramel Macchiato
        qty: 1,
        price: 120,
        total: 120
      },
      {
        item: INITIAL_MENU_ITEMS[2], // Latte
        qty: 1,
        price: 90,
        total: 90
      }
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:35', active: true },
      { status: 'Paid', time: '25 May 2026, 10:36', active: true },
      { status: 'Preparing', time: '25 May 2026, 10:38', active: true },
      { status: 'Ready For Pickup', time: '25 May 2026, 10:44', active: true },
      { status: 'Completed', time: '', active: false }
    ]
  },
  {
    id: 'ORD-20260525-148',
    queueNo: '001',
    customerName: 'Waraporn K.',
    customerPhone: '084-555-6677',
    customerEmail: 'waraporn.k@koratmail.com',
    branch: 'The Mall Korat',
    status: 'Completed',
    amount: 165,
    time: '10:29',
    orderTime: '25 May 2026, 10:29',
    paymentStatus: 'Paid',
    paymentMethod: 'PromptPay QR',
    items: [
      {
        item: INITIAL_MENU_ITEMS[1], // Americano
        qty: 1,
        price: 75,
        total: 75
      },
      {
        item: INITIAL_MENU_ITEMS[4], // Chocolate Croissant
        qty: 1,
        price: 85,
        total: 85
      }
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:29', active: true },
      { status: 'Paid', time: '25 May 2026, 10:30', active: true },
      { status: 'Preparing', time: '25 May 2026, 10:31', active: true },
      { status: 'Ready For Pickup', time: '25 May 2026, 10:36', active: true },
      { status: 'Completed', time: '25 May 2026, 10:38', active: true }
    ]
  },
  {
    id: 'ORD-20260525-147',
    queueNo: '',
    customerName: 'Tanakrit W.',
    customerPhone: '087-122-3344',
    customerEmail: 'tanakrit@outlook.co.th',
    branch: 'Siam Square',
    status: 'Cancelled',
    amount: 190,
    time: '10:22',
    orderTime: '25 May 2026, 10:22',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    note: 'Customer chose abort in app',
    items: [
      {
        item: INITIAL_MENU_ITEMS[3], // Thai Milk Tea
        qty: 2,
        price: 80,
        total: 160
      }
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:22', active: true },
      { status: 'Cancelled', time: '25 May 2026, 10:30', active: true }
    ]
  },
  {
    id: 'ORD-20260525-146',
    queueNo: '001',
    customerName: 'Chaiyana P.',
    customerPhone: '081-999-8877',
    customerEmail: 'chaiyana@gmail.com',
    branch: 'Central Plaza',
    status: 'Completed',
    amount: 120,
    time: '10:15',
    orderTime: '25 May 2026, 10:15',
    paymentStatus: 'Paid',
    paymentMethod: 'PromptPay QR',
    items: [
      {
        item: INITIAL_MENU_ITEMS[0], // Caramel Macchiato
        qty: 1,
        price: 120,
        total: 120
      }
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:15', active: true },
      { status: 'Paid', time: '25 May 2026, 10:16', active: true },
      { status: 'Preparing', time: '25 May 2026, 10:18', active: true },
      { status: 'Ready For Pickup', time: '25 May 2026, 10:22', active: true },
      { status: 'Completed', time: '25 May 2026, 10:25', active: true }
    ]
  },
  {
    id: 'ORD-20260525-145',
    queueNo: '001',
    customerName: 'Phitak S.',
    customerPhone: '083-442-1234',
    customerEmail: 'phitak.s@bangnamail.com',
    branch: 'Mega Bangna',
    status: 'Completed',
    amount: 210,
    time: '10:05',
    orderTime: '25 May 2026, 10:05',
    paymentStatus: 'Paid',
    paymentMethod: 'Credit Card',
    items: [
      {
        item: INITIAL_MENU_ITEMS[2], // Latte
        qty: 1,
        price: 90,
        total: 90
      },
      {
        item: INITIAL_MENU_ITEMS[0], // Caramel Macchiato
        qty: 1,
        price: 120,
        total: 120
      }
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:05', active: true },
      { status: 'Paid', time: '25 May 2026, 10:07', active: true },
      { status: 'Preparing', time: '25 May 2026, 10:08', active: true },
      { status: 'Ready For Pickup', time: '25 May 2026, 10:12', active: true },
      { status: 'Completed', time: '25 May 2026, 10:14', active: true }
    ]
  },
  {
    id: 'ORD-20260525-144',
    queueNo: '001',
    customerName: 'Pornpan V.',
    customerPhone: '082-990-2134',
    customerEmail: 'pornpan.v@gmail.com',
    branch: 'Siam Square',
    status: 'Completed',
    amount: 175,
    time: '09:58',
    orderTime: '25 May 2026, 09:58',
    paymentStatus: 'Paid',
    paymentMethod: 'PromptPay QR',
    items: [
      {
        item: INITIAL_MENU_ITEMS[3], // Thai Milk Tea
        qty: 1,
        price: 80,
        total: 80
      },
      {
        item: INITIAL_MENU_ITEMS[7], // Matcha Latte
        qty: 1,
        price: 95,
        total: 95
      }
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 09:58', active: true },
      { status: 'Paid', time: '25 May 2026, 09:59', active: true },
      { status: 'Preparing', time: '25 May 2026, 10:02', active: true },
      { status: 'Ready For Pickup', time: '25 May 2026, 10:08', active: true },
      { status: 'Completed', time: '25 May 2026, 10:12', active: true }
    ]
  },
  // Adding an additional pending order to showcase payment slips fully!
  {
    id: 'ORD-20260525-153',
    queueNo: '',
    customerName: 'Natthapon J.',
    customerPhone: '091-778-9901',
    customerEmail: 'natthapon.j@gmail.com',
    branch: 'Mega Bangna',
    status: 'Pending Payment',
    amount: 165,
    time: '10:48',
    orderTime: '25 May 2026, 10:48',
    paymentStatus: 'Pending Payment',
    paymentMethod: 'PromptPay QR',
    paymentSlipUrl: 'slip_sample_02',
    note: 'วิปครีมเยอะๆ (Lots of whipped cream please!)',
    items: [
      {
        item: INITIAL_MENU_ITEMS[3], // Thai Milk Tea
        qty: 1,
        price: 80,
        total: 80
      },
      {
        item: INITIAL_MENU_ITEMS[4], // Chocolate Croissant
        qty: 1,
        price: 85,
        total: 85
      }
    ],
    timeline: [
      { status: 'Pending Payment', time: '25 May 2026, 10:48', active: true },
      { status: 'Paid', time: '', active: false },
      { status: 'Preparing', time: '', active: false },
      { status: 'Ready For Pickup', time: '', active: false },
      { status: 'Completed', time: '', active: false }
    ]
  }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'STK-001', name: 'Espresso Beans', type: 'Bean', status: 'In Stock', stockLevel: 85, unit: 'kg', branch: 'Central Plaza' },
  { id: 'STK-002', name: 'Premium Milk', type: 'Ingredient', status: 'In Stock', stockLevel: 92, unit: 'liters', branch: 'Central Plaza' },
  { id: 'STK-003', name: 'Dark Roast Beans', type: 'Bean', status: 'In Stock', stockLevel: 75, unit: 'kg', branch: 'Siam Square' },
  { id: 'STK-004', name: 'Caramel Syrup', type: 'Ingredient', status: 'Low Stock', stockLevel: 25, unit: 'liters', branch: 'Siam Square' },
  { id: 'STK-005', name: 'Vanilla Syrup', type: 'Ingredient', status: 'In Stock', stockLevel: 65, unit: 'liters', branch: 'Mega Bangna' },
  { id: 'STK-006', name: 'Chocolate Sauce', type: 'Ingredient', status: 'Out of Stock', stockLevel: 0, unit: 'liters', branch: 'The Mall Korat' },
  { id: 'STK-007', name: 'Paper Cups (Hot)', type: 'Packaging', status: 'In Stock', stockLevel: 94, unit: 'boxes', branch: 'Central Plaza' },
  { id: 'STK-008', name: 'Paper Cups (Cold)', type: 'Packaging', status: 'Low Stock', stockLevel: 18, unit: 'boxes', branch: 'Siam Square' },
  { id: 'STK-009', name: 'Whipped Cream', type: 'Ingredient', status: 'In Stock', stockLevel: 88, unit: 'liters', branch: 'Mega Bangna' }
];

export const INITIAL_COUPONS: Coupon[] = [
  { code: 'WELCOME50', name: 'Welcome New User Promo', description: '50% discount for first-time orders', discountType: 'percentage', discountValue: 50, startDate: '2026-05-01', endDate: '2026-08-31', limitGlobal: 500, limitPerUser: 1, limitDaily: 1, usageCount: 98, status: 'Active' },
  { code: 'COFFEE20', name: 'Coffee Lover Special', description: '20% off all hot drinks across branches', discountType: 'percentage', discountValue: 20, startDate: '2026-04-15', endDate: '2026-07-15', limitGlobal: 1000, limitPerUser: 2, limitDaily: 2, usageCount: 465, status: 'Active' },
  { code: 'SUMMER30', name: 'Summer Sunset Discount', description: 'Flat ฿30 off summer drinks menu', discountType: 'fixed', discountValue: 30, startDate: '2026-06-01', endDate: '2026-06-30', limitGlobal: 800, limitPerUser: 2, limitDaily: 2, usageCount: 212, status: 'Active' },
  { code: 'NEWYEAR10', name: 'Legacy New Year Campaign', description: 'Holiday celebration code', discountType: 'percentage', discountValue: 10, startDate: '2026-01-01', endDate: '2026-02-01', limitGlobal: 1500, limitPerUser: 1, limitDaily: 1, usageCount: 320, status: 'Inactive' }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  { id: 'ACT-001', text: 'New Order #ORD-20260525-152 received from Kanyarat S.', time: '25 May 2026, 10:45', type: 'order', status: 'New' },
  { id: 'ACT-002', text: 'Payment Verified for #ORD-20260525-151 (฿ 245)', time: '25 May 2026, 10:42', type: 'payment', status: 'Paid' },
  { id: 'ACT-003', text: 'Order Ready #ORD-20260525-150 is ready for pickup', time: '25 May 2026, 10:38', type: 'order', status: 'Ready' },
  { id: 'ACT-004', text: 'Promotion Broadcast: Summer Special Coupons activated', time: '25 May 2026, 10:30', type: 'coupon', status: 'Sent' },
  { id: 'ACT-005', text: 'New Member Registered: Natthapon J.', time: '25 May 2026, 10:22', type: 'member', status: 'New' },
  { id: 'ACT-006', text: 'Warning: Chocolate Sauce is Out of Stock in The Mall Korat', time: '25 May 2026, 09:12', type: 'stock', status: 'Alert' }
];

export const INITIAL_MEMBERS: Member[] = [
  { id: 'MEM-001', name: 'Kanyarat Sukprasert', phone: '081-234-5678', email: 'kanyarat@gmail.com', joinDate: '12 Jan 2026', tier: 'Gold', points: 420, totalOrders: 18, totalSpend: 2450 },
  { id: 'MEM-002', name: 'Piyawat Thongla', phone: '095-888-1234', email: 'piyawat.t@outlook.com', joinDate: '05 Feb 2026', tier: 'Silver', points: 185, totalOrders: 8, totalSpend: 1120 },
  { id: 'MEM-003', name: 'Supaporn Mega', phone: '062-111-9988', email: 'supaporn.mega@gmail.com', joinDate: '24 Mar 2026', tier: 'Bronze', points: 95, totalOrders: 5, totalSpend: 540 },
  { id: 'MEM-004', name: 'Natthapon Puanglam', phone: '089-776-5544', email: 'natthapon@central.co.th', joinDate: '10 Apr 2026', tier: 'Silver', points: 205, totalOrders: 12, totalSpend: 1580 },
  { id: 'MEM-005', name: 'Waraporn Korat', phone: '084-555-6677', email: 'waraporn.k@koratmail.com', joinDate: '01 May 2026', tier: 'Bronze', points: 65, totalOrders: 3, totalSpend: 380 }
];

export const INITIAL_STAFF: Staff[] = [
  { id: 'STF-001', name: 'Admin User', role: 'Super Admin', branch: 'All Branches', email: 'Gaidmanee@gmail.com', status: 'Active' },
  { id: 'STF-002', name: 'Somsak Kaew', role: 'Branch Manager', branch: 'Central Plaza', email: 'somsak.k@quickcoffee.com', status: 'Active' },
  { id: 'STF-003', name: 'Janejira Siri', role: 'Barista', branch: 'Siam Square', email: 'janejira.s@quickcoffee.com', status: 'Active' },
  { id: 'STF-004', name: 'Wichai Rak', role: 'Barista', branch: 'Central Plaza', email: 'wichai.r@quickcoffee.com', status: 'Inactive' },
  { id: 'STF-005', name: 'Siriport Manee', role: 'Branch Manager', branch: 'Mega Bangna', email: 'siriporn.m@quickcoffee.com', status: 'Active' }
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  { id: 'PRM-001', title: 'Summer Fruit Coffee', subtitle: 'Refreshing flavors starting from 95฿', status: 'Active', startDate: '2026-06-01', endDate: '2026-08-31', clicks: 1245, targetBranch: 'All Branches' },
  { id: 'PRM-002', title: 'Buy 1 Get 1 Croissant', subtitle: 'Every Tuesday morning 07:00 - 10:00', status: 'Active', startDate: '2026-05-15', endDate: '2026-12-15', clicks: 832, targetBranch: 'Siam Square' },
  { id: 'PRM-003', title: 'Loyalty Triple Points', subtitle: 'Earn 3x points on pour-over coffees', status: 'Inactive', startDate: '2026-04-01', endDate: '2026-04-30', clicks: 432, targetBranch: 'All Branches' }
];
