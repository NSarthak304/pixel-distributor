import { describe, it, expect } from 'vitest';
import {
  CreateDealerSchema,
  CreateProductSchema,
  CreateOrderSchema,
  CreateAppReleaseSchema,
  GstinRegex,
  PanRegex,
  PinRegex,
} from '../../shared/validation/index.js';

describe('Zod Validation Schemas Unit Tests', () => {
  describe('Regex & Primitive Validations', () => {
    it('validates standard Indian GSTIN formats', () => {
      expect(GstinRegex.test('27AABCU9603R1ZM')).toBe(true);
      expect(GstinRegex.test('INVALID_GSTIN')).toBe(false);
      expect(GstinRegex.test('27AABCU9603R1Z')).toBe(false); // short
    });

    it('validates PAN format', () => {
      expect(PanRegex.test('AABCU9603R')).toBe(true);
      expect(PanRegex.test('AABCU9603')).toBe(false);
      expect(PanRegex.test('12345ABCDE')).toBe(false);
    });

    it('validates 6-digit Indian PIN codes', () => {
      expect(PinRegex.test('400001')).toBe(true);
      expect(PinRegex.test('110001')).toBe(true);
      expect(PinRegex.test('010001')).toBe(false); // cannot start with 0
      expect(PinRegex.test('40001')).toBe(false); // 5 digits
      expect(PinRegex.test('4000001')).toBe(false); // 7 digits
    });
  });

  describe('Dealer Schema Validation', () => {
    it('successfully parses valid dealer onboarding payload', () => {
      const validPayload = {
        businessName: 'Galaxy Communications',
        ownerName: 'Vikas Sharma',
        mobile: '+919876543210',
        email: 'vikas@galaxycomm.in',
        address: '101 MG Road, Commercial Zone',
        city: 'Bengaluru',
        state: 'Karnataka',
        pin: '560001',
        dealerType: 'PLATINUM',
        priceGroup: 'TIER_1',
        creditLimit: 750000,
        paymentTerms: 'NET_30',
        assignedWarehouse: 'WH-BLR-01',
      };

      const result = CreateDealerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('fails when PIN code is invalid', () => {
      const invalidPayload = {
        businessName: 'Galaxy Communications',
        ownerName: 'Vikas Sharma',
        mobile: '+919876543210',
        email: 'vikas@galaxycomm.in',
        address: '101 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pin: '999', // Invalid PIN
        assignedWarehouse: 'WH-BLR-01',
      };

      const result = CreateDealerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('pin'))).toBe(true);
      }
    });
  });

  describe('Product Master Schema Validation', () => {
    it('validates a complete product catalog entry', () => {
      const product = {
        sku: 'PX-ULTRA-256',
        name: 'Pixel Ultra 256GB',
        categoryId: 'cat_phones',
        categoryName: 'Smartphones',
        brand: 'Pixel',
        model: 'Ultra 2026',
        unit: 'PCS',
        mrp: 69999,
        purchasePrice: 48000,
        dealerPrices: {
          TIER_1: 52000,
          TIER_2: 54000,
          STANDARD: 56000,
        },
        reorderLevel: 15,
      };

      const result = CreateProductSchema.safeParse(product);
      expect(result.success).toBe(true);
    });

    it('rejects negative prices', () => {
      const badProduct = {
        sku: 'PX-BAD',
        name: 'Bad Product',
        categoryId: 'cat_phones',
        categoryName: 'Smartphones',
        brand: 'Pixel',
        model: 'X',
        unit: 'PCS',
        mrp: -100, // Negative MRP
        purchasePrice: 50,
        dealerPrices: { TIER_1: 60, TIER_2: 65, STANDARD: 70 },
      };

      const result = CreateProductSchema.safeParse(badProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('App Release Schema Validation', () => {
    it('validates correct APK release payload', () => {
      const release = {
        version: '1.2.0',
        versionCode: 120,
        downloadUrl: 'https://storage.googleapis.com/releases/pixel-app-v1.2.0.apk',
        checksum: 'a'.repeat(64), // 64 hex characters
        fileSize: 15420100,
        releaseNotes: 'Fixed offline syncing issue and added barcode scanner.',
        minimumSupportedVersion: '1.1.0',
        minimumVersionCode: 110,
        mandatory: true,
      };

      const result = CreateAppReleaseSchema.safeParse(release);
      expect(result.success).toBe(true);
    });

    it('rejects non-semver version strings', () => {
      const badRelease = {
        version: 'v1.2-beta!', // Non-semver
        versionCode: 120,
        downloadUrl: 'https://storage.googleapis.com/releases/app.apk',
        checksum: 'a'.repeat(64),
        fileSize: 1000,
        releaseNotes: 'Some notes',
        minimumSupportedVersion: '1.0.0',
        minimumVersionCode: 100,
      };

      const result = CreateAppReleaseSchema.safeParse(badRelease);
      expect(result.success).toBe(false);
    });
  });
});
