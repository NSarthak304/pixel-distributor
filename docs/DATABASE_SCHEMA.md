# Pixel Distributor - Database Schema & Data Models

## 1. Overview & Data Design Principles

Pixel Distributor utilizes **Google Cloud Firestore** as its central NoSQL document database. To guarantee enterprise reliability, security, and sub-second query latency across thousands of dealers, the database design adheres to these strict principles:

1. **Multi-Tenant Scoping:** Every business entity (inventory, orders, customers, payments, transfers) carries an indexed `dealerId` attribute. Central records are explicitly tagged with `dealerId: "CENTRAL"`.
2. **Transaction Immutability:** Stock records and audit trails are append-only. Stock is never mutated directly; it is adjusted through an immutable `inventoryTransactions` event ledger.
3. **Compound Index Optimization:** Composite indexes are defined for every filtered and sorted query to prevent unindexed full-collection scans.
4. **Denormalization for Speed:** Selected master attributes (e.g., `dealerName`, `productName`, `sku`, `unit`) are stored alongside transaction records to enable single-read rendering without relational joins.

---

## 2. Complete Collections Schema

```
Cloud Firestore Root
├── users/ {userId}
├── dealers/ {dealerId}
├── roles/ {roleId}
├── permissions/ {permissionId}
├── userPermissions/ {userPermissionId}
├── appConfigurations/ {dealerId}
├── products/ {productId}
├── categories/ {categoryId}
├── warehouses/ {warehouseId}
├── inventory/ {inventoryId}
├── inventoryTransactions/ {transactionId}
├── stockTransfers/ {transferId}
├── orders/ {orderId}
│   └── orderItems/ {orderItemId}  (or embedded array for orders < 50 items)
├── customers/ {customerId}
├── payments/ {paymentId}
├── notifications/ {notificationId}
├── activityLogs/ {logId}
├── appReleases/ {releaseId}
└── settings/ {settingId}
```

---

### 2.1 Collection: `users`
Represents individual human accounts (Central Admin, Inventory Manager, Dealer Owners, Dealer Staff).

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `userId` | `string` | Yes | Primary Document ID (matches Firebase Auth UID). |
| `dealerId` | `string` | Yes | Associated Dealer ID, or `"CENTRAL"` for system staff. |
| `email` | `string` | Yes | Primary login email address. |
| `displayName` | `string` | Yes | Full name of the user. |
| `phone` | `string` | Yes | Contact mobile number. |
| `role` | `string` | Yes | Role key (`SUPER_ADMIN`, `ADMIN`, `INVENTORY_MANAGER`, `SALES_MANAGER`, `DEALER`, `DEALER_STAFF`, `VIEWER`). |
| `status` | `string` | Yes | `"ACTIVE"`, `"SUSPENDED"`, `"INVITED"`, `"DEACTIVATED"`. |
| `lastLoginAt` | `timestamp` | No | Timestamp of most recent successful login. |
| `currentAppVersion` | `string` | No | Last reported app version (e.g. `"1.2.0"`). |
| `deviceInfo` | `map` | No | Platform details (OS, model, FCM token). |
| `createdAt` | `timestamp` | Yes | Account creation timestamp. |
| `updatedAt` | `timestamp` | Yes | Last profile update timestamp. |

---

### 2.2 Collection: `dealers`
Represents independent dealer business entities.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `dealerId` | `string` | Yes | Unique human-readable Dealer ID (e.g., `DLR-1001`). |
| `businessName` | `string` | Yes | Registered trading/business name. |
| `ownerName` | `string` | Yes | Primary proprietor or director name. |
| `mobile` | `string` | Yes | Primary phone number. |
| `whatsapp` | `string` | No | WhatsApp notification number. |
| `email` | `string` | Yes | Primary communications email. |
| `gstin` | `string` | No | Goods and Services Tax Identification Number. |
| `pan` | `string` | No | Permanent Account Number. |
| `address` | `string` | Yes | Street address. |
| `city` | `string` | Yes | City. |
| `state` | `string` | Yes | State. |
| `pin` | `string` | Yes | Postal PIN code. |
| `dealerType` | `string` | Yes | `"PLATINUM"`, `"GOLD"`, `"SILVER"`, `"STANDARD"`. |
| `priceGroup` | `string` | Yes | Associated pricing tier (e.g., `"TIER_1"`, `"TIER_2"`). |
| `creditLimit` | `number` | Yes | Maximum allowed outstanding balance (in currency). |
| `paymentTerms` | `string` | Yes | Terms code (e.g., `"NET_15"`, `"NET_30"`, `"ADVANCE"`). |
| `assignedWarehouse`| `string` | Yes | Default dispatch warehouse ID. |
| `accountStatus` | `string` | Yes | `"ACTIVE"`, `"SUSPENDED"`, `"PENDING"`. |
| `appId` | `string` | Yes | Generated App Instance ID. |
| `outstandingBalance`| `number` | Yes | Current total outstanding balance. |
| `createdAt` | `timestamp` | Yes | Registration timestamp. |
| `updatedAt` | `timestamp` | Yes | Last modification timestamp. |

