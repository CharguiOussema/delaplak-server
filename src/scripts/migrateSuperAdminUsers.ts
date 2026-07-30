/**
 * One-time, idempotent migration: demotes any user still carrying the pre-refactor
 * 'SUPER_ADMIN' role (no longer a valid USER_ROLES value) down to 'ADMIN'.
 *
 * Without this, such a user is permanently locked out post-refactor — every route's
 * AccessTokenValidator.hasRole([ADMIN, CLIENT]) guard rejects a role it doesn't recognize.
 * Safe to run repeatedly — only touches documents that still have the legacy value.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../config/database';
import { USER_ROLES } from '../types/consts';

async function main() {
  await connectToDatabase();
  console.log('[migrate] Connected to database');

  const collection = mongoose.connection.collection('users');
  const legacyUsers = await collection.find({ role: { $nin: Object.values(USER_ROLES) } }).toArray();

  console.log(`[migrate] Found ${legacyUsers.length} user(s) with a legacy role value`);

  for (const user of legacyUsers) {
    console.log(`[migrate] Demoting ${user.email} from '${user.role}' to '${USER_ROLES.ADMIN}'`);
    await collection.updateOne({ _id: user._id }, { $set: { role: USER_ROLES.ADMIN } });
  }

  console.log('[migrate] Done.');
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('[migrate] Failed:', error);
  process.exit(1);
});
