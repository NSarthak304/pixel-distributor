# Pixel Distributor - Testing & Quality Assurance Architecture

## 1. Testing Strategy & Pyramid

Quality assurance in Pixel Distributor is engineered around strict multi-tenant boundary verification and transaction correctness.

```
                  ┌────────────────────────┐
                  │       E2E Tests        │
                  │   Playwright / Detox   │
                  │ (Full User Workflows)  │
                  ├────────────────────────┤
                  │   Integration Tests    │
                  │  Multi-Tenant Scoping  │
                  │ (Stock & Order Flows)  │
                  ├────────────────────────┤
                  │  Security Rules Tests  │
                  │ @firebase/rules-testing│
                  │ (Tenant Boundary Gate) │
                  ├────────────────────────┤
                  │       Unit Tests       │
                  │   Vitest / Jest / Zod  │
                  │ (Permissions, Math)    │
                  └────────────────────────┘
```

---

## 2. Automated Firestore Security Rules Unit Testing

Security rules unit testing is mandatory. We employ `@firebase/rules-unit-testing` against the local Firestore Emulator to programmatically verify that cross-tenant access is impossible.

### Test Specification: Multi-Tenant Boundary Suite
```typescript
import { 
  initializeTestEnvironment, 
  assertFails, 
  assertSucceeds,
  RulesTestEnvironment 
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'pixel-distributor-test',
    firestore: {
      rules: readFileSync('firebase/firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Multi-Tenant Security Rules Isolation', () => {
  it('prevents Dealer A from reading Dealer B orders', async () => {
    // Authenticated context for Dealer A
    const dealerA = testEnv.authenticatedContext('user_dealer_a', {
      dealerId: 'DLR-A',
      role: 'DEALER',
      status: 'ACTIVE',
    });

    const db = dealerA.firestore();
    
    // Attempt to read order belonging to Dealer B
    const orderDoc = db.collection('orders').doc('ORD-DEALER-B-101');
    await assertFails(orderDoc.get());
  });

  it('allows Dealer A to read their own orders', async () => {
    // Setup existing document using admin context (bypasses rules)
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      await adminContext.firestore().collection('orders').doc('ORD-DEALER-A-101').set({
        dealerId: 'DLR-A',
        total: 5000,
        status: 'CONFIRMED',
      });
    });

    const dealerA = testEnv.authenticatedContext('user_dealer_a', {
      dealerId: 'DLR-A',
      role: 'DEALER',
      status: 'ACTIVE',
    });

    const db = dealerA.firestore();
    await assertSucceeds(db.collection('orders').doc('ORD-DEALER-A-101').get());
  });

  it('rejects direct modification of inventoryTransactions ledger', async () => {
    const dealerA = testEnv.authenticatedContext('user_dealer_a', {
      dealerId: 'DLR-A',
      role: 'DEALER',
      status: 'ACTIVE',
    });

    const db = dealerA.firestore();
    const txnDoc = db.collection('inventoryTransactions').doc('TXN-909');
    
    // Direct updates are strictly blocked
    await assertFails(txnDoc.update({ quantityDelta: 999 }));
    await assertFails(txnDoc.delete());
  });
});
```

---

## 3. Unit Testing Matrix

Unit tests execute via **Vitest** in under 5 seconds:

1. **Permission Engine:** Tests `hasCapability(context, module, level)` for all standard roles and custom overrides (e.g. Dealer A, B, and C test vectors).
2. **Stock Equation Invariant:** Tests that stock cannot transition below zero and that opening stock + deltas equals balance after.
3. **App Release Evaluator:** Tests `evaluateUpdateRequirement(currentVersion, latestRelease)` for optional, mandatory, and edge-case version code comparisons.
4. **Zod Validation Schemas:** Verifies that invalid GSTINs, negative credit limits, or malformed emails are rejected before touching the database.

---

## 4. Quality Gate Execution Protocol

Per project instructions (Section 28), after every implementation milestone:
1. `npm test`: Run all unit and rules tests.
2. `npm run typecheck`: Run TypeScript compiler checks with zero warnings.
3. `npm run lint`: Enforce code formatting and import hygiene.
4. **Failure Policy:** Never skip or silence failed tests. Any failure must be diagnosed and resolved immediately before proceeding to subsequent tasks.