---

### 2.3 Collection: `roles`
Stores standard system and custom role definitions.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `roleId` | `string` | Yes | Key (e.g., `DEALER`, `DEALER_STAFF`, `ADMIN`). |
| `name` | `string` | Yes | Display name. |
| `description` | `string` | Yes | Explanatory description. |
| `defaultPermissions`| `map` | Yes | Map of Module keys to Capability levels (`HIDDEN`, `VIEW`, `CREATE`, `EDIT`, `DELETE`, `ADMIN`). |
| `isSystemRole` | `boolean` | Yes | Flag indicating whether role is immutable. |

---

### 2.4 Collection: `permissions`
Catalog of all manageable feature modules and action capabilities.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `permissionId` | `string` | Yes | Module identifier (e.g., `inventory`, `orders`, `finance`, `reports`). |
| `displayName` | `string` | Yes | Friendly label (e.g., "Dealer Inventory Management"). |
| `category` | `string` | Yes | Functional group (e.g., `"OPERATIONS"`, `"FINANCE"`). |
| `supportedLevels` | `array` | Yes | Allowed values: `["HIDDEN", "VIEW", "CREATE", "EDIT", "DELETE", "ADMIN"]`. |

---

### 2.5 Collection: `userPermissions`
Overrides or custom permission profiles assigned to a specific user or dealer.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `userPermissionId`| `string` | Yes | Pattern: `{dealerId}_{userId}` or `{dealerId}_DEFAULT`. |
| `dealerId` | `string` | Yes | Bound Dealer ID. |
| `userId` | `string` | Yes | Bound User ID, or `"ALL"` for dealer-wide default. |
| `modules` | `map` | Yes | Map: `moduleName` -> Capability (`VIEW`, `EDIT`, etc.). |
| `grantedBy` | `string` | Yes | Admin UID who authorized this permission. |
| `updatedAt` | `timestamp` | Yes | Timestamp of last modification. |

---

### 2.6 Collection: `appConfigurations`
Dynamic UI configuration profile controlling what a dealer sees in the mobile and web app.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `configId` | `string` | Yes | Document ID matches `dealerId`. |
| `dealerId` | `string` | Yes | Dealer ID this configuration governs. |
| `visibleModules` | `array` | Yes | List of modules visible in drawer/navigation. |
| `dashboardCards` | `array` | Yes | List of active dashboard cards (`sales`, `orders`, `inventory`, `outstanding`, `customers`, `notifications`). |
| `inventoryVisibility`| `string` | Yes | `"FULL"`, `"RESTRICTED"`, `"HIDDEN"`. |
| `priceVisibility`| `string` | Yes | `"DEALER_ONLY"`, `"DEALER_AND_MRP"`, `"ALL"`. |
| `mrpVisibility` | `boolean` | Yes | Can the dealer see the consumer MRP? |
| `purchaseCostVisibility`| `boolean` | Yes | Strictly `false` for dealers; can only be `true` for Central Staff. |
| `canCreateOrders`| `boolean` | Yes | Toggle order placement feature. |
| `canEditProducts`| `boolean` | Yes | Toggle dealer product master editing. |
| `canRequestStock`| `boolean` | Yes | Toggle stock transfer request capability. |
| `canViewReports` | `boolean` | Yes | Toggle analytics and report viewing. |
| `canViewPayments`| `boolean` | Yes | Toggle ledger and payment view. |
| `themeColor` | `string` | No | Optional brand accent color. |
| `updatedAt` | `timestamp` | Yes | Last update timestamp. |

---

