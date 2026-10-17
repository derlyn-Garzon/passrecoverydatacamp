import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { GET, POST } from '../src/app/api/vault/route';
import { NextRequest } from 'next/server';

const VAULT_FILE_PATH = path.join(process.cwd(), 'vault.json');

// Helper to clean up vault.json
function cleanupVault() {
  if (fs.existsSync(VAULT_FILE_PATH)) {
    fs.unlinkSync(VAULT_FILE_PATH);
  }
}

test('API /api/vault GET - Missing vault.json', async () => {
  cleanupVault();
  const res = await GET();
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.exists, false);
  assert.equal(json.data, null);
});

test('API /api/vault GET - Empty vault.json', async () => {
  fs.writeFileSync(VAULT_FILE_PATH, '  ', 'utf-8');
  const res = await GET();
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.exists, false);
  assert.equal(json.data, null);
  cleanupVault();
});

test('API /api/vault GET - Corrupted JSON in vault.json', async () => {
  fs.writeFileSync(VAULT_FILE_PATH, '{ corrupted json: true ', 'utf-8');
  const res = await GET();
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.exists, false);
  assert.ok(json.error.includes('Corrupción detectada'));
  cleanupVault();
});

test('API /api/vault GET - Invalid schema in vault.json', async () => {
  fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify({ invalid: 'schema' }), 'utf-8');
  const res = await GET();
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.exists, false);
  assert.ok(json.error.includes('Estructura inválida'));
  cleanupVault();
});

test('API /api/vault POST - Invalid request body', async () => {
  cleanupVault();
  const req = new NextRequest('http://localhost:3000/api/vault', {
    method: 'POST',
    body: JSON.stringify({ salt: '123' }), // missing iv, ciphertext, version
  });

  const res = await POST(req);
  const json = await res.json();

  assert.equal(res.status, 400);
  assert.ok(json.error.includes('Solicitud inválida'));
});

test('API /api/vault POST & GET - Valid payload save and retrieval', async () => {
  cleanupVault();
  const validPayload = {
    salt: '0123456789abcdef0123456789abcdef',
    iv: '0123456789abcdef01234567',
    ciphertext: 'SGVsbG8gV29ybGQ=',
    version: 1,
  };

  const req = new NextRequest('http://localhost:3000/api/vault', {
    method: 'POST',
    body: JSON.stringify(validPayload),
  });

  const postRes = await POST(req);
  const postJson = await postRes.json();

  assert.equal(postRes.status, 200);
  assert.equal(postJson.success, true);

  // Now GET
  const getRes = await GET();
  const getJson = await getRes.json();

  assert.equal(getRes.status, 200);
  assert.equal(getJson.exists, true);
  assert.deepEqual(getJson.data, validPayload);

  cleanupVault();
});
