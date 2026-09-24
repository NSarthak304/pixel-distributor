import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Package,
  ShoppingCart,
  CreditCard,
  Smartphone,
  History,
  FileSpreadsheet,
  Settings,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  ArrowRight,
  TrendingUp,
  Box,
  Truck,
  Building,
  Lock,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  Dealer,
  Product,
  Order,
  AppRelease,
  ActivityLog,
  CapabilityLevel,
  ModuleKey,
} from '@pixel/shared';

// Pre-seeded fallback data for offline/mock presentation
const initialDealers: Dealer[] = [
  {
    dealerId: 'DLR-1001',
    businessName: 'Apex Telecom & Digital (Dealer A)',
    ownerName: 'Rajesh Kumar',
    mobile: '+919876543210',
    email: 'dealerA@apex.in',
    address: '42 Ring Road, Commercial Zone',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin: '400093',
    dealerType: 'GOLD',
    priceGroup: 'TIER_1',
    creditLimit: 500000,
    paymentTerms: 'NET_30',
    assignedWarehouse: 'WH-MUMBAI-01',
    accountStatus: 'ACTIVE',
    appId: 'APP-DLR-1001-8910',
    outstandingBalance: 120000,
    createdAt: '2026-09-20',
    updatedAt: '2026-09-24',
  },
  {
    dealerId: 'DLR-1002',
    businessName: 'Supreme Mobiles (Dealer B)',
    ownerName: 'Suresh Patel',
    mobile: '+919811223344',
    email: 'dealerB@supreme.in',
    address: '88 Station Road, Sector 4',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pin: '380001',
    dealerType: 'PLATINUM',
    priceGroup: 'TIER_1',
    creditLimit: 1000000,
    paymentTerms: 'NET_30',
    assignedWarehouse: 'WH-MUMBAI-01',
    accountStatus: 'ACTIVE',
    appId: 'APP-DLR-1002-3321',
    outstandingBalance: 450000,
    createdAt: '2026-09-21',
    updatedAt: '2026-09-24',
  },
  {
    dealerId: 'DLR-1003',
    businessName: 'City Connect Retail (Dealer C)',
    ownerName: 'Anil Deshmukh',
    mobile: '+919922334455',
    email: 'dealerC@cityconnect.in',
    address: '15 Gandhi Square',
    city: 'Pune',
    state: 'Maharashtra',
    pin: '411001',
    dealerType: 'STANDARD',
    priceGroup: 'STANDARD',
    creditLimit: 250000,
    paymentTerms: 'NET_15',
    assignedWarehouse: 'WH-MUMBAI-01',
    accountStatus: 'ACTIVE',
    appId: 'APP-DLR-1003-7712',
    outstandingBalance: 85000,
    createdAt: '2026-09-22',
    updatedAt: '2026-09-24',
  },
];

const initialProducts: Product[] = [
  {
    productId: 'PRD-101',
    sku: 'PX-ULTRA-256',
    name: 'Pixel Ultra 256GB Titanium',
    categoryId: 'smartphones',
    categoryName: 'Smartphones',
    brand: 'Pixel',
    model: 'Ultra 2026',
    unit: 'PCS',
    mrp: 74999,
    purchasePrice: 52000,
    dealerPrices: { TIER_1: 56000, TIER_2: 58000, TIER_3: 60000, STANDARD: 62000 },
    reorderLevel: 10,
    isActive: true,
    createdAt: '2026-09-20',
    updatedAt: '2026-09-24',
  },
  {
    productId: 'PRD-102',
    sku: 'PX-PRO-128',
    name: 'Pixel Pro 128GB Obsidian',
    categoryId: 'smartphones',
    categoryName: 'Smartphones',
    brand: 'Pixel',
    model: 'Pro 2026',
    unit: 'PCS',
    mrp: 59999,
    purchasePrice: 41000,
    dealerPrices: { TIER_1: 44000, TIER_2: 46000, TIER_3: 48000, STANDARD: 50000 },
    reorderLevel: 15,
    isActive: true,
    createdAt: '2026-09-20',
    updatedAt: '2026-09-24',
  },
  {
    productId: 'PRD-103',
    sku: 'PX-BUDS-PRO',
    name: 'Pixel Buds Pro Wireless ANC',
    categoryId: 'audio',
    categoryName: 'Audio',
    brand: 'Pixel',
    model: 'Buds Pro 2',
    unit: 'PCS',
    mrp: 14999,
    purchasePrice: 8500,
    dealerPrices: { TIER_1: 9900, TIER_2: 10500, TIER_3: 11000, STANDARD: 11500 },
    reorderLevel: 25,
    isActive: true,
    createdAt: '2026-09-20',
    updatedAt: '2026-09-24',
  },
];

