import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        "Supabase URL or Anon Key is not defined in environment variables."
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;