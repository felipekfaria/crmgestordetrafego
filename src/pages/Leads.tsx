import React, { useState, useEffect } from "react";
import Navbar from "../components/common/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Calendar,
  Phone,
  PlusCircle,
  Search,
  ArrowUpDown,
  Clock
} from "lucide-react";
import { Lead } from "../components/leads/LeadCard";
import LeadForm from "../components/leads/LeadForm";
import LeadDetails from "../components/leads/LeadDetails";
import FollowUpAlert, { getOverdueFollowUps } from "../components/leads/FollowUpAlert";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const getStatusText = (status: string) => {
  switch (status) {
    case "new": return "Novo Lead";
    case "contacted": return "Contato Feito";
    case "proposal": return "Proposta Enviada";
    case "won": return "Fechado";
    case "lost": return "Perdido";
    default: return status;
  }
};

const Leads = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [displayedLeads, setDisplayedLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: "asc" | "desc"; } | null>(null);

  const fetchLeads = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Não busca leads se não houver usuário

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq('user_id', user.id) // Busca apenas os leads do usuário logado
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar leads:", error);
      toast.error("Erro ao buscar leads.");
      return;
    }

    setLeads(data || []);
  };

  // Efeito para buscar os dados iniciais
  useEffect(() => {
    fetchLeads();
  }, []);  

  // ====================================================================
  //      NOVO BLOCO PARA REALTIME
  // Este useEffect escuta por mudanças no banco de dados.
  // ====================================================================
  useEffect(() => {
    const channel = supabase
      .channel('realtime leads')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta por qualquer evento: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('Mudança no banco de dados recebida!', payload);
          // A forma mais simples de atualizar a UI é buscar a lista novamente.
          fetchLeads();
        }
      )
      .subscribe();

    // Função de limpeza para remover a inscrição quando o componente sair da tela
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // A dependência vazia [] faz com que isso rode apenas uma vez (na montagem do componente)
  // ====================================================================

  // Efeito para filtrar e ordenar a lista de leads exibida
  useEffect(() => {
    let result = [...leads];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        lead =>
          lead.lead_name.toLowerCase().includes(term) ||
          (lead.company || '').toLowerCase().includes(term) ||
          lead.email.toLowerCase().includes(term) ||
          (lead.telefone || '').includes(term)
      );
    }

    if (showOverdueOnly) {
      result = getOverdueFollowUps(result);
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setDisplayedLeads(result);
  }, [leads, searchTerm, showOverdueOnly, sortConfig]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (key: keyof Lead) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterToggle = (value: string) => {
    const showOverdue = value === "overdue";
    setShowOverdueOnly(showOverdue);

    const url = new URL(window.location.href);
    if (showOverdue) {
      url.searchParams.set("filter", "overdue");
    } else {
      url.searchParams.delete("filter");
    }
    navigate(url.pathname + url.search, { replace: true });
  };

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("Você precisa estar logado para salvar um lead.");
        return;
    }
    
    const dataToSave = { ...leadData, user_id: user.id };

    if (isEditing && currentLead) {
      const { error } = await supabase
        .from('leads')
        .update(dataToSave)
        .eq('id', currentLead.id);
        
      if (error) {
        toast.error("Erro ao atualizar o lead.");
        console.error(error);
      } else {
        toast.success("Lead atualizado com sucesso!");
        // Não precisa chamar fetchLeads() aqui, o Realtime cuidará disso.
      }

    } else {
      const { error } = await supabase
        .from('leads')
        .insert([dataToSave]);

      if (error) {
        toast.error("Erro ao adicionar o novo lead.");
        console.error(error);
      } else {
        toast.success("Novo lead adicionado com sucesso!");
        // Não precisa chamar fetchLeads() aqui, o Realtime cuidará disso.
      }
    }
    
    setIsFormOpen(false);
    setIsEditing(false);
    setCurrentLead(null);
  };

  const handleLeadClick = (lead: Lead) => {
    setCurrentLead(lead);
    setIsDetailsOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "—";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleDateString("pt-BR");
  };  

  // O resto do seu JSX permanece o mesmo
  return (
    <div className="min-h-screen bg-leadflow-light-gray">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <FollowUpAlert
          leads={leads}
          onFilterChange={setShowOverdueOnly}
          className="mb-6"
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Leads</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar leads..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <ToggleGroup
              type="single"
              value={showOverdueOnly ? "overdue" : "all"}
              onValueChange={handleFilterToggle}
              className="bg-white rounded-md border"
            >
              <ToggleGroupItem value="all">Todos</ToggleGroupItem>
              <ToggleGroupItem value="overdue">
                <Clock className="h-4 w-4 mr-1" />
                Follow-ups vencidos
              </ToggleGroupItem>
            </ToggleGroup>

            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-leadflow-blue text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Lead
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("lead_name")}>
                    <div className="flex items-center cursor-pointer">
                      Nome
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead onClick={() => handleSort("value")}>
                    <div className="flex items-center cursor-pointer">
                      Valor
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Contato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedLeads.length > 0 ? (
                  displayedLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleLeadClick(lead)}
                    >
                      <TableCell>{lead.lead_name}</TableCell>
                      <TableCell>{lead.company}</TableCell>
                      <TableCell>{formatCurrency(lead.value)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium
                            ${lead.status === "new" ? "bg-blue-100 text-blue-800" : ""}
                            ${lead.status === "contacted" ? "bg-yellow-100 text-yellow-800" : ""}
                            ${lead.status === "proposal" ? "bg-purple-100 text-purple-800" : ""}
                            ${lead.status === "won" ? "bg-green-100 text-green-800" : ""}
                            ${lead.status === "lost" ? "bg-red-100 text-red-800" : ""}
                          `}
                        >
                          {getStatusText(lead.status)}
                        </span>
                      </TableCell>

                      <TableCell>{formatDate(lead.followUpDate)}</TableCell>
                      <TableCell>
                        <a 
                          href={`https://wa.me/${(lead.telefone || '').replace(/\D/g, '')}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!lead.telefone) e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="p-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors inline-flex"
                        >
                          <Phone size={16} />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      Nenhum lead encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <LeadForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveLead} 
        />

        <LeadDetails
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onEdit={() => { /* Lógica para editar */ }}
          lead={currentLead}
          onAddInteraction={async () => {}}
          onAddProposal={() => {}}
          onUpdateProposal={() => {}}
          onDeleteProposal={() => {}}
        />
      </div>
    </div>
  );
};

export default Leads;