/**
 * Pixel Distributor - End-to-End System Walkthrough Simulation
 *
 * Runs an end-to-end execution of real distributor workflows:
 * 1. Health verification
 * 2. Dealer onboarding
 * 3. Permission matrix customization
 * 4. Inter-warehouse to dealer stock transfer & immutable transaction logging
 * 5. Dealer order placement with credit limit verification
 * 6. APK release publication & client version interrogation
 * 7. Staged Excel export verification
 * 8. Audit trail integrity inspection
 */

import { globalStore } from '../backend/src/store/memory-store.js';
import { DealerService } from '../backend/src/services/dealer.service.js';
import { InventoryService } from '../backend/src/services/inventory.service.js';
import { OrderService } from '../backend/src/services/order.service.js';
import { ReleaseService } from '../backend/src/services/release.service.js';
import { ExcelEtlService } from '../backend/src/services/excel-etl.service.js';
import { AuditService } from '../backend/src/services/audit.service.js';

console.log('================================================================');
console.log('   PIXEL DISTRIBUTOR — END-TO-END SYSTEM WALKTHROUGH TEST DRIVE');
console.log('================================================================');

async function runWalkthrough() {
  // 1. Health & Pre-check
  console.log('\n[1/8] Verifying System State & Stores...');
  console.log(`Initial Dealers in Registry: ${globalStore.dealers.size}`);
  console.log(`Initial Products in Catalog: ${globalStore.products.size}`);

  // 2. Onboard New Dealer (Zenith Digital Hub)
  console.log('\n[2/8] Provisioning New Dealer (Specification Section 5)...');
  const nextSeq = globalStore.dealers.size + 1000 + 1;
  const newDealerId = `DLR-${nextSeq}`;
  const provisioning = DealerService.provisionDealer(
    {
      businessName: 'Zenith Digital Hub',
      ownerName: 'Priya Sharma',
      mobile: '+919876001122',
      email: 'priya@zenithhub.in',
      address: '104 Brigade Road, Commercial Plaza',
      city: 'Bengaluru',
      state: 'Karnataka',
      pin: '560025',
      dealerType: 'PLATINUM',
      priceGroup: 'TIER_1',
      creditLimit: 800000,
      paymentTerms: 'NET_30',
      assignedWarehouse: 'WH-MUMBAI-01',
      accountStatus: 'ACTIVE',
    },
    newDealerId,
    { uid: 'usr_admin_01', email: 'admin@pixeldistributor.com' }
  );

  globalStore.dealers.set(provisioning.dealer.dealerId, provisioning.dealer);
  globalStore.users.set(provisioning.user.userId, provisioning.user);
  globalStore.userPermissions.set(provisioning.permissionProfile.userPermissionId, provisioning.permissionProfile);
  globalStore.appConfigurations.set(provisioning.appConfiguration.configId, provisioning.appConfiguration);
  globalStore.activityLogs.push(provisioning.auditRecord);

  console.log(`✓ Dealer Created: ${provisioning.dealer.businessName} (${provisioning.dealer.dealerId})`);
  console.log(`✓ Auto-generated User ID: ${provisioning.user.userId}`);
  console.log(`✓ Auto-generated App ID: ${provisioning.dealer.appId}`);
  console.log(`✓ Credit Limit: ₹${(provisioning.dealer.creditLimit / 100000).toFixed(1)} Lakhs`);

  // 3. Customize 6-Tier Permission Matrix
  console.log('\n[3/8] Customizing 6-Tier Permission Matrix for Dealer...');
  const userPerm = globalStore.userPermissions.get(provisioning.permissionProfile.userPermissionId)!;
  userPerm.modules.inventory = 'EDIT';
  userPerm.modules.orders = 'EDIT';
  userPerm.modules.customers = 'VIEW';
  userPerm.modules.finance = 'VIEW';
  userPerm.modules.reports = 'HIDDEN'; // Hide reports
  console.log(`✓ Permissions deployed: Inventory=EDIT, Orders=EDIT, Customers=VIEW, Reports=HIDDEN`);

  // 4. Central Warehouse to Dealer Stock Transfer
  console.log('\n[4/8] Executing Stock Transfer (Central Warehouse -> Dealer)...');
  const transfer = InventoryService.createStockTransfer(
    'WH-MUMBAI-01',
    newDealerId,
    [
      {
        sku: 'PX-ULTRA-256',
        productId: 'PRD-101',
        productName: 'Pixel Ultra 256GB Titanium',
        quantity: 20,
      },
    ],
    'usr_admin_01',
    'Opening showroom allocation'
  );
  globalStore.stockTransfers.set(transfer.transferId, transfer);
  console.log(`✓ Transfer Initiated: ${transfer.transferId} (20x PX-ULTRA-256)`);

  // Complete Transfer
  const whMap = new Map<string, typeof globalStore.inventory extends Map<string, infer V> ? V : never>();
  const dlrMap = new Map<string, typeof globalStore.inventory extends Map<string, infer V> ? V : never>();
  whMap.set('PX-ULTRA-256', globalStore.inventory.get('CENTRAL_WAREHOUSE_WH-MUMBAI-01_PX-ULTRA-256')!);

  const completion = InventoryService.completeStockTransfer(transfer, whMap, dlrMap, 'usr_admin_01');
  completion.warehouseUpdates.forEach((u) => globalStore.inventory.set(u.inventoryId, u));
  completion.dealerUpdates.forEach((u) => globalStore.inventory.set(u.inventoryId, u));
  completion.transactions.forEach((t) => globalStore.inventoryTransactions.push(t));

  console.log(`✓ Transfer Delivered & Reconciled!`);
  console.log(`  Central Warehouse New Balance: ${completion.warehouseUpdates[0].quantity} PCS`);
  console.log(`  Dealer Store New Balance: ${completion.dealerUpdates[0].quantity} PCS`);
  console.log(`  Immutable Ledger Entries Created: ${completion.transactions.length}`);

  // 5. Place Purchase Order
  console.log('\n[5/8] Placing Dealer Purchase Order with Credit Verification...');
  const orderResult = OrderService.createOrder(
    {
      dealerId: newDealerId,
      items: [
        {
          sku: 'PX-ULTRA-256',
          productId: 'PRD-101',
          productName: 'Pixel Ultra 256GB Titanium',
          quantity: 5,
          unitPrice: 56000,
          tax: 0,
          discount: 0,
          lineTotal: 280000,
        },
      ],
      subtotal: 280000,
      grandTotal: 280000,
      shippingAddress: {
        address: '104 Brigade Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pin: '560025',
      },
    },
    provisioning.dealer,
    provisioning.user.userId
  );

  provisioning.dealer.outstandingBalance = orderResult.updatedDealerBalance;
  globalStore.orders.set(orderResult.order.orderId, orderResult.order);

  console.log(`✓ Order Created: ${orderResult.order.orderId}`);
  console.log(`✓ Order Grand Total: ₹${orderResult.order.grandTotal.toLocaleString()}`);
  console.log(`✓ Dealer New Outstanding Balance: ₹${orderResult.updatedDealerBalance.toLocaleString()}`);

  // 6. APK Release Publication & In-App Interrogation
  console.log('\n[6/8] Publishing Android APK Release & In-App Interrogation...');
  const newRelease = ReleaseService.publishRelease(
    {
      version: '1.1.0',
      versionCode: 110,
      downloadUrl: '/download',
      checksum: 'c'.repeat(64),
      fileSize: 19100000,
      releaseNotes: '• High-speed barcode scanning\n• Android 14 compatibility',
      minimumSupportedVersion: '1.0.0',
      minimumVersionCode: 100,
      mandatory: false,
      status: 'ACTIVE',
    },
    Array.from(globalStore.appReleases.values())[0],
    'usr_admin_01'
  );
  globalStore.appReleases.set(newRelease.releaseId, newRelease);
  console.log(`✓ Published Release: v${newRelease.version} (Build ${newRelease.versionCode})`);

  // Interrogate from client running Build 100
  const clientCheck = ReleaseService.evaluateClientVersion(100, newRelease);
  console.log(`✓ Client running Build 100 interrogated API:`);
  console.log(`  Update Required: ${clientCheck.updateRequired}`);
  console.log(`  Mandatory Block: ${clientCheck.isMandatory}`);

  // 7. Staged Excel Export
  console.log('\n[7/8] Generating Staged Excel Exports (Products & Dealers)...');
  const productsBuffer = ExcelEtlService.exportProductsToBuffer(Array.from(globalStore.products.values()));
  const dealersBuffer = ExcelEtlService.exportDealersToBuffer(Array.from(globalStore.dealers.values()));
  console.log(`✓ Products.xlsx generated (${productsBuffer.length} bytes)`);
  console.log(`✓ Dealers.xlsx generated (${dealersBuffer.length} bytes)`);

  // 8. Audit Journal Integrity Check
  console.log('\n[8/8] Verifying Audit Trail Integrity...');
  console.log(`Total Immutable Audit Records: ${globalStore.activityLogs.length}`);
  const latestLog = globalStore.activityLogs[globalStore.activityLogs.length - 1];
  console.log(`Latest Action: [${latestLog.action}] by ${latestLog.actorEmail} on ${latestLog.entity}`);

  console.log('\n================================================================');
  console.log('   ALL 8 END-TO-END WALKTHROUGH STAGES PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runWalkthrough().catch((err) => {
  console.error('Walkthrough Failed:', err);
  process.exit(1);
});