### 2.7 Collection: `products`
The central Product Master catalog.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `productId` | `string` | Yes | Unique ID (e.g., `PRD-10023`). |
| `sku` | `string` | Yes | Unique Stock Keeping Unit barcode/code. |
| `name` | `string` | Yes | Product display title. |
| `categoryId` | `string` | Yes | Reference to category. |
| `categoryName` | `string` | Yes | Denormalized category title. |
| `brand` | `string` | Yes | Brand manufacturer name. |
| `model` | `string` | Yes | Model designation. |
| `variant` | `string` | No | Color / size / capacity variant. |
| `unit` | `string` | Yes | Unit of measure (`"PCS"`, `"BOX"`, `"SET"`). |
| `mrp` | `number` | Yes | Maximum Retail Price. |
| `purchasePrice`| `number` | Yes | Central purchase/cost price (masked from dealers). |
| `dealerPrices` | `map` | Yes | Map of price groups: `{"TIER_1": 1200, "TIER_2": 1250}`. |
| `reorderLevel` | `number` | Yes | Minimum stock threshold. |
| `isActive` | `boolean` | Yes | Active catalog item flag. |
| `imageUrls` | `array` | No | Media image download URLs. |
| `createdAt` | `timestamp` | Yes | Created timestamp. |
| `updatedAt` | `timestamp` | Yes | Last modified timestamp. |

---

### 2.8 Collection: `categories`
Product category grouping.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `categoryId` | `string` | Yes | Slug or ID (e.g., `smartphones`). |
| `name` | `string` | Yes | Name (e.g., "Smartphones & Tablets"). |
| `description` | `string` | No | Category description. |
| `displayOrder` | `number` | Yes | Navigation sort order. |

---

### 2.9 Collection: `warehouses`
Central physical warehouses and fulfillment depots.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `warehouseId` | `string` | Yes | ID (e.g., `WH-MUMBAI-01`). |
| `name` | `string` | Yes | Facility title. |
| `address` | `string` | Yes | Physical location. |
| `city` | `string` | Yes | City. |
| `state` | `string` | Yes | State. |
| `contactPerson`| `string` | Yes | Manager name. |
| `contactPhone` | `string` | Yes | Manager phone. |
| `isActive` | `boolean` | Yes | Active status. |

---

### 2.10 Collection: `inventory`
Denormalized current balance snapshot for quick queries.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `inventoryId` | `string` | Yes | `{locationType}_{locationId}_{sku}`. |
| `locationType` | `string` | Yes | `"CENTRAL_WAREHOUSE"` or `"DEALER"`. |
| `locationId` | `string` | Yes | Warehouse ID or Dealer ID. |
| `dealerId` | `string` | Yes | Dealer ID, or `"CENTRAL"` if central stock. |
| `productId` | `string` | Yes | Reference to product. |
| `sku` | `string` | Yes | SKU barcode. |
| `productName` | `string` | Yes | Denormalized product title. |
| `quantity` | `number` | Yes | Current available stock count. |
| `reservedQuantity`| `number` | Yes | Quantity allocated to pending orders. |
| `reorderLevel` | `number` | Yes | Threshold alert level. |
| `updatedAt` | `timestamp` | Yes | Timestamp of last stock transaction. |

---

### 2.11 Collection: `inventoryTransactions`
Immutable event ledger of all physical stock movements.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `transactionId`| `string` | Yes | Unique ID (e.g., `TXN-902144`). |
| `type` | `string` | Yes | `"STOCK_IN"`, `"STOCK_OUT"`, `"TRANSFER_IN"`, `"TRANSFER_OUT"`, `"SALE"`, `"RETURN"`, `"DAMAGED"`, `"ADJUSTMENT"`. |
| `sku` | `string` | Yes | Target SKU. |
| `productId` | `string` | Yes | Target product ID. |
| `locationType` | `string` | Yes | `"CENTRAL_WAREHOUSE"` or `"DEALER"`. |
| `locationId` | `string` | Yes | Specific warehouse or dealer ID. |
| `dealerId` | `string` | Yes | Specific dealer ID, or `"CENTRAL"`. |
| `quantityDelta` | `number` | Yes | Positive or negative quantity delta (e.g., `+50`, `-10`). |
| `balanceAfter` | `number` | Yes | Verified balance immediately following transaction. |
| `referenceType`| `string` | Yes | `"ORDER"`, `"TRANSFER"`, `"PURCHASE_RECEIPT"`, `"AUDIT"`. |
| `referenceId` | `string` | Yes | ID of triggering order or transfer. |
| `createdBy` | `string` | Yes | UID of actor who performed or approved transaction. |
| `notes` | `string` | No | Operational comments. |
| `timestamp` | `timestamp` | Yes | Event creation timestamp. |

---

