import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmokomdjsueiehljkvnz.supabase.co';
const supabaseKey = 'sb_publishable_nVCaWKmCUZM6bXskTEenuA_Up8oPJUu';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las variables de entorno de Supabase.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
