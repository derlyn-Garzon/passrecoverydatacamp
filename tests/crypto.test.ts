import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptVaultData,
  decryptVaultData,
  generatePassword,
  generateSaltHex,
  generateIvHex,
  CredentialItem,
} from '../src/lib/crypto';

test('Crypto Utilities - Encryption and Decryption Roundtrip', async () => {
  const masterPassword = 'SuperSecretMasterPassword123!';
  const initialCredentials: CredentialItem[] = [
    {
      id: 'item-1',
      title: 'Database Admin',
      company: 'TechCorp',
      project: 'Core Infrastructure',
      username: 'admin',
      password: 'p@ssword123Secure!',
      url: 'https://db.techcorp.com',
      notes: 'Production DB credentials',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Encrypt
  const payload = await encryptVaultData(initialCredentials, masterPassword);

  assert.ok(payload.salt, 'Salt should be generated');
  assert.ok(payload.iv, 'IV should be generated');
  assert.ok(payload.ciphertext, 'Ciphertext should be generated');
  assert.equal(payload.version, 1, 'Protocol version should be 1');

  // Ensure ciphertext does not contain plaintext password or sensitive info
  assert.doesNotMatch(payload.ciphertext, /p@ssword123Secure!/);
  assert.doesNotMatch(payload.ciphertext, /Database Admin/);

  // Decrypt
  const decrypted = await decryptVaultData<CredentialItem[]>(payload, masterPassword);

  assert.equal(decrypted.length, 1);
  assert.equal(decrypted[0].title, 'Database Admin');
  assert.equal(decrypted[0].company, 'TechCorp');
  assert.equal(decrypted[0].password, 'p@ssword123Secure!');
});

test('Crypto Utilities - Wrong Password Rejection', async () => {
  const masterPassword = 'CorrectPassword123!';
  const wrongPassword = 'WrongPassword456!';
  const sampleData = [{ id: '1', title: 'Test' }];

  const payload = await encryptVaultData(sampleData, masterPassword);

  await assert.rejects(
    async () => {
      await decryptVaultData(payload, wrongPassword);
    },
    /Contraseña maestra incorrecta/
  );
});

test('Crypto Utilities - Tampered Ciphertext Rejection', async () => {
  const masterPassword = 'MasterPassword123!';
  const sampleData = [{ id: '1', title: 'Test' }];

  const payload = await encryptVaultData(sampleData, masterPassword);

  // Tamper ciphertext
  const corruptedPayload = {
    ...payload,
    ciphertext: payload.ciphertext.substring(0, payload.ciphertext.length - 4) + 'AAAA',
  };

  await assert.rejects(
    async () => {
      await decryptVaultData(corruptedPayload, masterPassword);
    },
    /Contraseña maestra incorrecta/
  );
});

test('Crypto Utilities - Salt and IV randomness', () => {
  const salt1 = generateSaltHex();
  const salt2 = generateSaltHex();
  const iv1 = generateIvHex();
  const iv2 = generateIvHex();

  assert.notEqual(salt1, salt2, 'Salts should be unique');
  assert.notEqual(iv1, iv2, 'IVs should be unique');
  assert.equal(salt1.length, 32, '16 bytes salt = 32 hex chars');
  assert.equal(iv1.length, 24, '12 bytes IV = 24 hex chars');
});

test('Crypto Utilities - Password Generator', () => {
  const pwd = generatePassword({ length: 24, includeUppercase: true, includeLowercase: true, includeNumbers: true, includeSymbols: true });
  assert.equal(pwd.length, 24);
  assert.ok(/[A-Z]/.test(pwd), 'Should include uppercase');
  assert.ok(/[a-z]/.test(pwd), 'Should include lowercase');
  assert.ok(/[0-9]/.test(pwd), 'Should include numbers');
});
