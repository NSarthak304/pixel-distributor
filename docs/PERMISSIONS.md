# Pixel Distributor - Multi-Tier Permission Engine & Access Control

## 1. Core Permission Philosophy

Security is founded on **defense-in-depth**. Hiding a button in the frontend or omitting a sidebar link is merely a user experience consideration—it is **never** considered security.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE 4-TIER SECURITY ENFORCEMENT STACK                │
│                                                                        │
│   Tier 1: UI Level           Components, buttons, & tabs conditionally  │
│                              masked based on permission context.        │
│                                                                        │
│   Tier 2: Route Level        Client and SSR route guards prevent        │
│                              direct URL deep-link navigation.          │
│                                                                        │
│   Tier 3: Backend / API      Cloud Functions / Express API validates    │
│                              caller tokens, roles, and dealer bounds.  │
│                                                                        │
│   Tier 4: Firestore Rules    Rules Version 2 prevents direct reads,     │
│                              writes, or query escapes at database level│
└────────────────────────────────────────────────────────────────────────┘
```

A dealer user changing an ID in a URL query parameter (e.g., from `/orders?dealerId=DLR-A` to `/orders?dealerId=DLR-B`), modifying a payload body, or issuing direct raw Firebase SDK calls will immediately be blocked at Tiers 3 and 4 with `403 Forbidden` / `permission-denied`.

---

## 2. Six-Tier Capability Hierarchy

Instead of simplistic boolean toggles (`canViewOrders: true/false`), every functional module is governed by a 6-tier progressive capability scale:

| Level | Rank | Semantics & Allowed Operations |
| :--- | :---: | :--- |
| **`HIDDEN`** | 0 | The module does not exist for this user. Navigation links are stripped, direct route navigation redirects to 404/403, and all database reads/writes are denied. |
| **`VIEW`** | 1 | Read-only access. The user can inspect lists, search records, and view detail views within their assigned dealer scope. All mutation endpoints and writes are blocked. |
| **`CREATE`** | 2 | The user can view existing records and draft/submit new records (e.g. place a new order, create a customer). Cannot edit or delete once submitted. |
| **`EDIT`** | 3 | The user can view, create, and update existing records within their permitted state transitions (e.g., update customer address, edit draft orders). Cannot delete records. |
| **`DELETE`** | 4 | The user can perform soft-deletions or cancellations of records owned by their dealer. |
| **`ADMIN`** | 5 | Unrestricted control over the module within scope, including administrative overrides, approval workflows, and assignment. |

### Capability Inclusion Rule
Higher capability levels strictly inherit the rights of lower levels:
$$\text{ADMIN} \subset \text{DELETE} \subset \text{EDIT} \subset \text{CREATE} \subset \text{VIEW}$$

---

## 3. System Permission Matrix

The system maps standard roles to baseline capability levels across all operational modules:

| Functional Module | SUPER_ADMIN | ADMIN | INVENTORY_MGR | SALES_MGR | DEALER (Owner) | DEALER_STAFF | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard** | ADMIN | ADMIN | VIEW | VIEW | Configurable | Configurable | VIEW |
| **Dealer Management** | ADMIN | ADMIN | VIEW | VIEW | HIDDEN | HIDDEN | HIDDEN |
| **User Accounts** | ADMIN | ADMIN | HIDDEN | HIDDEN | EDIT (Own Staff) | HIDDEN | HIDDEN |
| **Product Master** | ADMIN | ADMIN | EDIT | VIEW | VIEW (Masked) | VIEW (Masked) | VIEW |
| **Central Inventory** | ADMIN | ADMIN | ADMIN | VIEW | HIDDEN | HIDDEN | VIEW |
| **Dealer Inventory** | ADMIN | ADMIN | EDIT | VIEW | EDIT | VIEW | VIEW |
| **Stock Transfers** | ADMIN | ADMIN | ADMIN | EDIT | CREATE (Request) | VIEW | VIEW |
| **Orders** | ADMIN | ADMIN | VIEW | ADMIN | CREATE + EDIT | CREATE | VIEW |
| **Customers** | ADMIN | ADMIN | HIDDEN | ADMIN | CREATE + EDIT | CREATE + EDIT | VIEW |
| **Finance / Payments**| ADMIN | ADMIN | HIDDEN | VIEW | VIEW (Own Ledger)| HIDDEN | HIDDEN |
| **Reports** | ADMIN | ADMIN | VIEW | VIEW | Configurable | HIDDEN | HIDDEN |
| **App Management** | ADMIN | ADMIN | HIDDEN | HIDDEN | HIDDEN | HIDDEN | HIDDEN |
| **Activity / Audit** | ADMIN | ADMIN | VIEW | VIEW | HIDDEN | HIDDEN | HIDDEN |
| **System Settings** | ADMIN | ADMIN | HIDDEN | HIDDEN | HIDDEN | HIDDEN | HIDDEN |

*Note: For Dealer roles, values can be further customized by Central Admin on a per-dealer basis via `userPermissions`.*

---

## 4. Concrete Dealer Permission Scenarios

The system dynamically adapts to distinct operational profiles as specified:

### Scenario 1: Dealer A (High-Autonomy Commercial Dealer)
```json
{
  "dealerId": "DLR-1001",
  "modules": {
    "dashboard": "VIEW",
    "inventory": "EDIT",
    "orders": "EDIT",
    "customers": "VIEW",
    "payments": "VIEW",
    "reports": "VIEW"
  },
  "appConfiguration": {
    "priceVisibility": "DEALER_AND_MRP",
    "purchaseCostVisibility": false,
    "dashboardCards": ["sales", "orders", "inventory", "outstanding", "customers"]
  }
}
```
*Resulting Experience:* Dealer A manages local inventory counts, creates and edits orders, reviews customer accounts and payment ledgers, and sees reports.

### Scenario 2: Dealer B (Restricted Fulfillment Counter)
```json
{
  "dealerId": "DLR-1002",
  "modules": {
    "dashboard": "VIEW",
    "inventory": "VIEW",
    "orders": "CREATE",
    "customers": "HIDDEN",
    "payments": "HIDDEN",
    "reports": "HIDDEN"
  },
  "appConfiguration": {
    "priceVisibility": "DEALER_ONLY",
    "purchaseCostVisibility": false,
    "dashboardCards": ["orders", "inventory"]
  }
}
```
*Resulting Experience:* Dealer B sees only Inventory and Order placement. Customers, Payments, Ledger balances, and Reports are entirely removed from the UI and denied at the database layer.

### Scenario 3: Dealer C (Order & Financial Viewer)
```json
{
  "dealerId": "DLR-1003",
  "modules": {
    "dashboard": "VIEW",
    "inventory": "HIDDEN",
    "orders": "VIEW",
    "customers": "VIEW",
    "payments": "VIEW",
    "reports": "HIDDEN"
  },
  "appConfiguration": {
    "priceVisibility": "DEALER_ONLY",
    "purchaseCostVisibility": false,
    "dashboardCards": ["orders", "outstanding"]
  }
}
```
*Resulting Experience:* Dealer C cannot inspect inventory stocks. They can monitor historical orders, look up registered customers, and review payment settlements.

---

## 5. Permission Evaluation Engine Code Contract

Shared permission engine implementation in `shared/permissions/index.ts`:

```typescript
export type CapabilityLevel = 'HIDDEN' | 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'ADMIN';

export const CAPABILITY_RANKS: Record<CapabilityLevel, number> = {
  HIDDEN: 0,
  VIEW: 1,
  CREATE: 2,
  EDIT: 3,
  DELETE: 4,
  ADMIN: 5,
};

export type ModuleKey = 
  | 'dashboard'
  | 'dealerManagement'
  | 'userManagement'
  | 'productMaster'
  | 'centralInventory'
  | 'dealerInventory'
  | 'stockTransfers'
  | 'orders'
  | 'customers'
  | 'finance'
  | 'reports'
  | 'appManagement'
  | 'activityLogs'
  | 'settings';

export interface UserPermissionContext {
  userId: string;
  dealerId: string;
  role: string;
  modules: Record<ModuleKey, CapabilityLevel>;
}

/**
 * Evaluates whether the user satisfies the required capability on a target module.
 */
export function hasCapability(
  context: UserPermissionContext | null | undefined,
  module: ModuleKey,
  requiredLevel: CapabilityLevel
): boolean {
  if (!context) return false;
  if (context.role === 'SUPER_ADMIN') return true;

  const currentLevel = context.modules[module] ?? 'HIDDEN';
  return CAPABILITY_RANKS[currentLevel] >= CAPABILITY_RANKS[requiredLevel];
}
```
