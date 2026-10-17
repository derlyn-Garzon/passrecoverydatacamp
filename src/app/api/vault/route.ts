import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { EncryptedVaultPayload } from '@/lib/crypto';

const VAULT_FILE_PATH = path.join(process.cwd(), 'vault.json');

/** Helper to validate encrypted payload schema without revealing contents */
function isValidVaultPayload(data: unknown): data is EncryptedVaultPayload {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.salt === 'string' &&
    obj.salt.trim().length > 0 &&
    typeof obj.iv === 'string' &&
    obj.iv.trim().length > 0 &&
    typeof obj.ciphertext === 'string' &&
    obj.ciphertext.trim().length > 0 &&
    typeof obj.version === 'number'
  );
}

/**
 * GET /api/vault
 * Defensive retrieval of encrypted vault file.
 * Returns { exists: boolean, data: EncryptedVaultPayload | null }
 */
export async function GET() {
  try {
    if (!fs.existsSync(VAULT_FILE_PATH)) {
      return NextResponse.json(
        { exists: false, data: null, message: 'La bóveda aún no existe.' },
        { status: 200 }
      );
    }

    const fileContent = fs.readFileSync(VAULT_FILE_PATH, 'utf-8').trim();

    if (!fileContent) {
      return NextResponse.json(
        { exists: false, data: null, message: 'El archivo de la bóveda está vacío.' },
        { status: 200 }
      );
    }

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(fileContent);
    } catch {
      return NextResponse.json(
        {
          exists: false,
          data: null,
          error: 'Corrupción detectada: El archivo vault.json no contiene JSON válido.',
        },
        { status: 200 }
      );
    }

    if (!isValidVaultPayload(parsedData)) {
      return NextResponse.json(
        {
          exists: false,
          data: null,
          error: 'Estructura inválida: El archivo vault.json no cumple con el esquema cifrado.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      exists: true,
      data: parsedData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        exists: false,
        data: null,
        error: `Error interno de lectura de la bóveda: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vault
 * Defensive save of encrypted vault data. Zero-Knowledge enforcement.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !isValidVaultPayload(body)) {
      return NextResponse.json(
        {
          error:
            'Solicitud inválida: Se requiere un objeto con los campos "salt", "iv", "ciphertext" y "version".',
        },
        { status: 400 }
      );
    }

    // Atomic file write using temporary file to prevent corruption
    const tempPath = `${VAULT_FILE_PATH}.tmp`;
    const payloadString = JSON.stringify(body, null, 2);

    fs.writeFileSync(tempPath, payloadString, 'utf-8');
    fs.renameSync(tempPath, VAULT_FILE_PATH);

    return NextResponse.json({
      success: true,
      message: 'Bóveda cifrada guardada exitosamente.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Error al guardar la bóveda: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
