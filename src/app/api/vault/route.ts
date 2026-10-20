import { NextRequest, NextResponse } from 'next/server';
import { EncryptedVaultPayload } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';

/** Helper para validar la estructura del payload cifrado sin revelar contenidos */
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
 * Obtiene la bóveda cifrada desde la tabla passDataBase de Supabase.
 */
export async function GET() {
  try {
    const { data: record, error } = await supabase
      .from('passDataBase')
      .select('data')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!record || !record.data) {
      return NextResponse.json(
        { exists: false, data: null, message: 'La bóveda aún no existe.' },
        { status: 200 }
      );
    }

    const parsedData = record.data;

    if (!isValidVaultPayload(parsedData)) {
      return NextResponse.json(
        {
          exists: false,
          data: null,
          error: 'Estructura inválida: Los datos guardados no cumplen con el esquema cifrado.',
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
 * Guarda o actualiza el payload cifrado en la tabla passDataBase de Supabase.
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

    // Busca si ya existe una entrada previa para actualizarla o insertar una nueva
    const { data: existing } = await supabase
      .from('passDataBase')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    let error;
    if (existing) {
      const res = await supabase
        .from('passDataBase')
        .update({ data: body, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      error = res.error;
    } else {
      const res = await supabase
        .from('passDataBase')
        .insert([{ data: body, updated_at: new Date().toISOString() }]);
      error = res.error;
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Bóveda cifrada guardada exitosamente en Supabase.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Error al guardar la bóveda: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
