import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Для сервера (запись в БД) — используем service key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Для фронтенда (чтение) — используем anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