### 2.12 Collection: `stockTransfers`
Inter-warehouse and central-to-dealer stock dispatches.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `transferId` | `string` | Yes | Unique ID (e.g., `TRF-5012`). |
| `sourceType` | `string` | Yes | `"WAREHOUSE"` or `"DEALER"`. |
| `sourceId` | `string` | Yes | Source warehouse ID or dealer ID. |
| `destinationType`| `string` | Yes | `"WAREHOUSE"` or `"DEALER"`. |
| `destinationId`| `string` | Yes | Destination warehouse ID or dealer ID. |
| `dealerId` | `string` | Yes | Target dealer ID (for tenant filtering). |
| `items` | `array` | Yes | Array of `{sku, productId, productName, quantity}`. |
| `status` | `string` | Yes | `"REQUESTED"`, `"APPROVED"`, `"DISPATCHED"`, `"DELIVERED"`, `"REJECTED"`, `"CANCELLED"`. |
| `trackingNumber`| `string` | No | Logistics tracking number. |
| `createdBy` | `string` | Yes | UID of requester. |
| `approvedBy` | `string` | No | UID of approving admin. |
| `dispatchedAt` | `timestamp` | No | Dispatch timestamp. |
| `receivedAt` | `timestamp` | No | Receiving receipt timestamp. |
| `createdAt` | `timestamp` | Yes | Creation timestamp. |
| `updatedAt` | `timestamp` | Yes | Update timestamp. |

---

### 2.13 Collection: `orders`
Purchase orders submitted by dealers or end-customer sales recorded by dealers.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `orderId` | `string` | Yes | Order number (e.g., `ORD-2026-8801`). |
| `dealerId` | `string` | Yes | Submitting Dealer ID. |
| `customerId` | `string` | No | Customer ID if end-customer sale. |
| `customerName` | `string` | No | Denormalized customer name. |
| `items` | `array` | Yes | Array of item objects (`sku`, `productName`, `quantity`, `price`, `tax`, `discount`, `lineTotal`). |
| `subtotal` | `number` | Yes | Pre-tax line sum. |
| `discountTotal`| `number` | Yes | Aggregate discount. |
| `taxTotal` | `number` | Yes | Aggregate GST / VAT. |
| `grandTotal` | `number` | Yes | Final payable order amount. |
| `status` | `string` | Yes | `"DRAFT"`, `"PENDING"`, `"CONFIRMED"`, `"PROCESSING"`, `"DISPATCHED"`, `"COMPLETED"`, `"CANCELLED"`. |
| `paymentStatus`| `string` | Yes | `"UNPAID"`, `"PARTIAL"`, `"PAID"`. |
| `shippingAddress`| `map` | Yes | Address payload. |
| `createdBy` | `string` | Yes | UID of author. |
| `createdAt` | `timestamp` | Yes | Submission timestamp. |
| `updatedAt` | `timestamp` | Yes | Status update timestamp. |

---

### 2.14 Collection: `customers`
Retail or business customers managed by individual dealers.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `customerId` | `string` | Yes | Customer ID (e.g., `CUST-7701`). |
| `dealerId` | `string` | Yes | Owning Dealer ID (strictly tenant-isolated). |
| `name` | `string` | Yes | Customer full name or business title. |
| `phone` | `string` | Yes | Contact phone. |
| `email` | `string` | No | Email address. |
| `gstin` | `string` | No | Customer GST number (if B2B). |
| `address` | `string` | No | Address line. |
| `city` | `string` | No | City. |
| `state` | `string` | No | State. |
| `totalOrders` | `number` | Yes | Total completed orders count. |
| `totalSpent` | `number` | Yes | Cumulative purchase value. |
| `createdAt` | `timestamp` | Yes | Registration timestamp. |
| `updatedAt` | `timestamp` | Yes | Last modified timestamp. |

---

### 2.15 Collection: `payments`
Financial transactions, receipts, credit notes, and outstanding settlements.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `paymentId` | `string` | Yes | ID (e.g., `PAY-3310`). |
| `dealerId` | `string` | Yes | Associated Dealer ID. |
| `orderId` | `string` | No | Associated Order ID (if linked to specific invoice). |
| `amount` | `number` | Yes | Transaction currency amount. |
| `mode` | `string` | Yes | `"NEFT"`, `"RTGS"`, `"UPI"`, `"CHEQUE"`, `"CASH"`, `"CREDIT_NOTE"`. |
| `referenceNumber`| `string`| Yes | Bank reference / UTR / Cheque number. |
| `status` | `string` | Yes | `"PENDING"`, `"VERIFIED"`, `"REJECTED"`. |
| `notes` | `string` | No | Remittance notes. |
| `verifiedBy` | `string` | No | Admin UID who confirmed bank clearance. |
| `paymentDate` | `timestamp` | Yes | Date transaction occurred. |
| `createdAt` | `timestamp` | Yes | System log timestamp. |

