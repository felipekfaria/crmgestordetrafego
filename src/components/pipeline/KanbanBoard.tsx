import React from "react";
import LeadCard, { Lead, LeadStatus } from "../leads/LeadCard";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLUMN_TITLES: Record<LeadStatus, string> = {
  new: "Novo Lead",
  contacted: "Contato Feito",
  proposal: "Proposta Enviada",
  won: "Fechado",
  lost: "Perdido",
};

const COLUMN_COLORS: Record<LeadStatus, string> = {
  new: "border-blue-400",
  contacted: "border-yellow-400",
  proposal: "border-purple-400",
  won: "border-green-400",
  lost: "border-red-400",
};

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onAddLeadClick: () => void;
  onLeadStatusChange: (leadId: number, newStatus: LeadStatus) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onLeadClick,
  onAddLeadClick,
  onLeadStatusChange,
}) => {
  const columns: LeadStatus[] = ["new", "contacted", "proposal", "won", "lost"];

  const groupedLeads = columns.reduce((acc, status) => {
    acc[status] = leads.filter((lead) => lead.status === status);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData("leadId", lead.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    const leadIdStr = e.dataTransfer.getData("leadId");
    const leadId = parseInt(leadIdStr, 10);

    const sourceLead = leads.find((lead) => lead.id === leadId);
    if (sourceLead && sourceLead.status !== targetStatus) {
      onLeadStatusChange(leadId, targetStatus);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-6 px-4">
        <h2 className="text-xl font-bold">Pipeline de Vendas</h2>
        <Button
          onClick={onAddLeadClick}
          className="bg-leadflow-blue hover:bg-leadflow-blue/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <div className="flex justify-center w-full px-4">
        <div className="flex gap-14 w-full max-w-[1600px] justify-center">
          {columns.map((status) => (
            <div
              key={status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              className="w-full max-w-[240px] flex-shrink"
            >
              <div className={`kanban-column border-t-4 ${COLUMN_COLORS[status]}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">{COLUMN_TITLES[status]}</h3>
                  <span className="text-sm bg-leadflow-mid-gray bg-opacity-20 px-2 py-1 rounded-full">
                    {groupedLeads[status]?.length || 0}
                  </span>
                </div>

                <div>
                  {groupedLeads[status]?.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <LeadCard lead={lead} onClick={onLeadClick} />
                    </div>
                  ))}

                  {status === "new" && groupedLeads[status]?.length === 0 && (
                    <div
                      className="border-2 border-dashed border-leadflow-mid-gray border-opacity-30 rounded-md p-4 text-center cursor-pointer hover:border-leadflow-blue transition-colors"
                      onClick={onAddLeadClick}
                    >
                      <p className="text-leadflow-mid-gray">
                        Clique para adicionar um novo lead
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
