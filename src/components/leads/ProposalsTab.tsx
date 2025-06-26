import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import { createProposal, deleteProposal, updateProposal } from "@/lib/proposals";
import { Proposal } from "@/types";
import { format } from "date-fns";

interface ProposalsTabProps {
  leadId: number;
  leadName: string;
  leadEmail: string;
  leadtelefone: string;
  leadCompany: string;
  leadValue: number;
  proposals: Proposal[];
  onAddProposal: (proposal: Proposal) => void;
  onUpdateProposal: (proposal: Proposal) => void;
  onDeleteProposal: (id: number) => void;
}

export default function ProposalsTab({
  leadId,
  leadName,
  leadEmail,
  leadtelefone,
  leadCompany,
  leadValue,
  proposals,
  onAddProposal,
  onUpdateProposal,
  onDeleteProposal,
}: ProposalsTabProps) {
  const { user } = useUser();
  const [creating, setCreating] = useState(false);
  const [service, setService] = useState("");
  const [details, setDetails] = useState("");

  const handleCreate = async () => {
    if (!service || !details) return;
    const result = await createProposal({
      service,
      details,
      lead_id: leadId,
      user_id: user?.id,
    });
    if (result) {
      onAddProposal(result);
      setService("");
      setDetails("");
      setCreating(false);
    }
  };

  return (
    <TabsContent value="proposals" className="p-1 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold">
          Propostas para {leadName}
        </h4>
        {!creating && (
          <Button onClick={() => setCreating(true)}>+ Nova Proposta</Button>
        )}
      </div>

      {creating && (
        <div className="space-y-3 border p-4 rounded-lg bg-gray-50">
          <div>
            <label className="text-sm font-medium">Serviço Ofertado</label>
            <Input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Ex: Gestão de Tráfego para Instagram Ads"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Detalhes da Proposta</label>
            <Textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Descreva os detalhes da proposta..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!service || !details}>
              Criar Proposta
            </Button>
          </div>
        </div>
      )}

      {!creating && (proposals?.length ?? 0) === 0 && (
        <div className="border border-dashed p-6 rounded-lg text-center text-gray-500 bg-gray-50 mt-4">
          Nenhuma proposta criada ainda.
        </div>
      )}

      <div className="space-y-4 mt-4">
        {proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <h5 className="font-semibold text-md">
                  {proposal.service}
                </h5>
                <p className="text-xs text-gray-500">
                  Atualizado em {format(new Date(proposal.updated_at), "dd/MM/yyyy")}
                </p>
              </div>
              <div className="flex gap-2 items-start">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(`${proposal.service}\n\n${proposal.details}`)}
                >
                  📋
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDeleteProposal(proposal.id)}>
                  🗑️
                </Button>
              </div>
            </div>
            <div className="mt-2 text-sm space-y-1">
              <p>
                <strong>Cliente:</strong> {leadName} ({leadCompany})
              </p>
              <p>
                <strong>Contato:</strong> {leadEmail} | {leadtelefone}
              </p>
              <p>
                <strong>Valor:</strong> R$ {leadValue.toLocaleString("pt-BR")}
              </p>
              <p>
                <strong>Detalhes:</strong> {proposal.details}
              </p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `Proposta: ${proposal.service}\n\n${proposal.details}`
                  )
                }
              >
                📄 Copiar Proposta
              </Button>
            </div>
          </div>
        ))}
      </div>
    </TabsContent>
  );
}
