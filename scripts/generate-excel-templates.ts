import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATES_DIR = path.resolve(process.cwd(), 'excel/templates');

if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

console.log('Generating Excel templates in:', TEMPLATES_DIR);

// =============================================================================
// 1. Products.xlsx
// =============================================================================
const productsData = [
  {
    SKU: 'PX-ULTRA-256',
    Name: 'Pixel Ultra 256GB Titanium',
    Category: 'Smartphones',
    Brand: 'Pixel',
    Model: 'Ultra 2026',
    Unit: 'PCS',
    MRP: 74999,
    Purchase_Price: 52000,
    Dealer_Price_Tier1: 56000,
    Dealer_Price_Tier2: 58000,
    Reorder_Level: 10,
  },
  {
    SKU: 'PX-PRO-128',
    Name: 'Pixel Pro 128GB Obsidian',
    Category: 'Smartphones',
    Brand: 'Pixel',
    Model: 'Pro 2026',
    Unit: 'PCS',
    MRP: 59999,
    Purchase_Price: 41000,
    Dealer_Price_Tier1: 44000,
    Dealer_Price_Tier2: 46000,
    Reorder_Level: 15,
  },
  {
    SKU: 'PX-BUDS-PRO',
    Name: 'Pixel Buds Pro Wireless ANC',
    Category: 'Audio & Wearables',
    Brand: 'Pixel',
    Model: 'Buds Pro 2',
    Unit: 'PCS',
    MRP: 14999,
    Purchase_Price: 8500,
    Dealer_Price_Tier1: 9900,
    Dealer_Price_Tier2: 10500,
    Reorder_Level: 25,
  },
];

const wbProducts = XLSX.utils.book_new();
const wsProducts = XLSX.utils.json_to_sheet(productsData);
XLSX.utils.book_append_sheet(wbProducts, wsProducts, 'Products');
XLSX.writeFile(wbProducts, path.join(TEMPLATES_DIR, 'Products.xlsx'));
console.log('Created: Products.xlsx');

// =============================================================================
// 2. Dealers.xlsx
// =============================================================================
const dealersData = [
  {
    Dealer_ID: 'DLR-1001',
    Business_Name: 'Apex Telecom & Digital Store',
    Owner_Name: 'Rajesh Kumar',
    Mobile: '+919876543210',
    Email: 'rajesh@apextelecom.in',
    Address: '42 Ring Road, Commercial Zone',
    City: 'Mumbai',
    State: 'Maharashtra',
    PIN: '400093',
    Dealer_Type: 'GOLD',
    Price_Group: 'TIER_1',
    Credit_Limit: 500000,
    Assigned_Warehouse: 'WH-MUMBAI-01',
  },
  {
    Dealer_ID: 'DLR-1002',
    Business_Name: 'Supreme Mobiles & Gadgets',
    Owner_Name: 'Suresh Patel',
    Mobile: '+919811223344',
    Email: 'suresh@suprememobiles.in',
    Address: '88 Station Road, Sector 4',
    City: 'Ahmedabad',
    State: 'Gujarat',
    PIN: '380001',
    Dealer_Type: 'PLATINUM',
    Price_Group: 'TIER_1',
    Credit_Limit: 1000000,
    Assigned_Warehouse: 'WH-AHM-01',
  },
  {
    Dealer_ID: 'DLR-1003',
    Business_Name: 'City Connect Retail Hub',
    Owner_Name: 'Anil Deshmukh',
    Mobile: '+919922334455',
    Email: 'anil@cityconnect.in',
    Address: '15 Gandhi Square, Market Area',
    City: 'Pune',
    State: 'Maharashtra',
    PIN: '411001',
    Dealer_Type: 'STANDARD',
    Price_Group: 'STANDARD',
    Credit_Limit: 250000,
    Assigned_Warehouse: 'WH-MUMBAI-01',
  },
];

const wbDealers = XLSX.utils.book_new();
const wsDealers = XLSX.utils.json_to_sheet(dealersData);
XLSX.utils.book_append_sheet(wbDealers, wsDealers, 'Dealers');
XLSX.writeFile(wbDealers, path.join(TEMPLATES_DIR, 'Dealers.xlsx'));
console.log('Created: Dealers.xlsx');

