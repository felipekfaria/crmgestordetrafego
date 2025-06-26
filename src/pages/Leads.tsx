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
  telefone,
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

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .not("user_id", "is", null)
        .order("created_at", { ascending: false });
  
      if (error) {
        console.error("Erro ao buscar leads:", error);
        toast.error("Erro ao buscar leads.");
        return;
      }
  
      setLeads(data || []);
      setDisplayedLeads(data || []);
    };
  
    fetchLeads();
  }, []);  

  useEffect(() => {
    let result = [...leads];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        lead =>
          lead.lead_name.toLowerCase().includes(term) ||
          lead.company.toLowerCase().includes(term) ||
          lead.email.toLowerCase().includes(term) ||
          telefone.includes(term)
      );
    }

    if (showOverdueOnly) {
      result = getOverdueFollowUps(result);
    }

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
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

  // Handle adding or updating a lead
  const handleSaveLead = (leadData: Partial<Lead>) => {
    if (isEditing && currentLead) {
      // Update existing lead
      const updatedLeads = leads.map(lead => 
        lead.id === currentLead.id 
          ? { ...lead, ...leadData }
          : lead
      );
      setLeads(updatedLeads);
      setFilteredLeads(updatedLeads);
      toast.success("Lead atualizado com sucesso!");
    } else {
      // Add new lead
      const newLead: Lead = {
        id: Date.now().toString(),
        name: leadData.name || "",
        company: leadData.company || "",
        value: leadData.value || 0,
        followUpDate: leadData.followUpDate || null,
        createdAt: new Date(),
        status: leadData.status || "new",
        email: leadData.email || "",
        telefone: leadData.telefone || ""
      };
      
      const newLeads = [...leads, newLead];
      setLeads(newLeads);
      setFilteredLeads(newLeads);
      toast.success("Novo lead adicionado com sucesso!");
    }
    
    setIsEditing(false);
    setCurrentLead(null);
  };

  // Handle clicking on a lead
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
                          href={`https://wa.me/${(telefone || '').replace(/\D/g, '')}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!telefone) e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="p-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors inline-flex"
                        >
                          <telefone size={16} />
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
          onSave={() => {}}
        />

        <LeadDetails
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onEdit={() => {}}
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
