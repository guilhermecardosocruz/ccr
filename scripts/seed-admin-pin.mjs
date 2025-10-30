import 'dotenv/config';
import prisma from '../lib/prisma.js';
import { sha256Hex } from '../lib/crypto.js';

const pin = (process.env.ADMIN_MASTER_PIN || '').trim();
if (!pin) {
  console.error('ADMIN_MASTER_PIN não definido no ambiente.');
  process.exit(1);
}

const hash = sha256Hex(pin);

try {
  await prisma.appSetting.upsert({
    where: { key: 'admin_pin_hash' },
    create: { key: 'admin_pin_hash', value: hash },
    update: { value: hash },
  });
  console.log('OK: admin_pin_hash gravado/atualizado no banco.');
} catch (e) {
  console.error('ERRO ao gravar admin_pin_hash:', e?.message || e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
