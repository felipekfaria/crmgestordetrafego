import React, { useState, useEffect } from "react";
import Navbar from "../components/common/Navbar";
import KanbanBoard from "../components/pipeline/KanbanBoard";
import LeadForm from "../components/leads/LeadForm";
import LeadDetails from "../components/leads/LeadDetails";
import FollowUpAlert, { getOverdueFollowUps } from "../components/leads/FollowUpAlert";
import { Lead, LeadStatus } from "../components/leads/LeadCard";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useLocation } from "react-router-dom";


const COLUMN_TITLES: Record<LeadStatus, string> = {
  new: "Novo Lead",
  contacted: "Contato Feito",
  proposal: "Proposta Enviada",
  won: "Fechado",
  lost: "Perdido"
};

const Pipeline = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const location = useLocation();

useEffect(() => {
  const searchParams = new URLSearchParams(location.search);
  const leadId = searchParams.get("leadId");

  if (leadId) {
    const foundLead = leads.find((lead) => lead.id.toString() === leadId);
    if (foundLead) {
      setCurrentLead(foundLead);
      setIsDetailsOpen(true);
    }
  }
}, [leads, location.search]);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        toast.error("Usuário não autenticado");
        console.error("Erro ao obter usuário:", userError?.message);
        return;
      }

      const user = userData.user;

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        toast.error("Erro ao carregar leads");
        console.error(error.message);
        return;
      }

      setLeads(data as Lead[]);
    };

    fetchLeads();
  }, []);

  useEffect(() => {
    if (showOverdueOnly) {
      setFilteredLeads(getOverdueFollowUps(leads));
    } else {
      setFilteredLeads(leads);
    }
  }, [leads, showOverdueOnly]);

  const handleOverdueFilterChange = (show: boolean) => {
    setShowOverdueOnly(show);
  };

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      toast.error("Usuário não autenticado");
      return;
    }

    if (isEditing && currentLead) {
      const { error } = await supabase
        .from("leads")
        .update({
          lead_name: leadData.lead_name,
          email: leadData.email,
          followUpDate: leadData.followUpDate,
          company: leadData.company,
          value: leadData.value,
          status: leadData.status,
        })
        .eq("id", currentLead.id)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Erro ao atualizar lead");
        console.error(error.message);
        return;
      }

      const updatedLeads = leads.map((lead) =>
        lead.id === currentLead.id ? { ...lead, ...leadData } : lead
      );
      setLeads(updatedLeads);
      toast.success("Lead atualizado com sucesso!");
    } else {
      const newLead = {
        lead_name: leadData.lead_name || "",
        email: leadData.email || "",
        followUpDate: leadData.followUpDate || null,
        user_id: user.id,
        company: leadData.company || "",
        phone: leadData.phone || "",
        value: leadData.value || 0,
        status: "new"
      };

      const { data, error } = await supabase.from("leads").insert([newLead]).select();

      if (error) {
        toast.error("Erro ao adicionar lead");
        console.error(error.message);
        return;
      }

      setLeads([...leads, ...(data as Lead[])]);
      toast.success("Novo lead adicionado com sucesso!");
    }

    setIsEditing(false);
    setCurrentLead(null);
    setIsFormOpen(false);
  };

  const handleLeadClick = (lead: Lead) => {
    setCurrentLead(lead);
    setIsDetailsOpen(true);
  };

  const handleAddLeadClick = () => {
    setIsEditing(false);
    setCurrentLead(null);
    setIsFormOpen(true);
  };

  const handleEditLead = () => {
    setIsDetailsOpen(false);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleAddInteraction = async (leadId: number, message: string) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const { data, error } = await supabase
      .from("interactions")
      .insert([{ lead_id: leadId, message, user_id: user.id }])
      .select();

    if (error) {
      toast.error("Erro ao registrar interação");
      console.error(error.message);
      return;
    }

    toast.success("Interação registrada com sucesso!");
    // opcional: recarregar interações ou lead atualizado aqui
  };

  const handleLeadStatusChange = async (leadId: number, newStatus: LeadStatus) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      console.error(error.message);
      return;
    }

    const updatedLeads = leads.map((lead) =>
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    );
    setLeads(updatedLeads);

    const leadName = leads.find((lead) => lead.id === leadId)?.lead_name;
    toast.success(`${leadName} movido para ${COLUMN_TITLES[newStatus]}`);
  };

  const handleResetFilter = () => {
    setShowOverdueOnly(false);
  };

  const handleDeleteLead = (leadId: number) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
    setIsDetailsOpen(false);
  };
  

  return (
    <div className="min-h-screen bg-leadflow-light-gray">
      <Navbar />
      <div className="w-full px-4 py-8 overflow-x-auto">
        <FollowUpAlert
          leads={leads}
          onFilterChange={handleOverdueFilterChange}
          className="mb-6"
        />

        {showOverdueOnly && (
          <div className="flex items-center mb-4">
            <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md flex items-center">
              <span className="mr-2">🕒 Exibindo apenas follow-ups vencidos</span>
              <button
                onClick={handleResetFilter}
                className="text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-0.5 rounded-md ml-2"
              >
                Limpar filtro
              </button>
            </span>
          </div>
        )}

        <KanbanBoard
          leads={filteredLeads}
          onLeadClick={handleLeadClick}
          onAddLeadClick={handleAddLeadClick}
          onLeadStatusChange={handleLeadStatusChange}
        />

        <LeadForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveLead}
          lead={isEditing ? currentLead || undefined : undefined}
        />

        <LeadDetails
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onEdit={handleEditLead}
          lead={currentLead}
          onAddInteraction={handleAddInteraction}
          onAddProposal={() => {}}
          onUpdateProposal={() => {}}
          onDeleteProposal={() => {}}
          onDeleteLead={handleDeleteLead} // 👈 essa é nova
        />
      </div>
    </div>
  );
};

export default Pipeline;
