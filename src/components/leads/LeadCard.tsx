import React from "react";
import { Calendar, Phone, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Proposal } from "@/types";

// Tipagem para o status (está correto)
export type LeadStatus = "new" | "contacted" | "proposal" | "won" | "lost";

// ================== AQUI ESTÁ A MUDANÇA PRINCIPAL ==================
// Interface 100% sincronizada com sua tabela no Supabase
export interface Lead {
  id: number;
  user_id: string;
  lead_name: string;
  email: string;
  value: number;
  status: LeadStatus;
  created_at: string;
  
  // Colunas que podem ser nulas (NULL no banco de dados)
  company: string | null; 
  telefone: string | null;
  followUpDate: Date | string | null;

  // Colunas adicionais da sua tabela
  instagram: string | null;
  origem: string | null;
  conversion_co: string | null;

  // Propriedade para dados de tabelas relacionadas (não é uma coluna direta)
  proposals?: Proposal[]; 
}
// ===================================================================

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick }) => {
  const getFollowUpStatusClass = () => {
    if (!lead.followUpDate) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const followUpDate = new Date(lead.followUpDate);
    followUpDate.setHours(0, 0, 0, 0);

    if (followUpDate < today) return "follow-up-overdue";
    if (followUpDate.getTime() === today.getTime()) return "follow-up-today";
    return "follow-up-upcoming";
  };

  const formattedDate = formatDistanceToNow(new Date(lead.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  // Esta linha já estava correta, e agora a interface "Lead" também está
  const whatsappLink = `https://wa.me/${(lead.telefone || '').replace(/\D/g, '')}`;

  return (
    <div className="lead-card group" onClick={() => onClick(lead)}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-leadflow-dark-blue group-hover:text-leadflow-blue transition-colors">
            {lead.lead_name}
          </h3>
          <p className="text-sm text-leadflow-mid-gray">{lead.company}</p>
        </div>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
        >
          <Phone size={16} />
        </a>
      </div>

      <div className="flex items-center mt-3 mb-1">
        <DollarSign size={14} className="text-leadflow-mid-gray mr-1" />
        <span className="text-sm font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(lead.value)}
        </span>
      </div>

      <div className="flex justify-between items-center mt-3">
        <div className="text-xs text-leadflow-mid-gray">
          {formattedDate}
        </div>

        {lead.followUpDate && (
          <div className={`follow-up-reminder ${getFollowUpStatusClass()}`}>
            <div className="flex items-center">
              <Calendar size={12} className="mr-1" />
              <span>
                {new Date(lead.followUpDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadCard;