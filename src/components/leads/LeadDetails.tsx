import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lead } from "./LeadCard";
import ProposalsTab from "./ProposalsTab";
import { format } from "date-fns";
import {
  Calendar,
  Mail,
  Phone,
  Pencil,
  MessageCircle,
  Send,
  FileText,
  MoreVertical,
  Save,
  Trash
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogDescription
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface LeadDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onEdit?: () => void;
  onAddProposal: (proposal: any) => void;
  onUpdateProposal: (proposal: any) => void;
  onDeleteProposal: (id: number) => void;
  onAddInteraction?: (leadId: number, message: string) => Promise<void>;
  onDeleteLead?: (leadId: number) => void;
}

export default function LeadDetails({
  isOpen,
  onClose,
  lead,
  onEdit,
  onAddProposal,
  onUpdateProposal,
  onDeleteProposal,
  onAddInteraction,
  onDeleteLead
}: LeadDetailsProps) {
  const [message, setMessage] = useState("");
  const [interactions, setInteractions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    const fetchInteractions = async () => {
      if (!lead) return;
      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });

      if (!error && data) setInteractions(data);
    };

    fetchInteractions();
  }, [lead]);

  const handleAddInteraction = async () => {
    if (!message.trim() || !lead || !onAddInteraction) return;

    await onAddInteraction(lead.id, message);
    const { data } = await supabase
      .from("interactions")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });

    setInteractions(data || []);
    setMessage("");
  };

  const handleDeleteInteraction = async (id: number) => {
    await supabase.from("interactions").delete().eq("id", id);
    setInteractions(interactions.filter((i) => i.id !== id));
  };

  const handleStartEdit = (interaction: any) => {
    setEditingId(interaction.id);
    setEditMessage(interaction.message);
  };

  const handleSaveEdit = async (interaction: any) => {
    const { error } = await supabase
      .from("interactions")
      .update({ message: editMessage, updated_at: new Date().toISOString() })
      .eq("id", interaction.id);

    if (!error) {
      const updated = interactions.map((i) =>
        i.id === interaction.id
          ? { ...i, message: editMessage, updated_at: new Date().toISOString() }
          : i
      );
      setInteractions(updated);
      setEditingId(null);
      setEditMessage("");
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user || userError) {
      toast.error("Usuário não autenticado");
      return;
    }

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", lead.id)
      .eq("user_id", user.id);

    if (!error) {
      toast.success("Lead excluído com sucesso!");
      if (onDeleteLead) onDeleteLead(lead.id);
      onClose();
    } else {
      toast.error("Erro ao excluir lead.");
      console.error(error.message);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-leadflow-dark-blue">{lead.lead_name}</h2>
            <p className="text-sm text-gray-500">{lead.company}</p>
          </div>
          <div className="flex gap-2">
            {/* Excluir antes do Editar */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza que deseja excluir este lead?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não poderá ser desfeita. O lead e suas interações serão apagados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteLead}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>

        {/* email e telefone separados */}
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Mail size={14} />
            <span>{lead.lead_email}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1 pr-40">
            <Phone size={14} />
            <span>{lead.phone}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
          <div>
            <p className="text-gray-500">Valor Potencial</p>
            <p className="font-semibold text-base">
              R$ {lead.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Follow-up</p>
            <p className="flex items-center gap-1 font-semibold text-base">
              <Calendar size={14} />
              {lead.followUpDate
                ? new Date(lead.followUpDate).toLocaleDateString("pt-BR")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-semibold text-base">
              {lead.status === "contacted"
                ? "Contato Feito"
                : lead.status === "proposal"
                ? "Proposta Enviada"
                : lead.status === "won"
                ? "Fechado"
                : lead.status === "lost"
                ? "Perdido"
                : "Novo Lead"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="interactions" className="mt-4">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="interactions" className="flex justify-center items-center gap-2">
              <MessageCircle size={14} /> Interações
            </TabsTrigger>
            <TabsTrigger value="proposals" className="flex justify-center items-center gap-2">
              <FileText size={14} /> Propostas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interactions">
            <div className="space-y-2">
              <Textarea
                placeholder="Registre uma nova interação com o lead..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handleAddInteraction} disabled={!message.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Adicionar Interação
                </Button>
              </div>
              <div className="mt-4 max-h-64 overflow-y-auto space-y-3">
                {interactions.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm">Nenhuma interação registrada ainda.</p>
                ) : (
                  interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="bg-gray-100 rounded-md p-3 relative text-sm text-gray-700"
                    >
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleStartEdit(interaction)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteInteraction(interaction.id)}>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {editingId === interaction.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            rows={3}
                          />
                          <div className="flex justify-end">
                            <Button size="sm" onClick={() => handleSaveEdit(interaction)}>
                              <Save size={14} className="mr-1" /> Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p>{interaction.message}</p>
                          <div className="text-xs text-gray-500 flex justify-between mt-1">
                            <span>{format(new Date(interaction.created_at), "dd/MM/yyyy, HH:mm:ss")}</span>
                            {interaction.updated_at && (
                              <span className="text-gray-400 italic">
                                Última edição: {format(new Date(interaction.updated_at), "dd/MM/yyyy, HH:mm:ss")}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="proposals">
            <ProposalsTab
              leadId={lead.id}
              leadName={lead.lead_name}
              leadEmail={lead.lead_email}
              leadPhone={lead.phone}
              leadCompany={lead.company}
              leadValue={lead.value}
              proposals={lead.proposals || []}
              onAddProposal={onAddProposal}
              onUpdateProposal={onUpdateProposal}
              onDeleteProposal={onDeleteProposal}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <a
            href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              WhatsApp
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