const initialReleases: AppRelease[] = [
  {
    releaseId: 'REL-v1.0.0',
    version: '1.0.0',
    versionCode: 100,
    releaseDate: '2026-09-24T10:00:00Z',
    downloadUrl: '/download',
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fileSize: 18450120,
    releaseNotes: '• Initial Production Release\n• Unified multi-tenant dealer engine\n• Offline cache support',
    minimumSupportedVersion: '1.0.0',
    minimumVersionCode: 100,
    mandatory: false,
    status: 'ACTIVE',
    publishedBy: 'System Administrator',
    createdAt: '2026-09-24',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dealers' | 'permissions' | 'inventory' | 'orders' | 'finance' | 'appManagement' | 'activity' | 'excelHub'>('dashboard');
  const [dealers, setDealers] = useState<Dealer[]>(initialDealers);
  const [products] = useState<Product[]>(initialProducts);
  const [releases, setReleases] = useState<AppRelease[]>(initialReleases);
  const [selectedDealer, setSelectedDealer] = useState<Dealer>(initialDealers[0]);
  const [showAddDealerModal, setShowAddDealerModal] = useState(false);
  const [showNewReleaseModal, setShowNewReleaseModal] = useState(false);

  // New Dealer Form State
  const [newDealerForm, setNewDealerForm] = useState({
    businessName: '',
    ownerName: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pin: '',
    dealerType: 'GOLD',
    priceGroup: 'TIER_1',
    creditLimit: 500000,
    assignedWarehouse: 'WH-MUMBAI-01',
  });

  // Selected Dealer Permissions State
  const [dealerPermissions, setDealerPermissions] = useState<Record<string, Record<ModuleKey, CapabilityLevel>>>({
    'DLR-1001': {
      dashboard: 'VIEW',
      dealerManagement: 'HIDDEN',
      userManagement: 'EDIT',
      productMaster: 'VIEW',
      centralInventory: 'HIDDEN',
      dealerInventory: 'EDIT',
      stockTransfers: 'CREATE',
      orders: 'EDIT',
      customers: 'VIEW',
      finance: 'VIEW',
      reports: 'VIEW',
      appManagement: 'HIDDEN',
      activityLogs: 'HIDDEN',
      settings: 'HIDDEN',
    },
    'DLR-1002': {
      dashboard: 'VIEW',
      dealerManagement: 'HIDDEN',
      userManagement: 'HIDDEN',
      productMaster: 'VIEW',
      centralInventory: 'HIDDEN',
      dealerInventory: 'VIEW',
      stockTransfers: 'VIEW',
      orders: 'CREATE',
      customers: 'HIDDEN',
      finance: 'HIDDEN',
      reports: 'HIDDEN',
      appManagement: 'HIDDEN',
      activityLogs: 'HIDDEN',
      settings: 'HIDDEN',
    },
    'DLR-1003': {
      dashboard: 'VIEW',
      dealerManagement: 'HIDDEN',
      userManagement: 'HIDDEN',
      productMaster: 'VIEW',
      centralInventory: 'HIDDEN',
      dealerInventory: 'HIDDEN',
      stockTransfers: 'VIEW',
      orders: 'VIEW',
      customers: 'VIEW',
      finance: 'VIEW',
      reports: 'HIDDEN',
      appManagement: 'HIDDEN',
      activityLogs: 'HIDDEN',
      settings: 'HIDDEN',
    },
  });

  // Add Dealer Action
  const handleAddDealer = (e: React.FormEvent) => {
    e.preventDefault();
    const nextIdNum = 1000 + dealers.length + 1;
    const newId = `DLR-${nextIdNum}`;
    const newDealer: Dealer = {
      dealerId: newId,
      businessName: newDealerForm.businessName,
      ownerName: newDealerForm.ownerName,
      mobile: newDealerForm.mobile,
      email: newDealerForm.email,
      address: newDealerForm.address,
      city: newDealerForm.city,
      state: newDealerForm.state,
      pin: newDealerForm.pin,
      dealerType: newDealerForm.dealerType as any,
      priceGroup: newDealerForm.priceGroup as any,
      creditLimit: Number(newDealerForm.creditLimit),
      paymentTerms: 'NET_30',
      assignedWarehouse: newDealerForm.assignedWarehouse,
      accountStatus: 'ACTIVE',
      appId: `APP-${newId}-${Math.floor(1000 + Math.random() * 9000)}`,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDealers([...dealers, newDealer]);
    setDealerPermissions({
      ...dealerPermissions,
      [newId]: {
        dashboard: 'VIEW',
        dealerManagement: 'HIDDEN',
        userManagement: 'EDIT',
        productMaster: 'VIEW',
        centralInventory: 'HIDDEN',
        dealerInventory: 'EDIT',
        stockTransfers: 'CREATE',
        orders: 'CREATE',
        customers: 'VIEW',
        finance: 'VIEW',
        reports: 'VIEW',
        appManagement: 'HIDDEN',
        activityLogs: 'HIDDEN',
        settings: 'HIDDEN',
      },
    });

    setShowAddDealerModal(false);
    setSelectedDealer(newDealer);
    alert(`Dealer ${newDealer.businessName} created successfully with ID: ${newId}`);
  };

  // Toggle Dealer Account Status
  const toggleDealerStatus = (dealerId: string) => {
    setDealers(
      dealers.map((d) => {
        if (d.dealerId === dealerId) {
          const nextStatus = d.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          return { ...d, accountStatus: nextStatus };
        }
        return d;
      })
    );
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
            P
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Pixel Distributor</h1>
            <span className="text-xs text-indigo-400 font-medium">Admin Control Centre</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('dealers')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dealers' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Dealer Management
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'permissions' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Permission Matrix
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Inventory & Transfers
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Orders & Lifecycle
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Finance & Payments
          </button>

          <button
            onClick={() => setActiveTab('appManagement')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'appManagement' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            App & APK Releases
          </button>

          <button
            onClick={() => setActiveTab('excelHub')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'excelHub' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Staged ETL
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'activity' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Audit Journal
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Plan B: Active Full Platform
          </div>
          <div>Firestore Rules v2 Active</div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {activeTab === 'excelHub' ? 'Excel Staged ETL & Bulk Operations' : activeTab.replace(/([A-Z])/g, ' $1')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Central Master
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="http://localhost:5001/health"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Backend API Live
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>

            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center text-sm shadow-sm">
                NA
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-slate-700">Super Admin</div>
                <div className="text-slate-400">naren7703@gmail.com</div>
              </div>
            </div>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Dealers</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">{dealers.length}</div>
                    <div className="text-xs text-emerald-600 mt-1 font-medium">100% active operational</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Central Stock Valuation</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">₹3.85 Cr</div>
                    <div className="text-xs text-slate-500 mt-1">3 SKUs in Central Hub</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Box className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dealer Receivables</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">₹6.55 L</div>
                    <div className="text-xs text-amber-600 mt-1 font-medium">Within Credit Limits</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active APK Release</div>
                    <div className="text-2xl font-bold text-indigo-600 mt-1">v1.0.0</div>
                    <div className="text-xs text-slate-500 mt-1">Build 100 • Stable</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Smartphone className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Quick Scenario Showcase */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Multi-Tenant Dynamic Hydration Scenarios</h3>
                    <p className="text-xs text-slate-500">How the single unified codebase renders dynamically for each dealer</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded font-mono">Single Codebase</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-indigo-900 text-sm">Dealer A (Apex)</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-200 text-indigo-800">High Autonomy</span>
                    </div>
                    <p className="text-xs text-indigo-950 mb-3">Inventory: EDIT | Orders: CREATE+EDIT | Customers: VIEW | Payments: VIEW</p>
                    <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-indigo-100">
                      Renders sales card, stock management, order placing, and customer lookups.
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-emerald-900 text-sm">Dealer B (Supreme)</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">Restricted Counter</span>
                    </div>
                    <p className="text-xs text-emerald-950 mb-3">Inventory: VIEW | Orders: CREATE | Customers: HIDDEN | Reports: HIDDEN</p>
                    <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-emerald-100">
                      Customers, Reports, and Payments are completely stripped from UI and blocked at Firestore layer.
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-amber-900 text-sm">Dealer C (City Connect)</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-800">Order & Ledger</span>
                    </div>
                    <p className="text-xs text-amber-950 mb-3">Inventory: HIDDEN | Orders: VIEW | Customers: VIEW | Payments: VIEW</p>
                    <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-amber-100">
                      Stock counts are invisible. Reviews customer orders and payment receipts only.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEALERS MANAGEMENT */}
          {activeTab === 'dealers' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by business name or ID..."
                      className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowAddDealerModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add New Dealer
                </button>
              </div>

              {/* Dealer Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Dealer ID</th>
                      <th className="py-3.5 px-4">Business & Owner</th>
                      <th className="py-3.5 px-4">City / State</th>
                      <th className="py-3.5 px-4">Type / Tier</th>
                      <th className="py-3.5 px-4">Credit Limit</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dealers.map((dealer) => (
                      <tr key={dealer.dealerId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900">{dealer.dealerId}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{dealer.businessName}</div>
                          <div className="text-xs text-slate-400">{dealer.ownerName} • {dealer.mobile}</div>
                        </td>
                        <td className="py-3.5 px-4">{dealer.city}, {dealer.state}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                            {dealer.dealerType} • {dealer.priceGroup}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">₹{(dealer.creditLimit / 100000).toFixed(1)} Lakh</div>
                          <div className="text-xs text-slate-400">Used: ₹{(dealer.outstandingBalance / 1000).toFixed(0)}k</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              dealer.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {dealer.accountStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedDealer(dealer);
                              setActiveTab('permissions');
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Permissions
                          </button>
                          <button
                            onClick={() => toggleDealerStatus(dealer.dealerId)}
                            className={`text-xs font-medium ${
                              dealer.accountStatus === 'ACTIVE' ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'
                            }`}
                          >
                            {dealer.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PERMISSION MATRIX */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    6-Tier Capability Matrix Editor: <span className="text-indigo-600 font-mono">{selectedDealer.dealerId}</span>
                  </h3>
                  <p className="text-xs text-slate-500">Configuring access for {selectedDealer.businessName}</p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedDealer.dealerId}
                    onChange={(e) => {
                      const d = dealers.find((item) => item.dealerId === e.target.value);
                      if (d) setSelectedDealer(d);
                    }}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white font-medium"
                  >
                    {dealers.map((d) => (
                      <option key={d.dealerId} value={d.dealerId}>
                        {d.dealerId} — {d.businessName}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => alert(`Permissions for ${selectedDealer.dealerId} committed to Cloud Firestore!`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Save & Deploy Rules
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Functional Module</th>
                      <th className="py-3 px-4">Active Capability</th>
                      <th className="py-3 px-4">Capability Rank & Operational Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { key: 'inventory' as ModuleKey, label: 'Dealer Inventory', desc: 'Control local inventory quantities and stock audits' },
                      { key: 'orders' as ModuleKey, label: 'Order Placement', desc: 'Draft, place, and edit purchase orders' },
                      { key: 'customers' as ModuleKey, label: 'Customer Directory', desc: 'Create and look up dealer client database' },
                      { key: 'finance' as ModuleKey, label: 'Finance & Ledger', desc: 'Inspect payment ledger, receipts, and balance' },
                      { key: 'reports' as ModuleKey, label: 'Analytics Reports', desc: 'View monthly turnover and SKU sales charts' },
                    ].map((row) => {
                      const currentVal = dealerPermissions[selectedDealer.dealerId]?.[row.key] || 'HIDDEN';
                      return (
                        <tr key={row.key} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{row.label}</div>
                            <div className="text-xs text-slate-400">{row.desc}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={currentVal}
                              onChange={(e) => {
                                const nextVal = e.target.value as CapabilityLevel;
                                setDealerPermissions({
                                  ...dealerPermissions,
                                  [selectedDealer.dealerId]: {
                                    ...dealerPermissions[selectedDealer.dealerId],
                                    [row.key]: nextVal,
                                  },
                                });
                              }}
                              className={`border rounded-lg px-3 py-1.5 text-xs font-bold ${
                                currentVal === 'HIDDEN'
                                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                                  : currentVal === 'VIEW'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : currentVal === 'CREATE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : currentVal === 'EDIT'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              <option value="HIDDEN">HIDDEN (Rank 0)</option>
                              <option value="VIEW">VIEW (Rank 1)</option>
                              <option value="CREATE">CREATE (Rank 2)</option>
                              <option value="EDIT">EDIT (Rank 3)</option>
                              <option value="DELETE">DELETE (Rank 4)</option>
                              <option value="ADMIN">ADMIN (Rank 5)</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {currentVal === 'HIDDEN' && 'Module stripped from UI; Firestore reads & writes blocked.'}
                            {currentVal === 'VIEW' && 'Read-only access to lists and details. Mutations blocked.'}
                            {currentVal === 'CREATE' && 'Can view existing and submit new records.'}
                            {currentVal === 'EDIT' && 'Can view, submit, and update records in permitted states.'}
                            {currentVal === 'DELETE' && 'Can soft-delete or cancel owned records.'}
                            {currentVal === 'ADMIN' && 'Unrestricted administrative control over module.'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: INVENTORY & TRANSFERS */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Central Warehouse Catalog & Stock Ledger</h3>
                  <p className="text-xs text-slate-500">Transaction-based inventory: Stock is never manually overwritten</p>
                </div>
                <div className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Invariant: Δ Transactions = Live Balance
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">SKU / Product</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">MRP</th>
                      <th className="py-3.5 px-4">Purchase Cost (Admin Only)</th>
                      <th className="py-3.5 px-4">Dealer Price Tier 1</th>
                      <th className="py-3.5 px-4">Central Stock</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.productId} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900">{p.sku}</div>
                          <div className="text-xs text-slate-500">{p.name}</div>
                        </td>
                        <td className="py-3.5 px-4">{p.categoryName}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">₹{p.mrp.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-mono">
                          ₹{p.purchasePrice.toLocaleString()}
                          <span className="ml-1.5 text-xs text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Masked from Dealers</span>
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold">₹{p.dealerPrices.TIER_1.toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-bold font-mono">
                            {p.sku === 'PX-ULTRA-256' ? 250 : p.sku === 'PX-PRO-128' ? 180 : 400} PCS
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => alert(`Transfer initiated for SKU: ${p.sku}`)}
                            className="text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded border border-indigo-200 transition-colors"
                          >
                            Transfer to Dealer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: APP & APK RELEASES */}
          {activeTab === 'appManagement' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">In-App Version Control & APK Releases</h3>
                  <p className="text-xs text-slate-500">Specification Sections 17 & 18: Mandatory vs Optional updates, download portal</p>
                </div>
                <button
                  onClick={() => setShowNewReleaseModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  Publish New APK Release
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {releases.map((rel) => (
                  <div key={rel.releaseId} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-slate-900 font-mono">v{rel.version}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rel.status}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                        <div><strong className="text-slate-700">Version Code:</strong> {rel.versionCode}</div>
                        <div><strong className="text-slate-700">Size:</strong> {(rel.fileSize / 1000000).toFixed(1)} MB</div>
                        <div><strong className="text-slate-700">Mandatory Update:</strong> {rel.mandatory ? 'YES (Blocks App)' : 'NO (Dismissible)'}</div>
                        <div><strong className="text-slate-700">Min Supported:</strong> v{rel.minimumSupportedVersion}</div>
                      </div>
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 font-mono whitespace-pre-line">
                        {rel.releaseNotes}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href="/download"
                        target="_blank"
                        className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        Public Download Page <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: EXCEL STAGED ETL HUB */}
          {activeTab === 'excelHub' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">5-Stage Staged Excel Import / Export Hub</h3>
                  <p className="text-xs text-slate-500">Upload -&gt; Validate -&gt; Preview -&gt; Confirm -&gt; Atomic Import</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="http://localhost:5001/api/v1/excel/export/products"
                    className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg border border-slate-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Products.xlsx
                  </a>
                  <a
                    href="http://localhost:5001/api/v1/excel/export/dealers"
                    className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg border border-slate-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Dealers.xlsx
                  </a>
                </div>
              </div>

              {/* 5-Stage Diagram */}
              <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm">
                <div className="text-xs font-semibold uppercase text-indigo-400 tracking-wider mb-2">Stage Pipeline Integrity Gate</div>
                <div className="grid grid-cols-5 gap-3 text-center text-xs">
                  <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <div className="font-bold text-white mb-1">1. Upload</div>
                    <div className="text-slate-400">Drag & Drop .xlsx</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <div className="font-bold text-white mb-1">2. Validate</div>
                    <div className="text-slate-400">Zod & Duplicate Check</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <div className="font-bold text-white mb-1">3. Preview</div>
                    <div className="text-slate-400">Delta Diff vs Firestore</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <div className="font-bold text-white mb-1">4. Confirm</div>
                    <div className="text-slate-400">Admin Authorization</div>
                  </div>
                  <div className="bg-emerald-950 p-3 rounded border border-emerald-700">
                    <div className="font-bold text-emerald-400 mb-1">5. Commit</div>
                    <div className="text-emerald-200">Atomic Batched Write</div>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="bg-white p-8 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center hover:border-indigo-400 transition-colors">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Upload Excel Workbook for Staged Validation</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Supports Products.xlsx, Dealers.xlsx, Inventory.xlsx, PriceList.xlsx. Data is validated without overwriting production records until confirmed.
                </p>
                <button
                  onClick={() => alert('Excel file validated successfully! 100% rows valid, 0 errors. Ready for Stage 3 Preview.')}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Simulate Stage 2 Validation
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT JOURNAL */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Immutable Activity & Audit Journal</h3>
                  <p className="text-xs text-slate-500">Every sensitive operation is appended to an immutable audit record</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Timestamp</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Actor</th>
                      <th className="py-3.5 px-4">Target Entity</th>
                      <th className="py-3.5 px-4">Dealer Scope</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { time: 'Just now', action: 'DEALER_PROVISIONED', actor: 'admin@pixeldistributor.com', entity: 'dealers / DLR-1003', scope: 'DLR-1003' },
                      { time: '10 mins ago', action: 'STOCK_TRANSFER_DELIVERED', actor: 'admin@pixeldistributor.com', entity: 'stockTransfers / TRF-501', scope: 'DLR-1001' },
                      { time: '1 hour ago', action: 'ORDER_PLACED', actor: 'dealerA@apex.in', entity: 'orders / ORD-2026-8801', scope: 'DLR-1001' },
                      { time: '2 hours ago', action: 'APK_PUBLISHED', actor: 'admin@pixeldistributor.com', entity: 'appReleases / REL-v1.0.0', scope: 'CENTRAL' },
                    ].map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{log.time}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">{log.actor}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-800">{log.entity}</td>
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900">{log.scope}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ADD DEALER MODAL */}
      {showAddDealerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Add New Dealer</h3>
                <p className="text-xs text-slate-500">Automatically provisions Dealer ID, User ID, App ID, default permissions, and app config</p>
              </div>
              <button onClick={() => setShowAddDealerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDealer} className="space-y-4 pt-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={newDealerForm.businessName}
                    onChange={(e) => setNewDealerForm({ ...newDealerForm, businessName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Apex Communications"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={newDealerForm.ownerName}
                    onChange={(e) => setNewDealerForm({ ...newDealerForm, ownerName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={newDealerForm.mobile}
                    onChange={(e) => setNewDealerForm({ ...newDealerForm, mobile: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="+919876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newDealerForm.email}
                    onChange={(e) => setNewDealerForm({ ...newDealerForm, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="owner@dealer.in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={newDealerForm.address}
                  onChange={(e) => setNewDealerForm({ ...newDealerForm, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Plot / Shop number, Road, Area"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newDealerForm.city}
                    onChange={(e) => setNewDealerForm({ ...newDealerForm, city: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newDealerForm.state}
                    onChange={(e) => setNewDealerForm({ ...newDealerForm, state: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={newDealerForm.pin}
                    onChange={(e) => setNewDealerForm({ ...newDealerForm, pin: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="400001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dealer Type</label>
                  <select
                    value={newDealerForm.dealerType}
                    onChange={(e) => setNewDealerForm({ ...newDealerForm, dealerType: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="PLATINUM">PLATINUM</option>
                    <option value="GOLD">GOLD</option>
                    <option value="SILVER">SILVER</option>
                    <option value="STANDARD">STANDARD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price Group</label>
                  <select
                    value={newDealerForm.priceGroup}
                    onChange={(e) => setNewDealerForm({ ...newDealerForm, priceGroup: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="TIER_1">TIER 1 (Best)</option>
                    <option value="TIER_2">TIER 2</option>
                    <option value="STANDARD">STANDARD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit (INR)</label>
                  <input
                    type="number"
                    value={newDealerForm.creditLimit}
                    onChange={(e) => setNewDealerForm({ ...newDealerForm, creditLimit: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDealerModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Create & Provision Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH RELEASE MODAL */}
      {showNewReleaseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Publish Android APK Release</h3>
              <button onClick={() => setShowNewReleaseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semantic Version *</label>
                  <input
                    type="text"
                    defaultValue="1.1.0"
                    id="rel-ver"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Version Code *</label>
                  <input
                    type="number"
                    defaultValue={110}
                    id="rel-code"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Release Notes *</label>
                <textarea
                  id="rel-notes"
                  rows={3}
                  defaultValue="• Added barcode scanning for inventory&#10;• Improved offline sync"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="rel-mand" className="rounded text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="rel-mand" className="text-xs font-medium text-slate-700">
                  Mandatory Update (Blocks client use until updated)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewReleaseModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ver = (document.getElementById('rel-ver') as HTMLInputElement).value;
                    const code = parseInt((document.getElementById('rel-code') as HTMLInputElement).value, 10);
                    const notes = (document.getElementById('rel-notes') as HTMLTextAreaElement).value;
                    const mand = (document.getElementById('rel-mand') as HTMLInputElement).checked;

                    const newRel: AppRelease = {
                      releaseId: `REL-v${ver}`,
                      version: ver,
                      versionCode: code,
                      releaseDate: new Date().toISOString(),
                      downloadUrl: '/download',
                      checksum: 'b'.repeat(64),
                      fileSize: 19200000,
                      releaseNotes: notes,
                      minimumSupportedVersion: '1.0.0',
                      minimumVersionCode: 100,
                      mandatory: mand,
                      status: 'ACTIVE',
                      publishedBy: 'System Administrator',
                      createdAt: new Date().toISOString(),
                    };

                    setReleases([newRel, ...releases]);
                    setShowNewReleaseModal(false);
                    alert(`Release v${ver} (Build ${code}) successfully published to Cloud Storage & Firestore!`);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Publish & Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
