import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../backend/src/app.js';

describe('Pixel Distributor Backend REST API Integration Suite', () => {
  it('GET /health returns healthy status and metrics', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.dealersCount).toBeGreaterThan(0);
  });

  it('GET /api/v1/dealers lists seeded dealers', async () => {
    const res = await request(app).get('/api/v1/dealers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((d: { dealerId: string }) => d.dealerId === 'DLR-1001')).toBe(true);
  });

  it('POST /api/v1/dealers executes Add Dealer workflow and generates permissions/config', async () => {
    const newDealerPayload = {
      businessName: 'Horizon Electronics Hub',
      ownerName: 'Manish Malhotra',
      mobile: '+919877001122',
      email: 'manish@horizonelec.in',
      address: '24 South Extension Phase 1',
      city: 'New Delhi',
      state: 'Delhi',
      pin: '110049',
      dealerType: 'GOLD',
      priceGroup: 'TIER_1',
      creditLimit: 600000,
      paymentTerms: 'NET_30',
      assignedWarehouse: 'WH-MUMBAI-01',
    };

    const res = await request(app).post('/api/v1/dealers').send(newDealerPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dealer.dealerId).toMatch(/^DLR-\d+$/);
    expect(res.body.data.user.role).toBe('DEALER');
    expect(res.body.data.permissionProfile.modules.orders).toBe('EDIT');
    expect(res.body.data.appConfiguration.purchaseCostVisibility).toBe(false);
  });

  it('PATCH /api/v1/dealers/:id/status suspends dealer account and revokes access', async () => {
    const res = await request(app)
      .patch('/api/v1/dealers/DLR-1002/status')
      .send({ status: 'SUSPENDED', reason: 'Credit review pending' });

    expect(res.status).toBe(200);
    expect(res.body.data.accountStatus).toBe('SUSPENDED');

    // Verify dealer profile reflects suspension
    const getRes = await request(app).get('/api/v1/dealers/DLR-1002');
    expect(getRes.body.data.dealer.accountStatus).toBe('SUSPENDED');
  });

  it('PUT /api/v1/dealers/:id/permissions updates capability matrix', async () => {
    const updatedModules = {
      dashboard: 'VIEW',
      inventory: 'VIEW',
      orders: 'CREATE',
      customers: 'HIDDEN',
      payments: 'HIDDEN',
      reports: 'HIDDEN',
    };

    const res = await request(app)
      .put('/api/v1/dealers/DLR-1001/permissions')
      .send({ modules: updatedModules });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.modules.inventory).toBe('VIEW');
  });

  it('GET /api/v1/products strips purchasePrice for dealer views', async () => {
    const res = await request(app).get('/api/v1/products?role=DEALER&priceGroup=TIER_1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const first = res.body.data[0];
    expect(first.purchasePrice).toBeUndefined(); // Strictly masked!
    expect(first.activePrice).toBeGreaterThan(0);
  });

  it('Complete Stock Transfer Workflow: Create -> Deliver', async () => {
    // 1. Create Stock Transfer
    const createRes = await request(app)
      .post('/api/v1/inventory/transfers')
      .send({
        sourceId: 'WH-MUMBAI-01',
        destinationId: 'DLR-1001',
        dealerId: 'DLR-1001',
        items: [
          {
            sku: 'PX-ULTRA-256',
            productId: 'PRD-101',
            productName: 'Pixel Ultra 256GB Titanium',
            quantity: 10,
          },
        ],
        notes: 'Replenishment',
      });

    expect(createRes.status).toBe(201);
    const transferId = createRes.body.data.transferId;

    // 2. Deliver Stock Transfer
    const deliverRes = await request(app)
      .post(`/api/v1/inventory/transfers/${transferId}/deliver`)
      .send();

    expect(deliverRes.status).toBe(200);
    expect(deliverRes.body.data.status).toBe('DELIVERED');
  });

  it('POST /api/v1/orders verifies dealer credit limit and records order', async () => {
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        dealerId: 'DLR-1001',
        items: [
          {
            sku: 'PX-BUDS-PRO',
            productId: 'PRD-103',
            productName: 'Pixel Buds Pro Wireless ANC',
            quantity: 2,
            unitPrice: 9900,
            tax: 0,
            discount: 0,
            lineTotal: 19800,
          },
        ],
        subtotal: 19800,
        grandTotal: 19800,
        shippingAddress: {
          address: 'Shop 12',
          city: 'Mumbai',
          state: 'Maharashtra',
          pin: '400093',
        },
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.status).toBe('PENDING');
  });

  it('GET /api/v1/releases/latest performs in-app version interrogation', async () => {
    const res = await request(app).get('/api/v1/releases/latest?versionCode=90');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.updateRequired).toBe(true);
    expect(res.body.data.release.version).toBe('1.0.0');
  });

  it('GET /api/v1/activity retrieves recorded audit logs', async () => {
    const res = await request(app).get('/api/v1/activity');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.some((l: { action: string }) => l.action === 'DEALER_PROVISIONED')).toBe(true);
  });
});