// =============================================================================
// 3. Inventory.xlsx
// =============================================================================
const inventoryData = [
  {
    Warehouse_ID: 'WH-MUMBAI-01',
    SKU: 'PX-ULTRA-256',
    Product_Name: 'Pixel Ultra 256GB Titanium',
    Opening_Quantity: 150,
    Reorder_Level: 20,
    Unit_Cost: 52000,
  },
  {
    Warehouse_ID: 'WH-MUMBAI-01',
    SKU: 'PX-PRO-128',
    Product_Name: 'Pixel Pro 128GB Obsidian',
    Opening_Quantity: 200,
    Reorder_Level: 25,
    Unit_Cost: 41000,
  },
  {
    Warehouse_ID: 'WH-MUMBAI-01',
    SKU: 'PX-BUDS-PRO',
    Product_Name: 'Pixel Buds Pro Wireless ANC',
    Opening_Quantity: 500,
    Reorder_Level: 50,
    Unit_Cost: 8500,
  },
];

const wbInventory = XLSX.utils.book_new();
const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
XLSX.utils.book_append_sheet(wbInventory, wsInventory, 'Inventory');
XLSX.writeFile(wbInventory, path.join(TEMPLATES_DIR, 'Inventory.xlsx'));
console.log('Created: Inventory.xlsx');

// =============================================================================
// 4. PriceList.xlsx
// =============================================================================
const priceListData = [
  {
    SKU: 'PX-ULTRA-256',
    Product_Name: 'Pixel Ultra 256GB Titanium',
    MRP: 74999,
    Dealer_Tier_1: 56000,
    Dealer_Tier_2: 58000,
    Dealer_Tier_3: 60000,
    Standard_Dealer: 62000,
  },
  {
    SKU: 'PX-PRO-128',
    Product_Name: 'Pixel Pro 128GB Obsidian',
    MRP: 59999,
    Dealer_Tier_1: 44000,
    Dealer_Tier_2: 46000,
    Dealer_Tier_3: 48000,
    Standard_Dealer: 50000,
  },
  {
    SKU: 'PX-BUDS-PRO',
    Product_Name: 'Pixel Buds Pro Wireless ANC',
    MRP: 14999,
    Dealer_Tier_1: 9900,
    Dealer_Tier_2: 10500,
    Dealer_Tier_3: 11000,
    Standard_Dealer: 11500,
  },
];

const wbPriceList = XLSX.utils.book_new();
const wsPriceList = XLSX.utils.json_to_sheet(priceListData);
XLSX.utils.book_append_sheet(wbPriceList, wsPriceList, 'PriceList');
XLSX.writeFile(wbPriceList, path.join(TEMPLATES_DIR, 'PriceList.xlsx'));
console.log('Created: PriceList.xlsx');

// =============================================================================
// 5. Pixel_Distributor_Admin.xlsx (16 Master Worksheets)
// =============================================================================
const wbAdmin = XLSX.utils.book_new();

