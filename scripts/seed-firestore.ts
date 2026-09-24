/**
 * Pixel Distributor - Live Cloud Firestore Seeder & Connection Verifier
 *
 * Populates the live Google Firebase project 'pixel-distributor' with
 * the baseline product catalog, warehouses, admin identity, and dealer records.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCyFd55v9H9wibtxb95Z4GiGMnnZqmRQaM",
  authDomain: "pixel-distributor.firebaseapp.com",
  databaseURL: "https://pixel-distributor-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pixel-distributor",
  storageBucket: "pixel-distributor.firebasestorage.app",
  messagingSenderId: "1729902731",
  appId: "1:1729902731:web:cf4e5e01b58fa98b73fc8e",
  measurementId: "G-CGWYDQ56DM",
};

async function seedLiveFirestore() {
  console.log('================================================================');
  console.log('   PIXEL DISTRIBUTOR — CONNECTING TO LIVE CLOUD FIRESTORE');
  console.log(`   Project ID: ${firebaseConfig.projectId}`);
  console.log('================================================================');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const now = new Date().toISOString();

  try {
    // 1. Central Warehouse
    console.log('[1/7] Seeding Central Warehouse...');
    await setDoc(doc(db, 'warehouses', 'WH-MUMBAI-01'), {
      warehouseId: 'WH-MUMBAI-01',
      name: 'Central Mumbai Fulfillment Hub',
      address: 'Plot 18, Kurla Industrial Estate',
      city: 'Mumbai',
      state: 'Maharashtra',
      contactPerson: 'Sanjay Verma',
      contactPhone: '+919820011223',
      isActive: true,
      updatedAt: now,
    });
    console.log('✓ Warehouse WH-MUMBAI-01 synced.');

    // 2. Super Admin User
    console.log('[2/7] Seeding Central Super Admin User...');
    await setDoc(doc(db, 'users', 'usr_admin_naren'), {
      userId: 'usr_admin_naren',
      dealerId: 'CENTRAL',
      email: 'naren7703@gmail.com',
      displayName: 'Naren (Super Admin)',
      phone: '+919876543210',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });
    console.log('✓ Super Admin naren7703@gmail.com synced.');

    // 3. Product Catalog
    console.log('[3/7] Seeding Product Master Catalog...');
    const products = [
      {
        productId: 'PRD-101',
        sku: 'PX-ULTRA-256',
        name: 'Pixel Ultra 256GB Titanium',
        category: 'SMARTPHONES',
        brand: 'Pixel Flagship',
        purchasePrice: 42000,
        dealerPrice: 48000,
        mrp: 56000,
        minOrderQuantity: 5,
        isActive: true,
        warrantyMonths: 12,
        specifications: { ram: '12GB', storage: '256GB', color: 'Titanium Gray' },
        updatedAt: now,
      },
      {
        productId: 'PRD-102',
        sku: 'PX-PRO-128',
        name: 'Pixel Pro 128GB Obsidian',
        category: 'SMARTPHONES',
        brand: 'Pixel Flagship',
        purchasePrice: 32000,
        dealerPrice: 37000,
        mrp: 44000,
        minOrderQuantity: 5,
        isActive: true,
        warrantyMonths: 12,
        specifications: { ram: '8GB', storage: '128GB', color: 'Obsidian Black' },
        updatedAt: now,
      },
      {
        productId: 'PRD-103',
        sku: 'PX-BUDS-PRO',
        name: 'Pixel Buds Pro ANC Wireless',
        category: 'AUDIO',
        brand: 'Pixel Audio',
        purchasePrice: 7500,
        dealerPrice: 9500,
        mrp: 12900,
        minOrderQuantity: 10,
        isActive: true,
        warrantyMonths: 6,
        specifications: { anc: 'Active Noise Cancellation', batteryHours: '31h' },
        updatedAt: now,
      },
    ];

    for (const p of products) {
      await setDoc(doc(db, 'products', p.productId), p);
    }
    console.log(`✓ ${products.length} products synced to catalog.`);

    // 4. Central Inventory Balance
    console.log('[4/7] Seeding Central Inventory Balances...');
    await setDoc(doc(db, 'inventory', 'WH-MUMBAI-01_PX-ULTRA-256'), {
      inventoryId: 'WH-MUMBAI-01_PX-ULTRA-256',
      locationType: 'CENTRAL_WAREHOUSE',
      locationId: 'WH-MUMBAI-01',
      sku: 'PX-ULTRA-256',
      productId: 'PRD-101',
      quantityOnHand: 250,
      quantityAllocated: 0,
      quantityAvailable: 250,
      reorderPoint: 20,
      lastCountDate: now,
    });
    console.log('✓ Central inventory synced.');

    // 5. Initial Dealers
    console.log('[5/7] Seeding Production Dealers & Profiles...');
    const dealers = [
      {
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
        createdAt: now,
        updatedAt: now,
      },
      {
        dealerId: 'DLR-1002',
        businessName: 'Supreme Mobiles & Electronics',
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
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const d of dealers) {
      await setDoc(doc(db, 'dealers', d.dealerId), d);
    }
    console.log(`✓ ${dealers.length} active dealers synced.`);

    // 6. Active App Release
    console.log('[6/7] Seeding APK Production Release Record...');
    await setDoc(doc(db, 'appReleases', 'REL-v1.0.0'), {
      releaseId: 'REL-v1.0.0',
      version: '1.0.0',
      versionCode: 100,
      releaseDate: now,
      downloadUrl: '/releases/pixel-distributor-v1.0.0.apk',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      fileSize: 18450120,
      releaseNotes: '• Production Release for Pixel Distributor Network\n• Dynamic dealer chameleon hydration\n• Offline cache and multi-tenant ledger synchronization',
      minimumSupportedVersion: '1.0.0',
      minimumVersionCode: 100,
      mandatory: false,
      status: 'ACTIVE',
      publishedBy: 'usr_admin_naren',
      createdAt: now,
    });
    console.log('✓ APK release record synced.');

    // 7. Verify Read
    console.log('[7/7] Verifying live Cloud Firestore read-back...');
    const verifySnap = await getDoc(doc(db, 'dealers', 'DLR-1001'));
    if (verifySnap.exists()) {
      console.log('✓ Successfully verified document read from live Firestore:', verifySnap.data().businessName);
    }

    console.log('================================================================');
    console.log('   LIVE CLOUD FIRESTORE SEEDING & CONNECTION: 100% SUCCESSFUL!  ');
    console.log('================================================================');
  } catch (error: any) {
    console.error('Error during Firestore connection/seeding:', error.message);
    if (error.code === 'permission-denied') {
      console.error('\nNOTE: Firestore Security Rules on the project blocked write access.');
      console.error('Please ensure Firestore Database is created in test/dev mode or deploy rules.\n');
    }
    process.exit(1);
  }
}

seedLiveFirestore();
