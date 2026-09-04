import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
const dbUrl = (process.env.DATABASE_URL || '').trim();

if (!fs.existsSync(schemaPath)) {
  console.warn('Prisma schema not found at:', schemaPath);
  process.exit(0);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  console.log('📦 PostgreSQL production database detected.');
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('🔄 Updated schema.prisma provider to "postgresql".');
  }
  try {
    console.log('🚀 Pushing schema to PostgreSQL database...');
    execSync('npx prisma generate && npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ PostgreSQL schema synchronized successfully.');
  } catch (err) {
    console.warn('⚠️ Prisma push note:', err.message);
  }
} else {
  console.log('📁 Local SQLite database detected.');
  if (schema.includes('provider = "postgresql"')) {
    schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('🔄 Updated schema.prisma provider to "sqlite" for local environment.');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Local Prisma client generated for SQLite.');
    } catch (err) {
      console.warn('⚠️ Local generate note:', err.message);
    }
  }
}
