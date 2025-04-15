import { supabase } from "@/lib/supabase";
import { Proposal } from "@/types";

export async function createProposal(proposal: Omit<Proposal, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("proposals")
    .insert(proposal)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar proposta:", error);
    return null;
  }

  return data;
}

export async function updateProposal(id: number, updates: Partial<Proposal>) {
  const { data, error } = await supabase
    .from("proposals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar proposta:", error);
    return null;
  }

  return data;
}

export async function deleteProposal(id: number) {
  const { error } = await supabase.from("proposals").delete().eq("id", id);

  if (error) {
    console.error("Erro ao deletar proposta:", error);
    return false;
  }

  return true;
}
