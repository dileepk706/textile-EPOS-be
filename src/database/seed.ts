import 'dotenv/config';
import { logger } from '@/shared/logger.js';
import env from '@/config/environment.js';
import { hashPassword } from '@/utils/hash.util.js';
import UserModel from '@/module/user/infrastructure/user.schema.js';
import TextileModel from '@/module/textile/infrastructure/textile.schema.js';
import TillModel from '@/module/till/infrastructure/till.schema.js';
import { connectDB, disconnectDB } from '@/database/connection.js';

export interface SeedResult {
  textile: any;
  user: any;
  till: any;
  createdTextile: boolean;
  createdUser: boolean;
  createdTill: boolean;
}

export const seedDatabase = async (): Promise<SeedResult> => {
  logger.info('🌱 Checking and running startup database seed...');

  // 1. Seed or find the Default Textile Store
  let textile = await TextileModel.findOne({ is_active: true });
  let createdTextile = false;

  if (!textile) {
    logger.info('Creating default single-tenant textile store...');
    textile = await TextileModel.create({
      name: 'Classic Textiles',
      code: 'TXT-MAIN',
      phone: '+91 98765 43210',
      email: 'contact@classictextiles.com',
      address: {
        street: '100 Silk Market Lane',
        city: 'Bangalore',
        state: 'Karnataka',
        postal_code: '560002',
        country: 'India',
      },
      gstin: '29AABCT1234F1Z9',
      currency: 'INR',
      is_active: true,
      settings: {
        receipt_header: 'CLASSIC TEXTILES & SILKS',
        receipt_footer:
          'Thank you for shopping with us! Goods once sold can be exchanged within 7 days.',
        tax_rate: 5,
        enable_barcode: true,
      },
    });

    // Link tenant_id to itself for future multi-tenancy compatibility
    textile.tenant_id = textile._id.toString();
    await textile.save();
    createdTextile = true;
    logger.info(`✅ Default textile store created: [${textile.name}] (ID: ${textile._id})`);
  } else {
    logger.info(`ℹ️ Existing textile store found: [${textile.name}] (ID: ${textile._id})`);
  }

  const textileIdStr = textile._id.toString();

  // 2. Seed or find the Default Owner User
  const defaultAdminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@textileshop.com')
    .toLowerCase()
    .trim();
  const defaultPassword = env.DEFAULT_PASSWORD || '123';

  let user = await UserModel.findOne({ email: defaultAdminEmail });
  let createdUser = false;

  if (!user) {
    logger.info(`Creating default owner user: [${defaultAdminEmail}]...`);
    const hashedPassword = await hashPassword(defaultPassword);

    user = await UserModel.create({
      email: defaultAdminEmail,
      password: hashedPassword,
      name: 'Textile Owner',
      phone: '+91 98765 43210',
      role: 'ADMIN',
      user_type: 'ADMIN',
      tenant_id: textileIdStr,
      textile_id: textileIdStr,
      is_active: true,
    });
    createdUser = true;
    logger.info(
      `✅ Default owner user created: [${user.email}] with password: [${defaultPassword}]`,
    );
  } else {
    // Ensure admin user has role ADMIN and linked to textile
    let modified = false;
    if (user.role !== 'ADMIN' || user.user_type !== 'ADMIN') {
      user.role = 'ADMIN';
      user.user_type = 'ADMIN';
      modified = true;
    }
    if (!user.textile_id || !user.tenant_id) {
      user.textile_id = textileIdStr;
      user.tenant_id = textileIdStr;
      modified = true;
    }
    if (modified) {
      await user.save();
      logger.info(
        `Updated user [${user.email}] with role ADMIN and linked to textile [${textileIdStr}]`,
      );
    }
    logger.info(`ℹ️ Existing admin/owner user found: [${user.email}] (Role: ${user.role})`);
  }

  // 3. Ensure any existing users without a textile_id get linked to this textile
  const unlinkedUsers = await UserModel.updateMany(
    { $or: [{ textile_id: null }, { textile_id: { $exists: false } }] },
    { $set: { textile_id: textileIdStr, tenant_id: textileIdStr } },
  );

  if (unlinkedUsers.modifiedCount > 0) {
    logger.info(
      `Linked ${unlinkedUsers.modifiedCount} existing unlinked user(s) to textile [${textileIdStr}]`,
    );
  }

  // 4. Seed or find the Default Till Terminal
  let till = await TillModel.findOne({ textile_id: textileIdStr });
  let createdTill = false;

  if (!till) {
    logger.info('Creating default POS till terminal...');
    const hashedTillPin = await hashPassword('1234');

    till = await TillModel.create({
      name: 'Counter 1 - Main Billing',
      code: 'TILL-01',
      password: hashedTillPin,
      status: 'closed',
      is_blocked: false,
      cash_in_till: 1000,
      opening_balance: 1000,
      closing_balance: null,
      discrepancy: null,
      textile_id: textileIdStr,
      tenant_id: textileIdStr,
      is_linked: false,
      notes: 'Primary ground floor billing counter',
    });
    createdTill = true;
    logger.info(`✅ Default till created: [${till.name}] (${till.code}) with PIN [1234]`);
  } else {
    logger.info(`ℹ️ Existing till found: [${till.name}] (${till.code})`);
  }

  logger.info('🌱 Database seeding completed successfully.');

  return {
    textile: textile.toJSON ? textile.toJSON() : textile,
    user: user.toJSON ? user.toJSON() : user,
    till: till.toJSON ? till.toJSON() : till,
    createdTextile,
    createdUser,
    createdTill,
  };
};

// Auto-run if executed directly via CLI (tsx src/database/seed.ts)
const isDirectExecution =
  process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'));

if (isDirectExecution) {
  (async () => {
    try {
      await connectDB();
      const result = await seedDatabase();
      console.log('\n=== SEED SUMMARY ===');
      console.log(`Textile Store: ${result.textile.name} (ID: ${result.textile.id})`);
      console.log(
        `Default User:  ${result.user.email} (Password: ${env.DEFAULT_PASSWORD || '123'})`,
      );
      console.log(`Default Till:  ${result.till.name} (${result.till.code}, PIN: 1234)`);
      console.log('====================\n');
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      logger.error('Seeding error:', err);
      process.exit(1);
    }
  })();
}

export default seedDatabase;
