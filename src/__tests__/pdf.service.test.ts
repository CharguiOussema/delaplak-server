import fs from 'fs';
import { generateInvoicePdf } from '../services/pdf.service';

describe('pdf.service: generateInvoicePdf', () => {
  it('writes a non-empty PDF file to disk and returns its relative/absolute paths', async () => {
    const { relativePath, absolutePath } = await generateInvoicePdf({
      number: 'INV-TEST01',
      issuedAt: new Date(),
      client: { email: 'pdf-test@test.com' },
      lines: [{ description: 'Test line', quantity: 1, unitPrice: 50, lineTotal: 50 }],
      subtotal: 50,
      total: 50,
    });

    expect(relativePath).toBe('/uploads/invoices/INV-TEST01.pdf');
    expect(fs.existsSync(absolutePath)).toBe(true);
    const stats = fs.statSync(absolutePath);
    expect(stats.size).toBeGreaterThan(0);

    fs.unlinkSync(absolutePath);
  });
});
