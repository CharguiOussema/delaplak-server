/**
 * One-time, idempotent migration: backfills `currency` on orders/order-items/invoices
 * created before currency snapshotting existed (they defaulted to a hardcoded 'MAD'
 * everywhere they were displayed). Backfills from each order's own item prices where
 * possible, falling back to 'MAD' (the original sole currency) as a last resort.
 *
 * Safe to run repeatedly — only touches documents missing `currency`.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../config/database';

const FALLBACK_CURRENCY = 'MAD';

async function main() {
  await connectToDatabase();
  console.log('[migrate] Connected to database');

  const orders = mongoose.connection.collection('orders');
  const invoices = mongoose.connection.collection('invoices');

  const legacyOrders = await orders.find({ currency: { $exists: false } }).toArray();
  console.log(`[migrate] Found ${legacyOrders.length} order(s) missing 'currency'`);

  for (const order of legacyOrders) {
    const currency = order.items?.[0]?.currency ?? FALLBACK_CURRENCY;
    const items = (order.items ?? []).map((item: Record<string, unknown>) => ({ ...item, currency: item.currency ?? currency }));
    await orders.updateOne({ _id: order._id }, { $set: { currency, items } });
    console.log(`[migrate] Order ${order._id} -> currency '${currency}'`);
  }

  const legacyInvoices = await invoices.find({ currency: { $exists: false } }).toArray();
  console.log(`[migrate] Found ${legacyInvoices.length} invoice(s) missing 'currency'`);

  for (const invoice of legacyInvoices) {
    const relatedOrder = await orders.findOne({ _id: invoice.order });
    const currency = relatedOrder?.currency ?? FALLBACK_CURRENCY;
    await invoices.updateOne({ _id: invoice._id }, { $set: { currency } });
    console.log(`[migrate] Invoice ${invoice._id} -> currency '${currency}'`);
  }

  console.log('[migrate] Done.');
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('[migrate] Failed:', error);
  process.exit(1);
});