const masterSheets: { name: string; sample: Record<string, unknown>[] }[] = [
  {
    name: 'DASHBOARD',
    sample: [
      { Metric: 'Total Active Dealers', Value: 42 },
      { Metric: 'Total Warehouse Valuation (INR)', Value: 12500000 },
      { Metric: 'Outstanding Receivables (INR)', Value: 3400000 },
      { Metric: 'Orders Pending Dispatch', Value: 14 },
    ],
  },
  { name: 'DEALER_MASTER', sample: dealersData },
  {
    name: 'USER_ACCOUNTS',
    sample: [
      {
        User_ID: 'usr_admin_01',
        Dealer_ID: 'CENTRAL',
        Email: 'admin@pixeldistributor.com',
        Display_Name: 'System Administrator',
        Phone: '+919800000001',
        Role: 'SUPER_ADMIN',
        Status: 'ACTIVE',
      },
      {
        User_ID: 'usr_dlr_1001',
        Dealer_ID: 'DLR-1001',
        Email: 'rajesh@apextelecom.in',
        Display_Name: 'Rajesh Kumar',
        Phone: '+919876543210',
        Role: 'DEALER',
        Status: 'ACTIVE',
      },
    ],
  },
  {
    name: 'PERMISSIONS',
    sample: [
      {
        Dealer_ID: 'DLR-1001',
        User_ID: 'usr_dlr_1001',
        Dashboard: 'VIEW',
        Inventory: 'EDIT',
        Orders: 'EDIT',
        Customers: 'VIEW',
        Payments: 'VIEW',
        Reports: 'VIEW',
      },
      {
        Dealer_ID: 'DLR-1002',
        User_ID: 'usr_dlr_1002',
        Dashboard: 'VIEW',
        Inventory: 'VIEW',
        Orders: 'CREATE',
        Customers: 'HIDDEN',
        Payments: 'HIDDEN',
        Reports: 'HIDDEN',
      },
    ],
  },
  { name: 'PRODUCT_MASTER', sample: productsData },
  { name: 'INVENTORY', sample: inventoryData },
  {
    name: 'STOCK_IN',
    sample: [
      {
        Entry_ID: 'INW-8001',
        Date: '2026-09-20',
        Warehouse_ID: 'WH-MUMBAI-01',
        SKU: 'PX-ULTRA-256',
        Quantity: 100,
        Vendor: 'Pixel Global Mfg',
        Invoice_Ref: 'INV-GL-991',
      },
    ],
  },
  {
    name: 'STOCK_OUT',
    sample: [
      {
        Exit_ID: 'OUT-9001',
        Date: '2026-09-22',
        Warehouse_ID: 'WH-MUMBAI-01',
        SKU: 'PX-BUDS-PRO',
        Quantity: 2,
        Reason: 'DAMAGED',
        Approved_By: 'usr_inv_mgr',
      },
    ],
  },
  {
    name: 'STOCK_TRANSFER',
    sample: [
      {
        Transfer_ID: 'TRF-501',
        Date: '2026-09-23',
        Source_Warehouse: 'WH-MUMBAI-01',
        Destination_Dealer: 'DLR-1001',
        SKU: 'PX-ULTRA-256',
        Quantity: 25,
        Status: 'DELIVERED',
        Tracking_Ref: 'BLUEDART-88210',
      },
    ],
  },
  {
    name: 'ORDERS',
    sample: [
      {
        Order_ID: 'ORD-2026-01',
        Date: '2026-09-24',
        Dealer_ID: 'DLR-1001',
        Customer_Name: 'Apex Walkin',
        Grand_Total: 112000,
        Status: 'COMPLETED',
        Payment_Status: 'PAID',
      },
    ],
  },
  {
    name: 'CUSTOMERS',
    sample: [
      {
        Customer_ID: 'CUST-101',
        Dealer_ID: 'DLR-1001',
        Customer_Name: 'Rohan Mehta',
        Phone: '+919833445566',
        City: 'Mumbai',
        Total_Orders: 3,
        Total_Spent: 184000,
      },
    ],
  },
  {
    name: 'PAYMENTS',
    sample: [
      {
        Payment_ID: 'PAY-401',
        Date: '2026-09-24',
        Dealer_ID: 'DLR-1001',
        Amount: 112000,
        Mode: 'UPI',
        Reference_Number: 'UPI/260924/8819',
        Status: 'VERIFIED',
      },
    ],
  },
  {
    name: 'REPORTS',
    sample: [
      { Report_Type: 'Monthly Sales by Dealer', Metric_Period: 'September 2026' },
    ],
  },
  {
    name: 'APP_CONFIG',
    sample: [
      {
        Dealer_ID: 'DLR-1001',
        Price_Visibility: 'DEALER_AND_MRP',
        MRP_Visible: true,
        Cost_Visible: false,
        Can_Create_Orders: true,
        Can_Request_Stock: true,
      },
    ],
  },
  {
    name: 'ACTIVITY_LOG',
    sample: [
      {
        Timestamp: '2026-09-24T10:00:00Z',
        Actor: 'admin@pixeldistributor.com',
        Action: 'SYSTEM_INITIALIZED',
        Entity: 'SYSTEM',
        Entity_ID: 'SYS-01',
      },
    ],
  },
  {
    name: 'SETTINGS',
    sample: [
      { Setting_Key: 'STANDARD_TAX_RATE', Setting_Value: '18%' },
      { Setting_Key: 'STANDARD_CREDIT_TERMS_DAYS', Setting_Value: '30' },
      { Setting_Key: 'MINIMUM_APP_VERSION', Setting_Value: '1.0.0' },
    ],
  },
];

for (const sheet of masterSheets) {
  const ws = XLSX.utils.json_to_sheet(sheet.sample);
  XLSX.utils.book_append_sheet(wbAdmin, ws, sheet.name);
}

XLSX.writeFile(wbAdmin, path.join(TEMPLATES_DIR, 'Pixel_Distributor_Admin.xlsx'));
console.log('Created Master Workbook with 16 Sheets: Pixel_Distributor_Admin.xlsx');
console.log('Excel generation finished successfully.');
