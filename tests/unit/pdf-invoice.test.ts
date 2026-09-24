import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../backend/src/app.js';
import { PdfInvoiceService } from '../../backend/src/services/pdf-invoice.service.js';
import { globalStore } from '../../backend/src/store/memory-store.js';
import { Order, Dealer, StockTransfer, Warehouse } from '@pixel/shared';

describe('PDF Invoice & Dispatch Slip Generator Suite', () => {
  const sampleDealer: Dealer = {
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
  };

  const sampleOrder: Order = {
    orderId: 'ORD-2026-9901',
    dealerId: 'DLR-1001',
    items: [
      {
        sku: 'PX-ULTRA-256',
        productId: 'PRD-101',
        productName: 'Pixel Ultra 256GB Titanium',
        quantity: 2,
        unitPrice: 56000,
        tax: 20160,
        discount: 0,
        lineTotal: 112000,
      },
    ],
    subtotal: 112000,
    discountTotal: 0,
    taxTotal: 20160,
    grandTotal: 132160,
    status: 'CONFIRMED',
    paymentStatus: 'UNPAID',
    shippingAddress: {
      address: '42 Ring Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin: '400093',
    },
    createdBy: 'usr_dealer',
    createdAt: '2026-09-24T10:00:00Z',
    updatedAt: '2026-09-24T10:00:00Z',
  };

  const sampleWarehouse: Warehouse = {
    warehouseId: 'WH-MUMBAI-01',
    name: 'Central Mumbai Fulfillment Hub',
    address: 'Plot 18, Kurla Industrial Estate',
    city: 'Mumbai',
    state: 'Maharashtra',
    contactPerson: 'Sanjay Verma',
    contactPhone: '+919820011223',
    isActive: true,
  };

  const sampleTransfer: StockTransfer = {
    transferId: 'TRF-8812',
    sourceType: 'CENTRAL_WAREHOUSE',
    sourceId: 'WH-MUMBAI-01',
    destinationType: 'DEALER',
    destinationId: 'DLR-1001',
    dealerId: 'DLR-1001',
    items: [
      {
        sku: 'PX-ULTRA-256',
        productId: 'PRD-101',
        productName: 'Pixel Ultra 256GB Titanium',
        quantity: 25,
      },
    ],
    status: 'APPROVED',
    createdBy: 'usr_admin',
    createdAt: '2026-09-24T11:00:00Z',
    updatedAt: '2026-09-24T11:00:00Z',
  };

  it('generates a valid binary PDF Tax Invoice with standard %PDF- header', async () => {
    const pdfBytes = await PdfInvoiceService.generateTaxInvoice(sampleOrder, sampleDealer);

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Verify PDF header magic bytes "%PDF-"
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('generates a valid binary PDF Stock Dispatch Delivery Challan', async () => {
    const pdfBytes = await PdfInvoiceService.generateDispatchChallan(
      sampleTransfer,
      sampleWarehouse,
      sampleDealer
    );

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('GET /api/v1/orders/:id/invoice serves PDF stream with application/pdf header', async () => {
    // Seed order in store
    globalStore.orders.set(sampleOrder.orderId, sampleOrder);

    const res = await request(app).get(`/api/v1/orders/${sampleOrder.orderId}/invoice`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.length).toBeGreaterThan(1000);
  });

  it('GET /api/v1/inventory/transfers/:id/challan serves dispatch PDF challan', async () => {
    // Seed transfer in store
    globalStore.stockTransfers.set(sampleTransfer.transferId, sampleTransfer);

    const res = await request(app).get(`/api/v1/inventory/transfers/${sampleTransfer.transferId}/challan`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.length).toBeGreaterThan(1000);
  });
});
