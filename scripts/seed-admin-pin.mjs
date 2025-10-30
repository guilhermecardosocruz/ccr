import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Normaliza PIN: remove espaços/traços, uppercase e trim. */
function normalizePin(s) {
  return String(s || '').replace(/[\s-]+/g, '').toUpperCase().trim();
}
function sha256Hex(input) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

const raw = (process.env.ADMIN_MASTER_PIN || '').trim();
if (!raw) {
  console.error('ADMIN_MASTER_PIN não definido no ambiente.');
  process.exit(1);
}

const normalized = normalizePin(raw);
const hash = sha256Hex(normalized);

try {
  await prisma.appSetting.upsert({
    where: { key: 'admin_pin_hash' },
    create: { key: 'admin_pin_hash', value: hash },
    update: { value: hash },
  });
  console.log('OK: admin_pin_hash gravado/atualizado no banco (normalizado).');
  console.log('PIN mestre (normalizado):', normalized);
} catch (e) {
  console.error('ERRO ao gravar admin_pin_hash:', e?.message || e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
