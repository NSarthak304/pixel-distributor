# Pixel Distributor - Backend API Specification (Plan B & Cloud Functions)

## 1. Architectural Overview & Conventions

All backend endpoints are implemented as serverless **Firebase Cloud Functions (2nd Gen / Node.js 22 LTS)** or a modular Express microservice. 

### Global API Conventions
- **Base URL:** `https://api.pixeldistributor.com/v1` (Production) or `http://localhost:5001/pixeldistributor/us-central1/api/v1` (Local Emulator)
- **Standard Protocol:** HTTPS only
- **Authentication Header:** `Authorization: Bearer <Firebase_ID_Token>`
- **App Check Header:** `X-Firebase-AppCheck: <AppCheck_Token>`
- **Content-Type:** `application/json; charset=utf-8`
- **Standard Envelope Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-24T15:30:00.000Z",
    "requestId": "req_88f910a2"
  }
}
```
- **Standard Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "User does not have EDIT capability on orders module.",
    "details": []
  },
  "meta": {
    "timestamp": "2026-09-24T15:30:00.000Z",
    "requestId": "req_88f910a2"
  }
}
```

---

## 2. Core API Endpoints

### 2.1 Dealer Management Endpoints

#### `POST /dealers`
Creates a new dealer entity, initializes default app configuration, default permissions, and triggers user account generation.
- **Required Permission:** `dealerManagement: CREATE` (Central Admin only)
- **Request Payload:**
```json
{
  "businessName": "Apex Telecom & Electronics",
  "ownerName": "Rajesh Kumar",
  "mobile": "+919876543210",
  "whatsapp": "+919876543210",
  "email": "contact@apextelecom.com",
  "gstin": "27AABCU9603R1ZM",
  "pan": "AABCU9603R",
  "address": "42 Ring Road, Industrial Area Phase II",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pin": "400093",
  "dealerType": "GOLD",
  "priceGroup": "TIER_1",
  "creditLimit": 500000,
  "paymentTerms": "NET_30",
  "assignedWarehouse": "WH-MUMBAI-01",
  "accountStatus": "ACTIVE"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "dealerId": "DLR-1042",
    "appId": "APP-DLR-1042-881",
    "userId": "usr_k928f01a",
    "businessName": "Apex Telecom & Electronics",
    "createdAt": "2026-09-24T15:30:00Z"
  }
}
```

#### `GET /dealers`
Lists dealers with pagination, filtering by state, type, and status.
- **Query Params:** `?status=ACTIVE&page=1&limit=25&search=Apex`
- **Required Permission:** `dealerManagement: VIEW`

#### `PATCH /dealers/:dealerId/status`
Suspends or reactivates a dealer account.
- **Payload:** `{"status": "SUSPENDED", "reason": "Exceeded credit terms >60 days"}`
- **Side Effect:** Automatically revokes Firebase Auth refresh tokens for all users associated with this `dealerId`.

---

### 2.2 Permissions & App Configuration Endpoints

#### `GET /dealers/:dealerId/config`
Retrieves the complete app and permission configuration for a dealer.
- **Access:** Central Admin or Authenticated User belonging to `:dealerId`.

#### `PUT /dealers/:dealerId/config`
Updates UI visibility flags, price masking policies, and enabled dashboard cards.
- **Required Permission:** `appManagement: EDIT` (Central Admin only)
- **Payload:**
```json
{
  "visibleModules": ["inventory", "orders", "customers", "payments", "reports"],
  "dashboardCards": ["sales", "orders", "inventory", "outstanding"],
  "priceVisibility": "DEALER_AND_MRP",
  "mrpVisibility": true,
  "purchaseCostVisibility": false,
  "canCreateOrders": true,
  "canEditProducts": false,
  "canRequestStock": true
}
```

#### `PUT /dealers/:dealerId/permissions`
Overhauls capability levels across modules.
- **Payload:**
```json
{
  "modules": {
    "dashboard": "VIEW",
    "inventory": "EDIT",
    "orders": "EDIT",
    "customers": "VIEW",
    "payments": "VIEW",
    "reports": "VIEW"
  }
}
```

---

### 2.3 Inventory & Stock Transfer Endpoints

#### `POST /inventory/transfers`
Initiates a central warehouse to dealer stock transfer.
- **Payload:**
```json
{
  "sourceWarehouseId": "WH-MUMBAI-01",
  "destinationDealerId": "DLR-1042",
  "items": [
    { "sku": "PX-ULTRA-256", "quantity": 25 },
    { "sku": "PX-BUDS-PRO", "quantity": 50 }
  ],
  "referenceNotes": "Monthly stock allocation"
}
```
- **Behavior:** Validates central warehouse stock availability; reserves quantities atomically.

#### `PATCH /inventory/transfers/:transferId/status`
Advances transfer through lifecycle (`DISPATCHED` -> `DELIVERED`).
- **Behavior on `DELIVERED`:**
  - Decrements central warehouse inventory.
  - Increments target dealer inventory.
  - Appends two corresponding `inventoryTransactions` (`TRANSFER_OUT` and `TRANSFER_IN`).

---

### 2.4 Orders Endpoints

#### `POST /orders`
Creates a purchase order.
- **Payload:**
```json
{
  "dealerId": "DLR-1042",
  "customerId": "CUST-9011",
  "items": [
    { "sku": "PX-ULTRA-256", "quantity": 2, "price": 42000, "tax": 7560, "discount": 0 }
  ],
  "shippingAddress": {
    "address": "Shop 12, Ground Floor, Central Mall",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pin": "400050"
  }
}
```
- **Validation:** 
  - Validates caller belongs to `dealerId`.
  - Verifies total against dealer's available credit limit (`creditLimit - outstandingBalance`).
  - Sets initial state to `PENDING`.

---

### 2.5 App Releases & OTA Update Endpoints

#### `GET /releases/latest`
Lightweight version interrogation endpoint called on app launch.
- **Response:**
```json
{
  "success": true,
  "data": {
    "version": "1.2.0",
    "versionCode": 120,
    "downloadUrl": "https://storage.googleapis.com/pixeldistributor-releases/pixel-app-v1.2.0.apk",
    "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "fileSize": 19324102,
    "minimumSupportedVersion": "1.1.0",
    "minimumVersionCode": 110,
    "mandatory": false,
    "releaseNotes": "• Real-time stock transfer notifications\n• Performance optimizations"
  }
}
```

---

### 2.6 Excel Staged Import Endpoints

#### `POST /excel/validate`
Uploads and validates an Excel workbook against schemas.
- **Multipart Form:** `file: Products.xlsx`, `type: products`
- **Response:** Summary of rows, errors list with line coordinates, and preview diff.

#### `POST /excel/commit`
Executes verified staged import payload into Firestore using chunked batched transactions.
