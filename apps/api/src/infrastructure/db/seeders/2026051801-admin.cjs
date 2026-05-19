'use strict';

const { randomUUID, createHmac, createCipheriv, randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');

function normalizeCpf(input) {
  return String(input).replace(/\D+/g, '');
}

function hmac(input, pepper) {
  return createHmac('sha256', pepper).update(input, 'utf8').digest('hex');
}

function encryptCpf(plain, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || 'admin@nex.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const name = process.env.ADMIN_NAME || 'Administrator';
    const cpf = normalizeCpf(process.env.ADMIN_CPF || '52998224725');
    const dataKey = process.env.LGPD_DATA_KEY;
    const pepper = process.env.LGPD_HMAC_PEPPER;
    if (!dataKey || !pepper) {
      throw new Error('LGPD_DATA_KEY and LGPD_HMAC_PEPPER must be set to run the admin seeder');
    }

    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      { replacements: [email] },
    );
    if (existing.length > 0) return;

    const now = new Date();
    await queryInterface.bulkInsert('users', [
      {
        id: randomUUID(),
        name,
        email,
        cpf_encrypted: encryptCpf(cpf, dataKey),
        cpf_hash: hmac(cpf, pepper),
        password_hash: await bcrypt.hash(password, 12),
        role: 'admin',
        consent_at: now,
        deleted_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || 'admin@nex.com').toLowerCase();
    await queryInterface.bulkDelete('users', { email });
  },
};
