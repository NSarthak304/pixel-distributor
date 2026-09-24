import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  User,
  Download,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  ExternalLink,
  Shield,
  Smartphone,
  ChevronRight,
  Wifi,
  WifiOff,
  Search,
  Plus,
  RefreshCw,
  Lock,
} from 'lucide-react';
import {
  Dealer,
  Product,
  Order,
  AppRelease,
  CapabilityLevel,
  ModuleKey,
  DashboardCardKey,
} from '@pixel/shared';

// Pre-configured Tenant Scenarios (Specification Section 7)
interface TenantContext {
  dealer: Dealer;
  modules: Record<ModuleKey, CapabilityLevel>;
  dashboardCards: DashboardCardKey[];
  priceVisibility: 'DEALER_ONLY' | 'DEALER_AND_MRP';
}

const TENANTS: Record<'DEALER_A' | 'DEALER_B' | 'DEALER_C', TenantContext> = {
  DEALER_A: {
    dealer: {
      dealerId: 'DLR-1001',
      businessName: 'Apex Telecom & Digital Store',
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
    modules: {
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
    dashboardCards: ['sales', 'orders', 'inventory', 'outstanding', 'customers'],
    priceVisibility: 'DEALER_AND_MRP',
  },
  DEALER_B: {
    dealer: {
      dealerId: 'DLR-1002',
      businessName: 'Supreme Mobiles & Counter',
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
    modules: {
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
    dashboardCards: ['orders', 'inventory'],
    priceVisibility: 'DEALER_ONLY',
  },
  DEALER_C: {
    dealer: {
      dealerId: 'DLR-1003',
      businessName: 'City Connect Retail Hub',
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
    modules: {
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
    dashboardCards: ['orders', 'outstanding'],
    priceVisibility: 'DEALER_ONLY',
  },
};

const sampleProducts: Product[] = [
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
    purchasePrice: 52000, // Invariant: must be masked
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

export default function App() {
  const [currentTenantKey, setCurrentTenantKey] = useState<'DEALER_A' | 'DEALER_B' | 'DEALER_C'>('DEALER_A');
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'inventory' | 'orders' | 'customers' | 'finance' | 'reports' | 'download'>('dashboard');
  const [isOffline, setIsOffline] = useState(false);
  const [showMandatoryUpdateModal, setShowMandatoryUpdateModal] = useState(false);

  const tenant = TENANTS[currentTenantKey];
  const permissions = tenant.modules;

  // Evaluate capability
  const canAccess = (mod: ModuleKey): boolean => {
    return permissions[mod] !== undefined && permissions[mod] !== 'HIDDEN';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-6 font-sans">
      {/* SIMULATOR TOP BAR */}
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-3 mb-3 border border-slate-700 flex flex-col gap-2 shadow-lg">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-indigo-400">
            <Smartphone className="w-4 h-4" />
            Pixel Distributor • Unified PWA / APK
          </div>
          <button
            onClick={() => setActiveScreen(activeScreen === 'download' ? 'dashboard' : 'download')}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded text-xs font-semibold"
          >
            <Download className="w-3 h-3" />
            {activeScreen === 'download' ? 'Back to App' : '/download Portal'}
          </button>
        </div>

        {/* Tenant Switching Bar */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-700 text-xs">
          <span className="text-slate-400 font-medium">Switch Tenant:</span>
          <button
            onClick={() => {
              setCurrentTenantKey('DEALER_A');
              setActiveScreen('dashboard');
            }}
            className={`px-2 py-1 rounded font-semibold transition-all ${
              currentTenantKey === 'DEALER_A' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            Dealer A (Full)
          </button>
          <button
            onClick={() => {
              setCurrentTenantKey('DEALER_B');
              setActiveScreen('dashboard');
            }}
            className={`px-2 py-1 rounded font-semibold transition-all ${
              currentTenantKey === 'DEALER_B' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            Dealer B (Counter)
          </button>
          <button
            onClick={() => {
              setCurrentTenantKey('DEALER_C');
              setActiveScreen('dashboard');
            }}
            className={`px-2 py-1 rounded font-semibold transition-all ${
              currentTenantKey === 'DEALER_C' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            Dealer C (Ledger)
          </button>
        </div>
      </div>

      {/* MOBILE DEVICE CONTAINER */}
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl flex flex-col h-[740px] overflow-hidden relative">
        {/* NETWORK & STATUS BANNER */}
        <div className="bg-slate-900 text-white px-5 pt-3 pb-2 flex items-center justify-between text-xs select-none">
          <span className="font-semibold font-mono">09:41</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOffline(!isOffline)}
              title="Click to toggle offline mode simulation"
              className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white"
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-bold">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Online</span>
                </>
              )}
            </button>
            <div className="w-5 h-2.5 border border-white rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-white rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* OFFLINE AMBER BANNER */}
        {isOffline && (
          <div className="bg-amber-500 text-slate-950 px-3 py-1.5 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <span>Offline Mode Active • Caching queries locally</span>
            <RefreshCw className="w-3 h-3 animate-spin" />
          </div>
        )}

        {/* APP HEADER */}
        {activeScreen !== 'download' && (
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="text-[11px] text-indigo-400 font-semibold font-mono tracking-wide">
                {tenant.dealer.dealerId} • {tenant.dealer.dealerType}
              </div>
              <div className="text-sm font-bold truncate max-w-[240px]">{tenant.dealer.businessName}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 border border-slate-700">
              {tenant.dealer.ownerName[0]}
            </div>
          </div>
        )}

        {/* APP BODY (SCREENS) */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {/* SCREEN: DOWNLOAD PORTAL */}
          {activeScreen === 'download' && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
                <Smartphone className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Pixel Distributor Android App</h3>
                <p className="text-xs text-slate-500 mt-0.5">Unified Multi-Tenant Android Distribution</p>
              </div>

              {/* Release Metadata Card (Specification Section 16) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Current Release</span>
                  <span className="font-bold text-indigo-600 font-mono">v1.0.0 (Build 100)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Release Date</span>
                  <span className="font-medium text-slate-800">September 24, 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">File Size</span>
                  <span className="font-medium text-slate-800">18.45 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Min Android OS</span>
                  <span className="font-medium text-slate-800">Android 7.0+ (API 24)</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[10px] block font-mono truncate">
                    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...
                  </span>
                </div>
              </div>

              {/* Download CTA Button */}
              <button
                onClick={() => alert('Starting download: pixel-distributor-v1.0.0.apk\nAndroid PackageInstaller will launch automatically.')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all text-sm"
              >
                <Download className="w-4 h-4" />
                DOWNLOAD ANDROID APP
              </button>

              {/* Simulated QR Code for Handheld Device Scanner */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-center shadow-sm">
                <div className="w-28 h-28 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center p-2 mb-2">
                  <QrCode className="w-20 h-20 text-slate-800" />
                </div>
                <span className="text-xs text-slate-500 font-medium">Scan with Warehouse Handheld Device</span>
              </div>

              {/* Mandatory Update Simulation Trigger */}
              <button
                onClick={() => setShowMandatoryUpdateModal(true)}
                className="text-xs text-rose-600 font-semibold hover:underline"
              >
                Simulate Mandatory In-App Update Alert
              </button>
            </div>
          )}

          {/* SCREEN: DASHBOARD */}
          {activeScreen === 'dashboard' && (
            <div className="space-y-4">
              {/* Credit Meter Card */}
              <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
                  <span>Available Credit Line</span>
                  <span className="font-mono">Terms: {tenant.dealer.paymentTerms}</span>
                </div>
                <div className="text-2xl font-bold font-mono">
                  ₹{((tenant.dealer.creditLimit - tenant.dealer.outstandingBalance) / 1000).toFixed(0)},000
                </div>
                <div className="mt-3 w-full bg-indigo-950/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-300 h-full rounded-full"
                    style={{ width: `${(tenant.dealer.outstandingBalance / tenant.dealer.creditLimit) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-indigo-300 mt-1 font-mono">
                  <span>Used: ₹{(tenant.dealer.outstandingBalance / 1000).toFixed(0)}k</span>
                  <span>Limit: ₹{(tenant.dealer.creditLimit / 1000).toFixed(0)}k</span>
                </div>
              </div>

              {/* Dynamic Dashboard Cards (Configured by Admin per dealer) */}
              <div className="grid grid-cols-2 gap-3">
                {tenant.dashboardCards.includes('sales') && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">MTD Sales</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">₹3.42 L</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">↑ 18% vs last mo</div>
                  </div>
                )}

                {tenant.dashboardCards.includes('orders') && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Active Orders</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">4 Pending</div>
                    <div className="text-[10px] text-indigo-600 font-semibold mt-1">In Processing</div>
                  </div>
                )}

                {tenant.dashboardCards.includes('inventory') && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Dealer Stock</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">85 PCS</div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-1">3 Low-stock SKUs</div>
                  </div>
                )}

                {tenant.dashboardCards.includes('outstanding') && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Outstanding</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">₹{(tenant.dealer.outstandingBalance / 1000).toFixed(0)}k</div>
                    <div className="text-[10px] text-amber-600 font-semibold mt-1">Due in 12 days</div>
                  </div>
                )}

                {tenant.dashboardCards.includes('customers') && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Registered Customers</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">14 Retail Clients</div>
                  </div>
                )}
              </div>

              {/* Dynamic Feature Notice */}
              <div className="bg-slate-100 p-3.5 rounded-xl text-xs text-slate-600 border border-slate-200">
                <div className="font-semibold text-slate-800 mb-0.5">Active Tenant Scope:</div>
                <div>Price Visibility: <strong className="text-slate-900">{tenant.priceVisibility}</strong></div>
                <div>Purchase Cost: <strong className="text-rose-600">Masked (Hidden)</strong></div>
                <div>Customers Module: <strong>{permissions.customers}</strong></div>
              </div>
            </div>
          )}

          {/* SCREEN: INVENTORY */}
          {activeScreen === 'inventory' && canAccess('dealerInventory') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Product Catalog & Stock</h3>
                {permissions.stockTransfers === 'CREATE' && (
                  <button
                    onClick={() => alert('Stock replenishment request dispatched to WH-MUMBAI-01')}
                    className="text-xs font-semibold bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg shadow-sm"
                  >
                    Request Stock
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {sampleProducts.map((p) => {
                  const dealerPrice = p.dealerPrices[tenant.dealer.priceGroup as keyof typeof p.dealerPrices] || p.dealerPrices.STANDARD;
                  return (
                    <div key={p.productId} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="font-mono text-[10px] text-indigo-600 font-bold">{p.sku}</div>
                        <div className="text-xs font-bold text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Dealer Price: <strong className="text-slate-900">₹{dealerPrice.toLocaleString()}</strong>
                          {tenant.priceVisibility === 'DEALER_AND_MRP' && (
                            <span className="text-slate-400 ml-1.5">(MRP: ₹{p.mrp.toLocaleString()})</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          {p.sku === 'PX-ULTRA-256' ? 30 : p.sku === 'PX-PRO-128' ? 45 : 10} PCS
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">In Stock</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN: ORDERS */}
          {activeScreen === 'orders' && canAccess('orders') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Orders</h3>
                {permissions.orders === 'CREATE' || permissions.orders === 'EDIT' ? (
                  <button
                    onClick={() => alert(`New order placed successfully for ${tenant.dealer.businessName}!`)}
                    className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Place Order
                  </button>
                ) : null}
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-indigo-600">ORD-2026-8801</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    PROCESSING
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-medium">2x Pixel Ultra 256GB Titanium</div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-400">Total: ₹1,12,000</span>
                  <span className="text-slate-500 font-mono text-[10px]">Sep 24, 2026</span>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: CUSTOMERS (Gated by permission) */}
          {activeScreen === 'customers' && canAccess('customers') && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Customers Directory</h3>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <div className="font-semibold text-xs text-slate-800">Rohan Mehta (Tech Enterprises)</div>
                <div className="text-xs text-slate-500">+91 9833445566 • Mumbai</div>
                <div className="text-[10px] text-slate-400 pt-1">Total Purchases: ₹1.84 Lakh</div>
              </div>
            </div>
          )}

          {/* SCREEN: FINANCE / PAYMENTS (Gated by permission) */}
          {activeScreen === 'finance' && canAccess('finance') && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Ledger & Payments</h3>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-700">PAY-3310</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">VERIFIED</span>
                </div>
                <div className="text-sm font-bold text-slate-900">₹1,12,000 (UPI)</div>
                <div className="text-[10px] text-slate-400 font-mono">Ref: UPI/260924/8819</div>
              </div>
            </div>
          )}

          {/* SCREEN: REPORTS (Gated by permission) */}
          {activeScreen === 'reports' && canAccess('reports') && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Analytics & Reports</h3>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2">
                <div className="font-semibold text-slate-800">Monthly Sales Turnover</div>
                <div className="h-20 bg-slate-50 rounded border border-slate-100 flex items-end justify-between p-2">
                  <div className="w-8 bg-indigo-300 h-10 rounded-t"></div>
                  <div className="w-8 bg-indigo-400 h-14 rounded-t"></div>
                  <div className="w-8 bg-indigo-500 h-12 rounded-t"></div>
                  <div className="w-8 bg-indigo-600 h-16 rounded-t"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR (Dyamically mounts ONLY permitted modules) */}
        {activeScreen !== 'download' && (
          <nav className="h-16 bg-white border-t border-slate-200 px-3 flex items-center justify-around text-[10px] font-medium text-slate-500">
            <button
              onClick={() => setActiveScreen('dashboard')}
              className={`flex flex-col items-center gap-1 ${
                activeScreen === 'dashboard' ? 'text-indigo-600 font-bold' : 'hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Home
            </button>

            {canAccess('dealerInventory') && (
              <button
                onClick={() => setActiveScreen('inventory')}
                className={`flex flex-col items-center gap-1 ${
                  activeScreen === 'inventory' ? 'text-indigo-600 font-bold' : 'hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                Stock
              </button>
            )}

            {canAccess('orders') && (
              <button
                onClick={() => setActiveScreen('orders')}
                className={`flex flex-col items-center gap-1 ${
                  activeScreen === 'orders' ? 'text-indigo-600 font-bold' : 'hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Orders
              </button>
            )}

            {canAccess('customers') && (
              <button
                onClick={() => setActiveScreen('customers')}
                className={`flex flex-col items-center gap-1 ${
                  activeScreen === 'customers' ? 'text-indigo-600 font-bold' : 'hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Clients
              </button>
            )}

            {canAccess('finance') && (
              <button
                onClick={() => setActiveScreen('finance')}
                className={`flex flex-col items-center gap-1 ${
                  activeScreen === 'finance' ? 'text-indigo-600 font-bold' : 'hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Ledger
              </button>
            )}

            {canAccess('reports') && (
              <button
                onClick={() => setActiveScreen('reports')}
                className={`flex flex-col items-center gap-1 ${
                  activeScreen === 'reports' ? 'text-indigo-600 font-bold' : 'hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Reports
              </button>
            )}
          </nav>
        )}

        {/* MANDATORY IN-APP UPDATE MODAL (Specification Section 17) */}
        {showMandatoryUpdateModal && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 p-6 flex flex-col justify-center items-center text-center text-white">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold">Mandatory Update Required</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              Version 1.0.0 is no longer supported. Please update to version 1.1.0 to continue using Pixel Distributor.
            </p>
            <div className="mt-6 w-full space-y-2">
              <button
                onClick={() => {
                  alert('Launching Android PackageInstaller intent for pixel-app-v1.1.0.apk...');
                  setShowMandatoryUpdateModal(false);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs shadow-lg"
              >
                UPDATE NOW VIA ANDROID INSTALLER
              </button>
              <div className="text-[10px] text-slate-400">
                Non-silent install adhering to Android FileProvider security
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
