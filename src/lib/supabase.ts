import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("VITE_SUPABASE_URL:", supabaseUrl);
console.log("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Só pra testes no navegador:
if (typeof window !== "undefined") {
  (window as any).supabase = supabase;
}
