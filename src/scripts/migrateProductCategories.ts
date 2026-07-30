/**
 * One-time, idempotent migration: backfills `categories: [ObjectId]` on any product
 * still shaped with the pre-refactor singular `category: ObjectId` field (Mongoose's
 * strict schema silently drops fields no longer declared on the model, so these documents
 * read back with `categories` missing entirely until this runs).
 *
 * Safe to run repeatedly — only touches documents missing `categories`.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../config/database';

async function main() {
  await connectToDatabase();
  console.log('[migrate] Connected to database');

  const collection = mongoose.connection.collection('products');
  const legacyDocs = await collection
    .find({ categories: { $exists: false }, category: { $exists: true } })
    .toArray();

  console.log(`[migrate] Found ${legacyDocs.length} product(s) with a legacy 'category' field`);

  for (const doc of legacyDocs) {
    await collection.updateOne(
      { _id: doc._id },
      { $set: { categories: [doc.category] }, $unset: { category: '' } },
    );
    console.log(`[migrate] Migrated product ${doc._id} (${doc.name?.en ?? ''})`);
  }

  console.log('[migrate] Done.');
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('[migrate] Failed:', error);
  process.exit(1);
});