---

### 2.16 Collection: `notifications`
Alerts, low-stock warnings, order status notices, and administrative announcements.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `notificationId`| `string`| Yes | Unique ID. |
| `recipientType` | `string`| Yes | `"BROADCAST"`, `"DEALER"`, `"USER"`. |
| `dealerId` | `string`| No | Target Dealer ID (if recipientType is DEALER). |
| `userId` | `string`| No | Target User UID (if recipientType is USER). |
| `title` | `string`| Yes | Short title. |
| `body` | `string`| Yes | Notification text. |
| `link` | `string`| No | Deep-link path (e.g., `/orders/ORD-2026-8801`). |
| `isRead` | `boolean`| Yes | Read status flag. |
| `createdAt` | `timestamp`| Yes | Creation timestamp. |

---

### 2.17 Collection: `activityLogs`
Immutable security and audit journal.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `logId` | `string` | Yes | Unique ID (e.g., `LOG-992101`). |
| `actorId` | `string` | Yes | Firebase Auth UID of actor. |
| `actorEmail` | `string` | Yes | Email of actor. |
| `actorRole` | `string` | Yes | Role of actor at time of action. |
| `dealerId` | `string` | Yes | Target or Actor Dealer ID. |
| `action` | `string` | Yes | Action code (e.g., `DEALER_CREATED`, `ORDER_STATUS_CHANGED`, `PERMISSION_OVERRIDDEN`, `APK_PUBLISHED`). |
| `entity` | `string` | Yes | Entity name (`dealers`, `products`, `orders`, etc.). |
| `entityId` | `string` | Yes | Target Document ID. |
| `metadata` | `map` | Yes | Change delta (e.g., `{"oldStatus": "PENDING", "newStatus": "CONFIRMED"}`). |
| `ipAddress` | `string` | No | Client IP address. |
| `userAgent` | `string` | No | Client user agent. |
| `timestamp` | `timestamp` | Yes | Server timestamp. |

---

### 2.18 Collection: `appReleases`
Android APK binary versions, download URLs, and update policies.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `releaseId` | `string` | Yes | Release identifier (e.g., `REL-v1.2.0`). |
| `version` | `string` | Yes | Semantic version string (e.g., `"1.2.0"`). |
| `versionCode` | `number` | Yes | Android integer version code (e.g., `120`). |
| `releaseDate` | `timestamp` | Yes | Publication date. |
| `downloadUrl` | `string` | Yes | Signed Cloud Storage download URL for `.apk`. |
| `checksum` | `string` | Yes | SHA-256 binary hash. |
| `fileSize` | `number` | Yes | APK size in bytes. |
| `releaseNotes` | `string` | Yes | Markdown release notes. |
| `minimumSupportedVersion`| `string`| Yes | Lowest version allowed without mandatory block. |
| `minimumVersionCode` | `number` | Yes | Lowest versionCode allowed. |
| `mandatory` | `boolean` | Yes | Whether this update is forced for older clients. |
| `status` | `string` | Yes | `"DRAFT"`, `"ACTIVE"`, `"DEPRECATED"`, `"REVOKED"`. |
| `publishedBy` | `string` | Yes | Admin UID who published release. |

---

### 2.19 Collection: `settings`
System-wide global variables and flags.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `settingId` | `string` | Yes | Key (e.g., `general`, `inventory_policy`, `finance_policy`). |
| `data` | `map` | Yes | Key-value settings payload. |
| `updatedAt` | `timestamp` | Yes | Last modified timestamp. |
| `updatedBy` | `string` | Yes | Admin UID. |

---

## 3. Composite Indexes Configuration (`firestore.indexes.json`)

To enable high-performance querying without index failures:

```json
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dealerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dealerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "inventoryTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dealerId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "inventoryTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "locationId", "order": "ASCENDING" },
        { "fieldPath": "sku", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stockTransfers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dealerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "customers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dealerId", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "payments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dealerId", "order": "ASCENDING" },
        { "fieldPath": "paymentDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activityLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dealerId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "appReleases",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "versionCode", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```
