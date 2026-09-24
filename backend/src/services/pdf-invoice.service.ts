/**
 * Pixel Distributor - Professional PDF Document Generator
 *
 * Generates GST Tax Invoices and Warehouse Stock Dispatch Delivery Challans.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Order, Dealer, StockTransfer, Warehouse } from '@pixel/shared';

export class PdfInvoiceService {
  /**
   * Generates a formal GST Tax Invoice PDF document.
   */
  public static async generateTaxInvoice(order: Order, dealer: Dealer): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions in points
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

    // Color definitions
    const primaryColor = rgb(0.31, 0.27, 0.89); // Indigo 600
    const darkColor = rgb(0.09, 0.11, 0.15); // Slate 900
    const grayColor = rgb(0.39, 0.45, 0.55); // Slate 500
    const lightBg = rgb(0.96, 0.97, 0.98); // Slate 100

    let y = height - 50;

    // 1. Header Banner
    page.drawText('PIXEL DISTRIBUTOR', {
      x: 50,
      y,
      size: 20,
      font: fontBold,
      color: primaryColor,
    });

    page.drawText('ORIGINAL TAX INVOICE', {
      x: width - 210,
      y,
      size: 12,
      font: fontBold,
      color: darkColor,
    });

    y -= 18;
    page.drawText('Central Distribution & Logistics Hub • GSTIN: 27AAACP0123M1Z9', {
      x: 50,
      y,
      size: 8,
      font: fontRegular,
      color: grayColor,
    });

    y -= 25;
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    // 2. Invoice & Dealer Meta Grid
    y -= 25;
    page.drawText('Billed To (Dealer Partner):', { x: 50, y, size: 9, font: fontBold, color: primaryColor });
    page.drawText('Invoice Details:', { x: 350, y, size: 9, font: fontBold, color: primaryColor });

    y -= 14;
    page.drawText(dealer.businessName, { x: 50, y, size: 10, font: fontBold, color: darkColor });
    page.drawText(`Invoice No: ${order.orderId}`, { x: 350, y, size: 9, font: fontMono, color: darkColor });

    y -= 14;
    page.drawText(`Proprietor: ${dealer.ownerName} (${dealer.mobile})`, { x: 50, y, size: 8, font: fontRegular, color: grayColor });
    page.drawText(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, { x: 350, y, size: 8, font: fontRegular, color: grayColor });

    y -= 12;
    page.drawText(`Address: ${dealer.address}, ${dealer.city}, ${dealer.state} - ${dealer.pin}`, { x: 50, y, size: 8, font: fontRegular, color: grayColor });
    page.drawText(`Payment Terms: ${dealer.paymentTerms}`, { x: 350, y, size: 8, font: fontRegular, color: grayColor });

    y -= 12;
    page.drawText(`GSTIN: ${dealer.gstin || 'N/A'} | PAN: ${dealer.pan || 'N/A'}`, { x: 50, y, size: 8, font: fontRegular, color: grayColor });
    page.drawText(`Status: ${order.paymentStatus}`, { x: 350, y, size: 8, font: fontBold, color: rgb(0.05, 0.59, 0.41) });

    // 3. Line Items Table Header
    y -= 30;
    page.drawRectangle({
      x: 50,
      y: y - 5,
      width: width - 100,
      height: 22,
      color: lightBg,
    });

    page.drawText('SKU / Code', { x: 60, y: y + 2, size: 8, font: fontBold, color: darkColor });
    page.drawText('Item Description', { x: 150, y: y + 2, size: 8, font: fontBold, color: darkColor });
    page.drawText('Qty', { x: 330, y: y + 2, size: 8, font: fontBold, color: darkColor });
    page.drawText('Unit Price (INR)', { x: 380, y: y + 2, size: 8, font: fontBold, color: darkColor });
    page.drawText('Total (INR)', { x: 470, y: y + 2, size: 8, font: fontBold, color: darkColor });

    // 4. Line Items Rows
    y -= 20;
    for (const item of order.items) {
      page.drawText(item.sku, { x: 60, y, size: 8, font: fontMono, color: primaryColor });
      page.drawText(item.productName, { x: 150, y, size: 8, font: fontRegular, color: darkColor });
      page.drawText(item.quantity.toString(), { x: 335, y, size: 8, font: fontRegular, color: darkColor });
      page.drawText(`Rs. ${item.unitPrice.toLocaleString('en-IN')}`, { x: 380, y, size: 8, font: fontRegular, color: darkColor });
      page.drawText(`Rs. ${item.lineTotal.toLocaleString('en-IN')}`, { x: 470, y, size: 8, font: fontBold, color: darkColor });

      y -= 18;
    }

    y -= 15;
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    // 5. Totals Breakdown
    y -= 25;
    const totalsX = 350;
    page.drawText('Subtotal:', { x: totalsX, y, size: 9, font: fontRegular, color: grayColor });
    page.drawText(`Rs. ${order.subtotal.toLocaleString('en-IN')}`, { x: 470, y, size: 9, font: fontRegular, color: darkColor });

    y -= 16;
    page.drawText('Integrated GST (18%):', { x: totalsX, y, size: 9, font: fontRegular, color: grayColor });
    page.drawText(`Rs. ${(order.taxTotal || 0).toLocaleString('en-IN')}`, { x: 470, y, size: 9, font: fontRegular, color: darkColor });

    y -= 20;
    page.drawRectangle({
      x: totalsX - 10,
      y: y - 5,
      width: width - totalsX - 40,
      height: 24,
      color: rgb(0.93, 0.95, 1.0),
    });
    page.drawText('GRAND TOTAL:', { x: totalsX, y: y + 2, size: 10, font: fontBold, color: primaryColor });
    page.drawText(`Rs. ${order.grandTotal.toLocaleString('en-IN')}`, { x: 460, y: y + 2, size: 11, font: fontBold, color: primaryColor });

    // 6. Signatory & Declaration Footer
    y -= 80;
    page.drawText('Terms & Conditions:', { x: 50, y, size: 8, font: fontBold, color: darkColor });
    y -= 12;
    page.drawText('1. Goods once sold are subject to manufacturer warranty policy.', { x: 50, y, size: 7, font: fontRegular, color: grayColor });
    y -= 10;
    page.drawText('2. Overdue payments accrue standard commercial financing interest at 18% p.a.', { x: 50, y, size: 7, font: fontRegular, color: grayColor });

    // Authorized Signature
    page.drawText('For PIXEL DISTRIBUTOR', { x: width - 180, y: y + 10, size: 8, font: fontBold, color: darkColor });
    y -= 30;
    page.drawLine({
      start: { x: width - 180, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: darkColor,
    });
    page.drawText('Authorized Signatory', { x: width - 165, y: y - 10, size: 7, font: fontRegular, color: grayColor });

    return await pdfDoc.save();
  }

  /**
   * Generates a formal Warehouse Stock Transfer Dispatch Challan.
   */
  public static async generateDispatchChallan(
    transfer: StockTransfer,
    sourceWarehouse: Warehouse,
    destinationDealer: Dealer
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

    const primaryColor = rgb(0.05, 0.59, 0.41); // Emerald 600
    const darkColor = rgb(0.09, 0.11, 0.15);
    const grayColor = rgb(0.39, 0.45, 0.55);
    const lightBg = rgb(0.96, 0.97, 0.98);

    let y = height - 50;

    // Header
    page.drawText('PIXEL DISTRIBUTOR', { x: 50, y, size: 18, font: fontBold, color: primaryColor });
    page.drawText('STOCK DISPATCH CHALLAN', { x: width - 230, y, size: 12, font: fontBold, color: darkColor });

    y -= 25;
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    // Locations Grid
    y -= 25;
    page.drawText('Origin (Source Warehouse):', { x: 50, y, size: 9, font: fontBold, color: primaryColor });
    page.drawText('Destination (Dealer):', { x: 320, y, size: 9, font: fontBold, color: primaryColor });

    y -= 14;
    page.drawText(sourceWarehouse.name, { x: 50, y, size: 10, font: fontBold, color: darkColor });
    page.drawText(destinationDealer.businessName, { x: 320, y, size: 10, font: fontBold, color: darkColor });

    y -= 12;
    page.drawText(`Manager: ${sourceWarehouse.contactPerson} (${sourceWarehouse.contactPhone})`, { x: 50, y, size: 8, font: fontRegular, color: grayColor });
    page.drawText(`Dealer ID: ${destinationDealer.dealerId}`, { x: 320, y, size: 8, font: fontBold, color: darkColor });

    y -= 12;
    page.drawText(`Address: ${sourceWarehouse.address}, ${sourceWarehouse.city}`, { x: 50, y, size: 8, font: fontRegular, color: grayColor });
    page.drawText(`Address: ${destinationDealer.address}, ${destinationDealer.city}`, { x: 320, y, size: 8, font: fontRegular, color: grayColor });

    y -= 20;
    page.drawText(`Challan ID: ${transfer.transferId}`, { x: 50, y, size: 9, font: fontMono, color: darkColor });
    page.drawText(`Dispatch Date: ${new Date(transfer.createdAt).toLocaleDateString('en-IN')}`, { x: 320, y, size: 8, font: fontRegular, color: grayColor });

    // Table Header
    y -= 30;
    page.drawRectangle({ x: 50, y: y - 5, width: width - 100, height: 22, color: lightBg });
    page.drawText('SKU Barcode', { x: 60, y: y + 2, size: 8, font: fontBold, color: darkColor });
    page.drawText('Product Name / Description', { x: 180, y: y + 2, size: 8, font: fontBold, color: darkColor });
    page.drawText('Dispatched Quantity', { x: 420, y: y + 2, size: 8, font: fontBold, color: darkColor });

    y -= 20;
    let totalItems = 0;
    for (const item of transfer.items) {
      page.drawText(item.sku, { x: 60, y, size: 8, font: fontMono, color: primaryColor });
      page.drawText(item.productName, { x: 180, y, size: 8, font: fontRegular, color: darkColor });
      page.drawText(`${item.quantity} PCS`, { x: 440, y, size: 8, font: fontBold, color: darkColor });
      totalItems += item.quantity;
      y -= 18;
    }

    y -= 15;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.85, 0.88, 0.92) });

    y -= 20;
    page.drawText(`Total Units Dispatched: ${totalItems} Units`, { x: 50, y, size: 9, font: fontBold, color: darkColor });
    page.drawText(`Logistics Status: ${transfer.status}`, { x: 320, y, size: 9, font: fontBold, color: primaryColor });

    // Signatures
    y -= 70;
    page.drawLine({ start: { x: 50, y }, end: { x: 180, y }, thickness: 1, color: darkColor });
    page.drawLine({ start: { x: width - 180, y }, end: { x: width - 50, y }, thickness: 1, color: darkColor });

    page.drawText('Warehouse Dispatcher Sign', { x: 55, y: y - 10, size: 7, font: fontRegular, color: grayColor });
    page.drawText('Receiving Dealer Stamp & Sign', { x: width - 175, y: y - 10, size: 7, font: fontRegular, color: grayColor });

    return await pdfDoc.save();
  }
}
