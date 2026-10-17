/**
 * Zero-Knowledge Cryptographic Utilities
 * Sentinel Mode 🛡️ Standard Compliance
 * Uses Web Crypto API (crypto.subtle) with PBKDF2 (SHA-256) and AES-GCM 256-bit
 */

export interface EncryptedVaultPayload {
  salt: string;        // Hex string (16 bytes / 32 hex chars)
  iv: string;          // Hex string (12 bytes / 24 hex chars)
  ciphertext: string;  // Base64 encoded ciphertext
  version: number;     // Protocol versioning (e.g. 1)
}

export interface CredentialItem {
  id: string;
  title: string;
  company: string;
  project: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DecryptedVaultData = CredentialItem[];

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const PROTOCOL_VERSION = 1;

/** Get subtle crypto instance supporting both browser and Node environments */
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (crypto.subtle) is not supported in this environment.');
}

/** Get getRandomValues supporting both browser and Node */
function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    return globalThis.crypto.getRandomValues(array);
  }
  throw new Error('Web Crypto API (getRandomValues) is not supported in this environment.');
}

// Helper conversions: Uint8Array <-> Hex <-> Base64
export function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string format.');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return Buffer.from(buffer).toString('base64');
}

export function base64ToBuffer(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/** Generate a 16-byte random salt in hex string */
export function generateSaltHex(): string {
  const salt = new Uint8Array(16);
  getRandomValues(salt);
  return bufferToHex(salt);
}

/** Generate a 12-byte random IV in hex string for AES-GCM */
export function generateIvHex(): string {
  const iv = new Uint8Array(12);
  getRandomValues(iv);
  return bufferToHex(iv);
}

/** Derive AES-GCM 256 key from Master Password and Salt using PBKDF2 */
export async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string.');
  }
  if (!saltHex || typeof saltHex !== 'string') {
    throw new Error('Salt must be a valid hex string.');
  }

  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = hexToBuffer(saltHex);

  const keyMaterial = await subtle.importKey(
    'raw',
    passwordBytes as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypt arbitrary data object in browser/client with Master Password */
export async function encryptVaultData(
  data: unknown,
  password: string,
  existingSaltHex?: string
): Promise<EncryptedVaultPayload> {
  try {
    const saltHex = existingSaltHex || generateSaltHex();
    const ivHex = generateIvHex();
    const key = await deriveKey(password, saltHex);

    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(jsonString);

    const subtle = getSubtleCrypto();
    const ivBuffer = hexToBuffer(ivHex);

    const encryptedBuffer = await subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer as unknown as BufferSource,
      },
      key,
      plaintextBuffer as unknown as BufferSource
    );

    const ciphertext = bufferToBase64(new Uint8Array(encryptedBuffer));

    return {
      salt: saltHex,
      iv: ivHex,
      ciphertext,
      version: PROTOCOL_VERSION,
    };
  } catch (error) {
    throw new Error(`Client Encryption Error: ${(error as Error).message}`);
  }
}

/** Decrypt vault payload in browser/client with Master Password */
export async function decryptVaultData<T = DecryptedVaultData>(
  payload: EncryptedVaultPayload,
  password: string
): Promise<T> {
  if (!payload || !payload.salt || !payload.iv || !payload.ciphertext) {
    throw new Error('Invalid vault payload provided.');
  }

  try {
    const key = await deriveKey(password, payload.salt);
    const subtle = getSubtleCrypto();
    const ivBuffer = hexToBuffer(payload.iv);
    const ciphertextBuffer = base64ToBuffer(payload.ciphertext);

    const decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer as unknown as BufferSource,
      },
      key,
      ciphertextBuffer as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw new Error('Contraseña maestra incorrecta o datos de la bóveda corruptos.');
  }
}

/** Generate strong random password options */
export interface PasswordGeneratorOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

export function generatePassword(options: PasswordGeneratorOptions = {}): string {
  const {
    length = 18,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charSet = '';
  if (includeUppercase) charSet += upper;
  if (includeLowercase) charSet += lower;
  if (includeNumbers) charSet += numbers;
  if (includeSymbols) charSet += symbols;

  if (!charSet) {
    charSet = lower + numbers;
  }

  const randomBytes = new Uint8Array(length);
  getRandomValues(randomBytes);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charSet[randomBytes[i] % charSet.length];
  }

  return password;
}
