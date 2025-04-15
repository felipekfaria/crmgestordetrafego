import { supabase } from "@/lib/supabase";

export async function createInteraction(lead_id: number, user_id: string, message: string) {
  const { data, error } = await supabase
    .from("interactions")
    .insert([{ lead_id, user_id, message }])
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar interação:", error.message);
    return null;
  }

  return data;
}

export async function getInteractions(lead_id: number) {
  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("lead_id", lead_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar interações:", error.message);
    return [];
  }

  return data;
}
