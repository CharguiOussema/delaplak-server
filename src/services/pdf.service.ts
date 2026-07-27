import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { ENV } from '../config';
import { InvoiceLine } from '../models/invoice.model';

export interface InvoicePdfData {
  number: string;
  issuedAt: Date;
  client: { email: string };
  lines: InvoiceLine[];
  subtotal: number;
  total: number;
  currency?: string;
}

const INVOICES_DIR = path.join(process.cwd(), ENV.UPLOAD_DIR, 'invoices');

export function ensureInvoicesDir() {
  if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR, { recursive: true });
  }
}

/**
 * Renders a simple, clean invoice PDF (brand header, client info, line-items table,
 * totals) to disk under `<UPLOAD_DIR>/invoices/<number>.pdf` and resolves once the
 * file stream has finished writing.
 */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<{ relativePath: string; absolutePath: string }> {
  ensureInvoicesDir();

  const fileName = `${data.number}.pdf`;
  const absolutePath = path.join(INVOICES_DIR, fileName);
  const relativePath = `/uploads/invoices/${fileName}`;
  const currency = data.currency || 'MAD';

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(absolutePath);
    doc.pipe(stream);

    doc.fontSize(20).text('DeLAPLAK-Next', { continued: false });
    doc.fontSize(10).fillColor('#555').text('PVC Panels & Wall Solutions');
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(16).text(`Invoice ${data.number}`);
    doc.fontSize(10).fillColor('#555').text(`Issued: ${data.issuedAt.toISOString().slice(0, 10)}`);
    doc.moveDown();

    doc.fillColor('#000').fontSize(11).text(`Bill to: ${data.client.email}`);
    doc.moveDown(1);

    const tableTop = doc.y;
    const colX = { description: 50, quantity: 300, unitPrice: 380, lineTotal: 470 };

    doc.fontSize(10).fillColor('#000');
    doc.text('Description', colX.description, tableTop);
    doc.text('Qty', colX.quantity, tableTop);
    doc.text('Unit Price', colX.unitPrice, tableTop);
    doc.text('Total', colX.lineTotal, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let y = tableTop + 22;
    for (const line of data.lines) {
      doc.text(line.description, colX.description, y, { width: 240 });
      doc.text(String(line.quantity), colX.quantity, y);
      doc.text(`${line.unitPrice.toFixed(2)} ${currency}`, colX.unitPrice, y);
      doc.text(`${line.lineTotal.toFixed(2)} ${currency}`, colX.lineTotal, y);
      y += 20;
    }

    doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
    y += 15;
    doc.fontSize(10).text('Subtotal:', colX.unitPrice, y);
    doc.text(`${data.subtotal.toFixed(2)} ${currency}`, colX.lineTotal, y);
    y += 18;
    doc.fontSize(12).text('Total:', colX.unitPrice, y);
    doc.text(`${data.total.toFixed(2)} ${currency}`, colX.lineTotal, y);

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  return { relativePath, absolutePath };
}
